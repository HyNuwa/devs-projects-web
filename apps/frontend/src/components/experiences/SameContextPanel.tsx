import Link from 'next/link';

import { ExperienceCard } from '@/components/experiences/ExperienceCard';
import type { CourseReviewRelated, ExamExperienceRelated } from '@/lib/experiences-client';
import { examFormatLabel, examPeriodLabel, shiftLabel } from '@/lib/presentation-labels';

type SameContextPanelProps =
  | { code?: string | null; kind: 'review'; now?: Date; related: CourseReviewRelated }
  | { code?: string | null; kind: 'exam'; now?: Date; related: ExamExperienceRelated };

const EMPTY_COPY = 'Todavía no hay otras experiencias públicas con este contexto.';

function contextSubtitle(props: SameContextPanelProps): string | null {
  if (props.kind === 'review') {
    const context = props.related.sharedContext;
    if (context === null) return null;
    return [context.shift ? shiftLabel(context.shift) : null, context.professor?.name ?? null]
      .filter(Boolean)
      .join(' · ');
  }
  const context = props.related.sharedContext;
  return [
    context.session ? examPeriodLabel(context.session) : null,
    examFormatLabel(context.format),
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * «Con el mismo contexto» — up to three public experiences sharing the
 * source record's declared context. A null review context hides the panel;
 * a non-null context with no items shows the honest empty copy.
 */
export function SameContextPanel(props: SameContextPanelProps) {
  const subtitle = contextSubtitle(props);
  if (props.kind === 'review' && props.related.sharedContext === null) return null;

  const items = props.related.items.slice(0, 3);
  const now = props.now ?? new Date();

  return (
    <section className="rounded-xl border-[1.5px] border-line bg-card px-5 py-4">
      <h2 className="font-sans text-lg font-extrabold leading-tight text-foreground">
        Con el mismo contexto
      </h2>
      {subtitle ? (
        <p className="mt-1 font-sans text-sm font-semibold text-muted-foreground">{subtitle}</p>
      ) : null}
      {items.length === 0 ? (
        <p className="mt-3 font-sans text-sm font-semibold text-muted-foreground">{EMPTY_COPY}</p>
      ) : (
        <div className="mt-3 grid gap-4">
          {items.map((item) => (
            <ExperienceCard
              entry={
                props.kind === 'review'
                  ? { kind: 'review', review: item as CourseReviewRelated['items'][number] }
                  : { kind: 'exam', exam: item as ExamExperienceRelated['items'][number] }
              }
              key={item.id}
              now={now}
            />
          ))}
        </div>
      )}
      {props.code ? (
        <Link
          className="mt-4 inline-flex font-sans text-sm font-bold text-primary underline-offset-4 hover:underline"
          href={`/experiencias/${encodeURIComponent(props.code)}`}
        >
          Ver todas las experiencias
        </Link>
      ) : null}
    </section>
  );
}
