import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getGroupedSuggestions, getMaterialDiscovery } from '@/lib/discovery-client';

const fiId = '00000000-0000-4000-8000-00000000f001';
const otherId = '00000000-0000-4000-8000-00000000f777';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
  ubicacion: null as null | {
    universityId: string;
    universityShortName: string;
    facultyId: string;
    facultyShortName: string;
  },
  ready: true,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
  useSearchParams: () => mocks.searchParams,
}));
vi.mock('@/stores/ubicacionStore', () => ({
  useUbicacionStore: (selector: (state: unknown) => unknown) =>
    selector({ ubicacion: mocks.ubicacion, ready: mocks.ready, myCareers: [] }),
}));
vi.mock('@/lib/study-plans-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/study-plans-client')>()),
  getInstitutions: vi.fn().mockResolvedValue([
    {
      id: 'u-unsa',
      name: 'Universidad Nacional de Salta',
      shortName: 'UNSa',
      faculties: [
        {
          id: '00000000-0000-4000-8000-00000000f777',
          name: 'Facultad de Ingeniería',
          shortName: 'FI',
          careers: [],
        },
      ],
    },
  ]),
}));
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn((path: string) =>
      Promise.resolve({ data: path === '/professors' ? { data: [] } : [] }),
    ),
  },
}));
vi.mock('./MaterialPreviewDialog', () => ({ MaterialPreviewDialog: () => null }));
vi.mock('@/lib/discovery-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/discovery-client')>()),
  getGroupedSuggestions: vi.fn(),
  getMaterialDiscovery: vi.fn(),
}));

import { MaterialSearchPage } from './MaterialSearchPage';

const fiUnju = {
  universityId: 'u-unju',
  universityShortName: 'UNJU',
  facultyId: fiId,
  facultyShortName: 'FI',
};

afterEach(cleanup);

beforeEach(() => {
  mocks.push.mockReset();
  mocks.replace.mockReset();
  mocks.searchParams = new URLSearchParams();
  mocks.ubicacion = null;
  mocks.ready = true;
  vi.mocked(getGroupedSuggestions).mockReset().mockResolvedValue({ subjects: [], materials: [] });
  vi.mocked(getMaterialDiscovery)
    .mockReset()
    .mockResolvedValue({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } });
});

describe('MaterialSearchPage: facultad', () => {
  it('writes the ubicación into the URL when the link has no facultad', async () => {
    mocks.ubicacion = fiUnju;
    mocks.searchParams = new URLSearchParams('q=parcial');
    render(<MaterialSearchPage />);
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(`/buscar?q=parcial&facultad=${fiId}`, {
        scroll: false,
      }),
    );
  });

  it('searches only the facultad, says so, and widens with «en todas»', async () => {
    mocks.ubicacion = fiUnju;
    mocks.searchParams = new URLSearchParams(`q=parcial&facultad=${fiId}`);
    render(<MaterialSearchPage />);
    expect(await screen.findByText('en FI · UNJU')).toBeInTheDocument();
    await waitFor(() =>
      expect(getMaterialDiscovery).toHaveBeenCalledWith(
        expect.objectContaining({ facultyId: fiId, search: 'parcial' }),
      ),
    );
    expect(getGroupedSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'parcial', facultyId: fiId }),
    );
    expect(mocks.replace).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Buscar en todas' }));
    expect(mocks.push).toHaveBeenCalledWith('/buscar?q=parcial&facultad=todas');
  });

  it('restores a shared scope whatever the viewer’s ubicación', async () => {
    mocks.ubicacion = fiUnju;
    mocks.searchParams = new URLSearchParams('q=parcial&facultad=todas');
    render(<MaterialSearchPage />);
    expect(await screen.findByText('en todas las facultades')).toBeInTheDocument();
    await waitFor(() => expect(getMaterialDiscovery).toHaveBeenCalled());
    expect(vi.mocked(getMaterialDiscovery).mock.calls[0][0]).not.toHaveProperty('facultyId');
    expect(mocks.replace).not.toHaveBeenCalled();
    cleanup();

    mocks.searchParams = new URLSearchParams(`q=parcial&facultad=${otherId}`);
    render(<MaterialSearchPage />);
    expect(await screen.findByText('en FI · UNSa')).toBeInTheDocument();
  });

  it('covers every facultad without an ubicación', async () => {
    mocks.searchParams = new URLSearchParams('q=parcial');
    render(<MaterialSearchPage />);
    await waitFor(() => expect(getMaterialDiscovery).toHaveBeenCalled());
    expect(vi.mocked(getMaterialDiscovery).mock.calls[0][0]).not.toHaveProperty('facultyId');
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
