'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';

import { AuthorLink } from '@/components/public-profile/AuthorLink';
import { Button, ErrorState, LoadingState } from '@/components/ui/shadcn';
import { cn } from '@/components/ui/shadcn/utils';
import { getApiError } from '@/lib/apiHelpers';
import {
  getLegends,
  getMonthlyRanking,
  getMyLegendsFaculty,
  getMyMonthlyPlace,
  type Legends,
  type MonthlyRanking,
  type MyMonthlyPlace,
} from '@/lib/ranking-client';
import { getInstitutions, type InstitutionTree } from '@/lib/study-plans-client';
import { useAuthStore } from '@/stores/authStore';

type Tab = 'mes' | 'leyendas';

type Load<T> =
  { status: 'loading' } | { status: 'error'; message: string } | ({ status: 'ready' } & T);

const TABS: { id: Tab; label: string }[] = [
  { id: 'mes', label: 'Este mes en tu carrera' },
  { id: 'leyendas', label: 'Leyendas de la facultad' },
];

const TOP = 10;

const selectClassName =
  'min-h-11 w-full rounded-xl border-[1.5px] border-foreground bg-background px-3 font-sans text-sm font-semibold text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const monthFormat = new Intl.DateTimeFormat('es-AR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** «octubre de 2026» from 'YYYY-MM'. */
function monthLabel(month: string) {
  const [year, number] = month.split('-').map(Number);
  return monthFormat.format(new Date(Date.UTC(year, number - 1, 15)));
}

function Retry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <ErrorState
      action={
        <Button onClick={onRetry} variant="outline">
          Reintentar
        </Button>
      }
      className="mt-4"
      description={message}
    />
  );
}

function Picker({
  children,
  id,
  label,
  onChange,
  value,
}: {
  children: ReactNode;
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-bold" htmlFor={id}>
      {label}
      <select
        className={selectClassName}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        'grid h-9 min-w-11 shrink-0 place-items-center rounded-full border-[1.5px] border-foreground px-2 text-sm font-extrabold tabular-nums',
        rank === 1 ? 'bg-accent shadow-pop' : rank <= 3 ? 'bg-secondary' : 'bg-card',
      )}
    >
      {rank}.º
    </span>
  );
}

/** «Este mes en tu carrera»: the top 10 of the month and the viewer's place below it. */
function MonthlyPanel({ tree }: { tree: InstitutionTree }) {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);
  const [selected, setSelected] = useState<string>();
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<Load<{ ranking: MonthlyRanking; me: MyMonthlyPlace['me'] }>>({
    status: 'loading',
  });

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    (async () => {
      // The viewer's place is extra: the public list loads even when it fails.
      const mine = user ? getMyMonthlyPlace(selected).catch(() => null) : Promise.resolve(null);
      if (selected) {
        const [place, ranking] = await Promise.all([mine, getMonthlyRanking(selected)]);
        return { ranking, me: place?.me ?? null };
      }
      const place = await mine;
      const ranking = await getMonthlyRanking(place?.careerId);
      return { ranking, me: place?.me ?? null };
    })()
      .then((result) => {
        if (active) setState({ status: 'ready', ...result });
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', message: getApiError(error) });
      });
    return () => {
      active = false;
    };
  }, [authLoading, reloadKey, selected, user]);

  const careerId = selected ?? (state.status === 'ready' ? state.ranking.career.id : '');

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[minmax(0,22rem)_1fr] sm:items-end">
        {tree.length > 0 ? (
          <Picker
            id="ranking-career"
            label="Carrera"
            onChange={(value) => {
              setState({ status: 'loading' });
              setSelected(value);
            }}
            value={careerId}
          >
            {tree.flatMap((university) =>
              university.faculties.map((faculty) => (
                <optgroup key={faculty.id} label={`${faculty.shortName} (${university.shortName})`}>
                  {faculty.careers.map((career) => (
                    <option key={career.id} value={career.id}>
                      {career.name}
                    </option>
                  ))}
                </optgroup>
              )),
            )}
          </Picker>
        ) : null}
        {state.status === 'ready' ? (
          <p className="text-sm font-semibold text-muted-foreground">
            Puntos de {monthLabel(state.ranking.month)} en materias de la carrera. Empieza de nuevo
            cada mes.
          </p>
        ) : null}
      </div>

      {state.status === 'loading' ? (
        <LoadingState className="mt-4" heading="Cargando el ranking del mes" />
      ) : state.status === 'error' ? (
        <Retry
          message={state.message}
          onRetry={() => {
            setState({ status: 'loading' });
            setReloadKey((key) => key + 1);
          }}
        />
      ) : state.ranking.entries.length === 0 ? (
        <p className="mt-6 rounded-2xl border-[1.5px] border-dashed border-line p-6 text-center text-sm font-semibold text-muted-foreground">
          Todavía nadie sumó puntos este mes en esta carrera.
        </p>
      ) : (
        <>
          <ol aria-label={`Este mes en ${state.ranking.career.name}`} className="mt-4 grid gap-2">
            {state.ranking.entries.map((entry) => (
              <li
                className="flex items-center gap-3 rounded-2xl border-[1.5px] border-foreground bg-card px-4 py-3"
                key={entry.username}
              >
                <RankBadge rank={entry.rank} />
                <AuthorLink author={entry} className="min-w-0 flex-1 truncate text-base" />
                <span className="shrink-0 rounded-full bg-foreground px-2.5 py-0.5 text-xs font-black text-background">
                  Nv. {entry.level}
                </span>
                <span className="w-16 shrink-0 text-right text-sm font-extrabold tabular-nums">
                  {entry.points} pts
                </span>
              </li>
            ))}
          </ol>
          {state.me && state.me.rank > TOP ? (
            <section
              aria-label="Tu posición"
              className="mt-3 flex items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-foreground bg-secondary px-4 py-3"
            >
              <RankBadge rank={state.me.rank} />
              <span className="min-w-0 flex-1 text-base font-extrabold">Tu posición</span>
              <span className="w-16 shrink-0 text-right text-sm font-extrabold tabular-nums">
                {state.me.points} pts
              </span>
            </section>
          ) : null}
        </>
      )}
    </>
  );
}

/** «Leyendas de la facultad»: a fixed list, alphabetical, by universidad and facultad. */
function LegendsPanel({ tree }: { tree: InstitutionTree }) {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);
  const [selected, setSelected] = useState<string>();
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<Load<{ legends: Legends }>>({ status: 'loading' });

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    (async () => {
      const mine = !selected && user ? await getMyLegendsFaculty().catch(() => null) : null;
      return getLegends(selected ?? mine?.defaultFacultyId ?? undefined);
    })()
      .then((legends) => {
        if (active) setState({ status: 'ready', legends });
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', message: getApiError(error) });
      });
    return () => {
      active = false;
    };
  }, [authLoading, reloadKey, selected, user]);

  const facultyId = selected ?? (state.status === 'ready' ? state.legends.faculty.id : '');
  const university =
    tree.find((u) => u.faculties.some((faculty) => faculty.id === facultyId)) ?? tree[0];
  const choose = (id: string) => {
    setState({ status: 'loading' });
    setSelected(id);
  };

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-[18rem_18rem_1fr] lg:items-end">
        {university ? (
          <>
            <Picker
              id="legends-university"
              label="Universidad"
              onChange={(value) => {
                const first = tree.find((u) => u.id === value)?.faculties[0];
                if (first) choose(first.id);
              }}
              value={university.id}
            >
              {tree.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Picker>
            <Picker id="legends-faculty" label="Facultad" onChange={choose} value={facultyId}>
              {university.faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </Picker>
          </>
        ) : null}
        <p className="text-sm font-semibold text-muted-foreground sm:col-span-2 lg:col-span-1">
          Quienes llegaron al nivel 10 y estudian o estudiaron acá, en orden alfabético.
        </p>
      </div>

      {state.status === 'loading' ? (
        <LoadingState className="mt-4" heading="Cargando las leyendas" />
      ) : state.status === 'error' ? (
        <Retry
          message={state.message}
          onRetry={() => {
            setState({ status: 'loading' });
            setReloadKey((key) => key + 1);
          }}
        />
      ) : state.legends.entries.length === 0 ? (
        <p className="mt-6 rounded-2xl border-[1.5px] border-dashed border-line p-6 text-center text-sm font-semibold text-muted-foreground">
          Todavía no hay leyendas en esta facultad.
        </p>
      ) : (
        <>
          <ul
            aria-label={`Leyendas de ${state.legends.faculty.name}`}
            className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2 lg:grid-cols-3"
          >
            {state.legends.entries.map((legend) => (
              <li
                className="truncate rounded-2xl border-[1.5px] border-foreground bg-card px-4 py-3"
                key={legend.username}
              >
                <AuthorLink author={legend} className="text-base" />
              </li>
            ))}
          </ul>
          {state.legends.truncated ? (
            <p className="mt-3 text-xs font-semibold text-muted-foreground">
              Mostramos las primeras 200 leyendas.
            </p>
          ) : null}
        </>
      )}
    </>
  );
}

/** `/ranking` (openspec reputation/rankings): two bounded rankings, open to anyone. */
export function RankingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get('tab') === 'leyendas' ? 'leyendas' : 'mes';
  const [tree, setTree] = useState<InstitutionTree>([]);
  const [treeFailed, setTreeFailed] = useState(false);

  useEffect(() => {
    let active = true;
    getInstitutions()
      .then((institutions) => {
        if (active) setTree(institutions);
      })
      .catch(() => {
        if (active) setTreeFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'mes') params.delete('tab');
    else params.set('tab', next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  /** Arrow keys, Home and End move between tabs, as the ARIA tabs pattern asks. */
  const onTabKeyDown = (event: KeyboardEvent, index: number) => {
    const last = TABS.length - 1;
    const next = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    selectTab(TABS[next].id);
    document.getElementById(`ranking-tab-${TABS[next].id}`)?.focus();
  };

  return (
    <article className="mx-auto grid w-full max-w-5xl grid-cols-[minmax(0,1fr)] gap-6 px-4 py-10 font-sans sm:py-14">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-link">
          Comunidad · Rankings
        </p>
        <h1 className="mt-1 text-4xl font-extrabold leading-none tracking-[-0.05em] sm:text-5xl">
          Rankings<span className="text-primary">.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-base font-semibold text-muted-foreground">
          Reconocemos a quien ayuda: un ranking por carrera que empieza de nuevo cada mes, y las
          leyendas de cada facultad.
        </p>
      </header>

      <section className="rounded-2xl border-[1.5px] border-foreground bg-card p-5 shadow-pop">
        <div aria-label="Rankings" className="flex flex-wrap gap-2" role="tablist">
          {TABS.map(({ id, label }, index) => (
            <button
              aria-controls={tab === id ? `ranking-panel-${id}` : undefined}
              aria-selected={tab === id}
              className={cn(
                'min-h-11 rounded-full border-[1.5px] border-foreground px-4 text-sm font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                tab === id ? 'bg-foreground text-background' : 'bg-background hover:bg-secondary',
              )}
              id={`ranking-tab-${id}`}
              key={id}
              onClick={() => selectTab(id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              role="tab"
              tabIndex={tab === id ? 0 : -1}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div
          aria-labelledby={`ranking-tab-${tab}`}
          className="mt-5"
          id={`ranking-panel-${tab}`}
          role="tabpanel"
        >
          {treeFailed ? (
            <p className="mb-3 text-sm font-semibold text-muted-foreground">
              No pudimos cargar las carreras y facultades para elegir otra.
            </p>
          ) : null}
          {tab === 'mes' ? <MonthlyPanel tree={tree} /> : <LegendsPanel tree={tree} />}
        </div>
      </section>
    </article>
  );
}
