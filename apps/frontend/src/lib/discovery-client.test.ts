import { describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import {
  getGroupedSuggestions,
  getMaterialDiscovery,
  serializeGroupedSuggestionsQuery,
  serializeMaterialDiscoveryQuery,
} from './discovery-client';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

const subjectId = '20000000-0000-4000-8000-000000000001';
const professorId = '40000000-0000-4000-8000-000000000001';

describe('discovery client', () => {
  it('serializes the supported grouped-suggestion parameters', () => {
    const params = serializeGroupedSuggestionsQuery({
      q: '  Álgebra lineal  ',
      limit: 6,
    });

    expect(params.toString()).toBe('q=%C3%81lgebra+lineal&limit=6');
  });

  it('serializes every supported material-discovery parameter without extras', () => {
    const params = serializeMaterialDiscoveryQuery({
      subjectId,
      search: '  grafos  ',
      resourceType: 'GUIA_EJERCICIOS',
      academicYear: 2026,
      professorId,
      sort: 'RECENT',
      page: 2,
      limit: 20,
    });

    expect(params.toString()).toBe(
      `subjectId=${subjectId}&search=grafos&resourceType=GUIA_EJERCICIOS&academicYear=2026&professorId=${professorId}&sort=RECENT&page=2&limit=20`,
    );
    expect([...params.keys()]).toEqual([
      'subjectId',
      'search',
      'resourceType',
      'academicYear',
      'professorId',
      'sort',
      'page',
      'limit',
    ]);
  });

  it('rejects unsupported keys and values before a request is sent', () => {
    expect(() =>
      serializeMaterialDiscoveryQuery({
        search: 'grafos',
        resourceType: 'ARCHIVO' as never,
      }),
    ).toThrow();
    expect(() =>
      serializeGroupedSuggestionsQuery({
        q: 'grafos',
        moderationStatus: 'APPROVED',
      } as never),
    ).toThrow();
  });

  it('uses the typed public endpoints with serialized parameters', async () => {
    const get = vi.mocked(api.get);
    get
      .mockResolvedValueOnce({
        data: { subjects: [], materials: [] },
      })
      .mockResolvedValueOnce({
        data: {
          data: [],
          meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
        },
      });

    await expect(getGroupedSuggestions({ q: 'álgebra' })).resolves.toEqual({
      subjects: [],
      materials: [],
    });
    await expect(getMaterialDiscovery({ search: 'álgebra' })).resolves.toMatchObject({
      data: [],
    });

    expect(get).toHaveBeenNthCalledWith(
      1,
      '/discovery/suggestions',
      expect.objectContaining({
        params: expect.objectContaining({ toString: expect.any(Function) }),
      }),
    );
    expect((get.mock.calls[0]?.[1] as { params: URLSearchParams }).params.toString()).toBe(
      'q=%C3%A1lgebra',
    );
    expect(get).toHaveBeenNthCalledWith(
      2,
      '/materials',
      expect.objectContaining({
        params: expect.objectContaining({ toString: expect.any(Function) }),
      }),
    );
    expect((get.mock.calls[1]?.[1] as { params: URLSearchParams }).params.toString()).toBe(
      'search=%C3%A1lgebra',
    );
  });
});
