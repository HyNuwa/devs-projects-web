'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { AnonymousMark } from '@/components/experiences/AnonymousMark';
import { StarRecommendation } from '@/components/experiences/facts';
import { AuthorLink } from '@/components/public-profile/AuthorLink';
import { ReportDialog } from '@/components/moderation/ReportDialog';
import { avatarSrc } from '@/components/layout/account';
import { Chip } from '@/components/ui/shadcn';
import { cn } from '@/components/ui/shadcn/utils';
import {
  courseAttemptLabel,
  courseConditionLabel,
  difficultyLabel,
  examFormatLabel,
  examOutcomeLabel,
  examPeriodLabel,
  shiftLabel,
} from '@/lib/presentation-labels';
import { formatRelativeTime } from '@/lib/relative-time';
import type { DiscoveryCourseReview, DiscoveryExamExperience } from '@/types/discovery';

export type ExperienceCardEntry =
  | { kind: 'review'; review: DiscoveryCourseReview }
  | { kind: 'exam'; exam: DiscoveryExamExperience };

/** The resultado muestra colors, the same rampa as the summary bars. */
const conditionDot: Record<'PROMO' | 'REGULAR' | 'LIBRE', string> = {
  PROMO: 'bg-[#0A3FC7]',
  REGULAR: 'bg-[#4A7BE9]',
  LIBRE: 'bg-[#90AEF1]',
};

const difficultyTone = {
  MUY_BAJA: 'success',
  BAJA: 'success',
  MEDIA: 'neutral',
  ALTA: 'accent',
  MUY_ALTA: 'destructive',
} as const;

function mesaChip(exam: DiscoveryExamExperience) {
  if (exam.session === 'NO_RECUERDO') return `Final ${exam.year}`;
  if (exam.session === 'ESPECIAL') return `Mesa especial ${exam.year}`;
  return `Mesa de ${examPeriodLabel(exam.session).toLowerCase()} ${exam.year}`;
}

function contextChips(entry: ExperienceCardEntry) {
  if (entry.kind === 'review') {
    const review = entry.review;
    return [
      review.academicYear ? `Ciclo ${review.academicYear}` : null,
      review.shift !== 'NO_INDICO' ? shiftLabel(review.shift) : null,
      review.professor?.name ?? review.professorName,
      review.attempt && review.attempt !== 'PREFIERO_NO_RESPONDER'
        ? courseAttemptLabel(review.attempt)
        : null,
    ].filter((chip): chip is string => Boolean(chip));
  }

  const exam = entry.exam;
  return [
    mesaChip(exam),
    examFormatLabel(exam.format),
    exam.professor?.name ?? exam.examinerName ?? null,
  ].filter((chip): chip is string => Boolean(chip));
}

function resultChips(entry: ExperienceCardEntry) {
  if (entry.kind === 'review') {
    const review = entry.review;
    const condition =
      review.condition !== 'PREFIERO_NO_RESPONDER'
        ? {
            dot: conditionDot[review.condition],
            label: courseConditionLabel(review.condition),
          }
        : null;
    const difficulty = review.difficulty
      ? `Dificultad ${difficultyLabel(review.difficulty).toLowerCase()}`
      : null;
    return { condition, difficulty, tone: review.difficulty };
  }

  const exam = entry.exam;
  const condition =
    exam.outcome && exam.outcome !== 'PREFIERO_NO_DECIR'
      ? {
          dot: null,
          label: `${examOutcomeLabel(exam.outcome)}${
            exam.grade !== undefined ? ` · ${exam.grade}` : ''
          }`,
        }
      : null;
  const difficulty = exam.difficulty
    ? `Dificultad ${difficultyLabel(exam.difficulty).toLowerCase()}`
    : null;
  return { condition, difficulty, tone: exam.difficulty };
}

/**
 * The one experiencia card (openspec academic-community/experiences): author
 * or marca de anónimo, type and relative time, known context as chips,
 * resultado and dificultad, a bounded excerpt, «Leer completa» and «Reportar».
 * It never fabricates missing facts nor shows «Me sirvió».
 */
export function ExperienceCard({
  className,
  entry,
  now,
}: {
  className?: string;
  entry: ExperienceCardEntry;
  now: Date;
}) {
  const item = entry.kind === 'review' ? entry.review : entry.exam;
  const typeLabel = entry.kind === 'review' ? 'Reseña de cursada' : 'Experiencia de final';
  const detailHref =
    entry.kind === 'review' ? `/resenas/${entry.review.id}` : `/finales/${entry.exam.id}`;
  const author = item.author;
  const context = contextChips(entry);
  const results = resultChips(entry);

  return (
    <article
      className={cn(
        'flex flex-col gap-3 rounded-xl border-[1.5px] border-foreground bg-card p-5',
        className,
      )}
    >
      <header className="flex items-center gap-3">
        {author.id ? (
          // eslint-disable-next-line @next/next/no-img-element -- 40px avatar from an arbitrary host or /avatars
          <img
            alt=""
            className="size-10 shrink-0 rounded-full border-[1.5px] border-foreground object-cover"
            height={40}
            src={avatarSrc({
              id: author.id,
              avatarUrl: author.avatarUrl ?? null,
              avatarCat: author.avatarCat,
            })}
            width={40}
          />
        ) : (
          <AnonymousMark />
        )}
        <div className="min-w-0">
          <AuthorLink
            author={author}
            className="block max-w-full truncate text-sm font-extrabold text-card-foreground"
          />
          <p className="text-xs font-semibold text-muted-foreground">
            {typeLabel} · {formatRelativeTime(item.createdAt, now)}
          </p>
        </div>
        {entry.kind === 'review' ? (
          <div className="ml-auto shrink-0 text-right">
            <StarRecommendation value={entry.review.recommendation} />
            <p className="mt-0.5 font-mono text-[0.62rem] font-bold text-muted-foreground">
              la recomienda
            </p>
          </div>
        ) : null}
      </header>

      <h3 className="font-sans text-[1.0625rem] font-extrabold leading-snug tracking-[-0.02em] text-card-foreground">
        <Link
          className="outline-none transition-colors hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          href={item.subject.href}
        >
          {item.subject.name}
        </Link>
      </h3>

      <div>
        <p className="font-mono text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
          {entry.kind === 'review' ? 'Contexto de la cursada' : 'La mesa'}
        </p>
        {context.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {context.map((chip) => (
              <Chip key={chip} tone="neutral">
                {chip}
              </Chip>
            ))}
          </div>
        ) : null}
        {results.condition || results.difficulty ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {results.condition ? (
              <Chip tone="neutral">
                {results.condition.dot ? (
                  <span
                    aria-hidden="true"
                    className={cn('size-2 rounded-[3px]', results.condition.dot)}
                  />
                ) : null}
                {results.condition.label}
              </Chip>
            ) : null}
            {results.difficulty ? (
              <Chip tone={results.tone ? difficultyTone[results.tone] : 'neutral'}>
                {results.difficulty}
              </Chip>
            ) : null}
          </div>
        ) : null}
      </div>

      {item.excerpt ? (
        <p className="line-clamp-4 font-sans text-[0.9375rem] leading-relaxed text-foreground">
          “{item.excerpt}”
        </p>
      ) : null}

      <footer className="mt-auto flex items-center justify-between gap-3 pt-2">
        <Link
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md border-[1.5px] border-foreground bg-card px-3.5 text-xs font-bold text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          href={detailHref}
        >
          Leer completa
          <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={2.2} />
        </Link>
        <ReportDialog
          returnPath={detailHref}
          targetId={item.id}
          targetType={entry.kind === 'review' ? 'COURSE_REVIEW' : 'EXAM_EXPERIENCE'}
        />
      </footer>
    </article>
  );
}
