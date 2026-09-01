import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';
import { getExamExperienceDiscovery } from '@/lib/discovery-client';
import type { DiscoveryExamExperience, DiscoveryExamExperienceList } from '@/types/discovery';

import { ExamExperienceDiscoveryPage } from './ExamExperienceDiscoveryPage';

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
  return { ...actual, getExamExperienceDiscovery: vi.fn() };
});

const subjectId = '20000000-0000-4000-8000-000000000001';
const professorId = '20000000-0000-4000-8000-000000000002';

function experience(overrides: Partial<DiscoveryExamExperience> = {}): DiscoveryExamExperience {
  return {
    author: { username: 'Anónimo' },
    createdAt: '2026-08-31T12:00:00.000Z',
    difficulty: 'ALTA',
    examDate: '2026-07-15T00:00:00.000Z',
    examinerName: undefined,
    excerpt: 'La mesa recorrió grafos, complejidad y una defensa oral de las estructuras elegidas.',
    format: 'ORAL',
    id: 'exam-1',
    outcome: 'APROBADO',
    professor: { id: professorId, name: 'Ing. Laura Quiroga' },
    session: 'JULIO',
    shift: 'TARDE',
    subject: {
      code: 'ED-01',
      href: '/materias/ED-01',
      id: subjectId,
      name: 'Estructuras de Datos',
    },
    updatedAt: '2026-08-31T12:00:00.000Z',
    year: 2026,
    ...overrides,
  };
}

function resultPage(
  data: DiscoveryExamExperience[],
  page = 1,
  totalPages = 1,
): DiscoveryExamExperienceList {
  return {
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

describe('ExamExperienceDiscoveryPage', () => {
  beforeEach(() => {
    navigation.push.mockReset();
    navigation.searchParams = new URLSearchParams();
    vi.mocked(api.get).mockReset();
    vi.mocked(getExamExperienceDiscovery).mockReset();
    mockFilterOptions();
  });

  afterEach(cleanup);

  it('loads URL-backed approved filters and makes the date-based ordering explicit', async () => {
    navigation.searchParams = new URLSearchParams(
      `subjectId=${subjectId}&year=2026&session=JULIO&format=ORAL&outcome=APROBADO&page=2`,
    );
    vi.mocked(getExamExperienceDiscovery).mockResolvedValue(resultPage([experience()], 2));

    render(<ExamExperienceDiscoveryPage />);

    expect(await screen.findByRole('link', { name: 'Estructuras de Datos' })).toBeInTheDocument();
    expect(screen.getByText('Anónimo')).toBeInTheDocument();
    expect(screen.getByText(/fecha exacta cuando se conoce/i)).toBeInTheDocument();
    expect(screen.getByText(/no se ordena por nota/i)).toBeInTheDocument();
    expect(screen.queryByText('Ordenar por')).not.toBeInTheDocument();
    expect(screen.queryByText(/Nota:/)).not.toBeInTheDocument();
    expect(getExamExperienceDiscovery).toHaveBeenCalledWith(
      expect.objectContaining({
        format: 'ORAL',
        limit: 10,
        outcome: 'APROBADO',
        page: 2,
        session: 'JULIO',
        subjectId,
        year: 2026,
      }),
    );
  });

  it('keeps filters when pagination creates a shareable next URL', async () => {
    navigation.searchParams = new URLSearchParams('session=JULIO&format=ORAL');
    vi.mocked(getExamExperienceDiscovery).mockResolvedValue(resultPage([experience()], 1, 3));

    render(<ExamExperienceDiscoveryPage />);

    expect(await screen.findByRole('link', { name: 'Siguiente' })).toHaveAttribute(
      'href',
      '/finales?session=JULIO&format=ORAL&page=2',
    );
  });

  it('distinguishes a filtered empty state and can clear it', async () => {
    navigation.searchParams = new URLSearchParams('outcome=DESAPROBADO');
    vi.mocked(getExamExperienceDiscovery).mockResolvedValue(resultPage([]));

    render(<ExamExperienceDiscoveryPage />);

    expect(
      await screen.findByRole('heading', { name: 'No hay finales con estos filtros' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar todos los filtros' }));
    expect(navigation.push).toHaveBeenLastCalledWith('/finales');
  });

  it('keeps filters on an API failure and retries the same request', async () => {
    navigation.searchParams = new URLSearchParams('year=2026');
    vi.mocked(getExamExperienceDiscovery)
      .mockRejectedValueOnce(new Error('finals unavailable'))
      .mockResolvedValueOnce(resultPage([experience({ id: 'exam-2' })]));

    render(<ExamExperienceDiscoveryPage />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Estructuras de Datos' })).toBeInTheDocument(),
    );
    expect(getExamExperienceDiscovery).toHaveBeenCalledTimes(2);
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
