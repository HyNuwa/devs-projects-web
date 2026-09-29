import { api } from '@/lib/api';
import type { ModerationTargetType } from '@/lib/report-client';

export type PublicationStatus = 'PUBLISHED' | 'PENDING_REVIEW' | 'REJECTED' | 'HIDDEN' | 'REMOVED';

export type Submission = {
  type: ModerationTargetType;
  id: string;
  title: string;
  subject: { id: string; code: string | null; name: string };
  isAnonymous: boolean;
  status: PublicationStatus;
  reason: string | null;
  statusChangedAt: string;
  createdAt: string;
  canResubmit: boolean;
};

export async function getMySubmissions(): Promise<Submission[]> {
  const response = await api.get<Submission[]>('/me/submissions');
  return response.data;
}

/** Returns a contribution rejected in revisión previa to review, optionally with a new file. */
export async function resubmit(
  type: ModerationTargetType,
  id: string,
  file?: File | null,
): Promise<void> {
  const path = `/me/submissions/${type}/${encodeURIComponent(id)}/resubmit`;
  if (file) {
    const body = new FormData();
    body.append('file', file);
    await api.post(path, body);
    return;
  }
  await api.post(path);
}
