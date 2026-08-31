'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpenText, FileText, Search } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/shadcn/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/shadcn/state';
import { Input } from '@/components/ui/shadcn/input';
import { getGroupedSuggestions, getMaterialDiscovery } from '@/lib/discovery-client';
import {
  parseMaterialSearchState,
  toMaterialSearchHref,
  type MaterialSearchState,
} from '@/lib/material-search-state';
import type { DiscoverySubjectSuggestion, GroupedDiscoverySuggestions } from '@/types/discovery';
import type { Material, MaterialResourceType, Paginated } from '@/types/material';

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

type SearchRequestState =
  | { status: 'loading' }
  | {
      status: 'ready';
      suggestions: GroupedDiscoverySuggestions;
      strongSubject: DiscoverySubjectSuggestion | null;
      results: Paginated<Material>;
    }
  | { status: 'error' };

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

function SearchContent({ state }: { state: MaterialSearchState }) {
  const router = useRouter();
  const [queryInput, setQueryInput] = useState(state.q);
  const [requestState, setRequestState] = useState<SearchRequestState>({ status: 'loading' });

  useEffect(() => {
    let isCurrentRequest = true;

    async function loadSearch() {
      try {
        const suggestions = state.q
          ? await getGroupedSuggestions({ q: state.q, limit: 10 })
          : { subjects: [], materials: [] };
        const strongSubject =
          state.scope === 'all' ? null : findExactSubjectMatch(state.q, suggestions);
        const results = await getMaterialDiscovery(materialQueryFor(state, strongSubject));

        if (isCurrentRequest) {
          setRequestState({ status: 'ready', suggestions, strongSubject, results });
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
  }, [state]);

  const updateSearch = (nextState: MaterialSearchState) => {
    router.push(toMaterialSearchHref(nextState));
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
  const isStrongSubject = requestState.status === 'ready' && requestState.strongSubject !== null;

  return (
    <main className="min-h-[calc(100dvh-4.5rem)] bg-background pb-16">
      <div className="border-b border-border bg-secondary/55">
        <div className="mx-auto max-w-[1180px] px-5 py-11 sm:px-10 sm:py-14">
          {isStrongSubject ? (
            <div className="max-w-4xl">
              <p className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-primary">
                Materia
              </p>
              <h1 className="mt-3 font-serif text-4xl font-bold leading-[0.94] tracking-[-0.035em] text-foreground sm:text-6xl">
                {requestState.strongSubject.name}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-secondary-foreground sm:text-lg">
                {requestState.strongSubject.code
                  ? `Código ${requestState.strongSubject.code} · `
                  : ''}
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

        {state.resourceType || state.academicYear || state.professorId ? (
          <p className="mt-4 text-sm text-secondary-foreground">
            Los filtros incluidos en este enlace están activos. Podrás modificarlos desde los
            controles de filtros.
          </p>
        ) : null}

        {requestState.status === 'loading' ? (
          <LoadingState
            className="mt-8"
            description="Estamos buscando materias y recursos publicados."
          />
        ) : null}

        {requestState.status === 'error' ? (
          <ErrorState
            action={
              <Button onClick={() => updateSearch({ ...state })} variant="outline">
                Reintentar
              </Button>
            }
            className="mt-8"
            description="Conservamos tu búsqueda y filtros para que puedas intentarlo de nuevo."
          />
        ) : null}

        {requestState.status === 'ready' &&
        !isStrongSubject &&
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
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/materiales?archivo=${encodeURIComponent(material.id)}`}>
                      <FileText aria-hidden="true" className="size-4" strokeWidth={1.8} />
                      Abrir recurso
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
            description={
              state.q
                ? 'No encontramos recursos públicos para esta búsqueda.'
                : 'Todavía no hay recursos públicos para mostrar.'
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
