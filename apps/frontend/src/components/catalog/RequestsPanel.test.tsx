import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdminCareerRequest } from '@/lib/catalog-admin-client';

const mocks = vi.hoisted(() => ({
  user: { id: 'admin-1', role: 'ADMIN' } as { id: string; role: string } | null,
  catalog: {
    requests: vi.fn(),
    requestCount: vi.fn(),
    universities: vi.fn(),
    faculties: vi.fn(),
    careers: vi.fn(),
    acceptRequest: vi.fn(),
    rejectRequest: vi.fn(),
    alreadyLoaded: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/catalogo/solicitudes',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/lib/moderation-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/moderation-client')>()),
  getModerationSummary: () =>
    Promise.resolve({ overdueCases: 0, openCases: 0, pendingAppeals: 0, pendingProposals: 0 }),
}));
vi.mock('@/lib/study-plans-client', () => ({ getInstitutions: () => Promise.resolve([]) }));
vi.mock('@/lib/catalog-admin-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/catalog-admin-client')>()),
  catalogAdmin: mocks.catalog,
}));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: mocks.user, isLoading: false }),
}));

import { RequestsPanel } from './RequestsPanel';

const unsa = { id: 'u-unsa', name: 'Universidad Nacional de Salta', shortName: 'UNSa' };
const inCatalog: AdminCareerRequest = {
  id: 'r-1',
  careerName: 'Licenciatura en Física',
  planUrl: 'https://exactas.unsa.edu.ar/lf',
  comment: 'Somos muchos',
  facultyText: null,
  universityText: null,
  createdAt: '2026-10-10T10:00:00.000Z',
  updatedAt: '2026-10-12T10:00:00.000Z',
  author: 'ana',
  count: 3,
  faculty: {
    id: 'f-fce',
    name: 'Facultad de Ciencias Exactas',
    shortName: 'FCE',
    university: unsa,
  },
};
const freeText: AdminCareerRequest = {
  ...inCatalog,
  id: 'r-2',
  careerName: 'Bioquímica',
  comment: null,
  facultyText: 'Facultad de Química',
  universityText: 'Universidad del Norte',
  author: 'beto',
  count: 1,
  faculty: null,
};

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: 'admin-1', role: 'ADMIN' };
  const c = mocks.catalog;
  c.requests.mockResolvedValue([inCatalog, freeText]);
  c.requestCount.mockResolvedValue(2);
  c.universities.mockResolvedValue([{ ...unsa, facultyCount: 1 }]);
  c.faculties.mockResolvedValue([
    {
      id: 'f-fce',
      name: 'Facultad de Ciencias Exactas',
      shortName: 'FCE',
      careerCount: 1,
      subjectCount: 0,
      moderatorCount: 0,
    },
  ]);
  c.careers.mockResolvedValue([
    { id: 'c-lf', name: 'Licenciatura en Física', code: 'LF', status: 'PUBLISHED', planUrl: null },
    { id: 'c-dr', name: 'Borrador', code: 'BR', status: 'DRAFT', planUrl: null },
  ]);
  c.acceptRequest.mockResolvedValue({ careerId: 'c-new' });
  c.rejectRequest.mockResolvedValue(undefined);
  c.alreadyLoaded.mockResolvedValue(undefined);
});

const card = async (name: string) =>
  (await screen.findByRole('heading', { name })).closest('article') as HTMLElement;

describe('RequestsPanel', () => {
  it('lists the pending solicitudes with their count and facultad', async () => {
    render(<RequestsPanel />);
    const physics = await card('Licenciatura en Física');
    expect(physics).toHaveTextContent('FCE · UNSa');
    expect(physics).toHaveTextContent('3 estudiantes');
    expect(physics).toHaveTextContent('@ana');
    expect(within(physics).getByRole('link', { name: /Plan oficial/ })).toHaveAttribute(
      'href',
      inCatalog.planUrl,
    );
    const bio = await card('Bioquímica');
    expect(bio).toHaveTextContent(
      'Facultad de Química · Universidad del Norte (no está en el catálogo)',
    );
  });

  it('accepts into a carrera en borrador', async () => {
    const user = userEvent.setup();
    render(<RequestsPanel />);
    const physics = await card('Licenciatura en Física');
    await user.click(within(physics).getByRole('button', { name: 'Aceptar' }));
    expect(within(physics).getByLabelText('Nombre de la carrera')).toHaveValue(
      'Licenciatura en Física',
    );
    await user.type(within(physics).getByLabelText('Código'), 'LF');
    await user.click(within(physics).getByRole('button', { name: 'Crear borrador' }));
    expect(mocks.catalog.acceptRequest).toHaveBeenCalledWith('r-1', {
      career: { name: 'Licenciatura en Física', code: 'LF' },
    });
    await waitFor(() => expect(mocks.catalog.requests).toHaveBeenCalledTimes(2));
  });

  it('asks to confirm a free-text facultad when accepting', async () => {
    const user = userEvent.setup();
    render(<RequestsPanel />);
    const bio = await card('Bioquímica');
    await user.click(within(bio).getByRole('button', { name: 'Aceptar' }));
    expect(within(bio).getByLabelText('Nombre de la facultad')).toHaveValue('Facultad de Química');
    await user.selectOptions(await within(bio).findByLabelText('Universidad'), 'u-unsa');
    await user.type(within(bio).getByLabelText('Nombre corto de la facultad'), 'FQ');
    await user.type(within(bio).getByLabelText('Código'), 'BQ');
    await user.click(within(bio).getByRole('button', { name: 'Crear borrador' }));
    expect(mocks.catalog.acceptRequest).toHaveBeenCalledWith('r-2', {
      career: { name: 'Bioquímica', code: 'BQ' },
      faculty: { name: 'Facultad de Química', shortName: 'FQ', universityId: 'u-unsa' },
    });
  });

  it('accepts a free-text solicitud into an existing facultad', async () => {
    const user = userEvent.setup();
    render(<RequestsPanel />);
    const bio = await card('Bioquímica');
    await user.click(within(bio).getByRole('button', { name: 'Aceptar' }));
    await user.selectOptions(await within(bio).findByLabelText('Universidad'), 'u-unsa');
    await user.selectOptions(await within(bio).findByLabelText('Facultad'), 'f-fce');
    expect(within(bio).queryByLabelText('Nombre de la facultad')).toBeNull();
    await user.type(within(bio).getByLabelText('Código'), 'BQ');
    await user.click(within(bio).getByRole('button', { name: 'Crear borrador' }));
    expect(mocks.catalog.acceptRequest).toHaveBeenCalledWith('r-2', {
      facultyId: 'f-fce',
      career: { name: 'Bioquímica', code: 'BQ' },
    });
  });

  it('rejects only with a reason', async () => {
    const user = userEvent.setup();
    render(<RequestsPanel />);
    const physics = await card('Licenciatura en Física');
    await user.click(within(physics).getByRole('button', { name: 'Rechazar' }));
    await user.click(within(physics).getByRole('button', { name: 'Confirmar rechazo' }));
    expect(within(physics).getByRole('alert')).toHaveTextContent('Escribí el motivo');
    expect(mocks.catalog.rejectRequest).not.toHaveBeenCalled();
    await user.type(within(physics).getByLabelText('Motivo'), 'No es de grado');
    await user.click(within(physics).getByRole('button', { name: 'Confirmar rechazo' }));
    expect(mocks.catalog.rejectRequest).toHaveBeenCalledWith('r-1', 'No es de grado');
  });

  it('marks as already loaded with a published carrera of its facultad', async () => {
    const user = userEvent.setup();
    render(<RequestsPanel />);
    const physics = await card('Licenciatura en Física');
    await user.click(within(physics).getByRole('button', { name: 'Ya está cargada' }));
    const picker = await within(physics).findByLabelText('Carrera');
    expect(within(picker).queryByRole('option', { name: 'Borrador' })).toBeNull();
    await user.selectOptions(picker, 'c-lf');
    await user.click(within(physics).getByRole('button', { name: 'Confirmar' }));
    expect(mocks.catalog.alreadyLoaded).toHaveBeenCalledWith('r-1', 'c-lf');
  });

  it('is only for admins', async () => {
    mocks.user = { id: 'mod-1', role: 'MODERATOR' };
    render(<RequestsPanel />);
    expect(await screen.findByText('Esta sección es solo para admins.')).toBeInTheDocument();
    expect(mocks.catalog.requests).not.toHaveBeenCalled();
  });
});
