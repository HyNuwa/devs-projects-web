'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpenText, FileText, FolderOpen, GraduationCap, Search } from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/shadcn/button';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/shadcn/breadcrumb';
import { Input } from '@/components/ui/shadcn/input';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/shadcn/state';
import {
  getHierarchyCareers,
  getHierarchyCategories,
  getHierarchyFiles,
  getHierarchySubjects,
  getHierarchyYears,
} from '@/lib/discovery-hierarchy-client';
import { getMaterialDiscovery } from '@/lib/discovery-client';
import {
  materialHierarchyPath,
  parseMaterialHierarchyRoute,
  toMaterialHierarchyHref,
  type MaterialHierarchyRoute,
} from '@/lib/material-hierarchy-state';
import type { Material, MaterialResourceType, Paginated } from '@/types/material';
import type {
  DiscoveryHierarchyCareer,
  DiscoveryHierarchyCategory,
  DiscoveryHierarchyFile,
  DiscoveryHierarchySubject,
  DiscoveryHierarchyYear,
  DiscoverySubjectList,
} from '@/types/discovery-hierarchy';

const pageSize = 50;

const resourceTypeLabels: Record<MaterialResourceType, string> = {
  PARCIAL: 'Parciales',
  FINAL: 'Finales',
  APUNTE: 'Apuntes',
  RESUMEN: 'Resúmenes',
  TRABAJO_PRACTICO: 'Trabajos prácticos',
  GUIA_EJERCICIOS: 'Guías de ejercicios',
  OTRO: 'Otros recursos',
};

type NestedMaterialHierarchyRoute = Exclude<
  MaterialHierarchyRoute,
  { kind: 'careers' | 'invalid' | 'years' }
>;

type HierarchyView =
  | { kind: 'careers'; careers: DiscoveryHierarchyCareer[]; hasMore: boolean }
  | {
      kind: 'years';
      career: DiscoveryHierarchyCareer;
      hasMore: boolean;
      years: DiscoveryHierarchyYear[];
    }
  | { kind: 'subjects'; context: DiscoverySubjectList }
  | {
      kind: 'categories';
      categories: DiscoveryHierarchyCategory[];
      context: DiscoverySubjectList;
      subject: DiscoveryHierarchySubject;
    }
  | {
      kind: 'files';
      context: DiscoverySubjectList;
      files: DiscoveryHierarchyFile[];
      hasMore: boolean;
      resourceType: MaterialResourceType;
      subject: DiscoveryHierarchySubject;
    }
  | {
      kind: 'search';
      context: DiscoverySubjectList;
      resourceType?: MaterialResourceType;
      results: Paginated<Material>;
      subject: DiscoveryHierarchySubject;
    };

type RequestState =
  { status: 'loading' } | { status: 'ready'; view: HierarchyView } | { status: 'error' };

function yearLabel(year: number): string {
  return `${year}.er año`;
}

function compactCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function subjectsRoute(
  route: NestedMaterialHierarchyRoute,
): Extract<MaterialHierarchyRoute, { kind: 'subjects' }> {
  return {
    kind: 'subjects',
    careerId: route.careerId,
    studyPlanId: route.studyPlanId,
    year: route.year,
  };
}

function categoriesRoute(
  route: Extract<MaterialHierarchyRoute, { kind: 'categories' | 'files' }>,
): Extract<MaterialHierarchyRoute, { kind: 'categories' }> {
  return {
    ...subjectsRoute(route),
    kind: 'categories',
    subjectId: route.subjectId,
  };
}

function subjectFromContext(
  context: DiscoverySubjectList,
  subjectId: string,
): DiscoveryHierarchySubject {
  const subject = context.subjects.find(({ id }) => id === subjectId);

  if (!subject) {
    throw new Error('La materia no pertenece al contexto seleccionado.');
  }

  return subject;
}

async function getHierarchyView(
  route: Exclude<MaterialHierarchyRoute, { kind: 'invalid' }>,
  query: string,
) {
  if (route.kind === 'careers') {
    const response = await getHierarchyCareers();
    return { kind: 'careers', ...response } satisfies HierarchyView;
  }

  if (route.kind === 'years') {
    const response = await getHierarchyYears(route.careerId);
    return { kind: 'years', ...response } satisfies HierarchyView;
  }

  const context = await getHierarchySubjects(route.careerId, route.studyPlanId, route.year);
  if (route.kind === 'subjects') {
    return { kind: 'subjects', context } satisfies HierarchyView;
  }

  const subject = subjectFromContext(context, route.subjectId);
  if (query) {
    const results = await getMaterialDiscovery({
      subjectId: route.subjectId,
      search: query,
      ...(route.kind === 'files' ? { resourceType: route.resourceType } : {}),
      sort: 'RELEVANCE',
      page: 1,
      limit: pageSize,
    });

    return {
      kind: 'search',
      context,
      subject,
      results,
      ...(route.kind === 'files' ? { resourceType: route.resourceType } : {}),
    } satisfies HierarchyView;
  }

  if (route.kind === 'categories') {
    const response = await getHierarchyCategories(route.subjectId);
    return {
      kind: 'categories',
      context,
      subject,
      categories: response.categories,
    } satisfies HierarchyView;
  }

  const response = await getHierarchyFiles(route.subjectId, route.resourceType);
  return {
    kind: 'files',
    context,
    subject,
    files: response.files,
    hasMore: response.hasMore,
    resourceType: route.resourceType,
  } satisfies HierarchyView;
}

function BreadcrumbTrail({
  route,
  view,
}: {
  route: Exclude<MaterialHierarchyRoute, { kind: 'invalid' }>;
  view: HierarchyView;
}) {
  const items: BreadcrumbItem[] = [{ href: '/materiales', label: 'Materiales' }];

  if (view.kind === 'careers') {
    items[0] = { label: 'Materiales' };
  } else if (view.kind === 'years') {
    items.push({ label: view.career.name });
  } else {
    const nestedRoute = route as NestedMaterialHierarchyRoute;
    const yearRoute = subjectsRoute(nestedRoute);
    const categoryRoute =
      route.kind === 'categories' || route.kind === 'files' ? categoriesRoute(route) : undefined;
    const subject = view.kind === 'subjects' ? undefined : view.subject;

    items.push({
      href: materialHierarchyPath({ kind: 'years', careerId: nestedRoute.careerId }),
      label: view.context.career.name,
    });
    items.push({ href: materialHierarchyPath(yearRoute), label: yearLabel(view.context.year) });

    if (subject) {
      items.push({
        href: categoryRoute ? materialHierarchyPath(categoryRoute) : undefined,
        label: subject.name,
      });
    }

    if (view.kind === 'files' || (view.kind === 'search' && view.resourceType)) {
      items.push({ label: resourceTypeLabels[view.resourceType!] });
    }
  }

  return <Breadcrumb className="-mx-1 mb-9" items={items} />;
}

function HierarchyLink({
  description,
  eyebrow,
  href,
  icon,
  meta,
  title,
}: {
  description?: string;
  eyebrow?: string;
  href: string;
  icon: ReactNode;
  meta?: string;
  title: string;
}) {
  return (
    <li>
      <Link
        className="group grid min-h-24 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border border-border bg-card p-4 shadow-surface outline-none transition-colors hover:bg-secondary focus-visible:bg-secondary sm:p-5"
        href={href}
      >
        <span
          aria-hidden="true"
          className="grid size-11 place-items-center border border-border bg-background text-primary"
        >
          {icon}
        </span>
        <span className="min-w-0">
          {eyebrow ? (
            <span className="block font-mono text-[0.65rem] font-extrabold uppercase tracking-[0.08em] text-primary">
              {eyebrow}
            </span>
          ) : null}
          <span className="mt-1 block font-serif text-xl font-bold leading-tight text-foreground group-hover:text-primary">
            {title}
          </span>
          {description ? (
            <span className="mt-1 block text-sm text-secondary-foreground">{description}</span>
          ) : null}
        </span>
        {meta ? (
          <span className="text-right text-sm font-bold text-secondary-foreground">{meta}</span>
        ) : null}
      </Link>
    </li>
  );
}

function ScopedSearch({
  query,
  route,
  subjectName,
}: {
  query: string;
  route: NestedMaterialHierarchyRoute;
  subjectName: string;
}) {
  const router = useRouter();
  const [input, setInput] = useState(query);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(toMaterialHierarchyHref(route, input));
  };

  return (
    <form className="mt-7 flex max-w-2xl gap-2" onSubmit={submit} role="search">
      <label className="sr-only" htmlFor="subject-resource-search">
        Buscar en {subjectName}
      </label>
      <div className="relative min-w-0 flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-primary"
          strokeWidth={1.8}
        />
        <Input
          className="pl-11"
          id="subject-resource-search"
          onChange={(event) => setInput(event.target.value)}
          placeholder="Buscar en esta materia…"
          type="search"
          value={input}
        />
      </div>
      <Button type="submit">Buscar</Button>
    </form>
  );
}

function ScopeIdentity({
  context,
  subject,
}: {
  context: DiscoverySubjectList;
  subject: DiscoveryHierarchySubject;
}) {
  return (
    <header>
      <p className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-primary">
        {context.career.name} · {yearLabel(context.year)}
      </p>
      <h1 className="mt-3 font-serif text-4xl font-bold leading-[0.95] tracking-[-0.035em] text-foreground sm:text-6xl">
        {subject.name}
      </h1>
      <p className="mt-3 text-sm text-secondary-foreground">
        {subject.code ? `Código ${subject.code} · ` : ''}
        {context.studyPlan.name}
      </p>
    </header>
  );
}

function ResourceFileList({
  files,
  hasMore,
  materialRows,
  query,
  route,
  selectedFileId,
}: {
  files?: DiscoveryHierarchyFile[];
  hasMore?: boolean;
  materialRows?: Material[];
  query: string;
  route: NestedMaterialHierarchyRoute;
  selectedFileId?: string;
}) {
  const rows = materialRows
    ? materialRows.map((material) => ({
        id: material.id,
        title: material.title,
        fileType: material.fileType,
        academicYear: material.academicYear,
        createdAt: material.createdAt,
      }))
    : (files ?? []);

  if (rows.length === 0) {
    return null;
  }

  const selectedFile = selectedFileId ? rows.find((file) => file.id === selectedFileId) : undefined;

  return (
    <>
      {selectedFile ? (
        <section
          aria-live="polite"
          className="mt-7 flex flex-wrap items-center justify-between gap-3 border border-primary bg-secondary p-4"
        >
          <p className="text-sm text-foreground">
            <span className="font-mono text-[0.65rem] font-extrabold uppercase tracking-[0.08em] text-primary">
              Archivo seleccionado
            </span>
            <span className="mt-1 block font-bold">{selectedFile.title}</span>
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href={toMaterialHierarchyHref(route, query)} scroll={false}>
              Cerrar selección
            </Link>
          </Button>
        </section>
      ) : null}
      <ul className="mt-7 grid gap-3">
        {rows.map((file) => (
          <li key={file.id}>
            <Link
              aria-label={`Abrir ${file.title}`}
              className={`flex min-h-20 items-center gap-4 border p-4 shadow-surface outline-none transition-colors hover:bg-secondary focus-visible:bg-secondary ${
                selectedFileId === file.id ? 'border-primary bg-secondary' : 'border-border bg-card'
              }`}
              href={toMaterialHierarchyHref(route, query, file.id)}
              scroll={false}
            >
              <span
                aria-hidden="true"
                className="grid size-10 place-items-center border border-border bg-background text-primary"
              >
                <FileText className="size-5" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-foreground">{file.title}</span>
                <span className="mt-1 block text-sm text-secondary-foreground">
                  {file.fileType.toUpperCase()} · {file.academicYear ?? 'Ciclo no informado'}
                </span>
              </span>
              <span className="hidden text-sm text-secondary-foreground sm:block">
                {new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(
                  new Date(file.createdAt),
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {hasMore ? (
        <p className="mt-4 text-sm text-secondary-foreground">
          Mostramos los primeros {pageSize} archivos disponibles.
        </p>
      ) : null}
    </>
  );
}

function ReadyHierarchy({
  query,
  route,
  selectedFileId,
  view,
}: {
  query: string;
  route: Exclude<MaterialHierarchyRoute, { kind: 'invalid' }>;
  selectedFileId?: string;
  view: HierarchyView;
}) {
  if (view.kind === 'careers') {
    return (
      <>
        <header>
          <p className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-primary">
            Materiales
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold leading-[0.95] tracking-[-0.035em] text-foreground sm:text-6xl">
            Elegí tu carrera
          </h1>
          <p className="mt-4 max-w-2xl text-base text-secondary-foreground">
            Entrá por tu plan de estudios para encontrar los recursos en su contexto académico.
          </p>
        </header>
        {view.careers.length > 0 ? (
          <ul className="mt-9 grid gap-4 sm:grid-cols-2">
            {view.careers.map((career) => (
              <HierarchyLink
                description={career.code}
                href={materialHierarchyPath({ kind: 'years', careerId: career.id })}
                icon={<GraduationCap className="size-5" strokeWidth={1.8} />}
                key={career.id}
                meta={compactCount(career.studyPlanCount, 'plan', 'planes')}
                title={career.name}
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            className="mt-9"
            description="Todavía no hay carreras con recursos aprobados para explorar."
            heading="No hay carreras disponibles"
          />
        )}
        {view.hasMore ? (
          <p className="mt-4 text-sm text-secondary-foreground">
            Mostramos las primeras {pageSize} carreras.
          </p>
        ) : null}
      </>
    );
  }

  if (view.kind === 'years') {
    return (
      <>
        <BreadcrumbTrail route={route} view={view} />
        <header>
          <p className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-primary">
            {view.career.code}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold leading-[0.95] tracking-[-0.035em] text-foreground sm:text-6xl">
            {view.career.name}
          </h1>
          <p className="mt-4 text-base text-secondary-foreground">
            Elegí el año del plan que cursás.
          </p>
        </header>
        {view.years.length > 0 ? (
          <ul className="mt-9 grid gap-4 sm:grid-cols-2">
            {view.years.map((year) => (
              <HierarchyLink
                description={year.studyPlan.name}
                href={materialHierarchyPath({
                  kind: 'subjects',
                  careerId: view.career.id,
                  studyPlanId: year.studyPlan.id,
                  year: year.year,
                })}
                icon={<BookOpenText className="size-5" strokeWidth={1.8} />}
                key={year.id}
                meta={compactCount(year.subjectCount, 'materia', 'materias')}
                title={yearLabel(year.year)}
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            className="mt-9"
            description="La carrera existe, pero todavía no tiene años con recursos aprobados."
            heading="No hay años disponibles"
          />
        )}
        {view.hasMore ? (
          <p className="mt-4 text-sm text-secondary-foreground">
            Mostramos los primeros {pageSize} años.
          </p>
        ) : null}
      </>
    );
  }

  if (view.kind === 'subjects') {
    const subjectsRouteForContext = subjectsRoute(route as NestedMaterialHierarchyRoute);
    return (
      <>
        <BreadcrumbTrail route={route} view={view} />
        <header>
          <p className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-primary">
            {view.context.career.name} · {view.context.studyPlan.name}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold leading-[0.95] tracking-[-0.035em] text-foreground sm:text-6xl">
            Materias de {yearLabel(view.context.year)}
          </h1>
        </header>
        {view.context.subjects.length > 0 ? (
          <ul className="mt-9 grid gap-4 sm:grid-cols-2">
            {view.context.subjects.map((subject) => (
              <HierarchyLink
                description={subject.code ? `Código ${subject.code}` : 'Código no informado'}
                href={materialHierarchyPath({
                  ...subjectsRouteForContext,
                  kind: 'categories',
                  subjectId: subject.id,
                })}
                icon={<FolderOpen className="size-5" strokeWidth={1.8} />}
                key={subject.id}
                meta={compactCount(subject.approvedMaterialCount, 'recurso', 'recursos')}
                title={subject.name}
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            className="mt-9"
            description="Este año del plan no tiene materias disponibles para explorar todavía."
            heading="No hay materias disponibles"
          />
        )}
      </>
    );
  }

  const subjectRoute = categoriesRoute(
    route as Extract<MaterialHierarchyRoute, { kind: 'categories' | 'files' }>,
  );
  const scopedRoute = route as NestedMaterialHierarchyRoute;

  if (view.kind === 'categories') {
    return (
      <>
        <BreadcrumbTrail route={route} view={view} />
        <ScopeIdentity context={view.context} subject={view.subject} />
        <ScopedSearch query={query} route={scopedRoute} subjectName={view.subject.name} />
        {view.categories.length > 0 ? (
          <section className="mt-9" aria-labelledby="resource-categories">
            <h2 id="resource-categories" className="font-serif text-2xl font-bold text-foreground">
              Elegí el tipo de recurso
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {view.categories.map((category) => (
                <HierarchyLink
                  description="Abrir archivos"
                  href={materialHierarchyPath({
                    ...subjectRoute,
                    kind: 'files',
                    resourceType: category.resourceType,
                  })}
                  icon={<FolderOpen className="size-5" strokeWidth={1.8} />}
                  key={category.id}
                  meta={compactCount(category.materialCount, 'archivo', 'archivos')}
                  title={resourceTypeLabels[category.resourceType]}
                />
              ))}
            </ul>
          </section>
        ) : (
          <EmptyState
            className="mt-9"
            description="La materia está disponible, pero todavía no contiene archivos aprobados."
            heading="No hay recursos publicados"
          />
        )}
      </>
    );
  }

  if (view.kind === 'files') {
    return (
      <>
        <BreadcrumbTrail route={route} view={view} />
        <ScopeIdentity context={view.context} subject={view.subject} />
        <h2 className="mt-7 font-serif text-2xl font-bold text-foreground">
          {resourceTypeLabels[view.resourceType]}
        </h2>
        <ScopedSearch query={query} route={scopedRoute} subjectName={view.subject.name} />
        <ResourceFileList
          files={view.files}
          hasMore={view.hasMore}
          query={query}
          route={scopedRoute}
          selectedFileId={selectedFileId}
        />
        {view.files.length === 0 ? (
          <EmptyState
            className="mt-9"
            description="Esta categoría no tiene archivos aprobados todavía."
            heading="No hay archivos en esta categoría"
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <BreadcrumbTrail route={route} view={view} />
      <ScopeIdentity context={view.context} subject={view.subject} />
      <ScopedSearch query={query} route={scopedRoute} subjectName={view.subject.name} />
      <section className="mt-9" aria-labelledby="subject-search-results">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="subject-search-results" className="font-serif text-2xl font-bold text-foreground">
            {view.results.meta.total} {view.results.meta.total === 1 ? 'resultado' : 'resultados'}{' '}
            para “{query}”
          </h2>
          <Button asChild size="sm" variant="outline">
            <Link href={toMaterialHierarchyHref(scopedRoute)}>Borrar búsqueda</Link>
          </Button>
        </div>
        <ResourceFileList
          materialRows={view.results.data}
          query={query}
          route={scopedRoute}
          selectedFileId={selectedFileId}
        />
        {view.results.data.length === 0 ? (
          <EmptyState
            className="mt-7"
            description="Probá otro término o borrá la búsqueda para volver a las categorías de la materia."
            heading="No encontramos archivos en esta materia"
          />
        ) : null}
      </section>
    </>
  );
}

function MaterialHierarchyContent({
  query,
  route,
  selectedFileId,
}: {
  query: string;
  route: MaterialHierarchyRoute;
  selectedFileId?: string;
}) {
  const [requestState, setRequestState] = useState<RequestState>({ status: 'loading' });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (route.kind === 'invalid') {
      return;
    }

    let current = true;
    void getHierarchyView(route, query)
      .then((view) => {
        if (current) setRequestState({ status: 'ready', view });
      })
      .catch(() => {
        if (current) setRequestState({ status: 'error' });
      });

    return () => {
      current = false;
    };
  }, [query, retryKey, route]);

  if (route.kind === 'invalid') {
    return (
      <EmptyState
        description="La ruta de materiales no corresponde a una carrera, año, materia o tipo de recurso válido."
        heading="No encontramos ese contexto académico"
      />
    );
  }

  if (requestState.status === 'loading') {
    return <LoadingState description="Cargando el contexto académico seleccionado." />;
  }

  if (requestState.status === 'error') {
    return (
      <ErrorState
        action={
          <Button
            onClick={() => {
              setRequestState({ status: 'loading' });
              setRetryKey((value) => value + 1);
            }}
            variant="outline"
          >
            Reintentar
          </Button>
        }
        description="Conservamos la ruta y la búsqueda para que puedas intentarlo de nuevo."
      />
    );
  }

  return (
    <ReadyHierarchy
      query={query}
      route={route}
      selectedFileId={selectedFileId}
      view={requestState.view}
    />
  );
}

export function MaterialHierarchyPage({
  query,
  selectedFileId,
  segments,
}: {
  query: string;
  selectedFileId?: string;
  segments: string[];
}) {
  const route = useMemo(() => parseMaterialHierarchyRoute(segments), [segments]);
  const normalizedQuery = query.trim().slice(0, 120);
  const routeKey = `${segments.join('/')}:${normalizedQuery}:${selectedFileId ?? ''}`;

  return (
    <main className="min-h-[calc(100dvh-4.5rem)] bg-background pb-16">
      <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-10 sm:py-14">
        <MaterialHierarchyContent
          key={routeKey}
          query={normalizedQuery}
          route={route}
          selectedFileId={selectedFileId}
        />
      </div>
    </main>
  );
}
