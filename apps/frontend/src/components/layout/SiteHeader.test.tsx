import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@/types/auth';

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  pathname: vi.fn(),
  user: null as Partial<User> | null,
}));

vi.mock('next/navigation', () => ({
  usePathname: mocks.pathname,
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ logout: mocks.logout, user: mocks.user }),
}));

import { SiteHeader } from './SiteHeader';

const max: Partial<User> = {
  id: 'cm-max',
  username: 'max',
  displayName: 'Max',
  role: 'USER',
  avatarUrl: null,
};

afterEach(cleanup);

beforeEach(() => {
  mocks.pathname.mockReturnValue('/');
  mocks.user = null;
});

describe('SiteHeader', () => {
  it('shows the logo, the three existing destinations in order and the persistent actions', () => {
    render(<SiteHeader />);

    expect(screen.getByRole('link', { name: 'DevsProject, inicio' })).toHaveAttribute('href', '/');

    const menu = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(
      within(menu)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Inicio', 'Materias', 'Experiencias']);
    expect(within(menu).getByRole('link', { name: 'Experiencias' })).toHaveAttribute(
      'href',
      '/resenas',
    );

    expect(screen.getByRole('link', { name: 'Subir material' })).toHaveAttribute(
      'href',
      '/materiales/nuevo',
    );
    expect(screen.queryByRole('link', { name: /Eventos|Clasificados/ })).not.toBeInTheDocument();
  });

  it('sends the search control to /buscar', () => {
    render(<SiteHeader />);

    expect(screen.getByRole('link', { name: 'Buscar' })).toHaveAttribute('href', '/buscar');
  });

  it('marks only the most specific destination as current', () => {
    mocks.pathname.mockReturnValue('/materias/IP-101/resenar');
    render(<SiteHeader />);

    const menu = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(within(menu).getByRole('link', { name: 'Experiencias' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(menu).getByRole('link', { name: 'Materias' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('offers sign-in to visitors on both header sizes and no hamburger menu', () => {
    render(<SiteHeader />);

    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      '/auth/login',
    );
    expect(screen.getByRole('link', { name: 'Ingresar' })).toHaveAttribute('href', '/auth/login');
    expect(screen.queryByRole('button', { name: /menú de cuenta/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /navegación/i })).not.toBeInTheDocument();
  });

  it.each(['USER', 'MODERATOR'] as const)(
    'shows the avatar pill with the display name for a signed-in %s',
    (role) => {
      mocks.user = { ...max, role };
      render(<SiteHeader />);

      const pills = screen.getAllByRole('button', { name: 'Max, abrir menú de cuenta' });
      expect(pills.length).toBeGreaterThan(0);
      expect(screen.queryByRole('link', { name: 'Iniciar sesión' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Ingresar' })).not.toBeInTheDocument();
    },
  );

  it('falls back to the username when there is no display name', () => {
    mocks.user = { ...max, displayName: null };
    render(<SiteHeader />);

    expect(
      screen.getAllByRole('button', { name: 'max, abrir menú de cuenta' }).length,
    ).toBeGreaterThan(0);
  });
});
