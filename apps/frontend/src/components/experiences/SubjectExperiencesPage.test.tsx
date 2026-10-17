import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getSubjectExperiencesSummary } from '@/lib/experiences-client';
import { summaryFixture } from '@/test/experiences';
import { fiUnju } from '@/test/institutions';
import type { SubjectHub } from '@/types/subject';

import { SubjectExperiencesPage } from './SubjectExperiencesPage';

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.searchParams,
}));

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock('@/lib/experiences-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/experiences-client')>()),
  getSubjectExperiencesSummary: vi.fn(),
}));
vi.mock('@/lib/discovery-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/discovery-client')>()),
  getCourseReviewDiscovery: vi
    .fn()
    .mockResolvedValue({ data: [], meta: { limit: 10, page: 1, total: 0, totalPages: 0 } }),
  getExamExperienceDiscovery: vi
    .fn()
    .mockResolvedValue({ data: [], meta: { limit: 10, page: 1, total: 0, totalPages: 0 } }),
}));
vi.mock('@/stores/ubicacionStore', () => ({
  useUbicacionStore: (selector: (state: unknown) => unknown) =>
    selector({ myCareers: [], ready: true, ubicacion: null }),
}));

const informatica = {
  credits: null,
  semester: 1,
  studyPlan: {
    career: {
      code: 'II',
      faculty: fiUnju,
      id: 'c-inf',
      name: 'Ingeniería Informática',
    },
    name: 'Plan',
  },
  year: 2,
} as unknown as SubjectHub['studyPlans'][number];

const subject = {
  code: '06',
  description: null,
  id: '50000000-0000-4000-8000-000000000001',
  name: 'Análisis Matemático II',
  professors: [],
  stats: { avgRecommendation: null, examCount: 24, materialCount: 0, reviewCount: 34 },
  studyPlans: [informatica],
} as unknown as SubjectHub;

const emptySummary = {
  ...summaryFixture,
  exams: { ...summaryFixture.exams, count: 0 },
  reviews: { ...summaryFixture.reviews, count: 0 },
};

describe('SubjectExperiencesPage', () => {
  beforeEach(() => {
    navigation.push.mockReset();
    navigation.searchParams = new URLSearchParams();
    vi.mocked(getSubjectExperiencesSummary).mockReset();
    vi.mocked(getSubjectExperiencesSummary).mockResolvedValue(summaryFixture);
  });

  afterEach(cleanup);

  it('renders the trail, eyebrow, name and the writing menu links', async () => {
    const user = userEvent.setup();
    render(<SubjectExperiencesPage code="06" subject={subject} />);

    expect(screen.getByRole('link', { name: 'Experiencias' })).toHaveAttribute(
      'href',
      '/experiencias',
    );
    expect(screen.getByText('Ingeniería Informática')).toBeInTheDocument();
    expect(screen.getByText(/2° año · 1° cuatrimestre/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Análisis Matemático II' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver recursos de la materia' })).toHaveAttribute(
      'href',
      '/materias/06',
    );
    expect(
      await screen.findByRole('heading', { name: 'Resumen de 58 experiencias' }),
    ).toBeInTheDocument();

    // The writing menu names the two approved choices with encoded links.
    await user.click(screen.getByRole('button', { name: /escribir/i }));
    expect(await screen.findByRole('menuitem', { name: 'Reseña de cursada' })).toHaveAttribute(
      'href',
      '/materias/06/resenar',
    );
    expect(screen.getByRole('menuitem', { name: 'Experiencia de final' })).toHaveAttribute(
      'href',
      '/materias/06/final',
    );
  });

  it('marks an annual placement and an optativa one', async () => {
    const anual = {
      ...informatica,
      semester: 0,
    } as unknown as SubjectHub['studyPlans'][number];
    const optativa = {
      ...informatica,
      semester: null,
      year: null,
    } as unknown as SubjectHub['studyPlans'][number];
    render(
      <SubjectExperiencesPage
        code="06"
        subject={{ ...subject, studyPlans: [anual] } as SubjectHub}
      />,
    );
    expect(await screen.findByText(/Experiencias · 2° año · Anual/)).toBeInTheDocument();
    cleanup();
    render(
      <SubjectExperiencesPage
        code="06"
        subject={{ ...subject, studyPlans: [optativa] } as SubjectHub}
      />,
    );
    expect(await screen.findByText(/Experiencias · Optativa/)).toBeInTheDocument();
  });

  it('keeps the lists usable and offers retry when the summary fails', async () => {
    const user = userEvent.setup();
    const { getCourseReviewDiscovery } = await import('@/lib/discovery-client');
    vi.mocked(getCourseReviewDiscovery).mockResolvedValue({
      aggregate: { averageRecommendation: null, reviewCount: 1 },
      data: [
        {
          academicYear: 2025,
          attempt: 'PRIMERA_CURSADA',
          author: { avatarCat: null, avatarUrl: null, id: 'u1', username: 'luciana' },
          condition: 'REGULAR',
          createdAt: '2026-09-13T12:00:00.000Z',
          difficulty: 'MEDIA',
          excerpt: 'Bastante pesada pero promocionable.',
          id: 'r1',
          professor: null,
          professorName: null,
          recommendation: 4,
          shift: 'TARDE',
          subject: { code: '06', href: '/materias/06', id: subject.id, name: subject.name },
          updatedAt: '2026-09-13T12:00:00.000Z',
        },
      ],
      meta: { limit: 10, page: 1, total: 1, totalPages: 1 },
    });
    vi.mocked(getSubjectExperiencesSummary)
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce(summaryFixture);
    render(<SubjectExperiencesPage code="06" subject={subject} />);

    expect(
      await screen.findByRole('heading', { name: 'No pudimos cargar el resumen' }),
    ).toBeInTheDocument();
    // The lists are independent: a real entry stays readable, tabs never fake
    // empty, and retry heals the summary.
    expect(screen.getByRole('tab', { name: 'Reseñas' })).toBeInTheDocument();
    expect(await screen.findByText(/Bastante pesada/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(
      await screen.findByRole('heading', { name: 'Resumen de 58 experiencias' }),
    ).toBeInTheDocument();
    expect(getSubjectExperiencesSummary).toHaveBeenCalledTimes(2);
  });

  it('shows the subject empty instead of summary/tabs on a confirmed 0+0', async () => {
    vi.mocked(getSubjectExperiencesSummary).mockResolvedValue(emptySummary);
    render(<SubjectExperiencesPage code="06" subject={subject} />);

    expect(await screen.findByText(/Nadie contó todavía cómo le fue/i)).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '58 experiencias' })).not.toBeInTheDocument();
  });

  it('never impersonates the empty state while the summary loads', async () => {
    vi.mocked(getSubjectExperiencesSummary).mockReturnValue(new Promise(() => {}));
    render(<SubjectExperiencesPage code="06" subject={subject} />);

    expect((await screen.findAllByRole('status')).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Nadie contó todavía/i)).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Reseñas' })).toBeInTheDocument();
  });

  it('resolves the breadcrumb carrera from the URL code', async () => {
    navigation.searchParams = new URLSearchParams('carrera=ii');
    render(<SubjectExperiencesPage code="06" subject={subject} />);

    expect(await screen.findByText('Ingeniería Informática')).toBeInTheDocument();
    await waitFor(() => expect(getSubjectExperiencesSummary).toHaveBeenCalled());
  });
});
