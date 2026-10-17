import type { SubjectExperiencesSummary } from '@/lib/experiences-client';
import {
  communityDifficultyLabels,
  difficultyLabel,
  examFormatLabel,
  examPeriodLabel,
} from '@/lib/presentation-labels';
import { cn } from '@/components/ui/shadcn/utils';

const numberFormatter = new Intl.NumberFormat('es-AR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});
const decimalFormatter = new Intl.NumberFormat('es-AR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

const difficultyOrder = ['MUY_BAJA', 'BAJA', 'MEDIA', 'ALTA', 'MUY_ALTA'] as const;
const formatOrder = ['ESCRITO', 'ORAL', 'MIXTO'] as const;

type SummaryResults = SubjectExperiencesSummary['reviews']['results'];
const answersLabel = (count: number) =>
  `${numberFormatter.format(count)} ${count === 1 ? 'respuesta' : 'respuestas'}`;

/**
 * The four-figure header, exported so the materia hub can reuse the exact same
 * presentation (openspec academic-community/experiences).
 */
export function SummaryFigures({ summary }: { summary: SubjectExperiencesSummary }) {
  const { exams, reviews } = summary;
  const outcomes = exams.outcomes;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-4">
      <Figure label="reseñas de cursada" value={numberFormatter.format(reviews.count)} />
      <Figure label="experiencias de final" value={numberFormatter.format(exams.count)} />
      <Figure
        detail={
          reviews.recommendation.count > 0 ? answersLabel(reviews.recommendation.count) : undefined
        }
        label="recomendación"
        value={
          reviews.recommendation.average !== null
            ? `${decimalFormatter.format(reviews.recommendation.average)}/5`
            : '—'
        }
      />
      <Figure
        label="aprobaron"
        value={
          outcomes.answered > 0
            ? `${numberFormatter.format(outcomes.aprobado)} de ${numberFormatter.format(
                outcomes.answered,
              )}`
            : '—'
        }
      />
    </div>
  );
}

/** Result breakdown shared by the subject summary and the detail body. */
export function CourseResultsBreakdown({ results }: { results: SummaryResults }) {
  const rows: { count: number; label: string; percent: number | null }[] = [
    { count: results.promo, label: 'Promoción', percent: results.percents?.promo ?? null },
    { count: results.regular, label: 'Regular', percent: results.percents?.regular ?? null },
    { count: results.libre, label: 'Libre', percent: results.percents?.libre ?? null },
  ];
  return (
    <section aria-label="Cómo terminó la cursada">
      <h3 className="font-sans text-sm font-extrabold text-card-foreground">
        Cómo terminó la cursada
      </h3>
      {results.answered === 0 ? (
        <p className="mt-2 font-sans text-sm font-semibold text-muted-foreground">
          Todavía nadie contó cómo le fue al terminar la cursada.
        </p>
      ) : results.percents ? (
        <ul className="mt-2 grid gap-1.5" role="list">
          {rows.map((row) => (
            <ResultBar
              key={row.label}
              count={row.count}
              label={row.label}
              percent={row.percent ?? 0}
            />
          ))}
        </ul>
      ) : (
        <div className="mt-2">
          <p className="font-sans text-sm font-extrabold text-card-foreground">
            {`${numberFormatter.format(results.promo)} de ${numberFormatter.format(
              results.answered,
            )} ${results.promo === 1 ? 'promocionó' : 'promocionaron'}`}
          </p>
          <ul
            className="mt-1.5 grid gap-1 font-sans text-sm font-semibold text-card-foreground"
            role="list"
          >
            {rows.map((row) => (
              <li className="flex items-baseline justify-between gap-3" key={row.label}>
                <span>{row.label}</span>
                <span>{numberFormatter.format(row.count)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-2 font-sans text-xs font-semibold text-muted-foreground">
        {results.answered > 0
          ? `${numberFormatter.format(results.answered)} contaron el resultado · `
          : ''}
        {numberFormatter.format(results.unanswered)}{' '}
        {results.unanswered === 1 ? 'prefirió no responder' : 'prefirieron no responder'}
      </p>
    </section>
  );
}

/**
 * The materia summary, presentation only (openspec
 * academic-community/experiences «Materia summary»): every threshold, mode,
 * average and percent comes already computed from the API; nothing null turns
 * into a fabricated number here.
 */
export function SubjectSummary({ summary }: { summary: SubjectExperiencesSummary }) {
  const { exams, reviews } = summary;
  const total = reviews.count + exams.count;
  const outcomes = exams.outcomes;

  return (
    <section
      aria-label={`Resumen de experiencias de ${summary.subject.name}`}
      className="overflow-hidden rounded-xl border-[1.5px] border-foreground bg-card"
    >
      <header className="border-b-[1.5px] border-line px-5 pb-4 pt-5 sm:px-6">
        <p className="font-mono text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-primary">
          Cómo les fue
        </p>
        <h2 className="mt-1.5 font-sans text-2xl font-extrabold tracking-[-0.02em] text-card-foreground">
          Resumen de {numberFormatter.format(total)} experiencias
        </h2>
        <div className="mt-4">
          <SummaryFigures summary={summary} />
        </div>
      </header>

      <div className="grid gap-6 px-5 py-5 sm:px-6 lg:grid-cols-3">
        <CourseResultsBreakdown results={reviews.results} />

        <section aria-label="Dificultad de la cursada">
          <h3 className="font-sans text-sm font-extrabold text-card-foreground">
            Dificultad de la cursada
          </h3>
          <ul className="mt-2 grid gap-1.5" role="list">
            {difficultyOrder.map((level) => (
              <CountBar
                count={reviews.difficulty.counts[level]}
                highlight={reviews.difficulty.top === level}
                key={level}
                label={communityDifficultyLabels[level]}
                max={reviews.difficulty.answered}
              />
            ))}
          </ul>
          <p className="mt-2 font-sans text-xs font-semibold text-muted-foreground">
            {reviews.difficulty.top
              ? `La más elegida: ${difficultyLabel(reviews.difficulty.top)}`
              : 'Todavía no hay suficientes respuestas para nombrar una.'}
            {` · ${numberFormatter.format(reviews.difficulty.unanswered)} ${
              reviews.difficulty.unanswered === 1 ? 'no la indicó' : 'no la indicaron'
            }`}
          </p>
        </section>

        <section aria-label="El final">
          <h3 className="font-sans text-sm font-extrabold text-card-foreground">El final</h3>
          <ul className="mt-2 grid gap-1.5" role="list">
            {formatOrder.map((format) => (
              <CountBar
                count={exams.formats.counts[format]}
                highlight={exams.formats.top === format}
                key={format}
                label={examFormatLabel(format)}
                max={exams.count}
              />
            ))}
          </ul>

          <dl className="mt-4 grid gap-2 font-sans text-sm font-semibold text-card-foreground">
            <SummaryMetric
              label="Aprobación"
              value={
                outcomes.answered > 0
                  ? `aprobaron ${numberFormatter.format(outcomes.aprobado)} de ${numberFormatter.format(outcomes.answered)}`
                  : 'sin datos declarados'
              }
            />
            {outcomes.undeclared > 0 ? (
              <SummaryMetric
                label="Sin declarar"
                value={`${numberFormatter.format(outcomes.undeclared)} sin resultado declarado`}
              />
            ) : null}
            <SummaryMetric
              label="Teoría"
              value={
                exams.theory.average !== null
                  ? `${decimalFormatter.format(exams.theory.average)}/5 · ${answersLabel(exams.theory.count)}`
                  : `${answersLabel(exams.theory.count)}`
              }
            />
            <SummaryMetric
              label="Práctica"
              value={
                exams.practice.average !== null
                  ? `${decimalFormatter.format(exams.practice.average)}/5 · ${answersLabel(exams.practice.count)}`
                  : `${answersLabel(exams.practice.count)}`
              }
            />
            <SummaryMetric
              label="Mesa más comentada"
              value={
                exams.topSession
                  ? `${examPeriodLabel(exams.topSession.session)} · ${numberFormatter.format(exams.topSession.count)}`
                  : 'sin suficientes respuestas'
              }
            />
            <SummaryMetric
              label="Nota promedio"
              value={
                exams.grade.average !== null
                  ? `${decimalFormatter.format(exams.grade.average)} · ${numberFormatter.format(exams.grade.count)} notas`
                  : `${numberFormatter.format(exams.grade.count)} notas`
              }
            />
          </dl>
        </section>
      </div>
    </section>
  );
}

function Figure({ detail, label, value }: { detail?: string; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-sans text-[1.75rem] font-extrabold leading-none tracking-[-0.03em] text-card-foreground">
        {value}
      </p>
      <p className="mt-1 font-sans text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
        {detail ? ` · ${detail}` : ''}
      </p>
    </div>
  );
}

function ResultBar({ count, label, percent }: { count: number; label: string; percent: number }) {
  return (
    <li className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-2">
      <span className="truncate font-sans text-xs font-semibold text-card-foreground">{label}</span>
      <span
        aria-label={`${label}: ${percent}%`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percent}
        className="h-2 rounded-full bg-muted"
        role="meter"
      >
        <span className="block h-2 rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </span>
      <span className="text-right font-sans text-xs font-semibold text-card-foreground">
        {percent}% · {numberFormatter.format(count)}
      </span>
    </li>
  );
}

function CountBar({
  count,
  highlight,
  label,
  max,
}: {
  count: number;
  highlight: boolean;
  label: string;
  max: number;
}) {
  // Zero stays a real zero: widths are only diagram proportions, never
  // fabricated percentages, and the meter always reports a valid range.
  const width = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <li className="grid grid-cols-[6rem_1fr_2rem] items-center gap-2">
      <span
        className={cn(
          'truncate font-sans text-xs font-semibold',
          highlight ? 'text-card-foreground' : 'text-muted-foreground',
        )}
      >
        {label}
      </span>
      <span
        aria-label={`${label}: ${count}`}
        aria-valuemax={Math.max(max, 1)}
        aria-valuemin={0}
        aria-valuenow={count}
        className="h-2 rounded-full bg-muted"
        role="meter"
      >
        <span
          className={cn('block h-2 rounded-full', highlight ? 'bg-primary' : 'bg-primary/45')}
          style={{ width: `${width}%` }}
        />
      </span>
      <span className="text-right font-mono text-[0.7rem] font-bold text-card-foreground">
        {numberFormatter.format(count)}
      </span>
    </li>
  );
}

export function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="font-sans text-sm font-semibold text-muted-foreground">{label}</dt>
      <dd className="text-right font-sans text-sm font-extrabold text-card-foreground">{value}</dd>
    </div>
  );
}
