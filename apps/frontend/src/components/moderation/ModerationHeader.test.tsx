import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  summary: vi.fn(),
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
  institutions: vi.fn(),
  user: { id: 'mod-1', role: 'MODERATOR' } as { id: string; role: string } | null,
}));

vi.mock('@/lib/moderation-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/moderation-client')>()),
  getModerationSummary: mocks.summary,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => mocks.searchParams,
}));
vi.mock('@/lib/study-plans-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/study-plans-client')>()),
  getInstitutions: mocks.institutions,
}));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: mocks.user, isLoading: false }),
}));

import { ModerationHeader } from './ModerationHeader';

const fiScope = {
  id: 'f-fi',
  name: 'Facultad de Ingeniería',
  shortName: 'FI',
  university: { shortName: 'UNJU' },
};

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: 'mod-1', role: 'MODERATOR' };
  mocks.searchParams = new URLSearchParams();
  mocks.institutions.mockResolvedValue([
    {
      id: 'u-unju',
      name: 'Universidad Nacional de Jujuy',
      shortName: 'UNJU',
      faculties: [
        { id: 'f-fi', name: 'Facultad de Ingeniería', shortName: 'FI', careers: [] },
        { id: 'f-fce', name: 'Facultad de Ciencias Económicas', shortName: 'FCE', careers: [] },
      ],
    },
  ]);
  mocks.summary.mockResolvedValue({
    overdueCases: 2,
    openCases: 10,
    pendingAppeals: 3,
    pendingCorrections: 4,
    pendingProposals: null,
    scope: { all: false, faculties: [fiScope] },
  });
});

describe('ModerationHeader', () => {
  it('offers the five tabs and marks the active one', async () => {
    render(<ModerationHeader active="usuarios" description="x" />);

    const nav = screen.getByRole('navigation', { name: 'Moderación' });
    const links = within(nav).getAllByRole('link');
    expect(
      links.map((link) => [link.textContent?.replace(/\d+/g, ''), link.getAttribute('href')]),
    ).toEqual([
      ['Casos', '/admin'],
      ['Correcciones', '/admin/correcciones'],
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
    expect(screen.getByRole('link', { name: 'Correcciones 4' })).toBeInTheDocument();
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

  it('names the moderator’s facultades in «Tu rol»', async () => {
    render(<ModerationHeader active="casos" description="x" />);
    expect(await screen.findByText('Tu rol: moderación · FI UNJU')).toBeInTheDocument();
  });

  it('tells a moderator without facultades why the panel is empty', async () => {
    mocks.summary.mockResolvedValue({
      overdueCases: 0,
      openCases: 0,
      pendingAppeals: 0,
      pendingCorrections: 0,
      pendingProposals: null,
      scope: { all: false, faculties: [] },
    });
    render(<ModerationHeader active="casos" description="x" />);
    expect(await screen.findByText(/Todavía no tenés facultades asignadas/)).toBeInTheDocument();
  });

  it('gives admins a facultad filter kept in ?facultad=', async () => {
    mocks.user = { id: 'admin-1', role: 'ADMIN' };
    mocks.summary.mockResolvedValue({
      overdueCases: 0,
      openCases: 3,
      pendingAppeals: 0,
      pendingCorrections: 0,
      pendingProposals: 0,
      scope: { all: true, faculties: [] },
    });
    render(<ModerationHeader active="casos" description="x" />);
    const filter = await screen.findByRole('combobox', { name: 'Facultad' });
    expect(filter).toHaveValue('');
    expect(await screen.findByRole('option', { name: 'FI · UNJU' })).toBeInTheDocument();
    fireEvent.change(filter, { target: { value: 'f-fi' } });
    expect(mocks.replace).toHaveBeenCalledWith('/admin?facultad=f-fi', { scroll: false });
    expect(screen.getByText('Tu rol: admin')).toBeInTheDocument();
  });

  it('counts within the chosen facultad', async () => {
    mocks.user = { id: 'admin-1', role: 'ADMIN' };
    mocks.searchParams = new URLSearchParams('facultad=f-fce');
    render(<ModerationHeader active="casos" description="x" />);
    await screen.findByRole('combobox', { name: 'Facultad' });
    expect(mocks.summary).toHaveBeenCalledWith('f-fce');
  });

  it('shows no filter to a moderator', async () => {
    render(<ModerationHeader active="casos" description="x" />);
    await screen.findByText('Tu rol: moderación · FI UNJU');
    expect(screen.queryByRole('combobox', { name: 'Facultad' })).toBeNull();
  });
});
