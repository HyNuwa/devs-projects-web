import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';

import { getFacultyBrowse, type FacultyPage } from '@/lib/catalog-client';
import { getGroupedSuggestions } from '@/lib/discovery-client';
import { getExperiencesOverview, type ExperiencesOverview } from '@/lib/experiences-client';
import { resetUbicacionStore, useUbicacionStore } from '@/stores/ubicacionStore';
import { useAuthStore } from '@/stores/authStore';
import type { DeclaredCareer } from '@/lib/study-plans-client';
import type { User } from '@/types/auth';

import { ExperiencesLanding } from './ExperiencesLanding';

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.searchParams,
}));

vi.mock('@/components/layout/UbicacionChip', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/layout/UbicacionChip')>();
  return {
    ...actual,
    UbicacionPanel: ({
      onSave,
    }: {
      onSave: (next: import('@/stores/ubicacionStore').Ubicacion) => void;
    }) => (
      <button
        onClick={() =>
          onSave({
            facultyId: '20000000-0000-4000-8000-0000000000f2',
            facultyShortName: 'FHyCS',
            universityId: 'uni-1',
            universityShortName: 'UNJu',
          })
        }
        type="button"
      >
        elegir otra facultad
      </button>
    ),
  };
});

vi.mock('@/lib/catalog-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/catalog-client')>();
  return { ...actual, getFacultyBrowse: vi.fn() };
});

vi.mock('@/lib/experiences-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/experiences-client')>();
  return { ...actual, getExperiencesOverview: vi.fn() };
});

vi.mock('@/lib/discovery-client', () => ({ getGroupedSuggestions: vi.fn() }));

const facultyId = '20000000-0000-4000-8000-0000000000f1';
const careerId = '20000000-0000-4000-8000-0000000000c1';
const otherCareerId = '20000000-0000-4000-8000-0000000000c2';

const ubicacion = {
  facultyId,
  facultyShortName: 'FI',
  universityId: 'uni-1',
  universityShortName: 'UNJu',
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}
const facultyPage: FacultyPage = {
  careers: [
    {
      code: 'II',
      id: careerId,
      materialCount: 0,
      name: 'Ing. Informática',
      slug: 'ii',
      subjectCount: 0,
      years: 5,
    },
    {
      code: 'OP',
      id: otherCareerId,
      materialCount: 0,
      name: 'Optativa libre',
      slug: 'op',
      subjectCount: 0,
      years: null,
    },
  ],
  faculty: { id: facultyId, name: 'Facultad de Ingeniería', shortName: 'FI', slug: 'fi' },
  university: { id: 'uni-1', name: 'Universidad Nacional', shortName: 'UNJu', slug: 'unju' },
};

const reviewEntry: ExperiencesOverview['recent'][number] = {
  kind: 'review',
  review: {
    academicYear: 2025,
    attempt: 'PRIMERA_CURSADA',
    author: { username: 'Anónimo' },
    condition: 'REGULAR',
    createdAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
    difficulty: 'ALTA',
    excerpt: 'Texto corto.',
    id: 'review-1',
    professor: null,
    professorName: null,
    recommendation: 4,
    shift: 'TARDE',
    subject: { code: '06', href: '/materias/06', id: 's1', name: 'Análisis II' },
    updatedAt: new Date().toISOString(),
  },
};

function overview(overrides: Partial<ExperiencesOverview> = {}): ExperiencesOverview {
  return {
    mostCommented: {
      items: [
        {
          approval: { answered: 2, approved: 1, percent: null },
          latestAt: new Date().toISOString(),
          placement: {
            careerId,
            careerName: 'Ing. Informática',
            semester: 1,
            year: 2,
          },
          promotion: { answered: 5, percent: 60, promoted: 3 },
          recentCount: 8,
          subject: { code: '06', id: 's1', name: 'Análisis Matemático II' },
          topDifficulty: 'ALTA',
          total: 15,
        },
      ],
      window: 'LAST_120_DAYS',
    },
    recent: [reviewEntry],
    scope: { careerId: null, facultyId, kind: null, year: null },
    ...overrides,
  };
}

const signedInUser: User = {
  avatarUrl: null,
  bio: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  displayName: null,
  email: 'estudiante@example.com',
  emailVerified: true,
  id: 'viewer-1',
  role: 'USER',
  updatedAt: '2026-01-01T00:00:00.000Z',
  username: 'estudiante',
};

function declaredCareer(facId: string): DeclaredCareer {
  return {
    career: { code: 'II', id: careerId, name: 'Ing. Informática' },
    careerId,
    declaredAt: '2026-01-01T00:00:00.000Z',
    faculty: { id: facId, name: 'Facultad', shortName: 'FI' },
    status: 'ACTIVE',
    university: { id: 'uni-1', name: 'Universidad', shortName: 'UNJu' },
  };
}

function setStore(overrides: Partial<Parameters<typeof useUbicacionStore.setState>[0]> = {}) {
  resetUbicacionStore();
  useUbicacionStore.setState({
    load: async () => {},
    myCareers: [],
    ready: true,
    ubicacion,
    ...overrides,
  });
}

describe('ExperiencesLanding', () => {
  beforeEach(() => {
    navigation.push.mockReset();
    navigation.searchParams = new URLSearchParams();
    vi.mocked(getFacultyBrowse).mockReset();
    vi.mocked(getFacultyBrowse).mockResolvedValue(facultyPage);
    vi.mocked(getExperiencesOverview).mockReset();
    vi.mocked(getExperiencesOverview).mockResolvedValue(overview());
    vi.mocked(getGroupedSuggestions).mockResolvedValue({
      materials: [],
      subjects: [],
    });
    useAuthStore.setState({ isLoading: false, user: null });
    setStore();
  });

  afterEach(cleanup);

  it('names the facultad, scopes the overview and describes the window', async () => {
    render(<ExperiencesLanding />);

    expect(await screen.findByText('UNJu · FI')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Materias más comentadas' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(getExperiencesOverview).toHaveBeenCalledWith(expect.objectContaining({ facultyId })),
    );
    expect(
      screen.getByText(/Facultad de Ingeniería · todas las carreras · últimos meses/),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver todas las materias' })).toHaveAttribute(
      'href',
      '/universidades/unju/fi',
    );
  });

  it('preselects the signed-in student’s carrera cursando when it matches the facultad', async () => {
    useAuthStore.setState({ isLoading: false, user: signedInUser });
    setStore({ myCareers: [declaredCareer(facultyId)] });
    render(<ExperiencesLanding />);

    expect(await screen.findByText('tomado de tu perfil')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Ing. Informática' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByText(/plan/i)).not.toBeInTheDocument();
    await waitFor(() =>
      expect(getExperiencesOverview).toHaveBeenCalledWith(expect.objectContaining({ careerId })),
    );
  });

  it('does not preselect a carrera from another facultad', async () => {
    useAuthStore.setState({ isLoading: false, user: signedInUser });
    setStore({ myCareers: [declaredCareer('other-faculty')] });
    render(<ExperiencesLanding />);

    expect(await screen.findByRole('heading', { name: 'Materias más comentadas' }));
    expect(screen.queryByText('tomado de tu perfil')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(getExperiencesOverview).toHaveBeenCalledWith(
        expect.not.objectContaining({ careerId }),
      ),
    );
  });

  it('pushes carrera, año and tipo into the URL and the request', async () => {
    const user = userEvent.setup();
    navigation.searchParams = new URLSearchParams(`carrera=${careerId}`);
    render(<ExperiencesLanding />);

    await user.click(await screen.findByRole('button', { name: '3°' }));
    expect(navigation.push).toHaveBeenLastCalledWith(`/experiencias?carrera=${careerId}&anio=3`);

    await user.click(screen.getByRole('button', { name: 'Solo finales' }));
    expect(navigation.push).toHaveBeenLastCalledWith(
      `/experiencias?carrera=${careerId}&tipo=finales`,
    );
  });

  it.each(['pending', 'failed', 'another faculty'])(
    'keeps URL carrera and año while the browse is %s',
    async (status) => {
      const user = userEvent.setup();
      navigation.searchParams = new URLSearchParams(`carrera=${careerId}&anio=2`);
      if (status === 'pending') {
        vi.mocked(getFacultyBrowse).mockReturnValue(new Promise(() => {}));
      } else if (status === 'failed') {
        vi.mocked(getFacultyBrowse).mockRejectedValue(new Error('down'));
      } else {
        vi.mocked(getFacultyBrowse).mockResolvedValue({
          ...facultyPage,
          faculty: { ...facultyPage.faculty, id: 'another-faculty' },
        });
      }
      const { rerender } = render(<ExperiencesLanding />);

      await user.click(await screen.findByRole('button', { name: 'Solo finales' }));
      expect(navigation.push).toHaveBeenLastCalledWith(
        `/experiencias?carrera=${careerId}&anio=2&tipo=finales`,
      );
      expect(getExperiencesOverview).toHaveBeenLastCalledWith({ careerId, facultyId, year: 2 });

      navigation.searchParams = new URLSearchParams(
        String(navigation.push.mock.lastCall?.[0]).split('?')[1],
      );
      rerender(<ExperiencesLanding />);
      await waitFor(() =>
        expect(getExperiencesOverview).toHaveBeenLastCalledWith({
          careerId,
          facultyId,
          kind: 'exams',
          year: 2,
        }),
      );
    },
  );

  it('carries the active carrera into the most-commented subject links', async () => {
    navigation.searchParams = new URLSearchParams(`carrera=${careerId}`);
    render(<ExperiencesLanding />);

    expect(await screen.findByRole('link', { name: /Análisis Matemático II/i })).toHaveAttribute(
      'href',
      `/experiencias/06?carrera=${careerId}`,
    );
  });

  it('shows no año chips beyond «Todos» for an optativa-only carrera', async () => {
    navigation.searchParams = new URLSearchParams(`carrera=${otherCareerId}`);
    render(<ExperiencesLanding />);

    expect(await screen.findByRole('button', { name: 'Todos' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1°' })).not.toBeInTheDocument();
  });

  it('offers the ubicación invitation and no chips without an Ubicación', async () => {
    setStore({ ubicacion: null });
    vi.mocked(getExperiencesOverview).mockResolvedValue(
      overview({ scope: { careerId: null, facultyId: null, kind: null, year: null } }),
    );
    render(<ExperiencesLanding />);

    expect(
      await screen.findByText(/elegí tu facultad para ver las experiencias/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Todas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1°' })).not.toBeInTheDocument();
    expect(
      await screen.findByText(/todas las facultades · todas las carreras/),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(getExperiencesOverview).toHaveBeenCalledWith(
        expect.not.objectContaining({ facultyId }),
      ),
    );
  });

  it('scopes to all facultades regardless of URL scope without an Ubicación', async () => {
    setStore({ ubicacion: null });
    navigation.searchParams = new URLSearchParams(`carrera=${careerId}&anio=2&tipo=finales`);
    render(<ExperiencesLanding />);

    await waitFor(() => expect(getExperiencesOverview).toHaveBeenCalledWith({ kind: 'exams' }));
    expect(screen.queryByRole('button', { name: 'Todas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1°' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solo finales' })).toBeInTheDocument();
  });

  it('clears carrera and año and keeps tipo when the facultad changes', async () => {
    const user = userEvent.setup();
    navigation.searchParams = new URLSearchParams(`carrera=${careerId}&anio=2&tipo=finales`);
    render(<ExperiencesLanding />);

    await user.click(await screen.findByRole('button', { name: 'Cambiar' }));
    await user.click(screen.getByRole('button', { name: 'elegir otra facultad' }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/experiencias?tipo=finales'));
    // The page owns the clearing: the dialog save never pushes a second time.
    expect(navigation.push).toHaveBeenCalledTimes(1);
  });

  it('keeps hero, context, «Tu turno» and «Cómo leer» while the overview is deferred', async () => {
    vi.mocked(getExperiencesOverview).mockReturnValue(new Promise(() => {}));
    render(<ExperiencesLanding />);

    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /cómo les fue/i })).toBeInTheDocument();
    expect(screen.getByText('UNJu · FI')).toBeInTheDocument();
    expect(screen.getByText('Tu turno')).toBeInTheDocument();
    expect(screen.getByText('Cómo leer una experiencia')).toBeInTheDocument();
  });

  it('lets an explicit «Todas» clear the signed-in carrera preselect', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ isLoading: false, user: signedInUser });
    setStore({ myCareers: [declaredCareer(facultyId)] });
    render(<ExperiencesLanding />);

    // Implicit preselect: active chip, no URL write.
    expect(await screen.findByText('tomado de tu perfil')).toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();

    await user.click(await screen.findByRole('button', { name: 'Todas' }));
    expect(navigation.push).toHaveBeenCalledWith('/experiencias?carrera=todas');
  });

  it('does not preselect the profile carrera under an explicit «Todas» URL', async () => {
    useAuthStore.setState({ isLoading: false, user: signedInUser });
    setStore({ myCareers: [declaredCareer(facultyId)] });
    navigation.searchParams = new URLSearchParams('carrera=todas');
    render(<ExperiencesLanding />);

    expect(
      await screen.findByRole('heading', { name: 'Materias más comentadas' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('tomado de tu perfil')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(getExperiencesOverview).toHaveBeenCalledWith(
        expect.not.objectContaining({ careerId }),
      ),
    );
  });

  it('exposes a retry for the carrera filters when the facultad browse fails', async () => {
    const user = userEvent.setup();
    const once = deferred<FacultyPage>();
    vi.mocked(getFacultyBrowse).mockReturnValueOnce(once.promise).mockResolvedValue(facultyPage);
    render(<ExperiencesLanding />);

    once.reject(new Error('down'));
    const retry = await screen.findByRole('button', { name: 'Reintentar' });
    await user.click(retry);

    await waitFor(() => expect(getFacultyBrowse).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('button', { name: 'Ing. Informática' })).toBeInTheDocument();
    await waitFor(() =>
      expect(getExperiencesOverview).toHaveBeenCalledWith(expect.objectContaining({ facultyId })),
    );
  });

  it('describes experiencias as cursada or final, never only cursada', async () => {
    render(<ExperiencesLanding />);

    expect(await screen.findByText(/una cursada o un final concretos/i)).toBeInTheDocument();
  });

  it('reads «de siempre» for ALL_TIME and the empty card for an empty context', async () => {
    vi.mocked(getExperiencesOverview).mockResolvedValue(
      overview({
        mostCommented: { items: [], window: 'ALL_TIME' },
        recent: [],
      }),
    );
    render(<ExperiencesLanding />);

    expect(await screen.findByText(/de siempre/)).toBeInTheDocument();
    expect(
      screen.getAllByText(/Todavía no hay experiencias en Facultad de Ingeniería/),
    ).not.toHaveLength(0);
    expect(screen.getAllByRole('link', { name: 'Escribir la primera' })[0]).toHaveAttribute(
      'href',
      '/experiencias/escribir',
    );
    expect(
      screen.getByRole('button', { name: 'Ver las de todas las facultades' }),
    ).toBeInTheDocument();
  });

  it.each([
    { tipo: '', kind: null },
    { tipo: 'resenas', kind: 'reviews' },
    { tipo: 'finales', kind: 'exams' },
  ] as const)(
    'repeats the empty overview across facultades keeping tipo=$tipo',
    async ({ tipo, kind }) => {
      const user = userEvent.setup();
      navigation.searchParams = new URLSearchParams(
        `carrera=${careerId}&anio=2${tipo ? `&tipo=${tipo}` : ''}`,
      );
      vi.mocked(getExperiencesOverview).mockImplementation(async (query) =>
        overview({
          mostCommented: { items: [], window: 'ALL_TIME' },
          recent: [],
          scope: {
            careerId: query.careerId ?? null,
            facultyId: query.facultyId ?? null,
            kind,
            year: query.year ?? null,
          },
        }),
      );
      render(<ExperiencesLanding />);

      await user.click(
        await screen.findByRole('button', { name: 'Ver las de todas las facultades' }),
      );
      await waitFor(() =>
        expect(getExperiencesOverview).toHaveBeenLastCalledWith(kind ? { kind } : {}),
      );
      expect(
        await screen.findByText(/todas las facultades · todas las carreras/),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Las últimas experiencias de todas las facultades.'),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Ver las de todas las facultades' }),
      ).not.toBeInTheDocument();
      expect(navigation.push).not.toHaveBeenCalled();
      expect(useUbicacionStore.getState().ubicacion).toEqual(ubicacion);
    },
  );

  it('keeps the global type-only scope when retrying a failed expansion', async () => {
    const user = userEvent.setup();
    navigation.searchParams = new URLSearchParams(`carrera=${careerId}&anio=2&tipo=finales`);
    let globalAttempts = 0;
    vi.mocked(getExperiencesOverview).mockImplementation(async (query) => {
      if (!query.facultyId && globalAttempts++ === 0) throw new Error('down');
      return overview({
        recent: [],
        scope: { careerId: null, facultyId: query.facultyId ?? null, kind: 'exams', year: null },
      });
    });
    render(<ExperiencesLanding />);

    await user.click(
      await screen.findByRole('button', { name: 'Ver las de todas las facultades' }),
    );
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(
      await screen.findByText(/todas las facultades · todas las carreras/),
    ).toBeInTheDocument();
    expect(getExperiencesOverview).toHaveBeenLastCalledWith({ kind: 'exams' });
    expect(globalAttempts).toBe(2);
  });

  it('shows «aprobaron X de Y» for Solo finales instead of a hidden percent', async () => {
    navigation.searchParams = new URLSearchParams('tipo=finales');
    vi.mocked(getExperiencesOverview).mockResolvedValue(
      overview({
        scope: { careerId: null, facultyId, kind: 'exams', year: null },
      }),
    );
    render(<ExperiencesLanding />);

    expect(await screen.findByText('aprobaron 1 de 2')).toBeInTheDocument();
    expect(screen.queryByText(/promocionó/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver todos los finales' })).toHaveAttribute(
      'href',
      '/finales',
    );
    expect(screen.queryByRole('link', { name: 'Ver todas las reseñas' })).not.toBeInTheDocument();
  });

  it('keeps approval counts above the mínimo de muestra for Solo finales', async () => {
    navigation.searchParams = new URLSearchParams('tipo=finales');
    const data = overview();
    vi.mocked(getExperiencesOverview).mockResolvedValue({
      ...data,
      mostCommented: {
        ...data.mostCommented,
        items: [
          { ...data.mostCommented.items[0], approval: { answered: 10, approved: 8, percent: 80 } },
        ],
      },
      scope: { careerId: null, facultyId, kind: 'exams', year: null },
    });
    render(<ExperiencesLanding />);

    expect(await screen.findByText('aprobaron 8 de 10')).toBeInTheDocument();
    expect(screen.queryByText('80%')).not.toBeInTheDocument();
  });

  it('points «Ver todas las materias» at the carrera page when a chip is active', async () => {
    navigation.searchParams = new URLSearchParams(`carrera=${careerId}`);
    render(<ExperiencesLanding />);

    expect(await screen.findByRole('link', { name: 'Ver todas las materias' })).toHaveAttribute(
      'href',
      '/universidades/unju/fi/ii',
    );
  });

  it('keeps hero, context, «Tu turno» and «Cómo leer» on error and retries', async () => {
    const user = userEvent.setup();
    vi.mocked(getExperiencesOverview)
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce(overview());
    render(<ExperiencesLanding />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('UNJu · FI')).toBeInTheDocument();
    expect(screen.getByText('Tu turno')).toBeInTheDocument();
    expect(screen.getByText('Cómo leer una experiencia')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /cómo les fue/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(
      await screen.findByRole('heading', { name: 'Materias más comentadas' }),
    ).toBeInTheDocument();
    expect(getExperiencesOverview).toHaveBeenCalledTimes(2);
  });

  it('links «Escribir experiencia» to the chooser', async () => {
    render(<ExperiencesLanding />);

    expect(await screen.findByRole('link', { name: 'Escribir experiencia' })).toHaveAttribute(
      'href',
      '/experiencias/escribir',
    );
  });

  it('treats a URL carrera outside the browse as «Todas», not as the profile', async () => {
    const outOfScopeId = '20000000-0000-4000-8000-0000000000aa';
    useAuthStore.setState({ isLoading: false, user: signedInUser });
    setStore({ myCareers: [declaredCareer(facultyId)] });
    navigation.searchParams = new URLSearchParams(`carrera=${outOfScopeId}`);
    render(<ExperiencesLanding />);

    await waitFor(() => expect(getExperiencesOverview).toHaveBeenLastCalledWith({ facultyId }));
    expect(getExperiencesOverview).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ careerId: outOfScopeId }),
    );
    // It also never falls back to the signed-in profile carrera.
    expect(getExperiencesOverview).not.toHaveBeenCalledWith(expect.objectContaining({ careerId }));
    expect(await screen.findByText(/todas las carreras/)).toBeInTheDocument();
  });

  it('drops an año outside the carrera placement years', async () => {
    navigation.searchParams = new URLSearchParams(`carrera=${careerId}&anio=9`);
    render(<ExperiencesLanding />);

    await waitFor(() => expect(getFacultyBrowse).toHaveBeenCalled());
    await waitFor(() =>
      expect(getExperiencesOverview).toHaveBeenLastCalledWith({ careerId, facultyId }),
    );
    expect(getExperiencesOverview).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ year: 9 }),
    );
  });

  it('drops the año on an optativa-only carrera', async () => {
    navigation.searchParams = new URLSearchParams(`carrera=${otherCareerId}&anio=2`);
    render(<ExperiencesLanding />);

    await waitFor(() => expect(getFacultyBrowse).toHaveBeenCalled());
    await waitFor(() =>
      expect(getExperiencesOverview).toHaveBeenLastCalledWith({
        careerId: otherCareerId,
        facultyId,
      }),
    );
    expect(getExperiencesOverview).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ year: 2 }),
    );
  });

  it('suppresses the hidden URL carrera after the ubicación changes elsewhere', async () => {
    navigation.searchParams = new URLSearchParams(`carrera=${careerId}`);
    render(<ExperiencesLanding />);
    await waitFor(() =>
      expect(getExperiencesOverview).toHaveBeenLastCalledWith(
        expect.objectContaining({ careerId }),
      ),
    );

    // A header-level change swaps the store without touching this page's URL.
    useUbicacionStore.setState({
      ubicacion: {
        facultyId: '20000000-0000-4000-8000-0000000000f2',
        facultyShortName: 'FHyCS',
        universityId: 'uni-1',
        universityShortName: 'UNJu',
      },
    });
    vi.mocked(getFacultyBrowse).mockResolvedValueOnce({
      ...facultyPage,
      careers: [],
      faculty: {
        id: '20000000-0000-4000-8000-0000000000f2',
        name: 'FHyCS',
        shortName: 'FHyCS',
        slug: 'fhycs',
      },
    });
    await waitFor(() =>
      expect(getExperiencesOverview).toHaveBeenLastCalledWith({
        facultyId: '20000000-0000-4000-8000-0000000000f2',
      }),
    );
    expect(getExperiencesOverview).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ careerId }),
    );
  });

  it('never applies a year the implicit profile carrera cannot have', async () => {
    // The preselected profile carrera is optativa-only (years: null in browse).
    useAuthStore.setState({ isLoading: false, user: signedInUser });
    setStore({
      myCareers: [
        {
          ...declaredCareer(facultyId),
          career: { code: 'OP', id: otherCareerId, name: 'Optativa libre' },
          careerId: otherCareerId,
        },
      ],
    });
    navigation.searchParams = new URLSearchParams('anio=2');
    render(<ExperiencesLanding />);

    await waitFor(() =>
      expect(getExperiencesOverview).toHaveBeenLastCalledWith(
        expect.objectContaining({ careerId: otherCareerId }),
      ),
    );
    expect(getExperiencesOverview).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ year: 2 }),
    );
  });

  it('never applies a year beyond the faculty maximum when «Todas» is picked', async () => {
    // Published placement max is 5 (II); anio=9 has no matching chip.
    navigation.searchParams = new URLSearchParams('carrera=todas&anio=9');
    render(<ExperiencesLanding />);

    await waitFor(() => expect(getExperiencesOverview).toHaveBeenLastCalledWith({ facultyId }));
    expect(getExperiencesOverview).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ year: 9 }),
    );
  });

  it('never applies the profile carrera when the fresh browse lacks it', async () => {
    useAuthStore.setState({ isLoading: false, user: signedInUser });
    setStore({
      myCareers: [
        {
          ...declaredCareer(facultyId),
          career: {
            code: 'XX',
            id: '20000000-0000-4000-8000-0000000000cc',
            name: 'No publicada',
          },
          careerId: '20000000-0000-4000-8000-0000000000cc',
        },
      ],
    });
    render(<ExperiencesLanding />);

    await waitFor(() =>
      expect(getExperiencesOverview).toHaveBeenLastCalledWith(
        expect.objectContaining({ facultyId }),
      ),
    );
    expect(getExperiencesOverview).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ careerId: '20000000-0000-4000-8000-0000000000cc' }),
    );
  });

  describe('facultad changed from the header', () => {
    const otherUbicacion = {
      facultyId: '20000000-0000-4000-8000-0000000000f2',
      facultyShortName: 'FHyCS',
      universityId: 'uni-1',
      universityShortName: 'UNJu',
    };

    // Next re-renders the page with the pushed URL; the fake router does too.
    function followLastPush(rerender: (ui: ReactElement) => void) {
      const href = String(navigation.push.mock.lastCall?.[0]);
      navigation.searchParams = new URLSearchParams(href.split('?')[1] ?? '');
      rerender(<ExperiencesLanding />);
    }

    it('clears carrera and año once, keeps tipo, and never writes on hydration', async () => {
      navigation.searchParams = new URLSearchParams(`carrera=${careerId}&anio=2&tipo=resenas`);
      const { rerender } = render(<ExperiencesLanding />);
      await waitFor(() =>
        expect(getExperiencesOverview).toHaveBeenLastCalledWith(
          expect.objectContaining({ careerId, year: 2 }),
        ),
      );
      expect(navigation.push).not.toHaveBeenCalled();

      useUbicacionStore.setState({ ubicacion: otherUbicacion });
      await waitFor(() =>
        expect(navigation.push).toHaveBeenCalledWith('/experiencias?tipo=resenas'),
      );
      followLastPush(rerender);
      await waitFor(() =>
        expect(getExperiencesOverview).toHaveBeenLastCalledWith(
          expect.objectContaining({ facultyId: otherUbicacion.facultyId }),
        ),
      );
      expect(navigation.push).toHaveBeenCalledTimes(1);
    });

    it('keeps an explicit «Todas» and drops a valid old año', async () => {
      useAuthStore.setState({ isLoading: false, user: signedInUser });
      setStore({ myCareers: [declaredCareer(otherUbicacion.facultyId)] });
      navigation.searchParams = new URLSearchParams('carrera=todas&anio=2');
      const { rerender } = render(<ExperiencesLanding />);
      await waitFor(() =>
        expect(getExperiencesOverview).toHaveBeenLastCalledWith(
          expect.objectContaining({ year: 2 }),
        ),
      );

      useUbicacionStore.setState({ ubicacion: otherUbicacion });
      await waitFor(() =>
        expect(navigation.push).toHaveBeenCalledWith('/experiencias?carrera=todas'),
      );
      followLastPush(rerender);
      expect(navigation.push).toHaveBeenCalledTimes(1);
    });

    it('writes nothing when no carrera or año was in scope', async () => {
      navigation.searchParams = new URLSearchParams('tipo=finales');
      render(<ExperiencesLanding />);
      await waitFor(() => expect(getExperiencesOverview).toHaveBeenCalled());

      useUbicacionStore.setState({ ubicacion: otherUbicacion });
      await waitFor(() =>
        expect(getExperiencesOverview).toHaveBeenLastCalledWith(
          expect.objectContaining({ facultyId: otherUbicacion.facultyId }),
        ),
      );
      expect(navigation.push).not.toHaveBeenCalled();
    });
  });
});
