import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';
import { getMaterialDiscovery } from '@/lib/discovery-client';
import type { SubjectHub as SubjectHubType } from '@/types/subject';

import { SubjectHub } from './SubjectHub';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }));

vi.mock('@/lib/discovery-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/discovery-client')>();

  return { ...actual, getMaterialDiscovery: vi.fn() };
});

const subject: SubjectHubType = {
  code: 'ED-01',
  description: 'Estructuras lineales, árboles y algoritmos fundamentales.',
  id: 'subject-1',
  name: 'Estructuras de Datos',
  professors: [],
  stats: { avgRecommendation: 4, examCount: 1, materialCount: 1, reviewCount: 1 },
  studyPlans: [],
};

function mockHubRequests() {
  vi.mocked(api.get).mockImplementation((path) => {
    if (path === '/subjects/ED-01') return Promise.resolve({ data: subject });
    if (path === '/subjects/ED-01/reviews') {
      return Promise.resolve({
        data: {
          conditionBreakdown: [{ _count: 1, condition: 'REGULAR' }],
          reviews: [
            {
              academicYear: 2026,
              attempt: 'PRIMERA_CURSADA',
              comment: 'Los parciales prácticos ayudaron a entender cómo preparar cada tema.',
              condition: 'REGULAR',
              createdAt: '2026-08-01T12:00:00.000Z',
              difficulty: 'ALTA',
              id: 'review-1',
              professorName: 'Ing. Laura Quiroga',
              recommendation: 4,
              shift: 'TARDE',
              subjectId: subject.id,
              updatedAt: '2026-08-01T12:00:00.000Z',
              user: { username: 'luciana' },
              userId: 'author-1',
            },
          ],
        },
      });
    }
    if (path === '/subjects/ED-01/exams') {
      return Promise.resolve({
        data: [
          {
            comment: 'Tomaron complejidad y una defensa corta de las estructuras implementadas.',
            createdAt: '2026-08-02T12:00:00.000Z',
            examinerName: null,
            format: 'ORAL',
            id: 'exam-1',
            professor: null,
            professorId: null,
            session: 'FEBRERO_MARZO',
            shift: null,
            subjectId: subject.id,
            updatedAt: '2026-08-02T12:00:00.000Z',
            user: { username: 'Anónimo' },
            userId: 'author-2',
            year: 2026,
          },
        ],
      });
    }

    return Promise.reject(new Error(`Unexpected request: ${path}`));
  });
}

afterEach(cleanup);

describe('SubjectHub', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(getMaterialDiscovery).mockReset();
    mockHubRequests();
    vi.mocked(getMaterialDiscovery).mockResolvedValue({
      data: [
        {
          downloadCount: 12,
          id: 'material-1',
          resourceType: 'PARCIAL',
          title: 'Parcial 1 resuelto',
        },
      ],
      meta: { limit: 20, page: 1, total: 1, totalPages: 1 },
    } as never);
  });

  it('renders each source review once and keeps its shareable detail route', async () => {
    const { container } = render(<SubjectHub code="ED-01" />);

    expect(await screen.findByText(/los parciales prácticos ayudaron/i)).toBeInTheDocument();
    // The root layout owns the only <main> landmark.
    expect(container.querySelector('main')).toBeNull();
    expect(screen.getAllByText(/los parciales prácticos ayudaron/i)).toHaveLength(1);
    expect(screen.getByLabelText('Recomendación: 4 de 5 estrellas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Leer más' })).toHaveAttribute(
      'href',
      '/resenas/review-1',
    );
  });

  it('keeps reviews, final experiences, and materials as distinct source-record views', async () => {
    const user = userEvent.setup();
    render(<SubjectHub code="ED-01" />);

    await screen.findByText(/los parciales prácticos ayudaron/i);
    await user.click(screen.getByRole('tab', { name: 'Finales (1)' }));

    expect(screen.getByText(/tomaron complejidad/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Leer más' })).toHaveAttribute(
      'href',
      '/finales/exam-1',
    );

    await user.click(screen.getByRole('tab', { name: 'Materiales (1)' }));

    expect(screen.getByRole('link', { name: /parcial 1 resuelto/i })).toHaveAttribute(
      'href',
      '/materiales/material-1',
    );
    expect(getMaterialDiscovery).toHaveBeenCalledWith({
      limit: 20,
      page: 1,
      sort: 'RECENT',
      subjectId: subject.id,
    });
    expect(api.get).toHaveBeenCalledTimes(3);
  });
});
