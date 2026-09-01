import { describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';

import { createCommunityReport } from './community-report-client';

vi.mock('@/lib/api', () => ({ api: { post: vi.fn() } }));

describe('community report client', () => {
  it('routes each public entry type to its authenticated report endpoint', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 'report-1' } });

    await createCommunityReport('course-review', 'review id', { reason: 'SPAM_O_REPETIDO' });
    await createCommunityReport('exam-experience', 'exam/id', {
      explanation: 'Tiene información que no corresponde.',
      reason: 'OTRO',
    });

    expect(api.post).toHaveBeenNthCalledWith(1, '/subjects/reviews/review%20id/reports', {
      reason: 'SPAM_O_REPETIDO',
    });
    expect(api.post).toHaveBeenNthCalledWith(2, '/subjects/exams/exam%2Fid/reports', {
      explanation: 'Tiene información que no corresponde.',
      reason: 'OTRO',
    });
  });
});
