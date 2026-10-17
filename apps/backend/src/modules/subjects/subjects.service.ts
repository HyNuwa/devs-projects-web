import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveAlias } from '../catalog/slug-aliases';
import { CreateCourseReviewDto } from './dto/create-course-review.dto';
import { CreateExamExperienceDto } from './dto/create-exam-experience.dto';
import { ContributionPoints } from '../ranking/contribution-points';
import { PublicationPolicy } from '../moderation/publication-policy.service';
import { publicVisibility } from '../moderation/visibility';
import { facultySelect } from '../institutions/faculty-select';

const managementInclude = {
  user: {
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  },
} as const;

type ManagementRecord = Record<string, unknown> & {
  id: string;
  userId: string;
  subjectId: string;
  isAnonymous: boolean;
  publicationStatus: string;
  authorFacingReason: string | null;
  statusChangedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

// Only the author: moderators see anonymous authors through revelación de autor.
function toManagementView(
  type: 'COURSE_REVIEW' | 'EXAM_EXPERIENCE',
  entry: ManagementRecord,
  viewerId: string,
) {
  if (entry.userId !== viewerId) {
    throw new ForbiddenException('No tienes permisos para ver esta entrada');
  }
  const hasDecision = entry.publicationStatus !== 'PUBLISHED';
  const {
    userId: _userId,
    user: _user,
    publicationStatus: _status,
    authorFacingReason: _reason,
    statusChangedAt: _changedAt,
    hiddenAt: _hiddenAt,
    ...editable
  } = entry;
  return {
    type,
    id: entry.id,
    subjectId: entry.subjectId,
    isAnonymous: entry.isAnonymous,
    author: entry.user,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    entry: editable,
    moderation: {
      status: entry.publicationStatus,
      isRemoved: entry.publicationStatus === 'REMOVED',
      reason: hasDecision ? entry.authorFacingReason : null,
      date: hasDecision ? entry.statusChangedAt : null,
    },
  };
}

/**
 * Retired and hidden content stays: deleting it would erase its caso, so a retiro
 * would stop counting for the escalera and a hidden entry would escape its review.
 */
function assertNotUnderModeration(status: string) {
  if (status === 'REMOVED' || status === 'HIDDEN') {
    throw new ConflictException({
      code: 'MODERATED_CONTENT',
      message:
        status === 'REMOVED'
          ? 'Un aporte retirado no se puede borrar: queda en Mis envíos y lo podés apelar.'
          : 'No se puede borrar mientras moderación lo revisa.',
    });
  }
}

@Injectable()
export class SubjectsService {
  constructor(
    private prisma: PrismaService,
    private contributionPoints: ContributionPoints,
    private configService: ConfigService,
    private publicationPolicy: PublicationPolicy,
  ) {}

  /**
   * A published entry moved to another period gives back its points and earns
   * them again only if that period has no other entry with points.
   */
  private async reevaluatePeriod(
    tx: Prisma.TransactionClient,
    entry: {
      type: 'COURSE_REVIEW' | 'EXAM_EXPERIENCE';
      id: string;
      authorId: string;
      isAnonymous: boolean;
      publicationStatus: string;
    },
  ) {
    if (entry.publicationStatus !== 'PUBLISHED') return;
    await this.contributionPoints.withdrawn(tx, entry);
    await this.contributionPoints.published(tx, entry);
  }

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
        faculty: { select: facultySelect },
        studyPlans: {
          // Carreras en borrador are not public yet (catalog-editing).
          where: { studyPlan: { career: { status: 'PUBLISHED' } } },
          orderBy: [
            { studyPlan: { career: { name: 'asc' } } },
            { studyPlan: { name: 'asc' } },
            { year: 'asc' },
          ],
          include: {
            studyPlan: {
              include: {
                career: { include: { faculty: { select: facultySelect } } },
              },
            },
          },
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

  /** The current code of a materia whose old code is `code`, if any. */
  async renamedCode(code: string) {
    const exists = await this.prisma.subject.findFirst({
      where: { code },
      select: { id: true },
    });
    if (exists) return null;
    const id = await resolveAlias(this.prisma, 'SUBJECT', null, code);
    if (!id) return null;
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      select: { code: true },
    });
    return subject?.code ?? null;
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
        await this.contributionPoints.published(tx, {
          type: 'COURSE_REVIEW',
          id: created.id,
          authorId: userId,
          isAnonymous: created.isAnonymous,
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
      select: {
        id: true,
        userId: true,
        subjectId: true,
        academicYear: true,
        isAnonymous: true,
        publicationStatus: true,
      },
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

    const data = withoutAnonymity(this.courseReviewWriteData(dto));
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.courseReview.update({
        where: { id: reviewId },
        data,
      });
      // One reseña with points per materia and ciclo: moving it to another
      // ciclo re-evaluates its points there.
      if (data.academicYear !== review.academicYear) {
        await this.reevaluatePeriod(tx, {
          type: 'COURSE_REVIEW',
          id: reviewId,
          authorId: userId,
          isAnonymous: review.isAnonymous,
          publicationStatus: review.publicationStatus,
        });
      }
      return updated;
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

    assertNotUnderModeration(review.publicationStatus);
    await this.prisma.$transaction(async (tx) => {
      await this.contributionPoints.withdrawn(tx, {
        type: 'COURSE_REVIEW',
        id: reviewId,
        isAnonymous: review.isAnonymous,
      });
      await tx.courseReview.delete({ where: { id: reviewId } });
    });
    return { message: 'Reseña eliminada' };
  }

  /** Private view of a reseña for its author only (Mis envíos covers every status). */
  async getReviewManagementView(reviewId: string, viewerId: string) {
    const review = await this.prisma.courseReview.findUnique({
      where: { id: reviewId },
      include: managementInclude,
    });
    if (!review) throw new NotFoundException('Reseña no encontrada');
    return toManagementView('COURSE_REVIEW', review, viewerId);
  }

  async getExamManagementView(examId: string, viewerId: string) {
    const exam = await this.prisma.examExperience.findUnique({
      where: { id: examId },
      include: managementInclude,
    });
    if (!exam)
      throw new NotFoundException('Experiencia de final no encontrada');
    return toManagementView('EXAM_EXPERIENCE', exam, viewerId);
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
        await this.contributionPoints.published(tx, {
          type: 'EXAM_EXPERIENCE',
          id: created.id,
          authorId: userId,
          isAnonymous: created.isAnonymous,
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
      select: {
        id: true,
        userId: true,
        subjectId: true,
        session: true,
        year: true,
        isAnonymous: true,
        publicationStatus: true,
      },
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

    const data = withoutAnonymity(this.examExperienceWriteData(dto));
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.examExperience.update({
        where: { id: examId },
        data,
      });
      // One experiencia with points per materia, período de examen and year.
      if (data.session !== exam.session || data.year !== exam.year) {
        await this.reevaluatePeriod(tx, {
          type: 'EXAM_EXPERIENCE',
          id: examId,
          authorId: userId,
          isAnonymous: exam.isAnonymous,
          publicationStatus: exam.publicationStatus,
        });
      }
      return updated;
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

    assertNotUnderModeration(exam.publicationStatus);
    await this.prisma.$transaction(async (tx) => {
      await this.contributionPoints.withdrawn(tx, {
        type: 'EXAM_EXPERIENCE',
        id: examId,
        isAnonymous: exam.isAnonymous,
      });
      await tx.examExperience.delete({ where: { id: examId } });
    });
    return { message: 'Experiencia de final eliminada' };
  }
}

/**
 * Anonymity is chosen when publishing and never changes by editing: switching it
 * later would move the author's points at that moment and point at them.
 */
function withoutAnonymity<T extends { isAnonymous: boolean }>(data: T) {
  const { isAnonymous: _chosenAtPublishing, ...rest } = data;
  return rest;
}
