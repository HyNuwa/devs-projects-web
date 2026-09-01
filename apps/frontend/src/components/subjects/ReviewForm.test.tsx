import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/auth';
import type { CourseReview, SubjectHub } from '@/types/subject';
import { ReviewForm } from './ReviewForm';

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ codigo: 'ED-01' }),
  useRouter: () => navigation,
  useSearchParams: () => navigation.searchParams,
}));

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const currentUser: User = {
  id: 'author-1',
  username: 'luciana',
  email: 'luciana@example.com',
  role: 'USER',
  displayName: 'Luciana',
  bio: null,
  avatarUrl: null,
  emailVerified: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const subject: SubjectHub = {
  id: 'subject-1',
  code: 'ED-01',
  name: 'Estructuras de Datos',
  description: null,
  professors: [
    {
      professor: { id: 'professor-1', name: 'Ing. Laura Quiroga', bio: null },
    },
  ],
  stats: { avgRecommendation: null, reviewCount: 0, examCount: 0, materialCount: 0 },
  studyPlans: [],
};

function review(overrides: Partial<CourseReview> = {}): CourseReview {
  return {
    id: 'review-1',
    userId: currentUser.id,
    subjectId: subject.id,
    academicYear: 2026,
    shift: 'TARDE',
    condition: 'REGULAR',
    attempt: 'PRIMERA_CURSADA',
    professorId: null,
    professorName: null,
    difficulty: 'ALTA',
    recommendation: 4,
    comment:
      'La cursada tuvo prácticas semanales y parciales bien explicados para preparar cada tema.',
    isAnonymous: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    user: { id: currentUser.id, username: currentUser.username },
    ...overrides,
  };
}

async function completeRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Ciclo lectivo'), '2026');
  await user.click(screen.getByLabelText('Regular'));
  await user.click(screen.getByLabelText('Primera cursada'));
  await user.click(screen.getByLabelText('4 estrellas'));
  await user.type(
    screen.getByLabelText('Tu experiencia'),
    'La cursada tuvo prácticas semanales y parciales bien explicados para preparar cada tema.',
  );
}

describe('ReviewForm', () => {
  beforeEach(() => {
    navigation.push.mockReset();
    navigation.searchParams = new URLSearchParams();
    vi.mocked(api.get).mockImplementation((path) => {
      if (path === '/subjects/ED-01') return Promise.resolve({ data: subject });
      if (path === '/subjects/ED-01/reviews') {
        return Promise.resolve({ data: { reviews: [], conditionBreakdown: [] } });
      }
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
    vi.mocked(api.post).mockReset();
    vi.mocked(api.put).mockReset();
    useAuthStore.setState({ isLoading: false, user: currentUser });
  });

  afterEach(() => {
    cleanup();
    useAuthStore.setState({ isLoading: true, user: null });
  });

  it('creates an independent review with required fields, optional context, and anonymity', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({ data: { id: 'review-new' } });

    render(<ReviewForm />);
    await completeRequiredFields(user);
    await user.click(screen.getByLabelText('Del catálogo'));
    await user.selectOptions(screen.getByLabelText('Profesor del catálogo'), 'professor-1');
    await user.selectOptions(screen.getByLabelText('Dificultad general'), 'MEDIA');
    await user.click(screen.getByLabelText(/publicar como anónimo/i));
    await user.click(screen.getByRole('button', { name: 'Publicar reseña' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/subjects/ED-01/reviews', {
        academicYear: 2026,
        attempt: 'PRIMERA_CURSADA',
        comment:
          'La cursada tuvo prácticas semanales y parciales bien explicados para preparar cada tema.',
        condition: 'REGULAR',
        difficulty: 'MEDIA',
        isAnonymous: true,
        professorId: 'professor-1',
        professorName: undefined,
        recommendation: 4,
        shift: undefined,
      });
    });
    expect(navigation.push).toHaveBeenCalledWith('/materias/ED-01');
  });

  it('keeps invalid input in place with field guidance and supports keyboard star selection', async () => {
    const user = userEvent.setup();
    render(<ReviewForm />);

    const fourStars = screen.getByLabelText('4 estrellas');
    fourStars.focus();
    await user.keyboard('[Space]');
    expect(fourStars).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Publicar reseña' }));

    expect(await screen.findByText(/ciclo lectivo desde 1900/i)).toBeInTheDocument();
    expect(screen.getByText(/elegí el resultado/i)).toBeInTheDocument();
    expect(screen.getByText(/elegí tu situación/i)).toBeInTheDocument();
    expect(screen.getByText(/al menos 30 caracteres/i)).toBeInTheDocument();
    expect(fourStars).toBeChecked();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('requires an explicit confirmation before publishing a probable duplicate', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post)
      .mockRejectedValueOnce({ response: { status: 409, data: { code: 'PROBABLE_DUPLICATE' } } })
      .mockResolvedValueOnce({ data: { id: 'review-duplicate-confirmed' } });

    render(<ReviewForm />);
    await completeRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Publicar reseña' }));

    expect(
      await screen.findByRole('dialog', { name: '¿Es otra cursada real?' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Publicar como otra cursada' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(2);
    });
    expect(vi.mocked(api.post).mock.calls[1]).toEqual([
      '/subjects/ED-01/reviews',
      expect.objectContaining({ confirmProbableDuplicate: true }),
    ]);
  });

  it('loads a legacy review for editing without inventing missing academic facts', async () => {
    const user = userEvent.setup();
    navigation.searchParams = new URLSearchParams('editar=review-1');
    vi.mocked(api.get).mockImplementation((path) => {
      if (path === '/subjects/ED-01') return Promise.resolve({ data: subject });
      if (path === '/subjects/ED-01/reviews') {
        return Promise.resolve({
          data: {
            reviews: [
              review({
                academicYear: null,
                attempt: null,
                comment: null,
                condition: 'PREFIERO_NO_RESPONDER',
                difficulty: 3,
              }),
            ],
            conditionBreakdown: [],
          },
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
    vi.mocked(api.put).mockResolvedValue({ data: { id: 'review-1' } });

    render(<ReviewForm />);

    expect(await screen.findByText(/esta reseña usa datos heredados/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Ciclo lectivo')).toHaveValue(null);
    expect(screen.getByLabelText('4 estrellas')).toBeChecked();
    expect(screen.getByLabelText('Regular')).not.toBeChecked();
    expect(screen.getByLabelText('Primera cursada')).not.toBeChecked();

    await completeRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/subjects/reviews/review-1',
        expect.objectContaining({
          academicYear: 2026,
          attempt: 'PRIMERA_CURSADA',
          condition: 'REGULAR',
        }),
      );
    });
    expect(api.post).not.toHaveBeenCalled();
  });
});
