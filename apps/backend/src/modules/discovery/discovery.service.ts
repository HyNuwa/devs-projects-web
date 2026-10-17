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
} from './dto/discovery-course-reviews.dto';
import {
  DEFAULT_DISCOVERY_EXAM_EXPERIENCE_LIMIT,
  DiscoveryExamExperienceListDto,
  DiscoveryExamExperiencesQueryDto,
} from './dto/discovery-exam-experiences.dto';
import { publicVisibility } from '../moderation/visibility';
import { facultySelect } from '../institutions/faculty-select';
import { SubjectExperiencesSummaryDto } from './dto/discovery-experiences-summary.dto';
import {
  DiscoveryExperiencesOverviewQueryDto,
  ExperiencesOverviewDto,
  type ExperiencesRecentEntry,
  MostCommentedWindow,
} from './dto/discovery-experiences-overview.dto';
import {
  approvalSummary,
  type GroupCount,
  MIN_MOST_COMMENTED,
  mostCommentedSince,
  promotionSummary,
  summarizeExams,
  summarizeReviews,
  topDifficulty,
} from './experiences-summary';
import {
  publicCourseReviewSelect,
  publicExamExperienceSelect,
  type PublicCourseReviewRow,
  type PublicExamExperienceRow,
  toDiscoveryCourseReviewDetail,
  toDiscoveryCourseReviewListItem,
  toDiscoveryExamExperienceDetail,
  toDiscoveryExamExperienceListItem,
} from './experience-items';
import {
  examSharedContext,
  relatedExamWhere,
  relatedReviewWhere,
  reviewSharedContext,
} from './experiences-related';
import {
  CourseReviewRelatedDto,
  ExamExperienceRelatedDto,
} from './dto/discovery-experiences-related.dto';
import type {
  CommunityDifficulty,
  CourseCondition,
  ExamOutcome,
} from '../../generated/prisma';

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

const publicCourseReviewWhere = (now = new Date()) =>
  publicVisibility(now) satisfies Prisma.CourseReviewWhereInput;

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

  private getExamExperienceOrderBy(): Prisma.ExamExperienceOrderByWithRelationInput[] {
    return [
      { examDate: { sort: 'desc', nulls: 'last' } },
      { createdAt: 'desc' },
      { id: 'asc' },
    ];
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
      ...(query.shift ? { shift: query.shift } : {}),
      ...(query.condition ? { condition: query.condition } : {}),
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
      data: reviews.map(toDiscoveryCourseReviewListItem),
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

    return toDiscoveryCourseReviewDetail(review);
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
      data: experiences.map(toDiscoveryExamExperienceListItem),
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

    return toDiscoveryExamExperienceDetail(experience);
  }

  async getSubjectExperiencesSummary(
    code: string,
  ): Promise<SubjectExperiencesSummaryDto> {
    const subject = await this.prisma.subject.findFirst({
      where: { code },
      select: { id: true, code: true, name: true },
    });
    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }

    const visibility = publicVisibility(new Date());
    const reviewWhere: Prisma.CourseReviewWhereInput = {
      subjectId: subject.id,
      ...visibility,
    };
    const examWhere: Prisma.ExamExperienceWhereInput = {
      subjectId: subject.id,
      ...visibility,
    };

    const [
      reviewCount,
      recommendation,
      conditionGroups,
      difficultyGroups,
      examCount,
      outcomeGroups,
      formatGroups,
      sessionGroups,
      examAverages,
      gradeAggregate,
    ] = await Promise.all([
      this.prisma.courseReview.count({ where: reviewWhere }),
      this.prisma.courseReview.aggregate({
        where: reviewWhere,
        _avg: { recommendation: true },
        _count: { recommendation: true },
      }),
      this.prisma.courseReview.groupBy({
        by: ['condition'],
        where: reviewWhere,
        _count: { _all: true },
      }),
      this.prisma.courseReview.groupBy({
        by: ['difficulty'],
        where: reviewWhere,
        _count: { _all: true },
      }),
      this.prisma.examExperience.count({ where: examWhere }),
      this.prisma.examExperience.groupBy({
        by: ['outcome'],
        where: examWhere,
        _count: { _all: true },
      }),
      this.prisma.examExperience.groupBy({
        by: ['format'],
        where: examWhere,
        _count: { _all: true },
      }),
      this.prisma.examExperience.groupBy({
        by: ['session'],
        where: examWhere,
        _count: { _all: true },
      }),
      this.prisma.examExperience.aggregate({
        where: examWhere,
        _avg: { difficultyTheory: true, difficultyPractice: true },
        _count: { difficultyTheory: true, difficultyPractice: true },
      }),
      // The nota promedio only counts finales with an explicit outcome.
      this.prisma.examExperience.aggregate({
        where: {
          ...examWhere,
          outcome: { in: ['APROBADO', 'DESAPROBADO'] },
        },
        _avg: { grade: true },
        _count: { grade: true },
      }),
    ]);

    return {
      subject,
      reviews: summarizeReviews({
        total: reviewCount,
        recommendationAverage: recommendation._avg.recommendation,
        recommendationCount: recommendation._count.recommendation,
        conditions: conditionGroups.map((row) => ({
          value: row.condition,
          count: row._count._all,
        })),
        difficulties: difficultyGroups.map((row) => ({
          value: row.difficulty,
          count: row._count._all,
        })),
      }),
      exams: summarizeExams({
        total: examCount,
        outcomes: outcomeGroups.map((row) => ({
          value: row.outcome,
          count: row._count._all,
        })),
        formats: formatGroups.map((row) => ({
          value: row.format,
          count: row._count._all,
        })),
        sessions: sessionGroups.map((row) => ({
          value: row.session,
          count: row._count._all,
        })),
        theory: {
          average: examAverages._avg.difficultyTheory,
          count: examAverages._count.difficultyTheory,
        },
        practice: {
          average: examAverages._avg.difficultyPractice,
          count: examAverages._count.difficultyPractice,
        },
        grade: {
          average: gradeAggregate._avg.grade,
          count: gradeAggregate._count.grade,
        },
      }),
    };
  }

  async getExperiencesOverview(
    query: DiscoveryExperiencesOverviewQueryDto,
  ): Promise<ExperiencesOverviewDto> {
    const now = new Date();
    const visibility = publicVisibility(now);
    const includeReviews = query.kind !== 'exams';
    const includeExams = query.kind !== 'reviews';

    // The scope narrows materias through their placements; a placement with a
    // null año (an optativa) never matches a `year` filter.
    const subjectScope: Prisma.SubjectWhereInput = {
      ...(query.facultyId ? { facultyId: query.facultyId } : {}),
      ...(query.careerId || query.year !== undefined
        ? {
            studyPlans: {
              some: {
                ...(query.year !== undefined ? { year: query.year } : {}),
                studyPlan: {
                  ...(query.careerId ? { careerId: query.careerId } : {}),
                  career: { status: 'PUBLISHED' },
                },
              },
            },
          }
        : {}),
    };
    const reviewWhere: Prisma.CourseReviewWhereInput = {
      ...visibility,
      subject: subjectScope,
    };
    const examWhere: Prisma.ExamExperienceWhereInput = {
      ...visibility,
      subject: subjectScope,
    };

    const countsBySubject = async (since?: Date) => {
      const createdAt = since ? { createdAt: { gte: since } } : {};
      const [reviewGroups, examGroups] = await Promise.all([
        includeReviews
          ? this.prisma.courseReview.groupBy({
              by: ['subjectId'],
              where: { ...reviewWhere, ...createdAt },
              _count: { _all: true },
            })
          : null,
        includeExams
          ? this.prisma.examExperience.groupBy({
              by: ['subjectId'],
              where: { ...examWhere, ...createdAt },
              _count: { _all: true },
            })
          : null,
      ]);
      const counts = new Map<string, number>();
      for (const row of [...(reviewGroups ?? []), ...(examGroups ?? [])]) {
        counts.set(
          row.subjectId,
          (counts.get(row.subjectId) ?? 0) + row._count._all,
        );
      }
      return counts;
    };

    const totalsBySubject = async (subjectIds: string[]) => {
      const [reviewGroups, examGroups] = await Promise.all([
        includeReviews
          ? this.prisma.courseReview.groupBy({
              by: ['subjectId'],
              where: { subjectId: { in: subjectIds }, ...visibility },
              _count: { _all: true },
            })
          : null,
        includeExams
          ? this.prisma.examExperience.groupBy({
              by: ['subjectId'],
              where: { subjectId: { in: subjectIds }, ...visibility },
              _count: { _all: true },
            })
          : null,
      ]);
      const counts = new Map<string, number>();
      for (const row of [...(reviewGroups ?? []), ...(examGroups ?? [])]) {
        counts.set(
          row.subjectId,
          (counts.get(row.subjectId) ?? 0) + row._count._all,
        );
      }
      return counts;
    };

    let window = MostCommentedWindow.LAST_120_DAYS;
    let recentCounts = await countsBySubject(mostCommentedSince(now));
    let candidateIds = [...recentCounts.entries()]
      .filter(([, count]) => count >= MIN_MOST_COMMENTED)
      .map(([subjectId]) => subjectId);

    let totals: Map<string, number>;
    if (candidateIds.length === 0) {
      // Nothing qualifies in the window: rank by all-time totals instead.
      window = MostCommentedWindow.ALL_TIME;
      recentCounts = await countsBySubject();
      candidateIds = [...recentCounts.keys()];
      totals = recentCounts;
    } else {
      totals = await totalsBySubject(candidateIds);
    }

    const candidates =
      candidateIds.length === 0
        ? []
        : await this.prisma.subject.findMany({
            where: { id: { in: candidateIds } },
            select: { id: true, name: true },
          });
    const candidatesById = new Map(candidates.map((s) => [s.id, s]));

    const ranked = candidateIds
      .map((id) => ({
        id,
        recent: recentCounts.get(id) ?? 0,
        total: totals.get(id) ?? 0,
      }))
      .sort(
        (a, b) =>
          b.recent - a.recent ||
          b.total - a.total ||
          (candidatesById.get(a.id)?.name ?? '').localeCompare(
            candidatesById.get(b.id)?.name ?? '',
            'es',
          ),
      )
      .slice(0, 6);

    const topIds = ranked.map((entry) => entry.id);
    const subjects =
      topIds.length === 0
        ? []
        : await this.prisma.subject.findMany({
            where: { id: { in: topIds } },
            select: {
              id: true,
              code: true,
              name: true,
              studyPlans: {
                select: {
                  year: true,
                  semester: true,
                  studyPlan: {
                    select: {
                      career: {
                        select: { id: true, name: true, status: true },
                      },
                    },
                  },
                },
              },
            },
          });
    const subjectsById = new Map(subjects.map((s) => [s.id, s]));

    const perSubjectWhere = { subjectId: { in: topIds }, ...visibility };
    const [
      conditionGroups,
      reviewDifficultyGroups,
      outcomeGroups,
      examDifficultyGroups,
      reviewLatest,
      examLatest,
      recentReviews,
      recentExams,
    ] = await Promise.all([
      includeReviews
        ? this.prisma.courseReview.groupBy({
            by: ['subjectId', 'condition'],
            where: perSubjectWhere,
            _count: { _all: true },
          })
        : null,
      includeReviews
        ? this.prisma.courseReview.groupBy({
            by: ['subjectId', 'difficulty'],
            where: perSubjectWhere,
            _count: { _all: true },
          })
        : null,
      includeExams
        ? this.prisma.examExperience.groupBy({
            by: ['subjectId', 'outcome'],
            where: perSubjectWhere,
            _count: { _all: true },
          })
        : null,
      includeExams
        ? this.prisma.examExperience.groupBy({
            by: ['subjectId', 'difficulty'],
            where: perSubjectWhere,
            _count: { _all: true },
          })
        : null,
      includeReviews
        ? this.prisma.courseReview.groupBy({
            by: ['subjectId'],
            where: perSubjectWhere,
            _max: { createdAt: true },
          })
        : null,
      includeExams
        ? this.prisma.examExperience.groupBy({
            by: ['subjectId'],
            where: perSubjectWhere,
            _max: { createdAt: true },
          })
        : null,
      includeReviews
        ? this.prisma.courseReview.findMany({
            where: reviewWhere,
            orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
            take: 6,
            select: publicCourseReviewSelect,
          })
        : Promise.resolve<PublicCourseReviewRow[]>([]),
      includeExams
        ? this.prisma.examExperience.findMany({
            where: examWhere,
            orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
            take: 6,
            select: publicExamExperienceSelect,
          })
        : Promise.resolve<PublicExamExperienceRow[]>([]),
    ]);

    const perSubject = <T extends string>(
      groups:
        | readonly ({ subjectId: string; _count: { _all: number } } & Record<
            string,
            unknown
          >)[]
        | null,
      field: string,
    ): Map<string, GroupCount<T>[]> => {
      const bySubject = new Map<string, GroupCount<T>[]>();
      for (const row of groups ?? []) {
        const list = bySubject.get(row.subjectId) ?? [];
        list.push({ value: row[field] as T | null, count: row._count._all });
        bySubject.set(row.subjectId, list);
      }
      return bySubject;
    };

    const conditionsBySubject = perSubject<CourseCondition>(
      conditionGroups,
      'condition',
    );
    const outcomesBySubject = perSubject<ExamOutcome>(outcomeGroups, 'outcome');
    const difficultiesBySubject = perSubject<CommunityDifficulty>(
      query.kind === 'exams' ? examDifficultyGroups : reviewDifficultyGroups,
      'difficulty',
    );

    const latestBySubject = new Map<string, Date>();
    for (const row of [...(reviewLatest ?? []), ...(examLatest ?? [])]) {
      const at = row._max.createdAt;
      if (!at) continue;
      const prev = latestBySubject.get(row.subjectId);
      if (!prev || at > prev) latestBySubject.set(row.subjectId, at);
    }

    const placementFor = (subject: (typeof subjects)[number]) => {
      const placements = subject.studyPlans
        .map((placement) => ({
          year: placement.year,
          semester: placement.semester,
          career: placement.studyPlan.career,
        }))
        // Carreras en borrador are not public yet (catalog-editing).
        .filter((placement) => placement.career.status === 'PUBLISHED')
        .sort((a, b) => a.career.name.localeCompare(b.career.name, 'es'));
      const chosen =
        (query.careerId
          ? placements.find((p) => p.career.id === query.careerId)
          : undefined) ?? placements[0];
      return chosen
        ? {
            careerId: chosen.career.id,
            careerName: chosen.career.name,
            year: chosen.year,
            semester: chosen.semester,
          }
        : null;
    };

    const recent: ExperiencesRecentEntry[] = [
      ...recentReviews.map((review) => ({
        createdAt: review.createdAt,
        entry: {
          kind: 'review' as const,
          review: toDiscoveryCourseReviewListItem(review),
        },
      })),
      ...recentExams.map((experience) => ({
        createdAt: experience.createdAt,
        entry: {
          kind: 'exam' as const,
          exam: toDiscoveryExamExperienceListItem(experience),
        },
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 6)
      .map(({ entry }) => entry);

    return {
      scope: {
        facultyId: query.facultyId ?? null,
        careerId: query.careerId ?? null,
        year: query.year ?? null,
        kind: query.kind ?? null,
      },
      mostCommented: {
        window,
        items: ranked.map((entry) => {
          const subject = subjectsById.get(entry.id)!;
          return {
            subject: {
              id: subject.id,
              code: subject.code,
              name: subject.name,
            },
            placement: placementFor(subject),
            total: entry.total,
            recentCount: entry.recent,
            latestAt: latestBySubject.get(entry.id)!,
            promotion: promotionSummary(
              conditionsBySubject.get(entry.id) ?? [],
            ),
            approval: approvalSummary(outcomesBySubject.get(entry.id) ?? []),
            topDifficulty: topDifficulty(
              difficultiesBySubject.get(entry.id) ?? [],
            ),
          };
        }),
      },
      recent,
    };
  }

  async getCourseReviewRelated(id: string): Promise<CourseReviewRelatedDto> {
    const now = new Date();
    const review = await this.prisma.courseReview.findFirst({
      where: { id, ...publicCourseReviewWhere(now) },
      select: {
        id: true,
        subjectId: true,
        professorId: true,
        professorName: true,
        shift: true,
        professor: { select: { id: true, name: true } },
      },
    });
    if (!review) {
      throw new NotFoundException('Reseña no encontrada');
    }

    const sharedContext = reviewSharedContext(review);
    const contextWhere = relatedReviewWhere(review);
    if (!sharedContext || !contextWhere) {
      return { sharedContext: null, items: [] };
    }

    const items = await this.prisma.courseReview.findMany({
      where: {
        subjectId: review.subjectId,
        id: { not: review.id },
        ...publicCourseReviewWhere(now),
        ...contextWhere,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: 3,
      select: publicCourseReviewSelect,
    });
    return {
      sharedContext,
      items: items.map(toDiscoveryCourseReviewListItem),
    };
  }

  async getExamExperienceRelated(
    id: string,
  ): Promise<ExamExperienceRelatedDto> {
    const now = new Date();
    const experience = await this.prisma.examExperience.findFirst({
      where: { id, ...publicExamExperienceWhere(now) },
      select: {
        id: true,
        subjectId: true,
        session: true,
        format: true,
      },
    });
    if (!experience) {
      throw new NotFoundException('Experiencia de final no encontrada');
    }

    const items = await this.prisma.examExperience.findMany({
      where: {
        subjectId: experience.subjectId,
        id: { not: experience.id },
        ...publicExamExperienceWhere(now),
        ...relatedExamWhere(experience),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: 3,
      select: publicExamExperienceSelect,
    });
    return {
      sharedContext: examSharedContext(experience),
      items: items.map(toDiscoveryExamExperienceListItem),
    };
  }
}
