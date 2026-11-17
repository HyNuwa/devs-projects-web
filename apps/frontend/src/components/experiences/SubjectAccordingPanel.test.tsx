import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SubjectAccordingPanel } from '@/components/experiences/SubjectAccordingPanel';
import { summaryFixture } from '@/test/experiences';
import type { SubjectExperiencesSummary } from '@/lib/experiences-client';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/api', () => ({ api: { post: vi.fn() } }));

const fixture = summaryFixture as SubjectExperiencesSummary;

describe('SubjectAccordingPanel', () => {
  afterEach(cleanup);

  it('names the subject result picture for a review detail', () => {
    render(<SubjectAccordingPanel kind="review" summary={fixture} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'La materia según 34 reseñas' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/3,9\/5/)).toBeInTheDocument();
    expect(screen.getByText(/34 respuestas/)).toBeInTheDocument();
    expect(screen.getByText(/Dificultad más elegida: Alta/)).toBeInTheDocument();
    expect(screen.getByText(/29 contaron el resultado/)).toBeInTheDocument();
  });

  it('names the final picture for an exam detail', () => {
    render(<SubjectAccordingPanel kind="exam" summary={fixture} />);

    expect(
      screen.getByRole('heading', { name: 'La materia según 24 finales' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/aprobaron 15 de 22/)).toBeInTheDocument();
    expect(screen.getByText(/Formato más común: Escrito/)).toBeInTheDocument();
    expect(screen.getByText(/3,4\/5/)).toBeInTheDocument();
    expect(screen.getByText(/2,8\/5/)).toBeInTheDocument();
  });

  it('never fabricates absent averages or a mode the API did not compute', () => {
    const sparse: SubjectExperiencesSummary = {
      ...fixture,
      exams: {
        ...fixture.exams,
        formats: { ...fixture.exams.formats, top: null },
        grade: { average: null, count: 4 },
        practice: { average: null, count: 0 },
        theory: { average: null, count: 0 },
      },
      reviews: {
        ...fixture.reviews,
        difficulty: { ...fixture.reviews.difficulty, top: null },
        recommendation: { average: null, count: 0 },
      },
    };
    render(<SubjectAccordingPanel kind="review" summary={sparse} />);
    expect(screen.queryByText(/0,?0?\/5/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dificultad más elegida/)).not.toBeInTheDocument();

    render(<SubjectAccordingPanel kind="exam" summary={sparse} />);
    expect(screen.queryByText(/Formato más común/)).not.toBeInTheDocument();
  });

  it('adds the nota de promoción to a review detail', () => {
    render(<SubjectAccordingPanel kind="review" summary={fixture} />);

    expect(
      screen.getByText('Nota de promoción · 8,2 / 10 promedio · la informaron 9 de 11'),
    ).toBeInTheDocument();

    cleanup();
    render(
      <SubjectAccordingPanel
        kind="review"
        summary={{
          ...fixture,
          reviews: {
            ...fixture.reviews,
            promotionGrade: { average: null, informed: 4, promoted: 6 },
          },
        }}
      />,
    );
    expect(screen.getByText('Nota de promoción · la informaron 4 de 6')).toBeInTheDocument();
  });

  it('adds the mesa sentence, the preparación típica and the temas to an exam detail', () => {
    render(<SubjectAccordingPanel kind="exam" summary={fixture} />);

    expect(
      screen.getByText(
        'La mesa más comentada es diciembre (9): suele haber 3 profesores y 3 horas',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Preparación típica')).toBeInTheDocument();
    expect(screen.getByText('3 semanas antes, 1 h por día')).toBeInTheDocument();
    const topics = screen.getByRole('list', { name: 'Temas que más toman' });
    expect(within(topics).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByText(/Nota de promoción/)).not.toBeInTheDocument();
  });

  it('drops the parts of the final picture nobody declared enough of', () => {
    render(
      <SubjectAccordingPanel
        kind="exam"
        summary={{
          ...fixture,
          exams: {
            ...fixture.exams,
            preparation: {
              dailyMinutes: { median: null, count: 1 },
              leadDays: { median: null, count: 2 },
            },
            topSession: {
              boardSize: { median: null, count: 2 },
              count: 9,
              duration: { median: 90, count: 3 },
              session: 'DICIEMBRE',
            },
            topics: [],
          },
        }}
      />,
    );

    expect(
      screen.getByText('La mesa más comentada es diciembre (9): suele durar 1 h 30 min'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Preparación típica')).not.toBeInTheDocument();
    expect(screen.queryByText('Temas que más toman')).not.toBeInTheDocument();
  });

  it('links to every experience of the subject and owns no writing action', async () => {
    render(<SubjectAccordingPanel kind="review" summary={fixture} />);

    expect(screen.getByRole('link', { name: 'Ver todas las experiencias' })).toHaveAttribute(
      'href',
      '/experiencias/06',
    );
    // The pure panel owns no writing menu — the parent always offers it.
    expect(screen.queryByRole('button', { name: /escribir/i })).not.toBeInTheDocument();
  });

  it('presents counts and a count sentence when the API has no percents', () => {
    render(
      <SubjectAccordingPanel
        kind="review"
        summary={{
          ...fixture,
          reviews: {
            ...fixture.reviews,
            count: 3,
            recommendation: { average: 5, count: 3 },
            results: {
              answered: 3,
              libre: 0,
              percents: null,
              promo: 2,
              regular: 1,
              unanswered: 0,
            },
          },
        }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'La materia según 3 reseñas' })).toBeInTheDocument();
    expect(screen.getByText('2 de 3 promocionaron')).toBeInTheDocument();
    expect(screen.queryByRole('meter', { name: /Promoción/ })).not.toBeInTheDocument();
  });

  it('still shows the recommendation from a single answer with its N', () => {
    render(
      <SubjectAccordingPanel
        kind="review"
        summary={{
          ...fixture,
          reviews: {
            ...fixture.reviews,
            count: 1,
            recommendation: { average: 5, count: 1 },
            results: {
              answered: 1,
              libre: 0,
              percents: null,
              promo: 1,
              regular: 0,
              unanswered: 0,
            },
          },
        }}
      />,
    );
    expect(screen.getByText(/5,0\/5/)).toBeInTheDocument();
    expect(screen.getByText(/1 respuesta/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'La materia según 1 reseña' })).toBeInTheDocument();
  });
});
