import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { MaterialPreviewDialog } from './MaterialPreviewDialog';

const file = {
  id: 'material-2',
  title: 'Parcial 1',
  fileType: 'application/pdf',
  academicYear: 2026,
  createdAt: '2026-08-30T12:00:00.000Z',
};

function DialogFixture({ onRequestClose = vi.fn() }: { onRequestClose?: () => void }) {
  const [open, setOpen] = useState(true);
  const close = () => {
    onRequestClose();
    setOpen(false);
  };

  return (
    <div>
      <button id="material-file-material-2" type="button">
        Abrir Parcial 1
      </button>
      <MaterialPreviewDialog
        file={file}
        focusTargetId="material-file-material-2"
        onRequestClose={close}
        open={open}
        subjectName="Estructuras de Datos"
      />
    </div>
  );
}

describe('MaterialPreviewDialog', () => {
  it('keeps the list inert, moves focus into the dialog, and restores it after Escape', async () => {
    const user = userEvent.setup();
    const onRequestClose = vi.fn();
    render(<DialogFixture onRequestClose={onRequestClose} />);

    const dialog = await screen.findByRole('dialog', { name: 'Vista previa: Parcial 1' });
    expect(screen.queryByRole('button', { name: 'Abrir Parcial 1' })).not.toBeInTheDocument();
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    await user.keyboard('{Escape}');

    expect(onRequestClose).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(document.getElementById('material-file-material-2')).toHaveFocus());
  });

  it('supports an explicit outside close and exposes download and community regions', async () => {
    const user = userEvent.setup();
    const onRequestClose = vi.fn();
    render(<DialogFixture onRequestClose={onRequestClose} />);

    await screen.findByRole('dialog', { name: 'Vista previa: Parcial 1' });
    expect(screen.getAllByRole('link', { name: 'Descargar' })[0]).toHaveAttribute(
      'href',
      'http://localhost:3001/api/v1/materials/material-2/download',
    );
    expect(screen.getByRole('heading', { name: 'Comunidad' })).toBeInTheDocument();

    await user.click(screen.getByTestId('material-preview-overlay'));

    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it('provides a labelled close action', async () => {
    const user = userEvent.setup();
    const onRequestClose = vi.fn();
    render(<DialogFixture onRequestClose={onRequestClose} />);

    await screen.findByRole('dialog', { name: 'Vista previa: Parcial 1' });
    await user.click(screen.getByRole('button', { name: 'Cerrar vista previa' }));

    expect(onRequestClose).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
