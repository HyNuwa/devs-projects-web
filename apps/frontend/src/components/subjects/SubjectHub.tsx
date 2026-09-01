'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  GraduationCap,
  MessageSquare,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import {
  CourseReviewSummaryCard,
  FinalExperienceSummaryCard,
} from '@/components/community/CommunitySummaryCards';
import { Button, Chip, EmptyState, ErrorState, LoadingState } from '@/components/ui/shadcn';
import { api } from '@/lib/api';
import { getApiError, getData } from '@/lib/apiHelpers';
import { getMaterialDiscovery } from '@/lib/discovery-client';
import { courseConditionLabel, resourceTypeLabel } from '@/lib/presentation-labels';
import type { Material } from '@/types/material';
import type {
  CourseReviewResponse,
  ExamExperience,
  SubjectHub as SubjectHubType,
} from '@/types/subject';

type SubjectHubTab = 'reviews' | 'exams' | 'materials';

type SubjectHubData = {
  exams: ExamExperience[];
  materials: Material[];
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
    <div className="grid content-start gap-2 border border-border bg-card p-4 shadow-surface">
      <span aria-hidden="true" className="text-primary">
        {icon}
      </span>
      <strong className="font-serif text-3xl leading-none text-card-foreground">{value}</strong>
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

function MaterialList({ materials }: { materials: Material[] }) {
  if (materials.length === 0) {
    return (
      <EmptyState
        action={
          <Button asChild variant="outline">
            <Link href="/materiales">Explorar materiales</Link>
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
          className="flex min-h-20 items-center gap-4 border border-border bg-card p-4 shadow-surface transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          href={`/materiales/${encodeURIComponent(material.id)}`}
          key={material.id}
        >
          <FileText aria-hidden="true" className="size-5 shrink-0 text-primary" strokeWidth={1.7} />
          <span className="min-w-0 flex-1">
            <strong className="block truncate font-serif text-lg text-card-foreground">
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

export function SubjectHub({ code }: { code: string }) {
  const [attempt, setAttempt] = useState(0);
  const [activeTab, setActiveTab] = useState<SubjectHubTab>('reviews');
  const [state, setState] = useState<SubjectHubState>({ status: 'loading' });

  useEffect(() => {
    let isCurrent = true;

    void Promise.all([
      api.get<SubjectHubType>(`/subjects/${encodeURIComponent(code)}`),
      api.get<CourseReviewResponse>(`/subjects/${encodeURIComponent(code)}/reviews`),
      api.get<ExamExperience[]>(`/subjects/${encodeURIComponent(code)}/exams`),
    ])
      .then(async ([subjectResponse, reviewsResponse, examsResponse]) => {
        const subject = getData(subjectResponse);
        const materialResult = await getMaterialDiscovery({
          limit: 20,
          page: 1,
          sort: 'RECENT',
          subjectId: subject.id,
        });

        if (isCurrent) {
          setState({
            data: {
              exams: getData(examsResponse),
              materials: materialResult.data,
              reviews: getData(reviewsResponse),
              subject,
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
      <main className="mx-auto grid w-full max-w-6xl px-5 py-12 sm:py-16">
        <LoadingState
          description="Estamos reuniendo el contexto y los aportes de esta materia."
          heading="Cargando materia"
        />
      </main>
    );
  }

  if (state.status === 'error') {
    return (
      <main className="mx-auto grid w-full max-w-3xl gap-5 px-5 py-12 sm:py-16">
        <ErrorState
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => setAttempt((value) => value + 1)}>Reintentar</Button>
              <Button asChild variant="outline">
                <Link href="/materias">Volver a materias</Link>
              </Button>
            </div>
          }
          description={state.error}
          heading="No pudimos cargar esta materia"
        />
      </main>
    );
  }

  const { exams, materials, reviews, subject } = state.data;
  const plan = subject.studyPlans[0];
  const averageRecommendation = subject.stats.avgRecommendation?.toFixed(1) ?? '—';

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-7 sm:py-10">
      <nav aria-label="Ruta de materia">
        <Link
          className="inline-flex min-h-11 items-center gap-2 font-sans text-sm font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          href="/materias"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Materias
        </Link>
      </nav>

      <header className="grid gap-6 border-b border-line pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="flex items-center gap-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.1em] text-primary">
            <Sparkles aria-hidden="true" className="size-4" strokeWidth={1.8} />
            Materia
          </p>
          <h1 className="mt-3 max-w-[16ch] font-serif text-5xl font-bold leading-[0.92] tracking-[-0.035em] text-foreground sm:text-6xl">
            {subject.name}
          </h1>
          {subject.description ? (
            <p className="mt-4 max-w-2xl font-sans leading-relaxed text-muted-foreground">
              {subject.description}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            {subject.code ? <Chip tone="neutral">Código {subject.code}</Chip> : null}
            {plan ? (
              <Chip tone="neutral">
                {plan.studyPlan.career.name} · Año {plan.year} · Cuatrimestre {plan.semester}
                {plan.credits ? ` · ${plan.credits} créditos` : ''}
              </Chip>
            ) : null}
          </div>
        </div>
        <Button asChild className="lg:justify-self-end" variant="outline">
          <Link href="/materiales">
            <BookOpen aria-hidden="true" className="size-4" />
            Explorar materiales
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
        <section
          aria-labelledby="subject-professors"
          className="border border-border bg-card p-5 shadow-surface"
        >
          <h2
            className="flex items-center gap-2 font-serif text-2xl font-bold text-card-foreground"
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
                <h2 className="font-serif text-3xl font-bold text-foreground">
                  Reseñas de cursada
                </h2>
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
                <h2 className="font-serif text-3xl font-bold text-foreground">
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
                <h2 className="font-serif text-3xl font-bold text-foreground">Materiales</h2>
                <p className="mt-2 font-sans text-muted-foreground">
                  Recursos aprobados para esta materia.
                </p>
              </div>
              <Button asChild>
                <Link href="/materiales/nuevo">Subir material</Link>
              </Button>
            </div>
            <div className="mt-6">
              <MaterialList materials={materials} />
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
