import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import NormasPage from './page';

afterEach(cleanup);

describe('/normas', () => {
  it('presents the rules in force with their sections', () => {
    render(<NormasPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: /Normas de la comunidad/ }),
    ).toBeInTheDocument();
    for (const section of [
      'Lo principal',
      'Materiales',
      'Reseñas y experiencias',
      'Convivencia',
      'Si algo no cumple',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: section })).toBeInTheDocument();
    }
  });

  it('explains immediate publication and the qualified hiding rules', () => {
    render(<NormasPage />);

    expect(screen.getAllByText(/Se publica al instante/).length).toBeGreaterThan(0);
    expect(document.body).toHaveTextContent(/tres reportes/i);
    expect(document.body).toHaveTextContent(/email verificado y más de 7 días de antigüedad/);
  });

  it('does not describe features or processes that do not exist yet', () => {
    render(<NormasPage />);

    expect(document.body).not.toHaveTextContent(
      /Clasificados|Eventos|apelar|apelación|suspende|silencia/i,
    );
  });

  it('points authors to Mis envíos', () => {
    render(<NormasPage />);

    expect(screen.getByRole('link', { name: 'Ver mis envíos' })).toHaveAttribute(
      'href',
      '/profile/me#mis-envios',
    );
  });
});
