'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button, ErrorState, LoadingState } from '@/components/ui/shadcn';
import { Field, FieldLabel } from '@/components/ui/shadcn/field';
import { getApiError } from '@/lib/apiHelpers';
import {
  getInstitutions,
  getMyCareers,
  replaceMyCareers,
  type DeclaredCareer,
  type InstitutionTree,
  type StudyPlanStatus,
} from '@/lib/study-plans-client';

const STATUS_LABEL: Record<StudyPlanStatus, string> = {
  ACTIVE: 'Cursando',
  COMPLETED: 'Terminada',
  DROPPED: 'Abandonada',
};

/** Same bound as the API (`MAX_DECLARED_CAREERS`). */
const MAX_CAREERS = 10;

const controlClassName =
  'min-h-11 w-full border border-input bg-background px-3 font-sans text-sm text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; tree: InstitutionTree; careers: DeclaredCareer[] };

type Draft = { universityId: string; facultyId: string; careerId: string };

/** With a single option, a level is chosen for the student. */
const onlyId = (options: { id: string }[]) => (options.length === 1 ? options[0].id : '');

/** Carreras already declared are never offered again, so they are never preselected. */
function draftFor(
  tree: InstitutionTree,
  declared: Set<string>,
  partial: Partial<Draft> = {},
): Draft {
  const universityId = partial.universityId ?? onlyId(tree);
  const faculties = tree.find((u) => u.id === universityId)?.faculties ?? [];
  const facultyId = partial.facultyId ?? onlyId(faculties);
  const careers = (faculties.find((f) => f.id === facultyId)?.careers ?? []).filter(
    (career) => !declared.has(career.id),
  );
  const careerId = partial.careerId ?? onlyId(careers);
  return { universityId, facultyId, careerId };
}

/**
 * «Mi carrera» (openspec academic-structure/institutions): the carreras the
 * student studies or finished, with their status. Private: never shown on the
 * public profile. Plans stay internal (ADR 0003).
 */
export function MyCareers() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getInstitutions(), getMyCareers()])
      .then(([tree, careers]) => {
        if (!active) return;
        setState({ status: 'ready', tree, careers });
        setDraft(draftFor(tree, new Set(careers.map((career) => career.careerId))));
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', message: getApiError(error) });
      });
    return () => {
      active = false;
    };
  }, []);

  const tree = useMemo(() => (state.status === 'ready' ? state.tree : []), [state]);
  const declared = useMemo(
    () => new Set(state.status === 'ready' ? state.careers.map((career) => career.careerId) : []),
    [state],
  );
  const options = useMemo(() => {
    const faculties = tree.find((u) => u.id === draft?.universityId)?.faculties ?? [];
    const careers = (faculties.find((f) => f.id === draft?.facultyId)?.careers ?? []).filter(
      (career) => !declared.has(career.id),
    );
    return { faculties, careers };
  }, [tree, declared, draft]);

  if (state.status === 'loading') {
    return <LoadingState heading="Cargando tu carrera" />;
  }
  if (state.status === 'error') {
    return <ErrorState description={state.message} heading="No pudimos cargar tu carrera" />;
  }

  const careers = state.careers;

  async function save(next: { careerId: string; status: StudyPlanStatus }[]) {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await replaceMyCareers(next);
      setState((current) =>
        current.status === 'ready' ? { ...current, careers: updated } : current,
      );
      // A removed carrera can be offered again; an added one no longer is.
      setDraft(draftFor(tree, new Set(updated.map((career) => career.careerId))));
    } catch (error) {
      setSaveError(getApiError(error));
    } finally {
      setSaving(false);
    }
  }

  const choices = () => careers.map(({ careerId, status }) => ({ careerId, status }));

  const changeStatus = (careerId: string, status: StudyPlanStatus) =>
    save(choices().map((entry) => (entry.careerId === careerId ? { ...entry, status } : entry)));

  const remove = (careerId: string) =>
    save(choices().filter((entry) => entry.careerId !== careerId));

  async function add() {
    if (!draft?.careerId) return;
    await save([...choices(), { careerId: draft.careerId, status: 'ACTIVE' }]);
  }

  const pick = (level: keyof Draft, value: string) => {
    if (!draft) return;
    const order: (keyof Draft)[] = ['universityId', 'facultyId', 'careerId'];
    const kept = Object.fromEntries(
      order.slice(0, order.indexOf(level)).map((key) => [key, draft[key]]),
    ) as Partial<Draft>;
    setDraft(draftFor(tree, declared, { ...kept, [level]: value }));
  };

  return (
    <section aria-labelledby="mi-carrera-heading" className="grid gap-4 font-sans" id="mi-carrera">
      <div className="grid gap-1">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em]" id="mi-carrera-heading">
          Mi carrera
        </h2>
        <p className="text-sm text-muted-foreground">
          Tus carreras son privadas: no aparecen en tu perfil público.
        </p>
      </div>

      {careers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no declaraste ninguna carrera.</p>
      ) : (
        <ul className="grid gap-3">
          {careers.map((entry) => (
            <li
              className="grid gap-3 rounded-xl border-[1.5px] border-border bg-card p-4 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-end"
              key={entry.careerId}
            >
              <div>
                <p className="font-extrabold">{entry.career.name}</p>
                <p className="text-muted-foreground">
                  {entry.faculty.shortName} ({entry.university.shortName})
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor={`career-status-${entry.careerId}`}>Estado</FieldLabel>
                <select
                  className={controlClassName}
                  disabled={saving}
                  id={`career-status-${entry.careerId}`}
                  onChange={(event) =>
                    changeStatus(entry.careerId, event.target.value as StudyPlanStatus)
                  }
                  value={entry.status}
                >
                  {Object.entries(STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Button
                aria-label={`Quitar ${entry.career.name}`}
                disabled={saving}
                onClick={() => remove(entry.careerId)}
                variant="outline"
              >
                Quitar
              </Button>
            </li>
          ))}
        </ul>
      )}

      {draft ? (
        <div className="grid gap-3 rounded-xl border-[1.5px] border-dashed border-border p-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="career-university">Universidad</FieldLabel>
            <select
              className={controlClassName}
              id="career-university"
              onChange={(event) => pick('universityId', event.target.value)}
              value={draft.universityId}
            >
              <option value="">Elegí una universidad</option>
              {tree.map((university) => (
                <option key={university.id} value={university.id}>
                  {university.name}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="career-faculty">Facultad</FieldLabel>
            <select
              className={controlClassName}
              disabled={options.faculties.length === 0}
              id="career-faculty"
              onChange={(event) => pick('facultyId', event.target.value)}
              value={draft.facultyId}
            >
              <option value="">Elegí una facultad</option>
              {options.faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="career-career">Carrera</FieldLabel>
            <select
              className={controlClassName}
              disabled={options.careers.length === 0}
              id="career-career"
              onChange={(event) => pick('careerId', event.target.value)}
              value={draft.careerId}
            >
              <option value="">Elegí una carrera</option>
              {options.careers.map((career) => (
                <option key={career.id} value={career.id}>
                  {career.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-3">
            <Button
              disabled={!draft.careerId || saving || careers.length >= MAX_CAREERS}
              onClick={add}
            >
              Agregar carrera
            </Button>
            {careers.length >= MAX_CAREERS ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Llegaste al máximo de {MAX_CAREERS} carreras. Quitá una para agregar otra.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {saveError ? (
        <p className="text-sm font-semibold text-destructive-ink" role="alert">
          {saveError}
        </p>
      ) : null}
    </section>
  );
}
