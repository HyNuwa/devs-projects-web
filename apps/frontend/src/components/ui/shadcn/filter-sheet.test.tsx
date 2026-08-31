import axe from 'axe-core';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Button } from './button';
import { FilterSheet, FilterSheetFieldSet } from './filter-sheet';

afterEach(cleanup);

function renderSheet({ onApply = vi.fn(), onClear = vi.fn() } = {}) {
  const rendered = render(
    <FilterSheet
      onApply={onApply}
      onClear={onClear}
      title="Filtrar materiales"
      trigger={<Button>Mostrar filtros</Button>}
    >
      <FilterSheetFieldSet legend="Tipo de recurso">
        <label className="flex items-center gap-2" htmlFor="resource-type">
          <input id="resource-type" name="resource-type" type="checkbox" />
          Parciales
        </label>
      </FilterSheetFieldSet>
    </FilterSheet>,
  );

  return { ...rendered, onApply, onClear };
}

describe('FilterSheet', () => {
  it('opens from the keyboard, labels its controls, traps focus, and clears without closing', async () => {
    const user = userEvent.setup();
    const { onClear } = renderSheet();
    const trigger = screen.getByRole('button', { name: 'Mostrar filtros' });

    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard('{Enter}');

    const dialog = screen.getByRole('dialog', { name: 'Filtrar materiales' });
    const close = screen.getByRole('button', { name: 'Cerrar filtros' });
    const apply = screen.getByRole('button', { name: 'Aplicar filtros' });

    expect(screen.getByRole('checkbox', { name: 'Parciales' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Tipo de recurso' })).toBeVisible();

    apply.focus();
    await user.tab();
    expect(close).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(dialog).toBeVisible();

    const results = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false } },
    });

    expect(results.violations).toHaveLength(0);
  });

  it('applies, closes explicitly, and closes with Escape while restoring trigger focus', async () => {
    const user = userEvent.setup();
    const { onApply } = renderSheet();
    const trigger = screen.getByRole('button', { name: 'Mostrar filtros' });

    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    expect(onApply).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Cerrar filtros' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
