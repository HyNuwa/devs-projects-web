import { fiUnju } from '@/test/institutions';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';
import { getMaterialDiscovery } from '@/lib/discovery-client';
import { getTopMaterials, type TopMaterials } from '@/lib/ranking-client';
import type { SubjectHub as SubjectHubType } from '@/types/subject';

import { SubjectHub } from './SubjectHub';

vi.mock('next/navigation', () => ({
  usePathname: () => '/materias/ED-01',
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }));

vi.mock('@/lib/ranking-client', () => ({ getTopMaterials: vi.fn() }));

vi.mock('@/components/discovery/MaterialPreviewDialog', () => ({
  MaterialPreviewDialog: ({
    file,
    onRequestClose,
    subjectName,
  }: {
    file: { title: string };
    onRequestClose: () => void;
    subjectName: string;
  }) => (
    <div aria-label={`Vista previa de ${file.title}`} role="dialog">
      {subjectName}
      <button onClick={onRequestClose} type="button">
        Cerrar
      </button>
    </div>
  ),
}));

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
  faculty: fiUnju,
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

const emptyTop: TopMaterials = { semester: { year: 2026, half: 2 }, entries: [] };

const top: TopMaterials = {
  semester: { year: 2026, half: 2 },
  entries: [
    {
      rank: 1,
      helpful: 12,
      material: {
        id: 'material-9',
        title: 'Resumen de árboles',
        resourceType: 'RESUMEN',
        fileType: 'pdf',
        academicYear: 2024,
        createdAt: '2024-05-01T12:00:00.000Z',
      },
    },
    {
      rank: 2,
      helpful: 1,
      material: {
        id: 'material-1',
        title: 'Parcial 1 resuelto',
        resourceType: 'PARCIAL',
        fileType: 'pdf',
        academicYear: null,
        createdAt: '2026-08-01T12:00:00.000Z',
      },
    },
  ],
};

afterEach(cleanup);

describe('SubjectHub', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(getMaterialDiscovery).mockReset();
    mockHubRequests();
    vi.mocked(getTopMaterials).mockReset().mockResolvedValue(emptyTop);
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

  it('names the facultad in every plan placement of the materia', async () => {
    const hub = vi.mocked(api.get).getMockImplementation()!;
    vi.mocked(api.get).mockImplementation((path, ...rest) =>
      path === '/subjects/ED-01'
        ? Promise.resolve({
            data: {
              ...subject,
              studyPlans: [
                {
                  year: 2,
                  semester: 1,
                  credits: null,
                  studyPlan: {
                    name: 'Plan 2023',
                    career: {
                      id: 'c-inf',
                      name: 'Ingeniería Informática',
                      code: 'II',
                      faculty: fiUnju,
                    },
                  },
                },
                {
                  year: 3,
                  semester: 2,
                  credits: 6,
                  studyPlan: {
                    name: 'Plan 2019',
                    career: {
                      id: 'c-ind',
                      name: 'Ingeniería Industrial',
                      code: 'IND',
                      faculty: fiUnju,
                    },
                  },
                },
              ],
            },
          })
        : hub(path, ...rest),
    );

    render(<SubjectHub code="ED-01" />);

    expect(
      await screen.findByText('FI (UNJU) · Ingeniería Informática · Año 2 · Cuatrimestre 1'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('FI (UNJU) · Ingeniería Industrial · Año 3 · Cuatrimestre 2 · 6 créditos'),
    ).toBeInTheDocument();
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

    await user.click(await screen.findByRole('tab', { name: 'Materiales (1)' }));

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

  it('lists «Más útiles este cuatrimestre» with their count and opens the preview', async () => {
    vi.mocked(getTopMaterials).mockResolvedValue(top);
    const user = userEvent.setup();
    render(<SubjectHub code="ED-01" />);

    await screen.findByText(/los parciales prácticos ayudaron/i);
    await user.click(await screen.findByRole('tab', { name: 'Materiales (1)' }));

    const section = screen.getByRole('region', { name: 'Más útiles este cuatrimestre' });
    const items = within(section).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('1.º');
    expect(items[0]).toHaveTextContent('Resumen de árboles');
    expect(items[0]).toHaveTextContent('12 «Me sirvió»');
    expect(items[1]).toHaveTextContent('1 «Me sirvió»');
    expect(getTopMaterials).toHaveBeenCalledWith('ED-01');

    await user.click(within(items[0]).getByRole('button', { name: /resumen de árboles/i }));
    expect(
      screen.getByRole('dialog', { name: 'Vista previa de Resumen de árboles' }),
    ).toHaveTextContent('Estructuras de Datos');
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('hides «Más útiles» when empty or when it cannot load', async () => {
    const user = userEvent.setup();
    render(<SubjectHub code="ED-01" />);
    await screen.findByText(/los parciales prácticos ayudaron/i);
    await user.click(await screen.findByRole('tab', { name: 'Materiales (1)' }));
    expect(screen.queryByRole('region', { name: 'Más útiles este cuatrimestre' })).toBeNull();
    cleanup();

    vi.mocked(getTopMaterials).mockRejectedValue(new Error('boom'));
    render(<SubjectHub code="ED-01" />);
    await screen.findByText(/los parciales prácticos ayudaron/i);
    await user.click(await screen.findByRole('tab', { name: 'Materiales (1)' }));
    expect(screen.getByRole('link', { name: /parcial 1 resuelto/i })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Más útiles este cuatrimestre' })).toBeNull();
  });
});
