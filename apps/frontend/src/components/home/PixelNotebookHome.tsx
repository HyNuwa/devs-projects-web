'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import {
  BookOpenText,
  FileCheck2,
  FileText,
  LoaderCircle,
  NotebookPen,
  Search,
} from 'lucide-react';

import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Kaomoji } from '@/components/ui/shadcn/kaomoji';
import { getGroupedSuggestions } from '@/lib/discovery-client';
import type { GroupedDiscoverySuggestions } from '@/types/discovery';

const shortcuts = [
  { label: 'Parciales', query: 'parcial', resourceType: 'PARCIAL', Icon: FileText },
  { label: 'Finales', query: 'final', resourceType: 'FINAL', Icon: FileCheck2 },
  { label: 'Apuntes', query: 'apunte', resourceType: 'APUNTE', Icon: NotebookPen },
  { label: 'Resúmenes', query: 'resumen', resourceType: 'RESUMEN', Icon: BookOpenText },
] as const;

type SuggestionState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; suggestions: GroupedDiscoverySuggestions }
  | { status: 'error' };

function toSearchHref(parameters: Record<string, string>) {
  return `/buscar?${new URLSearchParams(parameters).toString()}`;
}

export function PixelNotebookHome() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestionState, setSuggestionState] = useState<SuggestionState>({ status: 'idle' });
  const trimmedQuery = query.trim();
  const showSuggestions = isSearchFocused && trimmedQuery.length > 0;

  useEffect(() => {
    if (!trimmedQuery) {
      return;
    }

    let isCurrentRequest = true;
    const timeoutId = window.setTimeout(() => {
      setSuggestionState({ status: 'loading' });
      getGroupedSuggestions({ q: trimmedQuery })
        .then((suggestions) => {
          if (isCurrentRequest) {
            setSuggestionState({ status: 'ready', suggestions });
          }
        })
        .catch(() => {
          if (isCurrentRequest) {
            setSuggestionState({ status: 'error' });
          }
        });
    }, 180);

    return () => {
      isCurrentRequest = false;
      window.clearTimeout(timeoutId);
    };
  }, [trimmedQuery]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (trimmedQuery) {
      router.push(toSearchHref({ q: trimmedQuery }));
    }
  };

  const hasSuggestions =
    suggestionState.status === 'ready' &&
    (suggestionState.suggestions.subjects.length > 0 ||
      suggestionState.suggestions.materials.length > 0);

  return (
    <section
      aria-labelledby="pixel-notebook-home-title"
      className="relative isolate overflow-hidden border-b border-border bg-background"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-3 z-10 size-9 border-l-2 border-t-2 border-border sm:left-5 sm:top-5"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 right-3 z-10 size-9 border-b-2 border-r-2 border-border sm:bottom-5 sm:right-5"
      />
      <div className="mx-auto grid min-h-[min(640px,calc(100dvh-72px))] w-full max-w-[1180px] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="relative z-10 flex items-start bg-background px-5 py-12 sm:px-10 sm:py-16 lg:py-[clamp(4.5rem,8vw,7.5rem)]">
          <div className="w-full max-w-xl">
            <p className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-primary">
              Comunidad FI · UNJu
            </p>
            <h1
              id="pixel-notebook-home-title"
              className="mt-4 max-w-[10ch] text-balance font-serif text-[clamp(3.25rem,6.8vw,5.8rem)] font-bold leading-[0.88] tracking-[-0.045em] text-foreground"
            >
              Tu{' '}
              <em className="font-inherit text-destructive underline decoration-[0.16em] decoration-accent underline-offset-[0.13em]">
                mochila de estudio
              </em>
              .
            </h1>
            <p className="mt-6 max-w-[54ch] font-serif text-lg leading-relaxed text-secondary-foreground sm:text-xl">
              Reuní parciales, apuntes y experiencias para preparar una materia con una ruta clara.
            </p>

            <div
              className="relative mt-8"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setIsSearchFocused(false);
                }
              }}
              onFocus={() => setIsSearchFocused(true)}
            >
              <form
                aria-label="Buscar recursos académicos"
                className="grid min-h-14 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border border-border bg-card p-2 pl-4 shadow-field sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                onSubmit={handleSubmit}
                role="search"
              >
                <Search aria-hidden="true" className="size-5 text-primary" strokeWidth={1.8} />
                <label className="sr-only" htmlFor="homepage-discovery-query">
                  Buscá materia, parcial o apunte
                </label>
                <Input
                  className="min-h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  id="homepage-discovery-query"
                  name="q"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscá materia, parcial o apunte"
                  type="search"
                  value={query}
                />
                <Button className="col-span-2 sm:col-span-1" size="lg" type="submit">
                  Buscar
                </Button>
              </form>

              {showSuggestions ? (
                <div
                  aria-label="Sugerencias de búsqueda"
                  aria-live="polite"
                  className="absolute inset-x-0 z-20 mt-2 max-h-[min(60dvh,32rem)] overflow-y-auto border border-primary bg-card shadow-surface"
                >
                  {suggestionState.status === 'loading' ? (
                    <p className="flex items-center gap-2 px-4 py-4 font-sans text-sm text-muted-foreground">
                      <LoaderCircle
                        aria-hidden="true"
                        className="size-4 animate-spin text-primary"
                      />
                      Buscando coincidencias…
                    </p>
                  ) : null}

                  {suggestionState.status === 'ready' && hasSuggestions ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      <section aria-labelledby="homepage-subject-suggestions">
                        <h2
                          className="border-b border-border bg-secondary px-4 py-3 font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-primary"
                          id="homepage-subject-suggestions"
                        >
                          Materias
                        </h2>
                        {suggestionState.suggestions.subjects.map((subject) => (
                          <Link
                            className="block border-b border-line px-4 py-3 font-sans outline-none transition-colors hover:bg-secondary focus-visible:bg-secondary"
                            href={toSearchHref({ q: subject.name, subjectId: subject.id })}
                            key={subject.id}
                          >
                            <span className="block text-sm font-bold text-foreground">
                              {subject.name}
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              Materia{subject.code ? ` · ${subject.code}` : ''}
                            </span>
                          </Link>
                        ))}
                        {suggestionState.suggestions.subjects.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-muted-foreground">
                            Sin materias coincidentes.
                          </p>
                        ) : null}
                      </section>
                      <section
                        aria-labelledby="homepage-material-suggestions"
                        className="border-t border-primary lg:border-l lg:border-t-0"
                      >
                        <h2
                          className="border-b border-border bg-secondary px-4 py-3 font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-primary"
                          id="homepage-material-suggestions"
                        >
                          Recursos
                        </h2>
                        {suggestionState.suggestions.materials.map((material) => (
                          <Link
                            className="block border-b border-line px-4 py-3 font-sans outline-none transition-colors hover:bg-secondary focus-visible:bg-secondary"
                            href={toSearchHref({
                              q: material.title,
                              subjectId: material.subject.id,
                            })}
                            key={material.id}
                          >
                            <span className="block text-sm font-bold text-foreground">
                              {material.title}
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              Recurso · {material.resourceType.replaceAll('_', ' ')} ·{' '}
                              {material.subject.name}
                            </span>
                          </Link>
                        ))}
                        {suggestionState.suggestions.materials.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-muted-foreground">
                            Sin recursos coincidentes.
                          </p>
                        ) : null}
                      </section>
                    </div>
                  ) : null}

                  {suggestionState.status === 'ready' && !hasSuggestions ? (
                    <p className="px-4 py-4 text-sm text-muted-foreground">
                      No encontramos coincidencias. Probá con otro nombre o tipo de material.
                    </p>
                  ) : null}

                  {suggestionState.status === 'error' ? (
                    <p className="px-4 py-4 text-sm text-muted-foreground">
                      No pudimos buscar ahora. Conservamos tu consulta para que puedas intentarlo de
                      nuevo.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <nav aria-label="Atajos por tipo de recurso" className="mt-6 flex flex-wrap gap-2">
              {shortcuts.map(({ Icon, label, query: shortcutQuery, resourceType }) => (
                <Link
                  className="inline-flex min-h-11 items-center gap-2 border border-primary bg-background px-3 font-mono text-xs font-bold text-primary shadow-control outline-none transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  href={toSearchHref({ q: shortcutQuery, resourceType })}
                  key={label}
                >
                  <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
                  {label}
                </Link>
              ))}
            </nav>

            <p className="mt-5 flex items-center gap-2 font-sans text-sm text-secondary-foreground">
              <Kaomoji className="text-base text-primary" id="encouragement" />
              Encontrá tu punto de partida y seguí desde ahí.
            </p>
          </div>
        </div>

        <div className="relative min-h-[18rem] border-t border-line lg:min-h-0 lg:border-l lg:border-t-0">
          <Image
            alt="Mochila pixel art con libros, apuntes y útiles de estudio"
            className="object-cover object-[56%_center]"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 58vw"
            src="/assets/pixel-notebook/heroes/hero-home-brasa-kit-1280.webp"
          />
        </div>
      </div>
    </section>
  );
}
