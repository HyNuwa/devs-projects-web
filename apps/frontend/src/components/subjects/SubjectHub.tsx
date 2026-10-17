'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, FileText, Sparkles, Users } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

import { SubjectExperiencesSummaryCard } from '@/components/experiences/SubjectExperiencesSummaryCard';
import { MaterialPreviewDialog } from '@/components/discovery/MaterialPreviewDialog';
import {
  Breadcrumb,
  Button,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/ui/shadcn';
import { api } from '@/lib/api';
import { getApiError, getData } from '@/lib/apiHelpers';
import { browsePath } from '@/lib/catalog-client';
import { getMaterialDiscovery } from '@/lib/discovery-client';
import { resourceTypeLabel } from '@/lib/presentation-labels';
import { getTopMaterials, type TopMaterial } from '@/lib/ranking-client';
import { byCareerName, trailPlacement } from '@/lib/subject-context';
import { useUbicacionStore } from '@/stores/ubicacionStore';
import type { Material } from '@/types/material';
import type { SubjectHub as SubjectHubType } from '@/types/subject';

type SubjectHubData = {
  top: TopMaterial[];
  subject: SubjectHubType;
};

type SubjectHubState =
  | { status: 'loading' }
  | { data: SubjectHubData; status: 'ready' }
  | { error: string; status: 'error' };

function HubTab({
  active,
  children,
  id,
  onSelect,
}: {
  active: boolean;
  children: ReactNode;
  id: 'materials';
  onSelect: (tab: 'materials') => void;
}) {
  return (
    <button
      aria-controls={`subject-hub-panel-${id}`}
      aria-selected={active}
      className={`min-h-11 border-b-2 px-3 font-sans text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-5 ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
      }`}
      id={`subject-hub-tab-${id}`}
      onClick={() => onSelect(id)}
      role="tab"
      type="button"
    >
      {children}
    </button>
  );
}

const topButtonId = (id: string) => `subject-top-${id}`;

/**
 * «Más útiles este cuatrimestre» (openspec reputation/rankings): the materials
 * with the most valid «Me sirvió» this cuatrimestre. Hidden when empty.
 */
function TopMaterials({ entries, subjectName }: { entries: TopMaterial[]; subjectName: string }) {
  const [open, setOpen] = useState<TopMaterial['material'] | null>(null);
  if (entries.length === 0) return null;

  return (
    <section
      aria-labelledby="subject-top-materials"
      className="rounded-2xl border-[1.5px] border-foreground bg-secondary p-4 sm:p-5"
    >
      <h3
        className="flex items-center gap-2 font-sans text-lg font-extrabold text-foreground"
        id="subject-top-materials"
      >
        <Sparkles aria-hidden="true" className="size-5 text-primary" strokeWidth={1.7} />
        Más útiles este cuatrimestre
      </h3>
      <ol className="mt-3 grid gap-2">
        {entries.map(({ rank, material, helpful }) => (
          <li className="flex items-center gap-3" key={material.id}>
            <span className="w-9 shrink-0 font-sans text-sm font-extrabold tabular-nums">
              {rank}.º
            </span>
            <button
              className="min-w-0 flex-1 truncate text-left font-sans text-base font-bold text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              id={topButtonId(material.id)}
              onClick={() => setOpen(material)}
              type="button"
            >
              {material.title}
              <span className="ml-2 font-sans text-sm font-semibold text-muted-foreground">
                {resourceTypeLabel(material.resourceType)}
              </span>
            </button>
            <span className="shrink-0 font-sans text-sm font-extrabold tabular-nums text-primary">
              {helpful} «Me sirvió»
            </span>
          </li>
        ))}
      </ol>
      {open ? (
        <MaterialPreviewDialog
          file={open}
          focusTargetId={topButtonId(open.id)}
          onRequestClose={() => setOpen(null)}
          open
          subjectName={subjectName}
        />
      ) : null}
    </section>
  );
}

function MaterialList({ materials, query }: { materials: Material[]; query: string }) {
  if (materials.length === 0) {
    return query ? (
      <EmptyState
        description="Probá con otras palabras o borrá la búsqueda para ver todos."
        heading={`No encontramos materiales para «${query}»`}
      />
    ) : (
      <EmptyState
        action={
          <Button asChild variant="outline">
            <Link href="/materiales/nuevo">Subir material</Link>
          </Button>
        }
        description="Cuando haya recursos aprobados para esta materia, aparecerán en este archivo."
        heading="Todavía no hay materiales públicos"
      />
    );
  }

  return (
    <div className="grid gap-3">
      {materials.map((material) => (
        <Link
          className="flex min-h-20 items-center gap-4 border border-border bg-card p-4 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          href={`/materiales/${encodeURIComponent(material.id)}`}
          key={material.id}
        >
          <FileText aria-hidden="true" className="size-5 shrink-0 text-primary" strokeWidth={1.7} />
          <span className="min-w-0 flex-1">
            <strong className="block truncate font-sans text-lg text-card-foreground">
              {material.title}
            </strong>
            <span className="mt-1 block font-sans text-sm text-muted-foreground">
              {resourceTypeLabel(material.resourceType)} · {material.downloadCount} descargas
            </span>
          </span>
          <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.06em] text-primary">
            Abrir
          </span>
        </Link>
      ))}
    </div>
  );
}

/** «FI (UNJU) · Ingeniería Informática · Año 2 · Cuatrimestre 1 · 6 créditos» */
function placementLabel(plan: SubjectHubType['studyPlans'][number]): string {
  const { career } = plan.studyPlan;
  return [
    `${career.faculty.shortName} (${career.faculty.university.shortName})`,
    career.name,
    ...(plan.year === null
      ? ['Optativa']
      : [`Año ${plan.year}`, plan.semester === 0 ? 'Anual' : `Cuatrimestre ${plan.semester}`]),
    ...(plan.credits ? [`${plan.credits} créditos`] : []),
  ].join(' · ');
}

export function SubjectHub({ code }: { code: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get('q')?.trim() ?? '';
  const myCareers = useUbicacionStore((store) => store.myCareers);
  const [attempt, setAttempt] = useState(0);
  const [activeTab, setActiveTab] = useState<'materials'>('materials');
  const [state, setState] = useState<SubjectHubState>({ status: 'loading' });
  const [materials, setMaterials] = useState<Material[]>([]);
  const subjectId = state.status === 'ready' ? state.data.subject.id : null;

  // Materials follow the materia search in the URL (openspec academic-resources/discovery).
  useEffect(() => {
    if (!subjectId) return;
    let isCurrent = true;
    getMaterialDiscovery({
      limit: 20,
      page: 1,
      sort: query ? 'RELEVANCE' : 'RECENT',
      subjectId,
      ...(query ? { search: query } : {}),
    })
      .then((result) => {
        if (isCurrent) setMaterials(result.data);
      })
      .catch(() => {
        if (isCurrent) setMaterials([]);
      });
    return () => {
      isCurrent = false;
    };
  }, [subjectId, query]);

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = String(new FormData(event.currentTarget).get('q') ?? '').trim();
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set('q', next);
    else params.delete('q');
    const suffix = params.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
  };

  useEffect(() => {
    let isCurrent = true;

    void Promise.all([
      api.get<SubjectHubType>(`/subjects/${encodeURIComponent(code)}`),
      // The ranking is a bonus: the materia page loads without it.
      getTopMaterials(code).catch(() => null),
    ])
      .then(([subjectResponse, topMaterials]) => {
        const subject = getData(subjectResponse);
        if (isCurrent) {
          setState({
            data: { subject, top: topMaterials?.entries ?? [] },
            status: 'ready',
          });
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) setState({ error: getApiError(error), status: 'error' });
      });

    return () => {
      isCurrent = false;
    };
  }, [attempt, code]);

  if (state.status === 'loading') {
    return (
      <div className="mx-auto grid w-full max-w-[1180px] px-3 py-12 sm:px-6 sm:py-16">
        <LoadingState
          description="Estamos reuniendo el contexto y los aportes de esta materia."
          heading="Cargando materia"
        />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="mx-auto grid w-full max-w-3xl gap-5 px-3 py-12 sm:px-6 sm:py-16">
        <ErrorState
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => setAttempt((value) => value + 1)}>Reintentar</Button>
              <Button asChild variant="outline">
                <Link href="/universidades">Volver a materias</Link>
              </Button>
            </div>
          }
          description={state.error}
          heading="No pudimos cargar esta materia"
        />
      </div>
    );
  }

  const { subject, top } = state.data;
  const placements = [...subject.studyPlans].sort(byCareerName);
  const here = trailPlacement(placements, searchParams.get('carrera'), myCareers);
  const career = here?.studyPlan.career ?? null;
  const careerHref = career
    ? browsePath.career(career.faculty.university.shortName, career.faculty.shortName, career.code)
    : browsePath.universities();

  return (
    <div className="mx-auto grid w-full max-w-[1180px] gap-8 px-3 py-7 sm:px-6 sm:py-10">
      <Breadcrumb
        aria-label="Ruta"
        items={[
          { href: browsePath.universities(), label: 'Universidades' },
          ...(career
            ? [
                {
                  href: browsePath.university(career.faculty.university.shortName),
                  label: career.faculty.university.shortName,
                },
                {
                  href: browsePath.faculty(
                    career.faculty.university.shortName,
                    career.faculty.shortName,
                  ),
                  label: career.faculty.shortName,
                },
                { href: careerHref, label: career.name },
              ]
            : []),
          { label: subject.name },
        ]}
      />

      <header className="grid gap-6 border-b border-line pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="flex items-center gap-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.1em] text-primary">
            <Sparkles aria-hidden="true" className="size-4" strokeWidth={1.8} />
            Materia
          </p>
          <h1 className="mt-3 max-w-[16ch] font-sans text-5xl font-bold leading-[0.92] tracking-[-0.035em] text-foreground sm:text-6xl">
            {subject.name}
          </h1>
          {subject.description ? (
            <p className="mt-4 max-w-2xl font-sans leading-relaxed text-muted-foreground">
              {subject.description}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            {subject.code ? <Chip tone="neutral">Código {subject.code}</Chip> : null}
            {placements.map((placement) => (
              <Chip key={placementLabel(placement)} tone="neutral">
                {placementLabel(placement)}
              </Chip>
            ))}
          </div>
        </div>
        <Button asChild className="lg:justify-self-end" variant="outline">
          <Link href={careerHref}>
            <BookOpen aria-hidden="true" className="size-4" />
            {career ? 'Ver la carrera' : 'Explorar materias'}
          </Link>
        </Button>
      </header>

      <SubjectExperiencesSummaryCard careerId={career?.id} code={code} />

      {subject.professors.length > 0 ? (
        <section aria-labelledby="subject-professors" className="border border-border bg-card p-5">
          <h2
            className="flex items-center gap-2 font-sans text-2xl font-bold text-card-foreground"
            id="subject-professors"
          >
            <Users aria-hidden="true" className="size-5 text-primary" strokeWidth={1.7} />
            Profesores vinculados
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {subject.professors.map(({ professor }) => (
              <Button asChild key={professor.id} size="sm" variant="outline">
                <Link href={`/profesores/${encodeURIComponent(professor.id)}`}>
                  {professor.name}
                </Link>
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-label="Contenido de la materia" className="grid gap-6">
        <div aria-label="Secciones de la materia" className="border-b border-line" role="tablist">
          <HubTab active={activeTab === 'materials'} id="materials" onSelect={setActiveTab}>
            Materiales ({materials.length})
          </HubTab>
        </div>

        {activeTab === 'materials' ? (
          <section
            aria-labelledby="subject-hub-tab-materials"
            id="subject-hub-panel-materials"
            role="tabpanel"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-sans text-3xl font-bold text-foreground">Materiales</h2>
                <p className="mt-2 font-sans text-muted-foreground">
                  Recursos aprobados para esta materia.
                </p>
              </div>
              <Button asChild>
                <Link href="/materiales/nuevo">Subir material</Link>
              </Button>
            </div>
            <form className="mt-6 flex flex-wrap gap-2" onSubmit={search} role="search">
              <label className="sr-only" htmlFor="subject-material-search">
                Buscar en {subject.name}
              </label>
              <input
                className="min-h-11 min-w-0 flex-1 rounded-xl border-[1.5px] border-foreground bg-background px-3 font-sans text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                defaultValue={query}
                id="subject-material-search"
                key={query}
                name="q"
                placeholder="Parcial 1, resumen, final…"
                type="search"
              />
              <Button type="submit" variant="outline">
                Buscar
              </Button>
            </form>
            <div className="mt-6 grid gap-6">
              {query ? null : <TopMaterials entries={top} subjectName={subject.name} />}
              <MaterialList materials={materials} query={query} />
            </div>
          </section>
        ) : null}
      </section>
    </div>
  );
}
