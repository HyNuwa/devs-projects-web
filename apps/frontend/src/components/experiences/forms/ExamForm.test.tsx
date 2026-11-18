import { fiUnju } from '@/test/institutions';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';
import { getSubjectExamTopics } from '@/lib/experiences-client';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/auth';
import type { ExamExperience, SubjectHub } from '@/types/subject';
import { TOO_MANY_REQUESTS_MESSAGE, tooManyRequests } from '@/test/too-many-requests';

import { ExamForm } from './ExamForm';

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ codigo: 'AM2' }),
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

vi.mock('@/lib/experiences-client', () => ({ getSubjectExamTopics: vi.fn() }));

const NARRATIVE =
  'Fueron tres ejercicios y una pregunta de teoría. Corrigieron en el día y explicaron los errores.';

const currentUser: User = {
  id: 'author-1',
  username: 'luciana',
  email: 'luciana@example.com',
  role: 'USER',
  displayName: 'Luciana',
  bio: null,
  avatarUrl: null,
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const subject: SubjectHub = {
  id: 'subject-1',
  code: 'AM2',
  name: 'Análisis Matemático II',
  description: null,
  professors: [{ professor: { id: 'professor-1', name: 'Ing. Laura Quiroga', bio: null } }],
  stats: { avgRecommendation: null, reviewCount: 0, examCount: 0, materialCount: 0 },
  studyPlans: [],
  faculty: fiUnju,
};

type StoredExam = ExamExperience & {
  boardSize?: number | null;
  durationMinutes?: number | null;
  prepDailyMinutes?: number | null;
  prepLeadDays?: number | null;
  topics?: string[];
};

function exam(overrides: Partial<StoredExam> = {}): StoredExam {
  return {
    id: 'exam-1',
    userId: currentUser.id,
    subjectId: subject.id,
    shift: null,
    year: 2024,
    session: 'DICIEMBRE',
    format: 'ESCRITO',
    examDate: null,
    professorId: null,
    examinerName: null,
    difficulty: null,
    difficultyTheory: null,
    difficultyPractice: null,
    outcome: 'APROBADO',
    grade: 7,
    boardSize: null,
    durationMinutes: null,
    prepLeadDays: null,
    prepDailyMinutes: null,
    topics: [],
    comment: NARRATIVE,
    isAnonymous: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function editing(entry: StoredExam, status = 'PUBLISHED', reason: string | null = null) {
  navigation.searchParams = new URLSearchParams('editar=exam-1');
  vi.mocked(api.get).mockImplementation((path) => {
    if (path === '/subjects/AM2') return Promise.resolve({ data: subject });
    if (path === '/subjects/exams/exam-1/management') {
      return Promise.resolve({
        data: { entry, moderation: { status, isRemoved: false, reason, date: null } },
      });
    }
    return Promise.reject(new Error(`Unexpected request: ${path}`));
  });
}

const published = (id: string) => ({ data: { exam: { id }, outcome: 'PUBLISHED', reason: null } });

const section = (name: string) => screen.getByRole('region', { name });
const preview = () => screen.getByRole('complementary', { name: 'Así se va a ver' });

async function completeRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText('Período'), 'DICIEMBRE');
  await user.type(screen.getByLabelText('Año'), '2024');
  await user.click(screen.getByLabelText('Escrito'));
  await user.click(screen.getByLabelText('Aprobado'));
  await user.type(screen.getByLabelText('Nota'), '7');
  await user.type(screen.getByLabelText('Contá tu experiencia'), NARRATIVE);
}

describe('ExamForm', () => {
  beforeEach(() => {
    navigation.push.mockReset();
    navigation.searchParams = new URLSearchParams();
    vi.mocked(api.get).mockImplementation((path) => {
      if (path === '/subjects/AM2') return Promise.resolve({ data: subject });
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
    vi.mocked(api.post).mockReset();
    vi.mocked(api.put).mockReset();
    vi.mocked(getSubjectExamTopics).mockReset();
    vi.mocked(getSubjectExamTopics).mockResolvedValue({ topics: [] });
    useAuthStore.setState({ isLoading: false, user: currentUser });
  });

  afterEach(() => {
    cleanup();
    useAuthStore.setState({ isLoading: true, user: null });
  });

  it('lays the final out in seven numbered sections', () => {
    render(<ExamForm />);

    const titles = [
      '¿Qué querés contar?',
      'La mesa',
      'Cómo te fue',
      'Temas que tomaron',
      'Preparación',
      'Tu experiencia',
      'Publicación',
    ];
    for (const [index, title] of titles.entries()) {
      expect(within(section(title)).getByRole('heading', { level: 2 })).toHaveTextContent(
        `${index + 1}${title}`,
      );
    }
    expect(within(section('Temas que tomaron')).getByText('Opcional')).toBeInTheDocument();
    expect(within(section('Preparación')).getByText('Opcional')).toBeInTheDocument();
    expect(
      within(section('¿Qué querés contar?')).getByRole('link', { name: 'Cambiar' }),
    ).toHaveAttribute('href', '/experiencias/escribir?tipo=final&materia=AM2&desde=formulario');
    expect(screen.getByRole('button', { name: 'Publicar experiencia' })).toBeInTheDocument();
  });

  it('asks for no exact date, franja or verbal dificultad', () => {
    render(<ExamForm />);

    expect(screen.queryByLabelText(/fecha/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Franja horaria' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Tarde')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Muy alta')).not.toBeInTheDocument();
  });

  it('requires the outcome, and the grade unless «Prefiero no decir»', async () => {
    const user = userEvent.setup();
    render(<ExamForm />);

    const outcome = within(section('Cómo te fue')).getByRole('group', { name: 'Resultado' });
    expect(within(outcome).getByText('Obligatorio')).toBeInTheDocument();
    expect(
      screen.getByText('Si elegís «Prefiero no decir», no se pide la nota.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Publicar experiencia' }));
    expect(await screen.findByText('Elegí cómo te fue.')).toBeInTheDocument();
    expect(screen.getByText('Elegí el período de final.')).toBeInTheDocument();
    expect(screen.getByText('Elegí el formato del final.')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Desaprobado'));
    await user.click(screen.getByRole('button', { name: 'Publicar experiencia' }));
    expect(await screen.findByText('Indicá tu nota de 0 a 10.')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Prefiero no decir'));
    expect(screen.queryByLabelText('Nota')).not.toBeInTheDocument();
    expect(screen.queryByText('Indicá tu nota de 0 a 10.')).not.toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('publishes the whole payload, without a grade for «Prefiero no decir», and opens the final', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue(published('exam-new'));
    render(<ExamForm />);

    await completeRequiredFields(user);
    await user.click(screen.getByLabelText('Prefiero no decir'));
    await user.click(screen.getByRole('switch', { name: 'Publicar como anónimo' }));
    await user.click(screen.getByRole('button', { name: 'Publicar experiencia' }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/subjects/AM2/exams', {
        boardSize: null,
        comment: NARRATIVE,
        difficultyPractice: null,
        difficultyTheory: null,
        durationMinutes: null,
        examinerName: null,
        format: 'ESCRITO',
        grade: null,
        isAnonymous: true,
        outcome: 'PREFIERO_NO_DECIR',
        prepDailyMinutes: null,
        prepLeadDays: null,
        professorId: null,
        session: 'DICIEMBRE',
        topics: [],
        year: 2024,
      }),
    );
    expect(navigation.push).toHaveBeenCalledWith('/finales/exam-new?publicada=1');
  });

  it('declares teoría and práctica independently', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue(published('exam-new'));
    render(<ExamForm />);

    await completeRequiredFields(user);
    await user.click(within(screen.getByRole('group', { name: 'Teoría' })).getByLabelText('4'));
    await user.click(screen.getByRole('button', { name: 'Publicar experiencia' }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/subjects/AM2/exams',
        expect.objectContaining({ difficultyPractice: null, difficultyTheory: 4, grade: 7 }),
      ),
    );
  });

  it('collects the mesa, the tiempo and the preparación in their units with the estimated total', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue(published('exam-new'));
    render(<ExamForm />);

    await completeRequiredFields(user);
    await user.selectOptions(screen.getByLabelText('¿Quién te tomó?'), 'professor-1');
    await user.type(screen.getByLabelText('Profesores en la mesa'), '3');
    await user.type(screen.getByLabelText('Horas'), '3');
    await user.type(screen.getByLabelText('¿Con cuánto tiempo empezaste a estudiar?'), '3');
    await user.selectOptions(screen.getByLabelText('Unidad de tiempo'), 'semanas');
    expect(screen.queryByText(/de estudio en total/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sumar media hora' }));
    await user.click(screen.getByRole('button', { name: 'Sumar media hora' }));
    expect(screen.getByLabelText('¿Cuánto le dedicabas por día?')).toHaveTextContent('1 h');
    expect(
      within(section('Preparación')).getByText('Unas 21 horas de estudio en total'),
    ).toBeInTheDocument();
    await user.click(within(screen.getByRole('group', { name: 'Práctica' })).getByLabelText('3'));
    await user.click(screen.getByRole('button', { name: 'Publicar experiencia' }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/subjects/AM2/exams',
        expect.objectContaining({
          boardSize: 3,
          difficultyPractice: 3,
          difficultyTheory: null,
          durationMinutes: 180,
          examinerName: null,
          prepDailyMinutes: 60,
          prepLeadDays: 21,
          professorId: 'professor-1',
        }),
      ),
    );
  });

  it('refuses an exam time outside 10 minutes to 8 hours', async () => {
    const user = userEvent.setup();
    render(<ExamForm />);

    await completeRequiredFields(user);
    await user.type(screen.getByLabelText('Minutos'), '5');
    await user.click(screen.getByRole('button', { name: 'Publicar experiencia' }));

    expect(await screen.findByText('El tiempo va de 10 minutos a 8 horas.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it.each([
    ['0', 'dias'],
    ['13', 'meses'],
  ])('refuses a lead time of %s %s, outside 1 day to 12 months', async (amount, unit) => {
    const user = userEvent.setup();
    render(<ExamForm />);

    await completeRequiredFields(user);
    await user.type(screen.getByLabelText('¿Con cuánto tiempo empezaste a estudiar?'), amount);
    await user.selectOptions(screen.getByLabelText('Unidad de tiempo'), unit);
    await user.click(screen.getByRole('button', { name: 'Publicar experiencia' }));

    expect(await screen.findByText('Indicá entre 1 día y 12 meses antes.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('adds the temas with Enter and sends them', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue(published('exam-new'));
    render(<ExamForm />);

    await completeRequiredFields(user);
    const topics = within(section('Temas que tomaron'));
    await user.type(
      topics.getByRole('textbox', { name: 'Agregar un tema' }),
      'Integrales dobles{Enter}',
    );
    await user.click(screen.getByRole('button', { name: 'Publicar experiencia' }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/subjects/AM2/exams',
        expect.objectContaining({ topics: ['Integrales dobles'] }),
      ),
    );
    expect(getSubjectExamTopics).toHaveBeenCalledWith('AM2');
  });

  it('previews the final with the same facts as its detail', async () => {
    const user = userEvent.setup();
    render(<ExamForm />);

    await completeRequiredFields(user);
    await user.type(screen.getByLabelText('Profesores en la mesa'), '3');
    await user.type(screen.getByLabelText('Horas'), '3');
    await user.type(screen.getByLabelText('¿Con cuánto tiempo empezaste a estudiar?'), '3');
    await user.selectOptions(screen.getByLabelText('Unidad de tiempo'), 'semanas');
    await user.click(screen.getByRole('button', { name: 'Sumar media hora' }));
    await user.click(screen.getByRole('button', { name: 'Sumar media hora' }));
    await user.click(within(screen.getByRole('group', { name: 'Teoría' })).getByLabelText('4'));
    await user.click(within(screen.getByRole('group', { name: 'Práctica' })).getByLabelText('3'));

    for (const fact of [
      'Final 2024',
      'Diciembre',
      'Escrito',
      'Aprobado',
      'Nota: 7',
      'Teoría 4/5 · Práctica 3/5',
      'Mesa de 3 profesores · 3 horas',
      'Preparación: 3 semanas, 1 h por día',
      'Unas 21 horas de estudio en total',
    ]) {
      expect(within(preview()).getByText(fact)).toBeInTheDocument();
    }
  });

  it('shows how long to wait when publishing too often', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockRejectedValue(tooManyRequests());
    render(<ExamForm />);

    await completeRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Publicar experiencia' }));

    expect(await screen.findByText(TOO_MANY_REQUESTS_MESSAGE)).toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('tells an author in revisión previa that the final waits for it', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({
      data: { exam: { id: 'exam-new' }, outcome: 'PENDING_REVIEW', reason: 'NEW_ACCOUNT' },
    });
    render(<ExamForm />);

    await completeRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Publicar experiencia' }));

    expect(await screen.findByRole('heading', { name: 'En revisión previa' })).toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('edits a final with «Guardar cambios», loading its facts in their units', async () => {
    const user = userEvent.setup();
    editing(
      exam({
        boardSize: 3,
        difficultyTheory: 4,
        durationMinutes: 90,
        isAnonymous: true,
        prepDailyMinutes: 90,
        prepLeadDays: 60,
        topics: ['Integrales dobles'],
      }),
    );
    vi.mocked(api.put).mockResolvedValue({ data: { id: 'exam-1' } });
    render(<ExamForm />);

    expect(await screen.findByLabelText('Profesores en la mesa')).toHaveValue(3);
    expect(screen.getByLabelText('Horas')).toHaveValue(1);
    expect(screen.getByLabelText('Minutos')).toHaveValue(30);
    expect(screen.getByLabelText('¿Con cuánto tiempo empezaste a estudiar?')).toHaveValue(2);
    expect(screen.getByLabelText('Unidad de tiempo')).toHaveValue('meses');
    expect(screen.getByLabelText('¿Cuánto le dedicabas por día?')).toHaveTextContent('1 h 30 min');
    expect(screen.getByRole('switch', { name: 'Publicar como anónimo' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith(
        '/subjects/exams/exam-1',
        expect.objectContaining({
          boardSize: 3,
          difficultyTheory: 4,
          durationMinutes: 90,
          prepDailyMinutes: 90,
          prepLeadDays: 60,
          topics: ['Integrales dobles'],
        }),
      ),
    );
    expect(navigation.push).toHaveBeenCalledWith('/finales/exam-1');
  });

  it('asks a legacy final without outcome for it and never sends its date, franja or dificultad', async () => {
    const user = userEvent.setup();
    editing(
      exam({
        difficulty: 'ALTA',
        examDate: '2024-12-10T00:00:00.000Z',
        grade: null,
        outcome: null,
        shift: 'TARDE',
      }),
    );
    vi.mocked(api.put).mockResolvedValue({ data: { id: 'exam-1' } });
    render(<ExamForm />);

    expect(await screen.findByText(/esta experiencia usa datos heredados/i)).toBeInTheDocument();
    expect(screen.getByText('Falta: el resultado.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Elegí cómo te fue.')).toBeInTheDocument();
    expect(api.put).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText('Aprobado'));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Indicá tu nota de 0 a 10.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Nota'), '6');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
    const payload = vi.mocked(api.put).mock.calls[0][1] as Record<string, unknown>;
    expect(payload).toMatchObject({ grade: 6, outcome: 'APROBADO' });
    expect(payload).not.toHaveProperty('examDate');
    expect(payload).not.toHaveProperty('shift');
    expect(payload).not.toHaveProperty('difficulty');
  });

  it('resubmits a rejected final after the author corrects it', async () => {
    const user = userEvent.setup();
    editing(exam(), 'REJECTED', 'Sacá los nombres de compañeros.');
    vi.mocked(api.put).mockResolvedValue({ data: { id: 'exam-1' } });
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    render(<ExamForm />);

    expect(await screen.findByText('Sacá los nombres de compañeros.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Guardar y reenviar' }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/me/submissions/EXAM_EXPERIENCE/exam-1/resubmit'),
    );
    expect(await screen.findByRole('heading', { name: 'En revisión previa' })).toBeInTheDocument();
  });

  it('asks a visitor to sign in with a return path', () => {
    useAuthStore.setState({ isLoading: false, user: null });
    render(<ExamForm />);

    expect(
      screen.getByRole('heading', { name: 'Iniciá sesión para compartir un final' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent('/materias/AM2/final')),
    );
  });
});

describe('ExamForm draft across «Cambiar»', () => {
  const DRAFT_KEY = 'experience-draft';

  beforeEach(() => {
    sessionStorage.clear();
    navigation.push.mockReset();
    navigation.searchParams = new URLSearchParams();
    vi.mocked(api.get).mockImplementation((path) => {
      if (path === '/subjects/AM2') return Promise.resolve({ data: subject });
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
    vi.mocked(api.post).mockReset();
    vi.mocked(getSubjectExamTopics).mockResolvedValue({ topics: [] });
    useAuthStore.setState({ isLoading: false, user: currentUser });
  });

  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    useAuthStore.setState({ isLoading: true, user: null });
  });

  it('opens with the narrative a reseña draft had typed and none of its other facts', async () => {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        subjectCode: 'AM2',
        subjectName: 'Análisis Matemático II',
        type: 'resenar',
        values: {
          academicYear: '2025',
          comment: 'Lo que había escrito en la reseña.',
          condition: 'PROMO',
          isAnonymous: true,
        },
      }),
    );
    navigation.searchParams = new URLSearchParams('desde=formulario');
    render(<ExamForm />);

    expect(await screen.findByLabelText('Contá tu experiencia')).toHaveValue(
      'Lo que había escrito en la reseña.',
    );
    expect(screen.getByRole('switch', { name: 'Publicar como anónimo' })).toBeChecked();
    expect(screen.getByLabelText('Año')).toHaveValue(null);
    expect(screen.getByLabelText('Período')).toHaveValue('');
  });

  it('saves its own facts, temas included, before «Cambiar»', async () => {
    const user = userEvent.setup();
    render(<ExamForm />);

    await within(screen.getByRole('region', { name: '¿Qué querés contar?' })).findByText(
      'Análisis Matemático II',
    );
    await user.selectOptions(screen.getByLabelText('Período'), 'JULIO');
    await user.type(screen.getByRole('textbox', { name: 'Agregar un tema' }), 'Series{Enter}');
    const change = screen.getByRole('link', { name: 'Cambiar' });
    change.addEventListener('click', (event) => event.preventDefault());
    await user.click(change);

    expect(JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? 'null')).toMatchObject({
      subjectCode: 'AM2',
      type: 'final',
      values: { session: 'JULIO', topics: ['Series'] },
    });
  });

  it('restores a final draft when it continues from the chooser', async () => {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        subjectCode: 'AM2',
        subjectName: 'Análisis Matemático II',
        type: 'final',
        values: {
          boardSize: 3,
          prepLeadAmount: '3',
          prepLeadUnit: 'semanas',
          session: 'JULIO',
          topics: ['Series'],
        },
      }),
    );
    navigation.searchParams = new URLSearchParams('desde=formulario');
    render(<ExamForm />);

    expect(await screen.findByLabelText('Período')).toHaveValue('JULIO');
    expect(screen.getByLabelText('Profesores en la mesa')).toHaveValue(3);
    expect(screen.getByLabelText('Unidad de tiempo')).toHaveValue('semanas');
    expect(screen.getByRole('button', { name: 'Quitar Series' })).toBeInTheDocument();
  });

  it('restores the typed values on browser Back from «Cambiar»', async () => {
    const user = userEvent.setup();
    render(<ExamForm />);

    await within(screen.getByRole('region', { name: '¿Qué querés contar?' })).findByText(
      'Análisis Matemático II',
    );
    await user.selectOptions(screen.getByLabelText('Período'), 'JULIO');
    await user.type(screen.getByLabelText('Contá tu experiencia'), 'Medio relato');
    await user.type(screen.getByRole('textbox', { name: 'Agregar un tema' }), 'Series{Enter}');
    const change = screen.getByRole('link', { name: 'Cambiar' });
    change.addEventListener('click', (event) => event.preventDefault());
    await user.click(change);
    cleanup();

    render(<ExamForm />);

    expect(await screen.findByLabelText('Contá tu experiencia')).toHaveValue('Medio relato');
    expect(screen.getByLabelText('Período')).toHaveValue('JULIO');
    expect(screen.getByRole('button', { name: 'Quitar Series' })).toBeInTheDocument();
  });

  it('reads a draft only once on a form opened without the chooser', async () => {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        subjectCode: 'AM2',
        subjectName: null,
        type: 'final',
        values: { comment: 'Medio relato', session: 'JULIO' },
      }),
    );
    render(<ExamForm />);

    expect(await screen.findByLabelText('Contá tu experiencia')).toHaveValue('Medio relato');
    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull();
    cleanup();

    render(<ExamForm />);

    await within(screen.getByRole('region', { name: '¿Qué querés contar?' })).findByText(
      'Análisis Matemático II',
    );
    expect(screen.getByLabelText('Contá tu experiencia')).toHaveValue('');
    expect(screen.getByLabelText('Período')).toHaveValue('');
  });

  it('keeps the draft through «Cambiar», the chooser and «Continuar»', async () => {
    const user = userEvent.setup();
    render(<ExamForm />);

    await within(screen.getByRole('region', { name: '¿Qué querés contar?' })).findByText(
      'Análisis Matemático II',
    );
    await user.type(screen.getByLabelText('Contá tu experiencia'), 'Medio relato');
    const change = screen.getByRole('link', { name: 'Cambiar' });
    change.addEventListener('click', (event) => event.preventDefault());
    await user.click(change);
    cleanup();

    navigation.searchParams = new URLSearchParams('desde=formulario');
    render(<ExamForm />);

    expect(await screen.findByLabelText('Contá tu experiencia')).toHaveValue('Medio relato');
    expect(JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? 'null')).toMatchObject({
      type: 'final',
      values: { comment: 'Medio relato' },
    });
  });

  it('neither restores nor clears a draft while editing a final', async () => {
    const stored = JSON.stringify({
      subjectCode: 'AM2',
      subjectName: null,
      type: 'final',
      values: { comment: 'Otro relato a medio escribir', session: 'JULIO' },
    });
    sessionStorage.setItem(DRAFT_KEY, stored);
    editing(exam());
    render(<ExamForm />);

    await waitFor(() =>
      expect(screen.getByLabelText('Contá tu experiencia')).toHaveValue(NARRATIVE),
    );
    expect(screen.getByLabelText('Período')).toHaveValue('DICIEMBRE');
    expect(sessionStorage.getItem(DRAFT_KEY)).toBe(stored);
  });

  it.each([
    ['another materia', { subjectCode: 'OTRA', type: 'final' }],
    ['another type', { subjectCode: 'AM2', type: 'resenar' }],
  ])('does not restore a draft of %s on a form opened without the chooser', async (_case, slot) => {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        ...slot,
        subjectName: null,
        values: { comment: 'Medio relato', session: 'JULIO' },
      }),
    );
    render(<ExamForm />);

    await within(screen.getByRole('region', { name: '¿Qué querés contar?' })).findByText(
      'Análisis Matemático II',
    );
    expect(screen.getByLabelText('Contá tu experiencia')).toHaveValue('');
    expect(screen.getByLabelText('Período')).toHaveValue('');
  });

  it('clears the draft on a successful publish', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ subjectCode: 'AM2', subjectName: null, type: 'final', values: {} }),
    );
    vi.mocked(api.post).mockResolvedValue(published('exam-new'));
    render(<ExamForm />);

    await completeRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Publicar experiencia' }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalled());
    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('clears the draft on «Cancelar»', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ subjectCode: 'AM2', subjectName: null, type: 'final', values: {} }),
    );
    render(<ExamForm />);

    const cancel = screen.getByRole('link', { name: 'Cancelar' });
    cancel.addEventListener('click', (event) => event.preventDefault());
    await user.click(cancel);

    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull();
  });
});
