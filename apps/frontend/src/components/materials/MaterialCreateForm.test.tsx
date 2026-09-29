import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('@/lib/api', () => ({ api: { get: mocks.get, post: mocks.post } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { ToastProvider } from '@/components/ui';

import { MaterialCreateForm } from './MaterialCreateForm';

afterEach(cleanup);

beforeEach(() => {
  mocks.get.mockReset();
  mocks.post.mockReset();
  mocks.get.mockResolvedValue({ data: [{ id: 'sub-1', name: 'Álgebra Lineal', code: 'AL-01' }] });
});

async function fillAndSubmit() {
  const user = userEvent.setup();
  render(
    <ToastProvider>
      <MaterialCreateForm />
    </ToastProvider>,
  );

  await user.upload(
    screen.getByLabelText(/Arrastrá tu archivo/),
    new File(['%PDF'], 'parcial.pdf', { type: 'application/pdf' }),
  );
  await user.type(screen.getByLabelText('Título *'), 'Parcial 1 resuelto');
  await screen.findByRole('option', { name: 'Álgebra Lineal' });
  await user.selectOptions(screen.getByLabelText('Materia *'), 'sub-1');
  await user.selectOptions(screen.getByLabelText('Tipo de recurso *'), 'PARCIAL');
  await user.click(screen.getByRole('button', { name: 'Publicar material' }));
}

describe('MaterialCreateForm', () => {
  it('says contributions are published immediately and links to the rules', () => {
    render(
      <ToastProvider>
        <MaterialCreateForm />
      </ToastProvider>,
    );

    expect(screen.getByText(/Se publica al instante/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Normas de la comunidad' })).toHaveAttribute(
      'href',
      '/normas',
    );
  });

  it('sends the resource type and confirms a published material with a link to it', async () => {
    mocks.post.mockResolvedValue({
      data: { material: { id: 'mat-9' }, outcome: 'PUBLISHED', reason: null },
    });

    await fillAndSubmit();

    await waitFor(() => expect(mocks.post).toHaveBeenCalledTimes(1));
    const body = mocks.post.mock.calls[0][1] as FormData;
    expect(body.get('resourceType')).toBe('PARCIAL');
    expect(await screen.findByRole('heading', { name: '¡Ya está publicado!' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver el material' })).toHaveAttribute(
      'href',
      '/materiales/mat-9',
    );
  });

  it('explains why a material waits for revisión previa', async () => {
    mocks.post.mockResolvedValue({
      data: { material: { id: 'mat-9' }, outcome: 'PENDING_REVIEW', reason: 'NEW_ACCOUNT' },
    });

    await fillAndSubmit();

    expect(await screen.findByRole('heading', { name: 'En revisión previa' })).toBeInTheDocument();
    expect(screen.getByText(/Tu cuenta es nueva/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver mis envíos' })).toHaveAttribute(
      'href',
      '/profile/me#mis-envios',
    );
  });

  it('points to the existing material when the file is a duplicate', async () => {
    mocks.post.mockRejectedValue({
      response: {
        status: 409,
        data: { code: 'DUPLICATE_MATERIAL', materialId: 'mat-3', message: 'Duplicado' },
      },
    });

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Este archivo ya está publicado');
    expect(screen.getByRole('link', { name: 'Ver el que ya está' })).toHaveAttribute(
      'href',
      '/materiales/mat-3',
    );
  });

  it('explains the daily upload limit', async () => {
    mocks.post.mockRejectedValue({
      response: {
        status: 429,
        data: { code: 'UPLOAD_LIMIT', retryAt: '2026-09-30T12:00:00.000Z' },
      },
    });

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('10 materiales por día');
  });
});
