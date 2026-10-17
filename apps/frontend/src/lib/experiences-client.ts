import { z } from 'zod';

import { api } from '@/lib/api';
import { getData } from '@/lib/apiHelpers';

export const shifts = ['MANANA', 'TARDE', 'NOCHE', 'NO_INDICO'] as const;
export const courseConditions = ['PROMO', 'REGULAR', 'LIBRE', 'PREFIERO_NO_RESPONDER'] as const;
export const communityDifficulties = ['MUY_BAJA', 'BAJA', 'MEDIA', 'ALTA', 'MUY_ALTA'] as const;
export const examSessions = [
  'DICIEMBRE',
  'JULIO',
  'MARZO',
  'FEBRERO_MARZO',
  'ESPECIAL',
  'NO_RECUERDO',
] as const;
export const examFormats = ['ESCRITO', 'ORAL', 'MIXTO'] as const;
export const examOutcomes = ['APROBADO', 'DESAPROBADO', 'PREFIERO_NO_DECIR'] as const;
export const experiencesOverviewKinds = ['reviews', 'exams'] as const;

/** Anonymous entries carry only `username`; every identity field stays undefined. */
export const discoveryPublicAuthorSchema = z.object({
  id: z.string().optional(),
  username: z.string(),
  avatarUrl: z.string().nullable().optional(),
  avatarCat: z.string().nullable().optional(),
});

export const discoverySubjectLinkSchema = z.object({
  id: z.string(),
  code: z.string().nullable(),
  name: z.string(),
  href: z.string(),
});

/** Mirrors the `GET /discovery/course-reviews` list item. */
export const discoveryCourseReviewSchema = z.object({
  id: z.string(),
  subject: discoverySubjectLinkSchema,
  author: discoveryPublicAuthorSchema,
  academicYear: z.number().nullable(),
  shift: z.enum(shifts),
  condition: z.enum(courseConditions),
  attempt: z
    .enum([
      'PRIMERA_CURSADA',
      'PRIMERA_RECURSADA',
      'SEGUNDA_O_MAS_RECURSADAS',
      'PREFIERO_NO_RESPONDER',
    ])
    .nullable(),
  difficulty: z.enum(communityDifficulties).nullable(),
  recommendation: z.number(),
  professor: z.object({ id: z.string(), name: z.string() }).nullable(),
  professorName: z.string().nullable(),
  excerpt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Mirrors the `GET /discovery/exam-experiences` list item. */
export const discoveryExamExperienceSchema = z.object({
  id: z.string(),
  subject: discoverySubjectLinkSchema,
  author: discoveryPublicAuthorSchema,
  year: z.number(),
  session: z.enum(examSessions),
  format: z.enum(examFormats),
  examDate: z.string().optional(),
  shift: z.enum(shifts).optional(),
  professor: z.object({ id: z.string(), name: z.string() }).optional(),
  examinerName: z.string().optional(),
  difficulty: z.enum(communityDifficulties).optional(),
  outcome: z.enum(examOutcomes).optional(),
  grade: z.number().min(0).max(10).optional(),
  excerpt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const experiencesOverviewQuerySchema = z
  .object({
    facultyId: z.string().uuid().optional(),
    careerId: z.string().uuid().optional(),
    year: z.number().int().min(1).max(10).optional(),
    kind: z.enum(experiencesOverviewKinds).optional(),
  })
  .strict();

const percentageSummarySchema = z.object({
  percent: z.number().nullable(),
  promoted: z.number().optional(),
  approved: z.number().optional(),
  answered: z.number(),
});

export const experiencesOverviewSchema = z.object({
  scope: z.object({
    facultyId: z.string().nullable(),
    careerId: z.string().nullable(),
    year: z.number().nullable(),
    kind: z.enum(experiencesOverviewKinds).nullable(),
  }),
  mostCommented: z.object({
    window: z.enum(['LAST_120_DAYS', 'ALL_TIME']),
    items: z.array(
      z.object({
        subject: z.object({
          id: z.string(),
          code: z.string().nullable(),
          name: z.string(),
        }),
        placement: z
          .object({
            careerId: z.string(),
            careerName: z.string(),
            year: z.number().nullable(),
            semester: z.number().nullable(),
          })
          .nullable(),
        recentCount: z.number(),
        total: z.number(),
        latestAt: z.string().nullable(),
        promotion: percentageSummarySchema,
        approval: percentageSummarySchema,
        topDifficulty: z.enum(communityDifficulties).nullable(),
      }),
    ),
  }),
  recent: z.array(
    z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('review'), review: discoveryCourseReviewSchema }),
      z.object({ kind: z.literal('exam'), exam: discoveryExamExperienceSchema }),
    ]),
  ),
});

const countByEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.record(z.enum(values), z.number());

const averageSchema = z.object({ average: z.number().nullable(), count: z.number() });

/** Mirrors `GET /discovery/subjects/:code/experiences-summary`. */
export const subjectExperiencesSummarySchema = z.object({
  subject: z.object({
    id: z.string(),
    code: z.string().nullable(),
    name: z.string(),
  }),
  reviews: z.object({
    count: z.number(),
    recommendation: averageSchema,
    results: z.object({
      answered: z.number(),
      unanswered: z.number(),
      promo: z.number(),
      regular: z.number(),
      libre: z.number(),
      percents: z.object({ promo: z.number(), regular: z.number(), libre: z.number() }).nullable(),
    }),
    difficulty: z.object({
      answered: z.number(),
      unanswered: z.number(),
      counts: countByEnum(communityDifficulties),
      top: z.enum(communityDifficulties).nullable(),
    }),
  }),
  exams: z.object({
    count: z.number(),
    outcomes: z.object({
      answered: z.number(),
      undeclared: z.number(),
      aprobado: z.number(),
      desaprobado: z.number(),
      percent: z.number().nullable(),
    }),
    formats: z.object({
      counts: countByEnum(examFormats),
      top: z.enum(examFormats).nullable(),
    }),
    theory: averageSchema,
    practice: averageSchema,
    topSession: z.object({ session: z.enum(examSessions), count: z.number() }).nullable(),
    grade: averageSchema,
  }),
});

export const courseReviewRelatedSchema = z.object({
  sharedContext: z
    .object({
      professor: z.object({ id: z.string().optional(), name: z.string() }).optional(),
      shift: z.enum(shifts).optional(),
    })
    .nullable(),
  items: z.array(discoveryCourseReviewSchema),
});

export const examExperienceRelatedSchema = z.object({
  sharedContext: z.object({
    session: z.enum(examSessions).optional(),
    format: z.enum(examFormats),
  }),
  items: z.array(discoveryExamExperienceSchema),
});

export type ExperiencesOverviewQuery = z.input<typeof experiencesOverviewQuerySchema>;
export type ExperiencesOverview = z.infer<typeof experiencesOverviewSchema>;
export type ExperienceRecentEntry = ExperiencesOverview['recent'][number];
export type SubjectExperiencesSummary = z.infer<typeof subjectExperiencesSummarySchema>;
export type CourseReviewRelated = z.infer<typeof courseReviewRelatedSchema>;
export type ExamExperienceRelated = z.infer<typeof examExperienceRelatedSchema>;

function toSearchParams(
  entries: ReadonlyArray<readonly [string, string | number | undefined]>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value !== undefined) params.set(key, String(value));
  }
  return params;
}

export function serializeExperiencesOverviewQuery(
  input: ExperiencesOverviewQuery,
): URLSearchParams {
  const query = experiencesOverviewQuerySchema.parse(input);
  return toSearchParams([
    ['facultyId', query.facultyId],
    ['careerId', query.careerId],
    ['year', query.year],
    ['kind', query.kind],
  ]);
}

/** The landing's combined read (openspec academic-community/experiences). */
export async function getExperiencesOverview(
  query: ExperiencesOverviewQuery,
): Promise<ExperiencesOverview> {
  const response = await api.get('/discovery/experiences/overview', {
    params: serializeExperiencesOverviewQuery(query),
    skipAuthRedirect: true,
  });
  return experiencesOverviewSchema.parse(getData(response));
}

export async function getSubjectExperiencesSummary(
  code: string,
): Promise<SubjectExperiencesSummary> {
  const response = await api.get(
    `/discovery/subjects/${encodeURIComponent(code)}/experiences-summary`,
    { skipAuthRedirect: true },
  );
  return subjectExperiencesSummarySchema.parse(getData(response));
}

export async function getCourseReviewRelated(id: string): Promise<CourseReviewRelated> {
  const response = await api.get(`/discovery/course-reviews/${encodeURIComponent(id)}/related`, {
    skipAuthRedirect: true,
  });
  return courseReviewRelatedSchema.parse(getData(response));
}

export async function getExamExperienceRelated(id: string): Promise<ExamExperienceRelated> {
  const response = await api.get(`/discovery/exam-experiences/${encodeURIComponent(id)}/related`, {
    skipAuthRedirect: true,
  });
  return examExperienceRelatedSchema.parse(getData(response));
}
