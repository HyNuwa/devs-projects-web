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
import { PublicationPolicy } from '../moderation/publication-policy.service';
import { publicVisibility } from '../moderation/visibility';

// Current points for a reseña or experiencia; the points change will redefine them.
const COMMUNITY_ENTRY_POINTS = 5;

@Injectable()
export class SubjectsService {
  constructor(
    private prisma: PrismaService,
    private pointService: PointService,
    private configService: ConfigService,
    private publicationPolicy: PublicationPolicy,
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
    delete publicEntry.publicationStatus;
    delete publicEntry.statusChangedAt;
    delete publicEntry.hiddenAt;
    delete publicEntry.authorFacingReason;
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
        where: { subjectId: subject.id, ...publicVisibility(new Date()) },
        _avg: { recommendation: true },
        _count: true,
      }),
      this.prisma.examExperience.count({
        where: { subjectId: subject.id, ...publicVisibility(new Date()) },
      }),
      this.prisma.material.count({
        where: {
          subjectId: subject.id,
          isDeleted: false,
          ...publicVisibility(new Date()),
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
      where: { subjectId: subject.id, ...publicVisibility(new Date()) },
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
      where: { subjectId: subject.id, ...publicVisibility(new Date()) },
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

    const priorReview = await this.publicationPolicy.priorReviewFor(userId);
    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.courseReview.create({
        data: {
          userId,
          subjectId: subject.id,
          ...this.courseReviewWriteData(dto),
          publicationStatus: priorReview ? 'PENDING_REVIEW' : 'PUBLISHED',
        },
      });
      if (priorReview) {
        await this.publicationPolicy.openPriorReview(
          tx,
          { type: 'COURSE_REVIEW', id: created.id },
          userId,
          priorReview,
          'Reseña de cursada',
        );
      } else {
        await this.pointService.awardFor(tx, {
          userId,
          amount: COMMUNITY_ENTRY_POINTS,
          reason: 'COURSE_REVIEWED',
          referenceId: created.id,
        });
      }
      return created;
    });

    return priorReview
      ? { review, outcome: 'PENDING_REVIEW' as const, reason: priorReview }
      : { review, outcome: 'PUBLISHED' as const, reason: null };
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

  async resubmitReview(reviewId: string, userId: string) {
    const review = await this.prisma.courseReview.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true, publicationStatus: true },
    });
    this.assertResubmittable(review, userId);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.courseReview.update({
        where: { id: reviewId },
        data: {
          publicationStatus: 'PENDING_REVIEW',
          statusChangedAt: new Date(),
          authorFacingReason: null,
        },
      });
      await this.publicationPolicy.openPriorReview(
        tx,
        { type: 'COURSE_REVIEW', id: reviewId },
        userId,
        'RESUBMITTED',
        'Reseña de cursada',
        'RESUBMITTED',
      );
      return updated;
    });
  }

  async resubmitExam(examId: string, userId: string) {
    const exam = await this.prisma.examExperience.findUnique({
      where: { id: examId },
      select: { id: true, userId: true, publicationStatus: true },
    });
    this.assertResubmittable(exam, userId);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.examExperience.update({
        where: { id: examId },
        data: {
          publicationStatus: 'PENDING_REVIEW',
          statusChangedAt: new Date(),
          authorFacingReason: null,
        },
      });
      await this.publicationPolicy.openPriorReview(
        tx,
        { type: 'EXAM_EXPERIENCE', id: examId },
        userId,
        'RESUBMITTED',
        'Experiencia de final',
        'RESUBMITTED',
      );
      return updated;
    });
  }

  private assertResubmittable(
    entry: { userId: string; publicationStatus: string } | null,
    userId: string,
  ) {
    if (!entry) throw new NotFoundException('Publicación no encontrada');
    if (entry.userId !== userId) {
      throw new ForbiddenException(
        'Solo el autor puede reenviar esta publicación',
      );
    }
    if (entry.publicationStatus !== 'REJECTED') {
      throw new ConflictException(
        'Solo se pueden reenviar publicaciones rechazadas en revisión previa',
      );
    }
  }

  async getExams(code: string) {
    const subject = await this.findByCode(code);
    const exams = await this.prisma.examExperience.findMany({
      where: { subjectId: subject.id, ...publicVisibility(new Date()) },
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

    const priorReview = await this.publicationPolicy.priorReviewFor(userId);
    const exam = await this.prisma.$transaction(async (tx) => {
      const created = await tx.examExperience.create({
        data: {
          userId,
          subjectId: subject.id,
          ...this.examExperienceWriteData(dto),
          publicationStatus: priorReview ? 'PENDING_REVIEW' : 'PUBLISHED',
        },
      });
      if (priorReview) {
        await this.publicationPolicy.openPriorReview(
          tx,
          { type: 'EXAM_EXPERIENCE', id: created.id },
          userId,
          priorReview,
          'Experiencia de final',
        );
      } else {
        await this.pointService.awardFor(tx, {
          userId,
          amount: COMMUNITY_ENTRY_POINTS,
          reason: 'EXAM_EXPERIENCE_SHARED',
          referenceId: created.id,
        });
      }
      return created;
    });

    return priorReview
      ? { exam, outcome: 'PENDING_REVIEW' as const, reason: priorReview }
      : { exam, outcome: 'PUBLISHED' as const, reason: null };
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
