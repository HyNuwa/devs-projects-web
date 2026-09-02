'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, Filter, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button, FilterSheet, FilterSheetFieldSet, Input } from '@/components/ui/shadcn';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/shadcn/state';
import { api } from '@/lib/api';
import { getData } from '@/lib/apiHelpers';
import { getExamExperienceDiscovery } from '@/lib/discovery-client';
import {
  parseExamExperienceDiscoveryState,
  toExamExperienceDiscoveryHref,
  type ExamExperienceDiscoveryState,
} from '@/lib/exam-experience-discovery-state';
import { examFormatLabel, examOutcomeLabel, examPeriodLabel } from '@/lib/presentation-labels';
import type { DiscoveryExamExperienceList } from '@/types/discovery';
import type { Paginated } from '@/types/material';
import type { Professor } from '@/types/professor';
import type { ExamFormat, ExamOutcome, ExamSession, Subject } from '@/types/subject';

import { FinalExperienceSummaryCard } from './CommunitySummaryCards';

const pageSize = 10;
const sessions: ExamSession[] = [
  'DICIEMBRE',
  'JULIO',
  'MARZO',
  'FEBRERO_MARZO',
  'ESPECIAL',
  'NO_RECUERDO',
];
const formats: ExamFormat[] = ['ESCRITO', 'ORAL', 'MIXTO'];
const outcomes: ExamOutcome[] = ['APROBADO', 'DESAPROBADO', 'PREFIERO_NO_DECIR'];
const filterControlClassName =
  'min-h-11 w-full border border-input bg-background px-3 font-sans text-sm text-foreground outline-none shadow-field focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

type ExperienceRequestState =
  | { status: 'loading' }
  | { results: DiscoveryExamExperienceList; status: 'ready' }
  | { status: 'error' };

type FilterOptionsState =
  | { status: 'loading' }
  | { professors: Professor[]; status: 'ready'; subjects: Subject[] }
  | { status: 'error' };

type FilterDraft = Pick<
  ExamExperienceDiscoveryState,
  'format' | 'outcome' | 'professorId' | 'session' | 'subjectId' | 'year'
>;

function filterDraftFrom(state: ExamExperienceDiscoveryState): FilterDraft {
  return {
    format: state.format,
    outcome: state.outcome,
    professorId: state.professorId,
    session: state.session,
    subjectId: state.subjectId,
    year: state.year,
  };
}

function hasActiveFilters(state: ExamExperienceDiscoveryState) {
  return Boolean(
    state.format ||
    state.outcome ||
    state.professorId ||
    state.session ||
    state.subjectId ||
    state.year,
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
        Año de final
        <Input
          id={`${idPrefix}-year`}
          min="1900"
          onChange={(event) => {
            const value = event.target.value === '' ? undefined : Number(event.target.value);
            onChange({ ...draft, year: Number.isInteger(value) ? value : undefined });
          }}
          placeholder="Ej.: 2026"
          type="number"
          value={draft.year ?? ''}
        />
      </label>

      <label
        className="grid gap-2 text-sm font-bold text-foreground"
        htmlFor={`${idPrefix}-session`}
      >
        Período
        <select
          className={filterControlClassName}
          id={`${idPrefix}-session`}
          onChange={(event) =>
            onChange({
              ...draft,
              session: (event.target.value || undefined) as ExamSession | undefined,
            })
          }
          value={draft.session ?? ''}
        >
          <option value="">Todos los períodos</option>
          {sessions.map((session) => (
            <option key={session} value={session}>
              {examPeriodLabel(session)}
            </option>
          ))}
        </select>
      </label>

      <label
        className="grid gap-2 text-sm font-bold text-foreground"
        htmlFor={`${idPrefix}-format`}
      >
        Formato
        <select
          className={filterControlClassName}
          id={`${idPrefix}-format`}
          onChange={(event) =>
            onChange({
              ...draft,
              format: (event.target.value || undefined) as ExamFormat | undefined,
            })
          }
          value={draft.format ?? ''}
        >
          <option value="">Todos los formatos</option>
          {formats.map((format) => (
            <option key={format} value={format}>
              {examFormatLabel(format)}
            </option>
          ))}
        </select>
      </label>

      <label
        className="grid gap-2 text-sm font-bold text-foreground"
        htmlFor={`${idPrefix}-outcome`}
      >
        Resultado
        <select
          className={filterControlClassName}
          id={`${idPrefix}-outcome`}
          onChange={(event) =>
            onChange({
              ...draft,
              outcome: (event.target.value || undefined) as ExamOutcome | undefined,
            })
          }
          value={draft.outcome ?? ''}
        >
          <option value="">Todos los resultados</option>
          {outcomes.map((outcome) => (
            <option key={outcome} value={outcome}>
              {examOutcomeLabel(outcome)}
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

function FinalExperienceListContent({ state }: { state: ExamExperienceDiscoveryState }) {
  const router = useRouter();
  const [requestState, setRequestState] = useState<ExperienceRequestState>({ status: 'loading' });
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

    void getExamExperienceDiscovery({ ...state, limit: pageSize })
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

  const updateState = (nextState: ExamExperienceDiscoveryState) => {
    router.push(toExamExperienceDiscoveryHref(nextState));
  };
  const applyFilters = () => updateState({ ...state, ...draftFilters, page: 1 });
  const clearDraftFilters = () => setDraftFilters({});
  const clearFilters = () =>
    updateState({
      ...state,
      format: undefined,
      outcome: undefined,
      page: 1,
      professorId: undefined,
      session: undefined,
      subjectId: undefined,
      year: undefined,
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
    <main className="min-h-[calc(100dvh-4.5rem)] bg-background pb-16">
      <section className="relative isolate overflow-hidden border-b border-foreground bg-foreground text-background">
        <div className="relative mx-auto grid max-w-[1180px] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="px-5 py-12 sm:px-10 sm:py-16 lg:py-20">
            <p className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-background/70">
              Faro cobalto
            </p>
            <h1 className="mt-4 max-w-[10ch] font-serif text-[clamp(3.1rem,6vw,5.4rem)] font-bold leading-[0.9] tracking-[-0.045em]">
              Mesas que ya pasaron.
            </h1>
            <p className="mt-6 max-w-[56ch] font-serif text-lg leading-relaxed text-background/85 sm:text-xl">
              Leé qué tomaron, en qué período y cómo fue la experiencia antes de preparar tu final.
            </p>
          </div>
          <div className="relative min-h-[17rem] border-t border-background/20 lg:border-l lg:border-t-0">
            <Image
              alt="Faro nocturno en pixel art para representar experiencias de final"
              className="object-cover object-center"
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 58vw"
              src="/assets/pixel-notebook/heroes/hero-finals-cobalto-lighthouse-1280.webp"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1180px] px-5 py-9 sm:px-10 sm:py-12">
        <div className="flex flex-col gap-5 border-y border-line py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-primary">
              Archivo de finales
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-foreground sm:text-4xl">
              {results ? `${results.meta.total} experiencias publicadas` : 'Explorá experiencias'}
            </h2>
          </div>
          <p className="max-w-[46ch] border border-border bg-secondary px-4 py-3 text-sm leading-relaxed text-secondary-foreground">
            <CalendarDays aria-hidden="true" className="mr-2 inline size-4 text-primary" />
            Orden estable: fecha exacta cuando se conoce; si no, fecha de publicación. No se ordena
            por nota.
          </p>
        </div>

        <section aria-label="Filtros de finales" className="mt-7">
          <div className="flex items-center justify-between gap-4 lg:hidden">
            <h2 className="font-serif text-2xl font-bold text-foreground">Filtros</h2>
            <FilterSheet
              description="Refiná las experiencias por el contexto de la mesa."
              onApply={applyFilters}
              onClear={clearDraftFilters}
              title="Filtrar finales"
              trigger={
                <Button variant="outline">
                  <Filter aria-hidden="true" className="size-4" />
                  Filtros
                </Button>
              }
            >
              <FilterSheetFieldSet legend="Contexto del final">
                <FilterFields
                  draft={draftFilters}
                  idPrefix="mobile-exam-filter"
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
              idPrefix="desktop-exam-filter"
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
              {state.year ? (
                <Button
                  aria-label={`Quitar filtro Año: ${state.year}`}
                  onClick={() => clearFilter('year')}
                  size="sm"
                  variant="outline"
                >
                  Año: {state.year} ×
                </Button>
              ) : null}
              {state.session ? (
                <Button
                  aria-label={`Quitar filtro Período: ${examPeriodLabel(state.session)}`}
                  onClick={() => clearFilter('session')}
                  size="sm"
                  variant="outline"
                >
                  Período: {examPeriodLabel(state.session)} ×
                </Button>
              ) : null}
              {state.format ? (
                <Button
                  aria-label={`Quitar filtro Formato: ${examFormatLabel(state.format)}`}
                  onClick={() => clearFilter('format')}
                  size="sm"
                  variant="outline"
                >
                  Formato: {examFormatLabel(state.format)} ×
                </Button>
              ) : null}
              {state.outcome ? (
                <Button
                  aria-label={`Quitar filtro Resultado: ${examOutcomeLabel(state.outcome)}`}
                  onClick={() => clearFilter('outcome')}
                  size="sm"
                  variant="outline"
                >
                  Resultado: {examOutcomeLabel(state.outcome)} ×
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

        <section aria-labelledby="exam-results" className="mt-10">
          <h2
            id="exam-results"
            className="border-b border-line pb-4 font-serif text-3xl font-bold text-foreground"
          >
            Experiencias de final
          </h2>

          {requestState.status === 'loading' ? (
            <LoadingState
              className="mt-7"
              description="Estamos reuniendo experiencias de final publicadas."
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
              description="Conservamos tus filtros para que puedas intentarlo de nuevo."
            />
          ) : null}

          {results?.data.length ? (
            <div className="mt-7 grid gap-5 lg:grid-cols-2">
              {results.data.map((experience) => (
                <FinalExperienceSummaryCard
                  key={experience.id}
                  summary={{
                    author: { username: experience.author.username },
                    createdAt: experience.createdAt,
                    difficulty: experience.difficulty,
                    examDate: experience.examDate,
                    examinerName: experience.examinerName,
                    excerpt: experience.excerpt,
                    format: experience.format,
                    id: experience.id,
                    outcome: experience.outcome,
                    professorName: experience.professor?.name,
                    session: experience.session,
                    shift: experience.shift,
                    subject: experience.subject,
                    updatedAt: experience.updatedAt,
                    year: experience.year,
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
                  ? 'No hay finales con estos filtros'
                  : 'Todavía no hay experiencias de final'
              }
              description={
                filtersAreActive
                  ? 'Quitá uno o más filtros para ampliar el archivo de mesas.'
                  : 'Cuando la comunidad comparta mesas, aparecerán acá.'
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
              aria-label="Paginación de finales"
              className="mt-8 flex items-center justify-between gap-4"
            >
              {state.page > 1 ? (
                <Button asChild variant="outline">
                  <Link href={toExamExperienceDiscoveryHref({ ...state, page: state.page - 1 })}>
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
                  <Link href={toExamExperienceDiscoveryHref({ ...state, page: state.page + 1 })}>
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
    </main>
  );
}

export function ExamExperienceDiscoveryPage() {
  const searchParams = useSearchParams();
  const rawSearch = searchParams.toString();
  const state = useMemo(
    () => parseExamExperienceDiscoveryState(new URLSearchParams(rawSearch)),
    [rawSearch],
  );

  return <FinalExperienceListContent key={rawSearch} state={state} />;
}
