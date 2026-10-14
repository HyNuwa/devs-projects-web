import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: { id: 'admin-1', role: 'ADMIN' } as { id: string; role: string } | null,
  catalog: {
    universities: vi.fn(),
    faculties: vi.fn(),
    careers: vi.fn(),
    career: vi.fn(),
    subjects: vi.fn(),
    requestCount: vi.fn(),
    updateFaculty: vi.fn(),
    slugCheck: vi.fn(),
    remove: vi.fn(),
    publish: vi.fn(),
    unpublish: vi.fn(),
    createUniversity: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/catalogo',
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

import { CatalogPanel } from './CatalogPanel';

const unsa = {
  id: 'u-unsa',
  name: 'Universidad Nacional de Salta',
  shortName: 'UNSa',
  facultyCount: 2,
};
const exactas = {
  id: 'f-fce',
  name: 'Facultad de Ciencias Exactas',
  shortName: 'FCEx',
  careerCount: 1,
  subjectCount: 0,
  moderatorCount: 1,
};
const fisica = {
  id: 'c-lf',
  name: 'Licenciatura en Física',
  code: 'LF',
  status: 'DRAFT' as const,
  planUrl: null,
};

const conflict = (data: object) =>
  Object.assign(new Error('409'), { response: { status: 409, data } });

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: 'admin-1', role: 'ADMIN' };
  const c = mocks.catalog;
  c.universities.mockResolvedValue([unsa]);
  c.faculties.mockResolvedValue([exactas]);
  c.careers.mockResolvedValue([fisica]);
  c.requestCount.mockResolvedValue(4);
  c.slugCheck.mockResolvedValue(null);
  c.updateFaculty.mockResolvedValue({});
  c.publish.mockResolvedValue({ id: 'c-lf', status: 'PUBLISHED' });
  c.career.mockResolvedValue({
    ...fisica,
    declarationCount: 0,
    faculty: { id: 'f-fce', name: exactas.name, shortName: 'FCEx', university: unsa },
    placements: [],
  });
  c.subjects.mockResolvedValue([]);
});

const openFaculty = async () => {
  const user = userEvent.setup();
  render(<CatalogPanel />);
  await user.click(await screen.findByRole('button', { name: /^UNSa ·/ }));
  await user.click(await screen.findByRole('button', { name: /^FCEx ·/ }));
  return user;
};

describe('CatalogPanel', () => {
  it('is only for admins', async () => {
    mocks.user = { id: 'mod-1', role: 'MODERATOR' };
    render(<CatalogPanel />);
    expect(await screen.findByText('Esta sección es solo para admins.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Catálogo/ })).toBeNull();
    expect(mocks.catalog.universities).not.toHaveBeenCalled();
  });

  it('shows the tab with the pending solicitudes count', async () => {
    render(<CatalogPanel />);
    const nav = screen.getByRole('navigation', { name: 'Moderación' });
    const tab = within(nav).getByRole('link', { name: /Catálogo/ });
    expect(tab).toHaveAttribute('aria-current', 'page');
    await waitFor(() => expect(tab).toHaveTextContent('4'));
  });

  it('expands the tree level by level and marks borradores', async () => {
    await openFaculty();
    expect(mocks.catalog.faculties).toHaveBeenCalledWith('u-unsa');
    expect(mocks.catalog.careers).toHaveBeenCalledWith('f-fce');
    const tree = screen.getByRole('tree', { name: 'Catálogo' });
    expect(within(tree).getByText('Licenciatura en Física')).toBeInTheDocument();
    expect(within(tree).getByText('Borrador')).toBeInTheDocument();
  });

  it('renames a facultad, warning when the new short name is an alias', async () => {
    const user = await openFaculty();
    await user.click(screen.getByRole('button', { name: 'Editar FCEx' }));
    const shortName = screen.getByLabelText('Nombre corto');
    await user.clear(shortName);
    await user.type(shortName, 'FCE');
    mocks.catalog.slugCheck.mockResolvedValue({
      kind: 'FACULTY',
      id: 'f-old',
      name: 'Facultad de Economía',
      shortName: 'FECO',
    });
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(mocks.catalog.slugCheck).toHaveBeenCalledWith('FACULTY', 'u-unsa', 'FCE');
    expect(
      await screen.findByText(/«fce» hoy redirige a Facultad de Economía; dejará de hacerlo/),
    ).toBeInTheDocument();
    expect(mocks.catalog.updateFaculty).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(mocks.catalog.updateFaculty).toHaveBeenCalledWith('f-fce', {
      name: exactas.name,
      shortName: 'FCE',
    });
  });

  it('says what blocks a deletion', async () => {
    const user = await openFaculty();
    await user.click(screen.getByRole('button', { name: 'Editar FCEx' }));
    mocks.catalog.remove.mockRejectedValue(
      conflict({
        code: 'CATALOG_BLOCKED',
        blockers: { careers: 1, moderators: 1 },
        message: 'No se puede borrar: tiene 1 carreras, 1 moderadores asignados.',
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Borrar' }));
    await user.click(screen.getByRole('button', { name: 'Sí, borrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se puede borrar: tiene 1 carreras, 1 moderadores asignados.',
    );
  });

  it('publishes a carrera en borrador', async () => {
    const user = await openFaculty();
    await user.click(screen.getByRole('button', { name: 'Editar Licenciatura en Física' }));
    await user.click(await screen.findByRole('button', { name: 'Publicar' }));
    expect(mocks.catalog.publish).toHaveBeenCalledWith('c-lf');
    await waitFor(() => expect(mocks.catalog.careers).toHaveBeenCalledTimes(2));
  });

  it('creates a universidad', async () => {
    const user = userEvent.setup();
    mocks.catalog.createUniversity.mockResolvedValue({ id: 'u-new' });
    render(<CatalogPanel />);
    await screen.findByRole('button', { name: /^UNSa ·/ });
    await user.click(screen.getByRole('button', { name: 'Nueva universidad' }));
    await user.type(screen.getByLabelText('Nombre'), 'Universidad Nacional de Río Negro');
    await user.type(screen.getByLabelText('Nombre corto'), 'UNRN');
    await user.click(screen.getByRole('button', { name: 'Crear' }));
    expect(mocks.catalog.createUniversity).toHaveBeenCalledWith({
      name: 'Universidad Nacional de Río Negro',
      shortName: 'UNRN',
    });
  });

  it('shows the saved name and compares the next rename against it', async () => {
    const user = await openFaculty();
    await user.click(screen.getByRole('button', { name: 'Editar FCEx' }));
    const shortName = screen.getByLabelText('Nombre corto');
    await user.clear(shortName);
    await user.type(shortName, 'FCE');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(mocks.catalog.updateFaculty).toHaveBeenCalledTimes(1));

    mocks.catalog.slugCheck.mockClear();
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(mocks.catalog.updateFaculty).toHaveBeenCalledTimes(2));
    expect(mocks.catalog.slugCheck).not.toHaveBeenCalled();
  });

  it('says so when the alias check fails', async () => {
    const user = await openFaculty();
    await user.click(screen.getByRole('button', { name: 'Editar FCEx' }));
    const shortName = screen.getByLabelText('Nombre corto');
    await user.clear(shortName);
    await user.type(shortName, 'FCE');
    mocks.catalog.slugCheck.mockRejectedValue(
      Object.assign(new Error('500'), { response: { data: { message: 'Algo falló' } } }),
    );
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Algo falló');
  });
});
