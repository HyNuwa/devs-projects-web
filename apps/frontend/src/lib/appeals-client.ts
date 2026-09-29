import { api } from '@/lib/api';
import type { SanctionType } from '@/lib/moderation-users-client';

export type AppealDecision =
  | { kind: 'RETIRO'; label: string | null; reason: string | null; decidedAt: string | null }
  | {
      kind: 'SANCTION';
      type: SanctionType | null;
      reason: string | null;
      decidedAt: string | null;
      endsAt: string | null;
      anonymousCase: boolean;
    };

export type AppealSummary = {
  id: string;
  kind: 'RETIRO' | 'SANCTION';
  createdAt: string;
  appellant: { hidden: boolean; username: string | null };
  decidedBy: { username: string | null };
  decision: AppealDecision;
};

export type AppealDetail = AppealSummary & {
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  explanation: string;
  answer: string | null;
  answeredAt: string | null;
  canAnswer: boolean;
  content: {
    caseId: string;
    type: string;
    label: string | null;
    comment: string | null;
    anonymous: boolean;
  } | null;
};

/** Pending appeals the signed-in moderator may answer. */
export async function getAppeals() {
  return (await api.get<AppealSummary[]>('/moderation/appeals')).data;
}

export async function getAppeal(appealId: string) {
  return (await api.get<AppealDetail>(`/moderation/appeals/${encodeURIComponent(appealId)}`)).data;
}

export async function answerAppeal(appealId: string, input: { accept: boolean; answer: string }) {
  await api.post(`/moderation/appeals/${encodeURIComponent(appealId)}/answer`, input);
}

/** An author or sanctioned account appeals its own retiro or sanción. */
export async function fileAppeal(
  input:
    | { kind: 'RETIRO'; caseId: string; explanation: string }
    | { kind: 'SANCTION'; sanctionId: string; explanation: string },
) {
  await api.post('/me/appeals', input);
}
