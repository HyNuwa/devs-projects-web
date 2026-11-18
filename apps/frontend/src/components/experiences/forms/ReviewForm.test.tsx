import { fiUnju } from '@/test/institutions';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/auth';
import type { CourseReview, SubjectHub } from '@/types/subject';
import { TOO_MANY_REQUESTS_MESSAGE, tooManyRequests } from '@/test/too-many-requests';

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

const NARRATIVE =
  'La cursada tuvo prácticas semanales y parciales bien explicados para preparar cada tema.';

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
  faculty: fiUnju,
};

type StoredReview = CourseReview & { promotionGrade?: number | null };

function review(overrides: Partial<StoredReview> = {}): StoredReview {
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
    comment: NARRATIVE,
    isAnonymous: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    user: { id: currentUser.id, username: currentUser.username },
    ...overrides,
  };
}

function editing(entry: StoredReview, status = 'PUBLISHED', reason: string | null = null) {
  navigation.searchParams = new URLSearchParams('editar=review-1');
  vi.mocked(api.get).mockImplementation((path) => {
    if (path === '/subjects/ED-01') return Promise.resolve({ data: subject });
    if (path === '/subjects/reviews/review-1/management') {
      return Promise.resolve({
        data: { entry, moderation: { status, isRemoved: false, reason, date: null } },
      });
    }
    return Promise.reject(new Error(`Unexpected request: ${path}`));
  });
}

const published = (id: string) => ({
  data: { review: { id }, outcome: 'PUBLISHED', reason: null },
});

async function completeRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Ciclo lectivo'), '2026');
  await user.click(screen.getByLabelText('Primera cursada'));
  await user.click(screen.getByLabelText('Regular'));
  await user.click(screen.getByLabelText('4 estrellas'));
  await user.type(screen.getByLabelText('Contá tu experiencia'), NARRATIVE);
}

const form = () => screen.getByRole('form', { name: 'Reseña de cursada' });
const preview = () => screen.getByRole('complementary', { name: 'Así se va a ver' });

describe('ReviewForm', () => {
  beforeEach(() => {
    navigation.push.mockReset();
    navigation.searchParams = new URLSearchParams();
    vi.mocked(api.get).mockImplementation((path) => {
      if (path === '/subjects/ED-01') return Promise.resolve({ data: subject });
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

  it('lays the reseña out in five numbered sections', async () => {
    render(<ReviewForm />);

    const titles = [
      '¿Qué querés contar?',
      'Contexto de la cursada',
      'Cómo terminó',
      'Tu experiencia',
      'Publicación',
    ];
    for (const [index, title] of titles.entries()) {
      const section = screen.getByRole('region', { name: title });
      expect(within(section).getByRole('heading', { level: 2 })).toHaveTextContent(
        `${index + 1}${title}`,
      );
    }
    expect(screen.getByRole('button', { name: 'Publicar reseña' })).toBeInTheDocument();
  });

  it('shows the chosen type and materia with «Cambiar» to the chooser', async () => {
    render(<ReviewForm />);

    const first = screen.getByRole('region', { name: '¿Qué querés contar?' });
    expect(within(first).getByText('Reseña de cursada')).toBeInTheDocument();
    expect(await within(first).findByText('Estructuras de Datos')).toBeInTheDocument();
    expect(within(first).getByRole('link', { name: 'Cambiar' })).toHaveAttribute(
      'href',
      '/experiencias/escribir?tipo=resenar&materia=ED-01&desde=formulario',
    );
  });

  it('tags required and optional fields', () => {
    render(<ReviewForm />);

    const context = screen.getByRole('region', { name: 'Contexto de la cursada' });
    expect(
      within(within(context).getByRole('group', { name: 'Situación de cursada' })).getByText(
        'Obligatorio',
      ),
    ).toBeInTheDocument();
    expect(
      within(within(context).getByRole('group', { name: 'Franja horaria' })).getByText('Opcional'),
    ).toBeInTheDocument();
    const outcome = screen.getByRole('region', { name: 'Cómo terminó' });
    expect(
      within(within(outcome).getByRole('group', { name: 'Resultado de la cursada' })).getByText(
        'Obligatorio',
      ),
    ).toBeInTheDocument();
    expect(
      within(
        within(outcome).getByRole('group', { name: '¿Qué tan difícil te resultó?' }),
      ).getByText('Opcional'),
    ).toBeInTheDocument();
  });

  it('keeps invalid input in place with field guidance', async () => {
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

  it('asks «¿Con qué nota promocionaste?» only with Promoción and clears it on change', async () => {
    const user = userEvent.setup();
    render(<ReviewForm />);

    expect(screen.queryByLabelText('¿Con qué nota promocionaste?')).not.toBeInTheDocument();
    await user.click(screen.getByLabelText('Promoción'));
    const grade = screen.getByLabelText('¿Con qué nota promocionaste?');
    expect(screen.getByText('Aparece solo si elegís Promoción.')).toBeInTheDocument();
    await user.type(grade, '8');
    expect(grade).toHaveValue(8);

    await user.click(screen.getByLabelText('Regular'));
    expect(screen.queryByLabelText('¿Con qué nota promocionaste?')).not.toBeInTheDocument();
    await user.click(screen.getByLabelText('Promoción'));
    expect(screen.getByLabelText('¿Con qué nota promocionaste?')).toHaveValue(null);
  });

  it('counts the narrative out of 4000', async () => {
    const user = userEvent.setup();
    render(<ReviewForm />);

    expect(screen.getByText('0 / 4000')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Contá tu experiencia'), 'Buena cursada');
    expect(screen.getByText('13 / 4000')).toBeInTheDocument();
  });

  it('previews the entry as the author types', async () => {
    const user = userEvent.setup();
    render(<ReviewForm />);

    await user.click(screen.getByLabelText('Promoción'));
    await user.type(screen.getByLabelText('¿Con qué nota promocionaste?'), '8');
    await user.click(screen.getByLabelText('Tarde'));

    expect(within(preview()).getByText('Promoción · 8')).toBeInTheDocument();
    expect(within(preview()).getByText('Tarde')).toBeInTheDocument();
    expect(within(preview()).getByText('Luciana')).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Publicar como anónimo' }));
    expect(within(preview()).getByText('Anónimo')).toBeInTheDocument();
  });

  it('publishes with the nota de promoción and opens the new reseña with «Publicada»', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue(published('review-new'));

    render(<ReviewForm />);
    await completeRequiredFields(user);
    await user.click(screen.getByLabelText('Promoción'));
    await user.type(screen.getByLabelText('¿Con qué nota promocionaste?'), '9');
    await user.selectOptions(screen.getByLabelText('Profesor/a'), 'professor-1');
    await user.click(screen.getByLabelText('Media'));
    await user.click(screen.getByRole('button', { name: 'Publicar reseña' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/subjects/ED-01/reviews', {
        academicYear: 2026,
        attempt: 'PRIMERA_CURSADA',
        comment: NARRATIVE,
        condition: 'PROMO',
        difficulty: 'MEDIA',
        isAnonymous: false,
        professorId: 'professor-1',
        professorName: null,
        promotionGrade: 9,
        recommendation: 4,
        shift: null,
      });
    });
    expect(navigation.push).toHaveBeenCalledWith('/resenas/review-new?publicada=1');
  });

  it('sends no nota de promoción without Promoción and a manual professor', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue(published('review-new'));

    render(<ReviewForm />);
    await completeRequiredFields(user);
    await user.selectOptions(screen.getByLabelText('Profesor/a'), 'manual');
    await user.type(screen.getByLabelText('Nombre del profesor/a'), 'Ing. Pablo Ruiz');
    await user.click(screen.getByRole('switch', { name: 'Publicar como anónimo' }));
    await user.click(screen.getByRole('button', { name: 'Publicar reseña' }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/subjects/ED-01/reviews',
        expect.objectContaining({
          condition: 'REGULAR',
          isAnonymous: true,
          professorId: null,
          professorName: 'Ing. Pablo Ruiz',
          promotionGrade: null,
        }),
      ),
    );
  });

  it('refuses a nota de promoción outside 1 to 10', async () => {
    const user = userEvent.setup();
    render(<ReviewForm />);
    await completeRequiredFields(user);
    await user.click(screen.getByLabelText('Promoción'));
    await user.type(screen.getByLabelText('¿Con qué nota promocionaste?'), '11');
    await user.click(screen.getByRole('button', { name: 'Publicar reseña' }));

    expect(await screen.findByText('La nota de promoción va de 1 a 10.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows how long to wait when publishing too often', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockRejectedValue(tooManyRequests());

    render(<ReviewForm />);
    await completeRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Publicar reseña' }));

    expect(await screen.findByText(TOO_MANY_REQUESTS_MESSAGE)).toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('requires an explicit confirmation before publishing a probable duplicate cursada', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post)
      .mockRejectedValueOnce({ response: { status: 409, data: { code: 'PROBABLE_DUPLICATE' } } })
      .mockResolvedValueOnce(published('review-duplicate-confirmed'));

    render(<ReviewForm />);
    await completeRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Publicar reseña' }));

    expect(
      await screen.findByRole('dialog', { name: '¿Es otra cursada real?' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Publicar como otra cursada' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));
    expect(vi.mocked(api.post).mock.calls[1]).toEqual([
      '/subjects/ED-01/reviews',
      expect.objectContaining({ confirmProbableDuplicate: true }),
    ]);
    expect(navigation.push).toHaveBeenCalledWith('/resenas/review-duplicate-confirmed?publicada=1');
  });

  it('tells an author in revisión previa that the reseña waits for it', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({
      data: { review: { id: 'review-new' }, outcome: 'PENDING_REVIEW', reason: 'UNVERIFIED_EMAIL' },
    });

    render(<ReviewForm />);
    await completeRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Publicar reseña' }));

    expect(await screen.findByRole('heading', { name: 'En revisión previa' })).toBeInTheDocument();
    expect(screen.getByText(/no verificaste tu email/)).toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('edits with «Guardar cambios», keeping the nota and the anonymity chosen at publishing', async () => {
    const user = userEvent.setup();
    editing(review({ condition: 'PROMO', isAnonymous: true, promotionGrade: 8 }));
    vi.mocked(api.put).mockResolvedValue({ data: { id: 'review-1' } });

    render(<ReviewForm />);

    expect(await screen.findByLabelText('¿Con qué nota promocionaste?')).toHaveValue(8);
    const anonymous = screen.getByRole('switch', { name: 'Publicar como anónimo' });
    expect(anonymous).toBeChecked();
    expect(anonymous).toBeDisabled();
    expect(
      within(screen.getByRole('region', { name: '¿Qué querés contar?' })).queryByRole('link', {
        name: 'Cambiar',
      }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith(
        '/subjects/reviews/review-1',
        expect.objectContaining({ condition: 'PROMO', promotionGrade: 8 }),
      ),
    );
    expect(api.post).not.toHaveBeenCalled();
    expect(navigation.push).toHaveBeenCalledWith('/resenas/review-1');
  });

  it('asks a legacy reseña for its missing facts without inventing them', async () => {
    const user = userEvent.setup();
    editing(
      review({
        academicYear: null,
        attempt: null,
        comment: null,
        condition: 'PREFIERO_NO_RESPONDER',
        difficulty: 3,
      }),
    );
    vi.mocked(api.put).mockResolvedValue({ data: { id: 'review-1' } });

    render(<ReviewForm />);

    expect(await screen.findByText(/esta reseña usa datos heredados/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        'Falta: el ciclo lectivo, el resultado de la cursada, la situación de cursada y el relato.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Ciclo lectivo')).toHaveValue(null);
    expect(screen.getByLabelText('4 estrellas')).toBeChecked();
    expect(screen.getByLabelText('Regular')).not.toBeChecked();
    expect(screen.getByLabelText('Primera cursada')).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText(/elegí el resultado/i)).toBeInTheDocument();
    expect(api.put).not.toHaveBeenCalled();

    await completeRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith(
        '/subjects/reviews/review-1',
        expect.objectContaining({
          academicYear: 2026,
          attempt: 'PRIMERA_CURSADA',
          condition: 'REGULAR',
          difficulty: null,
          promotionGrade: null,
        }),
      ),
    );
  });

  it('resubmits a rejected reseña after the author corrects it', async () => {
    const user = userEvent.setup();
    editing(review(), 'REJECTED', 'Sacá los nombres de compañeros.');
    vi.mocked(api.put).mockResolvedValue({ data: { id: 'review-1' } });
    vi.mocked(api.post).mockResolvedValue({ data: {} });

    render(<ReviewForm />);

    expect(await screen.findByText('Sacá los nombres de compañeros.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Guardar y reenviar' }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/me/submissions/COURSE_REVIEW/review-1/resubmit'),
    );
    expect(await screen.findByRole('heading', { name: 'En revisión previa' })).toBeInTheDocument();
  });

  it('asks a visitor to sign in with a return path', () => {
    useAuthStore.setState({ isLoading: false, user: null });
    render(<ReviewForm />);

    expect(screen.getByRole('heading', { name: 'Iniciá sesión para reseñar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent('/materias/ED-01/resenar')),
    );
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('names the form for assistive technology', () => {
    render(<ReviewForm />);
    expect(form()).toBeInTheDocument();
  });
});

describe('ReviewForm draft across «Cambiar»', () => {
  const DRAFT_KEY = 'experience-draft';
  const storedDraft = () => JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? 'null');
  const keepOnPage = (link: HTMLElement) =>
    link.addEventListener('click', (event) => event.preventDefault());

  beforeEach(() => {
    sessionStorage.clear();
    navigation.push.mockReset();
    navigation.searchParams = new URLSearchParams();
    vi.mocked(api.get).mockImplementation((path) => {
      if (path === '/subjects/ED-01') return Promise.resolve({ data: subject });
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
    vi.mocked(api.post).mockReset();
    useAuthStore.setState({ isLoading: false, user: currentUser });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    sessionStorage.clear();
    useAuthStore.setState({ isLoading: true, user: null });
  });

  it('saves the typed values before «Cambiar» opens the chooser with type and materia', async () => {
    const user = userEvent.setup();
    render(<ReviewForm />);

    await within(screen.getByRole('region', { name: '¿Qué querés contar?' })).findByText(
      'Estructuras de Datos',
    );
    await user.type(screen.getByLabelText('Ciclo lectivo'), '2025');
    await user.click(screen.getByLabelText('Promoción'));
    await user.type(screen.getByLabelText('Contá tu experiencia'), 'Medio relato');
    const change = screen.getByRole('link', { name: 'Cambiar' });
    keepOnPage(change);
    await user.click(change);

    expect(storedDraft()).toMatchObject({
      subjectCode: 'ED-01',
      subjectName: 'Estructuras de Datos',
      type: 'resenar',
      values: { academicYear: '2025', comment: 'Medio relato', condition: 'PROMO' },
    });
    expect(change).toHaveAttribute(
      'href',
      '/experiencias/escribir?tipo=resenar&materia=ED-01&desde=formulario',
    );
  });

  it('restores the draft when it continues from the chooser', async () => {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        subjectCode: 'ED-01',
        subjectName: 'Estructuras de Datos',
        type: 'resenar',
        values: {
          academicYear: '2025',
          comment: 'Medio relato',
          condition: 'PROMO',
          professorChoice: 'professor-1',
          promotionGrade: 8,
        },
      }),
    );
    navigation.searchParams = new URLSearchParams('desde=formulario');
    render(<ReviewForm />);

    expect(await screen.findByLabelText('Contá tu experiencia')).toHaveValue('Medio relato');
    expect(screen.getByLabelText('Ciclo lectivo')).toHaveValue(2025);
    expect(screen.getByLabelText('Promoción')).toBeChecked();
    expect(screen.getByLabelText('¿Con qué nota promocionaste?')).toHaveValue(8);
    await waitFor(() => expect(screen.getByLabelText('Profesor/a')).toHaveValue('professor-1'));
  });

  it('keeps the typed values for another materia but not its professor', async () => {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        subjectCode: 'OTRA',
        subjectName: 'Otra materia',
        type: 'resenar',
        values: { comment: 'Medio relato', professorChoice: 'professor-9' },
      }),
    );
    navigation.searchParams = new URLSearchParams('desde=formulario');
    render(<ReviewForm />);

    expect(await screen.findByLabelText('Contá tu experiencia')).toHaveValue('Medio relato');
    expect(screen.getByLabelText('Profesor/a')).toHaveValue('');
  });

  it('restores the typed values on browser Back from «Cambiar»', async () => {
    const user = userEvent.setup();
    render(<ReviewForm />);

    await within(screen.getByRole('region', { name: '¿Qué querés contar?' })).findByText(
      'Estructuras de Datos',
    );
    await user.type(screen.getByLabelText('Ciclo lectivo'), '2025');
    await user.click(screen.getByLabelText('Promoción'));
    await user.type(screen.getByLabelText('Contá tu experiencia'), 'Medio relato');
    const change = screen.getByRole('link', { name: 'Cambiar' });
    keepOnPage(change);
    await user.click(change);
    cleanup();

    render(<ReviewForm />);

    expect(await screen.findByLabelText('Contá tu experiencia')).toHaveValue('Medio relato');
    expect(screen.getByLabelText('Ciclo lectivo')).toHaveValue(2025);
    expect(screen.getByLabelText('Promoción')).toBeChecked();
  });

  it.each([
    ['another materia', { subjectCode: 'OTRA', type: 'resenar' }],
    ['another type', { subjectCode: 'ED-01', type: 'final' }],
  ])('does not restore a draft of %s on a form opened without the chooser', async (_case, slot) => {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...slot, subjectName: null, values: { comment: 'Medio relato' } }),
    );
    render(<ReviewForm />);

    await within(screen.getByRole('region', { name: '¿Qué querés contar?' })).findByText(
      'Estructuras de Datos',
    );
    expect(screen.getByLabelText('Contá tu experiencia')).toHaveValue('');
  });

  it('clears the draft on a successful publish', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ subjectCode: 'ED-01', subjectName: null, type: 'resenar', values: {} }),
    );
    vi.mocked(api.post).mockResolvedValue(published('review-new'));
    render(<ReviewForm />);

    await completeRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Publicar reseña' }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalled());
    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('clears the draft on «Cancelar»', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ subjectCode: 'ED-01', subjectName: null, type: 'resenar', values: {} }),
    );
    render(<ReviewForm />);

    const cancel = screen.getByRole('link', { name: 'Cancelar' });
    keepOnPage(cancel);
    await user.click(cancel);

    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('only loses the draft when storage is unavailable', async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('denied');
    });
    navigation.searchParams = new URLSearchParams('desde=formulario');
    vi.mocked(api.post).mockResolvedValue(published('review-new'));
    render(<ReviewForm />);

    const change = screen.getByRole('link', { name: 'Cambiar' });
    keepOnPage(change);
    await user.click(change);
    await completeRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Publicar reseña' }));

    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith('/resenas/review-new?publicada=1'),
    );
  });
});
