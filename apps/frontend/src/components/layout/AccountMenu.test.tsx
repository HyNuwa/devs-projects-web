import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Role, User } from '@/types/auth';

const mocks = vi.hoisted(() => ({ logout: vi.fn() }));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector({ logout: mocks.logout }),
}));

import { AccountMenu } from './AccountMenu';

function userWith(role: Role, avatarUrl: string | null = null): User {
  return {
    id: 'cm-max',
    username: 'max',
    email: 'max@example.com',
    role,
    displayName: 'Max',
    bio: null,
    avatarUrl,
    emailVerified: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

afterEach(cleanup);

beforeEach(() => {
  mocks.logout.mockReset();
  mocks.logout.mockResolvedValue(undefined);
});

const pill = () => screen.getByRole('button', { name: 'Max, abrir menú de cuenta' });

describe('AccountMenu on desktop', () => {
  it('opens from the keyboard with a student’s entries and returns focus on Escape', async () => {
    const user = userEvent.setup();
    render(<AccountMenu user={userWith('USER')} variant="desktop" />);

    await user.tab();
    expect(pill()).toHaveFocus();
    await user.keyboard('{Enter}');

    const items = await screen.findAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Mi perfil',
      'Mis envíos',
      'Cerrar sesión',
    ]);
    expect(items[0]).toHaveFocus();
    expect(items[0]).toHaveAttribute('href', '/profile/me');
    expect(items[1]).toHaveAttribute('href', '/profile/me#mis-envios');

    await user.keyboard('{ArrowDown}');
    expect(items[1]).toHaveFocus();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(pill()).toHaveFocus();
  });

  it('lists Moderación for moderators', async () => {
    const user = userEvent.setup();
    render(<AccountMenu user={userWith('MODERATOR')} variant="desktop" />);

    await user.click(pill());

    expect(await screen.findByRole('menuitem', { name: 'Moderación' })).toHaveAttribute(
      'href',
      '/admin',
    );
  });

  it('signs out and closes the menu', async () => {
    const user = userEvent.setup();
    render(<AccountMenu user={userWith('USER')} variant="desktop" />);

    await user.click(pill());
    await user.click(await screen.findByRole('menuitem', { name: 'Cerrar sesión' }));

    expect(mocks.logout).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('shows the user’s own avatar when there is one, otherwise a default cat', () => {
    const { unmount } = render(
      <AccountMenu user={userWith('USER', 'https://cdn.example.com/max.png')} variant="desktop" />,
    );
    expect(pill().querySelector('img')).toHaveAttribute('src', 'https://cdn.example.com/max.png');
    unmount();

    render(<AccountMenu user={userWith('USER')} variant="desktop" />);
    expect(pill().querySelector('img')?.getAttribute('src')).toMatch(/^\/avatars\/.+\.webp$/);
  });
});

describe('AccountMenu on mobile', () => {
  it('opens a labelled bottom sheet with the same entries and restores focus when closed', async () => {
    const user = userEvent.setup();
    render(<AccountMenu user={userWith('ADMIN')} variant="mobile" />);

    await user.click(pill());

    const sheet = await screen.findByRole('dialog', { name: 'Tu cuenta' });
    expect(
      within(sheet)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Mi perfil', 'Mis envíos', 'Moderación']);
    expect(within(sheet).getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();

    await user.click(within(sheet).getByRole('button', { name: 'Cerrar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(pill()).toHaveFocus();
  });

  it('signs out from the sheet', async () => {
    const user = userEvent.setup();
    render(<AccountMenu user={userWith('USER')} variant="mobile" />);

    await user.click(pill());
    await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(mocks.logout).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
