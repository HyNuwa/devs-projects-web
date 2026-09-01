import Link from 'next/link';
import { GraduationCap, Star, UserRound } from 'lucide-react';

import { Button } from '@/components/ui/shadcn';
import {
  courseAttemptLabel,
  courseConditionLabel,
  difficultyLabel,
  examFormatLabel,
  examOutcomeLabel,
  examPeriodLabel,
  shiftLabel,
} from '@/lib/presentation-labels';
import { cn } from '@/components/ui/shadcn/utils';

type CommunitySubject = {
  href: string;
  name: string;
};

type CommunityAuthor = {
  displayName?: string | null;
  username?: string | null;
};

type CommunitySummaryBase = {
  author?: CommunityAuthor | null;
  createdAt: string;
  excerpt?: string | null;
  id: string;
  subject?: CommunitySubject | null;
  updatedAt: string;
};

export type CourseReviewSummary = CommunitySummaryBase & {
  academicYear?: number | null;
  attempt?: string | null;
  condition?: string | null;
  difficulty?: string | number | null;
  professorName?: string | null;
  recommendation: number;
  shift?: string | null;
};

export type FinalExperienceSummary = CommunitySummaryBase & {
  difficulty?: string | null;
  difficultyPractice?: number | null;
  difficultyTheory?: number | null;
  examDate?: string | null;
  examinerName?: string | null;
  format?: string | null;
  grade?: number | null;
  outcome?: string | null;
  professorName?: string | null;
  session?: string | null;
  shift?: string | null;
  year?: number | null;
};

type SummaryCardProps<TSummary> = {
  className?: string;
  summary: TSummary;
};

function publicAuthorName(author: CommunityAuthor | null | undefined) {
  return author?.displayName || author?.username || 'Anónimo';
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(date);
}

function editedDate(createdAt: string, updatedAt: string) {
  const created = new Date(createdAt).getTime();
  const updated = new Date(updatedAt).getTime();

  if (Number.isNaN(created) || Number.isNaN(updated) || updated <= created) {
    return null;
  }

  return formatDate(updatedAt);
}

function SummaryShell({
  children,
  className,
  excerpt,
  subject,
  updatedAt,
  createdAt,
  author,
}: CommunitySummaryBase & { children: React.ReactNode; className?: string }) {
  const edited = editedDate(createdAt, updatedAt);

  return (
    <article className={cn('border border-border bg-card p-5 shadow-surface sm:p-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {subject ? (
            <Link
              className="font-serif text-xl font-bold leading-tight text-foreground underline decoration-primary/35 underline-offset-4 outline-none transition-colors hover:text-primary focus-visible:text-primary"
              href={subject.href}
            >
              {subject.name}
            </Link>
          ) : null}
          <p
            className={cn(
              'flex items-center gap-2 text-sm text-muted-foreground',
              subject ? 'mt-2' : '',
            )}
          >
            <UserRound
              aria-hidden="true"
              className="size-4 shrink-0 text-primary"
              strokeWidth={1.7}
            />
            {publicAuthorName(author)}
            {edited ? <span>· Editada · {edited}</span> : null}
          </p>
        </div>
        {children}
      </div>
      {excerpt ? (
        <p className="mt-5 line-clamp-4 max-w-[70ch] font-serif text-lg leading-relaxed text-foreground">
          {excerpt}
        </p>
      ) : null}
    </article>
  );
}

function FactList({ facts }: { facts: Array<[label: string, value: string | null | undefined]> }) {
  const knownFacts = facts.filter(([, value]) => value);

  if (knownFacts.length === 0) {
    return null;
  }

  return (
    <dl className="mt-5 flex flex-wrap gap-2">
      {knownFacts.map(([label, value]) => (
        <div className="border border-border bg-secondary px-2.5 py-1.5" key={label}>
          <dt className="sr-only">{label}</dt>
          <dd className="font-mono text-[0.68rem] font-bold leading-tight text-secondary-foreground">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function StarRecommendation({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <span
      aria-label={`Recomendación: ${safeValue} de 5 estrellas`}
      className="flex gap-0.5 text-primary"
    >
      <span className="sr-only">Recomendación: {safeValue} de 5 estrellas</span>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          aria-hidden="true"
          className={cn('size-4', index < safeValue && 'fill-current')}
          key={index}
          strokeWidth={1.7}
        />
      ))}
    </span>
  );
}

export function CourseReviewSummaryCard({
  className,
  summary,
}: SummaryCardProps<CourseReviewSummary>) {
  const professor = summary.professorName ? `Profesor: ${summary.professorName}` : null;

  return (
    <SummaryShell className={className} {...summary}>
      <div className="grid justify-items-end gap-4">
        <StarRecommendation value={summary.recommendation} />
        <Button asChild size="sm" variant="outline">
          <Link href={`/resenas/${summary.id}`}>Leer más</Link>
        </Button>
      </div>
      <FactList
        facts={[
          ['Año de cursada', summary.academicYear ? `Cursada ${summary.academicYear}` : null],
          ['Resultado', summary.condition ? courseConditionLabel(summary.condition) : null],
          ['Situación', summary.attempt ? courseAttemptLabel(summary.attempt) : null],
          ['Franja horaria', summary.shift ? shiftLabel(summary.shift) : null],
          [
            'Dificultad',
            summary.difficulty === null || summary.difficulty === undefined
              ? null
              : difficultyLabel(summary.difficulty),
          ],
          ['Profesor', professor],
        ]}
      />
    </SummaryShell>
  );
}

export function FinalExperienceSummaryCard({
  className,
  summary,
}: SummaryCardProps<FinalExperienceSummary>) {
  const knownExaminer = summary.professorName || summary.examinerName;
  const examDate = summary.examDate ? formatDate(summary.examDate) : null;

  return (
    <SummaryShell className={className} {...summary}>
      <div className="grid justify-items-end gap-4">
        <GraduationCap aria-hidden="true" className="size-5 text-primary" strokeWidth={1.7} />
        <Button asChild size="sm" variant="outline">
          <Link href={`/finales/${summary.id}`}>Leer más</Link>
        </Button>
      </div>
      <FactList
        facts={[
          ['Año de final', summary.year ? `Final ${summary.year}` : null],
          ['Período', summary.session ? examPeriodLabel(summary.session) : null],
          ['Formato', summary.format ? examFormatLabel(summary.format) : null],
          ['Fecha', examDate ? `Fecha: ${examDate}` : null],
          ['Franja horaria', summary.shift ? shiftLabel(summary.shift) : null],
          ['Profesor o examinador', knownExaminer ? `Tomó: ${knownExaminer}` : null],
          ['Dificultad', summary.difficulty ? difficultyLabel(summary.difficulty) : null],
          [
            'Dificultad teórica histórica',
            summary.difficultyTheory === null || summary.difficultyTheory === undefined
              ? null
              : `Teórica: ${difficultyLabel(summary.difficultyTheory)}`,
          ],
          [
            'Dificultad práctica histórica',
            summary.difficultyPractice === null || summary.difficultyPractice === undefined
              ? null
              : `Práctica: ${difficultyLabel(summary.difficultyPractice)}`,
          ],
          ['Resultado', summary.outcome ? examOutcomeLabel(summary.outcome) : null],
          [
            'Nota',
            summary.grade === null || summary.grade === undefined ? null : `Nota: ${summary.grade}`,
          ],
        ]}
      />
    </SummaryShell>
  );
}

export { formatDate as formatCommunityDate };
