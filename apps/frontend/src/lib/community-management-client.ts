import { api } from '@/lib/api';
import { getData } from '@/lib/apiHelpers';

export type CommunityEntryKind = 'course-review' | 'exam-experience';

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
  /** Editable fields of the entry, in any publication status. */
  entry: Record<string, unknown>;
  moderation: {
    status: 'PUBLISHED' | 'PENDING_REVIEW' | 'REJECTED' | 'HIDDEN' | 'REMOVED';
    isRemoved: boolean;
    reason: string | null;
    date: string | null;
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

/**
 * Reads the author's private view (any publication status) without changing visibility. It runs in
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
