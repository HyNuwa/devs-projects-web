import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseReviewDto } from './dto/create-course-review.dto';
import { CreateExamExperienceDto } from './dto/create-exam-experience.dto';
import { PointService } from '../ranking/point.service';

@Injectable()
export class SubjectsService {
  constructor(
    private prisma: PrismaService,
    private pointService: PointService,
    private configService: ConfigService,
  ) {}

  private courseReviewWriteData(dto: CreateCourseReviewDto) {
    return {
      academicYear: dto.academicYear,
      shift: dto.shift ?? ('NO_INDICO' as const),
      condition: dto.condition,
      attempt: dto.attempt,
      professorId: dto.professorId,
      professorName: dto.professorName,
      difficulty: dto.difficulty,
      recommendation: dto.recommendation,
      comment: dto.comment,
      isAnonymous: dto.isAnonymous ?? false,
    };
  }

  private examExperienceWriteData(dto: CreateExamExperienceDto) {
    return {
      shift: dto.shift,
      year: dto.year,
      session: dto.session,
      format: dto.format,
      examDate: dto.examDate,
      professorId: dto.professorId,
      examinerName: dto.examinerName,
      difficulty: dto.difficulty,
      outcome: dto.outcome,
      grade: dto.grade,
      comment: dto.comment,
      isAnonymous: dto.isAnonymous ?? false,
    };
  }

  private toPublicCommunityEntry<
    T extends {
      isAnonymous: boolean;
      user: {
        id: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
      };
    },
  >(entry: T) {
    const publicEntry: Record<string, unknown> = { ...entry };
    delete publicEntry.isRemoved;
    delete publicEntry.removedReason;
    delete publicEntry.removedAt;
    delete publicEntry.removedById;
    publicEntry.user = entry.isAnonymous ? { username: 'Anónimo' } : entry.user;

    return publicEntry;
  }

  private async findProbableCourseReviewDuplicate(
    subjectId: string,
    userId: string,
    dto: CreateCourseReviewDto,
  ) {
    const windowDays = this.configService.get<number>(
      'COMMUNITY_DUPLICATE_WINDOW_DAYS',
      180,
    );
    const createdAfter = new Date(
      Date.now() - windowDays * 24 * 60 * 60 * 1000,
    );

    return this.prisma.courseReview.findFirst({
      where: {
        userId,
        subjectId,
        academicYear: dto.academicYear,
        shift: dto.shift ?? 'NO_INDICO',
        condition: dto.condition,
        attempt: dto.attempt,
        professorId: dto.professorId ?? null,
        professorName: dto.professorName
          ? { equals: dto.professorName, mode: 'insensitive' }
          : null,
        createdAt: { gte: createdAfter },
      },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async assertProfessorContext(
    subjectId: string,
    professorId?: string,
    manualName?: string,
  ) {
    if (professorId && manualName) {
      throw new BadRequestException(
        'Indicá un profesor registrado o un nombre manual, no ambos',
      );
    }

    if (!professorId) {
      return;
    }

    const association = await this.prisma.subjectProfessor.findUnique({
      where: { subjectId_professorId: { subjectId, professorId } },
      select: { id: true },
    });

    if (!association) {
      throw new BadRequestException(
        'El profesor indicado no está asociado a la materia',
      );
    }
  }

  async findAll() {
    return this.prisma.subject.findMany({
      select: { id: true, code: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });
  }

  async findByCode(code: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { code },
      include: {
        studyPlans: {
          include: { studyPlan: { include: { career: true } } },
        },
        professors: { include: { professor: true } },
      },
    });

    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }

    const [reviewStats, examCount, materialCount] = await Promise.all([
      this.prisma.courseReview.aggregate({
        where: { subjectId: subject.id, isRemoved: false },
        _avg: { recommendation: true },
        _count: true,
      }),
      this.prisma.examExperience.count({
        where: { subjectId: subject.id, isRemoved: false },
      }),
      this.prisma.material.count({
        where: {
          subjectId: subject.id,
          moderationStatus: 'APPROVED',
          isDeleted: false,
        },
      }),
    ]);

    return {
      ...subject,
      stats: {
        avgRecommendation: reviewStats._avg.recommendation,
        reviewCount: reviewStats._count,
        examCount,
        materialCount,
      },
    };
  }

  async getReviews(code: string) {
    const subject = await this.findByCode(code);
    const reviews = await this.prisma.courseReview.findMany({
      where: { subjectId: subject.id, isRemoved: false },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const conditionBreakdown = await this.prisma.courseReview.groupBy({
      by: ['condition'],
      where: { subjectId: subject.id, isRemoved: false },
      _count: true,
    });

    return {
      reviews: reviews.map((review) => this.toPublicCommunityEntry(review)),
      conditionBreakdown,
    };
  }

  async createReview(code: string, userId: string, dto: CreateCourseReviewDto) {
    const subject = await this.findByCode(code);
    await this.assertProfessorContext(
      subject.id,
      dto.professorId,
      dto.professorName,
    );

    const probableDuplicate = await this.findProbableCourseReviewDuplicate(
      subject.id,
      userId,
      dto,
    );
    if (probableDuplicate && !dto.confirmProbableDuplicate) {
      throw new ConflictException({
        code: 'PROBABLE_DUPLICATE',
        message:
          'Ya publicaste una reseña reciente con este contexto. Confirmá si corresponde a otra cursada real.',
        probableDuplicate,
      });
    }

    const review = await this.prisma.courseReview.create({
      data: {
        userId,
        subjectId: subject.id,
        ...this.courseReviewWriteData(dto),
      },
    });

    await this.pointService.awardPoints(
      userId,
      5,
      'COURSE_REVIEWED',
      review.id,
    );

    return review;
  }

  async updateReview(
    reviewId: string,
    userId: string,
    dto: CreateCourseReviewDto,
  ) {
    const review = await this.prisma.courseReview.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true, subjectId: true },
    });

    if (!review) {
      throw new NotFoundException('Reseña no encontrada');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para editar esta reseña',
      );
    }

    await this.assertProfessorContext(
      review.subjectId,
      dto.professorId,
      dto.professorName,
    );

    return this.prisma.courseReview.update({
      where: { id: reviewId },
      data: this.courseReviewWriteData(dto),
    });
  }

  async deleteReview(reviewId: string, userId: string) {
    const review = await this.prisma.courseReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Reseña no encontrada');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta reseña',
      );
    }

    await this.prisma.courseReview.delete({ where: { id: reviewId } });
    return { message: 'Reseña eliminada' };
  }

  async getExams(code: string) {
    const subject = await this.findByCode(code);
    const exams = await this.prisma.examExperience.findMany({
      where: { subjectId: subject.id, isRemoved: false },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        professor: { select: { id: true, name: true } },
      },
    });

    return exams.map((exam) => this.toPublicCommunityEntry(exam));
  }

  async createExam(code: string, userId: string, dto: CreateExamExperienceDto) {
    const subject = await this.findByCode(code);
    await this.assertProfessorContext(
      subject.id,
      dto.professorId,
      dto.examinerName,
    );

    const exam = await this.prisma.examExperience.create({
      data: {
        userId,
        subjectId: subject.id,
        ...this.examExperienceWriteData(dto),
      },
    });

    await this.pointService.awardPoints(
      userId,
      5,
      'EXAM_EXPERIENCE_SHARED',
      exam.id,
    );

    return exam;
  }

  async updateExam(
    examId: string,
    userId: string,
    dto: CreateExamExperienceDto,
  ) {
    const exam = await this.prisma.examExperience.findUnique({
      where: { id: examId },
      select: { id: true, userId: true, subjectId: true },
    });

    if (!exam) {
      throw new NotFoundException('Experiencia de final no encontrada');
    }

    if (exam.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para editar esta experiencia',
      );
    }

    await this.assertProfessorContext(
      exam.subjectId,
      dto.professorId,
      dto.examinerName,
    );

    return this.prisma.examExperience.update({
      where: { id: examId },
      data: this.examExperienceWriteData(dto),
    });
  }

  async deleteExam(examId: string, userId: string) {
    const exam = await this.prisma.examExperience.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException('Experiencia de final no encontrada');
    }

    if (exam.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta experiencia',
      );
    }

    await this.prisma.examExperience.delete({ where: { id: examId } });
    return { message: 'Experiencia de final eliminada' };
  }
}
