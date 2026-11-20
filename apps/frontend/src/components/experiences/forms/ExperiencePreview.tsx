import { Eye } from 'lucide-react';
import { useId } from 'react';

import { AnonymousMark } from '@/components/experiences/AnonymousMark';
import {
  CommunityFactList,
  type CourseReviewFactValues,
  courseReviewFacts,
  type ExamExperienceFactValues,
  examExperienceFacts,
  ExamTopicChips,
  StarRecommendation,
} from '@/components/experiences/facts';
import { cn } from '@/components/ui/shadcn/utils';

export interface PreviewAuthor {
  anonymous: boolean;
  avatarSrc: string | null;
  name: string;
}

export interface ReviewPreviewValues extends CourseReviewFactValues {
  comment?: string | null;
  recommendation?: number | null;
}

export interface ExamPreviewValues extends ExamExperienceFactValues {
  comment?: string | null;
  topics?: readonly string[];
}

type ExperiencePreviewProps = {
  author: PreviewAuthor;
  className?: string;
  subjectName: string;
} & ({ kind: 'review'; values: ReviewPreviewValues } | { kind: 'exam'; values: ExamPreviewValues });

/**
 * «Así se va a ver» (openspec academic-community/experiences «Experiencia
 * forms»): the entry as its detail will present it, from the form's watched
 * values, through the same fact builders. It renders at `lg` and up only.
 */
export function ExperiencePreview(props: ExperiencePreviewProps) {
  const { author, className, kind, subjectName } = props;
  const headingId = useId();
  const topicsId = useId();
  const isReview = kind === 'review';
  const comment = props.values.comment?.trim();
  const recommendation = isReview ? props.values.recommendation : null;

  return (
    <aside aria-labelledby={headingId} className={cn('hidden lg:block', className)}>
      <p
        className="flex items-center gap-2 font-sans text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground"
        id={headingId}
      >
        <Eye aria-hidden="true" className="size-4" strokeWidth={2} />
        Así se va a ver
      </p>
      <article className="mt-3.5 rounded-xl border-[1.5px] border-foreground bg-card px-5 py-[1.125rem] shadow-[5px_5px_0_var(--foreground)]">
        <div className="flex items-center gap-3">
          {author.anonymous || !author.avatarSrc ? (
            <AnonymousMark />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- 40px avatar from an arbitrary host or /avatars
            <img
              alt=""
              className="size-10 shrink-0 rounded-full border-[1.5px] border-foreground object-cover"
              height={40}
              src={author.avatarSrc}
              width={40}
            />
          )}
          <div className="min-w-0">
            <p className="truncate font-sans text-[0.9rem] font-extrabold text-card-foreground">
              {author.anonymous ? 'Anónimo' : author.name}
            </p>
            <p className="font-sans text-xs font-semibold text-muted-foreground">
              {isReview ? 'Reseña de cursada' : 'Experiencia de final'} · ahora
            </p>
          </div>
          {recommendation ? (
            <span className="ml-auto">
              <StarRecommendation value={recommendation} />
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 font-sans text-[1.0625rem] font-extrabold tracking-[-0.025em] text-card-foreground">
          {subjectName}
        </h3>
        <CommunityFactList
          className="mt-3"
          facts={isReview ? courseReviewFacts(props.values) : examExperienceFacts(props.values)}
        />
        {!isReview ? (
          <ExamTopicChips
            className="mt-4"
            headingLevel="h4"
            id={topicsId}
            topics={props.values.topics ?? []}
          />
        ) : null}
        <p className="mt-3 whitespace-pre-wrap font-sans text-sm font-medium leading-relaxed text-secondary-foreground">
          {comment ? comment : 'Tu relato aparece acá.'}
        </p>
      </article>
    </aside>
  );
}
