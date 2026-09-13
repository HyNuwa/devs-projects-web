'use client';

import Link from 'next/link';
import { BookOpen, LoaderCircle, Search, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button, EmptyState, ErrorState, Input, LoadingState } from '@/components/ui/shadcn';
import { api } from '@/lib/api';
import { getApiError, getData } from '@/lib/apiHelpers';
import type { Subject } from '@/types/subject';

type SubjectListState =
  | { status: 'loading' }
  | { status: 'ready'; subjects: Subject[] }
  | { error: string; status: 'error' };

function subjectHref(subject: Subject) {
  if (subject.code) return `/materias/${encodeURIComponent(subject.code)}`;

  return `/buscar?q=${encodeURIComponent(subject.name)}`;
}

export function SubjectList() {
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SubjectListState>({ status: 'loading' });

  useEffect(() => {
    let isCurrent = true;

    void api
      .get<Subject[]>('/subjects')
      .then((response) => {
        if (isCurrent) setState({ status: 'ready', subjects: getData(response) });
      })
      .catch((error: unknown) => {
        if (isCurrent) setState({ error: getApiError(error), status: 'error' });
      });

    return () => {
      isCurrent = false;
    };
  }, [attempt]);

  const filteredSubjects = useMemo(() => {
    if (state.status !== 'ready') return [];

    const normalizedQuery = query.trim().toLocaleLowerCase('es-AR');
    if (!normalizedQuery) return state.subjects;

    return state.subjects.filter((subject) =>
      `${subject.name} ${subject.code ?? ''}`.toLocaleLowerCase('es-AR').includes(normalizedQuery),
    );
  }, [query, state]);

  return (
    <div className="mx-auto grid w-full max-w-[1180px] gap-8 px-3 py-8 sm:px-6 sm:py-12">
      <header className="grid gap-4 border-b border-line pb-8 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="flex items-center gap-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.1em] text-primary">
            <Sparkles aria-hidden="true" className="size-4" strokeWidth={1.8} />
            Archivo académico
          </p>
          <h1 className="mt-3 max-w-[14ch] font-serif text-5xl font-bold leading-[0.92] tracking-[-0.035em] text-foreground sm:text-6xl">
            Materias
          </h1>
          <p className="mt-4 max-w-2xl font-sans leading-relaxed text-muted-foreground">
            Elegí una materia para consultar sus recursos, reseñas de cursada y experiencias de
            final desde una misma fuente académica.
          </p>
        </div>
        <span className="border border-border bg-card px-3 py-2 font-mono text-[0.68rem] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          Catálogo público
        </span>
      </header>

      <div className="relative max-w-2xl">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.8}
        />
        <Input
          aria-label="Buscar materia"
          className="pl-11"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscá por nombre o código de materia"
          type="search"
          value={query}
        />
      </div>

      {state.status === 'loading' ? (
        <LoadingState
          description="Estamos preparando el catálogo de materias."
          heading="Cargando materias"
        />
      ) : null}

      {state.status === 'error' ? (
        <ErrorState
          action={
            <Button onClick={() => setAttempt((value) => value + 1)} variant="outline">
              <LoaderCircle aria-hidden="true" className="size-4" />
              Reintentar
            </Button>
          }
          description={state.error}
          heading="No pudimos cargar las materias"
        />
      ) : null}

      {state.status === 'ready' && filteredSubjects.length === 0 ? (
        <EmptyState
          action={
            query ? (
              <Button onClick={() => setQuery('')} variant="outline">
                Limpiar búsqueda
              </Button>
            ) : undefined
          }
          description={
            query
              ? 'Probá otro término o buscá recursos en todo el repositorio.'
              : 'Todavía no hay materias públicas para explorar.'
          }
          heading={query ? 'No encontramos esa materia' : 'Todavía no hay materias'}
        />
      ) : null}

      {state.status === 'ready' && filteredSubjects.length > 0 ? (
        <section
          aria-label="Materias disponibles"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredSubjects.map((subject) => (
            <Link
              className="group grid min-h-40 content-between border border-border bg-card p-5 shadow-surface transition-transform hover:-translate-y-0.5 hover:bg-secondary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              href={subjectHref(subject)}
              key={subject.id}
            >
              <BookOpen aria-hidden="true" className="size-6 text-primary" strokeWidth={1.7} />
              <div className="mt-8">
                <h2 className="font-serif text-2xl font-bold leading-tight text-card-foreground group-hover:text-primary">
                  {subject.name}
                </h2>
                <p className="mt-2 font-mono text-[0.68rem] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                  {subject.code ? `Código ${subject.code}` : 'Código no informado'}
                </p>
              </div>
            </Link>
          ))}
        </section>
      ) : null}
    </div>
  );
}
