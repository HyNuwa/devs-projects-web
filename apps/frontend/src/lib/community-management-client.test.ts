import { describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';

import {
  deleteCommunityEntry,
  getCommunityManagement,
  getCommunityModerationReports,
  moderateCommunityEntry,
} from './community-management-client';

vi.mock('@/lib/api', () => ({
  api: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('community management client', () => {
  it('keeps private management, permanent deletion, and moderation endpoints distinct', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] } as never);
    vi.mocked(api.delete).mockResolvedValue({ data: {} } as never);
    vi.mocked(api.post).mockResolvedValue({ data: {} } as never);

    await getCommunityManagement('course-review', 'review id');
    await getCommunityManagement('exam-experience', 'exam/id');
    await deleteCommunityEntry('course-review', 'review id');
    await deleteCommunityEntry('exam-experience', 'exam/id');
    await getCommunityModerationReports();
    await moderateCommunityEntry(
      'course-review',
      'review id',
      'remove',
      'Expone datos personales.',
    );
    await moderateCommunityEntry(
      'exam-experience',
      'exam/id',
      'restore',
      'La información ya fue corregida.',
    );

    expect(api.get).toHaveBeenNthCalledWith(1, '/subjects/reviews/review%20id/management');
    expect(api.get).toHaveBeenNthCalledWith(2, '/subjects/exams/exam%2Fid/management');
    expect(api.get).toHaveBeenNthCalledWith(3, '/subjects/community/reports');
    expect(api.delete).toHaveBeenNthCalledWith(1, '/subjects/reviews/review%20id');
    expect(api.delete).toHaveBeenNthCalledWith(2, '/subjects/exams/exam%2Fid');
    expect(api.post).toHaveBeenNthCalledWith(1, '/subjects/reviews/review%20id/moderation/remove', {
      reason: 'Expone datos personales.',
    });
    expect(api.post).toHaveBeenNthCalledWith(2, '/subjects/exams/exam%2Fid/moderation/restore', {
      reason: 'La información ya fue corregida.',
    });
  });
});
