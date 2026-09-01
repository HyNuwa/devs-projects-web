'use client';

import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, LoaderCircle, Sparkles, Star, X } from 'lucide-react';
import { z } from 'zod';

import { ChoiceLabel } from '@/components/community/CommunityFormPrimitives';
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
} from '@/components/ui/shadcn';
import { loginHrefForReturnPath } from '@/lib/auth-return-path';
import { api } from '@/lib/api';
import { getApiError, getData } from '@/lib/apiHelpers';
import {
  communityDifficultyLabels,
  courseAttemptLabels,
  courseConditionLabels,
  shiftLabels,
} from '@/lib/presentation-labels';
import { useAuthStore } from '@/stores/authStore';
import type {
  CommunityDifficulty,
  CourseAttempt,
  CourseCondition,
  CourseReview,
  CourseReviewResponse,
  Shift,
  SubjectHub,
} from '@/types/subject';

const MIN_ACADEMIC_YEAR = 1900;
const MAX_ACADEMIC_YEAR = new Date().getUTCFullYear() + 1;

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
      .max(4000, 'El comentario no puede superar los 4.000 caracteres.'),
    condition: z.enum(CONDITIONS, { error: 'Elegí el resultado de tu cursada.' }),
    difficulty: z.enum(DIFFICULTIES).or(z.literal('')),
    isAnonymous: z.boolean(),
    professorId: z.string(),
    professorMode: z.enum(['none', 'catalog', 'manual']),
    professorName: z.string().trim(),
    recommendation: z.coerce
      .number()
      .int()
      .min(1, 'Elegí entre una y cinco estrellas.')
      .max(5, 'Elegí entre una y cinco estrellas.'),
    shift: z.enum(SHIFTS).or(z.literal('')),
  })
  .superRefine((values, context) => {
    if (values.professorMode === 'catalog' && !values.professorId) {
      context.addIssue({
        code: 'custom',
        message: 'Elegí un profesor del catálogo o cambiá a nombre manual.',
        path: ['professorId'],
      });
    }

    if (values.professorMode === 'manual') {
      if (values.professorName.length < 2) {
        context.addIssue({
          code: 'custom',
          message: 'El nombre manual debe tener al menos 2 caracteres.',
          path: ['professorName'],
        });
      }
      if (values.professorName.length > 150) {
        context.addIssue({
          code: 'custom',
          message: 'El nombre manual no puede superar 150 caracteres.',
          path: ['professorName'],
        });
      }
    }
  });

type ReviewFormInput = z.input<typeof reviewSchema>;
type ReviewFormValues = z.output<typeof reviewSchema>;

type EditState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'forbidden' }
  | { review: CourseReview; status: 'ready' };

type LoadedEditState =
  | { id: string; status: 'not-found' }
  | { id: string; status: 'forbidden' }
  | { id: string; review: CourseReview; status: 'ready' };

function isProbableDuplicate(error: unknown) {
  return (
    error !== null &&
    typeof error === 'object' &&
    'response' in error &&
    (error as { response?: { status?: number; data?: { code?: string } } }).response?.status ===
      409 &&
    (error as { response?: { data?: { code?: string } } }).response?.data?.code ===
      'PROBABLE_DUPLICATE'
  );
}

function toFormValues(review: CourseReview): Partial<ReviewFormInput> {
  const condition = CONDITIONS.find((value) => value === review.condition);
  const attempt = ATTEMPTS.find((value) => value === review.attempt);
  const difficulty =
    typeof review.difficulty === 'string'
      ? (DIFFICULTIES.find((value) => value === review.difficulty) ?? '')
      : '';
  const professorMode = review.professorId ? 'catalog' : review.professorName ? 'manual' : 'none';

  return {
    academicYear: review.academicYear ?? undefined,
    attempt,
    comment: review.comment ?? '',
    condition,
    difficulty,
    isAnonymous: review.isAnonymous ?? false,
    professorId: review.professorId ?? '',
    professorMode,
    professorName: review.professorName ?? '',
    recommendation: String(review.recommendation),
    shift: SHIFTS.find((value) => value === review.shift) ?? '',
  };
}

function reviewNeedsCompletion(review: CourseReview) {
  return (
    review.academicYear === null ||
    review.academicYear === undefined ||
    !CONDITIONS.includes(review.condition as (typeof CONDITIONS)[number]) ||
    !review.attempt ||
    !review.comment ||
    typeof review.difficulty === 'number'
  );
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 grid w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 gap-5 border border-border bg-card p-6 text-card-foreground shadow-surface outline-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-serif text-2xl font-bold leading-tight">
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

export function ReviewForm() {
  const params = useParams<{ codigo: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = params.codigo;
  const rawSearch = searchParams.toString();
  const editId = searchParams.get('editar');
  const user = useAuthStore((state) => state.user);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const [loadedEditState, setLoadedEditState] = useState<LoadedEditState | null>(null);
  const [professors, setProfessors] = useState<Array<{ id: string; name: string }>>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<ReviewFormValues | null>(null);

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<ReviewFormInput, unknown, ReviewFormValues>({
    defaultValues: {
      academicYear: undefined,
      attempt: undefined,
      comment: '',
      condition: undefined,
      difficulty: '',
      isAnonymous: false,
      professorId: '',
      professorMode: 'none',
      professorName: '',
      recommendation: undefined,
      shift: '',
    },
    mode: 'onBlur',
    resolver: zodResolver(reviewSchema),
  });

  const recommendation = useWatch({ control, name: 'recommendation' });
  const professorMode = useWatch({ control, name: 'professorMode' });
  const shift = useWatch({ control, name: 'shift' });
  const commentValue = useWatch({ control, name: 'comment' });
  const comment = typeof commentValue === 'string' ? commentValue : '';

  const returnPath = useMemo(
    () => `/materias/${code}/resenar${rawSearch ? `?${rawSearch}` : ''}`,
    [code, rawSearch],
  );
  const editState: EditState = !editId
    ? { status: 'idle' }
    : loadedEditState?.id === editId
      ? loadedEditState
      : { status: 'loading' };

  useEffect(() => {
    let isCurrentRequest = true;

    void api
      .get(`/subjects/${code}`)
      .then((response) => {
        if (!isCurrentRequest) return;
        const subject = getData<SubjectHub>(response);
        setProfessors(subject.professors.map(({ professor }) => professor));
      })
      .catch(() => {
        if (isCurrentRequest) setProfessors([]);
      });

    if (!editId) {
      return () => {
        isCurrentRequest = false;
      };
    }

    void api
      .get(`/subjects/${code}/reviews`)
      .then((response) => {
        if (!isCurrentRequest) return;

        const result = getData<CourseReviewResponse>(response);
        const review = result.reviews.find(({ id }) => id === editId);
        if (!review) {
          setLoadedEditState({ id: editId, status: 'not-found' });
          return;
        }

        if (review.user?.id && review.user.id !== user?.id) {
          setLoadedEditState({ id: editId, status: 'forbidden' });
          return;
        }

        reset(toFormValues(review));
        setLoadedEditState({ id: editId, review, status: 'ready' });
      })
      .catch(() => {
        if (isCurrentRequest) setLoadedEditState({ id: editId, status: 'not-found' });
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [code, editId, reset, user?.id]);

  const submit = async (values: ReviewFormValues, confirmedDuplicate = false) => {
    setServerError(null);
    const payload = {
      academicYear: values.academicYear,
      attempt: values.attempt,
      comment: values.comment.trim(),
      condition: values.condition,
      difficulty: values.difficulty || null,
      isAnonymous: values.isAnonymous,
      professorId: values.professorMode === 'catalog' ? values.professorId : null,
      professorName: values.professorMode === 'manual' ? values.professorName.trim() : null,
      recommendation: values.recommendation,
      shift: values.shift || null,
      ...(confirmedDuplicate ? { confirmProbableDuplicate: true } : {}),
    };

    try {
      if (editId) {
        await api.put(`/subjects/reviews/${editId}`, payload);
      } else {
        await api.post(`/subjects/${code}/reviews`, payload);
      }
      router.push(`/materias/${code}`);
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
      <main className="mx-auto grid min-h-[60vh] max-w-[44rem] place-items-center px-5 py-16">
        <p aria-live="polite" className="font-sans text-sm text-muted-foreground">
          Cargando tu sesión…
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto grid min-h-[60vh] max-w-[44rem] place-items-center px-5 py-16">
        <section className="grid max-w-lg gap-5 border border-border bg-card p-7 text-center shadow-surface">
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Iniciá sesión para reseñar
          </h1>
          <p className="font-sans leading-relaxed text-muted-foreground">
            Publicar una reseña requiere una cuenta, pero no una verificación adicional.
          </p>
          <Button asChild className="justify-self-center">
            <Link href={loginHrefForReturnPath(returnPath)}>Iniciar sesión</Link>
          </Button>
        </section>
      </main>
    );
  }

  if (editState.status === 'loading') {
    return (
      <main className="mx-auto grid min-h-[60vh] max-w-[44rem] place-items-center px-5 py-16">
        <p aria-live="polite" className="font-sans text-sm text-muted-foreground">
          Cargando la reseña…
        </p>
      </main>
    );
  }

  if (editState.status === 'not-found' || editState.status === 'forbidden') {
    const message =
      editState.status === 'forbidden'
        ? 'No podés editar una reseña de otra persona.'
        : 'No encontramos la reseña que querés editar.';

    return (
      <main className="mx-auto grid min-h-[60vh] max-w-[44rem] place-items-center px-5 py-16">
        <section className="grid max-w-lg gap-5 border border-border bg-card p-7 text-center shadow-surface">
          <h1 className="font-serif text-3xl font-bold text-foreground">Edición no disponible</h1>
          <p className="font-sans leading-relaxed text-muted-foreground">{message}</p>
          <Button asChild className="justify-self-center" variant="outline">
            <Link href={`/materias/${code}`}>Volver a la materia</Link>
          </Button>
        </section>
      </main>
    );
  }

  const isEditing = editState.status === 'ready';
  const hasLegacyFields = isEditing && reviewNeedsCompletion(editState.review);
  const professorModeRegistration = register('professorMode');

  return (
    <main className="mx-auto max-w-[52rem] px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="inline-flex min-h-11 items-center gap-2 font-sans text-sm font-bold text-primary underline decoration-primary/35 underline-offset-4"
        href={`/materias/${code}`}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a la materia
      </Link>

      <header className="mt-9 border-b border-border pb-8">
        <p className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-primary">
          Reseña de cursada
        </p>
        <h1 className="mt-3 max-w-[14ch] font-serif text-5xl font-bold leading-[0.92] tracking-[-0.035em] text-foreground sm:text-6xl">
          {isEditing ? 'Actualizá tu experiencia.' : 'Contá cómo fue tu cursada.'}
        </h1>
        <p className="mt-5 max-w-[64ch] font-sans leading-relaxed text-muted-foreground">
          Una reseña representa una cursada concreta. Si tuviste otra experiencia, publicala por
          separado para conservar el contexto.
        </p>
      </header>

      {hasLegacyFields ? (
        <aside className="mt-7 border border-primary bg-secondary p-4 font-sans text-sm leading-relaxed text-secondary-foreground">
          Esta reseña usa datos heredados. Completá los campos obligatorios antes de guardarla; no
          completamos información académica por vos.
        </aside>
      ) : null}

      <form
        className="mt-8 grid gap-8"
        noValidate
        onSubmit={handleSubmit((values) => submit(values))}
      >
        <section className="grid gap-6 border border-border bg-card p-5 shadow-surface sm:p-7">
          <div className="flex items-center gap-3">
            <Sparkles aria-hidden="true" className="size-5 text-primary" strokeWidth={1.6} />
            <h2 className="font-serif text-2xl font-bold text-foreground">Tu cursada</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="academicYear">Ciclo lectivo</FieldLabel>
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
              <FieldDescription>No se guarda cuatrimestre.</FieldDescription>
              <FieldError id="academicYear-error">{errors.academicYear?.message}</FieldError>
            </Field>

            <fieldset
              className="grid gap-2"
              aria-describedby={errors.condition ? 'condition-error' : undefined}
            >
              <legend className="font-sans text-sm font-bold text-foreground">Resultado</legend>
              <div className="grid grid-cols-3 gap-2">
                {CONDITIONS.map((condition) => (
                  <label className="cursor-pointer" key={condition}>
                    <input
                      className="sr-only"
                      type="radio"
                      value={condition}
                      {...register('condition')}
                    />
                    <ChoiceLabel>{courseConditionLabels[condition]}</ChoiceLabel>
                  </label>
                ))}
              </div>
              <FieldError id="condition-error">{errors.condition?.message}</FieldError>
            </fieldset>
          </div>

          <fieldset
            className="grid gap-2"
            aria-describedby={errors.attempt ? 'attempt-error' : undefined}
          >
            <legend className="font-sans text-sm font-bold text-foreground">
              Situación de cursada
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {ATTEMPTS.map((attempt) => (
                <label className="cursor-pointer" key={attempt}>
                  <input
                    className="sr-only"
                    type="radio"
                    value={attempt}
                    {...register('attempt')}
                  />
                  <ChoiceLabel>{courseAttemptLabels[attempt]}</ChoiceLabel>
                </label>
              ))}
            </div>
            <FieldError id="attempt-error">{errors.attempt?.message}</FieldError>
          </fieldset>
        </section>

        <section className="grid gap-6 border border-border bg-card p-5 shadow-surface sm:p-7">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Recomendación y relato
            </h2>
            <p className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">
              Las estrellas son una opinión sobre la cursada; tu relato aporta el contexto.
            </p>
          </div>

          <fieldset
            className="grid gap-3"
            aria-describedby={errors.recommendation ? 'recommendation-error' : undefined}
          >
            <legend className="font-sans text-sm font-bold text-foreground">¿La recomendás?</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {[1, 2, 3, 4, 5].map((star) => (
                <label className="cursor-pointer" key={star}>
                  <input
                    aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
                    className="sr-only"
                    type="radio"
                    value={star}
                    {...register('recommendation')}
                  />
                  <ChoiceLabel checked={Number(recommendation) === star} className="min-w-11 px-2">
                    <Star
                      aria-hidden="true"
                      className={Number(recommendation) >= star ? 'size-6 fill-current' : 'size-6'}
                      strokeWidth={1.7}
                    />
                  </ChoiceLabel>
                </label>
              ))}
            </div>
            <FieldError id="recommendation-error">{errors.recommendation?.message}</FieldError>
          </fieldset>

          <Field>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <FieldLabel htmlFor="comment">Tu experiencia</FieldLabel>
              <span className="font-mono text-xs text-muted-foreground">
                {comment?.length ?? 0}/4.000
              </span>
            </div>
            <textarea
              aria-describedby={errors.comment ? 'comment-error' : undefined}
              aria-invalid={Boolean(errors.comment)}
              className="min-h-44 w-full resize-y border border-input bg-background px-3 py-3 font-sans text-sm leading-relaxed text-foreground outline-none shadow-field placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-[invalid=true]:border-destructive"
              id="comment"
              maxLength={4000}
              placeholder="Contá cómo fue la cursada, cómo se trabajó y qué le recomendarías a otra persona."
              {...register('comment')}
            />
            <FieldDescription>Entre 30 y 4.000 caracteres.</FieldDescription>
            <FieldError id="comment-error">{errors.comment?.message}</FieldError>
          </Field>
        </section>

        <section className="grid gap-6 border border-border bg-card p-5 shadow-surface sm:p-7">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Contexto opcional</h2>
            <p className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">
              Agregá solo datos que recuerdes con seguridad.
            </p>
          </div>

          <Field>
            <FieldLabel>Franja horaria</FieldLabel>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SHIFTS.map((shiftOption) => (
                <label className="cursor-pointer" key={shiftOption}>
                  <input
                    className="sr-only"
                    type="radio"
                    value={shiftOption}
                    {...register('shift')}
                  />
                  <ChoiceLabel checked={shift === shiftOption}>
                    {shiftLabels[shiftOption]}
                  </ChoiceLabel>
                </label>
              ))}
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="difficulty">Dificultad general</FieldLabel>
            <select
              className="min-h-11 w-full border border-input bg-background px-3 font-sans text-sm text-foreground shadow-field outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              id="difficulty"
              {...register('difficulty')}
            >
              <option value="">No la indico</option>
              {DIFFICULTIES.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {communityDifficultyLabels[difficulty]}
                </option>
              ))}
            </select>
          </Field>

          <fieldset
            className="grid gap-3"
            aria-describedby={
              errors.professorId || errors.professorName ? 'professor-error' : undefined
            }
          >
            <legend className="font-sans text-sm font-bold text-foreground">
              Profesor principal
            </legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ['none', 'No lo indico'],
                ['catalog', 'Del catálogo'],
                ['manual', 'Nombre manual'],
              ].map(([mode, label]) => (
                <label className="cursor-pointer" key={mode}>
                  <input
                    className="sr-only"
                    type="radio"
                    value={mode}
                    {...professorModeRegistration}
                    onChange={(event) => {
                      professorModeRegistration.onChange(event);
                      setValue('professorId', '');
                      setValue('professorName', '');
                    }}
                  />
                  <ChoiceLabel checked={professorMode === mode}>{label}</ChoiceLabel>
                </label>
              ))}
            </div>
            {professorMode === 'catalog' ? (
              <>
                <label className="sr-only" htmlFor="professorId">
                  Profesor del catálogo
                </label>
                <select
                  aria-invalid={Boolean(errors.professorId)}
                  className="min-h-11 w-full border border-input bg-background px-3 font-sans text-sm text-foreground shadow-field outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-[invalid=true]:border-destructive"
                  id="professorId"
                  {...register('professorId')}
                >
                  <option value="">Elegí un profesor</option>
                  {professors.map((professor) => (
                    <option key={professor.id} value={professor.id}>
                      {professor.name}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
            {professorMode === 'manual' ? (
              <Input
                aria-invalid={Boolean(errors.professorName)}
                aria-label="Nombre manual del profesor"
                placeholder="Ej.: Ing. Laura Quiroga"
                {...register('professorName')}
              />
            ) : null}
            <FieldError id="professor-error">
              {errors.professorId?.message ?? errors.professorName?.message}
            </FieldError>
          </fieldset>

          <label className="flex cursor-pointer items-start gap-3 border border-border bg-secondary p-4 text-sm text-secondary-foreground">
            <input
              className="mt-1 size-4 accent-[var(--primary)]"
              type="checkbox"
              {...register('isAnonymous')}
            />
            <span>
              <span className="block font-bold text-foreground">Publicar como Anónimo</span>
              <span className="mt-1 block leading-relaxed">
                La reseña no mostrará tu nombre, avatar ni un alias permanente. La cuenta sigue
                siendo responsable de la publicación.
              </span>
            </span>
          </label>
        </section>

        {serverError ? (
          <p
            aria-live="assertive"
            className="border border-destructive bg-destructive/10 p-4 font-sans text-sm font-bold text-destructive"
            role="alert"
          >
            {serverError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <Link
            className="font-sans text-sm font-bold text-muted-foreground underline underline-offset-4"
            href={`/materias/${code}`}
          >
            Cancelar
          </Link>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Check aria-hidden="true" className="size-4" />
            )}
            {isSubmitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Publicar reseña'}
          </Button>
        </div>
      </form>

      <DuplicateConfirmation
        isSubmitting={isSubmitting}
        onConfirm={onConfirmDuplicate}
        onOpenChange={setDuplicateOpen}
        open={duplicateOpen}
      />
    </main>
  );
}
