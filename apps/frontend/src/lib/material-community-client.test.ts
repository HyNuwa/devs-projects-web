import { describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';
import { getMaterialRatings } from './material-community-client';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('material community client', () => {
  it('reads ratings and comments from the public material endpoint', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        data: [],
        meta: { page: 1, limit: 8, total: 0, totalPages: 0 },
      },
    });

    await expect(getMaterialRatings('material/1', { limit: 8, page: 1 })).resolves.toMatchObject({
      data: [],
    });
    expect(api.get).toHaveBeenCalledWith('/materials/material%2F1/ratings', {
      params: { limit: 8, page: 1 },
    });
  });
});
