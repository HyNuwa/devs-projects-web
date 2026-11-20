import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  decideMyCorrection,
  getMyCorrectionSuggestions,
  type CorrectionSuggestion,
} from '@/lib/trust-client';

import { MyCorrectionSuggestions } from './MyCorrectionSuggestions';

vi.mock('@/lib/trust-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/trust-client')>()),
  getMyCorrectionSuggestions: vi.fn(),
  decideMyCorrection: vi.fn(),
}));

const suggestion = (id: string, overrides: Partial<CorrectionSuggestion> = {}) =>
  ({
    id,
    field: 'RESOURCE_TYPE',
    material: { id: `m-${id}`, title: 'Final de julio', subject: { code: 'ALG', name: 'Álgebra' } },
    current: 'Final',
    proposed: 'Parcial',
    comment: 'Es el primer parcial.',
    createdAt: '2026-10-08T12:00:00.000Z',
    ...overrides,
  }) satisfies CorrectionSuggestion;

afterEach(cleanup);

describe('MyCorrectionSuggestions («Mis envíos»)', () => {
  beforeEach(() => {
    vi.mocked(getMyCorrectionSuggestions)
      .mockReset()
      .mockResolvedValue([
        suggestion('c-1'),
        suggestion('c-2', {
          field: 'ACADEMIC_YEAR',
          current: '2024',
          proposed: '2023',
          comment: null,
        }),
      ]);
    vi.mocked(decideMyCorrection).mockReset().mockResolvedValue(undefined);
  });

  it('lists the current and proposed values without who suggested them', async () => {
    render(<MyCorrectionSuggestions />);

    const section = await screen.findByRole('region', { name: 'Sugerencias para tus materiales' });
    const items = await within(section).findAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Final de julio');
    expect(items[0]).toHaveTextContent('Tipo de recurso: Final → Parcial');
    expect(items[0]).toHaveTextContent('Es el primer parcial.');
    expect(items[1]).toHaveTextContent('Ciclo lectivo: 2024 → 2023');
    expect(section).not.toHaveTextContent(/sugirió|usuario|@/i);
  });

  it('accepts and rejects, removing the row', async () => {
    const user = userEvent.setup();
    render(<MyCorrectionSuggestions />);

    const items = await screen.findAllByRole('listitem');
    await user.click(within(items[0]).getByRole('button', { name: 'Aceptar' }));
    expect(decideMyCorrection).toHaveBeenCalledWith('c-1', true);
    await user.click(
      within(screen.getAllByRole('listitem')[0]).getByRole('button', { name: 'Rechazar' }),
    );
    expect(decideMyCorrection).toHaveBeenLastCalledWith('c-2', false);
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('says when a suggestion no longer applies', async () => {
    const user = userEvent.setup();
    vi.mocked(decideMyCorrection).mockRejectedValue({
      response: {
        status: 409,
        data: { message: 'La sugerencia ya no aplica.', code: 'NO_LONGER_APPLIES' },
      },
    });
    render(<MyCorrectionSuggestions />);

    const items = await screen.findAllByRole('listitem');
    await user.click(within(items[0]).getByRole('button', { name: 'Aceptar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La sugerencia ya no aplica.');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('keeps a suggestion whose material is under review, and the alert after the last row goes', async () => {
    const user = userEvent.setup();
    vi.mocked(getMyCorrectionSuggestions).mockResolvedValue([suggestion('c-1')]);
    vi.mocked(decideMyCorrection)
      .mockRejectedValueOnce({
        response: {
          status: 409,
          data: { message: 'El material está en revisión.', code: 'MATERIAL_UNDER_REVIEW' },
        },
      })
      .mockRejectedValueOnce({
        response: {
          status: 409,
          data: { message: 'La sugerencia ya no aplica.', code: 'NO_LONGER_APPLIES' },
        },
      });
    render(<MyCorrectionSuggestions />);

    await user.click(await screen.findByRole('button', { name: 'Aceptar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El material está en revisión.');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Aceptar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('La sugerencia ya no aplica.');
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('renders nothing without suggestions', async () => {
    vi.mocked(getMyCorrectionSuggestions).mockResolvedValue([]);
    const { container } = render(<MyCorrectionSuggestions />);

    await vi.waitFor(() => expect(getMyCorrectionSuggestions).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
