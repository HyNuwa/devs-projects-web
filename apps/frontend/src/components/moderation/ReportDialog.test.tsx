import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  user: null as { id: string } | null,
  isLoading: false,
}));

vi.mock('@/lib/api', () => ({ api: { post: mocks.post } }));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: mocks.user, isLoading: mocks.isLoading }),
}));

import { ReportDialog } from './ReportDialog';

afterEach(cleanup);

beforeEach(() => {
  mocks.post.mockReset();
  mocks.post.mockResolvedValue({ data: { status: 'RECEIVED' } });
  mocks.user = { id: 'user-1' };
  mocks.isLoading = false;
});

const renderDialog = (onReported = vi.fn()) =>
  render(
    <ReportDialog
      onReported={onReported}
      returnPath="/materiales/mat-1"
      targetId="mat-1"
      targetType="MATERIAL"
    />,
  );

describe('ReportDialog', () => {
  it('asks visitors to sign in and come back to the same content', () => {
    mocks.user = null;
    renderDialog();

    expect(screen.getByRole('link', { name: 'Iniciá sesión para reportar' })).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent('/materiales/mat-1')),
    );
    expect(screen.queryByRole('button', { name: 'Reportar' })).not.toBeInTheDocument();
  });

  it('files a reporte with one of the fixed reasons', async () => {
    const user = userEvent.setup();
    const onReported = vi.fn();
    renderDialog(onReported);

    await user.click(screen.getByRole('button', { name: 'Reportar' }));
    const dialog = screen.getByRole('dialog', { name: 'Reportar publicación' });
    expect(dialog).toHaveTextContent('Moderación lo revisa');
    await user.selectOptions(screen.getByLabelText('Motivo'), 'DATOS_PERSONALES');
    await user.click(screen.getByRole('button', { name: 'Enviar reporte' }));

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith('/reports', {
        targetType: 'MATERIAL',
        targetId: 'mat-1',
        reason: 'DATOS_PERSONALES',
      }),
    );
    expect(onReported).toHaveBeenCalledWith('Gracias. Moderación va a revisarlo.');
  });

  it('requires an explanation for «Otro motivo»', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Reportar' }));
    await user.selectOptions(screen.getByLabelText('Motivo'), 'OTRO');
    await user.click(screen.getByRole('button', { name: 'Enviar reporte' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Explicá el motivo');
    expect(mocks.post).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Explicación'), 'Es publicidad de un curso pago');
    await user.click(screen.getByRole('button', { name: 'Enviar reporte' }));

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith('/reports', {
        targetType: 'MATERIAL',
        targetId: 'mat-1',
        reason: 'OTRO',
        explanation: 'Es publicidad de un curso pago',
      }),
    );
  });

  it('links to the community rules', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Reportar' }));

    expect(screen.getByRole('link', { name: 'Normas de la comunidad' })).toHaveAttribute(
      'href',
      '/normas',
    );
  });

  it('explains a repeated reporte instead of failing silently', async () => {
    const user = userEvent.setup();
    mocks.post.mockRejectedValue({
      response: { status: 409, data: { message: 'Ya reportaste esta publicación' } },
    });
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Reportar' }));
    await user.click(screen.getByRole('button', { name: 'Enviar reporte' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Ya reportaste esta publicación');
  });
});
