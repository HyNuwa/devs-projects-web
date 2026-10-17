import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { CourseResultsBreakdown, SubjectSummary } from '@/components/experiences/SubjectSummary';
import { summaryFixture } from '@/test/experiences';
import type { SubjectExperiencesSummary } from '@/lib/experiences-client';

const fixture = summaryFixture;

function withResults(
  summary: SubjectExperiencesSummary,
  results: SubjectExperiencesSummary['reviews']['results'],
): SubjectExperiencesSummary {
  return { ...summary, reviews: { ...summary.reviews, results } };
}

function withExams(
  summary: SubjectExperiencesSummary,
  exams: Partial<SubjectExperiencesSummary['exams']>,
): SubjectExperiencesSummary {
  return { ...summary, exams: { ...summary.exams, ...exams } };
}

describe('SubjectSummary', () => {
  afterEach(cleanup);

  it('headlines the combined count and names both bodies honestly', () => {
    render(<SubjectSummary summary={fixture} />);

    expect(screen.getByRole('heading', { name: 'Resumen de 58 experiencias' })).toBeInTheDocument();
    expect(screen.getByText('reseñas de cursada')).toBeInTheDocument();
    expect(screen.getByText('experiencias de final')).toBeInTheDocument();
  });

  it('recommends with its answer count and never fakes a missing average', () => {
    render(<SubjectSummary summary={fixture} />);
    expect(screen.getByText('3,9/5')).toBeInTheDocument();
    expect(screen.getByText(/34 respuestas/)).toBeInTheDocument();

    const single = {
      ...fixture,
      reviews: {
        ...fixture.reviews,
        recommendation: { average: 5, count: 1 },
      },
    };
    render(<SubjectSummary summary={single} />);
    expect(screen.getByText('5,0/5')).toBeInTheDocument();
    expect(screen.getByText(/1 respuesta$/)).toBeInTheDocument();

    const missing = {
      ...fixture,
      reviews: {
        ...fixture.reviews,
        recommendation: { average: null, count: 0 },
      },
    };
    render(<SubjectSummary summary={missing} />);
    expect(screen.queryByText('0,0/5')).not.toBeInTheDocument();
    expect(screen.queryByText('0/5')).not.toBeInTheDocument();
  });

  it('breaks down the result with API percents, each with its count', () => {
    render(<SubjectSummary summary={fixture} />);

    const cursada = screen.getByRole('heading', { name: 'Cómo terminó la cursada' });
    expect(cursada).toBeInTheDocument();
    expect(screen.getByText(/38%/)).toBeInTheDocument();
    expect(screen.getByText(/45%/)).toBeInTheDocument();
    expect(screen.getByText(/17%/)).toBeInTheDocument();
    expect(screen.getByText(/29 contaron el resultado/)).toBeInTheDocument();
    expect(screen.getByText(/5 prefirieron no responder/)).toBeInTheDocument();
  });

  it('falls back to explicit counts and a count sentence without percents', () => {
    const noPercents = withResults(fixture, {
      answered: 3,
      libre: 0,
      percents: null,
      promo: 2,
      regular: 1,
      unanswered: 31,
    });
    render(<SubjectSummary summary={noPercents} />);

    expect(screen.getByText('2 de 3 promocionaron')).toBeInTheDocument();
    // No percentage bars/meters are fabricated from counts.
    expect(screen.queryByRole('meter', { name: /Promoción/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    expect(screen.getByText(/31 prefirieron no responder/)).toBeInTheDocument();
  });

  it('uses singular grammar for a lone promoción or respuesta', () => {
    const one = withResults(fixture, {
      answered: 1,
      libre: 0,
      percents: null,
      promo: 1,
      regular: 0,
      unanswered: 1,
    });
    render(<SubjectSummary summary={one} />);

    expect(screen.getByText('1 de 1 promocionó')).toBeInTheDocument();
    expect(screen.getByText(/1 prefirió no responder/)).toBeInTheDocument();
  });

  it('shows no result rows at all when nobody answered', () => {
    const none = withResults(fixture, {
      answered: 0,
      libre: 0,
      percents: null,
      promo: 0,
      regular: 0,
      unanswered: 34,
    });
    render(<SubjectSummary summary={none} />);

    expect(screen.queryByText(/de 0/)).not.toBeInTheDocument();
    expect(screen.getByText(/todavía nadie contó/i)).toBeInTheDocument();
  });

  it('draws the difficulty histogram including zero-count levels', () => {
    render(<SubjectSummary summary={fixture} />);

    expect(screen.getByRole('heading', { name: 'Dificultad de la cursada' })).toBeInTheDocument();
    for (const label of ['Muy baja', 'Baja', 'Media', 'Alta', 'Muy alta']) {
      expect(screen.getByRole('meter', { name: new RegExp(label) })).toBeInTheDocument();
    }
    // A zero-count level keeps a real zero-width bar, not a fake minimum.
    const withZero = {
      ...fixture,
      reviews: {
        ...fixture.reviews,
        difficulty: {
          ...fixture.reviews.difficulty,
          counts: { ...fixture.reviews.difficulty.counts, MUY_BAJA: 0 },
        },
      },
    };
    render(<SubjectSummary summary={withZero} />);
    const zero = screen.getAllByRole('meter', { name: /Muy baja/ }).at(-1)!;
    const fill = zero.querySelector('span span') as HTMLElement;
    expect(fill.style.width).toBe('0%');
  });

  it('names no mode when the API did not compute one', () => {
    const noTop = {
      ...fixture,
      reviews: {
        ...fixture.reviews,
        difficulty: { ...fixture.reviews.difficulty, top: null },
      },
    };
    render(<SubjectSummary summary={noTop} />);
    expect(screen.queryByText(/La más elegida/)).not.toBeInTheDocument();
  });

  it('presents the final: format counts, approval counts, averages, mesa', () => {
    render(<SubjectSummary summary={fixture} />);

    expect(screen.getByRole('heading', { name: 'El final' })).toBeInTheDocument();
    expect(screen.getByText('Escrito')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('aprobaron 15 de 22')).toBeInTheDocument();
    expect(screen.getByText(/2 sin resultado declarado/)).toBeInTheDocument();
    expect(screen.queryByText(/prefirieron no decir/)).not.toBeInTheDocument();
    expect(screen.getByText(/3,4\/5 · 9 respuestas/)).toBeInTheDocument();
    expect(screen.getByText(/2,8\/5 · 8 respuestas/)).toBeInTheDocument();
    expect(screen.getByText(/Mesa más comentada/)).toBeInTheDocument();
    expect(screen.getByText(/Diciembre/)).toBeInTheDocument();
    expect(screen.getByText(/6,4 · 15 notas/)).toBeInTheDocument();
  });

  it('keeps counts honest when theory, practice or grade have no average', () => {
    const sparse = withExams(fixture, {
      grade: { average: null, count: 4 },
      practice: { average: null, count: 2 },
      theory: { average: null, count: 2 },
    });
    render(<SubjectSummary summary={sparse} />);

    expect(screen.queryByText('0/5')).not.toBeInTheDocument();
    expect(screen.queryByText('0,0')).not.toBeInTheDocument();
    expect(screen.getByText(/4 notas/)).toBeInTheDocument();
    expect(screen.getAllByText(/2 respuestas/)).toHaveLength(2);
  });

  it('exports CourseResultsBreakdown for the detail body', () => {
    render(<CourseResultsBreakdown results={fixture.reviews.results} />);
    expect(screen.getByRole('heading', { name: 'Cómo terminó la cursada' })).toBeInTheDocument();
  });
});
