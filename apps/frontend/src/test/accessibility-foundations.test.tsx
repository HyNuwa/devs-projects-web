import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import axe from 'axe-core';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { Button, Disclosure, ErrorState, Field, FieldLabel, Input } from '@/components/ui/shadcn';

afterEach(cleanup);

describe('global accessibility foundations', () => {
  it('keeps global focus, zoom, status, and reduced-motion rules in the stylesheet', () => {
    const styles = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');

    expect(styles).toContain(':focus-visible');
    expect(styles).toContain('outline: 3px solid var(--ring)');
    expect(styles).toContain('max-inline-size: 100%');
    expect(styles).toContain('data-status-icon');
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(styles).toContain('animation-duration: 0.01ms !important');
  });

  it('keeps a representative journey operable with the keyboard and exposes non-color error evidence', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <main>
        <a href="#resource-results">Ir a resultados</a>
        <Button>Buscar materiales</Button>
        <Field>
          <FieldLabel htmlFor="fixture-query">Materia</FieldLabel>
          <Input id="fixture-query" />
        </Field>
        <Disclosure title="Ver filtros activos">Parciales · 1.er año</Disclosure>
        <ErrorState description="Reintentá la búsqueda." />
      </main>,
    );

    const skipLink = screen.getByRole('link', { name: 'Ir a resultados' });
    const search = screen.getByRole('button', { name: 'Buscar materiales' });
    const query = screen.getByLabelText('Materia');
    const disclosure = screen.getByText('Ver filtros activos').closest('summary');

    await user.tab();
    expect(skipLink).toHaveFocus();
    await user.tab();
    expect(search).toHaveFocus();
    await user.tab();
    expect(query).toHaveFocus();
    await user.tab();
    expect(disclosure).toHaveFocus();

    const errorState = screen.getByRole('alert');
    expect(errorState).toHaveAttribute('data-status', 'error');
    expect(errorState.querySelector('[data-status-icon] svg')).toBeInTheDocument();
    expect(errorState).toHaveTextContent('No pudimos cargar esto');

    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });

    expect(results.violations).toHaveLength(0);
  });
});
