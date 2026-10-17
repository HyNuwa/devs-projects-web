import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SameContextPanel } from '@/components/experiences/SameContextPanel';
import type {
  CourseReviewRelated as ReviewRelated,
  ExamExperienceRelated as ExamRelated,
} from '@/lib/experiences-client';
import type { DiscoveryCourseReview, DiscoveryExamExperience } from '@/types/discovery';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/api', () => ({ api: { post: vi.fn() } }));

const now = new Date('2026-10-16T12:00:00Z');

function review(id: string, excerpt: string): DiscoveryCourseReview {
  return {
    academicYear: 2025,
    attempt: 'PRIMERA_CURSADA',
    author: { avatarCat: null, avatarUrl: null, id: `u-${id}`, username: `user-${id}` },
    condition: 'REGULAR',
    createdAt: '2026-09-13T12:00:00.000Z',
    difficulty: 'MEDIA',
    excerpt,
    id,
    professor: null,
    professorName: null,
    recommendation: 4,
    shift: 'TARDE',
    subject: { code: '06', href: '/materias/06', id: 's1', name: 'Análisis Matemático II' },
    updatedAt: '2026-09-13T12:00:00.000Z',
  };
}

function exam(id: string, excerpt: string): DiscoveryExamExperience {
  return {
    author: { username: 'Anónimo' },
    createdAt: '2026-09-14T12:00:00.000Z',
    excerpt,
    format: 'ESCRITO',
    id,
    outcome: 'APROBADO',
    session: 'DICIEMBRE',
    subject: { code: '06', href: '/materias/06', id: 's1', name: 'Análisis Matemático II' },
    updatedAt: '2026-09-14T12:00:00.000Z',
    year: 2024,
  };
}

const reviewRelated = (
  items: DiscoveryCourseReview[],
  context: ReviewRelated['sharedContext'],
): ReviewRelated => ({
  items,
  sharedContext: context,
});

const examRelated = (items: DiscoveryExamExperience[]): ExamRelated => ({
  items,
  sharedContext: { format: 'ESCRITO', session: 'DICIEMBRE' },
});

describe('SameContextPanel', () => {
  afterEach(cleanup);

  it('names the shared professor and shift for reviews', () => {
    render(
      <SameContextPanel
        code="06"
        kind="review"
        now={now}
        related={reviewRelated([review('r1', 'Misma profe')], {
          professor: { name: 'Ing. Quiroga' },
          shift: 'TARDE',
        })}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Con el mismo contexto' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Tarde · Ing. Quiroga')).toBeInTheDocument();
    expect(screen.getByText(/Misma profe/)).toBeInTheDocument();
  });

  it('names the shared session and format for exams', () => {
    render(
      <SameContextPanel
        code="06"
        kind="exam"
        now={now}
        related={examRelated([exam('e1', 'Mismo mesa')])}
      />,
    );
    expect(screen.getByText('Diciembre · Escrito')).toBeInTheDocument();
    expect(screen.getByText(/Mismo mesa/)).toBeInTheDocument();
  });

  it('renders nothing for a review without shared context', () => {
    const { container } = render(
      <SameContextPanel
        code="06"
        kind="review"
        now={now}
        related={reviewRelated([review('r1', 'x')], null)}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows an honest empty state when the context has no items', () => {
    render(
      <SameContextPanel
        code="06"
        kind="review"
        now={now}
        related={reviewRelated([], { shift: 'TARDE' })}
      />,
    );
    expect(
      screen.getByText('Todavía no hay otras experiencias públicas con este contexto.'),
    ).toBeInTheDocument();
  });

  it('caps the list at three cards', () => {
    const items = [
      review('r1', 'uno'),
      review('r2', 'dos'),
      review('r3', 'tres'),
      review('r4', 'cuatro'),
    ];
    render(
      <SameContextPanel
        code="06"
        kind="review"
        now={now}
        related={reviewRelated(items, { shift: 'TARDE' })}
      />,
    );
    expect(screen.getByText(/uno/)).toBeInTheDocument();
    expect(screen.getByText(/tres/)).toBeInTheDocument();
    expect(screen.queryByText(/cuatro/)).not.toBeInTheDocument();
  });

  it('links to all subject experiences', () => {
    render(
      <SameContextPanel code="06" kind="exam" now={now} related={examRelated([exam('e1', 'x')])} />,
    );
    expect(
      screen.getByRole('link', { name: /ver todas las experiencias|todas las experiencias/i }),
    ).toHaveAttribute('href', '/experiencias/06');
  });
});
