import { describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';

import { deleteCommunityEntry, getCommunityManagement } from './community-management-client';

vi.mock('@/lib/api', () => ({
  api: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('community management client', () => {
  it('keeps the private management view and permanent deletion endpoints distinct', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] } as never);
    vi.mocked(api.delete).mockResolvedValue({ data: {} } as never);
    vi.mocked(api.post).mockResolvedValue({ data: {} } as never);

    await getCommunityManagement('course-review', 'review id');
    await getCommunityManagement('exam-experience', 'exam/id');
    await deleteCommunityEntry('course-review', 'review id');
    await deleteCommunityEntry('exam-experience', 'exam/id');

    expect(api.get).toHaveBeenNthCalledWith(1, '/subjects/reviews/review%20id/management', {
      skipAuthRedirect: true,
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/subjects/exams/exam%2Fid/management', {
      skipAuthRedirect: true,
    });
    expect(api.delete).toHaveBeenNthCalledWith(1, '/subjects/reviews/review%20id');
    expect(api.delete).toHaveBeenNthCalledWith(2, '/subjects/exams/exam%2Fid');
  });
});
