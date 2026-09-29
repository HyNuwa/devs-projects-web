import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('@/lib/api', () => ({ api: { get: mocks.get, post: mocks.post } }));

import { MySubmissions } from './MySubmissions';

const inDays = (days: number) => new Date(Date.now() + days * 24 * 3_600_000).toISOString();
const subject = { id: 'sub-1', code: 'MD-01', name: 'Matemática Discreta' };

const retired = (retiro: Record<string, unknown>) => ({
  type: 'MATERIAL',
  id: 'mat-1',
  title: 'Resumen de lógica',
  subject,
  isAnonymous: false,
  status: 'REMOVED',
  reason: 'Está duplicado con otro resumen.',
  statusChangedAt: inDays(-3),
  createdAt: inDays(-10),
  canResubmit: false,
  retiro: {
    caseId: 'case-1',
    decidedAt: inDays(-3),
    appealable: true,
    appealDeadline: inDays(11),
    appeal: null,
    ...retiro,
  },
});

function serve({
  submissions = [] as unknown[],
  sanctions = [] as unknown[],
}: {
  submissions?: unknown[];
  sanctions?: unknown[];
}) {
  mocks.get.mockImplementation(async (url: string) =>
    url === '/me/sanctions' ? { data: sanctions } : { data: submissions },
  );
}

afterEach(cleanup);

beforeEach(() => {
  mocks.get.mockReset();
  mocks.post.mockReset();
  mocks.post.mockResolvedValue({ data: { id: 'appeal-1' } });
});

describe('appeals in Mis envíos', () => {
  it('lets the author appeal a retiro within 14 days, with a required explanation', async () => {
    const user = userEvent.setup();
    serve({ submissions: [retired({})] });
    render(<MySubmissions />);

    const item = (await screen.findByRole('heading', { name: 'Resumen de lógica' })).closest('li')!;
    await user.click(within(item).getByRole('button', { name: 'Apelar' }));
    await user.click(within(item).getByRole('button', { name: 'Enviar apelación' }));
    expect(within(item).getByRole('alert')).toHaveTextContent('Contá por qué apelás');
    expect(mocks.post).not.toHaveBeenCalled();

    await user.type(within(item).getByLabelText('Por qué apelás'), 'Resume la unidad 2, no la 1.');
    await user.click(within(item).getByRole('button', { name: 'Enviar apelación' }));

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith('/me/appeals', {
        kind: 'RETIRO',
        caseId: 'case-1',
        explanation: 'Resume la unidad 2, no la 1.',
      }),
    );
  });

  it('shows an appeal under review and then its answer, never who answered', async () => {
    serve({
      submissions: [
        retired({
          appealable: false,
          appeal: { status: 'REJECTED', answer: 'Es el mismo contenido.', answeredAt: inDays(-1) },
        }),
      ],
    });
    render(<MySubmissions />);

    const item = (await screen.findByRole('heading', { name: 'Resumen de lógica' })).closest('li')!;
    expect(item).toHaveTextContent('Apelación rechazada');
    expect(item).toHaveTextContent('Es el mismo contenido.');
    expect(within(item).queryByRole('button', { name: 'Apelar' })).not.toBeInTheDocument();
  });

  it('no longer offers «Apelar» after 14 days', async () => {
    serve({ submissions: [retired({ appealable: false, appealDeadline: null })] });
    render(<MySubmissions />);

    const item = (await screen.findByRole('heading', { name: 'Resumen de lógica' })).closest('li')!;
    expect(within(item).queryByRole('button', { name: 'Apelar' })).not.toBeInTheDocument();
  });
});

describe('Sanciones in Mis envíos', () => {
  it('lists the account’s sanciones with their reason, dates and appeal', async () => {
    const user = userEvent.setup();
    serve({
      sanctions: [
        {
          id: 'sanction-1',
          type: 'MUTE',
          reason: 'Segundo retiro por copiar material.',
          since: inDays(-5),
          until: inDays(2),
          appealable: true,
          appealDeadline: inDays(9),
          appealStatus: null,
          appealAnswer: null,
          lifted: false,
          voided: false,
        },
        {
          id: 'sanction-0',
          type: 'WARNING',
          reason: 'Primer retiro.',
          since: inDays(-40),
          until: null,
          appealable: false,
          appealDeadline: null,
          appealStatus: 'ACCEPTED',
          appealAnswer: 'Era un malentendido.',
          lifted: false,
          voided: true,
        },
      ],
    });
    render(<MySubmissions />);

    const section = await screen.findByRole('region', { name: 'Sanciones' });
    expect(section).toHaveAttribute('id', 'sanciones');
    const items = await within(section).findAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Silenciamiento');
    expect(items[0]).toHaveTextContent('Segundo retiro por copiar material.');
    expect(items[1]).toHaveTextContent('Advertencia');
    expect(items[1]).toHaveTextContent('Anulada por apelación');
    expect(items[1]).toHaveTextContent('Era un malentendido.');

    await user.click(within(items[0]).getByRole('button', { name: 'Apelar' }));
    await user.type(within(items[0]).getByLabelText('Por qué apelás'), 'La guía era mía.');
    await user.click(within(items[0]).getByRole('button', { name: 'Enviar apelación' }));

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith('/me/appeals', {
        kind: 'SANCTION',
        sanctionId: 'sanction-1',
        explanation: 'La guía era mía.',
      }),
    );
  });

  it('says when the account has no sanciones', async () => {
    serve({});
    render(<MySubmissions />);

    const section = await screen.findByRole('region', { name: 'Sanciones' });
    expect(await within(section).findByText('No tenés sanciones.')).toBeInTheDocument();
  });
});
