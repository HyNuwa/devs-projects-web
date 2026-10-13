import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  decideModerationCorrection,
  getModerationCorrections,
  type CorrectionSuggestion,
} from '@/lib/trust-client';

import { CorrectionsPanel } from './CorrectionsPanel';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/lib/trust-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/trust-client')>()),
  getModerationCorrections: vi.fn(),
  decideModerationCorrection: vi.fn(),
}));
vi.mock('@/components/moderation/ModerationHeader', () => ({
  ModerationHeader: ({ active }: { active: string }) => <nav aria-label={`tabs-${active}`} />,
}));
const mocks = vi.hoisted(() => ({
  user: { id: 'mod-1', role: 'MODERATOR' } as { id: string; role: string } | null,
}));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: mocks.user, isLoading: false }),
}));

const suggestion = (id: string): CorrectionSuggestion => ({
  id,
  field: 'SUBJECT',
  material: { id: `m-${id}`, title: 'Resumen', subject: { code: 'AN1', name: 'Análisis I' } },
  current: 'Análisis I (AN1)',
  proposed: 'Análisis II (AN2)',
  comment: null,
  createdAt: '2026-09-28T12:00:00.000Z',
  suggester: 'vale',
});

afterEach(cleanup);

describe('CorrectionsPanel (/admin/correcciones)', () => {
  beforeEach(() => {
    mocks.user = { id: 'mod-1', role: 'MODERATOR' };
    vi.mocked(getModerationCorrections)
      .mockReset()
      .mockResolvedValue([suggestion('c-1'), suggestion('c-2')]);
    vi.mocked(decideModerationCorrection).mockReset().mockResolvedValue(undefined);
  });

  it('lists the suggestions with who made them, under the Correcciones tab', async () => {
    render(<CorrectionsPanel />);

    expect(screen.getByRole('navigation', { name: 'tabs-correcciones' })).toBeInTheDocument();
    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Materia: Análisis I (AN1) → Análisis II (AN2)');
    expect(items[0]).toHaveTextContent('Sugerida por @vale');
  });

  it('accepts and rejects', async () => {
    const user = userEvent.setup();
    render(<CorrectionsPanel />);

    const items = await screen.findAllByRole('listitem');
    await user.click(within(items[0]).getByRole('button', { name: 'Aceptar' }));
    await user.click(
      within(screen.getAllByRole('listitem')[0]).getByRole('button', { name: 'Rechazar' }),
    );

    expect(decideModerationCorrection).toHaveBeenNthCalledWith(1, 'c-1', true);
    expect(decideModerationCorrection).toHaveBeenNthCalledWith(2, 'c-2', false);
    expect(await screen.findByText('No hay correcciones para decidir.')).toBeInTheDocument();
  });

  it('drops a suggestion that no longer applies', async () => {
    const user = userEvent.setup();
    vi.mocked(decideModerationCorrection).mockRejectedValue({
      response: {
        status: 409,
        data: { message: 'La sugerencia ya no aplica.', code: 'NO_LONGER_APPLIES' },
      },
    });
    render(<CorrectionsPanel />);

    const items = await screen.findAllByRole('listitem');
    await user.click(within(items[0]).getByRole('button', { name: 'Aceptar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La sugerencia ya no aplica.');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('shows an empty state', async () => {
    vi.mocked(getModerationCorrections).mockResolvedValue([]);
    render(<CorrectionsPanel />);

    expect(await screen.findByText('No hay correcciones para decidir.')).toBeInTheDocument();
  });

  it('is only for moderation', () => {
    mocks.user = { id: 'u-1', role: 'USER' };
    render(<CorrectionsPanel />);

    expect(screen.getByText('Esta sección es solo para moderación.')).toBeInTheDocument();
    expect(getModerationCorrections).not.toHaveBeenCalled();
  });
});
