import { describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';
import {
  getMaterialViewerState,
  setMaterialHelpfulness,
  setMaterialSaved,
} from './material-viewer-client';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('material viewer client', () => {
  it('uses the authenticated viewer-state endpoint', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { isHelpful: true, isSaved: false } });

    await expect(getMaterialViewerState('material/1')).resolves.toEqual({
      isHelpful: true,
      isSaved: false,
    });
    expect(api.get).toHaveBeenCalledWith('/materials/material%2F1/viewer-state', {
      skipAuthRedirect: true,
    });
  });

  it('writes the idempotent helpfulness and saved state endpoints', async () => {
    vi.mocked(api.put)
      .mockResolvedValueOnce({ data: { isHelpful: true, isSaved: false, helpfulCount: 8 } })
      .mockResolvedValueOnce({ data: { isHelpful: true, isSaved: true } });

    await expect(setMaterialHelpfulness('material-2', true)).resolves.toMatchObject({
      isHelpful: true,
      helpfulCount: 8,
    });
    await expect(setMaterialSaved('material-2', true)).resolves.toEqual({
      isHelpful: true,
      isSaved: true,
    });

    expect(api.put).toHaveBeenNthCalledWith(1, '/materials/material-2/helpfulness', {
      isHelpful: true,
    });
    expect(api.put).toHaveBeenNthCalledWith(2, '/materials/material-2/saved', { isSaved: true });
  });
});
