import { describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import {
  getCourseReviewDiscovery,
  getExamExperienceDiscovery,
  getGroupedSuggestions,
  getMaterialDiscovery,
  getPublicMaterial,
  serializeCourseReviewDiscoveryQuery,
  serializeExamExperienceDiscoveryQuery,
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

  it('serializes the supported course-review discovery parameters', () => {
    const params = serializeCourseReviewDiscoveryQuery({
      subjectId,
      academicYear: 2026,
      professorId,
      difficulty: 'ALTA',
      attempt: 'PRIMERA_RECURSADA',
      sort: 'STARS_DESC',
      page: 3,
      limit: 12,
    });

    expect(params.toString()).toBe(
      `subjectId=${subjectId}&academicYear=2026&professorId=${professorId}&difficulty=ALTA&attempt=PRIMERA_RECURSADA&sort=STARS_DESC&page=3&limit=12`,
    );
  });

  it('serializes final-experience filters without accepting a grade sort', () => {
    const params = serializeExamExperienceDiscoveryQuery({
      subjectId,
      year: 2026,
      session: 'JULIO',
      professorId,
      format: 'ORAL',
      outcome: 'APROBADO',
      page: 3,
      limit: 12,
    });

    expect(params.toString()).toBe(
      `subjectId=${subjectId}&year=2026&session=JULIO&professorId=${professorId}&format=ORAL&outcome=APROBADO&page=3&limit=12`,
    );
    expect(() => serializeExamExperienceDiscoveryQuery({ sort: 'GRADE_DESC' } as never)).toThrow();
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
      })
      .mockResolvedValueOnce({
        data: {
          data: [],
          aggregate: { averageRecommendation: null, reviewCount: 0 },
          meta: { page: 1, limit: 2, total: 0, totalPages: 0 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [],
          meta: { page: 1, limit: 2, total: 0, totalPages: 0 },
        },
      })
      .mockResolvedValueOnce({
        data: { id: subjectId },
      });

    await expect(getGroupedSuggestions({ q: 'álgebra' })).resolves.toEqual({
      subjects: [],
      materials: [],
    });
    await expect(getMaterialDiscovery({ search: 'álgebra' })).resolves.toMatchObject({
      data: [],
    });
    await expect(getCourseReviewDiscovery({ limit: 2 })).resolves.toMatchObject({ data: [] });
    await expect(getExamExperienceDiscovery({ limit: 2 })).resolves.toMatchObject({ data: [] });
    await expect(getPublicMaterial(subjectId)).resolves.toEqual({ id: subjectId });

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
    expect(get).toHaveBeenNthCalledWith(
      3,
      '/discovery/course-reviews',
      expect.objectContaining({
        params: expect.objectContaining({ toString: expect.any(Function) }),
      }),
    );
    expect((get.mock.calls[2]?.[1] as { params: URLSearchParams }).params.toString()).toBe(
      'limit=2',
    );
    expect(get).toHaveBeenNthCalledWith(
      4,
      '/discovery/exam-experiences',
      expect.objectContaining({
        params: expect.objectContaining({ toString: expect.any(Function) }),
      }),
    );
    expect((get.mock.calls[3]?.[1] as { params: URLSearchParams }).params.toString()).toBe(
      'limit=2',
    );
    expect(get).toHaveBeenNthCalledWith(5, `/materials/${subjectId}`);
  });
});
