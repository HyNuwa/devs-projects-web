import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { normalizeSearchKey } from '../../common/search/search-key';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DEFAULT_DISCOVERY_SUGGESTION_LIMIT,
  DiscoverySuggestionsQueryDto,
} from './dto/discovery-suggestions-query.dto';
import { DiscoverySuggestionsResponseDto } from './dto/discovery-suggestions-response.dto';
import {
  DEFAULT_DISCOVERY_COURSE_REVIEW_LIMIT,
  DiscoveryCourseReviewListDto,
  DiscoveryCourseReviewsQueryDto,
  DiscoveryCourseReviewSort,
  MAX_DISCOVERY_COURSE_REVIEW_EXCERPT_LENGTH,
} from './dto/discovery-course-reviews.dto';
import {
  DEFAULT_DISCOVERY_EXAM_EXPERIENCE_LIMIT,
  DiscoveryExamExperienceListDto,
  DiscoveryExamExperiencesQueryDto,
  MAX_DISCOVERY_EXAM_EXPERIENCE_EXCERPT_LENGTH,
} from './dto/discovery-exam-experiences.dto';
import { publicVisibility } from '../moderation/visibility';
import { facultySelect } from '../institutions/faculty-select';

const subjectSuggestionSelect = {
  id: true,
  code: true,
  name: true,
  searchKey: true,
  faculty: { select: facultySelect },
} satisfies Prisma.SubjectSelect;

const materialSuggestionSelect = {
  id: true,
  title: true,
  searchKey: true,
  resourceType: true,
  subject: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
} satisfies Prisma.MaterialSelect;

const publicMaterialWhere = (now = new Date()) =>
  ({
    isDeleted: false,
    ...publicVisibility(now),
  }) satisfies Prisma.MaterialWhereInput;

const publicCourseReviewSelect = {
  id: true,
  academicYear: true,
  shift: true,
  condition: true,
  attempt: true,
  difficulty: true,
  recommendation: true,
  professorName: true,
  comment: true,
  isAnonymous: true,
  createdAt: true,
  updatedAt: true,
  subject: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  professor: {
    select: {
      id: true,
      name: true,
    },
  },
  user: {
    select: {
      username: true,
    },
  },
} satisfies Prisma.CourseReviewSelect;

const publicCourseReviewWhere = (now = new Date()) =>
  publicVisibility(now) satisfies Prisma.CourseReviewWhereInput;

const publicExamExperienceSelect = {
  id: true,
  year: true,
  session: true,
  format: true,
  examDate: true,
  shift: true,
  examinerName: true,
  difficulty: true,
  outcome: true,
  comment: true,
  isAnonymous: true,
  createdAt: true,
  updatedAt: true,
  subject: { select: { id: true, code: true, name: true } },
  professor: { select: { id: true, name: true } },
  user: { select: { username: true } },
} satisfies Prisma.ExamExperienceSelect;

const publicExamExperienceWhere = (now = new Date()) =>
  publicVisibility(now) satisfies Prisma.ExamExperienceWhereInput;

const publicCourseReviewDetailSelect = publicCourseReviewSelect;

const publicExamExperienceDetailSelect = publicExamExperienceSelect;

@Injectable()
export class DiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

  private getCourseReviewOrderBy(
    sort: DiscoveryCourseReviewSort | undefined,
  ): Prisma.CourseReviewOrderByWithRelationInput[] {
    switch (sort) {
      case DiscoveryCourseReviewSort.STARS_ASC:
        return [
          { recommendation: 'asc' },
          { createdAt: 'desc' },
          { id: 'asc' },
        ];
      case DiscoveryCourseReviewSort.STARS_DESC:
        return [
          { recommendation: 'desc' },
          { createdAt: 'desc' },
          { id: 'asc' },
        ];
      case DiscoveryCourseReviewSort.RECENT:
      default:
        return [{ createdAt: 'desc' }, { id: 'asc' }];
    }
  }

  private truncateCourseReviewExcerpt(comment: string | null): string | null {
    if (
      !comment ||
      comment.length <= MAX_DISCOVERY_COURSE_REVIEW_EXCERPT_LENGTH
    ) {
      return comment;
    }

    return `${comment.slice(0, MAX_DISCOVERY_COURSE_REVIEW_EXCERPT_LENGTH)}…`;
  }

  private getExamExperienceOrderBy(): Prisma.ExamExperienceOrderByWithRelationInput[] {
    return [
      { examDate: { sort: 'desc', nulls: 'last' } },
      { createdAt: 'desc' },
      { id: 'asc' },
    ];
  }

  private truncateExamExperienceExcerpt(comment: string | null): string | null {
    if (
      !comment ||
      comment.length <= MAX_DISCOVERY_EXAM_EXPERIENCE_EXCERPT_LENGTH
    ) {
      return comment;
    }

    return `${comment.slice(0, MAX_DISCOVERY_EXAM_EXPERIENCE_EXCERPT_LENGTH)}…`;
  }

  async getSuggestions(
    query: DiscoverySuggestionsQueryDto,
  ): Promise<DiscoverySuggestionsResponseDto> {
    const normalizedQuery = normalizeSearchKey(query.q);
    const limit = query.limit ?? DEFAULT_DISCOVERY_SUGGESTION_LIMIT;

    const [subjects, materials] = await Promise.all([
      this.prisma.subject.findMany({
        where: {
          searchKey: { contains: normalizedQuery },
          ...(query.facultyId ? { facultyId: query.facultyId } : {}),
        },
        orderBy: [{ searchKey: 'asc' }, { id: 'asc' }],
        take: limit,
        select: subjectSuggestionSelect,
      }),
      this.prisma.material.findMany({
        where: {
          searchKey: { contains: normalizedQuery },
          ...publicMaterialWhere(),
          ...(query.facultyId
            ? { subject: { facultyId: query.facultyId } }
            : {}),
        },
        orderBy: [{ searchKey: 'asc' }, { id: 'asc' }],
        take: limit,
        select: materialSuggestionSelect,
      }),
    ]);

    return {
      subjects: subjects
        .filter((subject) => subject.searchKey.includes(normalizedQuery))
        .map(({ searchKey: _searchKey, ...subject }) => ({
          kind: 'SUBJECT' as const,
          ...subject,
        })),
      materials: materials
        .filter((material) => material.searchKey.includes(normalizedQuery))
        .map(({ searchKey: _searchKey, ...material }) => ({
          kind: 'MATERIAL' as const,
          ...material,
        })),
    };
  }

  async getCourseReviews(
    query: DiscoveryCourseReviewsQueryDto,
  ): Promise<DiscoveryCourseReviewListDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_DISCOVERY_COURSE_REVIEW_LIMIT;
    const where: Prisma.CourseReviewWhereInput = {
      ...publicCourseReviewWhere(),
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      ...(query.academicYear ? { academicYear: query.academicYear } : {}),
      ...(query.professorId ? { professorId: query.professorId } : {}),
      ...(query.difficulty ? { difficulty: query.difficulty } : {}),
      ...(query.attempt ? { attempt: query.attempt } : {}),
    };
    const [reviews, total, aggregate] = await this.prisma.$transaction([
      this.prisma.courseReview.findMany({
        where,
        orderBy: this.getCourseReviewOrderBy(query.sort),
        skip: (page - 1) * limit,
        take: limit,
        select: publicCourseReviewSelect,
      }),
      this.prisma.courseReview.count({ where }),
      this.prisma.courseReview.aggregate({
        where,
        _avg: { recommendation: true },
        _count: true,
      }),
    ]);

    return {
      data: reviews.map((review) => ({
        id: review.id,
        subject: {
          ...review.subject,
          href: `/materias/${review.subject.code ?? review.subject.id}`,
        },
        author: {
          username: review.isAnonymous ? 'Anónimo' : review.user.username,
        },
        academicYear: review.academicYear,
        shift: review.shift,
        condition: review.condition,
        attempt: review.attempt,
        difficulty: review.difficulty,
        recommendation: review.recommendation,
        professor: review.professor,
        professorName: review.professorName,
        excerpt: this.truncateCourseReviewExcerpt(review.comment),
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
      aggregate: {
        averageRecommendation: aggregate._avg.recommendation,
        reviewCount: aggregate._count,
      },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCourseReviewDetail(id: string) {
    const review = await this.prisma.courseReview.findFirst({
      where: { id, ...publicCourseReviewWhere() },
      select: publicCourseReviewDetailSelect,
    });
    if (!review) {
      throw new NotFoundException('Reseña no encontrada');
    }

    return {
      id: review.id,
      subject: {
        ...review.subject,
        href: `/materias/${review.subject.code ?? review.subject.id}`,
      },
      author: {
        username: review.isAnonymous ? 'Anónimo' : review.user.username,
      },
      academicYear: review.academicYear,
      shift: review.shift,
      condition: review.condition,
      attempt: review.attempt,
      difficulty: review.difficulty,
      recommendation: review.recommendation,
      professor: review.professor,
      professorName: review.professorName,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  async getExamExperiences(
    query: DiscoveryExamExperiencesQueryDto,
  ): Promise<DiscoveryExamExperienceListDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_DISCOVERY_EXAM_EXPERIENCE_LIMIT;
    const where: Prisma.ExamExperienceWhereInput = {
      ...publicExamExperienceWhere(),
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      ...(query.year ? { year: query.year } : {}),
      ...(query.session ? { session: query.session } : {}),
      ...(query.professorId ? { professorId: query.professorId } : {}),
      ...(query.format ? { format: query.format } : {}),
      ...(query.outcome ? { outcome: query.outcome } : {}),
    };
    const [experiences, total] = await this.prisma.$transaction([
      this.prisma.examExperience.findMany({
        where,
        orderBy: this.getExamExperienceOrderBy(),
        skip: (page - 1) * limit,
        take: limit,
        select: publicExamExperienceSelect,
      }),
      this.prisma.examExperience.count({ where }),
    ]);

    return {
      data: experiences.map((experience) => {
        const excerpt = this.truncateExamExperienceExcerpt(experience.comment);
        return {
          id: experience.id,
          subject: {
            ...experience.subject,
            href: `/materias/${experience.subject.code ?? experience.subject.id}`,
          },
          author: {
            username: experience.isAnonymous
              ? 'Anónimo'
              : experience.user.username,
          },
          year: experience.year,
          session: experience.session,
          format: experience.format,
          ...(experience.examDate ? { examDate: experience.examDate } : {}),
          ...(experience.shift ? { shift: experience.shift } : {}),
          ...(experience.professor ? { professor: experience.professor } : {}),
          ...(experience.examinerName
            ? { examinerName: experience.examinerName }
            : {}),
          ...(experience.difficulty
            ? { difficulty: experience.difficulty }
            : {}),
          ...(experience.outcome ? { outcome: experience.outcome } : {}),
          ...(excerpt ? { excerpt } : {}),
          createdAt: experience.createdAt,
          updatedAt: experience.updatedAt,
        };
      }),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getExamExperienceDetail(id: string) {
    const experience = await this.prisma.examExperience.findFirst({
      where: { id, ...publicExamExperienceWhere() },
      select: publicExamExperienceDetailSelect,
    });
    if (!experience) {
      throw new NotFoundException('Experiencia de final no encontrada');
    }

    return {
      id: experience.id,
      subject: {
        ...experience.subject,
        href: `/materias/${experience.subject.code ?? experience.subject.id}`,
      },
      author: {
        username: experience.isAnonymous ? 'Anónimo' : experience.user.username,
      },
      year: experience.year,
      session: experience.session,
      format: experience.format,
      ...(experience.examDate ? { examDate: experience.examDate } : {}),
      ...(experience.shift ? { shift: experience.shift } : {}),
      ...(experience.professor ? { professor: experience.professor } : {}),
      ...(experience.examinerName
        ? { examinerName: experience.examinerName }
        : {}),
      ...(experience.difficulty ? { difficulty: experience.difficulty } : {}),
      ...(experience.outcome ? { outcome: experience.outcome } : {}),
      comment: experience.comment,
      createdAt: experience.createdAt,
      updatedAt: experience.updatedAt,
    };
  }
}
