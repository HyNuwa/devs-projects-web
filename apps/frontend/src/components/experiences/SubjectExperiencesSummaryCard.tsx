'use client';

import Link from 'next/link';

import { SummaryFigures } from '@/components/experiences/SubjectSummary';
import { Button } from '@/components/ui/shadcn';
import { useSubjectExperiencesSummary } from '@/lib/use-subject-experiences-summary';

/**
 * The materia hub's experiences card: the four shared figures, a link to the
 * subject experiences page and direct write actions (openspec
 * academic-community/experiences). Its failure never blocks materials.
 */
export function SubjectExperiencesSummaryCard({
  careerId,
  code,
}: {
  careerId?: string | null;
  code: string;
}) {
  const { retry, state } = useSubjectExperiencesSummary(code);
  const encoded = encodeURIComponent(code);

  return (
    <section
      aria-label="Experiencias de la materia"
      className="grid gap-4 rounded-xl border-[1.5px] border-line bg-card px-5 py-4"
    >
      {state.status === 'loading' ? (
        <p className="font-sans text-sm font-semibold text-muted-foreground" role="status">
          Cargando experiencias…
        </p>
      ) : null}
      {state.status === 'error' ? (
        <div className="flex flex-wrap items-center gap-3" role="alert">
          <p className="font-sans text-sm font-semibold text-muted-foreground">
            No pudimos cargar las experiencias de esta materia.
          </p>
          <Button onClick={retry} size="sm" variant="outline">
            Reintentar
          </Button>
        </div>
      ) : null}
      {state.status === 'ready' ? <SummaryFigures summary={state.summary} /> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          className="min-h-11 inline-flex items-center font-sans text-sm font-bold text-primary underline-offset-4 hover:underline"
          href={`/experiencias/${encoded}${careerId ? `?carrera=${encodeURIComponent(careerId)}` : ''}`}
        >
          Ver experiencias
        </Link>
        <Button asChild size="sm" variant="outline">
          <Link href={`/materias/${encoded}/resenar`}>Reseña de cursada</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`/materias/${encoded}/final`}>Experiencia de final</Link>
        </Button>
      </div>
    </section>
  );
}
