import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getInstitutions,
  getMyCareers,
  replaceMyCareers,
  type DeclaredCareer,
  type InstitutionTree,
} from '@/lib/study-plans-client';

import { MyCareers } from './MyCareers';

vi.mock('@/lib/study-plans-client', () => ({
  getInstitutions: vi.fn(),
  getMyCareers: vi.fn(),
  replaceMyCareers: vi.fn(),
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
          { ...informatica, studyPlans: [{ id: 'p-2023', name: 'Plan 2023', code: 'II-23' }] },
        ],
      },
    ],
  },
];

function declared(
  career: { id: string; name: string; code: string },
  status: DeclaredCareer['status'],
): DeclaredCareer {
  return {
    careerId: career.id,
    status,
    declaredAt: '2026-03-01T00:00:00.000Z',
    career,
    faculty: fi,
    university: unju,
  };
}

afterEach(cleanup);

describe('MyCareers («Mi carrera»)', () => {
  beforeEach(() => {
    vi.mocked(getInstitutions).mockReset().mockResolvedValue(tree);
    vi.mocked(getMyCareers).mockReset();
    vi.mocked(replaceMyCareers).mockReset();
  });

  it('lists declared carreras with cursando, terminada or abandonada, never a plan', async () => {
    vi.mocked(getMyCareers).mockResolvedValue([
      declared(informatica, 'ACTIVE'),
      declared(industrial, 'DROPPED'),
    ]);

    render(<MyCareers />);

    const section = await screen.findByRole('region', { name: 'Mi carrera' });
    const items = await within(section).findAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Ingeniería Informática');
    expect(items[0]).toHaveTextContent('FI (UNJU)');
    expect(within(items[0]).getByRole('combobox', { name: /estado/i })).toHaveDisplayValue(
      'Cursando',
    );
    expect(within(items[1]).getByRole('combobox', { name: /estado/i })).toHaveDisplayValue(
      'Abandonada',
    );
    expect(within(section).getByText(/son privadas/i)).toBeInTheDocument();
    expect(within(section).queryByText(/plan/i)).toBeNull();
  });

  it('adds a carrera through universidad, facultad and carrera, without a plan select', async () => {
    const user = userEvent.setup();
    vi.mocked(getMyCareers).mockResolvedValue([]);
    vi.mocked(replaceMyCareers).mockResolvedValue([declared(informatica, 'ACTIVE')]);

    render(<MyCareers />);

    expect(await screen.findByText(/todavía no declaraste/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Universidad' })).toHaveDisplayValue(
      'Universidad Nacional de Jujuy',
    );
    expect(screen.getByRole('combobox', { name: 'Facultad' })).toHaveDisplayValue(
      'Facultad de Ingeniería',
    );
    expect(screen.queryByRole('combobox', { name: 'Plan' })).toBeNull();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Carrera' }), 'c-inf');
    await user.click(screen.getByRole('button', { name: 'Agregar carrera' }));

    expect(replaceMyCareers).toHaveBeenCalledWith([{ careerId: 'c-inf', status: 'ACTIVE' }]);
    expect(await screen.findByText('Ingeniería Informática')).toBeInTheDocument();
    // A declared carrera is no longer offered.
    expect(
      within(screen.getByRole('combobox', { name: 'Carrera' })).queryByRole('option', {
        name: 'Ingeniería Informática',
      }),
    ).toBeNull();
  });

  it('sends the full list when a status changes or a carrera is removed', async () => {
    const user = userEvent.setup();
    const inf = declared(informatica, 'ACTIVE');
    const ind = declared(industrial, 'ACTIVE');
    vi.mocked(getMyCareers).mockResolvedValue([ind, inf]);
    vi.mocked(replaceMyCareers)
      .mockResolvedValueOnce([{ ...ind, status: 'COMPLETED' }, inf])
      .mockResolvedValueOnce([inf]);

    render(<MyCareers />);
    const items = await screen.findAllByRole('listitem');

    await user.selectOptions(
      within(items[0]).getByRole('combobox', { name: /estado/i }),
      'COMPLETED',
    );
    expect(replaceMyCareers).toHaveBeenLastCalledWith([
      { careerId: 'c-ind', status: 'COMPLETED' },
      { careerId: 'c-inf', status: 'ACTIVE' },
    ]);

    await user.click(
      within(screen.getAllByRole('listitem')[0]).getByRole('button', { name: /quitar/i }),
    );
    expect(replaceMyCareers).toHaveBeenLastCalledWith([{ careerId: 'c-inf', status: 'ACTIVE' }]);
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1));
  });

  it('shows an API error and keeps the list', async () => {
    const user = userEvent.setup();
    vi.mocked(getMyCareers).mockResolvedValue([declared(informatica, 'ACTIVE')]);
    vi.mocked(replaceMyCareers).mockRejectedValue({
      response: { data: { message: 'Esa carrera ya está en tu lista.' } },
    });

    render(<MyCareers />);
    await screen.findByText('Ingeniería Informática');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Carrera' }), 'c-ind');
    await user.click(screen.getByRole('button', { name: 'Agregar carrera' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Esa carrera ya está en tu lista.');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('stops adding carreras at 10', async () => {
    vi.mocked(getMyCareers).mockResolvedValue(
      Array.from({ length: 10 }, (_, i) =>
        declared({ id: `c-x${i}`, name: `Carrera ${i}`, code: `X${i}` }, 'ACTIVE'),
      ),
    );

    render(<MyCareers />);

    expect(await screen.findByText(/máximo de 10 carreras/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar carrera' })).toBeDisabled();
  });
});
