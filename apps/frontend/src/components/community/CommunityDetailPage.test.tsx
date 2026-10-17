import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CourseReviewDetailRoute,
  CommunityDetailPage,
  ExamExperienceDetailRoute,
} from './CommunityDetailPage';
import { getCourseReviewDetail, getExamExperienceDetail } from '@/lib/discovery-client';
import {
  getCourseReviewRelated,
  getExamExperienceRelated,
  getSubjectExperiencesSummary,
} from '@/lib/experiences-client';
import { summaryFixture } from '@/test/experiences';
import { getCommunityManagement } from '@/lib/community-management-client';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/auth';
import type { DiscoveryCourseReviewDetail, DiscoveryExamExperienceDetail } from '@/types/discovery';

const navigation = vi.hoisted(() => ({
  params: { id: 'review-1' },
  replace: vi.fn(),
}));
const navigatorShare = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const ed01Summary = {
  ...summaryFixture,
  subject: { code: 'ED-01', id: 'subject-1', name: 'Estructuras de Datos' },
};
const reviewComment =
  'La práctica semanal hizo que los parciales fueran previsibles y el equipo docente respondió dudas puntuales.';
const experienceComment =
  'La mesa recorrió grafos, complejidad y una defensa oral de las estructuras elegidas en el trabajo final.';

vi.mock('next/navigation', () => ({
  useParams: () => navigation.params,
  useRouter: () => ({ replace: navigation.replace }),
}));

vi.mock('@/lib/api', () => ({ api: { post: vi.fn() } }));
vi.mock('@/lib/discovery-client', () => ({
  getCourseReviewDetail: vi.fn(),
  getExamExperienceDetail: vi.fn(),
}));
vi.mock('@/lib/community-management-client', () => ({
  getCommunityManagement: vi.fn(),
  deleteCommunityEntry: vi.fn(),
}));
vi.mock('@/lib/experiences-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/experiences-client')>()),
  getSubjectExperiencesSummary: vi.fn(),
  getCourseReviewRelated: vi.fn(),
  getExamExperienceRelated: vi.fn(),
}));

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

function review(overrides: Partial<DiscoveryCourseReviewDetail> = {}): DiscoveryCourseReviewDetail {
  return {
    academicYear: 2026,
    attempt: 'PRIMERA_RECURSADA',
    author: { username: 'Anónimo' },
    comment: reviewComment,
    condition: 'REGULAR',
    createdAt: '2026-08-31T12:00:00.000Z',
    difficulty: 'ALTA',
    id: 'review-1',
    professor: { id: 'professor-1', name: 'Ing. Laura Quiroga' },
    professorName: null,
    recommendation: 4,
    shift: 'TARDE',
    subject: {
      code: 'ED-01',
      href: '/materias/ED-01',
      id: 'subject-1',
      name: 'Estructuras de Datos',
    },
    updatedAt: '2026-09-01T12:00:00.000Z',
    ...overrides,
  };
}

function experience(
  overrides: Partial<DiscoveryExamExperienceDetail> = {},
): DiscoveryExamExperienceDetail {
  return {
    author: { username: 'Anónimo' },
    comment: experienceComment,
    createdAt: '2026-08-31T12:00:00.000Z',
    difficulty: 'ALTA',
    examDate: '2026-07-15T00:00:00.000Z',
    examinerName: undefined,
    format: 'ORAL',
    id: 'exam-1',
    outcome: 'APROBADO',
    professor: { id: 'professor-1', name: 'Ing. Laura Quiroga' },
    session: 'JULIO',
    shift: 'TARDE',
    subject: {
      code: 'ED-01',
      href: '/materias/ED-01',
      id: 'subject-1',
      name: 'Estructuras de Datos',
    },
    updatedAt: '2026-08-31T12:00:00.000Z',
    year: 2026,
    ...overrides,
  };
}

describe('CommunityDetailPage', () => {
  beforeEach(() => {
    navigation.params = { id: 'review-1' };
    navigation.replace.mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(getCourseReviewDetail).mockReset();
    vi.mocked(getExamExperienceDetail).mockReset();
    vi.mocked(getCommunityManagement).mockReset();
    vi.mocked(getCommunityManagement).mockRejectedValue({ response: { status: 403 } });
    vi.mocked(getCourseReviewDetail).mockResolvedValue(review());
    vi.mocked(getExamExperienceDetail).mockResolvedValue(experience());
    vi.mocked(getSubjectExperiencesSummary).mockReset();
    vi.mocked(getSubjectExperiencesSummary).mockResolvedValue(ed01Summary);
    vi.mocked(getCourseReviewRelated).mockReset();
    vi.mocked(getCourseReviewRelated).mockResolvedValue({
      items: [],
      sharedContext: { shift: 'TARDE' },
    });
    vi.mocked(getExamExperienceRelated).mockReset();
    vi.mocked(getExamExperienceRelated).mockResolvedValue({
      items: [],
      sharedContext: { format: 'ORAL', session: 'JULIO' },
    });
    useAuthStore.setState({ isLoading: false, user: null });
    navigatorShare.mockClear();
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: navigatorShare,
      writable: true,
    });
    window.history.replaceState({}, '', '/');
  });

  afterEach(cleanup);

  it('loads a direct anonymous review route with facts, its canonical materia link, and the complete narrative', async () => {
    render(<CourseReviewDetailRoute />);

    expect(
      await screen.findByRole('heading', { name: 'Estructuras de Datos' }),
    ).toBeInTheDocument();
    expect(getCourseReviewDetail).toHaveBeenCalledWith('review-1');
    expect(screen.getByText('Anónimo')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Anónimo' })).not.toBeInTheDocument();
    expect(screen.getByText(reviewComment)).toBeInTheDocument();
    expect(screen.getByText('Profesor: Ing. Laura Quiroga')).toBeInTheDocument();
    expect(screen.getByText('Editada · 1 sept 2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver materia' })).toHaveAttribute(
      'href',
      '/materias/ED-01',
    );
    expect(screen.getByRole('link', { name: 'Iniciá sesión para reportar' })).toHaveAttribute(
      'href',
      '/auth/login?redirect=%2Fresenas%2Freview-1',
    );
  });

  it('links a signed review to its author’s perfil público', async () => {
    vi.mocked(getCourseReviewDetail).mockResolvedValue(review({ author: { username: 'vale' } }));
    render(<CourseReviewDetailRoute />);

    expect(await screen.findByRole('link', { name: 'vale' })).toHaveAttribute(
      'href',
      '/usuarios/vale',
    );
  });

  it('loads a direct final route without exposing a grade or any private identity', async () => {
    navigation.params = { id: 'exam-1' };
    render(<ExamExperienceDetailRoute />);

    expect(await screen.findByText(experienceComment)).toBeInTheDocument();
    expect(getExamExperienceDetail).toHaveBeenCalledWith('exam-1');
    expect(screen.getByText('Anónimo')).toBeInTheDocument();
    expect(screen.getByText('Final 2026')).toBeInTheDocument();
    expect(screen.queryByText(/Nota:/)).not.toBeInTheDocument();
  });

  it('shares the stable direct URL through the browser share action', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/resenas/review-1');
    render(<CommunityDetailPage id="review-1" kind="course-review" />);

    await screen.findByRole('heading', { name: 'Estructuras de Datos' });
    await user.click(screen.getByRole('button', { name: 'Compartir' }));

    await waitFor(() =>
      expect(navigatorShare).toHaveBeenCalledWith({
        title: 'Reseña de cursada: Estructuras de Datos',
        url: window.location.href,
      }),
    );
    expect(await screen.findByText('Enlace compartido.')).toBeInTheDocument();
  });

  it('submits a categorized report while keeping the entry visible', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({ data: { id: 'report-1' } });
    useAuthStore.setState({ isLoading: false, user: signedInUser });
    render(<CommunityDetailPage id="review-1" kind="course-review" />);

    await screen.findByRole('heading', { name: 'Estructuras de Datos' });
    await user.click(screen.getByRole('button', { name: 'Reportar' }));
    expect(screen.getByRole('dialog', { name: 'Reportar publicación' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Enviar reporte' }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/reports', {
        targetType: 'COURSE_REVIEW',
        targetId: 'review-1',
        reason: 'SPAM_O_REPETIDO',
      }),
    );
    expect(screen.getByText('Gracias. Moderación va a revisarlo.')).toBeInTheDocument();
  });

  it('requires an explanation for the other report reason before submitting', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ isLoading: false, user: signedInUser });
    render(<CommunityDetailPage id="review-1" kind="course-review" />);

    await screen.findByRole('heading', { name: 'Estructuras de Datos' });
    await user.click(screen.getByRole('button', { name: 'Reportar' }));
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'OTRO' } });
    await user.click(screen.getByRole('button', { name: 'Enviar reporte' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Explicá el motivo en al menos 3 caracteres.',
    );
    expect(api.post).not.toHaveBeenCalled();
  });

  it('uses one bounded public unavailable state for missing or removed entries', async () => {
    vi.mocked(getCourseReviewDetail).mockRejectedValue({ response: { status: 404 } });
    render(<CommunityDetailPage id="missing-or-removed" kind="course-review" />);

    expect(
      await screen.findByRole('heading', { name: 'Esta publicación no está disponible' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver reseñas' })).toHaveAttribute('href', '/resenas');
    expect(screen.queryByText('Anónimo')).not.toBeInTheDocument();
  });

  it('keeps a retry action for an unexpected public detail failure', async () => {
    const user = userEvent.setup();
    vi.mocked(getCourseReviewDetail)
      .mockRejectedValueOnce(new Error('network failure'))
      .mockResolvedValueOnce(review());
    render(<CommunityDetailPage id="review-1" kind="course-review" />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(
      await screen.findByRole('heading', { name: 'Estructuras de Datos' }),
    ).toBeInTheDocument();
    expect(getCourseReviewDetail).toHaveBeenCalledTimes(2);
  });

  it('shows the subject picture and same-context panel for a review', async () => {
    vi.mocked(getCourseReviewRelated).mockResolvedValue({
      items: [
        {
          academicYear: 2025,
          attempt: 'PRIMERA_CURSADA',
          author: { username: 'vale' },
          condition: 'REGULAR',
          createdAt: '2026-09-10T12:00:00.000Z',
          difficulty: 'MEDIA',
          excerpt: 'Otra con Quiroga',
          id: 'r2',
          professor: { id: 'professor-1', name: 'Ing. Laura Quiroga' },
          professorName: null,
          recommendation: 5,
          shift: 'TARDE',
          subject: {
            code: 'ED-01',
            href: '/materias/ED-01',
            id: 'subject-1',
            name: 'Estructuras de Datos',
          },
          updatedAt: '2026-09-10T12:00:00.000Z',
        },
      ],
      sharedContext: { professor: { name: 'Ing. Laura Quiroga' }, shift: 'TARDE' },
    });
    render(<CommunityDetailPage id="review-1" kind="course-review" />);

    expect(await screen.findByText(reviewComment)).toBeInTheDocument();
    expect(
      (await screen.findAllByRole('heading', { name: /Estructuras de Datos/i })).length,
    ).toBeGreaterThan(0);
    for (const link of await screen.findAllByRole('link', {
      name: /ver todas las experiencias/i,
    })) {
      expect(link).toHaveAttribute('href', '/experiencias/ED-01');
    }
    expect(await screen.findByText(/Otra con Quiroga/)).toBeInTheDocument();
    expect(getSubjectExperiencesSummary).toHaveBeenCalledWith('ED-01');
    expect(getCourseReviewRelated).toHaveBeenCalledWith('review-1');
  });

  it('offers the two writing routes from the detail', async () => {
    const user = userEvent.setup();
    render(<CommunityDetailPage id="review-1" kind="course-review" />);
    await screen.findByText(reviewComment);

    await user.click(await screen.findByRole('button', { name: /escribir/i }));
    expect(await screen.findByRole('menuitem', { name: 'Reseña de cursada' })).toHaveAttribute(
      'href',
      '/materias/ED-01/resenar',
    );
    expect(screen.getByRole('menuitem', { name: 'Experiencia de final' })).toHaveAttribute(
      'href',
      '/materias/ED-01/final',
    );
  });

  it('keeps the narrative and retries the summary independently', async () => {
    const user = userEvent.setup();
    vi.mocked(getSubjectExperiencesSummary)
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce(ed01Summary);
    render(<CommunityDetailPage id="review-1" kind="course-review" />);

    expect(await screen.findByText(reviewComment)).toBeInTheDocument();
    const relatedCalls = vi.mocked(getCourseReviewRelated).mock.calls.length;
    const sourceCalls = vi.mocked(getCourseReviewDetail).mock.calls.length;
    await user.click(await screen.findByRole('button', { name: 'Reintentar resumen' }));
    expect(
      await screen.findByRole('heading', { name: 'La materia según 34 reseñas' }),
    ).toBeInTheDocument();
    expect(getSubjectExperiencesSummary).toHaveBeenCalledTimes(2);
    expect(getCourseReviewRelated).toHaveBeenCalledTimes(relatedCalls);
    expect(getCourseReviewDetail).toHaveBeenCalledTimes(sourceCalls);
  });

  it('never fires ancillary requests while the source is unavailable', async () => {
    vi.mocked(getCourseReviewDetail).mockRejectedValue({ response: { status: 404 } });
    render(<CommunityDetailPage id="review-1" kind="course-review" />);

    await screen.findByRole('heading', { name: 'Esta publicación no está disponible' });
    expect(getSubjectExperiencesSummary).not.toHaveBeenCalled();
    expect(getCourseReviewRelated).not.toHaveBeenCalled();
  });

  it('shows a grade of 0 honestly and omits an absent one', async () => {
    vi.mocked(getExamExperienceDetail).mockResolvedValue(experience({ grade: 0 }));
    render(<CommunityDetailPage id="exam-1" kind="exam-experience" />);
    expect(await screen.findByText('Nota: 0')).toBeInTheDocument();

    cleanup();
    vi.mocked(getExamExperienceDetail).mockResolvedValue(experience());
    render(<CommunityDetailPage id="exam-1" kind="exam-experience" />);
    await screen.findByText(experienceComment);
    expect(screen.queryByText(/^Nota:/)).not.toBeInTheDocument();
  });

  it('handles a legacy subject without a public code', async () => {
    vi.mocked(getCourseReviewDetail).mockResolvedValue(
      review({
        subject: {
          code: null,
          href: '/materias/ED-01',
          id: 'subject-1',
          name: 'Estructuras de Datos',
        },
      }),
    );
    render(<CommunityDetailPage id="review-1" kind="course-review" />);

    expect(await screen.findByText(reviewComment)).toBeInTheDocument();
    // Related by id still resolves; summary stays unfetched; no /null href.
    expect(await screen.findByRole('link', { name: 'Escribir experiencia' })).toHaveAttribute(
      'href',
      '/experiencias/escribir',
    );
    await waitFor(() => expect(getCourseReviewRelated).toHaveBeenCalledWith('review-1'));
    expect(getSubjectExperiencesSummary).not.toHaveBeenCalled();
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('href')).not.toMatch(/null|undefined/);
    }
  });

  it('wires the same panels for a final detail', async () => {
    vi.mocked(getExamExperienceRelated).mockResolvedValue({
      items: [
        {
          author: { username: 'Anónimo' },
          createdAt: '2026-09-10T12:00:00.000Z',
          excerpt: 'Otra mesa de julio',
          format: 'ORAL',
          id: 'e2',
          outcome: 'APROBADO',
          session: 'JULIO',
          subject: {
            code: 'ED-01',
            href: '/materias/ED-01',
            id: 'subject-1',
            name: 'Estructuras de Datos',
          },
          updatedAt: '2026-09-10T12:00:00.000Z',
          year: 2026,
        },
      ],
      sharedContext: { format: 'ORAL', session: 'JULIO' },
    });
    render(<CommunityDetailPage id="exam-1" kind="exam-experience" />);

    expect(await screen.findByText(experienceComment)).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'La materia según 24 finales' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Con el mismo contexto' })).toBeInTheDocument();
    expect(await screen.findByText(/Otra mesa de julio/)).toBeInTheDocument();
    expect(getExamExperienceRelated).toHaveBeenCalledWith('exam-1');
  });

  it('retries a failed related read while the summary stays ready', async () => {
    const user = userEvent.setup();
    vi.mocked(getCourseReviewRelated)
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce({ items: [], sharedContext: { shift: 'TARDE' } });
    render(<CommunityDetailPage id="review-1" kind="course-review" />);

    expect(
      await screen.findByRole('heading', { name: 'La materia según 34 reseñas' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/no pudimos cargar/i)).toBeInTheDocument();

    const summaryCalls = vi.mocked(getSubjectExperiencesSummary).mock.calls.length;
    const sourceCalls = vi.mocked(getCourseReviewDetail).mock.calls.length;
    await user.click(screen.getByRole('button', { name: 'Reintentar relacionadas' }));
    await waitFor(() => expect(getCourseReviewRelated).toHaveBeenCalledTimes(2));
    expect(getSubjectExperiencesSummary).toHaveBeenCalledTimes(summaryCalls);
    expect(getCourseReviewDetail).toHaveBeenCalledTimes(sourceCalls);
  });
});
