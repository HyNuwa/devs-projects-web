'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Filter, SlidersHorizontal, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button, FilterSheet, FilterSheetFieldSet, Input } from '@/components/ui/shadcn';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/shadcn/state';
import { getCourseReviewDiscovery } from '@/lib/discovery-client';
import { courseAttemptLabel, difficultyLabel } from '@/lib/presentation-labels';
import {
  parseCourseReviewDiscoveryState,
  toCourseReviewDiscoveryHref,
  type CourseReviewDiscoveryState,
} from '@/lib/course-review-discovery-state';
import { api } from '@/lib/api';
import { getData } from '@/lib/apiHelpers';
import type { DiscoveryCourseReviewList } from '@/types/discovery';
import type { Paginated } from '@/types/material';
import type { Professor } from '@/types/professor';
import type { CommunityDifficulty, CourseAttempt, Subject } from '@/types/subject';

import { CourseReviewSummaryCard } from './CommunitySummaryCards';

const pageSize = 10;
const difficulties: CommunityDifficulty[] = ['MUY_BAJA', 'BAJA', 'MEDIA', 'ALTA', 'MUY_ALTA'];
const attempts: CourseAttempt[] = [
  'PRIMERA_CURSADA',
  'PRIMERA_RECURSADA',
  'SEGUNDA_O_MAS_RECURSADAS',
  'PREFIERO_NO_RESPONDER',
];
const filterControlClassName =
  'min-h-11 w-full border border-input bg-background px-3 font-sans text-sm text-foreground outline-none shadow-field focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

type ReviewRequestState =
  | { status: 'loading' }
  | { results: DiscoveryCourseReviewList; status: 'ready' }
  | { status: 'error' };

type FilterOptionsState =
  | { status: 'loading' }
  | { professors: Professor[]; status: 'ready'; subjects: Subject[] }
  | { status: 'error' };

type FilterDraft = Pick<
  CourseReviewDiscoveryState,
  'academicYear' | 'attempt' | 'difficulty' | 'professorId' | 'subjectId'
>;

function filterDraftFrom(state: CourseReviewDiscoveryState): FilterDraft {
  return {
    academicYear: state.academicYear,
    attempt: state.attempt,
    difficulty: state.difficulty,
    professorId: state.professorId,
    subjectId: state.subjectId,
  };
}

function hasActiveFilters(state: CourseReviewDiscoveryState) {
  return Boolean(
    state.academicYear || state.attempt || state.difficulty || state.professorId || state.subjectId,
  );
}

function FilterFields({
  draft,
  idPrefix,
  onChange,
  options,
}: {
  draft: FilterDraft;
  idPrefix: string;
  onChange: (draft: FilterDraft) => void;
  options: FilterOptionsState;
}) {
  const professors = options.status === 'ready' ? options.professors : [];
  const subjects = options.status === 'ready' ? options.subjects : [];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <label
        className="grid gap-2 text-sm font-bold text-foreground"
        htmlFor={`${idPrefix}-subject`}
      >
        Materia
        <select
          className={filterControlClassName}
          id={`${idPrefix}-subject`}
          onChange={(event) => onChange({ ...draft, subjectId: event.target.value || undefined })}
          value={draft.subjectId ?? ''}
        >
          <option value="">Todas las materias</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
              {subject.code ? ` · ${subject.code}` : ''}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-bold text-foreground" htmlFor={`${idPrefix}-year`}>
        Año de cursada
        <Input
          id={`${idPrefix}-year`}
          min="1900"
          onChange={(event) => {
            const value = event.target.value === '' ? undefined : Number(event.target.value);
            onChange({ ...draft, academicYear: Number.isInteger(value) ? value : undefined });
          }}
          placeholder="Ej.: 2026"
          type="number"
          value={draft.academicYear ?? ''}
        />
      </label>

      <label
        className="grid gap-2 text-sm font-bold text-foreground"
        htmlFor={`${idPrefix}-difficulty`}
      >
        Dificultad
        <select
          className={filterControlClassName}
          id={`${idPrefix}-difficulty`}
          onChange={(event) =>
            onChange({
              ...draft,
              difficulty: (event.target.value || undefined) as CommunityDifficulty | undefined,
            })
          }
          value={draft.difficulty ?? ''}
        >
          <option value="">Todas las dificultades</option>
          {difficulties.map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficultyLabel(difficulty)}
            </option>
          ))}
        </select>
      </label>

      <label
        className="grid gap-2 text-sm font-bold text-foreground"
        htmlFor={`${idPrefix}-attempt`}
      >
        Situación de cursada
        <select
          className={filterControlClassName}
          id={`${idPrefix}-attempt`}
          onChange={(event) =>
            onChange({
              ...draft,
              attempt: (event.target.value || undefined) as CourseAttempt | undefined,
            })
          }
          value={draft.attempt ?? ''}
        >
          <option value="">Todas las situaciones</option>
          {attempts.map((attempt) => (
            <option key={attempt} value={attempt}>
              {courseAttemptLabel(attempt)}
            </option>
          ))}
        </select>
      </label>

      <label
        className="grid gap-2 text-sm font-bold text-foreground"
        htmlFor={`${idPrefix}-professor`}
      >
        Profesor
        <select
          className={filterControlClassName}
          id={`${idPrefix}-professor`}
          onChange={(event) => onChange({ ...draft, professorId: event.target.value || undefined })}
          value={draft.professorId ?? ''}
        >
          <option value="">Todos los profesores</option>
          {professors.map((professor) => (
            <option key={professor.id} value={professor.id}>
              {professor.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function AverageEvidence({ average, count }: { average: number | null; count: number }) {
  const formattedAverage =
    average === null
      ? 'Sin promedio todavía'
      : new Intl.NumberFormat('es-AR', {
          maximumFractionDigits: 1,
          minimumFractionDigits: 1,
        }).format(average);

  return (
    <dl className="grid grid-cols-2 border border-primary bg-background sm:w-[22rem]">
      <div className="border-r border-primary px-4 py-3">
        <dt className="font-mono text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-primary">
          Promedio
        </dt>
        <dd className="mt-1 flex items-center gap-1 font-serif text-2xl font-bold text-foreground">
          <Star aria-hidden="true" className="size-4 fill-current text-primary" strokeWidth={1.7} />
          {formattedAverage}
        </dd>
      </div>
      <div className="px-4 py-3">
        <dt className="font-mono text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-primary">
          Reseñas
        </dt>
        <dd className="mt-1 font-serif text-2xl font-bold text-foreground">{count}</dd>
      </div>
    </dl>
  );
}

function ReviewListContent({ state }: { state: CourseReviewDiscoveryState }) {
  const router = useRouter();
  const [requestState, setRequestState] = useState<ReviewRequestState>({ status: 'loading' });
  const [filterOptions, setFilterOptions] = useState<FilterOptionsState>({ status: 'loading' });
  const [draftFilters, setDraftFilters] = useState<FilterDraft>(() => filterDraftFrom(state));
  const [requestRetryKey, setRequestRetryKey] = useState(0);
  const [optionsRetryKey, setOptionsRetryKey] = useState(0);
  const filtersAreActive = hasActiveFilters(state);

  useEffect(() => {
    let current = true;

    void Promise.all([
      api.get<Subject[]>('/subjects'),
      api.get<Paginated<Professor>>('/professors', { params: { limit: 100, page: 1 } }),
    ])
      .then(([subjects, professors]) => {
        if (!current) return;
        setFilterOptions({
          professors: getData(professors).data,
          status: 'ready',
          subjects: getData(subjects),
        });
      })
      .catch(() => {
        if (current) setFilterOptions({ status: 'error' });
      });

    return () => {
      current = false;
    };
  }, [optionsRetryKey]);

  useEffect(() => {
    let current = true;

    void getCourseReviewDiscovery({ ...state, limit: pageSize })
      .then((results) => {
        if (current) setRequestState({ results, status: 'ready' });
      })
      .catch(() => {
        if (current) setRequestState({ status: 'error' });
      });

    return () => {
      current = false;
    };
  }, [requestRetryKey, state]);

  const updateState = (nextState: CourseReviewDiscoveryState) => {
    router.push(toCourseReviewDiscoveryHref(nextState));
  };
  const applyFilters = () => updateState({ ...state, ...draftFilters, page: 1 });
  const clearDraftFilters = () => setDraftFilters({});
  const clearFilters = () =>
    updateState({
      ...state,
      academicYear: undefined,
      attempt: undefined,
      difficulty: undefined,
      page: 1,
      professorId: undefined,
      subjectId: undefined,
    });
  const clearFilter = (key: keyof FilterDraft) =>
    updateState({ ...state, [key]: undefined, page: 1 });
  const retryResults = () => {
    setRequestState({ status: 'loading' });
    setRequestRetryKey((value) => value + 1);
  };
  const retryOptions = () => setOptionsRetryKey((value) => value + 1);

  const knownSubjects = filterOptions.status === 'ready' ? filterOptions.subjects : [];
  const knownProfessors = filterOptions.status === 'ready' ? filterOptions.professors : [];
  const subjectName = knownSubjects.find((subject) => subject.id === state.subjectId)?.name;
  const professorName = knownProfessors.find(
    (professor) => professor.id === state.professorId,
  )?.name;
  const results = requestState.status === 'ready' ? requestState.results : null;

  return (
    <div className="min-h-[calc(100dvh-4.5rem)] pb-16">
      <section className="relative isolate overflow-hidden border-b border-primary bg-primary text-primary-foreground">
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0,transparent_49.8%,rgb(255_255_255/0.1)_50%,transparent_50.2%)]"
        />
        <div className="relative mx-auto grid max-w-[1180px] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="px-3 py-12 sm:px-6 sm:py-16 lg:py-20">
            <p className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-primary-foreground/75">
              Archivo cobalto
            </p>
            <h1 className="mt-4 max-w-[10ch] font-serif text-[clamp(3.1rem,6vw,5.4rem)] font-bold leading-[0.9] tracking-[-0.045em]">
              Reseñas de cursada reales.
            </h1>
            <p className="mt-6 max-w-[56ch] font-serif text-lg leading-relaxed text-primary-foreground/85 sm:text-xl">
              Mirá experiencias concretas antes de anotarte, preparar una materia o decidir cómo
              encarar la cursada.
            </p>
          </div>
          <div className="relative min-h-[17rem] border-t border-primary-foreground/20 lg:border-l lg:border-t-0">
            <Image
              alt="Observatorio cobalto en pixel art para representar experiencias compartidas"
              className="object-cover object-center"
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 58vw"
              src="/assets/pixel-notebook/heroes/hero-reviews-cobalto-observatory-1280.webp"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1180px] px-3 py-9 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-6 border-y border-line py-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-primary">
              Voz de la comunidad
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-foreground sm:text-4xl">
              {results ? `${results.meta.total} reseñas publicadas` : 'Explorá reseñas'}
            </h2>
            <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-secondary-foreground">
              El promedio y el conteo se recalculan con los filtros visibles. Las estrellas miden
              recomendación, no moderación.
            </p>
          </div>
          <AverageEvidence
            average={results?.aggregate.averageRecommendation ?? null}
            count={results?.aggregate.reviewCount ?? 0}
          />
        </div>

        <section aria-label="Filtros de reseñas" className="mt-7">
          <div className="flex items-center justify-between gap-4 lg:hidden">
            <h2 className="font-serif text-2xl font-bold text-foreground">Filtros</h2>
            <FilterSheet
              description="Refiná las reseñas por contexto de cursada."
              onApply={applyFilters}
              onClear={clearDraftFilters}
              title="Filtrar reseñas"
              trigger={
                <Button variant="outline">
                  <Filter aria-hidden="true" className="size-4" />
                  Filtros
                </Button>
              }
            >
              <FilterSheetFieldSet legend="Contexto de la reseña">
                <FilterFields
                  draft={draftFilters}
                  idPrefix="mobile-review-filter"
                  onChange={setDraftFilters}
                  options={filterOptions}
                />
              </FilterSheetFieldSet>
            </FilterSheet>
          </div>

          <div className="hidden border-y border-line py-5 lg:block">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal aria-hidden="true" className="size-4 text-primary" />
                <h2 className="font-serif text-2xl font-bold text-foreground">Filtros</h2>
              </div>
              <div className="flex gap-2">
                <Button onClick={clearDraftFilters} size="sm" variant="outline">
                  Limpiar
                </Button>
                <Button onClick={applyFilters} size="sm">
                  Aplicar filtros
                </Button>
              </div>
            </div>
            <FilterFields
              draft={draftFilters}
              idPrefix="desktop-review-filter"
              onChange={setDraftFilters}
              options={filterOptions}
            />
          </div>

          {filtersAreActive ? (
            <div aria-label="Filtros activos" className="mt-4 flex flex-wrap gap-2">
              {state.subjectId ? (
                <Button
                  aria-label="Quitar filtro Materia"
                  onClick={() => clearFilter('subjectId')}
                  size="sm"
                  variant="outline"
                >
                  Materia: {subjectName ?? 'seleccionada'} ×
                </Button>
              ) : null}
              {state.academicYear ? (
                <Button
                  aria-label={`Quitar filtro Año: ${state.academicYear}`}
                  onClick={() => clearFilter('academicYear')}
                  size="sm"
                  variant="outline"
                >
                  Año: {state.academicYear} ×
                </Button>
              ) : null}
              {state.difficulty ? (
                <Button
                  aria-label={`Quitar filtro Dificultad: ${difficultyLabel(state.difficulty)}`}
                  onClick={() => clearFilter('difficulty')}
                  size="sm"
                  variant="outline"
                >
                  Dificultad: {difficultyLabel(state.difficulty)} ×
                </Button>
              ) : null}
              {state.attempt ? (
                <Button
                  aria-label={`Quitar filtro Situación: ${courseAttemptLabel(state.attempt)}`}
                  onClick={() => clearFilter('attempt')}
                  size="sm"
                  variant="outline"
                >
                  Situación: {courseAttemptLabel(state.attempt)} ×
                </Button>
              ) : null}
              {state.professorId ? (
                <Button
                  aria-label="Quitar filtro Profesor"
                  onClick={() => clearFilter('professorId')}
                  size="sm"
                  variant="outline"
                >
                  Profesor: {professorName ?? 'seleccionado'} ×
                </Button>
              ) : null}
              <Button onClick={clearFilters} size="sm" variant="ghost">
                Quitar todos
              </Button>
            </div>
          ) : null}
        </section>

        {filterOptions.status === 'error' ? (
          <section
            aria-live="polite"
            className="mt-6 flex flex-col gap-3 border border-border bg-secondary p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm leading-relaxed text-secondary-foreground">
              No pudimos cargar algunas opciones de filtro. Los filtros que ya están en la URL se
              conservan.
            </p>
            <Button onClick={retryOptions} size="sm" variant="outline">
              Reintentar filtros
            </Button>
          </section>
        ) : null}

        <section className="mt-10" aria-labelledby="review-results">
          <div className="flex flex-col justify-between gap-4 border-b border-line pb-4 sm:flex-row sm:items-center">
            <h2 id="review-results" className="font-serif text-3xl font-bold text-foreground">
              Reseñas
            </h2>
            <div className="flex flex-wrap items-center gap-2" aria-label="Orden de reseñas">
              <span className="mr-1 text-sm text-secondary-foreground">Ordenar por</span>
              <Button
                aria-pressed={state.sort === 'RECENT'}
                onClick={() => updateState({ ...state, page: 1, sort: 'RECENT' })}
                size="sm"
                variant={state.sort === 'RECENT' ? 'primary' : 'outline'}
              >
                Recientes
              </Button>
              <Button
                aria-pressed={state.sort === 'STARS_DESC'}
                onClick={() => updateState({ ...state, page: 1, sort: 'STARS_DESC' })}
                size="sm"
                variant={state.sort === 'STARS_DESC' ? 'primary' : 'outline'}
              >
                Más estrellas
              </Button>
              <Button
                aria-pressed={state.sort === 'STARS_ASC'}
                onClick={() => updateState({ ...state, page: 1, sort: 'STARS_ASC' })}
                size="sm"
                variant={state.sort === 'STARS_ASC' ? 'primary' : 'outline'}
              >
                Menos estrellas
              </Button>
            </div>
          </div>

          {requestState.status === 'loading' ? (
            <LoadingState
              className="mt-7"
              description="Estamos reuniendo las reseñas publicadas."
            />
          ) : null}
          {requestState.status === 'error' ? (
            <ErrorState
              action={
                <Button onClick={retryResults} variant="outline">
                  Reintentar
                </Button>
              }
              className="mt-7"
              description="Conservamos los filtros y el orden para que puedas intentarlo de nuevo."
            />
          ) : null}

          {results?.data.length ? (
            <div className="mt-7 grid gap-5 lg:grid-cols-2">
              {results.data.map((review) => (
                <CourseReviewSummaryCard
                  key={review.id}
                  summary={{
                    academicYear: review.academicYear,
                    attempt: review.attempt,
                    author: { username: review.author.username },
                    condition: review.condition,
                    createdAt: review.createdAt,
                    difficulty: review.difficulty,
                    excerpt: review.excerpt,
                    id: review.id,
                    professorName: review.professor?.name ?? review.professorName,
                    recommendation: review.recommendation,
                    shift: review.shift,
                    subject: review.subject,
                    updatedAt: review.updatedAt,
                  }}
                />
              ))}
            </div>
          ) : null}

          {results && results.data.length === 0 ? (
            <EmptyState
              className="mt-7"
              heading={
                filtersAreActive
                  ? 'No hay reseñas con estos filtros'
                  : 'Todavía no hay reseñas públicas'
              }
              description={
                filtersAreActive
                  ? 'Quitá uno o más filtros para ampliar el archivo de experiencias.'
                  : 'Cuando la comunidad comparta cursadas, aparecerán acá.'
              }
              action={
                filtersAreActive ? (
                  <Button onClick={clearFilters} variant="outline">
                    Quitar todos los filtros
                  </Button>
                ) : undefined
              }
            />
          ) : null}

          {results && results.meta.totalPages > 1 ? (
            <nav
              aria-label="Paginación de reseñas"
              className="mt-8 flex items-center justify-between gap-4"
            >
              {state.page > 1 ? (
                <Button asChild variant="outline">
                  <Link href={toCourseReviewDiscoveryHref({ ...state, page: state.page - 1 })}>
                    <ArrowLeft aria-hidden="true" className="size-4" />
                    Anterior
                  </Link>
                </Button>
              ) : (
                <span />
              )}
              <p className="text-sm text-secondary-foreground">
                Página {results.meta.page} de {results.meta.totalPages}
              </p>
              {state.page < results.meta.totalPages ? (
                <Button asChild variant="outline">
                  <Link href={toCourseReviewDiscoveryHref({ ...state, page: state.page + 1 })}>
                    Siguiente
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export function CourseReviewDiscoveryPage() {
  const searchParams = useSearchParams();
  const rawSearch = searchParams.toString();
  const state = useMemo(
    () => parseCourseReviewDiscoveryState(new URLSearchParams(rawSearch)),
    [rawSearch],
  );

  return <ReviewListContent key={rawSearch} state={state} />;
}
