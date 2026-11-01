import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CareerDto,
  LinkStudyPlanDto,
  PageDto,
  StudyPlanDto,
  SubjectDto,
  UpdateSubjectDto,
} from '../../common/validation/learning.dto';
import { databaseWrite } from '../../common/database-errors';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}
  list({ page, limit }: PageDto) {
    return this.prisma.subject.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
  }
  async find(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        studyPlans: { include: { studyPlan: { include: { career: true } } } },
      },
    });
    if (!subject) throw new NotFoundException('Materia no encontrada');
    return subject;
  }
  create(dto: SubjectDto) {
    return this.prisma.subject.create({
      data: { ...dto, searchKey: this.searchKey(dto.name) },
    });
  }
  async update(id: string, dto: UpdateSubjectDto) {
    await this.find(id);
    return databaseWrite(() =>
      this.prisma.subject.update({
        where: { id },
        data: {
          ...dto,
          ...(dto.name === undefined
            ? {}
            : { searchKey: this.searchKey(dto.name) }),
        },
      }),
    );
  }
  async link(id: string, dto: LinkStudyPlanDto) {
    await this.find(id);
    if (
      !(await this.prisma.studyPlan.findUnique({
        where: { id: dto.studyPlanId },
      }))
    )
      throw new NotFoundException('Plan de estudio no encontrado');
    return databaseWrite(() =>
      this.prisma.studyPlanSubject.create({ data: { subjectId: id, ...dto } }),
    );
  }
  careers({ page, limit }: PageDto) {
    return this.prisma.career.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: 'asc' },
    });
  }
  plans({ page, limit }: PageDto) {
    return this.prisma.studyPlan.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: 'asc' },
      include: { career: true },
    });
  }
  createCareer(dto: CareerDto) {
    return databaseWrite(() => this.prisma.career.create({ data: dto }));
  }
  async createPlan(dto: StudyPlanDto) {
    if (!(await this.prisma.career.findUnique({ where: { id: dto.careerId } })))
      throw new NotFoundException('Carrera no encontrada');
    return databaseWrite(() => this.prisma.studyPlan.create({ data: dto }));
  }
  private searchKey(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}
