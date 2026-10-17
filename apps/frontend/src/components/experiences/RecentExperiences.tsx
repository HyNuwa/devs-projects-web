'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/shadcn';
import { ExperienceCard } from '@/components/experiences/ExperienceCard';
import type { ExperiencesOverview } from '@/lib/experiences-client';

/**
 * «Recién publicadas» (openspec academic-community/experiences): the six
 * newest experiencias of the context, interleaved by publication date.
 */
export function RecentExperiences({
  facultyLabel,
  now,
  onShowAllFaculties,
  overviewKind,
  recent,
}: {
  facultyLabel: string | null;
  now: Date;
  onShowAllFaculties: () => void;
  overviewKind: 'reviews' | 'exams' | null;
  recent: ExperiencesOverview['recent'];
}) {
  const seeAllLabel =
    overviewKind === 'exams'
      ? { href: '/finales', text: 'Ver todos los finales' }
      : overviewKind === 'reviews'
        ? { href: '/resenas', text: 'Ver todas las reseñas' }
        : null;

  return (
    <section aria-labelledby="recent-experiences-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            className="font-sans text-[1.625rem] font-extrabold leading-tight tracking-[-0.035em] text-foreground"
            id="recent-experiences-title"
          >
            Recién publicadas
          </h2>
          <p className="mt-1 font-sans text-sm font-medium text-muted-foreground">
            Las últimas experiencias de {facultyLabel ?? 'todas las facultades'}.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          {seeAllLabel ? (
            <Link
              className="inline-flex min-h-11 items-center gap-1.5 font-sans text-[0.8125rem] font-bold text-link outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring"
              href={seeAllLabel.href}
            >
              {seeAllLabel.text}
              <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={2.4} />
            </Link>
          ) : (
            <>
              <Link
                className="inline-flex min-h-11 items-center gap-1.5 font-sans text-[0.8125rem] font-bold text-link outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring"
                href="/resenas"
              >
                Ver todas las reseñas
                <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={2.4} />
              </Link>
              <Link
                className="inline-flex min-h-11 items-center gap-1.5 font-sans text-[0.8125rem] font-bold text-link outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring"
                href="/finales"
              >
                Ver todos los finales
                <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={2.4} />
              </Link>
            </>
          )}
        </div>
      </div>

      {recent.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border-[1.5px] border-foreground bg-card px-6 py-8 text-center">
          <p className="font-sans text-lg font-bold text-card-foreground">
            Todavía no hay experiencias en {facultyLabel ?? 'todas las facultades'}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/experiencias/escribir">Escribir la primera</Link>
            </Button>
            {facultyLabel ? (
              <Button onClick={onShowAllFaculties} variant="outline">
                Ver las de todas las facultades
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recent.map((entry) => (
            <ExperienceCard
              entry={entry}
              key={entry.kind === 'review' ? entry.review.id : entry.exam.id}
              now={now}
            />
          ))}
        </div>
      )}
    </section>
  );
}
