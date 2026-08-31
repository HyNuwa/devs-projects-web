'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpenText, Eye, Search, Star, ThumbsUp } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/shadcn/button';
import { FilterSheet, FilterSheetFieldSet } from '@/components/ui/shadcn/filter-sheet';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/shadcn/state';
import { Input } from '@/components/ui/shadcn/input';
import { api } from '@/lib/api';
import { getData } from '@/lib/apiHelpers';
import { getGroupedSuggestions, getMaterialDiscovery } from '@/lib/discovery-client';
import {
  parseMaterialSearchState,
  toMaterialSearchHref,
  type MaterialSearchState,
} from '@/lib/material-search-state';
import type { DiscoverySubjectSuggestion, GroupedDiscoverySuggestions } from '@/types/discovery';
import type { Material, MaterialResourceType, Paginated } from '@/types/material';
import type { Professor } from '@/types/professor';
import type { Subject } from '@/types/subject';

const pageSize = 10;

const resourceTypeLabels: Record<MaterialResourceType, string> = {
  PARCIAL: 'Parcial',
  FINAL: 'Final',
  APUNTE: 'Apunte',
  RESUMEN: 'Resumen',
  TRABAJO_PRACTICO: 'Trabajo práctico',
  GUIA_EJERCICIOS: 'Guía de ejercicios',
  OTRO: 'Otro recurso',
};

const shiftLabels = {
  MANANA: 'Mañana',
  TARDE: 'Tarde',
  NOCHE: 'Noche',
  NO_INDICO: 'No informado',
} as const;

type SearchRequestState =
  | { status: 'loading' }
  | {
      status: 'ready';
      suggestions: GroupedDiscoverySuggestions;
      suggestionsStatus: 'ready' | 'error';
      strongSubject: DiscoverySubjectSuggestion | null;
      results: Paginated<Material>;
    }
  | { status: 'error' };

type FilterOptionsState =
  | { status: 'loading' }
  | { status: 'ready'; subjects: Subject[]; professors: Professor[] }
  | { status: 'error' };

type FilterDraft = Pick<
  MaterialSearchState,
  'subjectId' | 'resourceType' | 'academicYear' | 'professorId'
>;

const filterControlClassName =
  'min-h-11 w-full border border-input bg-background px-3 font-sans text-sm text-foreground outline-none shadow-field focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

function filterDraftFrom(state: MaterialSearchState): FilterDraft {
  return {
    subjectId: state.subjectId,
    resourceType: state.resourceType,
    academicYear: state.academicYear,
    professorId: state.professorId,
  };
}

function FilterFields({
  draft,
  idPrefix,
  onChange,
  options,
}: {
  draft: FilterDraft;
  idPrefix: string;
  onChange: (next: FilterDraft) => void;
  options: FilterOptionsState;
}) {
  const subjects = options.status === 'ready' ? options.subjects : [];
  const professors = options.status === 'ready' ? options.professors : [];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <label className="grid gap-2 text-sm font-bold text-foreground" htmlFor={`${idPrefix}-type`}>
        Tipo de recurso
        <select
          className={filterControlClassName}
          id={`${idPrefix}-type`}
          onChange={(event) =>
            onChange({
              ...draft,
              resourceType: (event.target.value || undefined) as MaterialResourceType | undefined,
            })
          }
          value={draft.resourceType ?? ''}
        >
          <option value="">Todos los tipos</option>
          {Object.entries(resourceTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
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
        Ciclo lectivo
        <Input
          id={`${idPrefix}-year`}
          min="1900"
          onChange={(event) => {
            const value = event.target.value === '' ? undefined : Number(event.target.value);
            onChange({ ...draft, academicYear: Number.isInteger(value) ? value : undefined });
          }}
          placeholder="Ej. 2026"
          type="number"
          value={draft.academicYear ?? ''}
        />
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

function normalizeComparableText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es-AR')
    .trim()
    .replace(/\s+/g, ' ');
}

function findExactSubjectMatch(
  query: string,
  suggestions: GroupedDiscoverySuggestions,
): DiscoverySubjectSuggestion | null {
  const normalizedQuery = normalizeComparableText(query);

  if (!normalizedQuery) {
    return null;
  }

  return (
    suggestions.subjects.find((subject) => {
      const nameMatches = normalizeComparableText(subject.name) === normalizedQuery;
      const codeMatches = subject.code
        ? normalizeComparableText(subject.code) === normalizedQuery
        : false;

      return nameMatches || codeMatches;
    }) ?? null
  );
}

function materialQueryFor(
  state: MaterialSearchState,
  strongSubject: DiscoverySubjectSuggestion | null,
) {
  const subjectId = state.scope === 'all' ? undefined : (strongSubject?.id ?? state.subjectId);
  const search = strongSubject && state.scope !== 'all' ? undefined : state.q || undefined;

  return {
    ...(subjectId ? { subjectId } : {}),
    ...(search ? { search } : {}),
    ...(state.resourceType ? { resourceType: state.resourceType } : {}),
    ...(state.academicYear ? { academicYear: state.academicYear } : {}),
    ...(state.professorId ? { professorId: state.professorId } : {}),
    sort: state.sort,
    page: state.page,
    limit: pageSize,
  };
}

function academicContextValue(value: string | number | null): string | number {
  return value ?? 'No informado';
}

function ratingEvidence(material: Material) {
  const count = material.starSummary.count;
  const average = Number(material.starSummary.average);

  if (!count || !Number.isFinite(average)) {
    return { accessibleName: 'Sin valoraciones todavía', visibleText: 'Sin valoraciones' };
  }

  const formattedAverage = new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(average);

  return {
    accessibleName: `${formattedAverage} de 5 estrellas a partir de ${count} valoraciones`,
    visibleText: `${formattedAverage} ★ · ${count}`,
  };
}

function hasActiveFilters(state: MaterialSearchState): boolean {
  return Boolean(state.resourceType || state.subjectId || state.academicYear || state.professorId);
}

function PartialContextNotice({
  filterOptionsUnavailable,
  onRetryFilterOptions,
  onRetrySearch,
  suggestionsUnavailable,
}: {
  filterOptionsUnavailable: boolean;
  onRetryFilterOptions: () => void;
  onRetrySearch: () => void;
  suggestionsUnavailable: boolean;
}) {
  if (!filterOptionsUnavailable && !suggestionsUnavailable) {
    return null;
  }

  return (
    <section
      aria-live="polite"
      className="mt-8 flex flex-col gap-3 border border-border bg-secondary/55 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h2 className="font-serif text-xl font-bold text-foreground">Contexto parcial</h2>
        <p className="mt-1 text-sm text-secondary-foreground">
          {suggestionsUnavailable
            ? 'No pudimos cargar las coincidencias de materias. Los recursos publicados siguen disponibles.'
            : 'No pudimos cargar algunas opciones de filtro. Tu consulta y filtros actuales se conservaron.'}
        </p>
      </div>
      <Button
        onClick={suggestionsUnavailable ? onRetrySearch : onRetryFilterOptions}
        size="sm"
        variant="outline"
      >
        Reintentar
      </Button>
    </section>
  );
}

function SearchContent({ state }: { state: MaterialSearchState }) {
  const router = useRouter();
  const [queryInput, setQueryInput] = useState(state.q);
  const [requestState, setRequestState] = useState<SearchRequestState>({ status: 'loading' });
  const [draftFilters, setDraftFilters] = useState<FilterDraft>(() => filterDraftFrom(state));
  const [filterOptions, setFilterOptions] = useState<FilterOptionsState>({ status: 'loading' });
  const [searchRetryKey, setSearchRetryKey] = useState(0);
  const [filterOptionsRetryKey, setFilterOptionsRetryKey] = useState(0);

  useEffect(() => {
    let current = true;
    void Promise.all([
      api.get<Subject[]>('/subjects'),
      api.get<Paginated<Professor>>('/professors', { params: { page: 1, limit: 100 } }),
    ])
      .then(([subjects, professors]) => {
        if (current)
          setFilterOptions({
            status: 'ready',
            subjects: getData(subjects),
            professors: getData(professors).data,
          });
      })
      .catch(() => {
        if (current) setFilterOptions({ status: 'error' });
      });
    return () => {
      current = false;
    };
  }, [filterOptionsRetryKey]);

  useEffect(() => {
    let isCurrentRequest = true;

    async function loadSearch() {
      let suggestions: GroupedDiscoverySuggestions = { subjects: [], materials: [] };
      let suggestionsStatus: 'ready' | 'error' = 'ready';

      if (state.q) {
        try {
          suggestions = await getGroupedSuggestions({ q: state.q, limit: 10 });
        } catch {
          suggestionsStatus = 'error';
        }
      }

      const strongSubject =
        suggestionsStatus === 'ready' && state.scope !== 'all'
          ? findExactSubjectMatch(state.q, suggestions)
          : null;

      try {
        const results = await getMaterialDiscovery(materialQueryFor(state, strongSubject));

        if (isCurrentRequest) {
          setRequestState({
            status: 'ready',
            suggestions,
            suggestionsStatus,
            strongSubject,
            results,
          });
        }
      } catch {
        if (isCurrentRequest) {
          setRequestState({ status: 'error' });
        }
      }
    }

    void loadSearch();

    return () => {
      isCurrentRequest = false;
    };
  }, [state, searchRetryKey]);

  const updateSearch = (nextState: MaterialSearchState) => {
    router.push(toMaterialSearchHref(nextState));
  };
  const applyFilters = () => updateSearch({ ...state, ...draftFilters, page: 1 });
  const clearDraftFilters = () => setDraftFilters({});
  const clearFilter = (key: keyof FilterDraft) =>
    updateSearch({ ...state, [key]: undefined, page: 1 });
  const retrySearch = () => {
    setRequestState({ status: 'loading' });
    setSearchRetryKey((value) => value + 1);
  };
  const retryFilterOptions = () => {
    setFilterOptions({ status: 'loading' });
    setFilterOptionsRetryKey((value) => value + 1);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = queryInput.trim();

    updateSearch({
      ...state,
      q,
      subjectId: undefined,
      scope: undefined,
      page: 1,
    });
  };

  const allSubjectsHref = toMaterialSearchHref({
    ...state,
    subjectId: undefined,
    scope: 'all',
    page: 1,
  });

  const resultTotal = requestState.status === 'ready' ? requestState.results.meta.total : null;
  const strongSubject = requestState.status === 'ready' ? requestState.strongSubject : null;
  const filtersAreActive = hasActiveFilters(state);

  return (
    <main className="min-h-[calc(100dvh-4.5rem)] bg-background pb-16">
      <div className="border-b border-border bg-secondary/55">
        <div className="mx-auto max-w-[1180px] px-5 py-11 sm:px-10 sm:py-14">
          {strongSubject ? (
            <div className="max-w-4xl">
              <p className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-primary">
                Materia
              </p>
              <h1 className="mt-3 font-serif text-4xl font-bold leading-[0.94] tracking-[-0.035em] text-foreground sm:text-6xl">
                {strongSubject.name}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-secondary-foreground sm:text-lg">
                {strongSubject.code ? `Código ${strongSubject.code} · ` : ''}
                Recursos publicados para esta materia.
              </p>
              <Link
                className="mt-5 inline-flex min-h-11 items-center gap-2 border border-primary bg-background px-4 py-2 text-sm font-bold text-primary outline-none transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                href={allSubjectsHref}
              >
                Buscar en todas las materias
                <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.8} />
              </Link>
            </div>
          ) : (
            <div className="max-w-4xl">
              <p className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-primary">
                Búsqueda de materiales
              </p>
              <h1 className="mt-3 font-serif text-4xl font-bold leading-[0.94] tracking-[-0.035em] text-foreground sm:text-6xl">
                {state.q ? `Resultados para “${state.q}”` : 'Buscá materiales'}
              </h1>
              <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-secondary-foreground sm:text-lg">
                Encontrá materias y recursos publicados para seguir preparando tu cursada.
              </p>
            </div>
          )}

          <form
            aria-label="Buscar materiales"
            className="mt-8 grid max-w-3xl grid-cols-[auto_minmax(0,1fr)] gap-3 border border-border bg-card p-2 pl-4 shadow-field sm:grid-cols-[auto_minmax(0,1fr)_auto]"
            onSubmit={handleSubmit}
            role="search"
          >
            <Search aria-hidden="true" className="my-auto size-5 text-primary" strokeWidth={1.8} />
            <label className="sr-only" htmlFor="material-search-query">
              Buscar por materia o recurso
            </label>
            <Input
              className="min-h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              id="material-search-query"
              name="q"
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder="Buscá materia, parcial o apunte"
              type="search"
              value={queryInput}
            />
            <Button className="col-span-2 sm:col-span-1" size="lg" type="submit">
              Buscar
            </Button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-5 py-9 sm:px-10 sm:py-12">
        <div className="flex flex-col justify-between gap-5 border-y border-line py-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-primary">
              Recursos
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-foreground">
              {resultTotal === null
                ? 'Resultados de la búsqueda'
                : `${resultTotal} ${resultTotal === 1 ? 'resultado' : 'resultados'}`}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2" aria-label="Orden de resultados">
            <span className="mr-1 text-sm text-secondary-foreground">Ordenar por</span>
            <Button
              aria-pressed={state.sort === 'RELEVANCE'}
              onClick={() => updateSearch({ ...state, sort: 'RELEVANCE', page: 1 })}
              size="sm"
              variant={state.sort === 'RELEVANCE' ? 'primary' : 'outline'}
            >
              Relevancia
            </Button>
            <Button
              aria-pressed={state.sort === 'RECENT'}
              onClick={() => updateSearch({ ...state, sort: 'RECENT', page: 1 })}
              size="sm"
              variant={state.sort === 'RECENT' ? 'primary' : 'outline'}
            >
              Recientes
            </Button>
          </div>
        </div>

        <section aria-label="Filtros de materiales" className="mt-6">
          <div className="flex items-center justify-between gap-4 lg:hidden">
            <h2 className="font-serif text-2xl font-bold text-foreground">Filtros</h2>
            <FilterSheet
              onApply={applyFilters}
              onClear={clearDraftFilters}
              title="Filtrar materiales"
              trigger={<Button variant="outline">Filtros</Button>}
            >
              <FilterSheetFieldSet legend="Refiná los resultados">
                <FilterFields
                  draft={draftFilters}
                  idPrefix="mobile-filter"
                  onChange={setDraftFilters}
                  options={filterOptions}
                />
              </FilterSheetFieldSet>
            </FilterSheet>
          </div>
          <div className="hidden border-y border-line py-5 lg:block">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-serif text-2xl font-bold text-foreground">Filtros</h2>
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
              idPrefix="desktop-filter"
              onChange={setDraftFilters}
              options={filterOptions}
            />
          </div>
          {filtersAreActive ? (
            <div aria-label="Filtros activos" className="mt-4 flex flex-wrap gap-2">
              {state.resourceType ? (
                <Button
                  aria-label={`Quitar filtro Tipo: ${resourceTypeLabels[state.resourceType]}`}
                  onClick={() => clearFilter('resourceType')}
                  size="sm"
                  variant="outline"
                >
                  Tipo: {resourceTypeLabels[state.resourceType]} ×
                </Button>
              ) : null}
              {state.subjectId ? (
                <Button
                  aria-label="Quitar filtro Materia"
                  onClick={() => clearFilter('subjectId')}
                  size="sm"
                  variant="outline"
                >
                  Materia ×
                </Button>
              ) : null}
              {state.academicYear ? (
                <Button
                  aria-label={`Quitar filtro Ciclo lectivo: ${state.academicYear}`}
                  onClick={() => clearFilter('academicYear')}
                  size="sm"
                  variant="outline"
                >
                  Ciclo: {state.academicYear} ×
                </Button>
              ) : null}
              {state.professorId ? (
                <Button
                  aria-label="Quitar filtro Profesor"
                  onClick={() => clearFilter('professorId')}
                  size="sm"
                  variant="outline"
                >
                  Profesor ×
                </Button>
              ) : null}
              <Button
                onClick={() =>
                  updateSearch({
                    ...state,
                    subjectId: undefined,
                    resourceType: undefined,
                    academicYear: undefined,
                    professorId: undefined,
                    page: 1,
                  })
                }
                size="sm"
                variant="ghost"
              >
                Quitar todos
              </Button>
            </div>
          ) : null}
        </section>

        {requestState.status === 'loading' ? (
          <LoadingState
            className="mt-8"
            description="Estamos buscando materias y recursos publicados."
          />
        ) : null}

        {requestState.status === 'error' ? (
          <ErrorState
            action={
              <Button onClick={retrySearch} variant="outline">
                Reintentar
              </Button>
            }
            className="mt-8"
            description="Conservamos tu búsqueda y filtros para que puedas intentarlo de nuevo."
          />
        ) : null}

        {requestState.status === 'ready' ? (
          <PartialContextNotice
            filterOptionsUnavailable={filterOptions.status === 'error'}
            onRetryFilterOptions={retryFilterOptions}
            onRetrySearch={retrySearch}
            suggestionsUnavailable={requestState.suggestionsStatus === 'error'}
          />
        ) : null}

        {requestState.status === 'ready' &&
        !strongSubject &&
        requestState.suggestions.subjects.length > 0 ? (
          <section aria-labelledby="matching-subjects" className="mt-10">
            <div className="flex items-center gap-3">
              <BookOpenText aria-hidden="true" className="size-5 text-primary" strokeWidth={1.8} />
              <h2 id="matching-subjects" className="font-serif text-2xl font-bold text-foreground">
                Materias coincidentes
              </h2>
            </div>
            <div className="mt-4 grid border-l border-t border-line sm:grid-cols-2 lg:grid-cols-3">
              {requestState.suggestions.subjects.map((subject) => (
                <Link
                  className="group border-b border-r border-line bg-card p-5 outline-none transition-colors hover:bg-secondary focus-visible:bg-secondary"
                  href={toMaterialSearchHref({
                    ...state,
                    q: subject.name,
                    subjectId: subject.id,
                    scope: undefined,
                    page: 1,
                  })}
                  key={subject.id}
                >
                  <span className="block font-serif text-xl font-bold leading-tight text-foreground group-hover:text-primary">
                    {subject.name}
                  </span>
                  <span className="mt-3 block text-sm text-secondary-foreground">
                    Materia{subject.code ? ` · ${subject.code}` : ''}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {requestState.status === 'ready' && requestState.results.data.length > 0 ? (
          <section aria-labelledby="resource-results" className="mt-10">
            <h2 className="sr-only" id="resource-results">
              Recursos encontrados
            </h2>
            <div className="border-t border-line">
              {requestState.results.data.map((material) => (
                <article
                  className="grid gap-4 border-b border-line py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8"
                  key={material.id}
                >
                  <div className="min-w-0">
                    <span className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-primary">
                      {resourceTypeLabels[material.resourceType]}
                    </span>
                    <h3 className="mt-2 font-serif text-2xl font-bold leading-tight text-foreground">
                      {material.title}
                    </h3>
                    <p className="mt-2 text-sm text-secondary-foreground">
                      {material.subject.name}
                    </p>
                    <dl className="mt-5 grid border-l border-t border-line sm:grid-cols-3">
                      <div className="border-b border-r border-line px-3 py-3">
                        <dt className="font-mono text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-primary">
                          Ciclo lectivo
                        </dt>
                        <dd className="mt-1 text-sm font-bold text-foreground">
                          {academicContextValue(material.academicYear)}
                        </dd>
                      </div>
                      <div className="border-b border-r border-line px-3 py-3">
                        <dt className="font-mono text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-primary">
                          Profesor
                        </dt>
                        <dd className="mt-1 text-sm font-bold text-foreground">
                          {academicContextValue(material.professor?.name ?? null)}
                        </dd>
                      </div>
                      <div className="border-b border-r border-line px-3 py-3">
                        <dt className="font-mono text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-primary">
                          Turno
                        </dt>
                        <dd className="mt-1 text-sm font-bold text-foreground">
                          {material.shift ? shiftLabels[material.shift] : 'No informado'}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-secondary-foreground">
                      <span className="inline-flex items-center gap-2">
                        <ThumbsUp
                          aria-hidden="true"
                          className="size-4 text-primary"
                          strokeWidth={1.8}
                        />
                        {material.helpfulCount} dijeron “Me sirvió”
                      </span>
                      <span
                        aria-label={ratingEvidence(material).accessibleName}
                        className="inline-flex items-center gap-1 font-mono font-bold text-primary"
                      >
                        <Star aria-hidden="true" className="size-4" strokeWidth={1.8} />
                        {ratingEvidence(material).visibleText}
                      </span>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/materiales?archivo=${encodeURIComponent(material.id)}`}>
                      <Eye aria-hidden="true" className="size-4" strokeWidth={1.8} />
                      Vista previa
                    </Link>
                  </Button>
                </article>
              ))}
            </div>

            {requestState.results.meta.totalPages > 1 ? (
              <nav
                aria-label="Paginación de resultados"
                className="mt-8 flex items-center justify-between gap-4"
              >
                {state.page > 1 ? (
                  <Button asChild variant="outline">
                    <Link href={toMaterialSearchHref({ ...state, page: state.page - 1 })}>
                      <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={1.8} />
                      Anterior
                    </Link>
                  </Button>
                ) : (
                  <span />
                )}
                <p className="text-sm text-secondary-foreground">
                  Página {requestState.results.meta.page} de {requestState.results.meta.totalPages}
                </p>
                {state.page < requestState.results.meta.totalPages ? (
                  <Button asChild variant="outline">
                    <Link href={toMaterialSearchHref({ ...state, page: state.page + 1 })}>
                      Siguiente
                      <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.8} />
                    </Link>
                  </Button>
                ) : (
                  <span />
                )}
              </nav>
            ) : null}
          </section>
        ) : null}

        {requestState.status === 'ready' && requestState.results.data.length === 0 ? (
          <EmptyState
            className="mt-8"
            heading={
              filtersAreActive
                ? 'No hay resultados con estos filtros'
                : state.q
                  ? 'No encontramos coincidencias'
                  : 'Todavía no hay recursos públicos'
            }
            description={
              filtersAreActive
                ? 'Probá quitar uno o más filtros para ampliar los resultados.'
                : state.q
                  ? 'No encontramos recursos públicos para esta búsqueda.'
                  : 'Todavía no hay recursos públicos para mostrar.'
            }
            action={
              filtersAreActive ? (
                <Button
                  onClick={() =>
                    updateSearch({
                      ...state,
                      subjectId: undefined,
                      resourceType: undefined,
                      academicYear: undefined,
                      professorId: undefined,
                      page: 1,
                    })
                  }
                  variant="outline"
                >
                  Quitar todos los filtros
                </Button>
              ) : undefined
            }
          />
        ) : null}
      </div>
    </main>
  );
}

export function MaterialSearchPage() {
  const searchParams = useSearchParams();
  const rawSearch = searchParams.toString();
  const state = useMemo(
    () => parseMaterialSearchState(new URLSearchParams(rawSearch)),
    [rawSearch],
  );

  return <SearchContent key={rawSearch} state={state} />;
}
