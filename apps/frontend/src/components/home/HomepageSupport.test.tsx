import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getCourseReviewDiscovery, getMaterialDiscovery } from '@/lib/discovery-client';
import type { DiscoveryCourseReview } from '@/types/discovery';
import type { Material, Paginated } from '@/types/material';
import { HomepageSupport } from './HomepageSupport';

vi.mock('@/lib/discovery-client', () => ({
  getCourseReviewDiscovery: vi.fn(),
  getMaterialDiscovery: vi.fn(),
}));

afterEach(cleanup);

function material(overrides: Partial<Material> = {}): Material {
  return {
    id: 'material-1',
    title: 'Parcial resuelto de complejidad',
    description: null,
    fileUrl: 'https://example.test/material-1.pdf',
    fileType: 'application/pdf',
    fileSize: '1200000',
    thumbnailUrl: null,
    authorId: 'author-1',
    subjectId: 'subject-1',
    resourceType: 'PARCIAL',
    academicYear: 2026,
    professorId: null,
    shift: null,
    downloadCount: 0,
    avgRating: '4.50',
    ratingCount: 2,
    createdAt: '2026-08-30T12:00:00.000Z',
    updatedAt: '2026-08-30T12:00:00.000Z',
    author: { id: 'author-1', username: 'luciana', displayName: null, avatarUrl: null },
    subject: { id: 'subject-1', name: 'Algoritmos y Estructuras de Datos', code: 'S2-14' },
    professor: null,
    helpfulCount: 12,
    commentCount: 1,
    starSummary: { average: '4.50', count: 2 },
    commentSummary: { count: 1 },
    preview: {
      capability: 'PDF',
      url: 'https://example.test/material-1.pdf',
      canPreview: true,
      downloadUrl: 'https://example.test/material-1.pdf',
      fallback: { reason: 'UNAVAILABLE', downloadUrl: 'https://example.test/material-1.pdf' },
    },
    ...overrides,
  };
}

function materialPage(data: Material[]): Paginated<Material> {
  return { data, meta: { page: 1, limit: data.length || 1, total: data.length, totalPages: 1 } };
}

function review(overrides: Partial<DiscoveryCourseReview> = {}): DiscoveryCourseReview {
  return {
    id: 'review-1',
    subject: {
      id: 'subject-1',
      name: 'Algoritmos y Estructuras de Datos',
      code: 'S2-14',
      href: '/materias/subject-1',
    },
    author: { username: 'Luciana G.' },
    academicYear: 2026,
    shift: 'TARDE',
    condition: 'REGULAR',
    attempt: 'PRIMERA_CURSADA',
    difficulty: 'ALTA',
    recommendation: 4,
    professor: { id: 'professor-1', name: 'Ing. Quiroga' },
    professorName: null,
    excerpt: 'Los ejercicios prácticos ayudaron a entender el ritmo de los parciales.',
    createdAt: '2026-08-30T12:00:00.000Z',
    updatedAt: '2026-08-30T12:00:00.000Z',
    ...overrides,
  };
}

describe('HomepageSupport', () => {
  beforeEach(() => {
    vi.mocked(getMaterialDiscovery).mockReset();
    vi.mocked(getCourseReviewDiscovery).mockReset();
  });

  it('uses bounded real API results in the approved supporting-section order', async () => {
    vi.mocked(getMaterialDiscovery)
      .mockResolvedValueOnce(materialPage([material()]))
      .mockResolvedValueOnce(
        materialPage([
          material({
            id: 'material-final-1',
            title: 'Final resuelto de grafos',
            resourceType: 'FINAL',
          }),
        ]),
      );
    vi.mocked(getCourseReviewDiscovery).mockResolvedValue({
      data: [review()],
      aggregate: { averageRecommendation: 4, reviewCount: 1 },
      meta: { page: 1, limit: 2, total: 1, totalPages: 1 },
    });

    render(<HomepageSupport />);

    expect(await screen.findByText('Parcial resuelto de complejidad')).toBeInTheDocument();
    expect(screen.getByText('Final resuelto de grafos')).toBeInTheDocument();
    expect(screen.getByText(/los ejercicios prácticos ayudaron/i)).toBeInTheDocument();
    expect(getMaterialDiscovery).toHaveBeenNthCalledWith(1, { limit: 6, sort: 'RECENT' });
    expect(getMaterialDiscovery).toHaveBeenNthCalledWith(2, { limit: 3, resourceType: 'FINAL' });
    expect(getCourseReviewDiscovery).toHaveBeenCalledWith({ limit: 2 });

    const subjectHeading = screen.getByRole('heading', {
      name: 'Materias con materiales recientes.',
    });
    const materialHeading = screen.getByRole('heading', { name: 'Materiales recientes.' });
    const finalHeading = screen.getByRole('heading', { name: 'Finales para preparar.' });
    const experiencesHeading = screen.getByRole('heading', {
      name: 'Experiencias de estudiantes.',
    });

    expect(subjectHeading.compareDocumentPosition(materialHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(materialHeading.compareDocumentPosition(finalHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(finalHeading.compareDocumentPosition(experiencesHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.getByRole('link', { name: /subir material/i })).toHaveAttribute(
      'href',
      '/materiales/nuevo',
    );
    expect(screen.getByRole('link', { name: /subir material/i })).toHaveClass('text-primary');
    expect(screen.queryByText(/revisado/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/popular/i)).not.toBeInTheDocument();
  });

  it('renders explicit bounded empty states when the APIs have no public records', async () => {
    vi.mocked(getMaterialDiscovery)
      .mockResolvedValueOnce(materialPage([]))
      .mockResolvedValueOnce(materialPage([]));
    vi.mocked(getCourseReviewDiscovery).mockResolvedValue({
      data: [],
      aggregate: { averageRecommendation: null, reviewCount: 0 },
      meta: { page: 1, limit: 2, total: 0, totalPages: 0 },
    });

    render(<HomepageSupport />);

    await waitFor(() => {
      expect(
        screen.getByText(/todavía no hay materias con materiales públicos recientes/i),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(/todavía no hay materiales públicos para mostrar/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/todavía no hay finales públicos para mostrar/i)).toBeInTheDocument();
    expect(
      screen.getByText(/todavía no hay experiencias publicadas para mostrar/i),
    ).toBeInTheDocument();
  });
});
