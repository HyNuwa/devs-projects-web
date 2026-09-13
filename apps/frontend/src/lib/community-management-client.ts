import { api } from '@/lib/api';
import { getData } from '@/lib/apiHelpers';

export type CommunityEntryKind = 'course-review' | 'exam-experience';
export type CommunityModerationAction = 'remove' | 'restore';

export type CommunityManagementView = {
  type: 'COURSE_REVIEW' | 'EXAM_EXPERIENCE';
  id: string;
  subjectId: string;
  isAnonymous: boolean;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
  moderation: {
    isRemoved: boolean;
    reason: string | null;
    date: string | null;
  };
};

export type CommunityModerationReport = {
  id: string;
  reason:
    | 'SPAM_O_REPETIDO'
    | 'INSULTOS_O_ACOSO'
    | 'DATOS_PERSONALES'
    | 'NO_RELACIONADO'
    | 'POSIBLEMENTE_ENGANOSO'
    | 'OTRO';
  explanation: string | null;
  createdAt: string;
  target: CommunityManagementView & {
    subject: {
      id: string;
      code: string | null;
      name: string;
    };
  };
};

const managementPathByKind: Record<CommunityEntryKind, (id: string) => string> = {
  'course-review': (id) => `/subjects/reviews/${encodeURIComponent(id)}/management`,
  'exam-experience': (id) => `/subjects/exams/${encodeURIComponent(id)}/management`,
};

const deletePathByKind: Record<CommunityEntryKind, (id: string) => string> = {
  'course-review': (id) => `/subjects/reviews/${encodeURIComponent(id)}`,
  'exam-experience': (id) => `/subjects/exams/${encodeURIComponent(id)}`,
};

const moderationPathByKind: Record<
  CommunityEntryKind,
  (id: string, action: CommunityModerationAction) => string
> = {
  'course-review': (id, action) =>
    `/subjects/reviews/${encodeURIComponent(id)}/moderation/${action}`,
  'exam-experience': (id, action) =>
    `/subjects/exams/${encodeURIComponent(id)}/moderation/${action}`,
};

/**
 * Reads the private owner/moderator projection without changing public visibility. It runs in
 * the background on public detail pages, so a 401 must not redirect the visitor to login.
 */
export async function getCommunityManagement(
  kind: CommunityEntryKind,
  id: string,
): Promise<CommunityManagementView> {
  const response = await api.get<CommunityManagementView>(managementPathByKind[kind](id), {
    skipAuthRedirect: true,
  });
  return getData(response);
}

/** Permanently deletes only the authenticated author's own entry. */
export async function deleteCommunityEntry(kind: CommunityEntryKind, id: string): Promise<void> {
  await api.delete(deletePathByKind[kind](id));
}

/** Lists reports for the moderation workspace; the backend enforces the role boundary. */
export async function getCommunityModerationReports(): Promise<CommunityModerationReport[]> {
  const response = await api.get<CommunityModerationReport[]>('/subjects/community/reports');
  return getData(response);
}

/** Records a reversible moderation decision with an explicit reason. */
export async function moderateCommunityEntry(
  kind: CommunityEntryKind,
  id: string,
  action: CommunityModerationAction,
  reason: string,
): Promise<void> {
  await api.post(moderationPathByKind[kind](id, action), { reason });
}
