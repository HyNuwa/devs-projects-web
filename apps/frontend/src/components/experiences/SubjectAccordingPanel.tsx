import Link from 'next/link';

import { CourseResultsBreakdown, SummaryMetric } from '@/components/experiences/SubjectSummary';
import type { ExperienceRecentEntry, SubjectExperiencesSummary } from '@/lib/experiences-client';
import { difficultyLabel, examFormatLabel } from '@/lib/presentation-labels';

const numberFormatter = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });
const decimalFormatter = new Intl.NumberFormat('es-AR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

function answersLabel(count: number) {
  return `${numberFormatter.format(count)} ${count === 1 ? 'respuesta' : 'respuestas'}`;
}

/**
 * The per-type «La materia según…» panel used on a single public experience:
 * only the API-published values for the matching half, nothing recomputed.
 */
export function SubjectAccordingPanel({
  kind,
  summary,
}: {
  kind: ExperienceRecentEntry['kind'];
  summary: SubjectExperiencesSummary;
}) {
  const code = summary.subject.code;
  const isReview = kind === 'review';
  const reviews = summary.reviews;
  const exams = summary.exams;
  const count = isReview ? reviews.count : exams.count;

  return (
    <section className="rounded-xl border-[1.5px] border-line bg-card px-5 py-4">
      <h2 className="font-sans text-lg font-extrabold leading-tight text-foreground">
        {isReview
          ? `La materia según ${numberFormatter.format(count)} ${
              count === 1 ? 'reseña' : 'reseñas'
            }`
          : `La materia según ${numberFormatter.format(count)} ${
              count === 1 ? 'final' : 'finales'
            }`}
      </h2>

      {isReview ? (
        <div className="mt-3 grid gap-3">
          {reviews.recommendation.average !== null ? (
            <SummaryMetric
              label="Recomendación"
              value={`${decimalFormatter.format(reviews.recommendation.average)}/5 · ${answersLabel(
                reviews.recommendation.count,
              )}`}
            />
          ) : null}
          {reviews.difficulty.top !== null ? (
            <SummaryMetric
              label="Dificultad"
              value={`Dificultad más elegida: ${difficultyLabel(reviews.difficulty.top)}`}
            />
          ) : null}
          <CourseResultsBreakdown results={reviews.results} />
        </div>
      ) : (
        <div className="mt-3 grid gap-3">
          <SummaryMetric
            label="Resultado"
            value={
              exams.outcomes.answered > 0
                ? `aprobaron ${numberFormatter.format(exams.outcomes.aprobado)} de ${numberFormatter.format(
                    exams.outcomes.answered,
                  )}`
                : 'Sin resultados declarados'
            }
          />
          {exams.formats.top !== null ? (
            <SummaryMetric
              label="Formato"
              value={`Formato más común: ${examFormatLabel(exams.formats.top)}`}
            />
          ) : null}
          {exams.theory.average !== null ? (
            <SummaryMetric
              label="Teoría"
              value={`${decimalFormatter.format(exams.theory.average)}/5 · ${answersLabel(
                exams.theory.count,
              )}`}
            />
          ) : null}
          {exams.practice.average !== null ? (
            <SummaryMetric
              label="Práctica"
              value={`${decimalFormatter.format(exams.practice.average)}/5 · ${answersLabel(
                exams.practice.count,
              )}`}
            />
          ) : null}
        </div>
      )}

      {code ? (
        <Link
          className="mt-4 inline-flex font-sans text-sm font-bold text-primary underline-offset-4 hover:underline"
          href={`/experiencias/${encodeURIComponent(code)}`}
        >
          Ver todas las experiencias
        </Link>
      ) : null}
    </section>
  );
}
