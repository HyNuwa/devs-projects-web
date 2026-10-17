'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/shadcn';
import { getGroupedSuggestions } from '@/lib/discovery-client';
import type { DiscoverySubjectSuggestion } from '@/types/discovery';

const DEBOUNCE_MS = 250;
const MIN_QUERY = 2;

type SearchKey = {
  /** The facultad scope the request used (null = global). */
  scope: string | null;
  query: string;
};

type SuggestionsState =
  | { status: 'idle' }
  | ({ status: 'loading' } & SearchKey)
  | ({ status: 'error' } & SearchKey)
  | ({ status: 'ready'; items: DiscoverySubjectSuggestion[] } & SearchKey);

/**
 * The materia search of the landing (openspec academic-community/experiences):
 * only the `subjects` group of the bounded suggestions endpoint, scoped to the
 * Ubicación's facultad; «Buscar en todas» retries globally. `onSelect`
 * overrides routing for other hosts (the escribir chooser).
 */
export function SubjectSearch({
  facultyId,
  facultyLabel,
  onSelect,
}: {
  facultyId?: string;
  /** Used in «No encontramos esa materia en <facultadLabel>». */
  facultyLabel?: string;
  onSelect?: (subject: DiscoverySubjectSuggestion) => void;
}) {
  const router = useRouter();
  const listboxId = useId();
  const [query, setQuery] = useState('');
  const [global, setGlobal] = useState(false);
  const [retry, setRetry] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dismissed, setDismissed] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionsState>({ status: 'idle' });

  const scope = global ? null : (facultyId ?? null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY) return;

    let current = true;
    const timer = setTimeout(() => {
      setSuggestions({ query: q, scope, status: 'loading' });
      void getGroupedSuggestions({ q, limit: 8, ...(scope ? { facultyId: scope } : {}) })
        .then((grouped) => {
          if (current) {
            setSuggestions({
              items: grouped.subjects.filter((subject) => subject.code),
              query: q,
              scope,
              status: 'ready',
            });
          }
        })
        .catch(() => {
          if (current) setSuggestions({ query: q, scope, status: 'error' });
        });
    }, DEBOUNCE_MS);

    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [query, scope, retry]);

  // Obsolete states never show: every request state carries the trimmed query
  // and scope it was issued for.
  const keyed =
    suggestions.status !== 'idle' &&
    suggestions.query === query.trim() &&
    suggestions.scope === scope
      ? suggestions
      : null;
  const readyResults = keyed?.status === 'ready' ? keyed : null;
  const items = readyResults?.items ?? [];
  const showList = readyResults !== null && items.length > 0 && !dismissed;
  const noMatch = readyResults !== null && items.length === 0;
  const loading = keyed?.status === 'loading';
  const failed = keyed?.status === 'error';

  const select = (subject: DiscoverySubjectSuggestion) => {
    setDismissed(true);
    if (onSelect) {
      onSelect(subject);
      return;
    }
    if (subject.code) router.push(`/experiencias/${encodeURIComponent(subject.code)}`);
  };

  return (
    <div className="relative">
      <form
        className="flex min-h-[3.25rem] items-center gap-3 rounded-xl border-[1.5px] border-foreground bg-card p-1.5 pl-4 shadow-none"
        onSubmit={(event) => {
          event.preventDefault();
          const first = items[activeIndex] ?? items[0];
          if (first) select(first);
        }}
        role="search"
      >
        <Search aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
        <input
          aria-activedescendant={
            showList && activeIndex >= 0 && items[activeIndex]
              ? `${listboxId}-opt-${activeIndex}`
              : undefined
          }
          aria-autocomplete="list"
          aria-controls={showList ? listboxId : undefined}
          aria-expanded={showList}
          aria-label="Buscá una materia"
          autoComplete="off"
          className="min-h-11 min-w-0 flex-1 border-none bg-transparent font-sans text-[0.9375rem] font-medium text-foreground outline-none placeholder:text-muted-foreground"
          onChange={(event) => {
            setQuery(event.target.value);
            setGlobal(false);
            setDismissed(false);
            setActiveIndex(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setDismissed(false);
              setActiveIndex((i) => Math.min(i + 1, items.length - 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setDismissed(false);
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (event.key === 'Escape') {
              setDismissed(true);
              setActiveIndex(-1);
            }
          }}
          placeholder="Buscá una materia: Análisis II, Física, Bases de Datos..."
          role="combobox"
          type="search"
        />
        {loading ? (
          <span className="sr-only" role="status">
            Buscando materias…
          </span>
        ) : null}
        <Button className="shrink-0" type="submit">
          Buscar
        </Button>
      </form>

      {showList ? (
        <ul
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-xl border-[1.5px] border-foreground bg-card py-1 shadow-pop"
          id={listboxId}
          role="listbox"
        >
          {items.map((subject, index) => (
            <li key={subject.id} role="presentation">
              <button
                aria-selected={index === activeIndex}
                className="flex min-h-11 w-full items-center gap-2 px-4 text-left font-sans text-sm font-semibold text-foreground outline-none hover:bg-muted focus-visible:bg-muted aria-selected:bg-muted"
                id={`${listboxId}-opt-${index}`}
                onClick={() => select(subject)}
                role="option"
                type="button"
              >
                <span className="font-mono text-[0.7rem] font-extrabold text-primary">
                  {subject.code}
                </span>
                {' · '}
                <span className="min-w-0 flex-1 truncate">{subject.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {noMatch ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border-[1.5px] border-line bg-card px-4 py-3">
          <p className="font-sans text-sm font-semibold text-muted-foreground">
            {readyResults?.scope === null || !facultyId
              ? 'No encontramos esa materia'
              : `No encontramos esa materia en ${facultyLabel ?? 'tu facultad'}`}
          </p>
          {facultyId && readyResults?.scope !== null ? (
            <Button onClick={() => setGlobal(true)} size="sm" variant="outline">
              Buscar en todas
            </Button>
          ) : null}
        </div>
      ) : null}

      {failed ? (
        <div
          className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border-[1.5px] border-line bg-card px-4 py-3"
          role="alert"
        >
          <p className="font-sans text-sm font-semibold text-muted-foreground">
            No pudimos buscar esa materia.
          </p>
          <Button onClick={() => setRetry((value) => value + 1)} size="sm" variant="outline">
            Reintentar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
