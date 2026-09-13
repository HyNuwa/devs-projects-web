import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { CourseReviewSummaryCard, FinalExperienceSummaryCard } from './CommunitySummaryCards';

afterEach(cleanup);

describe('CommunitySummaryCards', () => {
  it('renders a compact course-review card with accessible stars and only known facts', () => {
    render(
      <CourseReviewSummaryCard
        summary={{
          academicYear: 2025,
          attempt: 'PRIMERA_RECURSADA',
          author: { username: 'luciana' },
          condition: 'REGULAR',
          createdAt: '2026-08-01T12:00:00.000Z',
          difficulty: 'ALTA',
          excerpt:
            'Los ejercicios prácticos ayudaron a entender el ritmo de los parciales y a preparar cada instancia.',
          id: 'review-1',
          professorName: 'Ing. Quiroga',
          recommendation: 4,
          shift: 'TARDE',
          subject: { href: '/materias/S2-14', name: 'Algoritmos y Estructuras de Datos' },
          updatedAt: '2026-08-03T12:00:00.000Z',
        }}
      />,
    );

    expect(screen.getByRole('link', { name: 'Algoritmos y Estructuras de Datos' })).toHaveAttribute(
      'href',
      '/materias/S2-14',
    );
    expect(screen.getByLabelText('Recomendación: 4 de 5 estrellas')).toBeInTheDocument();
    expect(screen.getByText('Cursada 2025')).toBeInTheDocument();
    expect(screen.getByText('Primera recursada')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
    expect(screen.getByText('Profesor: Ing. Quiroga')).toBeInTheDocument();
    expect(screen.getByText(/^Editada · /)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Leer más' })).toHaveAttribute(
      'href',
      '/resenas/review-1',
    );
    expect(screen.getByText(/los ejercicios prácticos ayudaron/i)).toHaveClass('line-clamp-4');
  });

  it('keeps stars, excerpt, facts, and actions in shared subgrid rows so sibling cards align', () => {
    const { container } = render(
      <div className="grid lg:grid-cols-2">
        <CourseReviewSummaryCard
          summary={{
            author: { username: 'Anónimo' },
            createdAt: '2026-08-01T12:00:00.000Z',
            excerpt: 'Relato breve.',
            id: 'review-short',
            recommendation: 5,
            updatedAt: '2026-08-01T12:00:00.000Z',
          }}
        />
        <FinalExperienceSummaryCard
          summary={{
            createdAt: '2026-08-01T12:00:00.000Z',
            id: 'final-without-excerpt',
            updatedAt: '2026-08-01T12:00:00.000Z',
          }}
        />
      </div>,
    );

    const cards = container.querySelectorAll('article[data-community-summary]');
    expect(cards).toHaveLength(2);

    for (const card of cards) {
      expect(card).toHaveClass('grid-rows-subgrid', 'row-span-4');
      // header, excerpt, facts, footer are always rendered so rows line up even with missing data.
      expect(card.children).toHaveLength(4);
      expect(card.children[0].tagName).toBe('HEADER');
      expect(card.children[3].tagName).toBe('FOOTER');
      expect(card.children[3]).toHaveTextContent('Leer más');
    }

    // Stars stay visual-only with a single accessible name.
    expect(
      screen.getByRole('img', { name: 'Recomendación: 5 de 5 estrellas' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Recomendación: 5 de 5 estrellas')).not.toBeInTheDocument();
    expect(screen.getAllByText('Anónimo')).toHaveLength(2);
  });

  it('uses the anonymous identity and omits unknown optional course facts', () => {
    render(
      <CourseReviewSummaryCard
        summary={{
          author: { username: 'Anónimo' },
          createdAt: '2026-08-01T12:00:00.000Z',
          id: 'review-anonymous',
          recommendation: 3,
          updatedAt: '2026-08-01T12:00:00.000Z',
        }}
      />,
    );

    expect(screen.getByText('Anónimo')).toBeInTheDocument();
    expect(screen.getByLabelText('Recomendación: 3 de 5 estrellas')).toBeInTheDocument();
    expect(screen.queryByText(/profesor:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/dificultad no informada/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/editada/i)).not.toBeInTheDocument();
  });

  it('renders final facts without fabricating optional data and labels legacy difficulty', () => {
    render(
      <FinalExperienceSummaryCard
        summary={{
          author: { username: 'Anónimo' },
          createdAt: '2026-08-01T12:00:00.000Z',
          difficultyPractice: 2,
          difficultyTheory: 4,
          excerpt:
            'Tomaron recorridos, complejidad y la defensa oral de una implementación propia.',
          format: 'MIXTO',
          id: 'final-1',
          session: 'FEBRERO_MARZO',
          updatedAt: '2026-08-01T12:00:00.000Z',
          year: 2026,
        }}
      />,
    );

    expect(screen.getByText('Final 2026')).toBeInTheDocument();
    expect(screen.getByText('Febrero–marzo')).toBeInTheDocument();
    expect(screen.getByText('Mixto')).toBeInTheDocument();
    expect(screen.getByText('Teórica: Dificultad histórica: 4/5')).toBeInTheDocument();
    expect(screen.getByText('Práctica: Dificultad histórica: 2/5')).toBeInTheDocument();
    expect(screen.queryByText(/^Tomó:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Nota:/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Leer más' })).toHaveAttribute(
      'href',
      '/finales/final-1',
    );
  });
});
