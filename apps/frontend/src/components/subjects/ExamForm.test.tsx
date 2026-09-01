import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/auth';
import type { ExamExperience, SubjectHub } from '@/types/subject';
import { ExamForm } from './ExamForm';

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
  username: 'franco',
  email: 'franco@example.com',
  role: 'USER',
  displayName: 'Franco',
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

function exam(overrides: Partial<ExamExperience> = {}): ExamExperience {
  return {
    id: 'exam-1',
    userId: currentUser.id,
    subjectId: subject.id,
    shift: 'TARDE',
    year: 2026,
    session: 'JULIO',
    format: 'ORAL',
    examDate: null,
    professorId: null,
    examinerName: null,
    difficulty: 'MEDIA',
    difficultyTheory: null,
    difficultyPractice: null,
    outcome: null,
    grade: null,
    comment: 'La mesa recorrió grafos, complejidad y una defensa oral de las estructuras elegidas.',
    isAnonymous: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    user: { id: currentUser.id, username: currentUser.username },
    professor: null,
    ...overrides,
  };
}

async function completeRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Año'), '2026');
  await user.selectOptions(screen.getByLabelText('Período de final'), 'JULIO');
  await user.click(screen.getByLabelText('Oral'));
  await user.type(
    screen.getByLabelText('Experiencia'),
    'La mesa recorrió grafos, complejidad y una defensa oral de las estructuras elegidas.',
  );
}

describe('ExamForm', () => {
  beforeEach(() => {
    navigation.push.mockReset();
    navigation.searchParams = new URLSearchParams();
    vi.mocked(api.get).mockImplementation((path) => {
      if (path === '/subjects/ED-01') return Promise.resolve({ data: subject });
      if (path === '/subjects/ED-01/exams') return Promise.resolve({ data: [] });
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

  it('creates an independent final experience with exact optional facts and anonymity', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({ data: { id: 'exam-new' } });

    render(<ExamForm />);
    await completeRequiredFields(user);
    await user.type(screen.getByLabelText('Fecha exacta'), '2026-07-15');
    await user.selectOptions(screen.getByLabelText('Dificultad general'), 'ALTA');
    await user.click(screen.getByLabelText('Tarde'));
    await user.click(screen.getByLabelText('Del catálogo'));
    await user.selectOptions(screen.getByLabelText('Profesor del catálogo'), 'professor-1');
    await user.selectOptions(screen.getByLabelText('Resultado'), 'APROBADO');
    await user.type(screen.getByLabelText('Nota'), '8');
    await user.click(screen.getByLabelText(/publicar como anónimo/i));
    await user.click(screen.getByRole('button', { name: 'Publicar experiencia' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/subjects/ED-01/exams', {
        comment:
          'La mesa recorrió grafos, complejidad y una defensa oral de las estructuras elegidas.',
        difficulty: 'ALTA',
        examDate: '2026-07-15',
        examinerName: null,
        format: 'ORAL',
        grade: 8,
        isAnonymous: true,
        outcome: 'APROBADO',
        professorId: 'professor-1',
        session: 'JULIO',
        shift: 'TARDE',
        year: 2026,
      });
    });
  });

  it('keeps invalid grade input and supports keyboard format selection without inferring an outcome', async () => {
    const user = userEvent.setup();
    render(<ExamForm />);

    const oral = screen.getByLabelText('Oral');
    oral.focus();
    await user.keyboard('[Space]');
    expect(oral).toBeChecked();

    await user.type(screen.getByLabelText('Año'), '2026');
    await user.selectOptions(screen.getByLabelText('Período de final'), 'JULIO');
    await user.type(
      screen.getByLabelText('Experiencia'),
      'La mesa recorrió grafos, complejidad y una defensa oral de las estructuras elegidas.',
    );
    await user.selectOptions(screen.getByLabelText('Resultado'), 'PREFIERO_NO_DECIR');
    await user.type(screen.getByLabelText('Nota'), '7');
    await user.click(screen.getByRole('button', { name: 'Publicar experiencia' }));

    expect(
      await screen.findByText(/para publicar una nota, indicá si aprobaste o desaprobaste/i),
    ).toBeInTheDocument();
    expect(oral).toBeChecked();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('submits repeated final attempts as separate creates', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({ data: { id: 'exam-new' } });

    render(<ExamForm />);
    await completeRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Publicar experiencia' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));

    await user.clear(screen.getByLabelText('Experiencia'));
    await user.type(
      screen.getByLabelText('Experiencia'),
      'Este segundo intento tuvo otra mesa y una defensa más extensa de los algoritmos elegidos.',
    );
    await user.click(screen.getByRole('button', { name: 'Publicar experiencia' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
    expect(vi.mocked(api.post).mock.calls[1][0]).toBe('/subjects/ED-01/exams');
    expect(vi.mocked(api.post).mock.calls[1][1]).toEqual(
      expect.objectContaining({
        comment:
          'Este segundo intento tuvo otra mesa y una defensa más extensa de los algoritmos elegidos.',
      }),
    );
  });

  it('loads a legacy experience for editing without converting its historical difficulties', async () => {
    const user = userEvent.setup();
    navigation.searchParams = new URLSearchParams('editar=exam-1');
    vi.mocked(api.get).mockImplementation((path) => {
      if (path === '/subjects/ED-01') return Promise.resolve({ data: subject });
      if (path === '/subjects/ED-01/exams') {
        return Promise.resolve({
          data: [
            exam({
              comment: null,
              difficulty: null,
              difficultyTheory: 4,
              difficultyPractice: 2,
            }),
          ],
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
    vi.mocked(api.put).mockResolvedValue({ data: { id: 'exam-1' } });

    render(<ExamForm />);

    expect(
      await screen.findByText(/esta experiencia contiene datos heredados/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Dificultad general')).toHaveValue('');
    expect(screen.getByLabelText('Oral')).toBeChecked();
    await user.type(
      screen.getByLabelText('Experiencia'),
      'La mesa recorrió grafos, complejidad y una defensa oral de las estructuras elegidas.',
    );
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/subjects/exams/exam-1',
        expect.objectContaining({
          difficulty: null,
          format: 'ORAL',
          session: 'JULIO',
          year: 2026,
        }),
      );
    });
    expect(api.post).not.toHaveBeenCalled();
  });
});
