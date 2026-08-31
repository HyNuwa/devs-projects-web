import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getGroupedSuggestions, getMaterialDiscovery } from '@/lib/discovery-client';
import type { GroupedDiscoverySuggestions } from '@/types/discovery';
import type { Material, Paginated } from '@/types/material';
import { MaterialSearchPage } from './MaterialSearchPage';

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.searchParams,
}));

vi.mock('@/lib/discovery-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/discovery-client')>();

  return {
    ...actual,
    getGroupedSuggestions: vi.fn(),
    getMaterialDiscovery: vi.fn(),
  };
});

const subjectId = '20000000-0000-4000-8000-000000000001';

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
    subjectId,
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
    subject: { id: subjectId, name: 'Álgebra I', code: 'ALG-01' },
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

function materialPage(data: Material[], page = 1): Paginated<Material> {
  return { data, meta: { page, limit: 10, total: data.length, totalPages: 1 } };
}

function suggestions(subjects: GroupedDiscoverySuggestions['subjects'] = []) {
  return { subjects, materials: [] } satisfies GroupedDiscoverySuggestions;
}

describe('MaterialSearchPage', () => {
  beforeEach(() => {
    navigation.push.mockReset();
    navigation.searchParams = new URLSearchParams();
    vi.mocked(getGroupedSuggestions).mockReset();
    vi.mocked(getMaterialDiscovery).mockReset();
  });

  it('promotes only an exact materia match and scopes its resource request', async () => {
    navigation.searchParams = new URLSearchParams(`q=%C3%81lgebra%20I&subjectId=${subjectId}`);
    vi.mocked(getGroupedSuggestions).mockResolvedValue(
      suggestions([{ kind: 'SUBJECT', id: subjectId, name: 'Álgebra I', code: 'ALG-01' }]),
    );
    vi.mocked(getMaterialDiscovery).mockResolvedValue(materialPage([material()]));

    render(<MaterialSearchPage />);

    expect(await screen.findByRole('heading', { name: 'Álgebra I' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /resultados para/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /buscar en todas las materias/i })).toHaveAttribute(
      'href',
      '/buscar?q=%C3%81lgebra+I&scope=all',
    );
    expect(getMaterialDiscovery).toHaveBeenCalledWith({
      subjectId,
      sort: 'RELEVANCE',
      page: 1,
      limit: 10,
    });
  });

  it('keeps a generic search global and preserves URL-backed filters and paging', async () => {
    navigation.searchParams = new URLSearchParams('q=grafos&resourceType=FINAL&sort=RECENT&page=2');
    vi.mocked(getGroupedSuggestions).mockResolvedValue(suggestions());
    vi.mocked(getMaterialDiscovery).mockResolvedValue(
      materialPage([material({ resourceType: 'FINAL' })], 2),
    );

    render(<MaterialSearchPage />);

    expect(
      await screen.findByRole('heading', { name: 'Resultados para “grafos”' }),
    ).toBeInTheDocument();
    expect(getMaterialDiscovery).toHaveBeenCalledWith({
      search: 'grafos',
      resourceType: 'FINAL',
      sort: 'RECENT',
      page: 2,
      limit: 10,
    });
    expect(
      screen.getByText(
        'Los filtros incluidos en este enlace están activos. Podrás modificarlos desde los controles de filtros.',
      ),
    ).toBeInTheDocument();
  });

  it('updates sorting in the URL and reloads results when browser state changes', async () => {
    navigation.searchParams = new URLSearchParams('q=grafos&resourceType=FINAL&page=2');
    vi.mocked(getGroupedSuggestions).mockResolvedValue(suggestions());
    vi.mocked(getMaterialDiscovery).mockResolvedValue(
      materialPage([material({ title: 'Guía de grafos' })], 2),
    );

    const view = render(<MaterialSearchPage />);
    await screen.findByText('Guía de grafos');

    fireEvent.click(screen.getByRole('button', { name: 'Recientes' }));
    expect(navigation.push).toHaveBeenCalledWith('/buscar?q=grafos&resourceType=FINAL&sort=RECENT');

    navigation.searchParams = new URLSearchParams('q=álgebra');
    vi.mocked(getGroupedSuggestions).mockResolvedValueOnce(suggestions());
    vi.mocked(getMaterialDiscovery).mockResolvedValueOnce(
      materialPage([material({ title: 'Apunte de álgebra' })]),
    );
    view.rerender(<MaterialSearchPage />);

    await waitFor(() => {
      expect(getMaterialDiscovery).toHaveBeenLastCalledWith({
        search: 'álgebra',
        sort: 'RELEVANCE',
        page: 1,
        limit: 10,
      });
    });
    expect(await screen.findByText('Apunte de álgebra')).toBeInTheDocument();
  });
});
