import { api } from '@/lib/api';

export const communityReportReasons = [
  'SPAM_O_REPETIDO',
  'INSULTOS_O_ACOSO',
  'DATOS_PERSONALES',
  'NO_RELACIONADO',
  'POSIBLEMENTE_ENGANOSO',
  'OTRO',
] as const;

export type CommunityReportReason = (typeof communityReportReasons)[number];

export type CommunityReportTarget = 'course-review' | 'exam-experience';

export type CommunityReportInput = {
  explanation?: string;
  reason: CommunityReportReason;
};

const reportPathByTarget: Record<CommunityReportTarget, (id: string) => string> = {
  'course-review': (id) => `/subjects/reviews/${encodeURIComponent(id)}/reports`,
  'exam-experience': (id) => `/subjects/exams/${encodeURIComponent(id)}/reports`,
};

/** Submits a categorized report without making any visibility decision client-side. */
export async function createCommunityReport(
  target: CommunityReportTarget,
  id: string,
  input: CommunityReportInput,
): Promise<void> {
  await api.post(reportPathByTarget[target](id), input);
}
