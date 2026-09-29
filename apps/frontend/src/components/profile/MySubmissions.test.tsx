import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('@/lib/api', () => ({ api: { get: mocks.get, post: mocks.post } }));

import { MySubmissions } from './MySubmissions';

const subject = { id: 'sub-1', code: 'ED-01', name: 'Estructura de Datos' };
const submissions = [
  {
    type: 'MATERIAL',
    id: 'mat-1',
    title: 'Final sin tachar',
    subject,
    isAnonymous: false,
    status: 'REJECTED',
    reason: 'Tapá los DNI y volvé a enviarlo.',
    statusChangedAt: '2026-09-20T10:00:00.000Z',
    createdAt: '2026-09-18T10:00:00.000Z',
    canResubmit: true,
  },
  {
    type: 'COURSE_REVIEW',
    id: 'rev-1',
    title: 'Reseña de cursada',
    subject,
    isAnonymous: true,
    status: 'REMOVED',
    reason: 'Ataca a una persona.',
    statusChangedAt: '2026-09-25T10:00:00.000Z',
    createdAt: '2026-09-24T10:00:00.000Z',
    canResubmit: false,
  },
  {
    type: 'EXAM_EXPERIENCE',
    id: 'exam-1',
    title: 'Experiencia de final',
    subject,
    isAnonymous: false,
    status: 'HIDDEN',
    reason: null,
    statusChangedAt: '2026-09-27T10:00:00.000Z',
    createdAt: '2026-09-26T10:00:00.000Z',
    canResubmit: false,
  },
  {
    type: 'COURSE_REVIEW',
    id: 'rev-2',
    title: 'Reseña de cursada',
    subject,
    isAnonymous: false,
    status: 'REJECTED',
    reason: 'Contá la cursada sin nombres de compañeros.',
    statusChangedAt: '2026-09-21T10:00:00.000Z',
    createdAt: '2026-09-21T09:00:00.000Z',
    canResubmit: true,
  },
];

afterEach(cleanup);

beforeEach(() => {
  mocks.get.mockReset();
  mocks.post.mockReset();
  mocks.get.mockResolvedValue({ data: submissions });
  mocks.post.mockResolvedValue({ data: {} });
});

const item = async (name: RegExp) => {
  const heading = await screen.findByRole('heading', { name });
  return heading.closest('li') as HTMLElement;
};

describe('MySubmissions', () => {
  it('is the «Mis envíos» section the account menu links to', async () => {
    render(<MySubmissions />);

    const heading = screen.getByRole('heading', { level: 2, name: 'Mis envíos' });
    expect(heading.closest('section')).toHaveAttribute('id', 'mis-envios');
    await waitFor(() => expect(mocks.get).toHaveBeenCalledWith('/me/submissions'));
  });

  it('shows each contribution with its status, the moderation reason and the date', async () => {
    render(<MySubmissions />);

    const removed = await item(/Reseña de cursada · anónima/);
    expect(within(removed).getByText('Retirado')).toBeInTheDocument();
    expect(removed).toHaveTextContent('Ataca a una persona.');
    expect(removed).toHaveTextContent(/25 de sept\.? de 2026/);
  });

  it('explains that hidden content is temporary', async () => {
    render(<MySubmissions />);

    const hidden = await item(/Experiencia de final/);
    expect(within(hidden).getByText('Oculto mientras se revisa')).toBeInTheDocument();
    expect(hidden).toHaveTextContent('Es temporal');
  });

  it('resubmits a rejected material with a corrected file', async () => {
    const user = userEvent.setup();
    render(<MySubmissions />);

    const rejected = await item(/Final sin tachar/);
    const file = new File(['%PDF'], 'final.pdf', { type: 'application/pdf' });
    await user.upload(within(rejected).getByLabelText('Archivo corregido (opcional)'), file);
    await user.click(within(rejected).getByRole('button', { name: 'Reenviar a revisión' }));

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith(
        '/me/submissions/MATERIAL/mat-1/resubmit',
        expect.any(FormData),
      ),
    );
    const body = mocks.post.mock.calls[0][1] as FormData;
    expect(body.get('file')).toBe(file);
    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(2));
  });

  it('sends a rejected reseña to its edit form to correct and resubmit it', async () => {
    render(<MySubmissions />);

    const rejected = (await screen.findAllByRole('heading', { name: 'Reseña de cursada' }))
      .map((heading) => heading.closest('li') as HTMLElement)
      .find((entry) => entry.textContent?.includes('Rechazado'))!;

    expect(within(rejected).getByRole('link', { name: 'Editar y reenviar' })).toHaveAttribute(
      'href',
      '/materias/ED-01/resenar?editar=rev-2',
    );
  });

  it('shows an empty state with a way to contribute', async () => {
    mocks.get.mockResolvedValue({ data: [] });
    render(<MySubmissions />);

    expect(await screen.findByText('Todavía no compartiste nada.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Subir material' })).toHaveAttribute(
      'href',
      '/materiales/nuevo',
    );
  });
});
