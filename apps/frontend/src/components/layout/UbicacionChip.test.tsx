import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { InstitutionTree } from '@/lib/study-plans-client';

const mocks = vi.hoisted(() => ({
  user: null as { id: string } | null,
  isLoading: false,
  getInstitutions: vi.fn(),
  getMyCareers: vi.fn(),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: mocks.user, isLoading: mocks.isLoading }),
}));
vi.mock('@/lib/study-plans-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/study-plans-client')>()),
  getInstitutions: mocks.getInstitutions,
  getMyCareers: mocks.getMyCareers,
}));

import { resetUbicacionStore, UBICACION_STORAGE_KEY } from '@/stores/ubicacionStore';

import { UbicacionChip } from './UbicacionChip';

const tree: InstitutionTree = [
  {
    id: 'u-unju',
    name: 'Universidad Nacional de Jujuy',
    shortName: 'UNJU',
    faculties: [{ id: 'f-fi', name: 'Facultad de Ingeniería', shortName: 'FI', careers: [] }],
  },
  {
    id: 'u-unsa',
    name: 'Universidad Nacional de Salta',
    shortName: 'UNSa',
    faculties: [
      { id: 'f-unsa-ex', name: 'Facultad de Ciencias Exactas', shortName: 'FCEx', careers: [] },
    ],
  },
];

afterEach(cleanup);

beforeEach(() => {
  resetUbicacionStore();
  window.localStorage.clear();
  mocks.user = null;
  mocks.isLoading = false;
  mocks.getInstitutions.mockReset().mockResolvedValue(tree);
  mocks.getMyCareers.mockReset().mockResolvedValue([]);
});

describe('UbicacionChip', () => {
  it('shows a signed-in student the facultad of their carrera', async () => {
    mocks.user = { id: 'u1' };
    mocks.getMyCareers.mockResolvedValue([
      {
        careerId: 'c1',
        status: 'ACTIVE',
        declaredAt: '2026-03-01T00:00:00.000Z',
        career: { id: 'c1', name: 'Ingeniería Informática', code: 'II' },
        faculty: { id: 'f-fi', name: 'Facultad de Ingeniería', shortName: 'FI' },
        university: { id: 'u-unju', name: 'Universidad Nacional de Jujuy', shortName: 'UNJU' },
      },
    ]);
    render(<UbicacionChip />);
    const button = await screen.findByRole('button', { name: 'Tu ubicación: UNJU · FI' });
    // The compact header shows the facultad's short name.
    expect(within(button).getByText('FI', { selector: '.lg\\:hidden' })).toBeInTheDocument();
  });

  it('invites a visitor who never chose to choose, filtering nothing', async () => {
    render(<UbicacionChip />);
    expect(await screen.findByRole('button', { name: 'Elegí tu facultad' })).toBeInTheDocument();
  });

  it('links to the facultad and saves a new choice on the device', async () => {
    window.localStorage.setItem(
      UBICACION_STORAGE_KEY,
      JSON.stringify({
        universityId: 'u-unju',
        universityShortName: 'UNJU',
        facultyId: 'f-fi',
        facultyShortName: 'FI',
      }),
    );
    render(<UbicacionChip />);
    fireEvent.click(await screen.findByRole('button', { name: 'Tu ubicación: UNJU · FI' }));
    const panel = screen.getByRole('dialog', { name: 'Tu ubicación' });
    expect(within(panel).getByRole('link', { name: /Ir a FI · UNJU/ })).toHaveAttribute(
      'href',
      '/universidades/unju/fi',
    );

    const university = await within(panel).findByRole('combobox', { name: 'Universidad' });
    fireEvent.change(university, { target: { value: 'u-unsa' } });
    fireEvent.change(within(panel).getByRole('combobox', { name: 'Facultad' }), {
      target: { value: 'f-unsa-ex' },
    });
    fireEvent.click(within(panel).getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Tu ubicación: UNSa · FCEx' })).toBeInTheDocument(),
    );
    expect(JSON.parse(window.localStorage.getItem(UBICACION_STORAGE_KEY)!)).toMatchObject({
      facultyId: 'f-unsa-ex',
      universityShortName: 'UNSa',
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes with Escape and returns focus to the chip', async () => {
    render(<UbicacionChip />);
    const button = await screen.findByRole('button', { name: 'Elegí tu facultad' });
    fireEvent.click(button);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(button).toHaveFocus();
  });
});
