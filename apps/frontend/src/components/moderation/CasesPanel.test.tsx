import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CaseDetail, ModerationQueue, QueueItem } from '@/lib/moderation-client';

const mocks = vi.hoisted(() => ({
  queue: vi.fn(),
  detail: vi.fn(),
  decide: vi.fn(),
  reveal: vi.fn(),
  file: vi.fn(),
  user: { id: 'mod-1', role: 'MODERATOR' } as { id: string; role: string } | null,
  searchParams: new URLSearchParams(),
  replace: vi.fn(),
}));

vi.mock('@/lib/moderation-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/moderation-client')>()),
  getModerationQueue: mocks.queue,
  getModerationCase: mocks.detail,
  decideCase: mocks.decide,
  revealCaseAuthor: mocks.reveal,
  getCaseFile: mocks.file,
}));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: mocks.user, isLoading: false }),
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => mocks.searchParams,
  useRouter: () => ({ replace: mocks.replace }),
  usePathname: () => '/admin',
}));

import { CasesPanel } from './CasesPanel';

const subject = { id: 'sub-1', code: 'IP-01', name: 'Introducción a la Programación' };
const queueItem = (overrides: Partial<QueueItem>): QueueItem => ({
  caseId: 'case-x',
  kind: 'REPORTS',
  targetType: 'MATERIAL',
  targetId: 'mat-x',
  label: 'Material',
  subject,
  isAnonymous: false,
  targetStatus: 'PUBLISHED',
  reportCount: 1,
  topReason: 'NO_RELACIONADO',
  highPriority: false,
  openedAt: '2026-09-29T07:00:00.000Z',
  overdueHidden: false,
  ...overrides,
});

const queue: ModerationQueue = {
  hidden: [
    queueItem({
      caseId: 'case-hidden',
      label: 'Parcial 1 escaneado',
      targetStatus: 'HIDDEN',
      topReason: 'DATOS_PERSONALES',
    }),
    queueItem({
      caseId: 'case-review',
      targetType: 'COURSE_REVIEW',
      label: 'Reseña de cursada',
      isAnonymous: true,
      targetStatus: 'HIDDEN',
      reportCount: 3,
      topReason: 'INSULTOS_O_ACOSO',
    }),
  ],
  priorReview: [
    queueItem({
      caseId: 'case-prior',
      kind: 'PRIOR_REVIEW',
      label: 'Resumen unidad 1',
      targetStatus: 'PENDING_REVIEW',
      reportCount: 0,
      topReason: null,
    }),
  ],
  reported: [queueItem({ caseId: 'case-reported', label: 'Guía 2 de cinemática', reportCount: 2 })],
};

const detail = (overrides: Partial<CaseDetail> = {}): CaseDetail => ({
  caseId: 'case-hidden',
  kind: 'REPORTS',
  status: 'OPEN',
  highPriority: true,
  openedAt: '2026-09-29T07:00:00.000Z',
  overdueHidden: false,
  target: {
    type: 'MATERIAL',
    id: 'mat-1',
    status: 'HIDDEN',
    label: 'Parcial 1 escaneado',
    subject,
    isAnonymous: false,
    fileType: 'pdf',
  },
  reports: [
    {
      reason: 'DATOS_PERSONALES',
      explanation: 'Se ve el DNI de un compañero.',
      createdAt: '2026-09-29T07:00:00.000Z',
      qualifiedReporter: true,
    },
  ],
  author: {
    hidden: false,
    id: 'author-1',
    username: 'tomi.g',
    displayName: null,
    accountCreatedAt: '2025-09-29T07:00:00.000Z',
    publishedMaterials: 14,
    removalsLast90Days: 0,
  },
  history: [],
  viewer: { canDecide: true, conflict: null },
  ...overrides,
});

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: 'mod-1', role: 'MODERATOR' };
  mocks.searchParams = new URLSearchParams();
  mocks.queue.mockResolvedValue(queue);
  mocks.detail.mockImplementation(async (caseId: string) =>
    caseId === 'case-review'
      ? detail({
          caseId,
          target: {
            type: 'COURSE_REVIEW',
            id: 'rev-1',
            status: 'HIDDEN',
            label: 'Reseña de cursada',
            subject,
            isAnonymous: true,
            comment: 'No la cursen con Gómez',
          },
          author: { hidden: true },
        })
      : detail({ caseId }),
  );
  mocks.decide.mockResolvedValue(undefined);
  mocks.file.mockResolvedValue(new Blob(['%PDF-1.4 test'], { type: 'application/pdf' }));
  URL.createObjectURL = vi.fn(() => 'blob:case-file');
  URL.revokeObjectURL = vi.fn();
});

describe('CasesPanel', () => {
  it('turns away accounts that are not moderators', () => {
    mocks.user = { id: 'user-1', role: 'USER' };
    render(<CasesPanel />);

    expect(screen.getByText('Esta sección es solo para moderación.')).toBeInTheDocument();
    expect(mocks.queue).not.toHaveBeenCalled();
  });

  it('groups open casos and opens the most urgent one', async () => {
    render(<CasesPanel />);

    const hidden = await screen.findByRole('region', { name: /Ocultos preventivamente/ });
    expect(
      within(hidden)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual([
      expect.stringContaining('Parcial 1 escaneado'),
      expect.stringContaining('Reseña de cursada'),
    ]);
    expect(screen.getByRole('region', { name: /Revisión previa/ })).toHaveTextContent(
      'Resumen unidad 1',
    );
    expect(screen.getByRole('region', { name: /Reportados/ })).toHaveTextContent(
      'Guía 2 de cinemática',
    );
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Parcial 1 escaneado' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Se ve el DNI de un compañero.', { exact: false })).toBeInTheDocument();
  });

  it('previews the caso file through the moderator session, not by framing the API', async () => {
    render(<CasesPanel />);

    const frame = await screen.findByTitle('Vista previa de Parcial 1 escaneado');
    expect(frame).toHaveAttribute('src', 'blob:case-file');
    expect(mocks.file).toHaveBeenCalledWith('case-hidden');
  });

  it('never embeds a file that is not really a PDF', async () => {
    mocks.file.mockResolvedValue(new Blob(['<html>nope</html>'], { type: 'text/html' }));
    render(<CasesPanel />);

    expect(await screen.findByText('No pudimos mostrar la vista previa.')).toBeInTheDocument();
    expect(screen.queryByTitle('Vista previa de Parcial 1 escaneado')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir archivo' })).toBeInTheDocument();
  });

  it('retires with a required reason the author will see', async () => {
    const user = userEvent.setup();
    render(<CasesPanel />);
    await screen.findByRole('heading', { level: 2, name: 'Parcial 1 escaneado' });

    await user.click(screen.getByRole('button', { name: 'Retirar' }));
    expect(mocks.decide).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Escribí la razón');

    await user.type(screen.getByLabelText('Razón para el autor'), 'Se ven datos personales.');
    await user.click(screen.getByRole('button', { name: 'Retirar' }));

    await waitFor(() =>
      expect(mocks.decide).toHaveBeenCalledWith(
        'case-hidden',
        'REMOVE',
        'Se ven datos personales.',
      ),
    );
    await waitFor(() => expect(mocks.queue).toHaveBeenCalledTimes(2));
  });

  it('keeps content visible without requiring a reason', async () => {
    const user = userEvent.setup();
    render(<CasesPanel />);
    await screen.findByRole('heading', { level: 2, name: 'Parcial 1 escaneado' });

    await user.click(screen.getByRole('button', { name: 'Mantener visible' }));

    await waitFor(() =>
      expect(mocks.decide).toHaveBeenCalledWith('case-hidden', 'KEEP_VISIBLE', undefined),
    );
  });

  it('shows «Autor oculto» for anonymous entries and reveals only with a reason', async () => {
    const user = userEvent.setup();
    mocks.reveal.mockResolvedValue({
      hidden: false,
      id: 'author-2',
      username: 'juan.p',
      displayName: null,
      accountCreatedAt: '2026-01-01T00:00:00.000Z',
      publishedMaterials: 9,
      removalsLast90Days: 1,
    });
    render(<CasesPanel />);

    await user.click(await screen.findByRole('button', { name: /Reseña de cursada/ }));
    expect(await screen.findByText('Autor oculto')).toBeInTheDocument();
    expect(screen.queryByText('juan.p')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ver autor' }));
    expect(mocks.reveal).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Motivo para ver el autor'), 'Evaluar reincidencia');
    await user.click(screen.getByRole('button', { name: 'Ver autor' }));

    expect(await screen.findByText('@juan.p')).toBeInTheDocument();
    expect(mocks.reveal).toHaveBeenCalledWith('case-review', 'Evaluar reincidencia');
  });

  it('approves or rejects a revisión previa', async () => {
    const user = userEvent.setup();
    mocks.detail.mockResolvedValue(
      detail({
        caseId: 'case-prior',
        kind: 'PRIOR_REVIEW',
        reports: [],
        target: {
          type: 'MATERIAL',
          id: 'mat-2',
          status: 'PENDING_REVIEW',
          label: 'Resumen unidad 1',
          subject,
          isAnonymous: false,
          fileType: 'pdf',
        },
      }),
    );
    render(<CasesPanel />);
    await user.click(await screen.findByRole('button', { name: /Resumen unidad 1/ }));
    await screen.findByRole('heading', { level: 2, name: 'Resumen unidad 1' });

    await user.click(screen.getByRole('button', { name: 'Aprobar y publicar' }));

    await waitFor(() =>
      expect(mocks.decide).toHaveBeenCalledWith('case-prior', 'APPROVE', undefined),
    );
  });

  it('disables decisions on a conflict of interest', async () => {
    mocks.detail.mockResolvedValue(
      detail({ viewer: { canDecide: false, conflict: 'OWN_CONTENT' } }),
    );
    render(<CasesPanel />);

    expect(
      await screen.findByText(/No podés decidir sobre tu propio contenido/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retirar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mantener visible' })).toBeDisabled();
  });

  it('moves between casos with J and K and never decides from the keyboard', async () => {
    const user = userEvent.setup();
    render(<CasesPanel />);
    await screen.findByRole('heading', { level: 2, name: 'Parcial 1 escaneado' });

    await user.keyboard('j');
    await waitFor(() => expect(mocks.detail).toHaveBeenLastCalledWith('case-review'));
    await user.keyboard('k');
    await waitFor(() => expect(mocks.detail).toHaveBeenLastCalledWith('case-hidden'));
    await screen.findByRole('heading', { level: 2, name: 'Parcial 1 escaneado' });

    await user.keyboard('r');
    expect(screen.getByLabelText('Razón para el autor')).toHaveFocus();
    await user.keyboard('k');
    expect(screen.getByLabelText('Razón para el autor')).toHaveValue('k');
    expect(mocks.decide).not.toHaveBeenCalled();
  });
});
