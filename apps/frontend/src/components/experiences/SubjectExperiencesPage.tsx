'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { ChevronRight, FolderOpen } from 'lucide-react';

import { ExperienceTabs } from '@/components/experiences/ExperienceTabs';
import { SubjectSummary } from '@/components/experiences/SubjectSummary';
import { WriteExperienceMenu } from '@/components/experiences/WriteExperienceMenu';
import { Button, EmptyState, ErrorState, LoadingState } from '@/components/ui/shadcn';
import { parseSubjectExperiencesState } from '@/lib/subject-experiences-state';
import { placementEyebrow, trailPlacement } from '@/lib/subject-context';
import { useSubjectExperiencesSummary } from '@/lib/use-subject-experiences-summary';
import { useUbicacionStore } from '@/stores/ubicacionStore';
import type { SubjectHub } from '@/types/subject';

/**
 * The materia experiencias page (openspec academic-community/experiences):
 * breadcrumb trail, placement eyebrow, resource link, writing menu, the shared
 * summary and the two public lists.
 */
export function SubjectExperiencesPage({ code, subject }: { code: string; subject: SubjectHub }) {
  const searchParams = useSearchParams();
  const myCareers = useUbicacionStore((store) => store.myCareers);
  const state = useMemo(() => parseSubjectExperiencesState(searchParams), [searchParams]);
  const { retry, state: summary } = useSubjectExperiencesSummary(code);

  const trail = trailPlacement(subject.studyPlans, state.careerId, myCareers);
  const career = trail?.studyPlan.career ?? null;
  const eyebrow = placementEyebrow(trail);

  const empty =
    summary.status === 'ready' &&
    summary.summary.reviews.count === 0 &&
    summary.summary.exams.count === 0;

  return (
    <div className="mx-auto w-full max-w-[1180px] px-3 pb-12 pt-6 sm:px-6">
      <nav
        aria-label="Ruta"
        className="flex flex-wrap items-center gap-1.5 font-sans text-sm font-semibold text-muted-foreground"
      >
        <Link className="text-primary underline-offset-4 hover:underline" href="/experiencias">
          Experiencias
        </Link>
        {career ? (
          <>
            <ChevronRight aria-hidden="true" className="size-3.5" />
            <span>{career.name}</span>
          </>
        ) : null}
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <span aria-current="page" className="text-foreground">
          {subject.name}
        </span>
      </nav>

      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="font-mono text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-primary">
              {`Experiencias · ${eyebrow}`}
            </p>
          ) : null}
          <h1 className="mt-1 max-w-[22ch] font-sans text-[clamp(2.5rem,5vw,4.375rem)] font-extrabold leading-[0.96] tracking-[-0.03em] text-foreground">
            {subject.name}
          </h1>
          <div className="mt-3">
            <Button asChild variant="outline">
              <Link href={`/materias/${encodeURIComponent(code)}`}>
                <FolderOpen aria-hidden="true" />
                Ver recursos de la materia
              </Link>
            </Button>
          </div>
        </div>
        <div className="shrink-0">
          <WriteExperienceMenu code={code} />
        </div>
      </header>

      <div className="mt-8 grid gap-8">
        {summary.status === 'loading' ? (
          <LoadingState description="Cargando el resumen de la materia." />
        ) : summary.status === 'error' ? (
          <ErrorState
            action={
              <Button onClick={retry} variant="outline">
                Reintentar
              </Button>
            }
            description="No pudimos cargar el resumen. Las experiencias siguen disponibles abajo."
            heading="No pudimos cargar el resumen"
          />
        ) : empty ? (
          <EmptyState
            action={<WriteExperienceMenu code={code} label="Escribir la primera" />}
            description="Sé quien cuente primero cómo le fue en esta materia. Podés publicar como anónimo."
            heading={`Nadie contó todavía cómo le fue en ${subject.name}`}
          />
        ) : (
          <SubjectSummary summary={summary.summary} />
        )}

        {empty ? null : (
          <ExperienceTabs
            code={code}
            examCount={summary.status === 'ready' ? summary.summary.exams.count : undefined}
            reviewCount={summary.status === 'ready' ? summary.summary.reviews.count : undefined}
            state={state}
            subject={subject}
          />
        )}
      </div>
    </div>
  );
}
