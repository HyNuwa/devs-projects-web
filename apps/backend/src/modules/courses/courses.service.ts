import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { databaseWrite } from '../../common/database-errors';
import {
  CreateCourseDto,
  CoursesQueryDto,
  LessonDto,
  SectionDto,
  UpdateCourseDto,
  UpdateLessonDto,
  UpdateSectionDto,
} from '../../common/validation/learning.dto';
import {
  AuthenticatedUser,
  hasPermissions,
} from '../authorization/permissions';

const summarySelect = {
  id: true,
  title: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  subject: { select: { id: true, name: true, code: true } },
} satisfies Prisma.CourseSelect;
const treeInclude = {
  sections: {
    orderBy: { position: 'asc' as const },
    include: {
      lessons: {
        orderBy: { position: 'asc' as const },
        include: { files: true },
      },
    },
  },
} satisfies Prisma.CourseInclude;

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}
  async list(query: CoursesQueryDto, management = false) {
    const where: Prisma.CourseWhereInput = {
      ...(management ? {} : { status: 'PUBLISHED' }),
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        select: { ...summarySelect, ...(management ? { status: true } : {}) },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.course.count({ where }),
    ]);
    return { items, total, page: query.page, limit: query.limit };
  }
  async summary(id: string) {
    const course = await this.prisma.course.findFirst({
      where: { id, status: 'PUBLISHED' },
      select: {
        ...summarySelect,
        sections: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            position: true,
            lessons: {
              orderBy: { position: 'asc' },
              select: { id: true, title: true, position: true },
            },
          },
        },
      },
    });
    if (!course) throw new NotFoundException('Curso no encontrado');
    return course;
  }
  async management(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: treeInclude,
    });
    if (!course) throw new NotFoundException('Curso no encontrado');
    return this.serialize(course);
  }
  async create(dto: CreateCourseDto, creatorId: number) {
    await this.assertSubject(dto.subjectId);
    return databaseWrite(() =>
      this.prisma.course.create({ data: { ...dto, creatorId } }),
    );
  }
  async update(id: string, dto: UpdateCourseDto) {
    await this.assertSubject(dto.subjectId);
    return this.mutate(id, (tx) =>
      tx.course.update({ where: { id }, data: dto }),
    );
  }
  transition(id: string, status: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT') {
    return this.mutate(id, async (tx) => {
      const course = await tx.course.findUniqueOrThrow({ where: { id } });
      if (course.status === status)
        throw new ConflictException('El curso ya tiene ese estado');
      if (status === 'PUBLISHED' && course.status !== 'DRAFT')
        throw new ConflictException('Primero devolvé el curso a borrador');
      return tx.course.update({ where: { id }, data: { status } });
    });
  }
  addSection(id: string, dto: SectionDto) {
    return this.mutate(id, (tx) =>
      tx.courseSection.create({ data: { ...dto, courseId: id } }),
    );
  }
  changeSection(id: string, sectionId: string, dto?: UpdateSectionDto) {
    return this.mutate(id, async (tx) => {
      await this.section(tx, id, sectionId);
      if (dto)
        return tx.courseSection.update({ where: { id: sectionId }, data: dto });
      await tx.courseSection.delete({ where: { id: sectionId } });
      return { deleted: true };
    });
  }
  addLesson(id: string, sectionId: string, dto: LessonDto) {
    return this.mutate(id, async (tx) => {
      await this.section(tx, id, sectionId);
      return tx.courseLesson.create({ data: { ...dto, sectionId } });
    });
  }
  changeLesson(id: string, lessonId: string, dto?: UpdateLessonDto) {
    return this.mutate(id, async (tx) => {
      await this.lessonIn(tx, id, lessonId);
      if (dto)
        return tx.courseLesson.update({ where: { id: lessonId }, data: dto });
      await tx.courseLesson.delete({ where: { id: lessonId } });
      return { deleted: true };
    });
  }
  enroll(id: string, userId: number) {
    return this.mutate(id, async (tx) => {
      if (!(await tx.course.findFirst({ where: { id, status: 'PUBLISHED' } })))
        throw new NotFoundException('Curso no encontrado');
      return tx.courseEnrollment.upsert({
        where: { courseId_userId: { courseId: id, userId } },
        create: { courseId: id, userId },
        update: { active: true },
      });
    });
  }
  unenroll(id: string, userId: number) {
    return this.mutate(id, async (tx) => {
      await tx.courseEnrollment.updateMany({
        where: { courseId: id, userId },
        data: { active: false },
      });
      return { active: false };
    });
  }
  setEnrollment(id: string, userId: number, active: boolean) {
    return this.mutate(id, (tx) =>
      tx.courseEnrollment.update({
        where: { courseId_userId: { courseId: id, userId } },
        data: { active },
      }),
    );
  }
  async lesson(id: string, lessonId: string, user: AuthenticatedUser) {
    await this.assertAccess(id, user);
    const lesson = await this.prisma.courseLesson.findFirst({
      where: { id: lessonId, section: { courseId: id } },
      select: {
        id: true,
        title: true,
        body: true,
        position: true,
        files: {
          where: { state: 'READY' },
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            size: true,
            allowDownload: true,
          },
        },
      },
    });
    if (!lesson) throw new NotFoundException('Clase no encontrada');
    return {
      ...lesson,
      files: lesson.files.map((file) => ({
        ...file,
        size: file.size.toString(),
      })),
    };
  }
  async assertAccess(id: string, user: AuthenticatedUser) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!course) throw new NotFoundException('Curso no encontrado');
    if (hasPermissions(user.role, ['courses:manage'])) return;
    const enrolled = await this.prisma.courseEnrollment.findUnique({
      where: { courseId_userId: { courseId: id, userId: user.id } },
    });
    if (course.status !== 'PUBLISHED' || !enrolled?.active)
      throw new NotFoundException('Contenido no encontrado');
  }
  async lessonIn(tx: Prisma.TransactionClient, id: string, lessonId: string) {
    const lesson = await tx.courseLesson.findFirst({
      where: { id: lessonId, section: { courseId: id } },
    });
    if (!lesson) throw new NotFoundException('Clase no encontrada');
    return lesson;
  }
  private async section(
    tx: Prisma.TransactionClient,
    id: string,
    sectionId: string,
  ) {
    const section = await tx.courseSection.findFirst({
      where: { id: sectionId, courseId: id },
    });
    if (!section) throw new NotFoundException('Sección no encontrada');
    return section;
  }
  async mutate<T>(
    id: string,
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return databaseWrite(() =>
      this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${id}, 0))`;
        if (
          !(await tx.course.findUnique({ where: { id }, select: { id: true } }))
        )
          throw new NotFoundException('Curso no encontrado');
        const result = await work(tx);
        await this.validatePublication(tx, id);
        return result;
      }),
    );
  }
  private async validatePublication(tx: Prisma.TransactionClient, id: string) {
    const course = await tx.course.findUniqueOrThrow({
      where: { id },
      include: treeInclude,
    });
    if (course.status !== 'PUBLISHED') return;
    if (
      !course.sections.length ||
      course.sections.some(
        (s) =>
          !s.lessons.length ||
          s.lessons.some(
            (l) => !l.body?.trim() && !l.files.some((f) => f.state === 'READY'),
          ),
      )
    ) {
      throw new BadRequestException(
        'Cada sección necesita clases y cada clase necesita texto o un archivo disponible',
      );
    }
  }
  private async assertSubject(subjectId?: string) {
    if (
      subjectId &&
      !(await this.prisma.subject.findUnique({ where: { id: subjectId } }))
    )
      throw new NotFoundException('Materia no encontrada');
  }
  private serialize<T>(data: T): T {
    return JSON.parse(
      JSON.stringify(data, (_key, value: unknown) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    ) as T;
  }
}
