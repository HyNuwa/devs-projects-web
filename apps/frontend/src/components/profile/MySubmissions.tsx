'use client';

import {
  CircleCheck,
  CircleSlash,
  Clock,
  EyeOff,
  LoaderCircle,
  Pencil,
  RotateCcw,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button, EmptyState, ErrorState, FieldError, LoadingState } from '@/components/ui/shadcn';
import { cn } from '@/components/ui/shadcn/utils';
import { getApiError } from '@/lib/apiHelpers';
import {
  getMySubmissions,
  type PublicationStatus,
  resubmit,
  type Submission,
} from '@/lib/submissions-client';

const STATUS: Record<
  PublicationStatus,
  { label: string; icon: LucideIcon; tone: string; explanation?: string }
> = {
  PUBLISHED: { label: 'Publicado', icon: CircleCheck, tone: 'bg-success/12 text-success' },
  PENDING_REVIEW: {
    label: 'En revisión previa',
    icon: Clock,
    tone: 'bg-accent/30 text-accent-foreground',
    explanation:
      'Moderación lo revisa antes de publicarlo. Te avisamos acá cuando haya una decisión.',
  },
  HIDDEN: {
    label: 'Oculto mientras se revisa',
    icon: EyeOff,
    tone: 'bg-muted text-foreground',
    explanation:
      'Lo reportaron y está oculto mientras moderación lo revisa. Es temporal: si nadie lo revisa en 7 días vuelve a verse, y no se descuentan puntos.',
  },
  REJECTED: {
    label: 'Rechazado',
    icon: CircleSlash,
    tone: 'bg-destructive/10 text-destructive',
    explanation: 'No se publicó. Podés corregirlo y reenviarlo.',
  },
  REMOVED: {
    label: 'Retirado',
    icon: Undo2,
    tone: 'bg-destructive/10 text-destructive',
    explanation: 'Moderación lo sacó de la vista pública.',
  },
};

const TYPE_LABEL: Record<Submission['type'], string> = {
  MATERIAL: 'Material',
  COURSE_REVIEW: 'Reseña de cursada',
  EXAM_EXPERIENCE: 'Experiencia de final',
};

const dateFormat = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function publicHref(submission: Submission) {
  if (submission.status !== 'PUBLISHED') return null;
  if (submission.type === 'MATERIAL') return `/materiales/${submission.id}`;
  return `${submission.type === 'COURSE_REVIEW' ? '/resenas' : '/finales'}/${submission.id}`;
}

function editHref(submission: Submission) {
  const subject = submission.subject.code ?? submission.subject.id;
  const form = submission.type === 'COURSE_REVIEW' ? 'resenar' : 'final';
  return `/materias/${encodeURIComponent(subject)}/${form}?editar=${encodeURIComponent(submission.id)}`;
}

function ResubmitMaterial({ id, onDone }: { id: string; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const inputId = `resubmit-file-${id}`;

  const send = async () => {
    setError(null);
    setIsSending(true);
    try {
      await resubmit('MATERIAL', id, file);
      onDone();
    } catch (sendError) {
      setError(getApiError(sendError));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div className="grid gap-1">
        <label className="text-sm font-semibold" htmlFor={inputId}>
          Archivo corregido (opcional)
        </label>
        <input
          className="text-sm file:mr-3 file:rounded-md file:border-[1.5px] file:border-line file:bg-card file:px-3 file:py-2 file:font-semibold"
          id={inputId}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          type="file"
        />
      </div>
      <Button disabled={isSending} onClick={send} size="sm">
        {isSending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <RotateCcw aria-hidden="true" className="size-4" />
        )}
        Reenviar a revisión
      </Button>
      <FieldError className="sm:col-span-2">{error}</FieldError>
    </div>
  );
}

function SubmissionItem({
  onChanged,
  submission,
}: {
  onChanged: () => void;
  submission: Submission;
}) {
  const status = STATUS[submission.status];
  const StatusIcon = status.icon;
  const href = publicHref(submission);
  const title =
    submission.type === 'MATERIAL'
      ? submission.title
      : `${submission.title}${submission.isAnonymous ? ' · anónima' : ''}`;
  const date = dateFormat.format(new Date(submission.statusChangedAt));

  return (
    <li className="grid gap-3 rounded-xl border-[1.5px] border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {TYPE_LABEL[submission.type]} · {submission.subject.name}
          </p>
          <h3 className="mt-1 text-lg font-extrabold tracking-[-0.02em]">
            {href ? (
              <Link className="hover:text-link" href={href}>
                {title}
              </Link>
            ) : (
              title
            )}
          </h3>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-extrabold',
            status.tone,
          )}
        >
          <StatusIcon aria-hidden="true" className="size-3.5" />
          {status.label}
        </span>
      </div>

      {status.explanation ? (
        <p className="text-sm text-muted-foreground">{status.explanation}</p>
      ) : null}
      {submission.reason ? (
        <blockquote className="rounded-lg border-l-4 border-foreground/20 bg-muted px-3 py-2 text-sm">
          <span className="font-semibold">Motivo de moderación: </span>
          {submission.reason}
        </blockquote>
      ) : null}
      <p className="text-xs text-muted-foreground">Actualizado el {date}</p>

      {submission.canResubmit ? (
        submission.type === 'MATERIAL' ? (
          <ResubmitMaterial id={submission.id} onDone={onChanged} />
        ) : (
          <div>
            <Button asChild size="sm" variant="outline">
              <Link href={editHref(submission)}>
                <Pencil aria-hidden="true" className="size-4" />
                Editar y reenviar
              </Link>
            </Button>
          </div>
        )
      ) : null}
    </li>
  );
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; submissions: Submission[] };

/** Mis envíos: what happened to each of the author's contributions. */
export function MySubmissions() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => {
    setState({ status: 'loading' });
    setReloadKey((key) => key + 1);
  };

  useEffect(() => {
    let active = true;
    getMySubmissions()
      .then((submissions) => {
        if (active) setState({ status: 'ready', submissions });
      })
      .catch((loadError: unknown) => {
        if (active) setState({ status: 'error', message: getApiError(loadError) });
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  return (
    <section className="grid gap-4 font-sans" id="mis-envios">
      <div>
        <h2 className="text-2xl font-extrabold tracking-[-0.03em]">Mis envíos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Lo que compartiste se publica al instante. Acá ves qué pasó con cada aporte.
        </p>
      </div>

      {state.status === 'loading' ? <LoadingState heading="Cargando tus envíos" /> : null}
      {state.status === 'error' ? (
        <ErrorState
          action={
            <Button onClick={reload} size="sm" variant="outline">
              Reintentar
            </Button>
          }
          description={state.message}
          heading="No pudimos cargar tus envíos"
        />
      ) : null}
      {state.status === 'ready' && state.submissions.length === 0 ? (
        <EmptyState
          action={
            <Button asChild size="sm">
              <Link href="/materiales/nuevo">Subir material</Link>
            </Button>
          }
          heading="Todavía no compartiste nada."
        />
      ) : null}
      {state.status === 'ready' && state.submissions.length > 0 ? (
        <ul className="grid gap-3">
          {state.submissions.map((submission) => (
            <SubmissionItem
              key={`${submission.type}-${submission.id}`}
              onChanged={reload}
              submission={submission}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
