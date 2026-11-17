'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Clock } from 'lucide-react';
import { z } from 'zod';

import { ChoiceLabel } from '@/components/community/CommunityFormPrimitives';
import { ChosenTypeAndSubject } from '@/components/experiences/forms/ChosenTypeAndSubject';
import { ExperiencePreview } from '@/components/experiences/forms/ExperiencePreview';
import { FormField, FormSection } from '@/components/experiences/forms/FormSection';
import { NumberStepper } from '@/components/experiences/forms/NumberStepper';
import {
  clearExperienceDraft,
  draftValuesFor,
  readExperienceDraft,
  saveExperienceDraft,
} from '@/components/experiences/forms/experience-draft';
import { PublicationSection } from '@/components/experiences/forms/PublicationSection';
import { TopicsInput } from '@/components/experiences/forms/TopicsInput';
import {
  estimateStudyHours,
  formatCompactMinutes,
  formatStudyEstimate,
  LEAD_TIME_UNITS,
  type LeadTimeUnit,
  leadTimeDays,
  splitDuration,
  splitLeadTime,
} from '@/components/experiences/format';
import { avatarSrc } from '@/components/layout/account';
import { PriorReviewNotice } from '@/components/moderation/PriorReviewNotice';
import { RestrictionNotice } from '@/components/moderation/RestrictionNotice';
import { Button, Input } from '@/components/ui/shadcn';
import { cn } from '@/components/ui/shadcn/utils';
import { useAccountRestriction } from '@/hooks/useAccountRestriction';
import { api } from '@/lib/api';
import { getApiError, getData } from '@/lib/apiHelpers';
import { loginHrefForReturnPath } from '@/lib/auth-return-path';
import { getCommunityManagement } from '@/lib/community-management-client';
import { examFormatLabels, examOutcomeLabels, examPeriodLabels } from '@/lib/presentation-labels';
import type { PriorReviewReason, PublicationOutcome } from '@/lib/publication-outcome';
import { resubmit } from '@/lib/submissions-client';
import { useAuthStore } from '@/stores/authStore';
import type {
  ExamExperience,
  ExamFormat,
  ExamOutcome,
  ExamSession,
  SubjectHub,
} from '@/types/subject';

const MIN_YEAR = 1900;
const MAX_YEAR = new Date().getUTCFullYear() + 1;
const MAX_COMMENT_LENGTH = 4000;
const MANUAL_EXAMINER = 'manual';

const SESSIONS = [
  'DICIEMBRE',
  'JULIO',
  'MARZO',
  'FEBRERO_MARZO',
  'ESPECIAL',
  'NO_RECUERDO',
] as const satisfies readonly ExamSession[];
const FORMATS = ['ESCRITO', 'ORAL', 'MIXTO'] as const satisfies readonly ExamFormat[];
const OUTCOMES = [
  'APROBADO',
  'DESAPROBADO',
  'PREFIERO_NO_DECIR',
] as const satisfies readonly ExamOutcome[];
const SCALE = ['1', '2', '3', '4', '5'] as const;
const LEAD_UNITS = Object.keys(LEAD_TIME_UNITS) as [LeadTimeUnit, ...LeadTimeUnit[]];
const IDEAS = ['¿Qué te preguntaron?', '¿Cómo corrigieron?', '¿Qué te hubiera servido saber?'];

const gradeRangeMessage = 'La nota va de 0 a 10.';
const boardSizeMessage = 'Entre 1 y 10 profesores.';

const wholeNumber = (raw: string) => (/^\d+$/.test(raw.trim()) ? Number(raw.trim()) : null);

/** Exam minutes from the hours and minutes fields; `null` when both are empty. */
function durationFrom(hours: string, minutes: string): number | null | 'invalid' {
  if (!hours.trim() && !minutes.trim()) return null;
  const h = hours.trim() ? wholeNumber(hours) : 0;
  const m = minutes.trim() ? wholeNumber(minutes) : 0;
  if (h === null || m === null) return 'invalid';
  const total = h * 60 + m;
  return total >= 10 && total <= 480 ? total : 'invalid';
}

/** Lead days from the amount and its unit; `null` when the amount is empty. */
function leadDaysFrom(amount: string, unit: LeadTimeUnit): number | null | 'invalid' {
  if (!amount.trim()) return null;
  const value = wholeNumber(amount);
  if (value === null) return 'invalid';
  const days = leadTimeDays(value, unit);
  return days >= 1 && days <= 365 ? days : 'invalid';
}

const outcomeRequiresGrade = (outcome: unknown) =>
  outcome === 'APROBADO' || outcome === 'DESAPROBADO';

const examSchema = z
  .object({
    boardSize: z
      .number()
      .int(boardSizeMessage)
      .min(1, boardSizeMessage)
      .max(10, boardSizeMessage)
      .nullable(),
    comment: z
      .string()
      .trim()
      .min(30, 'Contá al menos 30 caracteres para que la experiencia sea útil.')
      .max(MAX_COMMENT_LENGTH, 'El relato no puede superar los 4.000 caracteres.'),
    difficultyPractice: z.enum(SCALE).or(z.literal('')),
    difficultyTheory: z.enum(SCALE).or(z.literal('')),
    durationHours: z.string(),
    durationMinutes: z.string(),
    examinerChoice: z.string(),
    examinerName: z.string().trim(),
    format: z.enum(FORMATS, { error: 'Elegí el formato del final.' }),
    grade: z
      .number()
      .int(gradeRangeMessage)
      .min(0, gradeRangeMessage)
      .max(10, gradeRangeMessage)
      .nullable(),
    isAnonymous: z.boolean(),
    outcome: z.enum(OUTCOMES, { error: 'Elegí cómo te fue.' }),
    prepDailyMinutes: z.number().int().min(30).max(960).nullable(),
    prepLeadAmount: z.string(),
    prepLeadUnit: z.enum(LEAD_UNITS),
    session: z.enum(SESSIONS, { error: 'Elegí el período de final.' }),
    topics: z.array(z.string()).max(10),
    year: z.coerce
      .number()
      .int('El año debe ser un número entero.')
      .min(MIN_YEAR, `Ingresá un año desde ${MIN_YEAR}.`)
      .max(MAX_YEAR, `Ingresá un año hasta ${MAX_YEAR}.`),
  })
  .superRefine(
    (values, context) => {
      if (
        outcomeRequiresGrade(values.outcome) &&
        (values.grade === null || values.grade === undefined)
      ) {
        context.addIssue({ code: 'custom', message: 'Indicá tu nota de 0 a 10.', path: ['grade'] });
      }
      if (values.examinerChoice === MANUAL_EXAMINER) {
        const name = (values.examinerName ?? '').trim();
        if (name.length < 2 || name.length > 150) {
          context.addIssue({
            code: 'custom',
            message: 'Escribí un nombre de 2 a 150 caracteres.',
            path: ['examinerName'],
          });
        }
      }
      if (durationFrom(values.durationHours ?? '', values.durationMinutes ?? '') === 'invalid') {
        context.addIssue({
          code: 'custom',
          message: 'El tiempo va de 10 minutos a 8 horas.',
          path: ['durationHours'],
        });
      }
      const unit = LEAD_UNITS.includes(values.prepLeadUnit) ? values.prepLeadUnit : 'dias';
      if (leadDaysFrom(values.prepLeadAmount ?? '', unit) === 'invalid') {
        context.addIssue({
          code: 'custom',
          message: 'Indicá entre 1 día y 12 meses antes.',
          path: ['prepLeadAmount'],
        });
      }
    },
    // The grade, tiempo and preparación messages show alongside the other missing fields.
    { when: () => true },
  );

type ExamFormInput = z.input<typeof examSchema>;
type ExamFormValues = z.output<typeof examSchema>;

/** The stored final as the owner's management view returns it. */
export type StoredExam = ExamExperience & {
  boardSize?: number | null;
  durationMinutes?: number | null;
  prepDailyMinutes?: number | null;
  prepLeadDays?: number | null;
  topics?: string[];
};

type EntryModeration = { status: string; reason: string | null };

type LoadedEditState =
  | { id: string; status: 'not-found' }
  | { id: string; status: 'forbidden' }
  | { exam: StoredExam; id: string; moderation: EntryModeration; status: 'ready' };

type EditState = { status: 'idle' } | { status: 'loading' } | LoadedEditState;

/** An empty final; the draft kept across «Cambiar» starts from these. */
export const EMPTY_EXAM_VALUES: ExamFormInput = {
  boardSize: null,
  comment: '',
  difficultyPractice: '',
  difficultyTheory: '',
  durationHours: '',
  durationMinutes: '',
  examinerChoice: '',
  examinerName: '',
  format: undefined as unknown as ExamFormInput['format'],
  grade: null,
  isAnonymous: false,
  outcome: undefined as unknown as ExamFormInput['outcome'],
  prepDailyMinutes: null,
  prepLeadAmount: '',
  prepLeadUnit: 'dias',
  session: undefined as unknown as ExamFormInput['session'],
  topics: [],
  year: undefined,
};

const scaleValue = (value: number | null | undefined) =>
  SCALE.find((option) => Number(option) === value) ?? '';

/**
 * Form values for an existing final. Its legacy date, franja and verbal
 * dificultad have no field, so the form never sends them and they are kept.
 */
export function toExamFormValues(exam: StoredExam): ExamFormInput {
  const duration = exam.durationMinutes ? splitDuration(exam.durationMinutes) : null;
  const lead = exam.prepLeadDays ? splitLeadTime(exam.prepLeadDays) : null;
  return {
    ...EMPTY_EXAM_VALUES,
    boardSize: exam.boardSize ?? null,
    comment: exam.comment ?? '',
    difficultyPractice: scaleValue(exam.difficultyPractice),
    difficultyTheory: scaleValue(exam.difficultyTheory),
    durationHours: duration ? String(duration.hours) : '',
    durationMinutes: duration ? String(duration.minutes) : '',
    examinerChoice: exam.professorId ? exam.professorId : exam.examinerName ? MANUAL_EXAMINER : '',
    examinerName: exam.professorId ? '' : (exam.examinerName ?? ''),
    format: FORMATS.find((value) => value === exam.format) ?? EMPTY_EXAM_VALUES.format,
    grade: exam.grade ?? null,
    isAnonymous: exam.isAnonymous ?? false,
    outcome: OUTCOMES.find((value) => value === exam.outcome) ?? EMPTY_EXAM_VALUES.outcome,
    prepDailyMinutes: exam.prepDailyMinutes ?? null,
    prepLeadAmount: lead ? String(lead.amount) : '',
    prepLeadUnit: lead?.unit ?? 'dias',
    session: SESSIONS.find((value) => value === exam.session) ?? EMPTY_EXAM_VALUES.session,
    topics: exam.topics ?? [],
    year: exam.year ? String(exam.year) : undefined,
  };
}

/** Required facts an older final never declared, in form order. */
function missingFacts(exam: StoredExam): string[] {
  return [
    exam.year ? null : 'el año',
    exam.session ? null : 'el período',
    exam.format ? null : 'el formato',
    exam.outcome ? null : 'el resultado',
    outcomeRequiresGrade(exam.outcome) && (exam.grade === null || exam.grade === undefined)
      ? 'la nota'
      : null,
    exam.comment ? null : 'el relato',
  ].filter((fact): fact is string => fact !== null);
}

function joinFacts(facts: string[]) {
  return facts.length <= 1
    ? facts.join('')
    : `${facts.slice(0, -1).join(', ')} y ${facts[facts.length - 1]}`;
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-[44rem] place-items-center px-5 py-16">
      {children}
    </div>
  );
}

const selectClass =
  'min-h-11 w-full rounded-[10px] border-[1.5px] border-foreground bg-card px-3 font-sans text-sm font-bold text-card-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring';
const smallNumberClass =
  'h-10 w-16 rounded-[10px] border-[1.5px] border-foreground bg-card text-center font-sans text-base font-extrabold text-card-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring aria-[invalid=true]:border-destructive';

/** One 1–5 scale (teoría or práctica), «fácil» to «difícil», clearable on its own. */
function DifficultyScale({
  label,
  name,
  onClear,
  register,
  selected,
}: {
  label: string;
  name: 'difficultyTheory' | 'difficultyPractice';
  onClear: () => void;
  register: ReturnType<typeof useForm<ExamFormInput, unknown, ExamFormValues>>['register'];
  selected: string | undefined;
}) {
  const labelId = `${name}-label`;
  return (
    <fieldset aria-labelledby={labelId} className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="w-20 font-sans text-sm font-extrabold text-card-foreground" id={labelId}>
        {label}
      </span>
      <span aria-hidden="true" className="font-sans text-xs font-bold text-muted-foreground">
        fácil
      </span>
      <span className="flex gap-1.5">
        {SCALE.map((option) => (
          <label className="cursor-pointer" key={option}>
            <input
              aria-label={option}
              className="sr-only"
              type="radio"
              value={option}
              {...register(name)}
            />
            <ChoiceLabel checked={selected === option} className="min-w-10 px-2">
              {option}
            </ChoiceLabel>
          </label>
        ))}
      </span>
      <span aria-hidden="true" className="font-sans text-xs font-bold text-muted-foreground">
        difícil
      </span>
      {selected ? (
        <button
          className="min-h-11 font-sans text-xs font-bold text-link underline underline-offset-4"
          onClick={onClear}
          type="button"
        >
          {`No indicar la ${label.toLowerCase()}`}
        </button>
      ) : null}
    </fieldset>
  );
}

/**
 * The experiencia de final form (openspec academic-community/experiences
 * «Experiencia forms»): seven numbered sections, the «Así se va a ver» preview
 * from `lg` up, and the sticky publish bar below it. It never asks for nor
 * sends the exact date, the franja or the verbal dificultad, so editing an
 * older final keeps them. `?editar=<id>` reuses the page with «Guardar cambios».
 */
export function ExamForm() {
  const { blocked: restricted } = useAccountRestriction();
  const params = useParams<{ codigo: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = params.codigo;
  const rawSearch = searchParams.toString();
  const editId = searchParams.get('editar');
  const fromChooser = searchParams.get('desde') === 'formulario';
  const user = useAuthStore((state) => state.user);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const [loadedEditState, setLoadedEditState] = useState<LoadedEditState | null>(null);
  const [subject, setSubject] = useState<SubjectHub | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingReview, setPendingReview] = useState<PriorReviewReason | 'RESUBMITTED' | null>(
    null,
  );

  const {
    control,
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<ExamFormInput, unknown, ExamFormValues>({
    defaultValues: EMPTY_EXAM_VALUES,
    mode: 'onBlur',
    resolver: zodResolver(examSchema),
  });
  const watched = useWatch({ control });

  const professors = useMemo(
    () => subject?.professors.map(({ professor }) => professor) ?? [],
    [subject],
  );
  const returnPath = `/materias/${code}/final${rawSearch ? `?${rawSearch}` : ''}`;
  const editState: EditState = !editId
    ? { status: 'idle' }
    : loadedEditState?.id === editId
      ? loadedEditState
      : { status: 'loading' };

  // Back from «Cambiar»: continue what was typed, keeping the fields this type has.
  useEffect(() => {
    if (editId || !fromChooser) return;
    const draft = readExperienceDraft();
    if (!draft) return;
    reset({
      ...EMPTY_EXAM_VALUES,
      ...draftValuesFor(draft, {
        empty: EMPTY_EXAM_VALUES,
        subjectBound: ['examinerChoice', 'examinerName'],
        subjectCode: code,
        type: 'final',
      }),
    });
  }, [code, editId, fromChooser, reset]);

  // A professor restored before the catalog loaded needs its option to show.
  useEffect(() => {
    const chosen = getValues('examinerChoice');
    if (chosen && professors.some((professor) => professor.id === chosen)) {
      setValue('examinerChoice', chosen);
    }
  }, [getValues, professors, setValue]);

  const saveDraft = () =>
    saveExperienceDraft({
      subjectCode: code,
      subjectName: subject?.name ?? null,
      type: 'final',
      values: getValues(),
    });

  useEffect(() => {
    let isCurrentRequest = true;

    void api
      .get(`/subjects/${code}`)
      .then((response) => {
        if (isCurrentRequest) setSubject(getData<SubjectHub>(response));
      })
      .catch(() => {
        if (isCurrentRequest) setSubject(null);
      });

    if (!editId) {
      return () => {
        isCurrentRequest = false;
      };
    }

    // The owner's private view loads the entry in any publication status, so an
    // experiencia rejected in revisión previa can be corrected and resubmitted.
    void getCommunityManagement('exam-experience', editId)
      .then((management) => {
        if (!isCurrentRequest) return;
        const exam = management.entry as unknown as StoredExam;
        reset(toExamFormValues(exam));
        setLoadedEditState({
          exam,
          id: editId,
          moderation: management.moderation,
          status: 'ready',
        });
      })
      .catch((error: unknown) => {
        if (!isCurrentRequest) return;
        const status = (error as { response?: { status?: number } }).response?.status;
        setLoadedEditState({ id: editId, status: status === 403 ? 'forbidden' : 'not-found' });
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [code, editId, reset, user?.id]);

  const submit = async (values: ExamFormValues) => {
    setServerError(null);
    const manual = values.examinerChoice === MANUAL_EXAMINER;
    const duration = durationFrom(values.durationHours, values.durationMinutes);
    const leadDays = leadDaysFrom(values.prepLeadAmount, values.prepLeadUnit);
    const payload = {
      boardSize: values.boardSize,
      comment: values.comment.trim(),
      difficultyPractice: values.difficultyPractice ? Number(values.difficultyPractice) : null,
      difficultyTheory: values.difficultyTheory ? Number(values.difficultyTheory) : null,
      durationMinutes: typeof duration === 'number' ? duration : null,
      examinerName: manual ? values.examinerName.trim() : null,
      format: values.format,
      grade: outcomeRequiresGrade(values.outcome) ? values.grade : null,
      isAnonymous: values.isAnonymous,
      outcome: values.outcome,
      prepDailyMinutes: values.prepDailyMinutes,
      prepLeadDays: typeof leadDays === 'number' ? leadDays : null,
      professorId: !manual && values.examinerChoice ? values.examinerChoice : null,
      session: values.session,
      topics: values.topics,
      year: values.year,
    };

    try {
      if (editId) {
        await api.put(`/subjects/exams/${editId}`, payload);
        if (editState.status === 'ready' && editState.moderation.status === 'REJECTED') {
          await resubmit('EXAM_EXPERIENCE', editId);
          setPendingReview('RESUBMITTED');
          return;
        }
        router.push(`/finales/${encodeURIComponent(editId)}`);
        return;
      }

      const created = getData<Partial<PublicationOutcome> & { exam?: { id?: string } }>(
        await api.post(`/subjects/${code}/exams`, payload),
      );
      clearExperienceDraft();
      if (created.outcome === 'PENDING_REVIEW' && created.reason) {
        setPendingReview(created.reason);
        return;
      }
      const id = created.exam?.id;
      router.push(id ? `/finales/${encodeURIComponent(id)}?publicada=1` : `/materias/${code}`);
    } catch (error) {
      setServerError(getApiError(error));
    }
  };

  if (isAuthLoading) {
    return (
      <CenteredMessage>
        <p aria-live="polite" className="font-sans text-sm text-muted-foreground">
          Cargando tu sesión…
        </p>
      </CenteredMessage>
    );
  }

  if (!user) {
    return (
      <CenteredMessage>
        <section className="grid max-w-lg gap-5 border border-border bg-card p-7 text-center">
          <h1 className="font-sans text-3xl font-bold text-foreground">
            Iniciá sesión para compartir un final
          </h1>
          <p className="font-sans leading-relaxed text-muted-foreground">
            Publicar una experiencia requiere una cuenta, pero no una verificación adicional.
          </p>
          <Button asChild className="justify-self-center">
            <Link href={loginHrefForReturnPath(returnPath)}>Iniciar sesión</Link>
          </Button>
        </section>
      </CenteredMessage>
    );
  }

  if (editState.status === 'loading') {
    return (
      <CenteredMessage>
        <p aria-live="polite" className="font-sans text-sm text-muted-foreground">
          Cargando la experiencia…
        </p>
      </CenteredMessage>
    );
  }

  if (editState.status === 'not-found' || editState.status === 'forbidden') {
    return (
      <CenteredMessage>
        <section className="grid max-w-lg gap-5 border border-border bg-card p-7 text-center">
          <h1 className="font-sans text-3xl font-bold text-foreground">Edición no disponible</h1>
          <p className="font-sans leading-relaxed text-muted-foreground">
            {editState.status === 'forbidden'
              ? 'No podés editar una experiencia de otra persona.'
              : 'No encontramos la experiencia que querés editar.'}
          </p>
          <Button asChild className="justify-self-center" variant="outline">
            <Link href={`/materias/${code}`}>Volver a la materia</Link>
          </Button>
        </section>
      </CenteredMessage>
    );
  }

  if (pendingReview) {
    return <PriorReviewNotice backHref={`/materias/${code}`} reason={pendingReview} />;
  }

  const isEditing = editState.status === 'ready';
  const isRejected = isEditing && editState.moderation.status === 'REJECTED';
  const missing = isEditing ? missingFacts(editState.exam) : [];
  const outcome = watched.outcome;
  const asksGrade = outcome !== 'PREFIERO_NO_DECIR';
  const comment = typeof watched.comment === 'string' ? watched.comment : '';
  const outcomeRegistration = register('outcome');
  const examinerChoice = watched.examinerChoice ?? '';
  const year = Number(watched.year);
  const duration = durationFrom(watched.durationHours ?? '', watched.durationMinutes ?? '');
  const leadDays = leadDaysFrom(watched.prepLeadAmount ?? '', watched.prepLeadUnit ?? 'dias');
  const previewLeadDays = typeof leadDays === 'number' ? leadDays : null;
  const studyHours = estimateStudyHours(previewLeadDays, watched.prepDailyMinutes);
  const previewExaminer =
    examinerChoice === MANUAL_EXAMINER
      ? watched.examinerName?.trim()
      : professors.find((professor) => professor.id === examinerChoice)?.name;

  return (
    <div className="mx-auto w-full max-w-[1180px] px-3 py-8 sm:px-6 sm:py-10">
      <Link
        className="inline-flex min-h-11 items-center gap-2 font-sans text-sm font-bold text-primary underline decoration-primary/35 underline-offset-4"
        href={`/materias/${code}`}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a la materia
      </Link>

      <header className="mt-5">
        <p className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-primary">
          Tu experiencia
        </p>
        <h1 className="mt-3 font-sans text-5xl font-extrabold leading-[0.92] tracking-[-0.05em] text-foreground sm:text-6xl">
          {isEditing ? 'Actualizá tu experiencia.' : 'Contá cómo te fue.'}
        </h1>
        <p className="mt-4 max-w-[60ch] font-sans text-base font-medium leading-relaxed text-secondary-foreground">
          Te lleva tres minutos y le ahorra un cuatrimestre de dudas a alguien.
        </p>
      </header>

      {isRejected ? (
        <aside
          className="mt-6 rounded-xl border-[1.5px] border-destructive bg-destructive/10 p-4 font-sans text-sm leading-relaxed"
          role="status"
        >
          <p className="font-bold">
            Moderación no publicó esta experiencia. Corregila y reenviala.
          </p>
          {editState.moderation.reason ? (
            <p className="mt-1">{editState.moderation.reason}</p>
          ) : null}
        </aside>
      ) : null}

      {missing.length > 0 ? (
        <aside className="mt-6 rounded-xl border-[1.5px] border-primary bg-secondary p-4 font-sans text-sm leading-relaxed text-secondary-foreground">
          <p>
            Esta experiencia usa datos heredados. Completá los campos obligatorios antes de
            guardarla; no completamos información académica por vos.
          </p>
          <p className="mt-1 font-bold text-card-foreground">{`Falta: ${joinFacts(missing)}.`}</p>
        </aside>
      ) : null}

      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <form
          aria-label="Experiencia de final"
          className="grid min-w-0 gap-3.5"
          noValidate
          onSubmit={handleSubmit((values) => submit(values))}
        >
          <RestrictionNotice />
          <fieldset aria-label="Datos de la experiencia" className="contents" disabled={restricted}>
            <FormSection number={1} title="¿Qué querés contar?">
              <ChosenTypeAndSubject
                canChange={!isEditing}
                kind="exam"
                onBeforeChange={saveDraft}
                subjectCode={code}
                subjectName={subject?.name ?? null}
              />
            </FormSection>

            <FormSection number={2} title="La mesa">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  error={errors.session?.message}
                  htmlFor="session"
                  id="session"
                  label="Período"
                  requirement="required"
                >
                  <select
                    aria-describedby={errors.session ? 'session-error' : undefined}
                    aria-invalid={Boolean(errors.session)}
                    className={selectClass}
                    id="session"
                    {...register('session')}
                  >
                    <option value="">Elegí el período</option>
                    {SESSIONS.map((session) => (
                      <option key={session} value={session}>
                        {examPeriodLabels[session]}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  error={errors.year?.message}
                  htmlFor="year"
                  id="year"
                  label="Año"
                  requirement="required"
                >
                  <Input
                    aria-describedby={errors.year ? 'year-error' : undefined}
                    aria-invalid={Boolean(errors.year)}
                    id="year"
                    inputMode="numeric"
                    max={MAX_YEAR}
                    min={MIN_YEAR}
                    placeholder="Ej.: 2026"
                    type="number"
                    {...register('year')}
                  />
                </FormField>

                <FormField
                  className="sm:col-span-2"
                  error={errors.format?.message}
                  group
                  id="format"
                  label="Formato"
                  requirement="required"
                >
                  <div className="grid grid-cols-3 gap-2">
                    {FORMATS.map((option) => (
                      <label className="cursor-pointer" key={option}>
                        <input
                          className="sr-only"
                          type="radio"
                          value={option}
                          {...register('format')}
                        />
                        <ChoiceLabel checked={watched.format === option} className="w-full">
                          {examFormatLabels[option]}
                        </ChoiceLabel>
                      </label>
                    ))}
                  </div>
                </FormField>

                <FormField
                  error={errors.boardSize?.message}
                  htmlFor="boardSize"
                  id="boardSize"
                  label="Profesores en la mesa"
                  requirement="optional"
                >
                  <Controller
                    control={control}
                    name="boardSize"
                    render={({ field }) => (
                      <NumberStepper
                        decreaseLabel="Restar un profesor"
                        describedBy={errors.boardSize ? 'boardSize-error' : undefined}
                        id="boardSize"
                        increaseLabel="Sumar un profesor"
                        invalid={Boolean(errors.boardSize)}
                        max={10}
                        min={1}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        suffix="profesores"
                        value={field.value}
                      />
                    )}
                  />
                </FormField>

                <FormField
                  error={errors.durationHours?.message}
                  group
                  help="Si fue oral, cuánto duró tu examen."
                  id="duration"
                  label="Tiempo para resolverlo"
                  requirement="optional"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      aria-invalid={Boolean(errors.durationHours)}
                      aria-label="Horas"
                      className={smallNumberClass}
                      inputMode="numeric"
                      max={8}
                      min={0}
                      type="number"
                      {...register('durationHours')}
                    />
                    <span className="font-sans text-sm font-bold text-muted-foreground">h</span>
                    <input
                      aria-invalid={Boolean(errors.durationHours)}
                      aria-label="Minutos"
                      className={smallNumberClass}
                      inputMode="numeric"
                      max={59}
                      min={0}
                      step={5}
                      type="number"
                      {...register('durationMinutes')}
                    />
                    <span className="font-sans text-sm font-bold text-muted-foreground">min</span>
                  </div>
                </FormField>

                <FormField
                  className="sm:col-span-2"
                  error={errors.examinerName?.message}
                  htmlFor="examinerChoice"
                  id="examinerChoice"
                  label="¿Quién te tomó?"
                  requirement="optional"
                >
                  <select
                    className={selectClass}
                    id="examinerChoice"
                    {...register('examinerChoice')}
                  >
                    <option value="">No lo indico</option>
                    {professors.map((professor) => (
                      <option key={professor.id} value={professor.id}>
                        {professor.name}
                      </option>
                    ))}
                    <option value={MANUAL_EXAMINER}>Otro: escribir el nombre</option>
                  </select>
                  {examinerChoice === MANUAL_EXAMINER ? (
                    <>
                      <label className="sr-only" htmlFor="examinerName">
                        Nombre de quien te tomó
                      </label>
                      <Input
                        aria-describedby={errors.examinerName ? 'examinerChoice-error' : undefined}
                        aria-invalid={Boolean(errors.examinerName)}
                        className="mt-2"
                        id="examinerName"
                        placeholder="Ej.: Ing. Laura Quiroga"
                        {...register('examinerName')}
                      />
                    </>
                  ) : null}
                </FormField>
              </div>
            </FormSection>

            <FormSection number={3} title="Cómo te fue">
              <div className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <FormField
                    error={errors.outcome?.message}
                    group
                    id="outcome"
                    label="Resultado"
                    requirement="required"
                  >
                    <div className="grid gap-2 sm:grid-cols-3">
                      {OUTCOMES.map((option) => (
                        <label className="cursor-pointer" key={option}>
                          <input
                            className="sr-only"
                            type="radio"
                            value={option}
                            {...outcomeRegistration}
                            onChange={(event) => {
                              void outcomeRegistration.onChange(event);
                              if (event.target.value === 'PREFIERO_NO_DECIR') {
                                setValue('grade', null, { shouldValidate: false });
                              }
                            }}
                          />
                          <ChoiceLabel checked={outcome === option} className="w-full">
                            {examOutcomeLabels[option]}
                          </ChoiceLabel>
                        </label>
                      ))}
                    </div>
                  </FormField>

                  {asksGrade ? (
                    <FormField
                      error={errors.grade?.message}
                      htmlFor="grade"
                      id="grade"
                      label="Nota"
                      requirement="required"
                    >
                      <Controller
                        control={control}
                        name="grade"
                        render={({ field }) => (
                          <NumberStepper
                            describedBy={errors.grade ? 'grade-error' : undefined}
                            id="grade"
                            invalid={Boolean(errors.grade)}
                            max={10}
                            min={0}
                            onBlur={field.onBlur}
                            onChange={field.onChange}
                            start={7}
                            suffix="/ 10"
                            value={field.value}
                          />
                        )}
                      />
                    </FormField>
                  ) : null}
                </div>
                <p className="-mt-2 font-sans text-xs font-semibold text-muted-foreground">
                  Si elegís «Prefiero no decir», no se pide la nota.
                </p>

                <FormField
                  group
                  id="difficulty"
                  label="Dificultad del final"
                  requirement="optional"
                >
                  <div className="grid gap-2.5">
                    <DifficultyScale
                      label="Teoría"
                      name="difficultyTheory"
                      onClear={() => setValue('difficultyTheory', '')}
                      register={register}
                      selected={watched.difficultyTheory}
                    />
                    <DifficultyScale
                      label="Práctica"
                      name="difficultyPractice"
                      onClear={() => setValue('difficultyPractice', '')}
                      register={register}
                      selected={watched.difficultyPractice}
                    />
                  </div>
                </FormField>
              </div>
            </FormSection>

            <FormSection
              number={4}
              requirement="optional"
              subtitle="así otros saben qué estudiar"
              title="Temas que tomaron"
            >
              <Controller
                control={control}
                name="topics"
                render={({ field }) => (
                  <TopicsInput
                    id="topics"
                    onChange={field.onChange}
                    subjectCode={code}
                    value={field.value ?? []}
                  />
                )}
              />
            </FormSection>

            <FormSection number={5} requirement="optional" title="Preparación">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  error={errors.prepLeadAmount?.message}
                  htmlFor="prepLeadAmount"
                  id="prepLeadAmount"
                  label="¿Con cuánto tiempo empezaste a estudiar?"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      aria-describedby={errors.prepLeadAmount ? 'prepLeadAmount-error' : undefined}
                      aria-invalid={Boolean(errors.prepLeadAmount)}
                      className={smallNumberClass}
                      id="prepLeadAmount"
                      inputMode="numeric"
                      min={1}
                      type="number"
                      {...register('prepLeadAmount')}
                    />
                    <select
                      aria-label="Unidad de tiempo"
                      className={cn(selectClass, 'w-auto')}
                      {...register('prepLeadUnit')}
                    >
                      {LEAD_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {LEAD_TIME_UNITS[unit].label}
                        </option>
                      ))}
                    </select>
                    <span className="font-sans text-sm font-bold text-muted-foreground">antes</span>
                  </div>
                </FormField>

                <FormField
                  htmlFor="prepDailyMinutes"
                  id="prepDailyMinutes"
                  label="¿Cuánto le dedicabas por día?"
                >
                  <Controller
                    control={control}
                    name="prepDailyMinutes"
                    render={({ field }) => (
                      <NumberStepper
                        clearBelowMin
                        decreaseLabel="Restar media hora"
                        formatValue={formatCompactMinutes}
                        id="prepDailyMinutes"
                        increaseLabel="Sumar media hora"
                        max={960}
                        min={30}
                        onChange={field.onChange}
                        step={30}
                        suffix="por día, en promedio"
                        value={field.value}
                      />
                    )}
                  />
                </FormField>
              </div>
              {studyHours !== null ? (
                <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-success/12 px-3 py-1.5 font-sans text-[0.8125rem] font-bold text-success-ink">
                  <Clock aria-hidden="true" className="size-4" strokeWidth={2.2} />
                  {formatStudyEstimate(studyHours)}
                </p>
              ) : null}
            </FormSection>

            <FormSection number={6} title="Tu experiencia">
              <ul aria-label="Ideas" className="mb-3 flex flex-wrap items-center gap-2">
                <li
                  aria-hidden="true"
                  className="font-sans text-xs font-bold text-muted-foreground"
                >
                  Ideas:
                </li>
                {IDEAS.map((idea) => (
                  <li
                    className="rounded-md border-[1.5px] border-dashed border-border px-2.5 py-1 font-sans text-xs font-bold text-secondary-foreground"
                    key={idea}
                  >
                    {idea}
                  </li>
                ))}
              </ul>
              <FormField
                error={errors.comment?.message}
                help="Sin nombres de compañeros ni datos personales. Criticá la cursada o el examen, no a las personas."
                htmlFor="comment"
                id="comment"
                label="Contá tu experiencia"
                requirement="required"
              >
                <div className="relative">
                  <textarea
                    aria-describedby={cn(
                      'comment-count comment-help',
                      errors.comment && 'comment-error',
                    )}
                    aria-invalid={Boolean(errors.comment)}
                    className="min-h-40 w-full resize-y rounded-xl border-2 border-foreground bg-card px-4 pt-3.5 pb-8 font-sans text-[0.9rem] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring aria-[invalid=true]:border-destructive"
                    id="comment"
                    maxLength={MAX_COMMENT_LENGTH}
                    placeholder="Contá qué te preguntaron, cómo corrigieron y qué le recomendarías a otra persona."
                    {...register('comment')}
                  />
                  <span
                    className="pointer-events-none absolute right-3.5 bottom-3 font-sans text-xs font-bold text-muted-foreground"
                    id="comment-count"
                  >
                    {`${comment.length} / ${MAX_COMMENT_LENGTH}`}
                  </span>
                </div>
              </FormField>
            </FormSection>

            {serverError ? (
              <p
                aria-live="assertive"
                className="rounded-xl border border-destructive bg-destructive/10 p-4 font-sans text-sm font-bold text-destructive-ink"
                role="alert"
              >
                {serverError}
              </p>
            ) : null}

            <PublicationSection
              anonymousField={register('isAnonymous')}
              cancelHref={`/materias/${code}`}
              onCancel={clearExperienceDraft}
              isEditing={isEditing}
              isSubmitting={isSubmitting}
              number={7}
              submitLabel={
                isRejected
                  ? 'Guardar y reenviar'
                  : isEditing
                    ? 'Guardar cambios'
                    : 'Publicar experiencia'
              }
            />
          </fieldset>
        </form>

        <ExperiencePreview
          author={{
            anonymous: Boolean(watched.isAnonymous),
            avatarSrc: avatarSrc(user),
            name: user.displayName || user.username,
          }}
          className="lg:sticky lg:top-6"
          kind="exam"
          subjectName={subject?.name ?? code}
          values={{
            boardSize: watched.boardSize,
            comment,
            difficultyPractice: watched.difficultyPractice
              ? Number(watched.difficultyPractice)
              : null,
            difficultyTheory: watched.difficultyTheory ? Number(watched.difficultyTheory) : null,
            durationMinutes: typeof duration === 'number' ? duration : null,
            examinerName: previewExaminer || null,
            format: watched.format,
            grade: asksGrade ? watched.grade : null,
            outcome,
            prepDailyMinutes: watched.prepDailyMinutes,
            prepLeadDays: previewLeadDays,
            session: watched.session,
            topics: watched.topics?.filter((topic): topic is string => Boolean(topic)) ?? [],
            year: Number.isInteger(year) && year > 0 ? year : null,
          }}
        />
      </div>
    </div>
  );
}
