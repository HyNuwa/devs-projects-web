'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { ExperienceCard } from '@/components/experiences/ExperienceCard';
import { Button } from '@/components/ui/shadcn';
import { cn } from '@/components/ui/shadcn/utils';
import {
  courseAttempts,
  courseConditions,
  courseShifts,
  examFormats,
  examOutcomes,
  examSessions,
  getCourseReviewDiscovery,
  getExamExperienceDiscovery,
} from '@/lib/discovery-client';
import {
  courseAttemptLabel,
  courseConditionLabel,
  examFormatLabel,
  examOutcomeLabel,
  examPeriodLabel,
  shiftLabel,
} from '@/lib/presentation-labels';
import { toSubjectExperiencesHref } from '@/lib/subject-experiences-state';
import type { SubjectExperiencesState } from '@/lib/subject-experiences-state';
import type { ExperienceRecentEntry } from '@/lib/experiences-client';
import type { SubjectHub } from '@/types/subject';

const PAGE_SIZE = 10;

type Tab = SubjectExperiencesState['tab'];
type ListState = {
  status: 'loading' | 'ready' | 'error';
  items: ExperienceRecentEntry[];
  total: number;
  page: number;
};

const chipSelect =
  'min-h-11 shrink-0 rounded-lg border-[1.5px] border-foreground bg-card px-3 font-sans text-sm font-semibold text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-60';

const tabIds: Record<Tab, { panel: string; tab: string }> = {
  resenas: { panel: 'subject-experiences-panel-resenas', tab: 'subject-experiences-tab-resenas' },
  finales: { panel: 'subject-experiences-panel-finales', tab: 'subject-experiences-tab-finales' },
};
const tabOrder: Tab[] = ['resenas', 'finales'];

function fetchTabPage(
  tab: Tab,
  subjectId: string,
  filtered: Record<string, unknown>,
  page: number,
): Promise<{ items: ExperienceRecentEntry[]; total: number }> {
  const query = { limit: PAGE_SIZE, page, subjectId, ...filtered };
  return (
    tab === 'resenas' ? getCourseReviewDiscovery(query) : getExamExperienceDiscovery(query)
  ).then((result) => ({
    items: result.data.map((entry) =>
      tab === 'resenas'
        ? ({ kind: 'review', review: entry } as ExperienceRecentEntry)
        : ({ kind: 'exam', exam: entry } as ExperienceRecentEntry),
    ),
    total: result.meta.total,
  }));
}

/**
 * The materia's public experiencias lists (openspec
 * academic-community/experiences): namespaced URL filters per tab, 10-entry
 * pages kept in a keyed list child so a stale page-1/page-2 reply can never
 * replace a newer filtered list.
 */
export function ExperienceTabs({
  code,
  reviewCount,
  examCount,
  state,
  subject,
}: {
  code: string;
  /** Unfiltered per-type totals from the summary, when already known. */
  reviewCount?: number;
  examCount?: number;
  state: SubjectExperiencesState;
  subject: SubjectHub;
}) {
  const router = useRouter();
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ finales: null, resenas: null });

  const tab = state.tab;
  const requestKey = JSON.stringify({
    subjectId: subject.id,
    tab,
    ...state[tab === 'resenas' ? 'reviews' : 'exams'],
  });
  const filtered =
    tab === 'resenas'
      ? {
          academicYear: state.reviews.academicYear,
          attempt: state.reviews.attempt,
          condition: state.reviews.condition,
          professorId: state.reviews.professorId,
          shift: state.reviews.shift,
          sort: state.reviews.sort,
        }
      : {
          format: state.exams.format,
          outcome: state.exams.outcome,
          professorId: state.exams.professorId,
          session: state.exams.session,
          year: state.exams.year,
        };

  const update = (next: SubjectExperiencesState) => {
    // The URL is the single source of truth; the page re-renders on push.
    router.push(toSubjectExperiencesHref(code, next), { scroll: false });
  };

  const selectTab = (kind: Tab) => {
    if (kind !== tab) update({ ...state, tab: kind });
    tabRefs.current[kind]?.focus();
  };

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys: Record<string, number> = {
      ArrowLeft: (index - 1 + tabOrder.length) % tabOrder.length,
      ArrowRight: (index + 1) % tabOrder.length,
      End: tabOrder.length - 1,
      Home: 0,
    };
    if (event.key in keys) {
      event.preventDefault();
      selectTab(tabOrder[keys[event.key]]);
    }
  };

  const professorOptions = subject.professors.map((entry) => entry.professor);
  const professorFallback = (selected: string | undefined) =>
    selected && !professorOptions.some((professor) => professor.id === selected)
      ? [{ label: 'Profesor seleccionado en el enlace', value: selected }]
      : [];

  const countFor = (kind: Tab) => (kind === 'resenas' ? reviewCount : examCount);
  const filterActive =
    tab === 'resenas'
      ? Boolean(
          state.reviews.academicYear ||
          state.reviews.shift ||
          state.reviews.professorId ||
          state.reviews.attempt ||
          state.reviews.condition,
        )
      : Boolean(
          state.exams.session ||
          state.exams.year ||
          state.exams.format ||
          state.exams.professorId ||
          state.exams.outcome,
        );

  return (
    <section aria-label="Experiencias de la materia" className="min-w-0">
      <div aria-label="Tipo de experiencia" className="flex gap-2" role="tablist">
        {tabOrder.map((kind, index) => {
          const count = countFor(kind);
          return (
            <button
              aria-controls={tabIds[kind].panel}
              aria-selected={tab === kind}
              className={cn(
                'min-h-11 rounded-lg border-[1.5px] px-4 font-sans text-sm font-extrabold transition-colors',
                tab === kind
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-foreground bg-card text-card-foreground hover:bg-muted',
              )}
              id={tabIds[kind].tab}
              key={kind}
              onClick={() => selectTab(kind)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              ref={(node) => {
                tabRefs.current[kind] = node;
              }}
              role="tab"
              tabIndex={tab === kind ? 0 : -1}
              type="button"
            >
              {kind === 'resenas' ? 'Reseñas' : 'Finales'}
              {count === undefined ? '' : ` · ${count}`}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
        {tab === 'resenas' ? (
          <>
            <FilterSelect
              ariaLabel="Ciclo"
              onChange={(value) =>
                update({
                  ...state,
                  reviews: {
                    ...state.reviews,
                    academicYear: value ? Number(value) : undefined,
                  },
                })
              }
              options={academicYears().map((year) => ({
                label: `Ciclo ${year}`,
                value: String(year),
              }))}
              placeholder="Ciclo"
              value={state.reviews.academicYear ? String(state.reviews.academicYear) : ''}
            />
            <FilterSelect
              ariaLabel="Franja"
              onChange={(value) =>
                update({
                  ...state,
                  reviews: {
                    ...state.reviews,
                    shift: (value || undefined) as SubjectExperiencesState['reviews']['shift'],
                  },
                })
              }
              options={courseShifts.map((shift) => ({ label: shiftLabel(shift), value: shift }))}
              placeholder="Franja"
              value={state.reviews.shift ?? ''}
            />
            <FilterSelect
              ariaLabel="Profesor"
              onChange={(value) =>
                update({
                  ...state,
                  reviews: { ...state.reviews, professorId: value || undefined },
                })
              }
              options={[
                ...professorOptions.map((professor) => ({
                  label: professor.name,
                  value: professor.id,
                })),
                ...professorFallback(state.reviews.professorId),
              ]}
              placeholder="Profesor"
              value={state.reviews.professorId ?? ''}
            />
            <FilterSelect
              ariaLabel="Situación"
              onChange={(value) =>
                update({
                  ...state,
                  reviews: {
                    ...state.reviews,
                    attempt: (value || undefined) as SubjectExperiencesState['reviews']['attempt'],
                  },
                })
              }
              options={courseAttempts.map((attempt) => ({
                label: courseAttemptLabel(attempt),
                value: attempt,
              }))}
              placeholder="Situación"
              value={state.reviews.attempt ?? ''}
            />
            <FilterSelect
              ariaLabel="Resultado"
              onChange={(value) =>
                update({
                  ...state,
                  reviews: {
                    ...state.reviews,
                    condition: (value ||
                      undefined) as SubjectExperiencesState['reviews']['condition'],
                  },
                })
              }
              options={courseConditions.map((condition) => ({
                label: courseConditionLabel(condition),
                value: condition,
              }))}
              placeholder="Resultado"
              value={state.reviews.condition ?? ''}
            />
            <FilterSelect
              ariaLabel="Orden"
              onChange={(value) =>
                update({
                  ...state,
                  reviews: {
                    ...state.reviews,
                    sort: (value || 'RECENT') as SubjectExperiencesState['reviews']['sort'],
                  },
                })
              }
              options={[
                { label: 'Más recientes', value: 'RECENT' },
                { label: 'Mejor recomendadas', value: 'STARS_DESC' },
                { label: 'Menos recomendadas', value: 'STARS_ASC' },
              ]}
              value={state.reviews.sort}
            />
          </>
        ) : (
          <>
            <FilterSelect
              ariaLabel="Período"
              onChange={(value) =>
                update({
                  ...state,
                  exams: {
                    ...state.exams,
                    session: (value || undefined) as SubjectExperiencesState['exams']['session'],
                  },
                })
              }
              options={examSessions.map((session) => ({
                label: examPeriodLabel(session),
                value: session,
              }))}
              placeholder="Período"
              value={state.exams.session ?? ''}
            />
            <FilterSelect
              ariaLabel="Año del final"
              onChange={(value) =>
                update({
                  ...state,
                  exams: {
                    ...state.exams,
                    year: value ? Number(value) : undefined,
                  },
                })
              }
              options={academicYears().map((year) => ({
                label: String(year),
                value: String(year),
              }))}
              placeholder="Año"
              value={state.exams.year ? String(state.exams.year) : ''}
            />
            <FilterSelect
              ariaLabel="Formato"
              onChange={(value) =>
                update({
                  ...state,
                  exams: {
                    ...state.exams,
                    format: (value || undefined) as SubjectExperiencesState['exams']['format'],
                  },
                })
              }
              options={examFormats.map((format) => ({
                label: examFormatLabel(format),
                value: format,
              }))}
              placeholder="Formato"
              value={state.exams.format ?? ''}
            />
            <FilterSelect
              ariaLabel="Profesor"
              onChange={(value) =>
                update({
                  ...state,
                  exams: { ...state.exams, professorId: value || undefined },
                })
              }
              options={[
                ...professorOptions.map((professor) => ({
                  label: professor.name,
                  value: professor.id,
                })),
                ...professorFallback(state.exams.professorId),
              ]}
              placeholder="Profesor"
              value={state.exams.professorId ?? ''}
            />
            <FilterSelect
              ariaLabel="Resultado"
              onChange={(value) =>
                update({
                  ...state,
                  exams: {
                    ...state.exams,
                    outcome: (value || undefined) as SubjectExperiencesState['exams']['outcome'],
                  },
                })
              }
              options={examOutcomes.map((outcome) => ({
                label: examOutcomeLabel(outcome),
                value: outcome,
              }))}
              placeholder="Resultado"
              value={state.exams.outcome ?? ''}
            />
          </>
        )}
      </div>

      <div
        aria-labelledby={tabIds[tab].tab}
        className="mt-4"
        id={tabIds[tab].panel}
        role="tabpanel"
      >
        <ExperienceList
          filtered={filtered}
          filterActive={filterActive}
          key={requestKey}
          onClearFilters={() =>
            update(
              tab === 'resenas'
                ? { ...state, reviews: { sort: 'RECENT' } }
                : { ...state, exams: {} },
            )
          }
          subjectId={subject.id}
          tab={tab}
        />
      </div>
    </section>
  );
}

/**
 * Owns its page state and requests; keyed by the request key, so a filter/tab
 * change unmounts it and drops every in-flight page-1/page-2 promise.
 */
function ExperienceList({
  filtered,
  filterActive,
  onClearFilters,
  subjectId,
  tab,
}: {
  filtered: Record<string, unknown>;
  filterActive: boolean;
  onClearFilters: () => void;
  subjectId: string;
  tab: Tab;
}) {
  const [list, setList] = useState<ListState>({ items: [], page: 0, status: 'loading', total: 0 });
  const [now] = useState(() => new Date());
  const loading = useRef(false);

  useEffect(() => {
    let current = true;
    loading.current = true;
    void fetchTabPage(tab, subjectId, filtered, 1).then(
      (result) => {
        if (current) {
          loading.current = false;
          setList({ items: result.items, page: 1, status: 'ready', total: result.total });
        }
      },
      () => {
        if (current) {
          loading.current = false;
          setList({ items: [], page: 0, status: 'error', total: 0 });
        }
      },
    );
    return () => {
      current = false;
      loading.current = false;
    };
    // The parent's `key` remounts this component on any request change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = () => {
    // page 0 means the first fetch failed; a retry must still be possible.
    if (loading.current || (list.page > 0 && list.items.length >= list.total)) return;
    const next = list.page + 1;
    const base = list.items;
    loading.current = true;
    setList({ ...list, status: 'loading' });
    void fetchTabPage(tab, subjectId, filtered, next).then(
      (result) => {
        loading.current = false;
        setList({
          items: [...base, ...result.items],
          page: next,
          status: 'ready',
          total: result.total,
        });
      },
      () => {
        loading.current = false;
        setList({ items: base, page: list.page, status: 'error', total: list.total });
      },
    );
  };

  const busy = list.status === 'loading';
  const failed = list.status === 'error';
  const hasMore = list.items.length < list.total;

  return (
    <div className="grid gap-4">
      {busy && list.items.length === 0 ? (
        <p className="font-sans text-sm font-semibold text-muted-foreground" role="status">
          Cargando experiencias…
        </p>
      ) : null}
      {failed ? (
        <div
          className="flex flex-wrap items-center gap-3 rounded-lg border-[1.5px] border-line bg-card px-4 py-3"
          role="alert"
        >
          <p className="font-sans text-sm font-semibold text-muted-foreground">
            No pudimos cargar estas experiencias.
          </p>
          <Button onClick={loadMore} size="sm" variant="outline">
            Reintentar
          </Button>
        </div>
      ) : null}
      {list.items.map((entry) => (
        <ExperienceCard
          entry={entry}
          key={entry.kind === 'review' ? `r-${entry.review.id}` : `e-${entry.exam.id}`}
          now={now}
        />
      ))}
      {!busy && !failed && list.items.length === 0 ? (
        <div className="rounded-lg border-[1.5px] border-line bg-card px-4 py-6 text-center">
          <p className="font-sans text-sm font-semibold text-muted-foreground">
            {filterActive
              ? 'Ninguna experiencia coincide con estos filtros.'
              : 'Todavía no hay experiencias de este tipo.'}
          </p>
          {filterActive ? (
            <Button className="mt-3" onClick={onClearFilters} size="sm" variant="outline">
              Limpiar filtros
            </Button>
          ) : null}
        </div>
      ) : null}
      {hasMore && !failed ? (
        <Button disabled={busy} onClick={loadMore} variant="outline">
          {busy && list.items.length > 0 ? 'Cargando…' : 'Ver más'}
        </Button>
      ) : null}
    </div>
  );
}

function FilterSelect({
  ariaLabel,
  onChange,
  options,
  placeholder,
  value,
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  /** When omitted there is no "all" option (the field always has a value). */
  placeholder?: string;
  value: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      className={chipSelect}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {placeholder === undefined ? null : <option value="">{placeholder}: todos</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/** Parser/API accept 1900..next year; enumerate that range descending. */
function academicYears() {
  const newest = new Date().getUTCFullYear() + 1;
  return Array.from({ length: newest - 1900 + 1 }, (_, index) => newest - index);
}
