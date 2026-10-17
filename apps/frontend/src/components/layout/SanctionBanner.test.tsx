import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OwnSanction } from '@/lib/account-restriction';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/auth';

const mocks = vi.hoisted(() => ({ seen: vi.fn() }));

vi.mock('@/lib/account-restriction', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/account-restriction')>()),
  markWarningSeen: mocks.seen,
}));

import { SanctionBanner } from './SanctionBanner';

const inDays = (days: number) => new Date(Date.now() + days * 24 * 3_600_000).toISOString();

const baseUser: User = {
  id: 'user-1',
  username: 'lu.rojas',
  email: 'lu@devsproject.local',
  role: 'USER',
  displayName: null,
  bio: null,
  avatarUrl: null,
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mute: OwnSanction = {
  id: 'sanction-1',
  type: 'MUTE',
  reason: 'Segundo retiro por copiar material.',
  since: inDays(-5),
  until: inDays(2),
  appealable: true,
  appealDeadline: inDays(9),
  appealStatus: null,
};

afterEach(() => {
  cleanup();
  useAuthStore.setState({ user: null });
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.seen.mockResolvedValue(undefined);
});

describe('SanctionBanner', () => {
  it('shows nothing to an account in good standing or signed out', () => {
    useAuthStore.setState({ user: { ...baseUser, restriction: null, unseenWarning: null } });
    const { container } = render(<SanctionBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it('explains an active silenciamiento: why, until when, and how to appeal', () => {
    useAuthStore.setState({ user: { ...baseUser, restriction: mute, unseenWarning: null } });
    render(<SanctionBanner />);

    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent(/Estás silenciado hasta el/);
    expect(banner).toHaveTextContent('Segundo retiro por copiar material.');
    expect(screen.getByRole('link', { name: 'Apelar' })).toHaveAttribute(
      'href',
      '/profile/me#sanciones',
    );
  });

  it('shows the appeal under review instead of «Apelar»', () => {
    useAuthStore.setState({
      user: {
        ...baseUser,
        restriction: { ...mute, appealable: false, appealStatus: 'PENDING' },
        unseenWarning: null,
      },
    });
    render(<SanctionBanner />);

    expect(screen.getByRole('status')).toHaveTextContent('Tu apelación está en revisión');
    expect(screen.queryByRole('link', { name: 'Apelar' })).not.toBeInTheDocument();
  });

  it('shows an advertencia once and marks it seen', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({
      user: {
        ...baseUser,
        restriction: null,
        unseenWarning: { ...mute, id: 'warning-1', type: 'WARNING', until: null },
      },
    });
    render(<SanctionBanner />);

    expect(screen.getByRole('status')).toHaveTextContent('Recibiste una advertencia');
    await user.click(screen.getByRole('button', { name: 'Entendido' }));

    expect(mocks.seen).toHaveBeenCalledWith('warning-1');
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
    expect(useAuthStore.getState().user?.unseenWarning).toBeNull();
  });
});
