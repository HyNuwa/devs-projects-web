import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ExperiencePreview } from './ExperiencePreview';

const author = { anonymous: false, avatarSrc: '/avatars/crema.webp', name: 'Luciana' };

describe('ExperiencePreview', () => {
  afterEach(cleanup);

  it('shows a reseña as its detail will, from the typed values', () => {
    render(
      <ExperiencePreview
        author={author}
        kind="review"
        subjectName="Análisis Matemático II"
        values={{
          academicYear: 2025,
          attempt: 'PRIMERA_CURSADA',
          comment: 'Los parciales son largos y toman todo lo de las guías.',
          condition: 'PROMO',
          difficulty: 'ALTA',
          professorName: 'Prof. A. Gómez',
          promotionGrade: 8,
          recommendation: 4,
          shift: 'TARDE',
        }}
      />,
    );

    const preview = screen.getByRole('complementary', { name: 'Así se va a ver' });
    expect(within(preview).getByText('Luciana')).toBeInTheDocument();
    expect(within(preview).getByText('Reseña de cursada · ahora')).toBeInTheDocument();
    expect(
      within(preview).getByRole('heading', { name: 'Análisis Matemático II' }),
    ).toBeInTheDocument();
    for (const fact of [
      'Cursada 2025',
      'Promoción · 8',
      'Primera cursada',
      'Tarde',
      'Alta',
      'Profesor: Prof. A. Gómez',
    ]) {
      expect(within(preview).getByText(fact)).toBeInTheDocument();
    }
    expect(
      within(preview).getByRole('img', { name: 'Recomendación: 4 de 5 estrellas' }),
    ).toBeInTheDocument();
    expect(
      within(preview).getByText('Los parciales son largos y toman todo lo de las guías.'),
    ).toBeInTheDocument();
  });

  it('shows «Anónimo» and drops the nota once the resultado is not Promoción', () => {
    render(
      <ExperiencePreview
        author={{ ...author, anonymous: true }}
        kind="review"
        subjectName="Análisis Matemático II"
        values={{ comment: '', condition: 'REGULAR', promotionGrade: 8 }}
      />,
    );

    const preview = screen.getByRole('complementary', { name: 'Así se va a ver' });
    expect(within(preview).getByText('Anónimo')).toBeInTheDocument();
    expect(within(preview).queryByText('Luciana')).not.toBeInTheDocument();
    expect(within(preview).getByText('Regular')).toBeInTheDocument();
    expect(within(preview).queryByText(/· 8/)).not.toBeInTheDocument();
    expect(within(preview).queryByRole('img', { name: /Recomendación/ })).not.toBeInTheDocument();
    expect(within(preview).getByText('Tu relato aparece acá.')).toBeInTheDocument();
  });

  it('shows a final with the mesa, the preparación, teoría and práctica, and its temas', () => {
    render(
      <ExperiencePreview
        author={author}
        kind="exam"
        subjectName="Análisis Matemático II"
        values={{
          boardSize: 3,
          comment: 'Fueron tres ejercicios y una pregunta de teoría.',
          difficultyPractice: 3,
          difficultyTheory: 4,
          durationMinutes: 180,
          format: 'ESCRITO',
          grade: 7,
          outcome: 'APROBADO',
          prepDailyMinutes: 60,
          prepLeadDays: 21,
          session: 'DICIEMBRE',
          topics: ['Integrales dobles', 'Teorema de Green'],
          year: 2024,
        }}
      />,
    );

    const preview = screen.getByRole('complementary', { name: 'Así se va a ver' });
    expect(within(preview).getByText('Experiencia de final · ahora')).toBeInTheDocument();
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
      expect(within(preview).getByText(fact)).toBeInTheDocument();
    }
    const topics = within(preview).getByRole('list', { name: 'Temas que tomaron' });
    expect(
      within(topics)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Integrales dobles', 'Teorema de Green']);
  });

  it('renders only from the desktop breakpoint up', () => {
    render(<ExperiencePreview author={author} kind="review" subjectName="Física I" values={{}} />);

    expect(screen.getByRole('complementary', { name: 'Así se va a ver' })).toHaveClass(
      'hidden',
      'lg:block',
    );
  });
});
