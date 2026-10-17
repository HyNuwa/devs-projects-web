import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  summary: vi.fn(),
  user: { id: 'mod-1', role: 'MODERATOR' } as { id: string; role: string } | null,
}));

vi.mock('@/lib/moderation-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/moderation-client')>()),
  getModerationSummary: mocks.summary,
}));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: mocks.user, isLoading: false }),
}));

import { ModerationHeader } from './ModerationHeader';

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: 'mod-1', role: 'MODERATOR' };
  mocks.summary.mockResolvedValue({
    overdueCases: 2,
    openCases: 10,
    pendingAppeals: 3,
    pendingProposals: null,
  });
});

describe('ModerationHeader', () => {
  it('offers the four tabs and marks the active one', async () => {
    render(<ModerationHeader active="usuarios" description="x" />);

    const nav = screen.getByRole('navigation', { name: 'Moderación' });
    const links = within(nav).getAllByRole('link');
    expect(
      links.map((link) => [link.textContent?.replace(/\d+/g, ''), link.getAttribute('href')]),
    ).toEqual([
      ['Casos', '/admin'],
      ['Usuarios', '/admin/usuarios'],
      ['Apelaciones', '/admin/apelaciones'],
      ['Historial', '/admin/historial'],
    ]);
    expect(within(nav).getByRole('link', { name: /Usuarios/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('shows how many casos and appeals are waiting', async () => {
    render(<ModerationHeader active="casos" description="x" />);

    expect(await screen.findByRole('link', { name: 'Casos 10' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Apelaciones 3' })).toBeInTheDocument();
  });

  it('lets the Casos panel update its own count', async () => {
    render(<ModerationHeader active="casos" caseCount={9} description="x" />);

    expect(await screen.findByRole('link', { name: 'Casos 9' })).toBeInTheDocument();
  });

  it('warns admins about overdue casos, with a link to them', async () => {
    mocks.user = { id: 'admin-1', role: 'ADMIN' };
    mocks.summary.mockResolvedValue({
      overdueCases: 2,
      openCases: 10,
      pendingAppeals: 0,
      pendingProposals: 1,
    });
    render(<ModerationHeader active="historial" description="x" />);

    const notice = await screen.findByRole('status');
    expect(notice).toHaveTextContent('2 casos vencidos');
    expect(within(notice).getByRole('link', { name: 'Ver vencidos' })).toHaveAttribute(
      'href',
      '/admin',
    );
    expect(screen.getByRole('link', { name: 'Usuarios 1' })).toBeInTheDocument();
  });

  it('does not show the overdue notice to moderators or when nothing is overdue', async () => {
    render(<ModerationHeader active="casos" description="x" />);
    await screen.findByRole('link', { name: 'Casos 10' });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    cleanup();
    mocks.user = { id: 'admin-1', role: 'ADMIN' };
    mocks.summary.mockResolvedValue({
      overdueCases: 0,
      openCases: 1,
      pendingAppeals: 0,
      pendingProposals: 0,
    });
    render(<ModerationHeader active="casos" description="x" />);
    await screen.findByRole('link', { name: 'Casos 1' });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
