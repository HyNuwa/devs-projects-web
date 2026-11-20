'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { avatarSrc } from '@/components/layout/account';
import { BadgesSection } from '@/components/progress/BadgesSection';
import { PrivilegesCard } from '@/components/progress/PrivilegesCard';
import { Button, EmptyState, ErrorState, LoadingState } from '@/components/ui/shadcn';
import { getApiError } from '@/lib/apiHelpers';
import { getMyProgress, type Progress, type ProgressMovement } from '@/lib/progress-client';
import { cn } from '@/components/ui/shadcn/utils';
import { useAuthStore } from '@/stores/authStore';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; progress: Progress };

const dateFormat = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' });
const thousands = new Intl.NumberFormat('es-AR');

/** What a movement was for, in plain language and without naming a reported content. */
function describe(movement: ProgressMovement) {
  const title = movement.subject?.title;
  const quoted = title ? ` «${title}»` : '';
  const text = {
    MATERIAL_PUBLISHED: `material publicado${quoted}`,
    MATERIAL_PIONEER: 'bono Primera huella',
    HELPFUL_RECEIVED: `«Me sirvió» en${quoted || ' tu material'}`,
    COURSE_REVIEWED: title ? `${title} publicada con nombre` : 'reseña publicada con nombre',
    EXAM_EXPERIENCE_SHARED: title
      ? `${title} publicada con nombre`
      : 'experiencia de final publicada con nombre',
    REPORT_CONFIRMED: 'reporte confirmado por moderación',
    CORRECTION_ACCEPTED: 'corrección aceptada',
    GUIDE_CREATED: 'guía creada',
    LEGACY_ADJUSTMENT: 'ajuste de puntos anteriores',
  }[movement.reason];
  const sentence = text.charAt(0).toUpperCase() + text.slice(1);
  return movement.reversal ? `Se revirtió: ${text}` : sentence;
}

/** «Tu progreso» (openspec reputation/points), after the canvas «Mi espacio». */
export function ProgressPage() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [state, setState] = useState<State>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    getMyProgress()
      .then((progress) => {
        if (active) setState({ status: 'ready', progress });
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', message: getApiError(error) });
      });
    return () => {
      active = false;
    };
  }, [user, reloadKey]);

  if (!user) {
    if (isLoading) return <LoadingState className="mx-auto my-16 max-w-xl" />;
    return (
      <EmptyState
        action={
          <Button asChild>
            <Link href="/auth/login">Ingresar</Link>
          </Button>
        }
        className="mx-auto my-16 max-w-xl"
        description="Tu nivel y tus puntos son solo para vos."
        heading="Ingresá para ver tu progreso"
      />
    );
  }
  if (state.status === 'loading') {
    return <LoadingState className="mx-auto my-16 max-w-xl" heading="Cargando tu progreso" />;
  }
  if (state.status === 'error') {
    return (
      <ErrorState
        action={
          <Button
            onClick={() => {
              setState({ status: 'loading' });
              setReloadKey((key) => key + 1);
            }}
            variant="outline"
          >
            Reintentar
          </Button>
        }
        className="mx-auto my-16 max-w-xl"
        description={state.message}
      />
    );
  }

  const { progress } = state;
  const { next } = progress;
  const current = progress.levels[progress.level - 1];
  const percent = next
    ? Math.round(
        ((progress.points - current.threshold) / (next.threshold - current.threshold)) * 100,
      )
    : 100;

  return (
    <article className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-10 font-sans sm:py-14">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-link">
        Mi espacio · Tu progreso
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="flex flex-col gap-6 rounded-2xl border-[1.5px] border-foreground bg-card p-6 shadow-pop sm:flex-row sm:items-center">
          <div className="relative size-28 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- avatar from an arbitrary host or /avatars */}
            <img
              alt=""
              className="size-28 rounded-full border-[1.5px] border-foreground object-cover"
              height={112}
              src={avatarSrc(user)}
              width={112}
            />
            <span className="absolute -right-1 bottom-1 rounded-full border-2 border-card bg-foreground px-2.5 py-1 text-sm font-black text-background">
              Nv. {progress.level}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-link">Tu nivel</p>
            <h1 className="mt-1 text-4xl font-extrabold leading-none tracking-[-0.05em] sm:text-5xl">
              {progress.levelName}
              <span className="text-primary">.</span>
            </h1>
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 text-sm font-bold text-muted-foreground">
              <span>
                <b className="text-2xl tabular-nums text-foreground">
                  {thousands.format(progress.points)}
                </b>{' '}
                puntos
              </span>
              {next ? (
                <span>
                  Faltan <b className="text-foreground">{thousands.format(next.missing)}</b> para{' '}
                  <b className="text-foreground">
                    Nv. {next.level} · {next.name}
                  </b>
                </span>
              ) : (
                <span>Llegaste al nivel más alto.</span>
              )}
            </div>
            <div
              aria-label={next ? `Progreso hacia el nivel ${next.level}` : 'Nivel máximo'}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={percent}
              className="mt-2 h-3 overflow-hidden rounded-full border-[1.5px] border-foreground bg-muted"
              role="progressbar"
            >
              <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
            </div>
            {next ? (
              <div className="mt-1.5 flex justify-between text-xs font-bold tabular-nums text-muted-foreground">
                <span>{thousands.format(current.threshold)}</span>
                <span>{thousands.format(next.threshold)}</span>
              </div>
            ) : null}
          </div>
        </section>

        {next ? (
          <section
            aria-labelledby="progress-unlock"
            className="flex flex-col gap-2 rounded-2xl border-[1.5px] border-foreground bg-secondary p-5"
          >
            <h2
              className="text-xs font-bold uppercase tracking-[0.12em] text-link"
              id="progress-unlock"
            >
              Al llegar a Nv. {next.level} se desbloquea
            </h2>
            <p className="text-base font-extrabold">{next.unlocks}</p>
            <p className="mt-auto text-xs font-semibold text-muted-foreground">
              La personalización del perfil llega pronto; lo que desbloquees queda guardado.
            </p>
          </section>
        ) : null}
      </div>

      <section className="rounded-2xl border-[1.5px] border-foreground bg-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-extrabold tracking-[-0.02em]" id="progress-path">
            El camino
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link className="text-sm font-bold text-link" href="/puntos">
              Cómo funcionan los puntos →
            </Link>
            <Link className="text-sm font-bold text-link" href="/ranking">
              Ver rankings →
            </Link>
          </div>
        </div>
        <ol
          aria-labelledby="progress-path"
          className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-10"
        >
          {progress.levels.map((step) => {
            const done = step.level < progress.level;
            const isCurrent = step.level === progress.level;
            return (
              <li
                aria-current={isCurrent ? 'step' : undefined}
                className="flex flex-col items-center gap-1.5 text-center"
                key={step.level}
              >
                <span
                  className={cn(
                    'grid size-9 place-items-center rounded-full text-sm font-extrabold',
                    done && 'border-2 border-foreground bg-primary text-primary-foreground',
                    isCurrent && 'size-11 border-[2.5px] border-foreground bg-accent shadow-pop',
                    !done &&
                      !isCurrent &&
                      'border-[1.5px] border-dashed border-line text-muted-foreground',
                  )}
                >
                  {done ? (
                    <Check aria-hidden="true" className="size-4" strokeWidth={3} />
                  ) : (
                    step.level
                  )}
                </span>
                <span
                  className={cn(
                    'text-xs leading-tight',
                    isCurrent ? 'font-extrabold' : 'font-bold',
                    step.level > progress.level && 'text-muted-foreground',
                  )}
                >
                  {step.name}
                </span>
                <span className="text-[0.7rem] font-semibold tabular-nums text-muted-foreground">
                  {thousands.format(step.threshold)} pts
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <BadgesSection />

      <PrivilegesCard />

      <section className="rounded-2xl border-[1.5px] border-foreground bg-card p-5">
        <h2 className="text-lg font-extrabold tracking-[-0.02em]" id="progress-movements">
          Últimos movimientos
        </h2>
        {progress.movements.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Todavía no tenés movimientos. Publicá un material, o una reseña o experiencia con tu
            nombre, para empezar a sumar.
          </p>
        ) : (
          <ul aria-labelledby="progress-movements" className="mt-2">
            {progress.movements.map((movement, index) => (
              <li
                className="flex items-center gap-3 border-t-[1.5px] border-line py-2.5 first:border-t-0"
                key={`${movement.createdAt}-${index}`}
              >
                <span
                  className={cn(
                    'w-12 shrink-0 text-base font-extrabold tabular-nums',
                    movement.amount > 0 ? 'text-success-ink' : 'text-destructive-ink',
                  )}
                >
                  {movement.amount > 0 ? '+' : '−'}
                  {Math.abs(movement.amount)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-snug">{describe(movement)}</p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {dateFormat.format(new Date(movement.createdAt))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
