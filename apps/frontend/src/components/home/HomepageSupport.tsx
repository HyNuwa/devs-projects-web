'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpenText, FileText, MessageCircle, Upload } from 'lucide-react';

import { getCourseReviewDiscovery, getMaterialDiscovery } from '@/lib/discovery-client';
import type { DiscoveryCourseReview, DiscoverySubjectLink } from '@/types/discovery';
import type { Material, MaterialResourceType } from '@/types/material';

type SupportBlock<T> = { status: 'ready'; data: T } | { status: 'error' };

type HomepageSupportState =
  | { status: 'loading' }
  | {
      status: 'ready';
      recentMaterials: SupportBlock<Material[]>;
      finalMaterials: SupportBlock<Material[]>;
      reviews: SupportBlock<DiscoveryCourseReview[]>;
    };

const resourceTypeLabels: Record<MaterialResourceType, string> = {
  PARCIAL: 'Parcial',
  FINAL: 'Final',
  APUNTE: 'Apunte',
  RESUMEN: 'Resumen',
  TRABAJO_PRACTICO: 'Trabajo práctico',
  GUIA_EJERCICIOS: 'Guía de ejercicios',
  OTRO: 'Otro recurso',
};

function toBlockState<T>(result: PromiseSettledResult<T>): SupportBlock<T> {
  if (result.status === 'fulfilled') {
    return { status: 'ready', data: result.value };
  }

  return { status: 'error' };
}

function toSearchHref(parameters: Record<string, string>) {
  return `/buscar?${new URLSearchParams(parameters).toString()}`;
}

function getDistinctSubjects(materials: Material[]): DiscoverySubjectLink[] {
  const subjects = new Map<string, DiscoverySubjectLink>();

  for (const material of materials) {
    if (!subjects.has(material.subject.id)) {
      subjects.set(material.subject.id, {
        ...material.subject,
        href: toSearchHref({ q: material.subject.name, subjectId: material.subject.id }),
      });
    }
  }

  return [...subjects.values()].slice(0, 3);
}

function ResourceRows({ materials }: { materials: Material[] }) {
  return (
    <div className="border-t border-line">
      {materials.map((material) => (
        <Link
          className="group grid gap-2 border-b border-line py-4 outline-none transition-colors hover:bg-secondary/70 focus-visible:bg-secondary sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6"
          href={toSearchHref({ q: material.title, subjectId: material.subject.id })}
          key={material.id}
        >
          <span className="min-w-0 px-1 sm:px-3">
            <span className="block truncate font-serif text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary sm:text-2xl">
              {material.title}
            </span>
            <span className="mt-1 block text-sm text-secondary-foreground">
              {material.subject.name}
            </span>
          </span>
          <span className="flex items-center gap-2 px-1 font-mono text-[0.68rem] font-bold uppercase tracking-[0.06em] text-primary sm:px-3">
            <FileText aria-hidden="true" className="size-4" strokeWidth={1.8} />
            {resourceTypeLabels[material.resourceType]}
          </span>
        </Link>
      ))}
    </div>
  );
}

function SectionFailure({ description }: { description: string }) {
  return (
    <p className="border-y border-dashed border-border py-5 font-sans text-sm leading-relaxed text-secondary-foreground">
      {description}
    </p>
  );
}

function ReviewRows({ reviews }: { reviews: DiscoveryCourseReview[] }) {
  return (
    <div className="border-t border-line">
      {reviews.map((review) => (
        <article className="border-b border-line py-5" key={review.id}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
            <Link
              className="font-serif text-2xl font-bold leading-tight text-foreground underline decoration-primary/35 underline-offset-4 outline-none transition-colors hover:text-primary focus-visible:text-primary"
              href={review.subject.href}
            >
              {review.subject.name}
            </Link>
            <span
              aria-label={`${review.recommendation} de 5 estrellas`}
              className="font-mono text-sm font-bold text-primary"
            >
              {review.recommendation} ★
            </span>
          </div>
          <p className="mt-2 text-sm text-secondary-foreground">
            {review.author.username}
            {review.academicYear ? ` · ${review.academicYear}` : ''}
            {review.professor?.name || review.professorName
              ? ` · ${review.professor?.name ?? review.professorName}`
              : ''}
          </p>
          {review.excerpt ? (
            <p className="mt-4 line-clamp-3 max-w-[68ch] font-serif text-lg leading-relaxed text-foreground">
              {review.excerpt}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export function HomepageSupport() {
  const [state, setState] = useState<HomepageSupportState>({ status: 'loading' });

  useEffect(() => {
    let isCurrentRequest = true;

    void Promise.allSettled([
      getMaterialDiscovery({ limit: 6, sort: 'RECENT' }),
      getMaterialDiscovery({ limit: 3, resourceType: 'FINAL' }),
      getCourseReviewDiscovery({ limit: 2 }),
    ]).then(([recentMaterials, finalMaterials, reviews]) => {
      if (!isCurrentRequest) {
        return;
      }

      setState({
        status: 'ready',
        recentMaterials: toBlockState(
          recentMaterials.status === 'fulfilled'
            ? { ...recentMaterials, value: recentMaterials.value.data }
            : recentMaterials,
        ),
        finalMaterials: toBlockState(
          finalMaterials.status === 'fulfilled'
            ? { ...finalMaterials, value: finalMaterials.value.data }
            : finalMaterials,
        ),
        reviews: toBlockState(
          reviews.status === 'fulfilled' ? { ...reviews, value: reviews.value.data } : reviews,
        ),
      });
    });

    return () => {
      isCurrentRequest = false;
    };
  }, []);

  const subjects = useMemo(() => {
    if (state.status !== 'ready' || state.recentMaterials.status !== 'ready') {
      return [];
    }

    return getDistinctSubjects(state.recentMaterials.data);
  }, [state]);

  return (
    <div className="border-b border-border bg-background">
      <section
        aria-labelledby="home-recent-subjects"
        className="border-b border-border bg-secondary/55"
      >
        <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-14 sm:px-10 lg:grid-cols-12 lg:gap-12 lg:py-20">
          <div className="lg:col-span-4">
            <BookOpenText aria-hidden="true" className="size-7 text-primary" strokeWidth={1.6} />
            <h2
              className="mt-5 max-w-[12ch] font-serif text-4xl font-bold leading-[0.94] tracking-[-0.035em] text-foreground sm:text-5xl"
              id="home-recent-subjects"
            >
              Materias con materiales recientes.
            </h2>
          </div>
          <div className="lg:col-span-8">
            {state.status === 'loading' ? (
              <p
                aria-live="polite"
                className="border-y border-line py-5 text-sm text-secondary-foreground"
              >
                Cargando las materias publicadas recientemente…
              </p>
            ) : null}

            {state.status === 'ready' && state.recentMaterials.status === 'error' ? (
              <SectionFailure description="No pudimos cargar las materias recientes en este momento." />
            ) : null}

            {state.status === 'ready' &&
            state.recentMaterials.status === 'ready' &&
            subjects.length === 0 ? (
              <p className="border-y border-dashed border-border py-5 text-sm leading-relaxed text-secondary-foreground">
                Todavía no hay materias con materiales públicos recientes.
              </p>
            ) : null}

            {subjects.length > 0 ? (
              <nav
                aria-label="Materias con materiales recientes"
                className="grid border-t border-line sm:grid-cols-3"
              >
                {subjects.map((subject) => (
                  <Link
                    className="group border-b border-line px-0 py-5 outline-none transition-colors hover:bg-background focus-visible:bg-background sm:border-r sm:px-5 sm:last:border-r-0"
                    href={subject.href}
                    key={subject.id}
                  >
                    <span className="block font-serif text-2xl font-bold leading-tight text-foreground group-hover:text-primary">
                      {subject.name}
                    </span>
                    <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-primary">
                      Ver materiales
                      <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.8} />
                    </span>
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>
        </div>
      </section>

      <section aria-labelledby="home-recent-materials" className="border-b border-border">
        <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-14 sm:px-10 lg:grid-cols-12 lg:gap-12 lg:py-20">
          <div className="lg:col-span-7">
            <h2
              className="max-w-[14ch] font-serif text-4xl font-bold leading-[0.94] tracking-[-0.035em] text-foreground sm:text-5xl"
              id="home-recent-materials"
            >
              Materiales recientes.
            </h2>
            <p className="mt-4 max-w-[48ch] font-serif text-lg leading-relaxed text-secondary-foreground">
              Recursos que se publicaron recientemente para que encuentres un punto de partida.
            </p>
          </div>
          <div className="lg:col-span-5">
            {state.status === 'loading' ? (
              <p
                aria-live="polite"
                className="border-y border-line py-5 text-sm text-secondary-foreground"
              >
                Cargando materiales recientes…
              </p>
            ) : null}
            {state.status === 'ready' && state.recentMaterials.status === 'error' ? (
              <SectionFailure description="No pudimos cargar los materiales recientes en este momento." />
            ) : null}
            {state.status === 'ready' &&
            state.recentMaterials.status === 'ready' &&
            state.recentMaterials.data.length === 0 ? (
              <p className="border-y border-dashed border-border py-5 text-sm leading-relaxed text-secondary-foreground">
                Todavía no hay materiales públicos para mostrar.
              </p>
            ) : null}
            {state.status === 'ready' &&
            state.recentMaterials.status === 'ready' &&
            state.recentMaterials.data.length > 0 ? (
              <ResourceRows materials={state.recentMaterials.data.slice(0, 3)} />
            ) : null}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="home-final-materials"
        className="border-b border-border bg-muted/45"
      >
        <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-14 sm:px-10 lg:grid-cols-12 lg:gap-12 lg:py-20">
          <div className="lg:col-span-4">
            <FileText aria-hidden="true" className="size-7 text-primary" strokeWidth={1.6} />
            <h2
              className="mt-5 max-w-[12ch] font-serif text-4xl font-bold leading-[0.94] tracking-[-0.035em] text-foreground sm:text-5xl"
              id="home-final-materials"
            >
              Finales para preparar.
            </h2>
          </div>
          <div className="lg:col-span-8">
            {state.status === 'loading' ? (
              <p
                aria-live="polite"
                className="border-y border-line py-5 text-sm text-secondary-foreground"
              >
                Cargando finales publicados…
              </p>
            ) : null}
            {state.status === 'ready' && state.finalMaterials.status === 'error' ? (
              <SectionFailure description="No pudimos cargar los finales en este momento." />
            ) : null}
            {state.status === 'ready' &&
            state.finalMaterials.status === 'ready' &&
            state.finalMaterials.data.length === 0 ? (
              <p className="border-y border-dashed border-border py-5 text-sm leading-relaxed text-secondary-foreground">
                Todavía no hay finales públicos para mostrar.
              </p>
            ) : null}
            {state.status === 'ready' &&
            state.finalMaterials.status === 'ready' &&
            state.finalMaterials.data.length > 0 ? (
              <ResourceRows materials={state.finalMaterials.data} />
            ) : null}
          </div>
        </div>
      </section>

      <section aria-labelledby="home-student-experiences" className="border-b border-border">
        <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-14 sm:px-10 lg:grid-cols-12 lg:gap-12 lg:py-20">
          <div className="lg:col-span-4">
            <MessageCircle aria-hidden="true" className="size-7 text-primary" strokeWidth={1.6} />
            <h2
              className="mt-5 max-w-[11ch] font-serif text-4xl font-bold leading-[0.94] tracking-[-0.035em] text-foreground sm:text-5xl"
              id="home-student-experiences"
            >
              Experiencias de estudiantes.
            </h2>
          </div>
          <div className="lg:col-span-8">
            {state.status === 'loading' ? (
              <p
                aria-live="polite"
                className="border-y border-line py-5 text-sm text-secondary-foreground"
              >
                Cargando experiencias publicadas…
              </p>
            ) : null}
            {state.status === 'ready' && state.reviews.status === 'error' ? (
              <SectionFailure description="No pudimos cargar las experiencias en este momento." />
            ) : null}
            {state.status === 'ready' &&
            state.reviews.status === 'ready' &&
            state.reviews.data.length === 0 ? (
              <p className="border-y border-dashed border-border py-5 text-sm leading-relaxed text-secondary-foreground">
                Todavía no hay experiencias publicadas para mostrar.
              </p>
            ) : null}
            {state.status === 'ready' &&
            state.reviews.status === 'ready' &&
            state.reviews.data.length > 0 ? (
              <ReviewRows reviews={state.reviews.data} />
            ) : null}
          </div>
        </div>
      </section>

      <section aria-labelledby="home-contribution" className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-14 sm:px-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:py-20">
          <div>
            <Upload aria-hidden="true" className="size-7" strokeWidth={1.6} />
            <h2
              className="mt-5 max-w-[18ch] font-serif text-4xl font-bold leading-[0.94] tracking-[-0.035em] sm:text-5xl"
              id="home-contribution"
            >
              ¿Tenés un recurso que puede ayudar?
            </h2>
            <p className="mt-5 max-w-[54ch] font-serif text-lg leading-relaxed text-primary-foreground">
              Compartilo con la comunidad. Se podrá consultar cuando esté publicado.
            </p>
          </div>
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 border border-primary-foreground bg-primary-foreground px-5 py-2 font-sans text-base font-bold tracking-[0.02em] text-primary outline-none transition-colors hover:bg-primary-foreground/90 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            href="/materiales/nuevo"
          >
            Subir material
            <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.8} />
          </Link>
        </div>
      </section>
    </div>
  );
}
