import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getInstitutions,
  getMyStudyPlans,
  replaceMyStudyPlans,
  type DeclaredStudyPlan,
  type InstitutionTree,
} from '@/lib/study-plans-client';

import { MyStudyPlans } from './MyStudyPlans';

vi.mock('@/lib/study-plans-client', () => ({
  getInstitutions: vi.fn(),
  getMyStudyPlans: vi.fn(),
  replaceMyStudyPlans: vi.fn(),
}));

const unju = { id: 'u-unju', name: 'Universidad Nacional de Jujuy', shortName: 'UNJU' };
const fi = { id: 'f-fi', name: 'Facultad de Ingeniería', shortName: 'FI' };
const informatica = { id: 'c-inf', name: 'Ingeniería Informática', code: 'II' };
const industrial = { id: 'c-ind', name: 'Ingeniería Industrial', code: 'IND' };

const tree: InstitutionTree = [
  {
    ...unju,
    faculties: [
      {
        ...fi,
        careers: [
          { ...industrial, studyPlans: [{ id: 'p-ind', name: 'Plan 2019', code: 'IND-19' }] },
          {
            ...informatica,
            studyPlans: [
              { id: 'p-2011', name: 'Plan 2011', code: 'II-11' },
              { id: 'p-2023', name: 'Plan 2023', code: 'II-23' },
            ],
          },
        ],
      },
    ],
  },
];

function declared(
  studyPlan: { id: string; name: string; code: string },
  status: DeclaredStudyPlan['status'],
  career = informatica,
): DeclaredStudyPlan {
  return { studyPlanId: studyPlan.id, status, studyPlan, career, faculty: fi, university: unju };
}

afterEach(cleanup);

describe('MyStudyPlans («Mi carrera»)', () => {
  beforeEach(() => {
    vi.mocked(getInstitutions).mockReset().mockResolvedValue(tree);
    vi.mocked(getMyStudyPlans).mockReset();
    vi.mocked(replaceMyStudyPlans).mockReset();
  });

  it('lists declared plans with their status and says they are private', async () => {
    vi.mocked(getMyStudyPlans).mockResolvedValue([
      declared({ id: 'p-2023', name: 'Plan 2023', code: 'II-23' }, 'ACTIVE'),
      declared({ id: 'p-ind', name: 'Plan 2019', code: 'IND-19' }, 'DROPPED', industrial),
    ]);

    render(<MyStudyPlans />);

    const section = await screen.findByRole('region', { name: 'Mi carrera' });
    const items = await within(section).findAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Ingeniería Informática · Plan 2023');
    expect(items[0]).toHaveTextContent('FI (UNJU)');
    expect(within(items[0]).getByRole('combobox', { name: /estado/i })).toHaveDisplayValue(
      'Activo',
    );
    expect(within(items[1]).getByRole('combobox', { name: /estado/i })).toHaveDisplayValue(
      'Abandonado',
    );
    expect(within(section).getByText(/son privados/i)).toBeInTheDocument();
  });

  it('adds a plan through dependent selects, preselecting single options', async () => {
    const user = userEvent.setup();
    vi.mocked(getMyStudyPlans).mockResolvedValue([]);
    vi.mocked(replaceMyStudyPlans).mockResolvedValue([
      declared({ id: 'p-2023', name: 'Plan 2023', code: 'II-23' }, 'ACTIVE'),
    ]);

    render(<MyStudyPlans />);

    expect(await screen.findByText(/todavía no declaraste/i)).toBeInTheDocument();
    // One universidad and one facultad: already chosen.
    expect(screen.getByRole('combobox', { name: 'Universidad' })).toHaveDisplayValue(
      'Universidad Nacional de Jujuy',
    );
    expect(screen.getByRole('combobox', { name: 'Facultad' })).toHaveDisplayValue(
      'Facultad de Ingeniería',
    );
    const plan = screen.getByRole('combobox', { name: 'Plan' });
    expect(plan).toBeDisabled();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Carrera' }), 'c-inf');
    expect(plan).toBeEnabled();
    await user.selectOptions(plan, 'p-2023');
    await user.click(screen.getByRole('button', { name: 'Agregar plan' }));

    expect(replaceMyStudyPlans).toHaveBeenCalledWith([{ studyPlanId: 'p-2023', status: 'ACTIVE' }]);
    expect(await screen.findByText('Ingeniería Informática · Plan 2023')).toBeInTheDocument();
    // The declared plan is no longer offered, so nothing is preselected again.
    expect(screen.getByRole('combobox', { name: 'Plan' })).not.toHaveTextContent('Plan 2023');
    expect(screen.getByRole('button', { name: 'Agregar plan' })).toBeDisabled();
  });

  it('sends the full list when a status changes or a plan is removed', async () => {
    const user = userEvent.setup();
    const p2023 = declared({ id: 'p-2023', name: 'Plan 2023', code: 'II-23' }, 'ACTIVE');
    const p2011 = declared({ id: 'p-2011', name: 'Plan 2011', code: 'II-11' }, 'ACTIVE');
    vi.mocked(getMyStudyPlans).mockResolvedValue([p2011, p2023]);
    vi.mocked(replaceMyStudyPlans)
      .mockResolvedValueOnce([{ ...p2011, status: 'COMPLETED' }, p2023])
      .mockResolvedValueOnce([p2023]);

    render(<MyStudyPlans />);
    const items = await screen.findAllByRole('listitem');

    await user.selectOptions(
      within(items[0]).getByRole('combobox', { name: /estado/i }),
      'COMPLETED',
    );
    expect(replaceMyStudyPlans).toHaveBeenLastCalledWith([
      { studyPlanId: 'p-2011', status: 'COMPLETED' },
      { studyPlanId: 'p-2023', status: 'ACTIVE' },
    ]);

    await user.click(
      within(screen.getAllByRole('listitem')[0]).getByRole('button', { name: /quitar/i }),
    );
    expect(replaceMyStudyPlans).toHaveBeenLastCalledWith([
      { studyPlanId: 'p-2023', status: 'ACTIVE' },
    ]);
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1));
  });

  it('hides declared plans from the options and shows an API error, keeping the list', async () => {
    const user = userEvent.setup();
    vi.mocked(getMyStudyPlans).mockResolvedValue([
      declared({ id: 'p-2023', name: 'Plan 2023', code: 'II-23' }, 'ACTIVE'),
    ]);
    vi.mocked(replaceMyStudyPlans).mockRejectedValue({
      response: { data: { message: 'Ese plan ya está en tu lista.' } },
    });

    render(<MyStudyPlans />);
    await screen.findByText('Ingeniería Informática · Plan 2023');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Carrera' }), 'c-inf');
    expect(
      within(screen.getByRole('combobox', { name: 'Plan' })).queryByRole('option', {
        name: 'Plan 2023',
      }),
    ).not.toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Plan' }), 'p-2011');
    await user.click(screen.getByRole('button', { name: 'Agregar plan' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Ese plan ya está en tu lista.');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('stops adding plans at 10', async () => {
    vi.mocked(getMyStudyPlans).mockResolvedValue(
      Array.from({ length: 10 }, (_, i) =>
        declared({ id: `p-x${i}`, name: `Plan ${i}`, code: `X${i}` }, 'ACTIVE'),
      ),
    );

    render(<MyStudyPlans />);

    expect(await screen.findByText(/máximo de 10 planes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar plan' })).toBeDisabled();
  });
});
