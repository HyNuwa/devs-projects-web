import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HistoryItem } from '@/lib/moderation-client';

const mocks = vi.hoisted(() => ({
  history: vi.fn(),
  user: { id: 'mod-1', role: 'MODERATOR' } as { id: string; role: string } | null,
}));

vi.mock('@/lib/moderation-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/moderation-client')>()),
  getModerationHistory: mocks.history,
}));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: mocks.user, isLoading: false }),
}));

import { HistoryPanel } from './HistoryPanel';

const items: HistoryItem[] = [
  {
    id: 'ev-2',
    createdAt: '2026-09-28T17:32:00.000Z',
    action: 'REMOVED',
    actor: { system: false, username: 'max' },
    target: { type: 'MATERIAL', id: 'mat-1', label: 'Parcial 1 escaneado' },
    targetUser: { username: 'tomi.g' },
    caseId: 'case-1',
    reason: 'Datos personales visibles',
  },
  {
    id: 'ev-1',
    createdAt: '2026-09-27T22:40:00.000Z',
    action: 'AUTO_HIDDEN',
    actor: { system: true },
    target: { type: 'COURSE_REVIEW', id: 'rev-1', label: 'Reseña de cursada' },
    targetUser: null,
    caseId: 'case-2',
    reason: '3 reportes en 48 h',
  },
];

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: 'mod-1', role: 'MODERATOR' };
  mocks.history.mockResolvedValue({ items, nextCursor: null });
});

describe('HistoryPanel', () => {
  it('turns away accounts that are not moderators', () => {
    mocks.user = { id: 'user-1', role: 'USER' };
    render(<HistoryPanel />);

    expect(screen.getByText('Esta sección es solo para moderación.')).toBeInTheDocument();
    expect(mocks.history).not.toHaveBeenCalled();
  });

  it('lists who did what, on what, when and why, with automatic actions as «Sistema»', async () => {
    render(<HistoryPanel />);

    const table = await screen.findByRole('table', { name: 'Historial de moderación' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('@max');
    expect(rows[0]).toHaveTextContent('Retiro');
    expect(rows[0]).toHaveTextContent('Parcial 1 escaneado');
    expect(rows[0]).toHaveTextContent('Datos personales visibles');
    expect(rows[1]).toHaveTextContent('Sistema');
    expect(rows[1]).toHaveTextContent('Ocultamiento');
    expect(within(rows[0]).getByRole('link', { name: 'Parcial 1 escaneado' })).toHaveAttribute(
      'href',
      '/admin?caso=case-1',
    );
  });

  it('shows «Autor oculto» when the actor is the hidden author of an anonymous entry', async () => {
    mocks.history.mockResolvedValue({
      items: [
        {
          ...items[1],
          id: 'ev-3',
          action: 'RESUBMITTED',
          actor: { system: false, username: null, hidden: true },
          reason: null,
        },
      ],
      nextCursor: null,
    });
    render(<HistoryPanel />);

    const table = await screen.findByRole('table', { name: 'Historial de moderación' });
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Autor oculto');
    expect(table).not.toHaveTextContent('@desconocido');
  });

  it('is read-only: there are no edit or delete controls', async () => {
    render(<HistoryPanel />);
    await screen.findByRole('table', { name: 'Historial de moderación' });

    expect(
      screen.queryByRole('button', { name: /Editar|Borrar|Eliminar/ }),
    ).not.toBeInTheDocument();
  });

  it('filters by action', async () => {
    const user = userEvent.setup();
    render(<HistoryPanel />);
    await screen.findByRole('table', { name: 'Historial de moderación' });

    await user.selectOptions(screen.getByLabelText('Acción'), 'REMOVED');

    await waitFor(() => expect(mocks.history).toHaveBeenLastCalledWith({ action: 'REMOVED' }));
  });

  it('loads older records with the cursor', async () => {
    const user = userEvent.setup();
    mocks.history.mockResolvedValueOnce({ items, nextCursor: 'ev-1' });
    mocks.history.mockResolvedValueOnce({
      items: [{ ...items[1], id: 'ev-0', reason: 'Registro viejo' }],
      nextCursor: null,
    });
    render(<HistoryPanel />);

    await user.click(await screen.findByRole('button', { name: 'Cargar más' }));

    expect(await screen.findByText('Registro viejo')).toBeInTheDocument();
    expect(mocks.history).toHaveBeenLastCalledWith({ cursor: 'ev-1' });
    expect(screen.queryByRole('button', { name: 'Cargar más' })).not.toBeInTheDocument();
  });
});
