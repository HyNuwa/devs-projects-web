'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button, ErrorState, LoadingState } from '@/components/ui/shadcn';
import { Field, FieldLabel } from '@/components/ui/shadcn/field';
import { getApiError } from '@/lib/apiHelpers';
import {
  getInstitutions,
  getMyStudyPlans,
  replaceMyStudyPlans,
  type DeclaredStudyPlan,
  type InstitutionTree,
  type StudyPlanStatus,
} from '@/lib/study-plans-client';

const STATUS_LABEL: Record<StudyPlanStatus, string> = {
  ACTIVE: 'Activo',
  COMPLETED: 'Terminado',
  DROPPED: 'Abandonado',
};

/** Same bound as the API (`MAX_DECLARED_PLANS`). */
const MAX_PLANS = 10;

const controlClassName =
  'min-h-11 w-full border border-input bg-background px-3 font-sans text-sm text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; tree: InstitutionTree; plans: DeclaredStudyPlan[] };

type Draft = { universityId: string; facultyId: string; careerId: string; studyPlanId: string };

/** With a single option, a level is chosen for the student. */
const onlyId = (options: { id: string }[]) => (options.length === 1 ? options[0].id : '');

/** Plans already declared are never offered again, so they are never preselected. */
function draftFor(
  tree: InstitutionTree,
  declared: Set<string>,
  partial: Partial<Draft> = {},
): Draft {
  const universityId = partial.universityId ?? onlyId(tree);
  const faculties = tree.find((u) => u.id === universityId)?.faculties ?? [];
  const facultyId = partial.facultyId ?? onlyId(faculties);
  const careers = faculties.find((f) => f.id === facultyId)?.careers ?? [];
  const careerId = partial.careerId ?? onlyId(careers);
  const plans = (careers.find((c) => c.id === careerId)?.studyPlans ?? []).filter(
    (plan) => !declared.has(plan.id),
  );
  const studyPlanId = partial.studyPlanId ?? onlyId(plans);
  return { universityId, facultyId, careerId, studyPlanId };
}

/**
 * «Mi carrera» (openspec academic-structure/institutions): the plans the student
 * follows, with their status. Private: never shown on the public profile.
 */
export function MyStudyPlans() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getInstitutions(), getMyStudyPlans()])
      .then(([tree, plans]) => {
        if (!active) return;
        setState({ status: 'ready', tree, plans });
        setDraft(draftFor(tree, new Set(plans.map((plan) => plan.studyPlanId))));
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
    () => new Set(state.status === 'ready' ? state.plans.map((plan) => plan.studyPlanId) : []),
    [state],
  );
  const options = useMemo(() => {
    const faculties = tree.find((u) => u.id === draft?.universityId)?.faculties ?? [];
    const careers = faculties.find((f) => f.id === draft?.facultyId)?.careers ?? [];
    const plans = (careers.find((c) => c.id === draft?.careerId)?.studyPlans ?? []).filter(
      (plan) => !declared.has(plan.id),
    );
    return { faculties, careers, plans };
  }, [tree, declared, draft]);

  if (state.status === 'loading') {
    return <LoadingState heading="Cargando tu carrera" />;
  }
  if (state.status === 'error') {
    return <ErrorState description={state.message} heading="No pudimos cargar tu carrera" />;
  }

  const plans = state.plans;

  async function save(next: { studyPlanId: string; status: StudyPlanStatus }[]) {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await replaceMyStudyPlans(next);
      setState((current) =>
        current.status === 'ready' ? { ...current, plans: updated } : current,
      );
      // A removed plan can be offered again; an added one no longer is.
      setDraft(draftFor(tree, new Set(updated.map((plan) => plan.studyPlanId))));
    } catch (error) {
      setSaveError(getApiError(error));
    } finally {
      setSaving(false);
    }
  }

  const choices = () => plans.map(({ studyPlanId, status }) => ({ studyPlanId, status }));

  const changeStatus = (studyPlanId: string, status: StudyPlanStatus) =>
    save(choices().map((plan) => (plan.studyPlanId === studyPlanId ? { ...plan, status } : plan)));

  const remove = (studyPlanId: string) =>
    save(choices().filter((plan) => plan.studyPlanId !== studyPlanId));

  async function add() {
    if (!draft?.studyPlanId) return;
    await save([...choices(), { studyPlanId: draft.studyPlanId, status: 'ACTIVE' }]);
  }

  const pick = (level: keyof Draft, value: string) => {
    if (!draft) return;
    const order: (keyof Draft)[] = ['universityId', 'facultyId', 'careerId', 'studyPlanId'];
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
          Tus planes de estudio son privados: no aparecen en tu perfil público.
        </p>
      </div>

      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no declaraste ningún plan.</p>
      ) : (
        <ul className="grid gap-3">
          {plans.map((plan) => (
            <li
              className="grid gap-3 rounded-xl border-[1.5px] border-border bg-card p-4 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-end"
              key={plan.studyPlanId}
            >
              <div>
                <p className="font-extrabold">
                  {plan.career.name} · {plan.studyPlan.name}
                </p>
                <p className="text-muted-foreground">
                  {plan.faculty.shortName} ({plan.university.shortName})
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor={`plan-status-${plan.studyPlanId}`}>Estado</FieldLabel>
                <select
                  className={controlClassName}
                  disabled={saving}
                  id={`plan-status-${plan.studyPlanId}`}
                  onChange={(event) =>
                    changeStatus(plan.studyPlanId, event.target.value as StudyPlanStatus)
                  }
                  value={plan.status}
                >
                  {Object.entries(STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Button
                aria-label={`Quitar ${plan.career.name} · ${plan.studyPlan.name}`}
                disabled={saving}
                onClick={() => remove(plan.studyPlanId)}
                variant="outline"
              >
                Quitar
              </Button>
            </li>
          ))}
        </ul>
      )}

      {draft ? (
        <div className="grid gap-3 rounded-xl border-[1.5px] border-dashed border-border p-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="plan-university">Universidad</FieldLabel>
            <select
              className={controlClassName}
              id="plan-university"
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
            <FieldLabel htmlFor="plan-faculty">Facultad</FieldLabel>
            <select
              className={controlClassName}
              disabled={options.faculties.length === 0}
              id="plan-faculty"
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
            <FieldLabel htmlFor="plan-career">Carrera</FieldLabel>
            <select
              className={controlClassName}
              disabled={options.careers.length === 0}
              id="plan-career"
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
          <Field>
            <FieldLabel htmlFor="plan-plan">Plan</FieldLabel>
            <select
              className={controlClassName}
              disabled={options.plans.length === 0}
              id="plan-plan"
              onChange={(event) => pick('studyPlanId', event.target.value)}
              value={draft.studyPlanId}
            >
              <option value="">Elegí un plan</option>
              {options.plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Button
              disabled={!draft.studyPlanId || saving || plans.length >= MAX_PLANS}
              onClick={add}
            >
              Agregar plan
            </Button>
            {plans.length >= MAX_PLANS ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Llegaste al máximo de {MAX_PLANS} planes. Quitá uno para agregar otro.
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
