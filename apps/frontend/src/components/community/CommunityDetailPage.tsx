'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  LoaderCircle,
  Share2,
  UserRound,
} from 'lucide-react';

import {
  CommunityFactList,
  formatCommunityDate,
  StarRecommendation,
} from '@/components/community/CommunitySummaryCards';
import { CommunityEntryManagement } from '@/components/community/CommunityEntryManagement';
import { ReportDialog } from '@/components/moderation/ReportDialog';
import { Button, Chip } from '@/components/ui/shadcn';
import { getCourseReviewDetail, getExamExperienceDetail } from '@/lib/discovery-client';
import {
  courseAttemptLabel,
  courseConditionLabel,
  difficultyLabel,
  examFormatLabel,
  examOutcomeLabel,
  examPeriodLabel,
  shiftLabel,
} from '@/lib/presentation-labels';
import type { DiscoveryCourseReviewDetail, DiscoveryExamExperienceDetail } from '@/types/discovery';

type CommunityDetailKind = 'course-review' | 'exam-experience';
type CommunityDetail = DiscoveryCourseReviewDetail | DiscoveryExamExperienceDetail;

type DetailState =
  | { status: 'loading' }
  | { detail: CommunityDetail; status: 'ready' }
  | { status: 'unavailable' }
  | { status: 'error' };

function isUnavailableError(error: unknown) {
  const status = (error as { response?: { status?: number } } | undefined)?.response?.status;
  return status === 400 || status === 404;
}

function editedDate(createdAt: string, updatedAt: string) {
  const created = new Date(createdAt).getTime();
  const updated = new Date(updatedAt).getTime();

  if (Number.isNaN(created) || Number.isNaN(updated) || updated <= created) return null;

  return formatCommunityDate(updatedAt);
}

function DetailFacts({ detail, kind }: { detail: CommunityDetail; kind: CommunityDetailKind }) {
  if (kind === 'course-review') {
    const review = detail as DiscoveryCourseReviewDetail;
    const professor = review.professor?.name ?? review.professorName;

    return (
      <CommunityFactList
        facts={[
          ['Año de cursada', review.academicYear ? `Cursada ${review.academicYear}` : null],
          ['Resultado de cursada', courseConditionLabel(review.condition)],
          ['Situación de cursada', review.attempt ? courseAttemptLabel(review.attempt) : null],
          ['Franja horaria', shiftLabel(review.shift)],
          [
            'Dificultad',
            review.difficulty === null || review.difficulty === undefined
              ? null
              : difficultyLabel(review.difficulty),
          ],
          ['Profesor', professor ? `Profesor: ${professor}` : null],
        ]}
      />
    );
  }

  const experience = detail as DiscoveryExamExperienceDetail;
  const examiner = experience.professor?.name ?? experience.examinerName;
  const examDate = experience.examDate ? formatCommunityDate(experience.examDate) : null;

  return (
    <CommunityFactList
      facts={[
        ['Año de final', `Final ${experience.year}`],
        ['Período', examPeriodLabel(experience.session)],
        ['Formato', examFormatLabel(experience.format)],
        ['Fecha exacta', examDate ? `Fecha: ${examDate}` : null],
        ['Franja horaria', experience.shift ? shiftLabel(experience.shift) : null],
        ['Profesor o examinador', examiner ? `Tomó: ${examiner}` : null],
        ['Dificultad', experience.difficulty ? difficultyLabel(experience.difficulty) : null],
        ['Resultado', experience.outcome ? examOutcomeLabel(experience.outcome) : null],
      ]}
    />
  );
}

function DetailActions({
  id,
  kind,
  title,
}: {
  id: string;
  kind: CommunityDetailKind;
  title: string;
}) {
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);
  const route = kind === 'course-review' ? `/resenas/${id}` : `/finales/${id}`;

  const share = async () => {
    const navigatorWithShare = navigator as Navigator & {
      share?: (data: { title: string; url: string }) => Promise<void>;
    };
    const url = window.location.href;

    try {
      if (navigatorWithShare.share) {
        await navigatorWithShare.share({ title, url });
        setShareFeedback('Enlace compartido.');
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareFeedback('Enlace copiado.');
        return;
      }

      setShareFeedback('No se pudo compartir el enlace en este navegador.');
    } catch {
      setShareFeedback('No se pudo compartir el enlace. Intentá nuevamente.');
    }
  };

  return (
    <aside className="grid content-start gap-3 border border-border bg-card p-4 min-[820px]:sticky min-[820px]:top-24">
      <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        Acciones
      </p>
      <Button onClick={share} variant="outline">
        <Share2 aria-hidden="true" className="size-4" strokeWidth={1.8} />
        Compartir
      </Button>
      <ReportDialog
        onReported={setReportFeedback}
        returnPath={route}
        targetId={id}
        targetType={kind === 'course-review' ? 'COURSE_REVIEW' : 'EXAM_EXPERIENCE'}
      />
      <p aria-live="polite" className="min-h-5 font-sans text-sm text-muted-foreground">
        {shareFeedback ?? reportFeedback}
      </p>
    </aside>
  );
}

function UnavailableDetail({ id, kind }: { id: string; kind: CommunityDetailKind }) {
  const listPath = kind === 'course-review' ? '/resenas' : '/finales';
  const listLabel = kind === 'course-review' ? 'Ver reseñas' : 'Ver experiencias de final';

  return (
    <section className="mx-auto grid w-full max-w-3xl gap-5 px-3 py-12 sm:px-6 sm:py-16">
      <div className="border border-border bg-card p-6 text-center sm:p-8">
        <h1 className="font-sans text-3xl font-bold text-card-foreground">
          Esta publicación no está disponible
        </h1>
        <p className="mx-auto mt-3 max-w-xl font-sans leading-relaxed text-muted-foreground">
          El enlace puede no existir, o la publicación ya no está disponible de forma pública.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href={listPath}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            {listLabel}
          </Link>
        </Button>
      </div>
      <CommunityEntryManagement id={id} kind={kind} />
    </section>
  );
}

function CommunityDetailContent({
  detail,
  id,
  kind,
}: {
  detail: CommunityDetail;
  id: string;
  kind: CommunityDetailKind;
}) {
  const isReview = kind === 'course-review';
  const review = isReview ? (detail as DiscoveryCourseReviewDetail) : null;
  const listPath = isReview ? '/resenas' : '/finales';
  const sectionLabel = isReview ? 'Reseña de cursada' : 'Experiencia de final';
  const createdDate = formatCommunityDate(detail.createdAt);
  const edited = editedDate(detail.createdAt, detail.updatedAt);
  const title = `${sectionLabel}: ${detail.subject.name}`;

  return (
    <section className="mx-auto grid w-full max-w-[1180px] gap-6 px-3 py-7 sm:px-6 sm:py-10">
      <nav aria-label="Ruta de comunidad" className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          className="inline-flex min-h-11 items-center gap-2 font-bold text-primary underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          href={listPath}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {isReview ? 'Reseñas' : 'Finales'}
        </Link>
        <span aria-hidden="true" className="text-muted-foreground">
          /
        </span>
        <span aria-current="page" className="font-bold text-foreground">
          {sectionLabel}
        </span>
      </nav>

      <div className="grid gap-6 min-[820px]:grid-cols-[minmax(0,1fr)_16rem] min-[820px]:items-start">
        <article className="min-w-0 border border-border bg-card p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.08em] text-primary">
                {sectionLabel}
              </p>
              <h1 className="mt-2 font-sans text-4xl font-bold leading-[0.95] text-card-foreground sm:text-5xl">
                {detail.subject.name}
              </h1>
              <Link
                className="mt-4 inline-flex min-h-11 items-center gap-2 font-sans text-sm font-bold text-primary underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                href={detail.subject.href}
              >
                <GraduationCap aria-hidden="true" className="size-4" strokeWidth={1.8} />
                Ver materia
              </Link>
            </div>
            {review ? <StarRecommendation value={review.recommendation} /> : null}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-border py-4 font-sans text-sm text-secondary-foreground">
            <span className="inline-flex items-center gap-2">
              <UserRound aria-hidden="true" className="size-4 text-primary" strokeWidth={1.7} />
              {detail.author.username || 'Anónimo'}
            </span>
            {createdDate ? (
              <span className="inline-flex items-center gap-2">
                <CalendarDays
                  aria-hidden="true"
                  className="size-4 text-primary"
                  strokeWidth={1.7}
                />
                Publicada el {createdDate}
              </span>
            ) : null}
            {edited ? <Chip tone="neutral">Editada · {edited}</Chip> : null}
          </div>

          <DetailFacts detail={detail} kind={kind} />

          <section aria-labelledby="community-narrative" className="mt-8 max-w-[75ch]">
            <h2
              className="font-sans text-2xl font-bold text-card-foreground"
              id="community-narrative"
            >
              Relato completo
            </h2>
            {detail.comment ? (
              <p className="mt-4 whitespace-pre-wrap font-sans text-lg leading-relaxed text-foreground">
                {detail.comment}
              </p>
            ) : (
              <p className="mt-4 font-sans leading-relaxed text-muted-foreground">
                No se registró un relato para esta publicación histórica.
              </p>
            )}
          </section>
        </article>

        <DetailActions id={id} kind={kind} title={title} />
      </div>
      <CommunityEntryManagement id={id} kind={kind} subjectHref={detail.subject.href} />
    </section>
  );
}

export function CommunityDetailPage({
  id,
  kind,
}: {
  id: string | undefined;
  kind: CommunityDetailKind;
}) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<DetailState>(() =>
    id ? { status: 'loading' } : { status: 'unavailable' },
  );

  useEffect(() => {
    if (!id) return;

    let isCurrent = true;
    const loadDetail = kind === 'course-review' ? getCourseReviewDetail : getExamExperienceDetail;

    void loadDetail(id)
      .then((detail) => {
        if (isCurrent) setState({ detail, status: 'ready' });
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setState(isUnavailableError(error) ? { status: 'unavailable' } : { status: 'error' });
      });

    return () => {
      isCurrent = false;
    };
  }, [attempt, id, kind]);

  if (state.status === 'loading') {
    return (
      <section className="mx-auto grid w-full max-w-[1180px] px-3 py-12 sm:px-6 sm:py-16">
        <div
          aria-live="polite"
          className="flex items-center gap-3 font-sans text-muted-foreground"
          role="status"
        >
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-primary" />
          Cargando publicación…
        </div>
      </section>
    );
  }

  if (state.status === 'unavailable') {
    return <UnavailableDetail id={id ?? 'missing-entry'} kind={kind} />;
  }

  if (state.status === 'error') {
    return (
      <section className="mx-auto grid w-full max-w-3xl gap-5 px-3 py-12 sm:px-6 sm:py-16">
        <div
          aria-live="assertive"
          className="border border-destructive bg-card p-6 text-center"
          role="alert"
        >
          <h1 className="font-sans text-3xl font-bold text-card-foreground">
            No pudimos cargar la publicación
          </h1>
          <p className="mt-3 font-sans text-muted-foreground">
            Conservá este enlace e intentá nuevamente.
          </p>
          <Button className="mt-6" onClick={() => setAttempt((value) => value + 1)}>
            Reintentar
          </Button>
        </div>
      </section>
    );
  }

  return <CommunityDetailContent detail={state.detail} id={id ?? state.detail.id} kind={kind} />;
}

export function CourseReviewDetailRoute() {
  const params = useParams<{ id: string }>();
  return (
    <CommunityDetailPage id={params.id} key={params.id ?? 'missing-review'} kind="course-review" />
  );
}

export function ExamExperienceDetailRoute() {
  const params = useParams<{ id: string }>();
  return (
    <CommunityDetailPage
      id={params.id}
      key={params.id ?? 'missing-experience'}
      kind="exam-experience"
    />
  );
}
