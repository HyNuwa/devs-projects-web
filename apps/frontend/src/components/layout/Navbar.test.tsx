import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  pathname: vi.fn(),
  useAuthStore: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: mocks.pathname,
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: mocks.useAuthStore,
}));

import { Navbar } from './Navbar';

afterEach(cleanup);

beforeEach(() => {
  mocks.pathname.mockReturnValue('/');
  mocks.logout.mockReset();
  mocks.useAuthStore.mockImplementation((selector) =>
    selector({
      logout: mocks.logout,
      user: null,
    }),
  );
});

describe('Navbar', () => {
  it('shows the four primary destinations, the persistent contribution action, and no forum or ranking link', () => {
    render(<Navbar />);

    const navigation = screen.getByRole('navigation', { name: 'Navegación principal' });

    for (const label of ['Materias', 'Reseñas', 'Materiales', 'Finales']) {
      expect(within(navigation).getByRole('link', { name: label })).toBeVisible();
    }

    expect(screen.getByRole('link', { name: 'Subir material' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible();
    expect(within(navigation).queryByRole('link', { name: 'Foro' })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole('link', { name: 'Ranking' })).not.toBeInTheDocument();
  });

  it.each([
    ['/materias/s2-14', 'Materias'],
    ['/resenas/42', 'Reseñas'],
    ['/materiales/nuevo', 'Materiales'],
    ['/finales/42', 'Finales'],
  ])('marks %s as the active route', (pathname, activeLabel) => {
    mocks.pathname.mockReturnValue(pathname);

    render(<Navbar />);

    expect(screen.getByRole('link', { name: activeLabel })).toHaveAttribute('aria-current', 'page');
  });

  it('exposes the same compact mobile navigation with managed focus', async () => {
    const user = userEvent.setup();
    mocks.pathname.mockReturnValue('/materiales/nuevo');
    render(<Navbar />);

    const trigger = screen.getByRole('button', { name: 'Abrir navegación' });
    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Menú principal' });
    const navigation = within(dialog).getByRole('navigation', { name: 'Navegación principal' });

    for (const label of ['Materias', 'Reseñas', 'Materiales', 'Finales']) {
      expect(within(navigation).getByRole('link', { name: label })).toBeVisible();
    }

    expect(within(dialog).getByRole('link', { name: 'Subir material' })).toBeVisible();
    expect(within(navigation).getByRole('link', { name: 'Materiales' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
