import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

afterEach(cleanup);

function Menu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Cuenta</DropdownMenuTrigger>
      <DropdownMenuContent aria-label="Cuenta">
        <DropdownMenuItem>Mi perfil</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Cerrar sesión</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe('DropdownMenu', () => {
  it('opens from the keyboard, moves with arrows and returns focus on Escape', async () => {
    const user = userEvent.setup();
    render(<Menu />);

    const trigger = screen.getByRole('button', { name: 'Cuenta' });
    await user.tab();
    await user.keyboard('{Enter}');

    const items = await screen.findAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual(['Mi perfil', 'Cerrar sesión']);
    expect(items[0]).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(items[1]).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
