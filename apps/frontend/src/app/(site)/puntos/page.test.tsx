import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import PuntosPage from './page';

afterEach(cleanup);

describe('/puntos', () => {
  it('explains what earns points, with each amount and limit', () => {
    render(<PuntosPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: /Cómo funcionan los puntos/ }),
    ).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Qué suma' });
    for (const [action, points] of [
      ['Material publicado', '+10'],
      ['Reseña de cursada con nombre', '+5'],
      ['Experiencia de final con nombre', '+5'],
      ['«Me sirvió» en tu material', '+1'],
      ['Primera huella', '+5'],
      ['Reporte confirmado', '+2'],
      ['Corrección aceptada', '+2'],
    ]) {
      const row = within(table).getByRole('row', { name: new RegExp(action) });
      expect(row).toHaveTextContent(points);
    }
  });

  it('says that anonymous entries never earn points', () => {
    render(<PuntosPage />);

    expect(screen.getByText(/Las publicaciones anónimas no suman puntos/)).toBeInTheDocument();
  });

  it('explains which «Me sirvió» count and what happens on a retiro', () => {
    render(<PuntosPage />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Qué «Me sirvió» cuentan' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/email verificado y sin sanciones/)).toBeInTheDocument();
    expect(screen.getByText(/se descuentan los puntos que te dio/)).toBeInTheDocument();
  });

  it('explains the privilegios de confianza and Lupa', () => {
    render(<PuntosPage />);

    const section = screen.getByRole('region', { name: 'Privilegios de confianza' });
    expect(within(section).getByText(/Sugerir correcciones/)).toBeInTheDocument();
    expect(within(section).getByText(/Reportes prioritarios/)).toBeInTheDocument();
    expect(within(section).getByText(/90 días sin sanciones/)).toBeInTheDocument();
    expect(within(section).getByText(/Lupa/)).toBeInTheDocument();
  });

  it('lists the ten levels with their thresholds', () => {
    render(<PuntosPage />);

    const levels = screen.getByRole('list', { name: 'Niveles' });
    const items = within(levels).getAllByRole('listitem');
    expect(items).toHaveLength(10);
    expect(items[0]).toHaveTextContent('Primeros pasos');
    expect(items[9]).toHaveTextContent('Leyenda de la facultad');
    expect(items[9]).toHaveTextContent('4.500');
  });
});
