import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FormField, FormSection } from './FormSection';

describe('FormSection', () => {
  afterEach(cleanup);

  it('numbers its heading and names the section after the title', () => {
    render(
      <FormSection number={2} title="Contexto de la cursada">
        <p>contenido</p>
      </FormSection>,
    );

    const section = screen.getByRole('region', { name: 'Contexto de la cursada' });
    expect(within(section).getByRole('heading', { level: 2 })).toHaveTextContent(
      '2Contexto de la cursada',
    );
    expect(within(section).getByText('contenido')).toBeInTheDocument();
  });

  it('tags a whole section as «Opcional» with its subtitle', () => {
    render(
      <FormSection
        number={5}
        requirement="optional"
        subtitle="así otros saben qué estudiar"
        title="Preparación"
      >
        <p>contenido</p>
      </FormSection>,
    );

    const section = screen.getByRole('region', { name: 'Preparación' });
    expect(within(section).getByText('Opcional')).toBeInTheDocument();
    expect(within(section).getByText('así otros saben qué estudiar')).toBeInTheDocument();
  });

  it('tags required and optional fields and links their help and error', () => {
    render(
      <>
        <FormField
          error="Ingresá un ciclo lectivo."
          htmlFor="academicYear"
          id="academicYear"
          label="Ciclo lectivo"
          requirement="required"
        >
          <input aria-describedby="academicYear-error" id="academicYear" />
        </FormField>
        <FormField
          group
          help="Aparece solo si elegís Promoción."
          id="shift"
          label="Franja horaria"
          requirement="optional"
        >
          <input aria-label="Tarde" type="radio" />
        </FormField>
      </>,
    );

    const year = screen.getByLabelText('Ciclo lectivo');
    expect(year).toHaveAccessibleDescription('Ingresá un ciclo lectivo.');
    expect(screen.getByText('Obligatorio')).toBeInTheDocument();

    const shift = screen.getByRole('group', { name: 'Franja horaria' });
    expect(within(shift).getByText('Opcional')).toBeInTheDocument();
    expect(shift).toHaveAccessibleDescription('Aparece solo si elegís Promoción.');
  });
});
