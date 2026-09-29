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
      'Sanciones',
      'Apelaciones',
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

    expect(document.body).not.toHaveTextContent(/Clasificados|Eventos/);
  });

  it('explains the sanciones and their suggested escalera', () => {
    render(<NormasPage />);

    const section = screen.getByRole('heading', { level: 2, name: 'Sanciones' }).parentElement!;
    expect(section).toHaveTextContent(/Advertencia/);
    expect(section).toHaveTextContent(/Silenciamiento.*7 días/);
    expect(section).toHaveTextContent(/Suspensión/);
    expect(section).toHaveTextContent(/90 días/);
    expect(section).toHaveTextContent(/nunca se aplica sola/i);
  });

  it('explains how to appeal', () => {
    render(<NormasPage />);

    const section = screen.getByRole('heading', { level: 2, name: 'Apelaciones' }).parentElement!;
    expect(section).toHaveTextContent(/una vez/);
    expect(section).toHaveTextContent(/14 días/);
    expect(section).toHaveTextContent(/otra persona/);
    expect(section).toHaveTextContent(/final/);
  });

  it('points authors to Mis envíos', () => {
    render(<NormasPage />);

    expect(screen.getByRole('link', { name: 'Ver mis envíos' })).toHaveAttribute(
      'href',
      '/profile/me#mis-envios',
    );
  });
});
