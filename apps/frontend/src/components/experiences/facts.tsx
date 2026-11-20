import { Star } from 'lucide-react';

import {
  estimateStudyHours,
  formatMesa,
  formatPreparation,
  formatResultWithGrade,
  formatStudyEstimate,
  formatTheoryPractice,
} from '@/components/experiences/format';
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
import type {
  CommunityDifficulty,
  CourseAttempt,
  CourseCondition,
  ExamFormat,
  ExamOutcome,
  ExamSession,
  Shift,
} from '@/types/subject';

export type FactEntries = Array<[label: string, value: string | null | undefined]>;

export function formatCommunityDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(date);
}

export function CommunityFactList({
  className,
  facts,
}: {
  className?: string;
  facts: FactEntries;
}) {
  const knownFacts = facts.filter(([, value]) => value);

  if (knownFacts.length === 0) {
    return null;
  }

  return (
    <dl className={cn('mt-5 flex flex-wrap gap-2', className)}>
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

export function StarRecommendation({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <span
      aria-label={`Recomendación: ${safeValue} de 5 estrellas`}
      className="flex gap-0.5 text-primary"
      role="img"
    >
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

type Known<T> = T | null | undefined;

/** The reseña facts a detail or a form preview presents; unknown facts are left out. */
export interface CourseReviewFactValues {
  academicYear?: Known<number>;
  attempt?: Known<CourseAttempt>;
  condition?: Known<CourseCondition>;
  difficulty?: Known<CommunityDifficulty | number>;
  professorName?: Known<string>;
  promotionGrade?: Known<number>;
  shift?: Known<Shift>;
}

/** The final facts a detail or a form preview presents; unknown facts are left out. */
export interface ExamExperienceFactValues {
  boardSize?: Known<number>;
  difficulty?: Known<CommunityDifficulty>;
  difficultyPractice?: Known<number>;
  difficultyTheory?: Known<number>;
  durationMinutes?: Known<number>;
  estimatedStudyHours?: Known<number>;
  examDate?: Known<string>;
  examinerName?: Known<string>;
  format?: Known<ExamFormat>;
  grade?: Known<number>;
  outcome?: Known<ExamOutcome>;
  prepDailyMinutes?: Known<number>;
  prepLeadDays?: Known<number>;
  session?: Known<ExamSession>;
  shift?: Known<Shift>;
  year?: Known<number>;
}

const known = <T,>(value: Known<T>): value is T => value !== null && value !== undefined;

/** Reseña facts in detail order: ciclo, resultado (with its nota), situación, franja, dificultad, profesor. */
export function courseReviewFacts(review: CourseReviewFactValues): FactEntries {
  return [
    ['Año de cursada', review.academicYear ? `Cursada ${review.academicYear}` : null],
    [
      'Resultado de cursada',
      review.condition
        ? formatResultWithGrade(
            courseConditionLabel(review.condition),
            review.condition === 'PROMO' ? review.promotionGrade : null,
          )
        : null,
    ],
    ['Situación de cursada', review.attempt ? courseAttemptLabel(review.attempt) : null],
    // A stored reseña without franja reads «No informado»; a form not yet answered shows nothing.
    ['Franja horaria', review.shift === undefined ? null : shiftLabel(review.shift)],
    ['Dificultad', known(review.difficulty) ? difficultyLabel(review.difficulty) : null],
    ['Profesor', review.professorName ? `Profesor: ${review.professorName}` : null],
  ];
}

/**
 * Final facts in detail order, legacy date, franja and verbal dificultad
 * included when an older final carries them.
 */
export function examExperienceFacts(exam: ExamExperienceFactValues): FactEntries {
  const examDate = exam.examDate ? formatCommunityDate(exam.examDate) : null;
  const studyHours =
    exam.estimatedStudyHours ?? estimateStudyHours(exam.prepLeadDays, exam.prepDailyMinutes);
  return [
    ['Año de final', exam.year ? `Final ${exam.year}` : null],
    ['Período', exam.session ? examPeriodLabel(exam.session) : null],
    ['Formato', exam.format ? examFormatLabel(exam.format) : null],
    ['Fecha exacta', examDate ? `Fecha: ${examDate}` : null],
    ['Franja horaria', exam.shift ? shiftLabel(exam.shift) : null],
    ['Profesor o examinador', exam.examinerName ? `Tomó: ${exam.examinerName}` : null],
    [
      'Dificultad de teoría y de práctica',
      formatTheoryPractice(exam.difficultyTheory, exam.difficultyPractice),
    ],
    ['Dificultad', exam.difficulty ? difficultyLabel(exam.difficulty) : null],
    ['Resultado', exam.outcome ? examOutcomeLabel(exam.outcome) : null],
    ['Nota', known(exam.grade) ? `Nota: ${exam.grade}` : null],
    ['La mesa', formatMesa(exam.boardSize, exam.durationMinutes)],
    ['Preparación', formatPreparation(exam.prepLeadDays, exam.prepDailyMinutes)],
    ['Estudio estimado', known(studyHours) ? formatStudyEstimate(studyHours) : null],
  ];
}

/** «Temas que tomaron» as chips; nothing when the final declared none. */
export function ExamTopicChips({
  className,
  headingLevel = 'h2',
  id,
  topics,
}: {
  className?: string;
  headingLevel?: 'h2' | 'h3' | 'h4';
  id: string;
  topics: readonly string[];
}) {
  if (topics.length === 0) return null;
  const Heading = headingLevel;
  return (
    <section aria-labelledby={id} className={cn('mt-6', className)}>
      <Heading className="font-sans text-lg font-bold text-card-foreground" id={id}>
        Temas que tomaron
      </Heading>
      <ul aria-labelledby={id} className="mt-3 flex flex-wrap gap-2">
        {topics.map((topic) => (
          <li key={topic}>
            <Chip tone="neutral">{topic}</Chip>
          </li>
        ))}
      </ul>
    </section>
  );
}
