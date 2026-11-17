'use client';

import Link from 'next/link';

import { AuthorLink } from '@/components/public-profile/AuthorLink';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, Check, GraduationCap, LoaderCircle, Share2 } from 'lucide-react';

import { AnonymousMark } from '@/components/experiences/AnonymousMark';
import {
  SameContextSection,
  SubjectAccordingSection,
} from '@/components/experiences/DetailExperiencePanels';
import { WriteExperienceMenu } from '@/components/experiences/WriteExperienceMenu';
import {
  CommunityFactList,
  courseReviewFacts,
  examExperienceFacts,
  ExamTopicChips,
  formatCommunityDate,
  StarRecommendation,
} from '@/components/experiences/facts';
import { avatarSrc } from '@/components/layout/account';
import { CommunityEntryManagement } from '@/components/community/CommunityEntryManagement';
import { ReportDialog } from '@/components/moderation/ReportDialog';
import { Button, Chip } from '@/components/ui/shadcn';
import { getCourseReviewDetail, getExamExperienceDetail } from '@/lib/discovery-client';
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
    return (
      <CommunityFactList
        facts={courseReviewFacts({
          ...review,
          professorName: review.professor?.name ?? review.professorName,
        })}
      />
    );
  }

  const experience = detail as DiscoveryExamExperienceDetail;
  return (
    <>
      <CommunityFactList
        facts={examExperienceFacts({
          ...experience,
          examinerName: experience.professor?.name ?? experience.examinerName,
        })}
      />
      <ExamTopicChips id="exam-topics" topics={experience.topics} />
    </>
  );
}

/**
 * «Publicada» after a form publishes (`?publicada=1`): read once on mount,
 * then the param leaves the URL so a reload or a shared link never repeats it.
 */
function usePublishedNotice() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [published] = useState(() => searchParams.get('publicada') === '1');
  const stripped = useRef(false);

  useEffect(() => {
    if (stripped.current || searchParams.get('publicada') !== '1') return;
    stripped.current = true;
    const rest = new URLSearchParams(searchParams.toString());
    rest.delete('publicada');
    const query = rest.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return published;
}

function DetailActions({
  code,
  id,
  kind,
  title,
}: {
  code: string | null;
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
      {code ? (
        <WriteExperienceMenu code={code} />
      ) : (
        <Button asChild variant="outline">
          <Link href="/experiencias/escribir">Escribir experiencia</Link>
        </Button>
      )}
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
  published,
}: {
  detail: CommunityDetail;
  id: string;
  kind: CommunityDetailKind;
  published: boolean;
}) {
  const isReview = kind === 'course-review';
  const sharedKind = isReview ? 'review' : 'exam';
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
          {published ? (
            <div
              aria-label="Publicada"
              className="mb-5 inline-flex items-center gap-2 rounded-md border-[1.5px] border-foreground bg-secondary px-3 py-1.5 font-sans text-sm font-bold text-secondary-foreground"
              role="status"
            >
              <Check aria-hidden="true" className="size-4 text-primary" strokeWidth={2.4} />
              Publicada
            </div>
          ) : null}
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
              {detail.author.id ? (
                // eslint-disable-next-line @next/next/no-img-element -- 32px avatar from an arbitrary host or /avatars
                <img
                  alt=""
                  className="size-8 shrink-0 rounded-full border-[1.5px] border-foreground object-cover"
                  height={32}
                  src={avatarSrc({
                    id: detail.author.id,
                    avatarUrl: detail.author.avatarUrl ?? null,
                    avatarCat: detail.author.avatarCat,
                  })}
                  width={32}
                />
              ) : (
                <AnonymousMark className="size-8 [&_svg]:size-4" />
              )}
              <AuthorLink author={detail.author} />
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

        <div className="grid content-start gap-4">
          <DetailActions code={detail.subject.code} id={id} kind={kind} title={title} />
          {detail.subject.code ? (
            <SubjectAccordingSection code={detail.subject.code} kind={sharedKind} />
          ) : null}
        </div>
      </div>
      <SameContextSection code={detail.subject.code} id={id} kind={sharedKind} />
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
  const published = usePublishedNotice();

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

  return (
    <CommunityDetailContent
      detail={state.detail}
      id={id ?? state.detail.id}
      kind={kind}
      published={published}
    />
  );
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
