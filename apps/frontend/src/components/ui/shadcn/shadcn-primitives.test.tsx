import axe from 'axe-core';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import {
  Button,
  Chip,
  Disclosure,
  EmptyState,
  ErrorState,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  LoadingState,
} from '.';

async function expectNoAccessibleViolations(container: Element) {
  const results = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
    },
  });

  expect(results.violations).toHaveLength(0);
}

afterEach(cleanup);

describe('Pixel Notebook shadcn primitives', () => {
  it('renders the semantic button variants and keeps the default button type safe for forms', async () => {
    const user = userEvent.setup();

    render(
      <form>
        <Button>Guardar</Button>
        <Button variant="outline">Cancelar</Button>
      </form>,
    );

    const save = screen.getByRole('button', { name: 'Guardar' });
    const cancel = screen.getByRole('button', { name: 'Cancelar' });

    expect(save).toHaveAttribute('type', 'button');
    expect(save).toHaveClass('bg-primary');
    expect(cancel).toHaveClass('bg-background');

    await user.tab();
    expect(save).toHaveFocus();
  });

  it('connects labels, descriptions, and errors to form controls', async () => {
    const { container } = render(
      <Field>
        <FieldLabel htmlFor="resource-title">Título del recurso</FieldLabel>
        <Input
          aria-describedby="resource-title-help resource-title-error"
          aria-invalid="true"
          id="resource-title"
          name="title"
        />
        <FieldDescription id="resource-title-help">
          Usá un nombre que se pueda buscar.
        </FieldDescription>
        <FieldError id="resource-title-error">El título es obligatorio.</FieldError>
      </Field>,
    );

    expect(screen.getByLabelText('Título del recurso')).toHaveAttribute('name', 'title');
    expect(screen.getByRole('alert')).toHaveTextContent('El título es obligatorio.');
    await expectNoAccessibleViolations(container);
  });

  it('uses native disclosure semantics and exposes compact status states', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <Chip tone="success">Recurso publicado</Chip>
        <Disclosure title="Ver contexto del recurso">
          Incluye el cuatrimestre y la comisión.
        </Disclosure>
        <LoadingState description="Estamos buscando materiales." />
        <EmptyState description="Probá con otra materia." />
        <ErrorState description="Volvé a intentarlo en unos minutos." />
      </>,
    );

    const disclosure = screen.getByText('Ver contexto del recurso').closest('details');
    expect(disclosure).not.toHaveAttribute('open');

    await user.click(screen.getByText('Ver contexto del recurso'));
    expect(disclosure).toHaveAttribute('open');
    expect(screen.getByRole('status')).toHaveTextContent('Cargando');
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar esto');
    expect(screen.getByText('Recurso publicado')).toHaveAttribute('data-slot', 'chip');
    await expectNoAccessibleViolations(container);
  });
});
