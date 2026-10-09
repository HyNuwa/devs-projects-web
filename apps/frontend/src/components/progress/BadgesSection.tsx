'use client';

import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { ErrorState, LoadingState } from '@/components/ui/shadcn';
import { cn } from '@/components/ui/shadcn/utils';
import { getApiError } from '@/lib/apiHelpers';
import {
  type BadgeRarity,
  type BadgeTier,
  type EarnedBadge,
  getMyBadges,
  markBadgesSeen,
  type MyBadges,
} from '@/lib/badges-client';

const RARITY: Record<BadgeRarity, string> = {
  COMUN: 'Común',
  RARA: 'Rara',
  TEMPORADA: 'De temporada',
  EDICION_UNICA: 'Edición única',
};

const TIER: Record<BadgeTier, string> = { BRONCE: 'Bronce', PLATA: 'Plata', ORO: 'Oro' };

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** «ago 2026», in the faculty's time zone (UTC-3). */
function monthYear(iso: string) {
  const local = new Date(new Date(iso).getTime() - 3 * 3_600_000);
  return `${MONTHS[local.getUTCMonth()]} ${local.getUTCFullYear()}`;
}

/** «Edición 2025» for a year, «Edición jul 2026» for an exam period. */
function editionLabel(edition: number) {
  if (edition === 0) return null;
  if (edition > 9999) {
    return `Edición ${MONTHS[(edition % 100) - 1]} ${Math.floor(edition / 100)}`;
  }
  return `Edición ${edition}`;
}

const gemPath = (slug: string, extension: 'svg' | 'lottie') =>
  `/assets/insignias/gema/${slug}.${extension}`;

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** Whether the viewer asked for reduced motion; assumed on the server. */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(REDUCED_MOTION);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true,
  );
}

/**
 * Whether the element has been on screen (stays true once seen). Without
 * IntersectionObserver it counts as visible.
 */
function useInView(ref: React.RefObject<HTMLElement | null>, ready: boolean) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!ready || !element || inView) return;
    if (typeof IntersectionObserver === 'undefined') {
      queueMicrotask(() => setInView(true));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setInView(true);
        observer.disconnect();
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, ready, inView]);
  return inView;
}

/** The gem of an insignia: still, or playing its entrada once when newly earned. */
function Gem({
  animate,
  muted = false,
  size,
  slug,
}: {
  animate: boolean;
  muted?: boolean;
  size: number;
  slug: string;
}) {
  if (animate) {
    return (
      <div aria-hidden="true" style={{ height: size, width: size }}>
        <DotLottieReact
          autoplay
          loop={false}
          marker="entrada"
          src={gemPath(slug, 'lottie')}
          style={{ height: size, width: size }}
        />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static gem svg from /public
    <img
      alt=""
      className={cn('shrink-0', muted && 'opacity-40 grayscale')}
      height={size}
      src={gemPath(slug, 'svg')}
      width={size}
    />
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-extrabold text-foreground">
      {children}
    </span>
  );
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; badges: MyBadges };

/** The Insignias of «Tu progreso» (openspec reputation/badges). */
export function BadgesSection() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const reducedMotion = usePrefersReducedMotion();
  const markedSeen = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, state.status === 'ready');

  useEffect(() => {
    let active = true;
    getMyBadges()
      .then((badges) => {
        if (active) setState({ status: 'ready', badges });
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', message: getApiError(error) });
      });
    return () => {
      active = false;
    };
  }, []);

  // Newly earned insignias animate once, when the section comes into view; only
  // those are marked seen (another could have been earned since this read).
  useEffect(() => {
    if (state.status !== 'ready' || !inView || markedSeen.current) return;
    const unseen = state.badges.earned.filter((badge) => !badge.seen);
    if (unseen.length > 0) {
      markedSeen.current = true;
      void markBadgesSeen(unseen.map(({ slug, edition }) => ({ slug, edition }))).catch(
        () => undefined,
      );
    }
  }, [state, inView]);

  if (state.status === 'loading') return <LoadingState heading="Cargando tus insignias" />;
  if (state.status === 'error') {
    return <ErrorState description={state.message} heading="No pudimos cargar tus insignias" />;
  }
  const { earned, pending, closest } = state.badges;
  const animates = (badge: EarnedBadge) => !badge.seen && !reducedMotion && inView;

  return (
    <section
      aria-labelledby="progress-badges"
      ref={sectionRef}
      className="rounded-2xl border-[1.5px] border-foreground bg-card p-5"
    >
      <h2 className="text-lg font-extrabold tracking-[-0.02em]" id="progress-badges">
        Insignias
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Reconocen logros concretos. No dan puntos y lo anónimo no cuenta.
      </p>

      {closest.length > 0 ? (
        <>
          <h3 className="mt-5 text-sm font-extrabold" id="badges-closest">
            Las más cercanas
          </h3>
          <ul aria-labelledby="badges-closest" className="mt-2 grid gap-3 sm:grid-cols-3">
            {closest.map((badge) => {
              const percent = Math.round((badge.current / badge.target) * 100);
              return (
                <li className="flex items-center gap-3" key={badge.slug}>
                  <Gem animate={false} muted size={48} slug={badge.slug} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold">
                      {badge.name}
                      {badge.tier ? ` · ${TIER[badge.tier]}` : ''}
                    </p>
                    <div
                      aria-label={`${badge.name}: ${badge.current} de ${badge.target}`}
                      aria-valuemax={100}
                      aria-valuemin={0}
                      aria-valuenow={percent}
                      className="mt-1 h-2 overflow-hidden rounded-full border border-foreground bg-muted"
                      role="progressbar"
                    >
                      <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      {badge.missing}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      <h3 className="mt-5 text-sm font-extrabold" id="badges-earned">
        Ganadas
      </h3>
      {earned.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Todavía no ganaste insignias. La primera llega con tu primer material publicado.
        </p>
      ) : (
        <ul
          aria-label="Insignias ganadas"
          className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6"
        >
          {earned.map((badge) => (
            <li
              className="flex flex-col items-center gap-1.5 rounded-xl border-[1.5px] border-foreground p-3 text-center"
              key={`${badge.slug}-${badge.edition}`}
            >
              <Gem animate={animates(badge)} size={72} slug={badge.slug} />
              <p className="text-sm font-extrabold leading-tight">{badge.name}</p>
              <div className="flex flex-wrap justify-center gap-1">
                <Chip>{RARITY[badge.rarity]}</Chip>
                {badge.tier ? <Chip>{TIER[badge.tier]}</Chip> : null}
                {editionLabel(badge.edition) ? <Chip>{editionLabel(badge.edition)}</Chip> : null}
              </div>
              <p className="text-[0.7rem] font-bold text-success-ink">
                Ganada · {monthYear(badge.earnedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {pending.length > 0 ? (
        <>
          <h3 className="mt-5 text-sm font-extrabold" id="badges-pending">
            Por ganar
          </h3>
          <ul
            aria-label="Insignias por ganar"
            className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6"
          >
            {pending.map((badge) => (
              <li
                className="flex flex-col items-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-line p-3 text-center"
                key={badge.slug}
              >
                <Gem animate={false} muted size={56} slug={badge.slug} />
                <p className="text-sm font-bold leading-tight text-muted-foreground">
                  {badge.name}
                </p>
                <Chip>{RARITY[badge.rarity]}</Chip>
                <p className="text-[0.7rem] leading-snug text-muted-foreground">
                  {badge.description}
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
