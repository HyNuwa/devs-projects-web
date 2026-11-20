'use client';

import { useEffect, useState } from 'react';

import { SameContextPanel } from '@/components/experiences/SameContextPanel';
import { SubjectAccordingPanel } from '@/components/experiences/SubjectAccordingPanel';
import { Button } from '@/components/ui/shadcn';
import type {
  CourseReviewRelated,
  ExamExperienceRelated,
  ExperienceRecentEntry,
} from '@/lib/experiences-client';
import { getCourseReviewRelated, getExamExperienceRelated } from '@/lib/experiences-client';
import { useSubjectExperiencesSummary } from '@/lib/use-subject-experiences-summary';

type SharedKind = ExperienceRecentEntry['kind'];

function PanelLoading({ copy }: { copy: string }) {
  return (
    <p className="font-sans text-sm font-semibold text-muted-foreground" role="status">
      {copy}
    </p>
  );
}

function PanelError({
  copy,
  onRetry,
  retryLabel,
}: {
  copy: string;
  onRetry: () => void;
  retryLabel: string;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-lg border-[1.5px] border-line bg-card px-4 py-3"
      role="alert"
    >
      <p className="font-sans text-sm font-semibold text-muted-foreground">{copy}</p>
      <Button onClick={onRetry} size="sm" variant="outline">
        {retryLabel}
      </Button>
    </div>
  );
}

/** Fetches and presents «La materia según…» for a known public code. */
export function SubjectAccordingSection({ code, kind }: { code: string; kind: SharedKind }) {
  const { retry, state } = useSubjectExperiencesSummary(code);

  if (state.status === 'loading') {
    return <PanelLoading copy="Cargando el resumen de la materia…" />;
  }
  if (state.status === 'error') {
    return (
      <PanelError
        copy="No pudimos cargar el resumen de la materia."
        onRetry={retry}
        retryLabel="Reintentar resumen"
      />
    );
  }
  return <SubjectAccordingPanel kind={kind} summary={state.summary} />;
}

type RelatedKey = { id: string; kind: SharedKind; revision: number };

type RelatedState =
  | ({ status: 'loading' } & RelatedKey)
  | ({ status: 'error' } & RelatedKey)
  | ({
      kind: 'review';
      related: CourseReviewRelated;
      status: 'ready';
    } & Omit<RelatedKey, 'kind'>)
  | ({
      kind: 'exam';
      related: ExamExperienceRelated;
      status: 'ready';
    } & Omit<RelatedKey, 'kind'>);

/** Fetches the same-context entries for the source record — never refetches the source. */
export function SameContextSection({
  code,
  id,
  kind,
}: {
  code: string | null;
  id: string;
  kind: SharedKind;
}) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<RelatedState | null>(null);
  const key = { id, kind, revision };

  useEffect(() => {
    let current = true;
    const fetcher = kind === 'review' ? getCourseReviewRelated : getExamExperienceRelated;
    void fetcher(id).then(
      (related) => {
        if (!current) return;
        setState(
          kind === 'review'
            ? {
                id,
                kind: 'review',
                related: related as CourseReviewRelated,
                revision,
                status: 'ready',
              }
            : {
                id,
                kind: 'exam',
                related: related as ExamExperienceRelated,
                revision,
                status: 'ready',
              },
        );
      },
      () => {
        if (current) setState({ id, kind, revision, status: 'error' });
      },
    );
    return () => {
      current = false;
    };
  }, [id, kind, revision]);

  // A state belongs to the key that produced it; anything older is loading.
  const stateForKey: RelatedState =
    state && state.id === key.id && state.kind === key.kind && state.revision === key.revision
      ? state
      : { status: 'loading', ...key };

  if (stateForKey.status === 'loading') {
    return <PanelLoading copy="Cargando experiencias del mismo contexto…" />;
  }
  if (stateForKey.status === 'error') {
    return (
      <PanelError
        copy="No pudimos cargar las experiencias relacionadas."
        onRetry={() => setRevision((value) => value + 1)}
        retryLabel="Reintentar relacionadas"
      />
    );
  }
  return stateForKey.kind === 'review' ? (
    <SameContextPanel code={code} kind="review" now={new Date()} related={stateForKey.related} />
  ) : (
    <SameContextPanel code={code} kind="exam" now={new Date()} related={stateForKey.related} />
  );
}
