import { api } from '@/lib/api';
import type { ModerationTargetType, ReportReason } from '@/lib/report-client';
import type { PublicationStatus } from '@/lib/submissions-client';

export type ModerationDecision = 'KEEP_VISIBLE' | 'REMOVE' | 'RESTORE' | 'APPROVE' | 'REJECT';

export type QueueItem = {
  caseId: string;
  kind: 'REPORTS' | 'PRIOR_REVIEW';
  targetType: ModerationTargetType;
  targetId: string;
  label: string;
  subject: { id: string; code: string | null; name: string };
  isAnonymous: boolean;
  targetStatus: PublicationStatus;
  reportCount: number;
  topReason: ReportReason | null;
  highPriority: boolean;
  openedAt: string;
  overdueHidden: boolean;
};

export type ModerationQueue = {
  hidden: QueueItem[];
  priorReview: QueueItem[];
  reported: QueueItem[];
};

export type CaseAuthor =
  | { hidden: true }
  | {
      hidden: false;
      id: string;
      username: string;
      displayName: string | null;
      accountCreatedAt: string;
      publishedMaterials: number;
      removalsLast90Days: number;
    };

export type CaseDetail = {
  caseId: string;
  kind: 'REPORTS' | 'PRIOR_REVIEW';
  status: 'OPEN' | 'CLOSED';
  highPriority: boolean;
  openedAt: string;
  overdueHidden: boolean;
  target: {
    type: ModerationTargetType;
    id: string;
    status: PublicationStatus;
    label: string;
    subject: { id: string; code: string | null; name: string };
    isAnonymous: boolean;
    comment?: string | null;
    description?: string | null;
    fileType?: string;
    resourceType?: string;
  };
  reports: Array<{
    reason: ReportReason;
    explanation: string | null;
    createdAt: string;
    qualifiedReporter: boolean;
  }>;
  author: CaseAuthor;
  history: Array<{
    caseId: string;
    kind: string;
    decision: ModerationDecision | null;
    decisionReason: string | null;
    closedAt: string | null;
  }>;
  viewer: { canDecide: boolean; conflict: 'OWN_CONTENT' | 'REPORTED' | null };
};

export type HistoryItem = {
  id: string;
  createdAt: string;
  action: string;
  actor: { system: true } | { system: false; username: string | null; hidden?: boolean };
  target: { type: ModerationTargetType; id: string | null; label: string | null } | null;
  targetUser: { username: string | null } | null;
  caseId: string | null;
  reason: string | null;
};

export async function getModerationQueue(): Promise<ModerationQueue> {
  return (await api.get<ModerationQueue>('/moderation/cases')).data;
}

export async function getModerationCase(caseId: string): Promise<CaseDetail> {
  return (await api.get<CaseDetail>(`/moderation/cases/${encodeURIComponent(caseId)}`)).data;
}

export async function decideCase(
  caseId: string,
  decision: ModerationDecision,
  reason?: string,
): Promise<void> {
  await api.post(`/moderation/cases/${encodeURIComponent(caseId)}/decision`, {
    decision,
    ...(reason ? { reason } : {}),
  });
}

export async function revealCaseAuthor(caseId: string, reason: string) {
  return (
    await api.post<Exclude<CaseAuthor, { hidden: true }>>(
      `/moderation/cases/${encodeURIComponent(caseId)}/reveal-author`,
      { reason },
    )
  ).data;
}

export async function getModerationHistory(filters: Record<string, string> = {}) {
  return (
    await api.get<{ items: HistoryItem[]; nextCursor: string | null }>('/moderation/history', {
      params: filters,
    })
  ).data;
}

/** Downloads the caso's file with the moderator session, for an in-page preview. */
export async function getCaseFile(caseId: string): Promise<Blob> {
  return (
    await api.get<Blob>(`/moderation/cases/${encodeURIComponent(caseId)}/file`, {
      responseType: 'blob',
    })
  ).data;
}

/** The caso's file, including the staged copy of a material in revisión previa. */
export function caseFileUrl(caseId: string): string {
  const base = api.defaults.baseURL ?? '';
  return `${base}/moderation/cases/${encodeURIComponent(caseId)}/file`;
}
