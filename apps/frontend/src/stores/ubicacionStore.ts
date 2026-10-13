import { create } from 'zustand';

import { firstCareerCursando, getMyCareers, type DeclaredCareer } from '@/lib/study-plans-client';

/**
 * Ubicación (CONTEXT.md): the universidad and facultad someone browses from. It
 * sets where search and rankings start and never hides content (openspec
 * academic-structure/browsing).
 */
export type Ubicacion = {
  universityId: string;
  universityShortName: string;
  facultyId: string;
  facultyShortName: string;
};

export const UBICACION_STORAGE_KEY = 'devsproject.ubicacion';

type UbicacionState = {
  ubicacion: Ubicacion | null;
  /** Declared carreras of the signed-in student; empty for visitors. */
  myCareers: DeclaredCareer[];
  ready: boolean;
  /** Resolves the ubicación once per session: device choice, then first carrera cursando. */
  load: (signedIn: boolean) => Promise<void>;
  /** A choice made in the selector: remembered on this device only. */
  choose: (ubicacion: Ubicacion) => void;
};

function readDevice(): Ubicacion | null {
  try {
    const raw = window.localStorage.getItem(UBICACION_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<Ubicacion>;
    return value.facultyId &&
      value.universityId &&
      value.facultyShortName &&
      value.universityShortName
      ? (value as Ubicacion)
      : null;
  } catch {
    return null;
  }
}

function writeDevice(ubicacion: Ubicacion) {
  try {
    window.localStorage.setItem(UBICACION_STORAGE_KEY, JSON.stringify(ubicacion));
  } catch {
    // Private windows or blocked storage: the choice lasts for this page only.
  }
}

function fromCareer(career: DeclaredCareer | null): Ubicacion | null {
  if (!career) return null;
  return {
    universityId: career.university.id,
    universityShortName: career.university.shortName,
    facultyId: career.faculty.id,
    facultyShortName: career.faculty.shortName,
  };
}

let loadedFor: boolean | null = null;

export const useUbicacionStore = create<UbicacionState>((set) => ({
  ubicacion: null,
  myCareers: [],
  ready: false,
  load: async (signedIn) => {
    if (loadedFor === signedIn) return;
    loadedFor = signedIn;
    const device = readDevice();
    if (!signedIn) {
      set({ ubicacion: device, myCareers: [], ready: true });
      return;
    }
    let myCareers: DeclaredCareer[] = [];
    try {
      myCareers = await getMyCareers({ skipAuthRedirect: true });
    } catch {
      // Without the list the device choice still applies.
    }
    set({
      ubicacion: device ?? fromCareer(firstCareerCursando(myCareers)),
      myCareers,
      ready: true,
    });
  },
  choose: (ubicacion) => {
    writeDevice(ubicacion);
    set({ ubicacion });
  },
}));

/** Test-only: forget what was loaded so each test starts clean. */
export function resetUbicacionStore() {
  loadedFor = null;
  useUbicacionStore.setState({ ubicacion: null, myCareers: [], ready: false });
}
