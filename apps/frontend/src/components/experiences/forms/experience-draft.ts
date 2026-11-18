/**
 * The one draft an experiencia form keeps across «Cambiar» (openspec
 * experiencias-formularios «Draft across «Cambiar»»): a single
 * `sessionStorage` slot, written before the form opens the chooser and read by
 * the form the chooser continues to. Every storage access is guarded, so when
 * storage is unavailable only the draft is lost.
 */

export const EXPERIENCE_DRAFT_KEY = 'experience-draft';

/** The chooser's route ids: `/materias/<código>/resenar` or `/final`. */
export type ExperienceDraftType = 'resenar' | 'final';

export interface ExperienceDraft {
  subjectCode: string;
  subjectName: string | null;
  type: ExperienceDraftType;
  values: Record<string, unknown>;
}

/** Fields both forms have: the narrative, and the anonymity choice. */
const SHARED_FIELDS = ['comment', 'isAnonymous'] as const;

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function saveExperienceDraft(draft: ExperienceDraft): void {
  try {
    storage()?.setItem(EXPERIENCE_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage full or denied: the draft is lost, the form keeps working.
  }
}

export function clearExperienceDraft(): void {
  try {
    storage()?.removeItem(EXPERIENCE_DRAFT_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

export function readExperienceDraft(): ExperienceDraft | null {
  try {
    const raw = storage()?.getItem(EXPERIENCE_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<ExperienceDraft> | null;
    if (
      !draft ||
      (draft.type !== 'resenar' && draft.type !== 'final') ||
      typeof draft.subjectCode !== 'string' ||
      typeof draft.values !== 'object' ||
      draft.values === null
    ) {
      return null;
    }
    return {
      subjectCode: draft.subjectCode,
      subjectName: typeof draft.subjectName === 'string' ? draft.subjectName : null,
      type: draft.type,
      values: draft.values,
    };
  } catch {
    return null;
  }
}

/**
 * The draft a new form of `type` for `subjectCode` continues on mount: any
 * draft the chooser hands over (`desde=formulario`), or else only one of the
 * same type and materia, as when the author comes back from «Cambiar» with the
 * browser's Back.
 */
export function draftToContinue({
  fromChooser,
  subjectCode,
  type,
}: {
  fromChooser: boolean;
  subjectCode: string;
  type: ExperienceDraftType;
}): ExperienceDraft | null {
  const draft = readExperienceDraft();
  if (!draft) return null;
  return fromChooser || (draft.type === type && draft.subjectCode === subjectCode) ? draft : null;
}

/** Whether a stored value fits the field whose empty value is `empty`. */
function fits(value: unknown, empty: unknown): boolean {
  if (Array.isArray(empty)) {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
  }
  if (typeof empty === 'boolean' || typeof empty === 'string') return typeof value === typeof empty;
  return value === null || typeof value === 'number' || typeof value === 'string';
}

/**
 * The values to restore into a form of `type` for `subjectCode`: every field
 * of the same type, or only the shared ones across types, without the
 * materia-bound fields (a catalog professor) when the materia changed.
 */
export function draftValuesFor<T extends object>(
  draft: ExperienceDraft,
  {
    empty,
    subjectBound,
    subjectCode,
    type,
  }: {
    empty: T;
    subjectBound: readonly (keyof T & string)[];
    subjectCode: string;
    type: ExperienceDraftType;
  },
): Partial<T> {
  const keys = (
    draft.type === type ? Object.keys(empty) : SHARED_FIELDS.filter((key) => key in empty)
  ) as (keyof T & string)[];
  const restored: Partial<T> = {};
  for (const key of keys) {
    if (draft.subjectCode !== subjectCode && subjectBound.includes(key)) continue;
    if (!(key in draft.values)) continue;
    const value = draft.values[key];
    if (fits(value, empty[key])) restored[key] = value as T[typeof key];
  }
  return restored;
}
