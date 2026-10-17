import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';
import { getMaterialDiscovery } from '@/lib/discovery-client';
import { getTopMaterials } from '@/lib/ranking-client';
import { fiUnju } from '@/test/institutions';
import type { SubjectHub as SubjectHubType } from '@/types/subject';

const mocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
  replace: vi.fn(),
  myCareers: [] as { careerId: string; status: string; declaredAt: string }[],
}));

vi.mock('@/lib/experiences-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/experiences-client')>()),
  getSubjectExperiencesSummary: vi.fn().mockResolvedValue({
    exams: {
      count: 0,
      formats: { counts: {}, top: null },
      grade: { average: null, count: 0 },
      outcomes: { answered: 0, aprobado: 0, desaprobado: 0, percent: null, undeclared: 0 },
      practice: { average: null, count: 0 },
      theory: { average: null, count: 0 },
      topSession: null,
    },
    reviews: {
      count: 0,
      difficulty: { answered: 0, counts: {}, top: null, unanswered: 0 },
      recommendation: { average: null, count: 0 },
      results: { answered: 0, libre: 0, percents: null, promo: 0, regular: 0, unanswered: 0 },
    },
    subject: { code: 'ED-01', id: 'subject-1', name: 'Estructuras de Datos' },
  }),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/materias/AL-01',
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => mocks.searchParams,
}));
vi.mock('@/stores/ubicacionStore', () => ({
  useUbicacionStore: (selector: (state: unknown) => unknown) =>
    selector({ myCareers: mocks.myCareers, ubicacion: null, ready: true }),
}));
vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }));
vi.mock('@/lib/ranking-client', () => ({ getTopMaterials: vi.fn() }));
vi.mock('@/lib/discovery-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/discovery-client')>()),
  getMaterialDiscovery: vi.fn(),
}));

import { SubjectHub } from './SubjectHub';

const placement = (id: string, name: string, code: string, year: number, semester: number) => ({
  year,
  semester,
  credits: null,
  studyPlan: { name: 'Plan 2023', career: { id, name, code, faculty: fiUnju } },
});

const subject: SubjectHubType = {
  code: 'AL-01',
  description: null,
  id: 'subject-al',
  name: 'Álgebra Lineal',
  professors: [],
  stats: { avgRecommendation: null, examCount: 0, materialCount: 0, reviewCount: 0 },
  // Out of order on purpose: the page orders placements by carrera name.
  studyPlans: [
    placement('c-inf', 'Ingeniería Informática', 'II', 1, 1),
    placement('c-ind', 'Ingeniería Industrial', 'IND', 1, 2),
  ],
  faculty: fiUnju,
};

afterEach(cleanup);

beforeEach(() => {
  mocks.searchParams = new URLSearchParams();
  mocks.replace.mockReset();
  mocks.myCareers = [];
  vi.mocked(api.get)
    .mockReset()
    .mockImplementation((path) => {
      if (path === '/subjects/AL-01') return Promise.resolve({ data: subject });
      if (path === '/subjects/AL-01/reviews') {
        return Promise.resolve({ data: { conditionBreakdown: [], reviews: [] } });
      }
      if (path === '/subjects/AL-01/exams') return Promise.resolve({ data: [] });
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
  vi.mocked(getTopMaterials)
    .mockReset()
    .mockResolvedValue({
      semester: { year: 2026, half: 2 },
      entries: [],
    });
  vi.mocked(getMaterialDiscovery)
    .mockReset()
    .mockResolvedValue({
      data: [],
      meta: { limit: 20, page: 1, total: 0, totalPages: 0 },
    } as never);
});

const trail = async () => screen.findByRole('navigation', { name: 'Ruta' });

describe('SubjectHub: academic context', () => {
  it('reads each placement as facultad · carrera · año · cuatrimestre, by carrera name, without plans', async () => {
    render(<SubjectHub code="AL-01" />);
    await screen.findByRole('heading', { level: 1, name: 'Álgebra Lineal' });
    const chips = screen.getAllByText(/^FI \(UNJU\) · /).map((chip) => chip.textContent);
    expect(chips).toEqual([
      'FI (UNJU) · Ingeniería Industrial · Año 1 · Cuatrimestre 2',
      'FI (UNJU) · Ingeniería Informática · Año 1 · Cuatrimestre 1',
    ]);
    expect(screen.queryByText(/Plan 2023/)).toBeNull();
  });

  it('builds the trail with the carrera the link named', async () => {
    mocks.searchParams = new URLSearchParams('carrera=ii');
    render(<SubjectHub code="AL-01" />);
    const nav = await trail();
    expect(within(nav).getByRole('link', { name: 'Universidades' })).toHaveAttribute(
      'href',
      '/universidades',
    );
    expect(within(nav).getByRole('link', { name: 'UNJU' })).toHaveAttribute(
      'href',
      '/universidades/unju',
    );
    expect(within(nav).getByRole('link', { name: 'FI' })).toHaveAttribute(
      'href',
      '/universidades/unju/fi',
    );
    expect(within(nav).getByRole('link', { name: 'Ingeniería Informática' })).toHaveAttribute(
      'href',
      '/universidades/unju/fi/ii',
    );
    expect(within(nav).getByText('Álgebra Lineal')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Ver experiencias' })).toHaveAttribute(
      'href',
      '/experiencias/AL-01?carrera=c-inf',
    );
  });

  it('falls back to the viewer’s first declared carrera that includes the materia', async () => {
    mocks.myCareers = [
      { careerId: 'c-other', status: 'ACTIVE', declaredAt: '2026-01-01T00:00:00.000Z' },
      { careerId: 'c-inf', status: 'COMPLETED', declaredAt: '2026-02-01T00:00:00.000Z' },
      { careerId: 'c-ind', status: 'ACTIVE', declaredAt: '2026-03-01T00:00:00.000Z' },
    ];
    render(<SubjectHub code="AL-01" />);
    expect(
      within(await trail()).getByRole('link', { name: 'Ingeniería Informática' }),
    ).toBeInTheDocument();
  });

  it('falls back to the first carrera by name without a param or a declared carrera', async () => {
    render(<SubjectHub code="AL-01" />);
    const nav = await trail();
    expect(within(nav).getByRole('link', { name: 'Ingeniería Industrial' })).toHaveAttribute(
      'href',
      '/universidades/unju/fi/ind',
    );
  });
});

describe('SubjectHub: search within the materia', () => {
  it('keeps the query in the URL and searches only this materia', async () => {
    mocks.searchParams = new URLSearchParams('carrera=ii&q=parcial');
    render(<SubjectHub code="AL-01" />);
    fireEvent.click(await screen.findByRole('tab', { name: /Materiales/ }));
    const field = screen.getByRole('searchbox', { name: 'Buscar en Álgebra Lineal' });
    expect(field).toHaveValue('parcial');
    await waitFor(() =>
      expect(getMaterialDiscovery).toHaveBeenCalledWith(
        expect.objectContaining({ subjectId: 'subject-al', search: 'parcial' }),
      ),
    );

    fireEvent.change(field, { target: { value: 'final' } });
    fireEvent.submit(field.closest('form')!);
    expect(mocks.replace).toHaveBeenCalledWith('/materias/AL-01?carrera=ii&q=final', {
      scroll: false,
    });
  });
});
