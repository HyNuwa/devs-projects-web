'use client';

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { MaterialPreviewDialog } from '@/components/discovery/MaterialPreviewDialog';
import { avatarSrc, isAnimatedCat } from '@/components/layout/account';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/shadcn';
import { cn } from '@/components/ui/shadcn/utils';
import { getApiError } from '@/lib/apiHelpers';
import { editionLabel, gemPath, TIER_LABEL } from '@/lib/badge-labels';
import {
  getProfileContributions,
  getPublicProfile,
  type ContributionItem,
  type PublicBadge,
  type PublicProfile,
} from '@/lib/profile-client';

import {
  ACCENT_COLORS,
  backgroundClass,
  bannerSrc,
  frameClass,
  profileStyles as styles,
  themeClass,
} from './cosmetics';

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const TYPE_LABEL: Record<ContributionItem['type'], string> = {
  MATERIAL: 'Material',
  COURSE_REVIEW: 'Reseña de cursada',
  EXAM_EXPERIENCE: 'Experiencia de final',
};

type State =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ready'; profile: PublicProfile };

type Contributions = {
  items: ContributionItem[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  failed: boolean;
};

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** Whether the viewer asked for reduced motion; assumed on the server. */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true,
  );
}

/** «Miembro desde marzo de 2026», from `YYYY-MM`. */
function memberSince(month: string) {
  const [year, number] = month.split('-').map(Number);
  return `Miembro desde ${MONTH_NAMES[number - 1]} de ${year}`;
}

const isNotFound = (error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status === 404;

/**
 * The perfil público (openspec reputation/public-profile): personalization,
 * nivel, insignias, aportes fijados and signed contributions. Open to anyone.
 */
export function PublicProfilePage({ username }: { username: string }) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [contributions, setContributions] = useState<Contributions>({
    items: [],
    page: 0,
    hasMore: false,
    loading: true,
    failed: false,
  });
  const [preview, setPreview] = useState<ContributionItem | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    let active = true;
    getPublicProfile(username)
      .then((profile) => {
        if (active) setState({ status: 'ready', profile });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState(
          isNotFound(error)
            ? { status: 'not-found' }
            : { status: 'error', message: getApiError(error) },
        );
      });
    getProfileContributions(username, 1)
      .then((page) => {
        if (active) setContributions({ ...page, loading: false, failed: false });
      })
      .catch(() => {
        if (active) setContributions((current) => ({ ...current, loading: false, failed: true }));
      });
    return () => {
      active = false;
    };
  }, [username]);

  async function loadMore() {
    setContributions((current) => ({ ...current, loading: true }));
    try {
      const next = await getProfileContributions(username, contributions.page + 1);
      setContributions((current) => ({
        items: [...current.items, ...next.items],
        page: next.page,
        hasMore: next.hasMore,
        loading: false,
        failed: false,
      }));
    } catch {
      setContributions((current) => ({ ...current, loading: false, failed: true }));
    }
  }

  if (state.status === 'loading') return <LoadingState heading="Cargando el perfil" />;
  if (state.status === 'not-found') {
    return (
      <EmptyState
        description="Puede que el nombre de usuario esté mal escrito."
        heading="No encontramos ese perfil"
      />
    );
  }
  if (state.status === 'error') {
    return <ErrorState description={state.message} heading="No pudimos cargar el perfil" />;
  }

  const { profile } = state;
  const { customization } = profile;
  const name = profile.displayName || profile.username;
  const animated = isAnimatedCat(profile.avatarCat) && !reducedMotion;
  const accent = customization.accent ? ACCENT_COLORS[customization.accent] : undefined;

  return (
    <div
      className={cn(
        styles.page,
        backgroundClass(customization.background),
        themeClass(customization.theme),
        'min-h-screen font-sans',
      )}
      data-profile-root
      style={accent ? ({ '--profile-accent': accent } as React.CSSProperties) : undefined}
    >
      {preview ? (
        <MaterialPreviewDialog
          file={{
            id: preview.id,
            title: preview.title,
            createdAt: preview.createdAt,
            fileType: preview.fileType ?? '',
            academicYear: preview.academicYear,
          }}
          focusTargetId={`aporte-${preview.type}-${preview.id}`}
          onRequestClose={() => setPreview(null)}
          open
          subjectName={preview.subject.name}
        />
      ) : null}

      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 pb-16 pt-6 sm:px-6">
        <header className="overflow-hidden rounded-2xl border-[1.5px] border-foreground shadow-pop">
          <div className={cn('relative h-32 sm:h-44', styles.accentRule)}>
            {customization.banner ? (
              // eslint-disable-next-line @next/next/no-img-element -- local banner art
              <img
                alt=""
                className="size-full object-cover"
                data-banner
                height={500}
                src={bannerSrc(customization.banner)}
                width={1500}
              />
            ) : null}
          </div>
          <div
            className={cn('flex flex-col gap-4 px-5 pb-6 sm:flex-row sm:items-end', styles.surface)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- avatar from an arbitrary host or /avatars */}
            <img
              alt={`Avatar de ${name}`}
              className={cn(
                'relative z-10 -mt-14 size-28 border-[1.5px] border-foreground bg-card object-cover',
                styles.avatar,
                frameClass(customization.frame),
                animated && styles.catAnimated,
              )}
              data-avatar
              height={112}
              src={avatarSrc(profile)}
              width={112}
            />
            <div className="min-w-0 flex-1 sm:pb-1">
              <h1 className="truncate text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
                {name}
              </h1>
              <p className={cn('text-sm text-muted-foreground', styles.muted)}>
                @{profile.username}
              </p>
              {profile.title ? (
                <p className={cn('mt-1 text-sm font-bold', styles.accentText)} data-title>
                  {profile.title.name}
                </p>
              ) : null}
            </div>
            <div className="grid gap-1 text-sm sm:text-right">
              {profile.level ? (
                <p className="font-extrabold">
                  Nv. {profile.level.number} · {profile.level.name}
                </p>
              ) : null}
              <p className={cn('text-muted-foreground', styles.muted)}>
                {memberSince(profile.memberSince)}
              </p>
            </div>
          </div>
          {profile.bio ? (
            <p className={cn('border-t-[1.5px] border-border px-5 py-4 text-sm', styles.surface)}>
              {profile.bio}
            </p>
          ) : null}
        </header>

        {profile.featured.length > 0 ? (
          <Section title="Insignias destacadas">
            <ul className="grid gap-3 sm:grid-cols-3">
              {profile.featured.map((badge) => (
                <li key={badge.slug}>
                  <BadgeCard badge={badge} size={72} />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {profile.pinned.length > 0 ? (
          <Section title="Aportes fijados">
            <ul className="grid gap-3">
              {profile.pinned.map((entry) => (
                <li key={`${entry.type}:${entry.id}`}>
                  <ContributionRow item={entry} onPreview={setPreview} />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {profile.badges.length > 0 ? (
          <Section title="Insignias">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {profile.badges.map((badge) => (
                <li key={`${badge.slug}:${badge.edition}`}>
                  <BadgeCard badge={badge} size={48} />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <Section title="Aportes">
          {contributions.failed ? (
            <p className="text-sm font-semibold text-destructive-ink" role="alert">
              No pudimos cargar sus aportes.
            </p>
          ) : null}
          {contributions.items.length === 0 && !contributions.loading && !contributions.failed ? (
            <p className={cn('text-sm text-muted-foreground', styles.muted)}>
              Todavía no hay aportes publicados con su nombre.
            </p>
          ) : (
            <ul className="grid gap-3">
              {contributions.items.map((entry) => (
                <li key={`${entry.type}:${entry.id}`}>
                  <ContributionRow item={entry} onPreview={setPreview} />
                </li>
              ))}
            </ul>
          )}
          {contributions.hasMore ? (
            <button
              className="mt-4 min-h-11 rounded-lg border-[1.5px] border-foreground px-4 text-sm font-bold disabled:opacity-60"
              disabled={contributions.loading}
              onClick={loadMore}
              type="button"
            >
              Ver más aportes
            </button>
          ) : null}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const id = `perfil-${title.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <section aria-labelledby={id} className="grid gap-3">
      <h2 className="text-xl font-extrabold tracking-[-0.03em]" id={id}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function BadgeCard({ badge, size }: { badge: PublicBadge; size: number }) {
  const edition = editionLabel(badge.edition);
  return (
    <div
      className={cn(
        'flex h-full items-center gap-3 rounded-xl border-[1.5px] border-border p-3 text-sm',
        styles.surface,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static gem svg from /public */}
      <img
        alt=""
        className="shrink-0"
        height={size}
        src={gemPath(badge.slug, 'svg')}
        width={size}
      />
      <div className="min-w-0">
        <p className="font-extrabold">{badge.name}</p>
        <p className={cn('text-muted-foreground', styles.muted)}>
          {[badge.tier ? TIER_LABEL[badge.tier] : null, edition].filter(Boolean).join(' · ')}
        </p>
      </div>
    </div>
  );
}

function ContributionRow({
  item,
  onPreview,
}: {
  item: ContributionItem;
  onPreview: (item: ContributionItem) => void;
}) {
  const body = (
    <>
      <span className="block font-extrabold">{item.title}</span>
      <span className={cn('text-muted-foreground', styles.muted)}>
        {TYPE_LABEL[item.type]}
        {item.type === 'MATERIAL' ? ` · ${item.subject.name}` : ''}
      </span>
    </>
  );
  const className = cn(
    'block min-h-11 w-full rounded-xl border-[1.5px] border-border p-4 text-left text-sm hover:border-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
    styles.surface,
  );
  if (item.type === 'MATERIAL') {
    return (
      <button
        className={className}
        id={`aporte-${item.type}-${item.id}`}
        onClick={() => onPreview(item)}
        type="button"
      >
        {body}
      </button>
    );
  }
  const href = item.type === 'COURSE_REVIEW' ? `/resenas/${item.id}` : `/finales/${item.id}`;
  return (
    <Link className={className} href={href}>
      {body}
    </Link>
  );
}
