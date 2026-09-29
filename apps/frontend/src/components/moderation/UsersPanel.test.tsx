import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserFile, UsersList } from '@/lib/moderation-users-client';

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  file: vi.fn(),
  warn: vi.fn(),
  mute: vi.fn(),
  unmute: vi.fn(),
  propose: vi.fn(),
  suspend: vi.fn(),
  lift: vi.fn(),
  confirm: vi.fn(),
  reject: vi.fn(),
  user: { id: 'mod-1', role: 'MODERATOR' } as { id: string; role: string } | null,
}));

vi.mock('@/lib/moderation-users-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/moderation-users-client')>()),
  getModerationUsers: mocks.list,
  getModerationUser: mocks.file,
  warnUser: mocks.warn,
  muteUser: mocks.mute,
  unmuteUser: mocks.unmute,
  proposeSuspension: mocks.propose,
  suspendUser: mocks.suspend,
  liftSuspension: mocks.lift,
  confirmProposal: mocks.confirm,
  rejectProposal: mocks.reject,
}));
vi.mock('@/lib/moderation-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/moderation-client')>()),
  getModerationSummary: () =>
    Promise.resolve({ overdueCases: 0, openCases: 0, pendingAppeals: 0, pendingProposals: null }),
}));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: mocks.user, isLoading: false }),
}));

import { UsersPanel } from './UsersPanel';

const listItem = {
  id: 'user-1',
  username: 'juan.p',
  career: 'Lic. en Sistemas',
  createdAt: '2026-02-01T00:00:00.000Z',
  accountAgeDays: 240,
  emailVerified: true,
  status: { kind: 'WARNED', until: '2026-12-13T00:00:00.000Z' },
  suggestedStep: 'MUTE',
} as const;

const list: UsersList = { users: [listItem], proposals: null };

const file = (overrides: Partial<UserFile> = {}): UserFile => ({
  ...listItem,
  role: 'USER',
  emailMasked: 'j••••@gmail.com',
  counts: { published: 9, retiros90d: 2 },
  resolvedReports: 3,
  reportPrecision: null,
  nextStepIfRetired: null,
  openCases: [],
  pendingProposal: null,
  timeline: [
    {
      type: 'SANCTION',
      kind: 'WARNING',
      reason: 'Insultos a una docente',
      date: '2026-09-14T00:00:00.000Z',
      until: null,
      lifted: false,
      voided: false,
      anonymousCase: true,
    },
    { type: 'ACCOUNT_CREATED', date: '2026-02-01T00:00:00.000Z', emailVerified: true },
  ],
  actions: ['WARN', 'MUTE', 'PROPOSE_SUSPENSION'],
  ...overrides,
});

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: 'mod-1', role: 'MODERATOR' };
  mocks.list.mockResolvedValue(list);
  mocks.file.mockResolvedValue(file());
});

async function openFile() {
  render(<UsersPanel />);
  return screen.findByRole('heading', { level: 2, name: '@juan.p' });
}

describe('UsersPanel', () => {
  it('turns away accounts that are not moderators', () => {
    mocks.user = { id: 'user-9', role: 'USER' };
    render(<UsersPanel />);

    expect(screen.getByText('Esta sección es solo para moderación.')).toBeInTheDocument();
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it('lists accounts with suggestions and filters or searches them', async () => {
    const user = userEvent.setup();
    render(<UsersPanel />);

    expect(await screen.findByRole('button', { name: /@juan\.p/ })).toHaveTextContent(
      'Sugerido: silenciar 7 días',
    );
    expect(mocks.list).toHaveBeenCalledWith({ filter: 'suggested' });

    await user.click(screen.getByRole('button', { name: 'Sancionados' }));
    await waitFor(() => expect(mocks.list).toHaveBeenLastCalledWith({ filter: 'sanctioned' }));

    await user.type(screen.getByRole('searchbox', { name: 'Buscar por usuario' }), 'lu');
    await waitFor(() => expect(mocks.list).toHaveBeenLastCalledWith({ q: 'lu' }));
  });

  it('shows the account file without its email or its anonymous entries', async () => {
    await openFile();

    expect(screen.getByText(/j••••@gmail\.com/)).toBeInTheDocument();
    expect(screen.getByText('aportes publicados').previousSibling).toHaveTextContent('9');
    expect(screen.getByText('retiros por normas en 90 días').previousSibling).toHaveTextContent(
      '2',
    );
    expect(screen.getByText(/pocos reportes para calcular/)).toBeInTheDocument();
    const timeline = screen.getByRole('list', { name: 'Línea de tiempo' });
    expect(timeline).toHaveTextContent('por un caso sobre una publicación anónima');
    expect(within(timeline).queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText(/Paso sugerido: silenciar 7 días/)).toBeInTheDocument();
  });

  it('offers only the actions the viewer may take, each with a required reason', async () => {
    const user = userEvent.setup();
    mocks.mute.mockResolvedValue(undefined);
    await openFile();

    expect(screen.getByRole('button', { name: 'Advertir' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Proponer suspensión' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Suspender' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Silenciar 7 días' }));
    expect(mocks.mute).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Escribí la razón');

    await user.type(
      screen.getByLabelText('Razón de la sanción'),
      'Segundo retiro por insultos en 90 días.',
    );
    await user.click(screen.getByRole('button', { name: 'Silenciar 7 días' }));

    await waitFor(() =>
      expect(mocks.mute).toHaveBeenCalledWith('user-1', 'Segundo retiro por insultos en 90 días.'),
    );
    expect(mocks.file).toHaveBeenCalledTimes(2);
  });

  it('proposes a suspensión with the chosen duration', async () => {
    const user = userEvent.setup();
    mocks.propose.mockResolvedValue(undefined);
    await openFile();

    await user.type(screen.getByLabelText('Razón de la sanción'), 'Tercer retiro.');
    await user.selectOptions(screen.getByLabelText('Duración'), '30_DAYS');
    await user.click(screen.getByRole('button', { name: 'Proponer suspensión' }));

    await waitFor(() =>
      expect(mocks.propose).toHaveBeenCalledWith('user-1', 'Tercer retiro.', '30_DAYS'),
    );
  });

  it('lets an admin confirm a pending proposal and retire the contributions', async () => {
    const user = userEvent.setup();
    mocks.user = { id: 'admin-1', role: 'ADMIN' };
    mocks.list.mockResolvedValue({
      users: [listItem],
      proposals: [
        {
          id: 'proposal-1',
          reason: 'Spam en varias materias',
          durationDays: null,
          createdAt: '2026-09-30T00:00:00.000Z',
          user: { id: 'user-1', username: 'juan.p' },
          proposedBy: { username: 'caro.m' },
        },
      ],
    });
    mocks.file.mockResolvedValue(
      file({
        pendingProposal: {
          id: 'proposal-1',
          reason: 'Spam en varias materias',
          durationDays: null,
          createdAt: '2026-09-30T00:00:00.000Z',
        },
        actions: ['WARN', 'MUTE', 'SUSPEND', 'DECIDE_PROPOSAL'],
      }),
    );
    mocks.confirm.mockResolvedValue(undefined);
    render(<UsersPanel />);

    expect(
      await screen.findByRole('region', { name: /Suspensiones propuestas/ }),
    ).toHaveTextContent('propuesta por @caro.m');
    await screen.findByRole('heading', { level: 2, name: '@juan.p' });
    const proposal = screen.getByRole('group', { name: 'Propuesta de suspensión' });
    await user.type(within(proposal).getByLabelText('Razón de la decisión'), 'Confirmado.');
    await user.click(within(proposal).getByLabelText('Retirar también sus aportes publicados'));
    await user.click(within(proposal).getByRole('button', { name: 'Confirmar suspensión' }));

    await waitFor(() =>
      expect(mocks.confirm).toHaveBeenCalledWith('proposal-1', {
        reason: 'Confirmado.',
        duration: 'PERMANENT',
        retireContributions: true,
      }),
    );
  });
});
