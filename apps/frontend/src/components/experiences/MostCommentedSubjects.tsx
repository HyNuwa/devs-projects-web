'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/shadcn';
import { difficultyLabel } from '@/lib/presentation-labels';
import { formatRelativeTime } from '@/lib/relative-time';
import type { ExperiencesOverview } from '@/lib/experiences-client';

type MostCommentedItem = ExperiencesOverview['mostCommented']['items'][number];

const difficultyTone = {
  MUY_BAJA: 'bg-[#E1F5E4] text-[#1F7A37]',
  BAJA: 'bg-[#E1F5E4] text-[#1F7A37]',
  MEDIA: 'bg-muted text-secondary-foreground',
  ALTA: 'bg-[#FDE7D0] text-[#B14C06]',
  MUY_ALTA: 'bg-[#FED3DF] text-[#B31450]',
} as const;

function figure(item: MostCommentedItem, kind: 'reviews' | 'exams' | null) {
  if (kind === 'exams') {
    return {
      caption: `aprobaron ${item.approval.approved} de ${item.approval.answered}`,
      value: null,
    };
  }
  const summary = item.promotion;
  if (summary.percent !== null) {
    return { caption: 'promocionó', value: `${summary.percent}%` };
  }
  if (summary.answered > 0) {
    return { caption: `${summary.promoted} de ${summary.answered} promocionaron`, value: null };
  }
  return null;
}

function SubjectCard({
  careerId,
  item,
  kind,
  now,
}: {
  /** Active carrera chip; carried into the subject page's breadcrumb context. */
  careerId: string | null;
  item: MostCommentedItem;
  kind: 'reviews' | 'exams' | null;
  now: Date;
}) {
  const stats = figure(item, kind);
  const href = item.subject.code
    ? `/experiencias/${encodeURIComponent(item.subject.code)}${careerId ? `?carrera=${encodeURIComponent(careerId)}` : ''}`
    : null;
  const content = (
    <>
      <div className="flex items-center gap-2">
        {item.subject.code ? (
          <span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[0.68rem] font-extrabold tracking-[0.06em] text-primary">
            {item.subject.code}
          </span>
        ) : null}
        {item.placement ? (
          <span className="min-w-0 truncate text-[0.72rem] font-bold text-muted-foreground">
            {item.placement.careerName}
            {item.placement.year ? ` · ${item.placement.year}° año` : ' · Optativa'}
          </span>
        ) : null}
      </div>
      <span className="mt-2.5 font-sans text-[1.0625rem] font-extrabold leading-snug tracking-[-0.025em] text-card-foreground">
        {item.subject.name}
      </span>
      <span className="mt-3 flex min-w-0 flex-wrap items-end gap-x-4 gap-y-2">
        <span>
          <span className="block font-sans text-2xl font-extrabold leading-none tracking-[-0.04em] text-card-foreground">
            {item.total}
          </span>
          <span className="mt-1 block text-[0.72rem] font-bold text-muted-foreground">
            experiencias
          </span>
        </span>
        {stats ? (
          <span>
            {stats.value ? (
              <span className="block font-sans text-2xl font-extrabold leading-none tracking-[-0.04em] text-card-foreground">
                {stats.value}
              </span>
            ) : null}
            <span
              className={
                stats.value
                  ? 'mt-1 block text-[0.72rem] font-bold text-muted-foreground'
                  : 'block text-[0.72rem] font-bold text-muted-foreground'
              }
            >
              {stats.caption}
            </span>
          </span>
        ) : null}
        {item.topDifficulty ? (
          <span
            className={`ml-auto self-center whitespace-nowrap rounded-md px-2 py-1 text-[0.72rem] font-extrabold ${difficultyTone[item.topDifficulty]}`}
          >
            Dificultad {difficultyLabel(item.topDifficulty).toLowerCase()}
          </span>
        ) : null}
      </span>
      <span className="mt-3.5 flex items-center justify-between gap-2 border-t-[1.5px] border-line pt-2.5 text-[0.75rem] font-semibold text-muted-foreground">
        {item.latestAt ? (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-full bg-[#37C46B]" />
            Nueva {formatRelativeTime(item.latestAt, now)}
          </span>
        ) : (
          <span />
        )}
        <span className="inline-flex items-center gap-1 font-bold text-link">
          Ver experiencias
          <ArrowRight aria-hidden="true" className="size-3" strokeWidth={2.4} />
        </span>
      </span>
    </>
  );

  const cardClass =
    'flex h-full flex-col rounded-xl border-[1.5px] border-foreground bg-card p-4 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  return href ? (
    <Link className={cardClass} href={href}>
      {content}
    </Link>
  ) : (
    <div className={cardClass}>{content}</div>
  );
}

/**
 * «Materias más comentadas» (openspec academic-community/experiences): the
 * facultad's most-commented materias in the window, or «de siempre» when the
 * backend reports ALL_TIME. Empty context → the bounded empty card.
 */
export function MostCommentedSubjects({
  careerId = null,
  contextLabel,
  facultyLabel,
  mostCommented,
  now,
  overviewKind,
  seeAllHref,
}: {
  /** «<carrera> · todas las carreras» resolved by the caller. */
  careerId?: string | null;
  contextLabel: string;
  /** Facultad name for copy; `null` without an Ubicación. */
  facultyLabel: string | null;
  mostCommented: ExperiencesOverview['mostCommented'];
  now: Date;
  overviewKind: 'reviews' | 'exams' | null;
  /** «Ver todas las materias» target; omitted without an Ubicación. */
  seeAllHref: string | null;
}) {
  const windowLabel = mostCommented.window === 'ALL_TIME' ? 'de siempre' : 'últimos meses';

  return (
    <section aria-labelledby="most-commented-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            className="font-sans text-[1.625rem] font-extrabold leading-tight tracking-[-0.035em] text-foreground"
            id="most-commented-title"
          >
            Materias más comentadas
          </h2>
          <p className="mt-1 font-sans text-sm font-medium text-muted-foreground">
            {(facultyLabel ?? 'todas las facultades') + ` · ${contextLabel} · ${windowLabel}`}
          </p>
        </div>
        {seeAllHref ? (
          <Link
            className="inline-flex min-h-11 items-center gap-1.5 font-sans text-[0.8125rem] font-bold text-link outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring"
            href={seeAllHref}
          >
            Ver todas las materias
            <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={2.4} />
          </Link>
        ) : null}
      </div>

      {mostCommented.items.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border-[1.5px] border-foreground bg-card px-6 py-8 text-center">
          <p className="font-sans text-lg font-bold text-card-foreground">
            Todavía no hay experiencias en {facultyLabel ?? 'todas las facultades'}
          </p>
          <Button asChild>
            <Link href="/experiencias/escribir">Escribir la primera</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3.5 lg:grid-cols-3">
          {mostCommented.items.map((item) => (
            <SubjectCard
              careerId={careerId}
              item={item}
              key={item.subject.id}
              kind={overviewKind}
              now={now}
            />
          ))}
        </div>
      )}
    </section>
  );
}
