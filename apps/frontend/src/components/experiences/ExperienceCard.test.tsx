import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/auth';
import type { DiscoveryCourseReview, DiscoveryExamExperience } from '@/types/discovery';

import { ExperienceCard } from './ExperienceCard';

vi.mock('@/lib/api', () => ({ api: { post: vi.fn() } }));

const now = new Date('2026-09-15T12:00:00.000Z');

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

function review(overrides: Partial<DiscoveryCourseReview> = {}): DiscoveryCourseReview {
  return {
    academicYear: 2025,
    attempt: 'PRIMERA_CURSADA',
    author: {
      avatarCat: 'crema',
      avatarUrl: 'https://cdn.example.com/pic.png',
      id: 'user-1',
      username: 'luciana',
    },
    condition: 'REGULAR',
    createdAt: '2026-09-13T12:00:00.000Z',
    difficulty: 'ALTA',
    excerpt: 'Los parciales son largos: practicá con tiempo.',
    id: 'review-1',
    professor: { id: 'prof-1', name: 'Ing. Quiroga' },
    professorName: null,
    recommendation: 4,
    shift: 'TARDE',
    subject: {
      code: 'S2-14',
      href: '/materias/S2-14',
      id: 'subject-1',
      name: 'Algoritmos',
    },
    updatedAt: '2026-09-13T12:00:00.000Z',
    ...overrides,
  };
}

function exam(overrides: Partial<DiscoveryExamExperience> = {}): DiscoveryExamExperience {
  return {
    author: { username: 'Anónimo' },
    createdAt: '2026-09-14T12:00:00.000Z',
    format: 'ESCRITO',
    id: 'exam-1',
    session: 'DICIEMBRE',
    subject: {
      code: 'S2-14',
      href: '/materias/S2-14',
      id: 'subject-1',
      name: 'Algoritmos',
    },
    updatedAt: '2026-09-14T12:00:00.000Z',
    year: 2024,
    ...overrides,
  };
}

describe('ExperienceCard', () => {
  beforeEach(() => {
    useAuthStore.setState({ isLoading: false, user: signedInUser });
    vi.mocked(api.post).mockReset();
  });

  afterEach(cleanup);

  it('renders a named reseña with avatar, context, resultado, stars and actions', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ExperienceCard entry={{ kind: 'review', review: review() }} now={now} />,
    );

    // The chosen cat avatar wins over the uploaded photo, as on the profile.
    const avatar = container.querySelector('img');
    expect(avatar).toHaveAttribute('src', '/avatars/crema.webp');
    expect(screen.getByRole('link', { name: 'luciana' })).toHaveAttribute(
      'href',
      '/usuarios/luciana',
    );
    expect(screen.getByText('Reseña de cursada · hace 2 días')).toBeInTheDocument();
    expect(screen.getByText('Ciclo 2025')).toBeInTheDocument();
    expect(screen.getByText('Tarde')).toBeInTheDocument();
    expect(screen.getByText('Ing. Quiroga')).toBeInTheDocument();
    expect(screen.getByText('Primera cursada')).toBeInTheDocument();
    expect(screen.getByText('Regular')).toBeInTheDocument();
    expect(screen.getByText('Dificultad alta')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Recomendación: 4 de 5 estrellas' }),
    ).toBeInTheDocument();
    expect(screen.getByText('la recomienda')).toBeInTheDocument();
    expect(
      screen.getByText('“Los parciales son largos: practicá con tiempo.”'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Leer completa' })).toHaveAttribute(
      'href',
      '/resenas/review-1',
    );

    await user.click(screen.getByRole('button', { name: 'Reportar' }));
    expect(screen.getByRole('dialog', { name: 'Reportar publicación' })).toBeInTheDocument();
    expect(screen.queryByText(/me sirvió/i)).not.toBeInTheDocument();
  });

  it('renders an anonymous final with the marca de anónimo and no fabricated facts', () => {
    const { container } = render(
      <ExperienceCard
        entry={{
          kind: 'exam',
          exam: exam({ grade: 7, outcome: 'APROBADO' }),
        }}
        now={now}
      />,
    );

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('Anónimo')).toBeInTheDocument();
    // «Anónimo» is a marca, never a perfil link.
    expect(screen.queryByRole('link', { name: 'Anónimo' })).not.toBeInTheDocument();
    expect(screen.getByText('Experiencia de final · hace 1 día')).toBeInTheDocument();
    expect(screen.getByText('Mesa de diciembre 2024')).toBeInTheDocument();
    expect(screen.getByText('Escrito')).toBeInTheDocument();
    expect(screen.getByText('Aprobado · 7')).toBeInTheDocument();
    expect(screen.queryByText(/profesor/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/dificultad/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/desaprobado/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Leer completa' })).toHaveAttribute(
      'href',
      '/finales/exam-1',
    );
  });

  it('reads a NO_RECUERDO mesa as «Final <año>»', () => {
    render(
      <ExperienceCard entry={{ kind: 'exam', exam: exam({ session: 'NO_RECUERDO' }) }} now={now} />,
    );

    expect(screen.getByText('Final 2024')).toBeInTheDocument();
    expect(screen.queryByText(/mesa de/i)).not.toBeInTheDocument();
  });
});
