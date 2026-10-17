import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getCorrectionOptions,
  getMyPrivileges,
  suggestCorrection,
  type MyPrivileges,
} from '@/lib/trust-client';

import { SuggestCorrectionDialog } from './SuggestCorrectionDialog';

vi.mock('@/lib/trust-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/trust-client')>()),
  getMyPrivileges: vi.fn(),
  getCorrectionOptions: vi.fn(),
  suggestCorrection: vi.fn(),
}));

const mocks = vi.hoisted(() => ({ user: { id: 'u-1' } as { id: string } | null }));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector({ user: mocks.user }),
}));

const privileges = (active: boolean): MyPrivileges => ({
  suggestCorrections: { active, missing: [] },
  priorityReports: { active: false, missing: [] },
  standing: { good: true, until: null, permanent: false },
});

afterEach(cleanup);

describe('SuggestCorrectionDialog (academic-resources/corrections)', () => {
  beforeEach(() => {
    mocks.user = { id: 'u-1' };
    vi.mocked(getMyPrivileges).mockReset().mockResolvedValue(privileges(true));
    vi.mocked(getCorrectionOptions)
      .mockReset()
      .mockResolvedValue({
        subjects: [
          { id: 's-1', code: 'ALG', name: 'Álgebra' },
          { id: 's-2', code: 'AN2', name: 'Análisis II' },
        ],
        professors: [{ id: 'p-1', name: 'Ing. Quiroga' }],
        resourceTypes: [
          { value: 'FINAL', label: 'Final' },
          { value: 'PARCIAL', label: 'Parcial' },
        ],
        current: { SUBJECT: 's-1', RESOURCE_TYPE: 'FINAL', ACADEMIC_YEAR: '2024', PROFESSOR: null },
      });
    vi.mocked(suggestCorrection).mockReset().mockResolvedValue({ id: 'c-1' });
  });

  it('is hidden without the privilege', async () => {
    vi.mocked(getMyPrivileges).mockResolvedValue(privileges(false));
    render(<SuggestCorrectionDialog authorId="author" materialId="m-1" />);

    await vi.waitFor(() => expect(getMyPrivileges).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Sugerir corrección' })).not.toBeInTheDocument();
  });

  it('is hidden on the viewer’s own material and for visitors', async () => {
    const { unmount } = render(<SuggestCorrectionDialog authorId="u-1" materialId="m-1" />);
    expect(screen.queryByRole('button', { name: 'Sugerir corrección' })).not.toBeInTheDocument();
    unmount();

    mocks.user = null;
    render(<SuggestCorrectionDialog authorId="author" materialId="m-1" />);
    expect(screen.queryByRole('button', { name: 'Sugerir corrección' })).not.toBeInTheDocument();
    expect(getMyPrivileges).not.toHaveBeenCalled();
  });

  it('changes the value input with the field and sends the suggestion', async () => {
    const user = userEvent.setup();
    const onSuggested = vi.fn();
    render(
      <SuggestCorrectionDialog authorId="author" materialId="m-1" onSuggested={onSuggested} />,
    );

    await user.click(await screen.findByRole('button', { name: 'Sugerir corrección' }));
    const dialog = await screen.findByRole('dialog', { name: 'Sugerir una corrección' });
    const field = within(dialog).getByRole('combobox', { name: 'Qué dato corregís' });

    await user.selectOptions(field, 'ACADEMIC_YEAR');
    expect(
      within(dialog).getByRole('spinbutton', { name: 'Ciclo lectivo correcto' }),
    ).toBeInTheDocument();
    await user.selectOptions(field, 'SUBJECT');
    expect(within(dialog).getByRole('combobox', { name: 'Materia correcta' })).toHaveTextContent(
      'Análisis II',
    );
    await user.selectOptions(field, 'RESOURCE_TYPE');
    // Nothing to send until a tipo is chosen.
    expect(within(dialog).getByRole('button', { name: 'Enviar sugerencia' })).toBeDisabled();
    await user.selectOptions(
      within(dialog).getByRole('combobox', { name: 'Tipo de recurso correcto' }),
      'PARCIAL',
    );
    await user.type(
      within(dialog).getByRole('textbox', { name: /Comentario/ }),
      'Es el parcial 1.',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Enviar sugerencia' }));

    expect(suggestCorrection).toHaveBeenCalledWith('m-1', {
      field: 'RESOURCE_TYPE',
      proposedValue: 'PARCIAL',
      comment: 'Es el parcial 1.',
    });
    expect(onSuggested).toHaveBeenCalledWith(
      'Enviamos tu sugerencia. Primero la ve quien subió el material.',
    );
  });

  it('asks explicitly for «sin ciclo lectivo» instead of sending an empty year', async () => {
    const user = userEvent.setup();
    render(<SuggestCorrectionDialog authorId="author" materialId="m-1" />);

    await user.click(await screen.findByRole('button', { name: 'Sugerir corrección' }));
    const dialog = await screen.findByRole('dialog');
    await user.selectOptions(
      within(dialog).getByRole('combobox', { name: 'Qué dato corregís' }),
      'ACADEMIC_YEAR',
    );
    const send = within(dialog).getByRole('button', { name: 'Enviar sugerencia' });
    expect(send).toBeDisabled();
    await user.click(within(dialog).getByRole('checkbox', { name: 'Sin ciclo lectivo' }));
    expect(
      within(dialog).getByRole('spinbutton', { name: 'Ciclo lectivo correcto' }),
    ).toBeDisabled();
    await user.click(send);

    expect(suggestCorrection).toHaveBeenCalledWith('m-1', {
      field: 'ACADEMIC_YEAR',
      proposedValue: null,
    });
  });

  it('loads the options again each time it opens', async () => {
    const user = userEvent.setup();
    render(<SuggestCorrectionDialog authorId="author" materialId="m-1" />);

    await user.click(await screen.findByRole('button', { name: 'Sugerir corrección' }));
    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));
    await user.click(screen.getByRole('button', { name: 'Sugerir corrección' }));

    await vi.waitFor(() => expect(getCorrectionOptions).toHaveBeenCalledTimes(2));
  });

  it('shows the API error', async () => {
    const user = userEvent.setup();
    vi.mocked(suggestCorrection).mockRejectedValue({
      response: { data: { message: 'Ya hay una sugerencia abierta para ese dato.' } },
    });
    render(<SuggestCorrectionDialog authorId="author" materialId="m-1" />);

    await user.click(await screen.findByRole('button', { name: 'Sugerir corrección' }));
    const dialog = await screen.findByRole('dialog');
    await user.selectOptions(
      within(dialog).getByRole('combobox', { name: 'Tipo de recurso correcto' }),
      'PARCIAL',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Enviar sugerencia' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Ya hay una sugerencia abierta para ese dato.',
    );
  });
});
