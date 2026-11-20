import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getCourseReviewDiscovery, getExamExperienceDiscovery } from '@/lib/discovery-client';
import { parseSubjectExperiencesState } from '@/lib/subject-experiences-state';
import type { SubjectExperiencesState } from '@/lib/subject-experiences-state';
import type {
  DiscoveryCourseReview,
  DiscoveryCourseReviewList,
  DiscoveryExamExperience,
  DiscoveryExamExperienceList,
} from '@/types/discovery';
import type { SubjectHub } from '@/types/subject';

import { ExperienceTabs } from './ExperienceTabs';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
}));

vi.mock('@/lib/api', () => ({ api: { post: vi.fn() } }));
vi.mock('@/lib/discovery-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/discovery-client')>()),
  getCourseReviewDiscovery: vi.fn(),
  getExamExperienceDiscovery: vi.fn(),
}));

const subjectId = '50000000-0000-4000-8000-000000000001';
const professorId = '60000000-0000-4000-8000-0000000000a1';
const unknownProfessorId = '60000000-0000-4000-8000-0000000000bb';

const subject = {
  id: subjectId,
  professors: [{ professor: { bio: null, id: professorId, name: 'Ing. Quiroga' } }],
  studyPlans: [],
} as unknown as SubjectHub;

function review(overrides: Partial<DiscoveryCourseReview> = {}): DiscoveryCourseReview {
  return {
    academicYear: 2025,
    attempt: 'PRIMERA_CURSADA',
    author: { avatarCat: null, avatarUrl: null, id: 'u1', username: 'luciana' },
    condition: 'REGULAR',
    createdAt: '2026-09-13T12:00:00.000Z',
    difficulty: 'MEDIA',
    excerpt: 'Bastante pesada pero promocionable.',
    id: 'r1',
    professor: { id: professorId, name: 'Ing. Quiroga' },
    professorName: null,
    recommendation: 4,
    shift: 'TARDE',
    subject: { code: '06', href: '/materias/06', id: subjectId, name: 'Análisis Matemático II' },
    updatedAt: '2026-09-13T12:00:00.000Z',
    ...overrides,
  };
}

function exam(overrides: Partial<DiscoveryExamExperience> = {}): DiscoveryExamExperience {
  return {
    author: { username: 'Anónimo' },
    createdAt: '2026-09-14T12:00:00.000Z',
    excerpt: 'Tomaron todo del práctico.',
    difficulty: 'ALTA',
    format: 'ESCRITO',
    id: 'e1',
    outcome: 'APROBADO',
    session: 'DICIEMBRE',
    shift: 'NO_INDICO',
    subject: { code: '06', href: '/materias/06', id: subjectId, name: 'Análisis Matemático II' },
    updatedAt: '2026-09-14T12:00:00.000Z',
    year: 2024,
    ...overrides,
  };
}

const reviewPage = (items: DiscoveryCourseReview[], total: number): DiscoveryCourseReviewList => ({
  aggregate: { averageRecommendation: null, reviewCount: items.length },
  data: items,
  meta: { limit: 10, page: 1, total, totalPages: Math.ceil(total / 10) },
});

const examPage = (
  items: DiscoveryExamExperience[],
  total: number,
): DiscoveryExamExperienceList => ({
  data: items,
  meta: { limit: 10, page: 1, total, totalPages: Math.ceil(total / 10) },
});

function stateOf(overrides: Partial<SubjectExperiencesState> = {}): SubjectExperiencesState {
  return {
    careerId: null,
    exams: {},
    reviews: { sort: 'RECENT' },
    tab: 'resenas',
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

/** Re-render the component as if the pushed URL had been navigated to. */
function pushedState() {
  const href = vi.mocked(navigation.push).mock.calls.at(-1)![0] as string;
  const params = new URLSearchParams(href.split('?')[1] ?? '');
  return parseSubjectExperiencesState(params);
}

describe('ExperienceTabs', () => {
  beforeEach(() => {
    navigation.push.mockReset();
    vi.mocked(getCourseReviewDiscovery).mockReset();
    vi.mocked(getExamExperienceDiscovery).mockReset();
    vi.mocked(getCourseReviewDiscovery).mockResolvedValue(reviewPage([review()], 1));
    vi.mocked(getExamExperienceDiscovery).mockResolvedValue(examPage([exam()], 1));
  });

  afterEach(cleanup);

  it('labels the tabs with the known summary counts and requests page one', async () => {
    render(
      <ExperienceTabs
        code="06"
        examCount={24}
        reviewCount={34}
        state={stateOf()}
        subject={subject}
      />,
    );

    expect(await screen.findByRole('tab', { name: 'Reseñas · 34' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Finales · 24' })).toBeInTheDocument();
    await waitFor(() =>
      expect(getCourseReviewDiscovery).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, page: 1, subjectId }),
      ),
    );
    expect(await screen.findByText(/Bastante pesada/)).toBeInTheDocument();
  });

  it('wires tablist/panel ARIA and supports arrow-key navigation', async () => {
    const user = userEvent.setup();
    render(<ExperienceTabs code="06" state={stateOf()} subject={subject} />);

    const resenas = await screen.findByRole('tab', { name: 'Reseñas' });
    const finales = screen.getByRole('tab', { name: 'Finales' });
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', resenas.id);
    expect(resenas).toHaveAttribute('aria-controls', panel.id);
    expect(resenas).toHaveAttribute('tabindex', '0');
    expect(finales).toHaveAttribute('tabindex', '-1');

    resenas.focus();
    await user.keyboard('{ArrowRight}');
    expect(navigation.push).toHaveBeenLastCalledWith('/experiencias/06?tab=finales', {
      scroll: false,
    });
    expect(finales).toHaveFocus();
  });

  it.each([
    {
      control: 'Franja',
      expectKey: 'shift',
      hrefPart: 'resenas.shift=NO_INDICO',
      value: 'NO_INDICO',
    },
    {
      control: 'Ciclo',
      expectKey: 'academicYear',
      hrefPart: 'resenas.academicYear=2010',
      value: '2010',
    },
    {
      control: 'Situación',
      expectKey: 'attempt',
      hrefPart: 'resenas.attempt=PREFIERO_NO_RESPONDER',
      value: 'PREFIERO_NO_RESPONDER',
    },
    {
      control: 'Resultado',
      expectKey: 'condition',
      hrefPart: 'resenas.condition=PREFIERO_NO_RESPONDER',
      value: 'PREFIERO_NO_RESPONDER',
    },
    {
      control: 'Profesor',
      expectKey: 'professorId',
      hrefPart: `resenas.professorId=${professorId}`,
      value: professorId,
    },
  ])(
    'the $control control pushes a namespaced URL and the request carries it',
    async ({ control, expectKey, hrefPart, value }) => {
      const user = userEvent.setup();
      const { rerender } = render(<ExperienceTabs code="06" state={stateOf()} subject={subject} />);
      await screen.findByRole('tab', { name: 'Reseñas' });

      await user.selectOptions(screen.getByLabelText(control), value);
      expect(navigation.push).toHaveBeenLastCalledWith(expect.stringContaining(hrefPart), {
        scroll: false,
      });

      // Simulate the navigation: parse the pushed URL back into state.
      const next = pushedState();
      rerender(<ExperienceTabs code="06" state={next} subject={subject} />);
      await waitFor(() =>
        expect(getCourseReviewDiscovery).toHaveBeenLastCalledWith(
          expect.objectContaining({ [expectKey]: expectKey === 'academicYear' ? 2010 : value }),
        ),
      );
    },
  );

  it('accepts next year in the ciclo control', async () => {
    const nextYear = String(new Date().getUTCFullYear() + 1);
    const select = (() => {
      render(<ExperienceTabs code="06" state={stateOf()} subject={subject} />);
      return screen.getByLabelText('Ciclo');
    })();
    expect(within(select).getByRole('option', { name: `Ciclo ${nextYear}` })).toBeInTheDocument();
  });

  it('keeps an unknown professor selectable and clearable', async () => {
    const user = userEvent.setup();
    render(
      <ExperienceTabs
        code="06"
        state={stateOf({ reviews: { professorId: unknownProfessorId, sort: 'RECENT' } })}
        subject={subject}
      />,
    );

    const select = await screen.findByLabelText('Profesor');
    expect(
      within(select).getByRole('option', { name: 'Profesor seleccionado en el enlace' }),
    ).toBeInTheDocument();
    await user.selectOptions(select, '');
    expect(navigation.push).toHaveBeenLastCalledWith('/experiencias/06', { scroll: false });
  });

  it('offers exactly three sort options without a placeholder', async () => {
    render(<ExperienceTabs code="06" state={stateOf()} subject={subject} />);
    const select = await screen.findByLabelText('Orden');
    const options = within(select).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'Más recientes',
      'Mejor recomendadas',
      'Menos recomendadas',
    ]);
    expect(options.some((option) => (option as HTMLOptionElement).value === '')).toBe(false);
  });

  it.each([
    { control: 'Período', expectKey: 'session', value: 'NO_RECUERDO' },
    { control: 'Formato', expectKey: 'format', value: 'ORAL' },
    { control: 'Resultado', expectKey: 'outcome', value: 'PREFIERO_NO_DECIR' },
    { control: 'Año del final', expectKey: 'year', value: '2010' },
    { control: 'Profesor', expectKey: 'professorId', value: professorId },
  ])(
    'the final $control control pushes and requests its filter',
    async ({ control, expectKey, value }) => {
      const user = userEvent.setup();
      const { rerender } = render(
        <ExperienceTabs code="06" state={stateOf({ tab: 'finales' })} subject={subject} />,
      );
      await screen.findByLabelText(control);

      await user.selectOptions(screen.getByLabelText(control), value);
      const next = pushedState();
      rerender(<ExperienceTabs code="06" state={next} subject={subject} />);

      await waitFor(() =>
        expect(getExamExperienceDiscovery).toHaveBeenLastCalledWith(
          expect.objectContaining({ [expectKey]: expectKey === 'year' ? 2010 : value }),
        ),
      );
    },
  );

  it('drops a late page-1 reply after the filters change', async () => {
    const stale = deferred<DiscoveryCourseReviewList>();
    vi.mocked(getCourseReviewDiscovery)
      .mockReturnValueOnce(stale.promise)
      .mockResolvedValue(reviewPage([review({ excerpt: 'La nueva lista' })], 1));
    const { rerender } = render(<ExperienceTabs code="06" state={stateOf()} subject={subject} />);
    await screen.findByRole('status');

    rerender(
      <ExperienceTabs
        code="06"
        state={stateOf({ reviews: { condition: 'PROMO', sort: 'RECENT' } })}
        subject={subject}
      />,
    );
    await waitFor(() => expect(getCourseReviewDiscovery).toHaveBeenCalledTimes(2));
    await screen.findByText(/La nueva lista/);

    await act(async () => {
      stale.resolve(reviewPage([review({ excerpt: 'La respuesta vieja' })], 1));
    });
    expect(screen.queryByText(/La respuesta vieja/)).not.toBeInTheDocument();
    expect(screen.getByText(/La nueva lista/)).toBeInTheDocument();
  });

  it('never lets an obsolete page-2 reply replace the new list', async () => {
    const page2 = deferred<DiscoveryCourseReviewList>();
    const oldPage = Array.from({ length: 10 }, (_, index) =>
      review({ excerpt: `Vieja ${index + 1}`, id: `v${index}` }),
    );
    vi.mocked(getCourseReviewDiscovery)
      .mockResolvedValueOnce(reviewPage(oldPage, 12))
      .mockReturnValueOnce(page2.promise)
      .mockResolvedValueOnce(reviewPage([review({ excerpt: 'La nueva lista' })], 1));

    const user = userEvent.setup();
    const { rerender } = render(<ExperienceTabs code="06" state={stateOf()} subject={subject} />);
    await screen.findByText(/Vieja 10/);

    await user.click(screen.getByRole('button', { name: 'Ver más' }));
    rerender(
      <ExperienceTabs
        code="06"
        state={stateOf({ reviews: { condition: 'PROMO', sort: 'RECENT' } })}
        subject={subject}
      />,
    );
    await screen.findByText(/La nueva lista/);

    await act(async () => {
      page2.resolve(reviewPage([review({ excerpt: 'Vieja once' })], 12));
    });
    expect(screen.queryByText(/Vieja once/)).not.toBeInTheDocument();
    expect(screen.getByText(/La nueva lista/)).toBeInTheDocument();
  });

  it('survives an obsolete page-2 rejection the same way', async () => {
    const page2 = deferred<DiscoveryCourseReviewList>();
    const oldPage = Array.from({ length: 10 }, (_, index) =>
      review({ excerpt: `Vieja ${index + 1}`, id: `v${index}` }),
    );
    vi.mocked(getCourseReviewDiscovery)
      .mockResolvedValueOnce(reviewPage(oldPage, 12))
      .mockReturnValueOnce(page2.promise)
      .mockResolvedValueOnce(reviewPage([review({ excerpt: 'La nueva lista' })], 1));

    const user = userEvent.setup();
    const { rerender } = render(<ExperienceTabs code="06" state={stateOf()} subject={subject} />);
    await screen.findByText(/Vieja 10/);

    await user.click(screen.getByRole('button', { name: 'Ver más' }));
    rerender(
      <ExperienceTabs
        code="06"
        state={stateOf({ reviews: { condition: 'PROMO', sort: 'RECENT' } })}
        subject={subject}
      />,
    );
    await screen.findByText(/La nueva lista/);

    await act(async () => {
      page2.reject(new Error('down'));
    });
    // The fresh list is untouched and shows no perpetual loading or error.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText(/La nueva lista/)).toBeInTheDocument();
  });

  it.each(['resenas', 'finales'] as const)(
    'retries a failed first page in the %s tab',
    async (tab) => {
      const user = userEvent.setup();
      if (tab === 'resenas') {
        vi.mocked(getCourseReviewDiscovery)
          .mockRejectedValueOnce(new Error('down'))
          .mockResolvedValueOnce(reviewPage([review()], 1));
      } else {
        vi.mocked(getExamExperienceDiscovery)
          .mockRejectedValueOnce(new Error('down'))
          .mockResolvedValueOnce(examPage([exam()], 1));
      }
      render(<ExperienceTabs code="06" state={stateOf({ tab })} subject={subject} />);

      expect(await screen.findByRole('alert')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Reintentar' }));

      const fetcher = tab === 'resenas' ? getCourseReviewDiscovery : getExamExperienceDiscovery;
      await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
      expect(fetcher).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
      expect(await screen.findByText(/promocionable|práctico/)).toBeInTheDocument();
    },
  );

  it('appends exactly the next page and keeps the URL untouched', async () => {
    const firstPage = Array.from({ length: 10 }, (_, index) =>
      review({ excerpt: `Reseña ${index + 1}`, id: `r${index}` }),
    );
    vi.mocked(getCourseReviewDiscovery)
      .mockResolvedValueOnce(reviewPage(firstPage, 20))
      .mockResolvedValueOnce(
        reviewPage(
          Array.from({ length: 10 }, (_, index) =>
            review({ excerpt: `Reseña ${index + 11}`, id: `n${index}` }),
          ),
          20,
        ),
      );
    const user = userEvent.setup();
    render(<ExperienceTabs code="06" state={stateOf()} subject={subject} />);

    await screen.findByText(/Reseña 10/);
    await user.click(screen.getByRole('button', { name: 'Ver más' }));
    await screen.findByText(/Reseña 20/);

    expect(getCourseReviewDiscovery).toHaveBeenCalledTimes(2);
    expect(getCourseReviewDiscovery).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    // Loading another page never rewrites the URL.
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('keeps loaded cards and retries the same page on a page-2 failure', async () => {
    const firstPage = Array.from({ length: 10 }, (_, index) =>
      review({ excerpt: `Reseña ${index + 1}`, id: `r${index}` }),
    );
    vi.mocked(getCourseReviewDiscovery)
      .mockResolvedValueOnce(reviewPage(firstPage, 12))
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce(reviewPage([review({ excerpt: 'Reseña once', id: 'r10' })], 12));
    const user = userEvent.setup();
    render(<ExperienceTabs code="06" state={stateOf()} subject={subject} />);

    await screen.findByText(/Reseña 10/);
    await user.click(screen.getByRole('button', { name: 'Ver más' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Reseña 10/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText(/Reseña once/)).toBeInTheDocument();
    expect(getCourseReviewDiscovery).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
  });

  it('offers to clear only the current tab filters on a filtered empty', async () => {
    const user = userEvent.setup();
    vi.mocked(getCourseReviewDiscovery).mockResolvedValue(reviewPage([], 0));
    render(
      <ExperienceTabs
        code="06"
        state={stateOf({
          exams: { session: 'DICIEMBRE' },
          reviews: { condition: 'PROMO', sort: 'RECENT' },
        })}
        subject={subject}
      />,
    );

    expect(
      await screen.findByText('Ninguna experiencia coincide con estos filtros.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    expect(navigation.push).toHaveBeenLastCalledWith('/experiencias/06?finales.session=DICIEMBRE', {
      scroll: false,
    });
  });
});
