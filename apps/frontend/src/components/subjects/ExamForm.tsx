'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, GraduationCap, LoaderCircle } from 'lucide-react';
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
  examFormatLabels,
  examOutcomeLabels,
  examPeriodLabels,
  shiftLabels,
} from '@/lib/presentation-labels';
import { useAuthStore } from '@/stores/authStore';
import type {
  CommunityDifficulty,
  ExamExperience,
  ExamFormat,
  ExamOutcome,
  ExamSession,
  Shift,
  SubjectHub,
} from '@/types/subject';

const MIN_ACADEMIC_YEAR = 1900;
const MAX_ACADEMIC_YEAR = new Date().getUTCFullYear() + 1;
const SESSIONS = [
  'DICIEMBRE',
  'JULIO',
  'MARZO',
  'FEBRERO_MARZO',
  'ESPECIAL',
  'NO_RECUERDO',
] as const satisfies readonly ExamSession[];
const FORMATS = ['ESCRITO', 'ORAL', 'MIXTO'] as const satisfies readonly ExamFormat[];
const SHIFTS = ['MANANA', 'TARDE', 'NOCHE', 'NO_INDICO'] as const satisfies readonly Shift[];
const DIFFICULTIES = [
  'MUY_BAJA',
  'BAJA',
  'MEDIA',
  'ALTA',
  'MUY_ALTA',
] as const satisfies readonly CommunityDifficulty[];
const OUTCOMES = [
  'APROBADO',
  'DESAPROBADO',
  'PREFIERO_NO_DECIR',
] as const satisfies readonly ExamOutcome[];

const examSchema = z
  .object({
    comment: z
      .string()
      .trim()
      .min(30, 'Contá al menos 30 caracteres para que la experiencia sea útil.')
      .max(4000, 'El comentario no puede superar los 4.000 caracteres.'),
    difficulty: z.enum(DIFFICULTIES).or(z.literal('')),
    examDate: z
      .string()
      .refine(
        (value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value),
        'Ingresá una fecha válida.',
      ),
    examinerName: z.string().trim(),
    format: z.enum(FORMATS, { error: 'Elegí el formato del final.' }),
    grade: z.union([
      z.literal(''),
      z.coerce
        .number()
        .int('La nota debe ser un entero.')
        .min(0, 'La nota debe ser entre 0 y 10.')
        .max(10, 'La nota debe ser entre 0 y 10.'),
    ]),
    isAnonymous: z.boolean(),
    outcome: z.enum(OUTCOMES).or(z.literal('')),
    professorId: z.string(),
    professorMode: z.enum(['none', 'catalog', 'manual']),
    session: z.enum(SESSIONS, { error: 'Elegí el período de final.' }),
    shift: z.enum(SHIFTS).or(z.literal('')),
    year: z.coerce
      .number()
      .int('El año debe ser un número entero.')
      .min(MIN_ACADEMIC_YEAR, `Ingresá un año desde ${MIN_ACADEMIC_YEAR}.`)
      .max(MAX_ACADEMIC_YEAR, `Ingresá un año hasta ${MAX_ACADEMIC_YEAR}.`),
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
      if (values.examinerName.length < 2) {
        context.addIssue({
          code: 'custom',
          message: 'El nombre manual debe tener al menos 2 caracteres.',
          path: ['examinerName'],
        });
      }
      if (values.examinerName.length > 150) {
        context.addIssue({
          code: 'custom',
          message: 'El nombre manual no puede superar 150 caracteres.',
          path: ['examinerName'],
        });
      }
    }

    if (values.grade !== '' && values.outcome !== 'APROBADO' && values.outcome !== 'DESAPROBADO') {
      context.addIssue({
        code: 'custom',
        message: 'Para publicar una nota, indicá si aprobaste o desaprobaste.',
        path: ['grade'],
      });
    }
  });

type ExamFormInput = z.input<typeof examSchema>;
type ExamFormValues = z.output<typeof examSchema>;

type EditState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'forbidden' }
  | { exam: ExamExperience; status: 'ready' };

type LoadedEditState =
  | { id: string; status: 'not-found' }
  | { id: string; status: 'forbidden' }
  | { exam: ExamExperience; id: string; status: 'ready' };

function toFormValues(exam: ExamExperience): Partial<ExamFormInput> {
  const professorMode = exam.professorId ? 'catalog' : exam.examinerName ? 'manual' : 'none';

  return {
    comment: exam.comment ?? '',
    difficulty:
      typeof exam.difficulty === 'string'
        ? (DIFFICULTIES.find((value) => value === exam.difficulty) ?? '')
        : '',
    examDate: exam.examDate?.slice(0, 10) ?? '',
    examinerName: exam.examinerName ?? '',
    format: FORMATS.find((value) => value === exam.format),
    grade: exam.grade === null || exam.grade === undefined ? '' : String(exam.grade),
    isAnonymous: exam.isAnonymous ?? false,
    outcome: OUTCOMES.find((value) => value === exam.outcome) ?? '',
    professorId: exam.professorId ?? '',
    professorMode,
    session: SESSIONS.find((value) => value === exam.session),
    shift: SHIFTS.find((value) => value === exam.shift) ?? '',
    year: String(exam.year),
  };
}

function examNeedsCompletion(exam: ExamExperience) {
  return (
    !exam.year ||
    !exam.session ||
    !exam.format ||
    !exam.comment ||
    typeof exam.difficultyTheory === 'number' ||
    typeof exam.difficultyPractice === 'number'
  );
}

export function ExamForm() {
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

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<ExamFormInput, unknown, ExamFormValues>({
    defaultValues: {
      comment: '',
      difficulty: '',
      examDate: '',
      examinerName: '',
      format: undefined,
      grade: '',
      isAnonymous: false,
      outcome: '',
      professorId: '',
      professorMode: 'none',
      session: undefined,
      shift: '',
      year: undefined,
    },
    mode: 'onBlur',
    resolver: zodResolver(examSchema),
  });

  const commentValue = useWatch({ control, name: 'comment' });
  const comment = typeof commentValue === 'string' ? commentValue : '';
  const format = useWatch({ control, name: 'format' });
  const professorMode = useWatch({ control, name: 'professorMode' });
  const shift = useWatch({ control, name: 'shift' });
  const returnPath = useMemo(
    () => `/materias/${code}/final${rawSearch ? `?${rawSearch}` : ''}`,
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
      .get(`/subjects/${code}/exams`)
      .then((response) => {
        if (!isCurrentRequest) return;

        const exams = getData<ExamExperience[]>(response);
        const exam = exams.find(({ id }) => id === editId);
        if (!exam) {
          setLoadedEditState({ id: editId, status: 'not-found' });
          return;
        }
        if (exam.user?.id && exam.user.id !== user?.id) {
          setLoadedEditState({ id: editId, status: 'forbidden' });
          return;
        }

        reset(toFormValues(exam));
        setLoadedEditState({ exam, id: editId, status: 'ready' });
      })
      .catch(() => {
        if (isCurrentRequest) setLoadedEditState({ id: editId, status: 'not-found' });
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [code, editId, reset, user?.id]);

  const submit = async (values: ExamFormValues) => {
    setServerError(null);
    const payload = {
      comment: values.comment.trim(),
      difficulty: values.difficulty || null,
      examDate: values.examDate || null,
      examinerName: values.professorMode === 'manual' ? values.examinerName.trim() : null,
      format: values.format,
      grade: values.grade === '' ? null : values.grade,
      isAnonymous: values.isAnonymous,
      outcome: values.outcome || null,
      professorId: values.professorMode === 'catalog' ? values.professorId : null,
      session: values.session,
      shift: values.shift || null,
      year: values.year,
    };

    try {
      if (editId) {
        await api.put(`/subjects/exams/${editId}`, payload);
      } else {
        await api.post(`/subjects/${code}/exams`, payload);
      }
      router.push(`/materias/${code}`);
    } catch (error) {
      setServerError(getApiError(error));
    }
  };

  if (isAuthLoading) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-[44rem] place-items-center px-5 py-16">
        <p aria-live="polite" className="font-sans text-sm text-muted-foreground">
          Cargando tu sesión…
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-[44rem] place-items-center px-5 py-16">
        <section className="grid max-w-lg gap-5 border border-border bg-card p-7 text-center shadow-surface">
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Iniciá sesión para compartir un final
          </h1>
          <p className="font-sans leading-relaxed text-muted-foreground">
            Publicar una experiencia requiere una cuenta, pero no una verificación adicional.
          </p>
          <Button asChild className="justify-self-center">
            <Link href={loginHrefForReturnPath(returnPath)}>Iniciar sesión</Link>
          </Button>
        </section>
      </div>
    );
  }

  if (editState.status === 'loading') {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-[44rem] place-items-center px-5 py-16">
        <p aria-live="polite" className="font-sans text-sm text-muted-foreground">
          Cargando la experiencia…
        </p>
      </div>
    );
  }

  if (editState.status === 'not-found' || editState.status === 'forbidden') {
    const message =
      editState.status === 'forbidden'
        ? 'No podés editar una experiencia de otra persona.'
        : 'No encontramos la experiencia que querés editar.';

    return (
      <div className="mx-auto grid min-h-[60vh] max-w-[44rem] place-items-center px-5 py-16">
        <section className="grid max-w-lg gap-5 border border-border bg-card p-7 text-center shadow-surface">
          <h1 className="font-serif text-3xl font-bold text-foreground">Edición no disponible</h1>
          <p className="font-sans leading-relaxed text-muted-foreground">{message}</p>
          <Button asChild className="justify-self-center" variant="outline">
            <Link href={`/materias/${code}`}>Volver a la materia</Link>
          </Button>
        </section>
      </div>
    );
  }

  const isEditing = editState.status === 'ready';
  const hasLegacyFields = isEditing && examNeedsCompletion(editState.exam);
  const professorModeRegistration = register('professorMode');

  return (
    <div className="mx-auto max-w-[52rem] px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="inline-flex min-h-11 items-center gap-2 font-sans text-sm font-bold text-primary underline decoration-primary/35 underline-offset-4"
        href={`/materias/${code}`}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a la materia
      </Link>

      <header className="mt-9 border-b border-border pb-8">
        <p className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-primary">
          Experiencia de final
        </p>
        <h1 className="mt-3 max-w-[15ch] font-serif text-5xl font-bold leading-[0.92] tracking-[-0.035em] text-foreground sm:text-6xl">
          {isEditing ? 'Actualizá tu mesa.' : 'Contá tu intento de final.'}
        </h1>
        <p className="mt-5 max-w-[64ch] font-sans leading-relaxed text-muted-foreground">
          Cada envío representa un intento independiente. Compartí lo que recuerdes sin convertir la
          preparación, los temas o los consejos en campos obligatorios.
        </p>
      </header>

      {hasLegacyFields ? (
        <aside className="mt-7 border border-primary bg-secondary p-4 font-sans text-sm leading-relaxed text-secondary-foreground">
          Esta experiencia contiene datos heredados. Completá los obligatorios y, si recordás una
          dificultad general, elegila explícitamente: las escalas históricas no se convierten solas.
        </aside>
      ) : null}

      <form
        className="mt-8 grid gap-8"
        noValidate
        onSubmit={handleSubmit((values) => submit(values))}
      >
        <section className="grid gap-6 border border-border bg-card p-5 shadow-surface sm:p-7">
          <div className="flex items-center gap-3">
            <GraduationCap aria-hidden="true" className="size-5 text-primary" strokeWidth={1.6} />
            <h2 className="font-serif text-2xl font-bold text-foreground">Datos del final</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="year">Año</FieldLabel>
              <Input
                aria-describedby={errors.year ? 'year-error' : undefined}
                aria-invalid={Boolean(errors.year)}
                id="year"
                inputMode="numeric"
                max={MAX_ACADEMIC_YEAR}
                min={MIN_ACADEMIC_YEAR}
                placeholder="Ej.: 2026"
                type="number"
                {...register('year')}
              />
              <FieldError id="year-error">{errors.year?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="session">Período de final</FieldLabel>
              <select
                aria-invalid={Boolean(errors.session)}
                className="min-h-11 w-full border border-input bg-background px-3 font-sans text-sm text-foreground shadow-field outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-[invalid=true]:border-destructive"
                id="session"
                {...register('session')}
              >
                <option value="">Elegí un período</option>
                {SESSIONS.map((session) => (
                  <option key={session} value={session}>
                    {examPeriodLabels[session]}
                  </option>
                ))}
              </select>
              <FieldError id="session-error">{errors.session?.message}</FieldError>
            </Field>
          </div>

          <fieldset
            className="grid gap-2"
            aria-describedby={errors.format ? 'format-error' : undefined}
          >
            <legend className="font-sans text-sm font-bold text-foreground">Formato</legend>
            <div className="grid grid-cols-3 gap-2">
              {FORMATS.map((formatOption) => (
                <label className="cursor-pointer" key={formatOption}>
                  <input
                    aria-label={examFormatLabels[formatOption]}
                    className="sr-only"
                    type="radio"
                    value={formatOption}
                    {...register('format')}
                  />
                  <ChoiceLabel checked={format === formatOption}>
                    {examFormatLabels[formatOption]}
                  </ChoiceLabel>
                </label>
              ))}
            </div>
            <FieldError id="format-error">{errors.format?.message}</FieldError>
          </fieldset>
        </section>

        <section className="grid gap-6 border border-border bg-card p-5 shadow-surface sm:p-7">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Tu relato</h2>
            <p className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">
              Incluí temas, preparación y consejos dentro de una sola experiencia, solo si ayudan a
              entender el contexto.
            </p>
          </div>
          <Field>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <FieldLabel htmlFor="comment">Experiencia</FieldLabel>
              <span className="font-mono text-xs text-muted-foreground">
                {comment.length}/4.000
              </span>
            </div>
            <textarea
              aria-describedby={errors.comment ? 'comment-error' : undefined}
              aria-invalid={Boolean(errors.comment)}
              className="min-h-44 w-full resize-y border border-input bg-background px-3 py-3 font-sans text-sm leading-relaxed text-foreground outline-none shadow-field placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-[invalid=true]:border-destructive"
              id="comment"
              maxLength={4000}
              placeholder="Contá cómo fue el intento, qué recordás de la mesa y qué contexto te parece útil."
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
              Omití cualquier dato que no recuerdes; no se infiere ni se completa después.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="examDate">Fecha exacta</FieldLabel>
              <Input id="examDate" type="date" {...register('examDate')} />
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

          <fieldset
            className="grid gap-3"
            aria-describedby={
              errors.professorId || errors.examinerName ? 'examiner-error' : undefined
            }
          >
            <legend className="font-sans text-sm font-bold text-foreground">
              Profesor o examinador
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
                      setValue('examinerName', '');
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
                aria-invalid={Boolean(errors.examinerName)}
                aria-label="Nombre manual del examinador"
                placeholder="Ej.: Ing. Laura Quiroga"
                {...register('examinerName')}
              />
            ) : null}
            <FieldError id="examiner-error">
              {errors.professorId?.message ?? errors.examinerName?.message}
            </FieldError>
          </fieldset>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="outcome">Resultado</FieldLabel>
              <select
                className="min-h-11 w-full border border-input bg-background px-3 font-sans text-sm text-foreground shadow-field outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                id="outcome"
                {...register('outcome')}
              >
                <option value="">No lo indico</option>
                {OUTCOMES.map((outcome) => (
                  <option key={outcome} value={outcome}>
                    {examOutcomeLabels[outcome]}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="grade">Nota</FieldLabel>
              <Input
                aria-describedby={errors.grade ? 'grade-error' : undefined}
                aria-invalid={Boolean(errors.grade)}
                id="grade"
                inputMode="numeric"
                max={10}
                min={0}
                placeholder="0 a 10"
                type="number"
                {...register('grade')}
              />
              <FieldDescription>Solo con “Aprobado” o “Desaprobado”.</FieldDescription>
              <FieldError id="grade-error">{errors.grade?.message}</FieldError>
            </Field>
          </div>

          <label className="flex cursor-pointer items-start gap-3 border border-border bg-secondary p-4 text-sm text-secondary-foreground">
            <input
              className="mt-1 size-4 accent-[var(--primary)]"
              type="checkbox"
              {...register('isAnonymous')}
            />
            <span>
              <span className="block font-bold text-foreground">Publicar como Anónimo</span>
              <span className="mt-1 block leading-relaxed">
                La experiencia no mostrará tu nombre, avatar ni un alias permanente. La cuenta sigue
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
            {isSubmitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Publicar experiencia'}
          </Button>
        </div>
      </form>
    </div>
  );
}
