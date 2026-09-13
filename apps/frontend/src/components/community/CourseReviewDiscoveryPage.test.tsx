import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';
import { getCourseReviewDiscovery } from '@/lib/discovery-client';
import type { DiscoveryCourseReview, DiscoveryCourseReviewList } from '@/types/discovery';

import { CourseReviewDiscoveryPage } from './CourseReviewDiscoveryPage';

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.searchParams,
}));

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }));

vi.mock('@/lib/discovery-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/discovery-client')>();
  return { ...actual, getCourseReviewDiscovery: vi.fn() };
});

const subjectId = '20000000-0000-4000-8000-000000000001';
const professorId = '20000000-0000-4000-8000-000000000002';

function review(overrides: Partial<DiscoveryCourseReview> = {}): DiscoveryCourseReview {
  return {
    academicYear: 2026,
    attempt: 'PRIMERA_CURSADA',
    author: { username: 'Anónimo' },
    condition: 'REGULAR',
    createdAt: '2026-08-31T12:00:00.000Z',
    difficulty: 'ALTA',
    excerpt:
      'La cursada tuvo práctica semanal y resultó mucho más clara con los ejercicios resueltos.',
    id: 'review-1',
    professor: { id: professorId, name: 'Ing. Laura Quiroga' },
    professorName: null,
    recommendation: 4,
    shift: 'TARDE',
    subject: {
      href: '/materias/ED-01',
      id: subjectId,
      name: 'Estructuras de Datos',
      code: 'ED-01',
    },
    updatedAt: '2026-08-31T12:00:00.000Z',
    ...overrides,
  };
}

function resultPage(
  data: DiscoveryCourseReview[],
  page = 1,
  totalPages = 1,
): DiscoveryCourseReviewList {
  return {
    aggregate: { averageRecommendation: 4, reviewCount: data.length },
    data,
    meta: { limit: 10, page, total: totalPages * 10, totalPages },
  };
}

function mockFilterOptions() {
  vi.mocked(api.get).mockImplementation((path) => {
    if (path === '/subjects') {
      return Promise.resolve({
        data: [{ code: 'ED-01', description: null, id: subjectId, name: 'Estructuras de Datos' }],
      });
    }
    if (path === '/professors') {
      return Promise.resolve({
        data: { data: [{ id: professorId, name: 'Ing. Laura Quiroga' }] },
      });
    }
    return Promise.reject(new Error(`Unexpected request: ${path}`));
  });
}

describe('CourseReviewDiscoveryPage', () => {
  beforeEach(() => {
    navigation.push.mockReset();
    navigation.searchParams = new URLSearchParams();
    vi.mocked(api.get).mockReset();
    vi.mocked(getCourseReviewDiscovery).mockReset();
    mockFilterOptions();
  });

  afterEach(cleanup);

  it('loads URL-backed filters and presents scoped average/count with anonymous identity', async () => {
    navigation.searchParams = new URLSearchParams(
      `subjectId=${subjectId}&difficulty=ALTA&sort=STARS_DESC&page=2`,
    );
    vi.mocked(getCourseReviewDiscovery).mockResolvedValue(resultPage([review()], 2));

    const { container } = render(<CourseReviewDiscoveryPage />);

    expect(await screen.findByRole('link', { name: 'Estructuras de Datos' })).toBeInTheDocument();
    // The root layout owns the only <main> landmark.
    expect(container.querySelector('main')).toBeNull();
    expect(screen.getByText('Anónimo')).toBeInTheDocument();
    expect(screen.getByText('4,0')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(getCourseReviewDiscovery).toHaveBeenCalledWith(
      expect.objectContaining({
        difficulty: 'ALTA',
        limit: 10,
        page: 2,
        sort: 'STARS_DESC',
        subjectId,
      }),
    );
    expect(
      screen.getByRole('button', { name: 'Quitar filtro Dificultad: Alta' }),
    ).toBeInTheDocument();
  });

  it('updates sort in the URL while retaining approved filters', async () => {
    navigation.searchParams = new URLSearchParams('difficulty=ALTA&sort=STARS_DESC&page=2');
    vi.mocked(getCourseReviewDiscovery).mockResolvedValue(resultPage([review()], 2));

    render(<CourseReviewDiscoveryPage />);
    await screen.findByRole('link', { name: 'Estructuras de Datos' });
    fireEvent.click(screen.getByRole('button', { name: 'Recientes' }));

    expect(navigation.push).toHaveBeenCalledWith('/resenas?difficulty=ALTA');
  });

  it('keeps filters when pagination creates the next shareable URL', async () => {
    navigation.searchParams = new URLSearchParams('difficulty=ALTA');
    vi.mocked(getCourseReviewDiscovery).mockResolvedValue(resultPage([review()], 1, 3));

    render(<CourseReviewDiscoveryPage />);

    expect(await screen.findByRole('link', { name: 'Siguiente' })).toHaveAttribute(
      'href',
      '/resenas?difficulty=ALTA&page=2',
    );
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
  });

  it('distinguishes a filtered empty state and can clear filters without losing the page route', async () => {
    navigation.searchParams = new URLSearchParams('attempt=PRIMERA_RECURSADA');
    vi.mocked(getCourseReviewDiscovery).mockResolvedValue(resultPage([]));

    render(<CourseReviewDiscoveryPage />);

    expect(
      await screen.findByRole('heading', { name: 'No hay reseñas con estos filtros' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar todos los filtros' }));
    expect(navigation.push).toHaveBeenLastCalledWith('/resenas');
  });

  it('keeps URL-backed state when the review request fails and retries it', async () => {
    navigation.searchParams = new URLSearchParams('academicYear=2026');
    vi.mocked(getCourseReviewDiscovery)
      .mockRejectedValueOnce(new Error('reviews unavailable'))
      .mockResolvedValueOnce(resultPage([review({ id: 'review-2' })]));

    render(<CourseReviewDiscoveryPage />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Estructuras de Datos' })).toBeInTheDocument(),
    );
    expect(getCourseReviewDiscovery).toHaveBeenCalledTimes(2);
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
