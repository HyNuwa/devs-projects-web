'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  FileText,
  GraduationCap,
  MessageSquare,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

import {
  CourseReviewSummaryCard,
  FinalExperienceSummaryCard,
} from '@/components/community/CommunitySummaryCards';
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
import { courseConditionLabel, resourceTypeLabel } from '@/lib/presentation-labels';
import { getTopMaterials, type TopMaterial } from '@/lib/ranking-client';
import { useUbicacionStore } from '@/stores/ubicacionStore';
import type { Material } from '@/types/material';
import type {
  CourseReviewResponse,
  ExamExperience,
  SubjectHub as SubjectHubType,
} from '@/types/subject';

type SubjectHubTab = 'reviews' | 'exams' | 'materials';

type SubjectHubData = {
  exams: ExamExperience[];
  top: TopMaterial[];
  reviews: CourseReviewResponse;
  subject: SubjectHubType;
};

type SubjectHubState =
  | { status: 'loading' }
  | { data: SubjectHubData; status: 'ready' }
  | { error: string; status: 'error' };

function SubjectStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="grid content-start gap-2 border border-border bg-card p-4">
      <span aria-hidden="true" className="text-primary">
        {icon}
      </span>
      <strong className="font-sans text-3xl leading-none text-card-foreground">{value}</strong>
      <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function HubTab({
  active,
  children,
  id,
  onSelect,
}: {
  active: boolean;
  children: ReactNode;
  id: SubjectHubTab;
  onSelect: (tab: SubjectHubTab) => void;
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
    `Año ${plan.year}`,
    plan.semester === 0 ? 'Anual' : `Cuatrimestre ${plan.semester}`,
    ...(plan.credits ? [`${plan.credits} créditos`] : []),
  ].join(' · ');
}

type Placement = SubjectHubType['studyPlans'][number];

const byCareerName = (a: Placement, b: Placement) =>
  a.studyPlan.career.name.localeCompare(b.studyPlan.career.name, 'es', { sensitivity: 'base' });

/**
 * The carrera of the trail (openspec academic-structure/browsing, «Materia
 * breadcrumb»): the one the link named, else the first carrera the viewer
 * declared that includes the materia, else the first by name.
 */
function trailPlacement(
  placements: Placement[],
  named: string | null,
  declared: readonly { careerId: string; declaredAt: string }[],
) {
  const sorted = [...placements].sort(byCareerName);
  const fromLink = named
    ? sorted.find((p) => p.studyPlan.career.code.toLowerCase() === named.toLowerCase())
    : undefined;
  if (fromLink) return fromLink;
  const mine = [...declared]
    .sort((a, b) => a.declaredAt.localeCompare(b.declaredAt))
    .map((entry) => sorted.find((p) => p.studyPlan.career.id === entry.careerId))
    .find(Boolean);
  return mine ?? sorted[0] ?? null;
}

export function SubjectHub({ code }: { code: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get('q')?.trim() ?? '';
  const myCareers = useUbicacionStore((store) => store.myCareers);
  const [attempt, setAttempt] = useState(0);
  const [activeTab, setActiveTab] = useState<SubjectHubTab>(query ? 'materials' : 'reviews');
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
      api.get<CourseReviewResponse>(`/subjects/${encodeURIComponent(code)}/reviews`),
      api.get<ExamExperience[]>(`/subjects/${encodeURIComponent(code)}/exams`),
      // The ranking is a bonus: the materia page loads without it.
      getTopMaterials(code).catch(() => null),
    ])
      .then(([subjectResponse, reviewsResponse, examsResponse, topMaterials]) => {
        const subject = getData(subjectResponse);
        if (isCurrent) {
          setState({
            data: {
              exams: getData(examsResponse),
              reviews: getData(reviewsResponse),
              subject,
              top: topMaterials?.entries ?? [],
            },
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

  const { exams, reviews, subject, top } = state.data;
  const averageRecommendation = subject.stats.avgRecommendation?.toFixed(1) ?? '—';
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

      <section
        aria-label="Resumen de la materia"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <SubjectStat
          icon={<Star className="size-5" strokeWidth={1.7} />}
          label="recomendación"
          value={averageRecommendation}
        />
        <SubjectStat
          icon={<MessageSquare className="size-5" strokeWidth={1.7} />}
          label="reseñas"
          value={subject.stats.reviewCount}
        />
        <SubjectStat
          icon={<GraduationCap className="size-5" strokeWidth={1.7} />}
          label="finales"
          value={subject.stats.examCount}
        />
        <SubjectStat
          icon={<FileText className="size-5" strokeWidth={1.7} />}
          label="materiales"
          value={subject.stats.materialCount}
        />
      </section>

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
          <HubTab active={activeTab === 'reviews'} id="reviews" onSelect={setActiveTab}>
            Reseñas ({reviews.reviews.length})
          </HubTab>
          <HubTab active={activeTab === 'exams'} id="exams" onSelect={setActiveTab}>
            Finales ({exams.length})
          </HubTab>
          <HubTab active={activeTab === 'materials'} id="materials" onSelect={setActiveTab}>
            Materiales ({materials.length})
          </HubTab>
        </div>

        {activeTab === 'reviews' ? (
          <section
            aria-labelledby="subject-hub-tab-reviews"
            id="subject-hub-panel-reviews"
            role="tabpanel"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-sans text-3xl font-bold text-foreground">Reseñas de cursada</h2>
                <p className="mt-2 font-sans text-muted-foreground">
                  Experiencias independientes de cursada para esta materia.
                </p>
              </div>
              <Button asChild>
                <Link href={`/materias/${encodeURIComponent(code)}/resenar`}>
                  Reseñar mi cursada
                </Link>
              </Button>
            </div>

            {reviews.conditionBreakdown.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2" aria-label="Resultados de cursada">
                {reviews.conditionBreakdown.map(({ _count, condition }) => (
                  <Chip key={condition} tone="neutral">
                    {courseConditionLabel(condition)}: {_count}
                  </Chip>
                ))}
              </div>
            ) : null}

            {reviews.reviews.length === 0 ? (
              <EmptyState
                className="mt-6"
                description="Cuando alguien comparta una cursada, aparecerá acá sin mezclarse con experiencias de final."
                heading="Todavía no hay reseñas"
              />
            ) : (
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                {reviews.reviews.map((review) => (
                  <CourseReviewSummaryCard
                    key={review.id}
                    summary={{
                      academicYear: review.academicYear,
                      attempt: review.attempt,
                      author: review.user,
                      condition: review.condition,
                      createdAt: review.createdAt,
                      difficulty: review.difficulty,
                      excerpt: review.comment,
                      id: review.id,
                      professorName: review.professorName,
                      recommendation: review.recommendation,
                      shift: review.shift,
                      updatedAt: review.updatedAt,
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        ) : null}

        {activeTab === 'exams' ? (
          <section
            aria-labelledby="subject-hub-tab-exams"
            id="subject-hub-panel-exams"
            role="tabpanel"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-sans text-3xl font-bold text-foreground">
                  Experiencias de final
                </h2>
                <p className="mt-2 font-sans text-muted-foreground">
                  Mesas y finales compartidos como intentos independientes.
                </p>
              </div>
              <Button asChild>
                <Link href={`/materias/${encodeURIComponent(code)}/final`}>Contar mi final</Link>
              </Button>
            </div>

            {exams.length === 0 ? (
              <EmptyState
                className="mt-6"
                description="Las experiencias de final aparecerán acá y se mantendrán separadas de las reseñas de cursada."
                heading="Todavía no hay experiencias de final"
              />
            ) : (
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                {exams.map((exam) => (
                  <FinalExperienceSummaryCard
                    key={exam.id}
                    summary={{
                      author: exam.user,
                      createdAt: exam.createdAt,
                      difficulty: exam.difficulty,
                      difficultyPractice: exam.difficultyPractice,
                      difficultyTheory: exam.difficultyTheory,
                      examDate: exam.examDate,
                      examinerName: exam.examinerName,
                      excerpt: exam.comment,
                      format: exam.format,
                      id: exam.id,
                      outcome: exam.outcome,
                      professorName: exam.professor?.name,
                      session: exam.session,
                      shift: exam.shift,
                      updatedAt: exam.updatedAt,
                      year: exam.year,
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        ) : null}

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
