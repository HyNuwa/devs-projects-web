'use client';

import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, LoaderCircle, Star, X } from 'lucide-react';
import { z } from 'zod';

import { ChoiceLabel } from '@/components/community/CommunityFormPrimitives';
import { ChosenTypeAndSubject } from '@/components/experiences/forms/ChosenTypeAndSubject';
import { ExperiencePreview } from '@/components/experiences/forms/ExperiencePreview';
import { FormField, FormSection } from '@/components/experiences/forms/FormSection';
import { NumberStepper } from '@/components/experiences/forms/NumberStepper';
import {
  clearExperienceDraft,
  draftToContinue,
  draftValuesFor,
  saveExperienceDraft,
} from '@/components/experiences/forms/experience-draft';
import { PublicationSection } from '@/components/experiences/forms/PublicationSection';
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
import {
  communityDifficultyLabels,
  courseAttemptLabels,
  courseConditionLabels,
  shiftLabels,
} from '@/lib/presentation-labels';
import type { PriorReviewReason, PublicationOutcome } from '@/lib/publication-outcome';
import { resubmit } from '@/lib/submissions-client';
import { useAuthStore } from '@/stores/authStore';
import type {
  CommunityDifficulty,
  CourseAttempt,
  CourseCondition,
  CourseReview,
  Shift,
  SubjectHub,
} from '@/types/subject';

const MIN_ACADEMIC_YEAR = 1900;
const MAX_ACADEMIC_YEAR = new Date().getUTCFullYear() + 1;
const MAX_COMMENT_LENGTH = 4000;
const MANUAL_PROFESSOR = 'manual';

const CONDITIONS = ['PROMO', 'REGULAR', 'LIBRE'] as const satisfies readonly CourseCondition[];
const ATTEMPTS = [
  'PRIMERA_CURSADA',
  'PRIMERA_RECURSADA',
  'SEGUNDA_O_MAS_RECURSADAS',
  'PREFIERO_NO_RESPONDER',
] as const satisfies readonly CourseAttempt[];
const SHIFTS = ['MANANA', 'TARDE', 'NOCHE', 'NO_INDICO'] as const satisfies readonly Shift[];
const DIFFICULTIES = [
  'MUY_BAJA',
  'BAJA',
  'MEDIA',
  'ALTA',
  'MUY_ALTA',
] as const satisfies readonly CommunityDifficulty[];
const IDEAS = ['¿Qué te sirvió?', '¿Cómo son los parciales?', '¿Qué harías distinto?'];

const promotionGradeMessage = 'La nota de promoción va de 1 a 10.';

const reviewSchema = z
  .object({
    academicYear: z.coerce
      .number()
      .int('El ciclo lectivo debe ser un año entero.')
      .min(MIN_ACADEMIC_YEAR, `Ingresá un ciclo lectivo desde ${MIN_ACADEMIC_YEAR}.`)
      .max(MAX_ACADEMIC_YEAR, `Ingresá un ciclo lectivo hasta ${MAX_ACADEMIC_YEAR}.`),
    attempt: z.enum(ATTEMPTS, { error: 'Elegí tu situación de cursada.' }),
    comment: z
      .string()
      .trim()
      .min(30, 'Contá al menos 30 caracteres para que la reseña sea útil.')
      .max(MAX_COMMENT_LENGTH, 'El relato no puede superar los 4.000 caracteres.'),
    condition: z.enum(CONDITIONS, { error: 'Elegí el resultado de tu cursada.' }),
    difficulty: z.enum(DIFFICULTIES).or(z.literal('')),
    isAnonymous: z.boolean(),
    professorChoice: z.string(),
    professorName: z.string().trim(),
    promotionGrade: z
      .number()
      .int(promotionGradeMessage)
      .min(1, promotionGradeMessage)
      .max(10, promotionGradeMessage)
      .nullable(),
    recommendation: z.coerce
      .number({ error: 'Elegí entre una y cinco estrellas.' })
      .int()
      .min(1, 'Elegí entre una y cinco estrellas.')
      .max(5, 'Elegí entre una y cinco estrellas.'),
    shift: z.enum(SHIFTS).or(z.literal('')),
  })
  .superRefine((values, context) => {
    if (values.professorChoice !== MANUAL_PROFESSOR) return;
    if (values.professorName.length < 2 || values.professorName.length > 150) {
      context.addIssue({
        code: 'custom',
        message: 'Escribí un nombre de 2 a 150 caracteres.',
        path: ['professorName'],
      });
    }
  });

type ReviewFormInput = z.input<typeof reviewSchema>;
type ReviewFormValues = z.output<typeof reviewSchema>;

/** The stored reseña as the owner's management view returns it. */
type StoredReview = CourseReview & { promotionGrade?: number | null };

type EntryModeration = { status: string; reason: string | null };

type LoadedEditState =
  | { id: string; status: 'not-found' }
  | { id: string; status: 'forbidden' }
  | { id: string; moderation: EntryModeration; review: StoredReview; status: 'ready' };

type EditState = { status: 'idle' } | { status: 'loading' } | LoadedEditState;

/** An empty reseña; the draft kept across «Cambiar» will start from these. */
export const EMPTY_REVIEW_VALUES: ReviewFormInput = {
  academicYear: undefined,
  attempt: undefined as unknown as ReviewFormInput['attempt'],
  comment: '',
  condition: undefined as unknown as ReviewFormInput['condition'],
  difficulty: '',
  isAnonymous: false,
  professorChoice: '',
  professorName: '',
  promotionGrade: null,
  recommendation: undefined,
  shift: '',
};

function isProbableDuplicate(error: unknown) {
  const response = (error as { response?: { status?: number; data?: { code?: string } } })
    ?.response;
  return response?.status === 409 && response.data?.code === 'PROBABLE_DUPLICATE';
}

/** Form values for an existing reseña; legacy facts the form cannot hold are left empty. */
export function toReviewFormValues(review: StoredReview): ReviewFormInput {
  const condition = CONDITIONS.find((value) => value === review.condition);
  return {
    ...EMPTY_REVIEW_VALUES,
    academicYear: review.academicYear ?? undefined,
    attempt: ATTEMPTS.find((value) => value === review.attempt) ?? EMPTY_REVIEW_VALUES.attempt,
    comment: review.comment ?? '',
    condition: condition ?? EMPTY_REVIEW_VALUES.condition,
    difficulty: DIFFICULTIES.find((value) => value === review.difficulty) ?? '',
    isAnonymous: review.isAnonymous ?? false,
    professorChoice: review.professorId
      ? review.professorId
      : review.professorName
        ? MANUAL_PROFESSOR
        : '',
    professorName: review.professorId ? '' : (review.professorName ?? ''),
    promotionGrade: condition === 'PROMO' ? (review.promotionGrade ?? null) : null,
    recommendation: String(review.recommendation),
    shift: SHIFTS.find((value) => value === review.shift) ?? '',
  };
}

/** Required facts an older reseña never declared, in form order. */
function missingFacts(review: StoredReview): string[] {
  return [
    review.academicYear === null || review.academicYear === undefined ? 'el ciclo lectivo' : null,
    CONDITIONS.some((value) => value === review.condition) ? null : 'el resultado de la cursada',
    review.attempt ? null : 'la situación de cursada',
    review.comment ? null : 'el relato',
  ].filter((fact): fact is string => fact !== null);
}

function joinFacts(facts: string[]) {
  return facts.length <= 1
    ? facts.join('')
    : `${facts.slice(0, -1).join(', ')} y ${facts[facts.length - 1]}`;
}

function DuplicateConfirmation({
  isSubmitting,
  onConfirm,
  onOpenChange,
  open,
}: {
  isSubmitting: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/35" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 grid w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 gap-5 border border-border bg-card p-6 text-card-foreground outline-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-sans text-2xl font-bold leading-tight">
                ¿Es otra cursada real?
              </Dialog.Title>
              <Dialog.Description className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">
                Encontramos una reseña reciente con un contexto parecido. Si describe una cursada
                distinta, podés publicarla: ambas quedarán separadas.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button aria-label="Cerrar aviso de duplicado" size="icon" variant="ghost">
                <X aria-hidden="true" className="size-4" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Dialog.Close asChild>
              <Button disabled={isSubmitting} variant="outline">
                Revisar datos
              </Button>
            </Dialog.Close>
            <Button disabled={isSubmitting} onClick={onConfirm}>
              {isSubmitting ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              Publicar como otra cursada
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
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

/**
 * The reseña de cursada form (openspec academic-community/experiences
 * «Experiencia forms»): five numbered sections, the «Así se va a ver» preview
 * from `lg` up, and the sticky publish bar below it. Publishing opens the new
 * reseña with «Publicada»; revisión previa and the duplicate-cursada dialog
 * behave as before. `?editar=<id>` reuses the page with «Guardar cambios».
 */
export function ReviewForm() {
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
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<ReviewFormValues | null>(null);
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
  } = useForm<ReviewFormInput, unknown, ReviewFormValues>({
    defaultValues: EMPTY_REVIEW_VALUES,
    mode: 'onBlur',
    resolver: zodResolver(reviewSchema),
  });
  const watched = useWatch({ control });

  const professors = useMemo(
    () => subject?.professors.map(({ professor }) => professor) ?? [],
    [subject],
  );
  const returnPath = `/materias/${code}/resenar${rawSearch ? `?${rawSearch}` : ''}`;
  const editState: EditState = !editId
    ? { status: 'idle' }
    : loadedEditState?.id === editId
      ? loadedEditState
      : { status: 'loading' };

  // Back from «Cambiar»: continue what was typed, keeping the fields this type has.
  useEffect(() => {
    if (editId) return;
    const draft = draftToContinue({ fromChooser, subjectCode: code, type: 'resenar' });
    if (!draft) return;
    reset({
      ...EMPTY_REVIEW_VALUES,
      ...draftValuesFor(draft, {
        empty: EMPTY_REVIEW_VALUES,
        subjectBound: ['professorChoice', 'professorName'],
        subjectCode: code,
        type: 'resenar',
      }),
    });
  }, [code, editId, fromChooser, reset]);

  // A professor restored before the catalog loaded needs its option to show.
  useEffect(() => {
    const chosen = getValues('professorChoice');
    if (chosen && professors.some((professor) => professor.id === chosen)) {
      setValue('professorChoice', chosen);
    }
  }, [getValues, professors, setValue]);

  const saveDraft = () =>
    saveExperienceDraft({
      subjectCode: code,
      subjectName: subject?.name ?? null,
      type: 'resenar',
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

    // The owner's private view loads the entry in any publication status, so a reseña
    // rejected in revisión previa can be corrected and resubmitted.
    void getCommunityManagement('course-review', editId)
      .then((management) => {
        if (!isCurrentRequest) return;
        const review = management.entry as unknown as StoredReview;
        reset(toReviewFormValues(review));
        setLoadedEditState({
          id: editId,
          moderation: management.moderation,
          review,
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

  const submit = async (values: ReviewFormValues, confirmedDuplicate = false) => {
    setServerError(null);
    const manual = values.professorChoice === MANUAL_PROFESSOR;
    const payload = {
      academicYear: values.academicYear,
      attempt: values.attempt,
      comment: values.comment.trim(),
      condition: values.condition,
      difficulty: values.difficulty || null,
      isAnonymous: values.isAnonymous,
      professorId: !manual && values.professorChoice ? values.professorChoice : null,
      professorName: manual ? values.professorName.trim() : null,
      promotionGrade: values.condition === 'PROMO' ? values.promotionGrade : null,
      recommendation: values.recommendation,
      shift: values.shift || null,
      ...(confirmedDuplicate ? { confirmProbableDuplicate: true } : {}),
    };

    try {
      if (editId) {
        await api.put(`/subjects/reviews/${editId}`, payload);
        if (editState.status === 'ready' && editState.moderation.status === 'REJECTED') {
          await resubmit('COURSE_REVIEW', editId);
          setPendingReview('RESUBMITTED');
          return;
        }
        router.push(`/resenas/${encodeURIComponent(editId)}`);
        return;
      }

      const created = getData<Partial<PublicationOutcome> & { review?: { id?: string } }>(
        await api.post(`/subjects/${code}/reviews`, payload),
      );
      clearExperienceDraft();
      if (created.outcome === 'PENDING_REVIEW' && created.reason) {
        setPendingReview(created.reason);
        return;
      }
      const id = created.review?.id;
      router.push(id ? `/resenas/${encodeURIComponent(id)}?publicada=1` : `/materias/${code}`);
    } catch (error) {
      if (!editId && !confirmedDuplicate && isProbableDuplicate(error)) {
        setPendingValues(values);
        setDuplicateOpen(true);
        return;
      }

      setServerError(getApiError(error));
    }
  };

  const onConfirmDuplicate = () => {
    if (pendingValues) void submit(pendingValues, true);
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
            Iniciá sesión para reseñar
          </h1>
          <p className="font-sans leading-relaxed text-muted-foreground">
            Publicar una reseña requiere una cuenta, pero no una verificación adicional.
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
          Cargando la reseña…
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
              ? 'No podés editar una reseña de otra persona.'
              : 'No encontramos la reseña que querés editar.'}
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
  const missing = isEditing ? missingFacts(editState.review) : [];
  const hasLegacyFields =
    isEditing && (missing.length > 0 || typeof editState.review.difficulty === 'number');
  const condition = watched.condition;
  const comment = typeof watched.comment === 'string' ? watched.comment : '';
  const recommendation = Number(watched.recommendation);
  const professorChoice = watched.professorChoice ?? '';
  const conditionRegistration = register('condition');
  const academicYear = Number(watched.academicYear);
  const previewProfessor =
    professorChoice === MANUAL_PROFESSOR
      ? watched.professorName?.trim()
      : professors.find((professor) => professor.id === professorChoice)?.name;

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
          <p className="font-bold">Moderación no publicó esta reseña. Corregila y reenviala.</p>
          {editState.moderation.reason ? (
            <p className="mt-1">{editState.moderation.reason}</p>
          ) : null}
        </aside>
      ) : null}

      {hasLegacyFields ? (
        <aside className="mt-6 rounded-xl border-[1.5px] border-primary bg-secondary p-4 font-sans text-sm leading-relaxed text-secondary-foreground">
          <p>
            Esta reseña usa datos heredados. Completá los campos obligatorios antes de guardarla; no
            completamos información académica por vos.
          </p>
          {missing.length > 0 ? (
            <p className="mt-1 font-bold text-card-foreground">{`Falta: ${joinFacts(missing)}.`}</p>
          ) : null}
        </aside>
      ) : null}

      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <form
          aria-label="Reseña de cursada"
          className="grid min-w-0 gap-3.5"
          noValidate
          onSubmit={handleSubmit((values) => submit(values))}
        >
          <RestrictionNotice />
          <fieldset aria-label="Datos de la reseña" className="contents" disabled={restricted}>
            <FormSection number={1} title="¿Qué querés contar?">
              <ChosenTypeAndSubject
                canChange={!isEditing}
                kind="review"
                onBeforeChange={saveDraft}
                subjectCode={code}
                subjectName={subject?.name ?? null}
              />
            </FormSection>

            <FormSection number={2} title="Contexto de la cursada">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  error={errors.academicYear?.message}
                  htmlFor="academicYear"
                  id="academicYear"
                  label="Ciclo lectivo"
                  requirement="required"
                >
                  <Input
                    aria-describedby={errors.academicYear ? 'academicYear-error' : undefined}
                    aria-invalid={Boolean(errors.academicYear)}
                    id="academicYear"
                    inputMode="numeric"
                    max={MAX_ACADEMIC_YEAR}
                    min={MIN_ACADEMIC_YEAR}
                    placeholder="Ej.: 2026"
                    type="number"
                    {...register('academicYear')}
                  />
                </FormField>

                <FormField
                  error={errors.professorName?.message}
                  htmlFor="professorChoice"
                  id="professorChoice"
                  label="Profesor/a"
                  requirement="optional"
                >
                  <select
                    className={selectClass}
                    id="professorChoice"
                    {...register('professorChoice')}
                  >
                    <option value="">No lo indico</option>
                    {professors.map((professor) => (
                      <option key={professor.id} value={professor.id}>
                        {professor.name}
                      </option>
                    ))}
                    <option value={MANUAL_PROFESSOR}>Otro: escribir el nombre</option>
                  </select>
                  {professorChoice === MANUAL_PROFESSOR ? (
                    <>
                      <label className="sr-only" htmlFor="professorName">
                        Nombre del profesor/a
                      </label>
                      <Input
                        aria-describedby={
                          errors.professorName ? 'professorChoice-error' : undefined
                        }
                        aria-invalid={Boolean(errors.professorName)}
                        className="mt-2"
                        id="professorName"
                        placeholder="Ej.: Ing. Laura Quiroga"
                        {...register('professorName')}
                      />
                    </>
                  ) : null}
                </FormField>

                <FormField
                  className="sm:col-span-2"
                  group
                  id="shift"
                  label="Franja horaria"
                  requirement="optional"
                >
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {SHIFTS.map((option) => (
                      <label className="cursor-pointer" key={option}>
                        <input
                          className="sr-only"
                          type="radio"
                          value={option}
                          {...register('shift')}
                        />
                        <ChoiceLabel checked={watched.shift === option} className="w-full">
                          {shiftLabels[option]}
                        </ChoiceLabel>
                      </label>
                    ))}
                  </div>
                </FormField>

                <FormField
                  className="sm:col-span-2"
                  error={errors.attempt?.message}
                  group
                  id="attempt"
                  label="Situación de cursada"
                  requirement="required"
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ATTEMPTS.map((option) => (
                      <label className="cursor-pointer" key={option}>
                        <input
                          className="sr-only"
                          type="radio"
                          value={option}
                          {...register('attempt')}
                        />
                        <ChoiceLabel checked={watched.attempt === option} className="w-full">
                          {courseAttemptLabels[option]}
                        </ChoiceLabel>
                      </label>
                    ))}
                  </div>
                </FormField>
              </div>
            </FormSection>

            <FormSection number={3} title="Cómo terminó">
              <div className="grid gap-5">
                <FormField
                  error={errors.condition?.message}
                  group
                  id="condition"
                  label="Resultado de la cursada"
                  requirement="required"
                >
                  <div className="grid grid-cols-3 gap-2">
                    {CONDITIONS.map((option) => (
                      <label className="cursor-pointer" key={option}>
                        <input
                          className="sr-only"
                          type="radio"
                          value={option}
                          {...conditionRegistration}
                          onChange={(event) => {
                            void conditionRegistration.onChange(event);
                            setValue('promotionGrade', null);
                          }}
                        />
                        <ChoiceLabel checked={condition === option} className="w-full">
                          {courseConditionLabels[option]}
                        </ChoiceLabel>
                      </label>
                    ))}
                  </div>
                  {condition === 'PROMO' ? (
                    <div className="mt-3 rounded-xl border-[1.5px] border-foreground bg-secondary px-4 py-3.5">
                      <FormField
                        error={errors.promotionGrade?.message}
                        help="Aparece solo si elegís Promoción."
                        htmlFor="promotionGrade"
                        id="promotionGrade"
                        label="¿Con qué nota promocionaste?"
                        requirement="optional"
                      >
                        <Controller
                          control={control}
                          name="promotionGrade"
                          render={({ field }) => (
                            <NumberStepper
                              describedBy={cn(
                                'promotionGrade-help',
                                errors.promotionGrade && 'promotionGrade-error',
                              )}
                              id="promotionGrade"
                              invalid={Boolean(errors.promotionGrade)}
                              max={10}
                              min={1}
                              onBlur={field.onBlur}
                              onChange={field.onChange}
                              start={7}
                              suffix="/ 10"
                              value={field.value}
                            />
                          )}
                        />
                      </FormField>
                    </div>
                  ) : null}
                </FormField>

                <FormField
                  group
                  id="difficulty"
                  label="¿Qué tan difícil te resultó?"
                  requirement="optional"
                >
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {DIFFICULTIES.map((option) => (
                      <label className="cursor-pointer" key={option}>
                        <input
                          className="sr-only"
                          type="radio"
                          value={option}
                          {...register('difficulty')}
                        />
                        <ChoiceLabel checked={watched.difficulty === option} className="w-full">
                          {communityDifficultyLabels[option]}
                        </ChoiceLabel>
                      </label>
                    ))}
                  </div>
                  {watched.difficulty ? (
                    <button
                      className="mt-2 min-h-11 font-sans text-xs font-bold text-link underline underline-offset-4"
                      onClick={() => setValue('difficulty', '')}
                      type="button"
                    >
                      No indicar la dificultad
                    </button>
                  ) : null}
                </FormField>

                <FormField
                  error={errors.recommendation?.message}
                  group
                  id="recommendation"
                  label="¿La recomendarías cursar así?"
                  requirement="required"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <label className="cursor-pointer" key={star}>
                        <input
                          aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
                          className="peer sr-only"
                          type="radio"
                          value={star}
                          {...register('recommendation')}
                        />
                        <span className="grid size-11 place-items-center rounded-md text-primary peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring">
                          <Star
                            aria-hidden="true"
                            className={cn('size-7', recommendation >= star && 'fill-current')}
                            strokeWidth={1.5}
                          />
                        </span>
                      </label>
                    ))}
                    {recommendation >= 1 ? (
                      <span className="ml-1 font-sans text-sm font-bold text-secondary-foreground">
                        {recommendation} de 5
                      </span>
                    ) : null}
                  </div>
                </FormField>
              </div>
            </FormSection>

            <FormSection number={4} title="Tu experiencia">
              <ul aria-label="Ideas" className="mb-3 flex flex-wrap items-center gap-2">
                <li
                  className="font-sans text-xs font-bold text-muted-foreground"
                  aria-hidden="true"
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
                    placeholder="Contá cómo fue la cursada, cómo se trabajó y qué le recomendarías a otra persona."
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
              number={5}
              submitLabel={
                isRejected
                  ? 'Guardar y reenviar'
                  : isEditing
                    ? 'Guardar cambios'
                    : 'Publicar reseña'
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
          kind="review"
          subjectName={subject?.name ?? code}
          values={{
            academicYear: Number.isInteger(academicYear) && academicYear > 0 ? academicYear : null,
            attempt: watched.attempt,
            comment,
            condition,
            difficulty: watched.difficulty || null,
            professorName: previewProfessor || null,
            promotionGrade: watched.promotionGrade,
            recommendation: recommendation >= 1 ? recommendation : null,
            shift: watched.shift || undefined,
          }}
        />
      </div>

      <DuplicateConfirmation
        isSubmitting={isSubmitting}
        onConfirm={onConfirmDuplicate}
        onOpenChange={setDuplicateOpen}
        open={duplicateOpen}
      />
    </div>
  );
}
