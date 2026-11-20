import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Legends, MonthlyRanking } from '@/lib/ranking-client';
import type { InstitutionTree } from '@/lib/study-plans-client';

const mocks = vi.hoisted(() => ({
  monthly: vi.fn(),
  monthlyMe: vi.fn(),
  legends: vi.fn(),
  legendsMe: vi.fn(),
  institutions: vi.fn(),
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
  user: null as { id: string; username: string } | null,
  isLoading: false,
}));

vi.mock('@/lib/ranking-client', () => ({
  getMonthlyRanking: mocks.monthly,
  getMyMonthlyPlace: mocks.monthlyMe,
  getLegends: mocks.legends,
  getMyLegendsFaculty: mocks.legendsMe,
}));
vi.mock('@/lib/study-plans-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/study-plans-client')>()),
  getInstitutions: mocks.institutions,
  getMyCareers: vi.fn().mockResolvedValue([]),
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/ranking',
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => mocks.searchParams,
}));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: mocks.user, isLoading: mocks.isLoading }),
}));

import { resetUbicacionStore, UBICACION_STORAGE_KEY } from '@/stores/ubicacionStore';

import { RankingPage } from './RankingPage';

const tree: InstitutionTree = [
  {
    id: 'u-unju',
    name: 'Universidad Nacional de Jujuy',
    shortName: 'UNJU',
    faculties: [
      {
        id: 'f-fi',
        name: 'Facultad de Ingeniería',
        shortName: 'FI',
        careers: [
          { id: 'c-ind', name: 'Ingeniería Industrial', code: 'IND', studyPlans: [] },
          { id: 'c-inf', name: 'Ingeniería Informática', code: 'INF', studyPlans: [] },
        ],
      },
      {
        id: 'f-fce',
        name: 'Facultad de Ciencias Económicas',
        shortName: 'FCE',
        careers: [{ id: 'c-cont', name: 'Contador Público', code: 'CP', studyPlans: [] }],
      },
    ],
  },
];

const entry = (
  rank: number,
  username: string,
  points: number,
  displayName: string | null = null,
) => ({
  rank,
  username,
  displayName,
  level: 4,
  points,
});

const monthly = (
  careerId: string,
  entries = [entry(1, 'ana', 30, 'Ana'), entry(1, 'bruno', 30), entry(3, 'caro', 20)],
): MonthlyRanking => ({
  career: {
    id: careerId,
    name: careerId === 'c-inf' ? 'Ingeniería Informática' : 'Ingeniería Industrial',
  },
  month: '2026-10',
  entries,
});

const legends = (facultyId: string, names: string[]): Legends => ({
  faculty: { id: facultyId, name: facultyId },
  entries: names.map((username) => ({ username, displayName: null })),
  truncated: false,
});

afterEach(cleanup);

describe('RankingPage (/ranking)', () => {
  beforeEach(() => {
    resetUbicacionStore();
    window.localStorage.clear();
    mocks.user = null;
    mocks.isLoading = false;
    mocks.searchParams = new URLSearchParams();
    mocks.replace.mockReset();
    mocks.institutions.mockReset().mockResolvedValue(tree);
    mocks.monthly.mockReset().mockImplementation(async (id?: string) => monthly(id ?? 'c-ind'));
    mocks.monthlyMe.mockReset();
    mocks.legends
      .mockReset()
      .mockImplementation(async (id?: string) =>
        legends(id ?? 'f-fce', id === 'f-fi' ? ['zoe', 'abel'] : ['carla']),
      );
    mocks.legendsMe.mockReset();
  });

  it('shows a visitor the first carrera this month with ranks, «Nv.» and points', async () => {
    render(<RankingPage />);

    const list = await screen.findByRole('list', { name: 'Este mes en Ingeniería Industrial' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('1.º');
    expect(items[0]).toHaveTextContent('Nv. 4');
    expect(items[0]).toHaveTextContent('30 pts');
    expect(items[1]).toHaveTextContent('1.º');
    expect(items[2]).toHaveTextContent('3.º');
    expect(within(items[0]).getByRole('link', { name: 'Ana' })).toHaveAttribute(
      'href',
      '/usuarios/ana',
    );
    expect(mocks.monthly).toHaveBeenCalledWith(undefined);
    expect(mocks.monthlyMe).not.toHaveBeenCalled();
    expect(screen.getByRole('combobox', { name: 'Carrera' })).toHaveValue('c-ind');
    expect(screen.queryByText(/global|semanal|de todos los tiempos/i)).toBeNull();
  });

  it('syncs the two tabs to ?tab=', async () => {
    render(<RankingPage />);
    const tabs = await screen.findAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Este mes en tu carrera',
      'Leyendas de la facultad',
    ]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(tabs[1]);
    expect(mocks.replace).toHaveBeenCalledWith('/ranking?tab=leyendas', { scroll: false });
  });

  it('opens Leyendas from ?tab=leyendas, ordered as returned, with the facultad select', async () => {
    mocks.searchParams = new URLSearchParams('tab=leyendas');
    render(<RankingPage />);

    const list = await screen.findByRole('list', { name: 'Leyendas de f-fce' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['carla']);
    expect(screen.getByRole('tab', { name: 'Leyendas de la facultad' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Facultad' }), {
      target: { value: 'f-fi' },
    });
    const fi = await screen.findByRole('list', { name: 'Leyendas de f-fi' });
    expect(
      within(fi)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['zoe', 'abel']);
    expect(mocks.legends).toHaveBeenLastCalledWith('f-fi');
  });

  it('defaults Leyendas to the viewer’s facultad', async () => {
    mocks.user = { id: 'u1', username: 'max' };
    mocks.searchParams = new URLSearchParams('tab=leyendas');
    mocks.legendsMe.mockResolvedValue({ defaultFacultyId: 'f-fi' });
    render(<RankingPage />);

    await screen.findByRole('list', { name: 'Leyendas de f-fi' });
    expect(mocks.legends).toHaveBeenCalledWith('f-fi');
    expect(screen.getByRole('combobox', { name: 'Facultad' })).toHaveValue('f-fi');
  });

  it('defaults to the viewer’s carrera and shows «Tu posición» outside the top 10', async () => {
    mocks.user = { id: 'u1', username: 'max' };
    mocks.monthlyMe.mockResolvedValue({
      careerId: 'c-inf',
      defaultCareerId: 'c-inf',
      me: { rank: 14, points: 3 },
    });
    render(<RankingPage />);

    await screen.findByRole('list', { name: 'Este mes en Ingeniería Informática' });
    expect(mocks.monthly).toHaveBeenCalledWith('c-inf');
    const mine = screen.getByRole('region', { name: 'Tu posición' });
    expect(mine).toHaveTextContent('14.º');
    expect(mine).toHaveTextContent('3 pts');
  });

  it('hides «Tu posición» inside the top 10 and changes the list with the select', async () => {
    mocks.user = { id: 'u1', username: 'max' };
    mocks.monthlyMe.mockImplementation(async (id?: string) => ({
      careerId: id ?? 'c-inf',
      defaultCareerId: 'c-inf',
      me: id === 'c-ind' ? null : { rank: 2, points: 25 },
    }));
    render(<RankingPage />);
    await screen.findByRole('list', { name: 'Este mes en Ingeniería Informática' });
    expect(screen.queryByRole('region', { name: 'Tu posición' })).toBeNull();

    fireEvent.change(screen.getByRole('combobox', { name: 'Carrera' }), {
      target: { value: 'c-ind' },
    });
    await screen.findByRole('list', { name: 'Este mes en Ingeniería Industrial' });
    expect(mocks.monthly).toHaveBeenLastCalledWith('c-ind');
    expect(mocks.monthlyMe).toHaveBeenLastCalledWith('c-ind');
  });

  it('shows the empty month and an error with retry', async () => {
    mocks.monthly.mockResolvedValueOnce(monthly('c-ind', []));
    render(<RankingPage />);
    expect(
      await screen.findByText('Todavía nadie sumó puntos este mes en esta carrera.'),
    ).toBeInTheDocument();
    cleanup();

    mocks.monthly.mockRejectedValueOnce(new Error('boom'));
    render(<RankingPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    await waitFor(() =>
      expect(
        screen.getByRole('list', { name: 'Este mes en Ingeniería Industrial' }),
      ).toBeInTheDocument(),
    );
  });

  it('still shows the public lists when the viewer’s own request fails', async () => {
    mocks.user = { id: 'u1', username: 'max' };
    mocks.monthlyMe.mockRejectedValue(new Error('401'));
    mocks.legendsMe.mockRejectedValue(new Error('401'));
    render(<RankingPage />);
    await screen.findByRole('list', { name: 'Este mes en Ingeniería Industrial' });
    expect(mocks.monthly).toHaveBeenCalledWith(undefined);
    cleanup();

    mocks.searchParams = new URLSearchParams('tab=leyendas');
    render(<RankingPage />);
    await screen.findByRole('list', { name: 'Leyendas de f-fce' });
  });

  it('moves between tabs with the arrow keys and keeps one tab in the tab order', async () => {
    render(<RankingPage />);
    const [mes, leyendas] = await screen.findAllByRole('tab');
    expect(mes).toHaveAttribute('tabindex', '0');
    expect(leyendas).toHaveAttribute('tabindex', '-1');
    expect(mes).toHaveAttribute('aria-controls', 'ranking-panel-mes');
    expect(leyendas).not.toHaveAttribute('aria-controls');

    fireEvent.keyDown(mes, { key: 'ArrowRight' });
    expect(mocks.replace).toHaveBeenCalledWith('/ranking?tab=leyendas', { scroll: false });
  });

  it('says when the carreras could not load, and keeps the list', async () => {
    mocks.institutions.mockRejectedValue(new Error('boom'));
    render(<RankingPage />);
    await screen.findByRole('list', { name: 'Este mes en Ingeniería Industrial' });
    expect(
      screen.getByText('No pudimos cargar las carreras y facultades para elegir otra.'),
    ).toBeInTheDocument();
  });

  it('starts a visitor at the first carrera of their ubicación', async () => {
    window.localStorage.setItem(
      UBICACION_STORAGE_KEY,
      JSON.stringify({
        universityId: 'u-unju',
        universityShortName: 'UNJU',
        facultyId: 'f-fce',
        facultyShortName: 'FCE',
      }),
    );
    render(<RankingPage />);
    await waitFor(() => expect(mocks.monthly).toHaveBeenCalledWith('c-cont'));
    expect(mocks.monthly).not.toHaveBeenCalledWith(undefined);
    expect(await screen.findByRole('combobox', { name: 'Carrera' })).toHaveValue('c-cont');
  });

  it('starts Leyendas at the ubicación’s facultad', async () => {
    window.localStorage.setItem(
      UBICACION_STORAGE_KEY,
      JSON.stringify({
        universityId: 'u-unju',
        universityShortName: 'UNJU',
        facultyId: 'f-fi',
        facultyShortName: 'FI',
      }),
    );
    mocks.searchParams = new URLSearchParams('tab=leyendas');
    render(<RankingPage />);
    await screen.findByRole('list', { name: 'Leyendas de f-fi' });
    expect(mocks.legends).toHaveBeenCalledWith('f-fi');
    expect(mocks.legendsMe).not.toHaveBeenCalled();
  });
});
