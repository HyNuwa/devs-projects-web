import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppealDetail, AppealSummary } from '@/lib/appeals-client';

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  detail: vi.fn(),
  answer: vi.fn(),
  user: { id: 'mod-2', role: 'MODERATOR' } as { id: string; role: string } | null,
}));

vi.mock('@/lib/appeals-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/appeals-client')>()),
  getAppeals: mocks.list,
  getAppeal: mocks.detail,
  answerAppeal: mocks.answer,
}));
vi.mock('@/lib/moderation-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/moderation-client')>()),
  getModerationSummary: () =>
    Promise.resolve({ overdueCases: 0, openCases: 0, pendingAppeals: 1, pendingProposals: null }),
}));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: mocks.user, isLoading: false }),
}));

import { AppealsPanel } from './AppealsPanel';

const summary: AppealSummary = {
  id: 'appeal-1',
  kind: 'RETIRO',
  createdAt: '2026-09-29T12:00:00.000Z',
  appellant: { hidden: true, username: null },
  decidedBy: { username: 'caro.m' },
  canAnswer: true,
  decision: {
    kind: 'RETIRO',
    label: 'Reseña de cursada',
    reason: 'Insultos a una docente',
    decidedAt: '2026-09-22T12:00:00.000Z',
  },
};

const detail: AppealDetail = {
  ...summary,
  status: 'PENDING',
  explanation: 'Criticaba cómo se dictaba la materia, no a la docente.',
  answer: null,
  answeredAt: null,
  content: {
    caseId: 'case-1',
    type: 'COURSE_REVIEW',
    label: 'Reseña de cursada',
    comment: 'La cursada fue muy desordenada.',
    anonymous: true,
  },
};

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: 'mod-2', role: 'MODERATOR' };
  mocks.list.mockResolvedValue([summary]);
  mocks.detail.mockResolvedValue(detail);
  mocks.answer.mockResolvedValue(undefined);
});

describe('AppealsPanel', () => {
  it('turns away accounts that are not moderators', () => {
    mocks.user = { id: 'user-1', role: 'USER' };
    render(<AppealsPanel />);

    expect(screen.getByText('Esta sección es solo para moderación.')).toBeInTheDocument();
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it('opens the first appeal: decision, what the appellant says, and «Autor oculto»', async () => {
    render(<AppealsPanel />);

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Apelación · «Reseña de cursada»' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Autor oculto')).toBeInTheDocument();
    expect(screen.getByText(/Insultos a una docente/)).toBeInTheDocument();
    expect(screen.getByText(/decidió @caro\.m/)).toBeInTheDocument();
    expect(
      screen.getByText(/Criticaba cómo se dictaba la materia, no a la docente\./),
    ).toBeInTheDocument();
    expect(screen.getByText('La cursada fue muy desordenada.')).toBeInTheDocument();
    expect(screen.getByText(/No ves apelaciones de decisiones tuyas/)).toBeInTheDocument();
  });

  it('keeps the appeal open when the moderator clicks it again', async () => {
    const user = userEvent.setup();
    render(<AppealsPanel />);
    await screen.findByRole('heading', { level: 2, name: /Apelación ·/ });

    await user.click(screen.getByRole('button', { name: /Reseña de cursada/ }));

    expect(screen.getByRole('heading', { level: 2, name: /Apelación ·/ })).toBeInTheDocument();
    expect(screen.queryByText('Cargando la apelación')).not.toBeInTheDocument();
  });

  it('requires a reason and accepts with it', async () => {
    const user = userEvent.setup();
    render(<AppealsPanel />);
    await screen.findByRole('heading', { level: 2, name: /Apelación ·/ });

    await user.click(screen.getByRole('button', { name: 'Aceptar y restaurar' }));
    expect(mocks.answer).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Escribí la respuesta');

    await user.type(
      screen.getByLabelText('Tu respuesta'),
      'Tenés razón: es una crítica a la cursada.',
    );
    await user.click(screen.getByRole('button', { name: 'Aceptar y restaurar' }));

    await waitFor(() =>
      expect(mocks.answer).toHaveBeenCalledWith('appeal-1', {
        accept: true,
        answer: 'Tenés razón: es una crítica a la cursada.',
      }),
    );
    expect(mocks.list).toHaveBeenCalledTimes(2);
  });

  it('keeps the decision when rejecting', async () => {
    const user = userEvent.setup();
    render(<AppealsPanel />);
    await screen.findByRole('heading', { level: 2, name: /Apelación ·/ });

    await user.type(screen.getByLabelText('Tu respuesta'), 'Hay insultos explícitos.');
    await user.click(screen.getByRole('button', { name: 'Mantener la decisión' }));

    await waitFor(() =>
      expect(mocks.answer).toHaveBeenCalledWith('appeal-1', {
        accept: false,
        answer: 'Hay insultos explícitos.',
      }),
    );
  });

  it('shows an appeal only an admin can answer, read-only', async () => {
    mocks.list.mockResolvedValue([{ ...summary, canAnswer: false }]);
    mocks.detail.mockResolvedValue({
      ...summary,
      canAnswer: false,
      status: 'PENDING',
    } satisfies AppealDetail);
    render(<AppealsPanel />);

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Apelación · «Reseña de cursada»' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('La resuelve un admin')).toHaveLength(2);
    expect(screen.getByText('Autor oculto')).toBeInTheDocument();
    expect(screen.queryByText('Lo que dice quien apela')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Tu respuesta')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aceptar y restaurar' })).not.toBeInTheDocument();
  });

  it('says when there is nothing to resolve', async () => {
    mocks.list.mockResolvedValue([]);
    render(<AppealsPanel />);

    expect(await screen.findByText('No hay apelaciones para resolver.')).toBeInTheDocument();
    expect(mocks.detail).not.toHaveBeenCalled();
  });
});
