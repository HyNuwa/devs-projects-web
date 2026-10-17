import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getMyCareers: vi.fn() }));

vi.mock('@/lib/study-plans-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/study-plans-client')>()),
  getMyCareers: mocks.getMyCareers,
}));

import {
  resetUbicacionStore,
  UBICACION_STORAGE_KEY,
  useUbicacionStore,
  type Ubicacion,
} from './ubicacionStore';

const unsaFi: Ubicacion = {
  universityId: 'u-unsa',
  universityShortName: 'UNSa',
  facultyId: 'f-unsa',
  facultyShortName: 'FI',
};

const career = (careerId: string, status: string, declaredAt: string, faculty: string) => ({
  careerId,
  status,
  declaredAt,
  career: { id: careerId, name: careerId, code: careerId },
  faculty: { id: faculty, name: faculty, shortName: faculty.toUpperCase() },
  university: { id: 'u-unju', name: 'UNJU', shortName: 'UNJU' },
});

beforeEach(() => {
  resetUbicacionStore();
  window.localStorage.clear();
  mocks.getMyCareers.mockReset().mockResolvedValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ubicación', () => {
  it('uses the facultad of the first carrera cursando for a signed-in student', async () => {
    mocks.getMyCareers.mockResolvedValue([
      career('c-old', 'COMPLETED', '2025-01-01T00:00:00.000Z', 'fce'),
      career('c-two', 'ACTIVE', '2026-03-02T00:00:00.000Z', 'fca'),
      career('c-one', 'ACTIVE', '2026-03-01T00:00:00.000Z', 'fi'),
    ]);
    await useUbicacionStore.getState().load(true);
    expect(useUbicacionStore.getState().ubicacion).toEqual({
      universityId: 'u-unju',
      universityShortName: 'UNJU',
      facultyId: 'fi',
      facultyShortName: 'FI',
    });
    expect(mocks.getMyCareers).toHaveBeenCalledWith({ skipAuthRedirect: true });
  });

  it('prefers a choice made on this device', async () => {
    window.localStorage.setItem(UBICACION_STORAGE_KEY, JSON.stringify(unsaFi));
    mocks.getMyCareers.mockResolvedValue([
      career('c-one', 'ACTIVE', '2026-03-01T00:00:00.000Z', 'fi'),
    ]);
    await useUbicacionStore.getState().load(true);
    expect(useUbicacionStore.getState().ubicacion).toEqual(unsaFi);
    expect(useUbicacionStore.getState().myCareers).toHaveLength(1);
  });

  it('gives a visitor their device choice, or nothing', async () => {
    await useUbicacionStore.getState().load(false);
    expect(useUbicacionStore.getState().ubicacion).toBeNull();
    expect(mocks.getMyCareers).not.toHaveBeenCalled();

    resetUbicacionStore();
    window.localStorage.setItem(UBICACION_STORAGE_KEY, JSON.stringify(unsaFi));
    await useUbicacionStore.getState().load(false);
    expect(useUbicacionStore.getState().ubicacion).toEqual(unsaFi);
  });

  it('remembers a new choice on the device only', () => {
    useUbicacionStore.getState().choose(unsaFi);
    expect(useUbicacionStore.getState().ubicacion).toEqual(unsaFi);
    expect(JSON.parse(window.localStorage.getItem(UBICACION_STORAGE_KEY)!)).toEqual(unsaFi);
  });

  it('tolerates blocked storage and a failing carreras request', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    mocks.getMyCareers.mockRejectedValue(new Error('401'));
    await useUbicacionStore.getState().load(true);
    expect(useUbicacionStore.getState()).toMatchObject({ ubicacion: null, ready: true });
    expect(() => useUbicacionStore.getState().choose(unsaFi)).not.toThrow();
    expect(useUbicacionStore.getState().ubicacion).toEqual(unsaFi);
  });
});
