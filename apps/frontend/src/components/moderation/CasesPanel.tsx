'use client';

import {
  BookOpen,
  CalendarClock,
  Eye,
  EyeOff,
  FileText,
  Flag,
  LoaderCircle,
  MessagesSquare,
  ShieldAlert,
  UserRound,
  X,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState } from '@/components/ui/shadcn';
import { cn } from '@/components/ui/shadcn/utils';
import { getApiError } from '@/lib/apiHelpers';
import {
  type CaseDetail,
  caseFileUrl,
  getCaseFile,
  decideCase,
  getModerationCase,
  getModerationQueue,
  type ModerationDecision,
  type ModerationQueue,
  type QueueItem,
  revealCaseAuthor,
} from '@/lib/moderation-client';
import { reportReasonLabels } from '@/lib/report-client';
import { useAuthStore } from '@/stores/authStore';

import { ModerationHeader } from './ModerationHeader';

const MODERATOR_ROLES = new Set(['MODERATOR', 'ADMIN', 'SUPERADMIN']);
const HIDDEN_TARGET_HOURS = 48;

const TYPE_LABEL = {
  MATERIAL: 'Material',
  COURSE_REVIEW: 'Reseña de cursada',
  EXAM_EXPERIENCE: 'Experiencia de final',
} as const;

const TYPE_ICON = {
  MATERIAL: FileText,
  COURSE_REVIEW: MessagesSquare,
  EXAM_EXPERIENCE: BookOpen,
} as const;

function hoursSince(date: string) {
  return (Date.now() - new Date(date).getTime()) / 3_600_000;
}

function relativeHours(date: string) {
  const hours = Math.max(0, Math.round(hoursSince(date)));
  if (hours < 1) return 'recién';
  if (hours < 48) return `hace ${hours} h`;
  return `hace ${Math.round(hours / 24)} días`;
}

function StatusBadge({
  item,
}: {
  item: Pick<QueueItem, 'kind' | 'overdueHidden' | 'openedAt' | 'targetStatus'>;
}) {
  if (item.kind === 'PRIOR_REVIEW') {
    return <Badge tone="bg-accent/30 text-accent-foreground">Previa</Badge>;
  }
  if (item.overdueHidden) {
    return <Badge tone="bg-destructive/10 text-destructive-ink">Visible de nuevo</Badge>;
  }
  if (item.targetStatus === 'HIDDEN') {
    const left = Math.max(0, Math.round(HIDDEN_TARGET_HOURS - hoursSince(item.openedAt)));
    return <Badge tone="bg-destructive/10 text-destructive-ink">Quedan {left} h</Badge>;
  }
  return <Badge tone="bg-success/12 text-success-ink">Visible</Badge>;
}

function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span className={cn('shrink-0 rounded-sm px-2 py-0.5 text-xs font-extrabold', tone)}>
      {children}
    </span>
  );
}

function QueueGroup({
  id,
  items,
  onSelect,
  selectedId,
  title,
}: {
  id: string;
  items: QueueItem[];
  onSelect: (caseId: string) => void;
  selectedId: string | null;
  title: string;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={id} className="grid gap-2">
      <h3 className="text-xs font-extrabold uppercase tracking-[0.15em] text-link" id={id}>
        {title} <span className="text-muted-foreground">{items.length}</span>
      </h3>
      {items.map((item) => {
        const Icon = TYPE_ICON[item.targetType];
        const meta =
          item.kind === 'PRIOR_REVIEW'
            ? item.subject.name
            : `${item.subject.name} · ${item.reportCount} ${item.reportCount === 1 ? 'reporte' : 'reportes'}`;
        return (
          <button
            aria-current={selectedId === item.caseId ? 'true' : undefined}
            className={cn(
              'flex min-h-11 w-full items-start gap-3 rounded-xl border-[1.5px] bg-card p-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
              selectedId === item.caseId ? 'border-primary bg-secondary' : 'border-line',
            )}
            key={item.caseId}
            onClick={() => onSelect(item.caseId)}
            type="button"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg border-[1.5px] border-foreground bg-card">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-extrabold">
                {item.targetType === 'MATERIAL'
                  ? item.label
                  : `${item.label}${item.isAnonymous ? ' · anónima' : ''}`}
              </span>
              <span className="block truncate text-sm text-muted-foreground">{meta}</span>
              {item.topReason ? (
                <span className="block text-xs text-muted-foreground">
                  {reportReasonLabels[item.topReason]}
                </span>
              ) : null}
            </span>
            <StatusBadge item={item} />
          </button>
        );
      })}
    </section>
  );
}

function AuthorPanel({
  detail,
  onRevealed,
}: {
  detail: CaseDetail;
  onRevealed: (author: CaseDetail['author']) => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  if (!detail.author.hidden) {
    const author = detail.author;
    return (
      <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-line bg-card p-3">
        <span className="grid size-10 place-items-center rounded-full border-[1.5px] border-foreground bg-accent/30">
          <UserRound aria-hidden="true" className="size-5" />
        </span>
        <div className="text-sm">
          <p className="font-extrabold">@{author.username}</p>
          <p className="text-muted-foreground">
            {author.publishedMaterials} aportes · {author.removalsLast90Days} retiros en 90 días ·
            cuenta {relativeHours(author.accountCreatedAt).replace('hace', 'de')}
          </p>
        </div>
      </div>
    );
  }

  const reveal = async () => {
    if (!reason.trim()) {
      setError('Escribí por qué necesitás ver al autor.');
      return;
    }
    setError(null);
    setIsRevealing(true);
    try {
      onRevealed(await revealCaseAuthor(detail.caseId, reason.trim()));
    } catch (revealError) {
      setError(getApiError(revealError));
    } finally {
      setIsRevealing(false);
    }
  };

  return (
    <div className="grid gap-2 rounded-xl border-[1.5px] border-dashed border-foreground/40 bg-card p-3">
      <p className="flex items-center gap-2 font-extrabold">
        <EyeOff aria-hidden="true" className="size-4" />
        Autor oculto
      </p>
      <label className="text-sm font-semibold" htmlFor={`reveal-${detail.caseId}`}>
        Motivo para ver el autor
      </label>
      <textarea
        className="min-h-20 rounded-md border-[1.5px] border-input bg-card p-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        id={`reveal-${detail.caseId}`}
        maxLength={300}
        onChange={(event) => setReason(event.target.value)}
        value={reason}
      />
      {error ? (
        <p className="text-sm font-bold text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={isRevealing} onClick={reveal} size="sm" variant="outline">
          <Eye aria-hidden="true" className="size-4" />
          Ver autor
        </Button>
        <span className="text-xs text-muted-foreground">
          Queda registrado y lo pueden revisar los admins.
        </span>
      </div>
    </div>
  );
}

/**
 * The API sits on another origin and forbids framing, so the PDF is downloaded
 * with the moderator session and shown from an object URL, only once it is
 * verified to really be a PDF.
 */
function PdfPreview({ caseId, title }: { caseId: string; title: string }) {
  const [preview, setPreview] = useState<{ caseId: string; url: string | null } | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    getCaseFile(caseId)
      .then(async (blob) => {
        const isPdf =
          blob.type.split(';')[0] === 'application/pdf' &&
          (await blob.slice(0, 5).text()) === '%PDF-';
        if (!active) return;
        if (!isPdf) {
          setPreview({ caseId, url: null });
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setPreview({ caseId, url: objectUrl });
      })
      .catch(() => {
        if (active) setPreview({ caseId, url: null });
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [caseId]);

  const frameClassName = 'h-80 w-full rounded-xl border-[1.5px] border-line bg-card';
  if (preview?.caseId !== caseId) {
    return <div aria-hidden="true" className={cn(frameClassName, 'animate-pulse')} />;
  }
  if (!preview.url) {
    return (
      <p className="rounded-xl border-[1.5px] border-line bg-card p-4 text-sm text-muted-foreground">
        No pudimos mostrar la vista previa.
      </p>
    );
  }
  return <iframe className={frameClassName} src={preview.url} title={title} />;
}

function TargetPreview({ detail }: { detail: CaseDetail }) {
  if (detail.target.type === 'MATERIAL') {
    const url = caseFileUrl(detail.caseId);
    return (
      <div className="grid gap-2">
        {detail.target.fileType === 'pdf' ? (
          <PdfPreview caseId={detail.caseId} title={`Vista previa de ${detail.target.label}`} />
        ) : null}
        <a
          className="text-sm font-bold text-link underline-offset-4 hover:underline"
          href={url}
          rel="noreferrer"
          target="_blank"
        >
          Abrir archivo
        </a>
      </div>
    );
  }
  return (
    <blockquote className="rounded-xl border-[1.5px] border-line bg-card p-4 text-sm leading-relaxed">
      {detail.target.comment ?? 'Sin comentario escrito.'}
    </blockquote>
  );
}

type DecisionBarProps = {
  detail: CaseDetail;
  onDecided: () => void;
  reasonRef: React.RefObject<HTMLTextAreaElement | null>;
};

function DecisionBar({ detail, onDecided, reasonRef }: DecisionBarProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<ModerationDecision | null>(null);
  const disabled = !detail.viewer.canDecide || pending !== null;

  const restorable = detail.status === 'CLOSED' && detail.target.status === 'REMOVED';
  if (detail.status === 'CLOSED' && !restorable) {
    return <p className="text-sm text-muted-foreground">Este caso ya está resuelto.</p>;
  }

  const decide = async (decision: ModerationDecision, needsReason: boolean) => {
    const trimmed = reason.trim();
    if (needsReason && !trimmed) {
      setError('Escribí la razón de la decisión.');
      reasonRef.current?.focus();
      return;
    }
    setError(null);
    setPending(decision);
    try {
      await decideCase(detail.caseId, decision, trimmed || undefined);
      setReason('');
      onDecided();
    } catch (decisionError) {
      setError(getApiError(decisionError));
    } finally {
      setPending(null);
    }
  };

  const label = restorable ? 'Razón para restaurar (interna)' : 'Razón para el autor';

  return (
    <div className="grid gap-3 border-t-[1.5px] border-line pt-4">
      {detail.viewer.conflict ? (
        <p className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm font-semibold">
          <ShieldAlert aria-hidden="true" className="size-4" />
          {detail.viewer.conflict === 'OWN_CONTENT'
            ? 'No podés decidir sobre tu propio contenido. Lo resuelve otra persona de moderación.'
            : 'Reportaste este contenido: lo resuelve otra persona de moderación.'}
        </p>
      ) : null}
      <label className="text-sm font-extrabold" htmlFor={`decision-reason-${detail.caseId}`}>
        {label}
      </label>
      <textarea
        aria-describedby={`decision-help-${detail.caseId}`}
        className="min-h-24 rounded-md border-[1.5px] border-input bg-card p-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        id={`decision-reason-${detail.caseId}`}
        maxLength={1000}
        onChange={(event) => setReason(event.target.value)}
        ref={reasonRef}
        value={reason}
      />
      <p className="text-xs text-muted-foreground" id={`decision-help-${detail.caseId}`}>
        {restorable
          ? 'Obligatoria. Queda en el historial; el autor no la ve.'
          : detail.kind === 'PRIOR_REVIEW'
            ? 'Obligatoria para rechazar: el autor la ve junto con la fecha.'
            : 'Obligatoria para retirar: el autor la ve junto con la fecha. Para mantener visible es opcional.'}{' '}
        {reason.length} / 1000
      </p>
      {error ? (
        <p className="text-sm font-bold text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {restorable ? (
          <Button disabled={disabled} onClick={() => decide('RESTORE', true)}>
            Restaurar
          </Button>
        ) : detail.kind === 'PRIOR_REVIEW' ? (
          <>
            <Button
              disabled={disabled}
              onClick={() => decide('REJECT', true)}
              variant="destructive"
            >
              <X aria-hidden="true" className="size-4" />
              Rechazar
            </Button>
            <Button disabled={disabled} onClick={() => decide('APPROVE', false)}>
              Aprobar y publicar
            </Button>
          </>
        ) : (
          <>
            <Button
              disabled={disabled}
              onClick={() => decide('KEEP_VISIBLE', false)}
              variant="outline"
            >
              <Eye aria-hidden="true" className="size-4" />
              Mantener visible
            </Button>
            <Button
              disabled={disabled}
              onClick={() => decide('REMOVE', true)}
              variant="destructive"
            >
              <X aria-hidden="true" className="size-4" />
              Retirar
            </Button>
          </>
        )}
        {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
      </div>
    </div>
  );
}

function CaseDetailView({
  detail,
  onDecided,
  onRevealed,
  reasonRef,
}: {
  detail: CaseDetail;
  onDecided: () => void;
  onRevealed: (author: CaseDetail['author']) => void;
  reasonRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const Icon = TYPE_ICON[detail.target.type];
  return (
    <article className="grid gap-5 rounded-2xl border-[1.5px] border-border bg-card p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-12 place-items-center rounded-xl border-[1.5px] border-foreground bg-card">
            <Icon aria-hidden="true" className="size-6" />
          </span>
          <div>
            <h2 className="text-2xl font-extrabold tracking-[-0.03em]">{detail.target.label}</h2>
            <p className="text-sm text-muted-foreground">
              {TYPE_LABEL[detail.target.type]} · {detail.target.subject.name}
              {detail.target.isAnonymous ? ' · publicada como Anónimo' : ''} · caso abierto{' '}
              {relativeHours(detail.openedAt)}
            </p>
          </div>
        </div>
        <StatusBadge
          item={{
            kind: detail.kind,
            openedAt: detail.openedAt,
            overdueHidden: detail.overdueHidden,
            targetStatus: detail.target.status,
          }}
        />
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <TargetPreview detail={detail} />
        <div className="grid content-start gap-4">
          {detail.target.status === 'HIDDEN' ? (
            <section aria-labelledby={`why-${detail.caseId}`}>
              <h3
                className="text-xs font-extrabold uppercase tracking-[0.15em]"
                id={`why-${detail.caseId}`}
              >
                Por qué está oculto
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {detail.reports.some((report) => report.reason === 'DATOS_PERSONALES')
                  ? 'Un reporte por datos personales alcanza para ocultarlo hasta que lo revises.'
                  : 'Tres reportes de cuentas distintas en 48 horas lo ocultaron.'}{' '}
                Si nadie lo revisa en 7 días, vuelve a verse solo.
              </p>
            </section>
          ) : null}
          {detail.reports.length > 0 ? (
            <section aria-labelledby={`reports-${detail.caseId}`}>
              <h3
                className="text-xs font-extrabold uppercase tracking-[0.15em]"
                id={`reports-${detail.caseId}`}
              >
                Reportes · {detail.reports.length}
              </h3>
              <ul className="mt-2 grid gap-2">
                {detail.reports.map((report, index) => (
                  <li className="flex gap-2 text-sm" key={`${report.createdAt}-${index}`}>
                    <Flag aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
                    <div>
                      <p className="font-bold">{reportReasonLabels[report.reason]}</p>
                      {report.explanation ? <p>«{report.explanation}»</p> : null}
                      <p className="text-xs text-muted-foreground">
                        {report.qualifiedReporter
                          ? 'Estudiante verificado'
                          : 'Cuenta nueva o sin verificar'}{' '}
                        · {relativeHours(report.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <AuthorPanel detail={detail} onRevealed={onRevealed} />
          {detail.history.length > 0 ? (
            <section aria-labelledby={`history-${detail.caseId}`}>
              <h3
                className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.15em]"
                id={`history-${detail.caseId}`}
              >
                <CalendarClock aria-hidden="true" className="size-4" />
                Casos anteriores
              </h3>
              <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
                {detail.history.map((entry) => (
                  <li key={entry.caseId}>
                    {entry.decision ?? 'Sin decisión'}
                    {entry.decisionReason ? ` · ${entry.decisionReason}` : ''}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      <DecisionBar detail={detail} onDecided={onDecided} reasonRef={reasonRef} />
    </article>
  );
}

function isTypingTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;
  return element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
}

type QueueState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; queue: ModerationQueue };

/** The Casos tab: grouped queue on the left, the selected caso on the right. */
export function CasesPanel() {
  const user = useAuthStore((state) => state.user);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const requestedCase = searchParams.get('caso');
  const [queueState, setQueueState] = useState<QueueState>({ status: 'loading' });
  const [queueKey, setQueueKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(requestedCase);
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const reasonRef = useRef<HTMLTextAreaElement | null>(null);
  const isModerator = Boolean(user && MODERATOR_ROLES.has(user.role));

  const ordered = useMemo(
    () =>
      queueState.status === 'ready'
        ? [
            ...queueState.queue.hidden,
            ...queueState.queue.priorReview,
            ...queueState.queue.reported,
          ]
        : [],
    [queueState],
  );

  useEffect(() => {
    if (!isModerator) return;
    let active = true;
    getModerationQueue()
      .then((queue) => {
        if (!active) return;
        setQueueState({ status: 'ready', queue });
        setSelectedId((current) => {
          const all = [...queue.hidden, ...queue.priorReview, ...queue.reported];
          if (
            current &&
            (current === requestedCase || all.some((item) => item.caseId === current))
          ) {
            return current;
          }
          return all[0]?.caseId ?? null;
        });
      })
      .catch((error: unknown) => {
        if (active) setQueueState({ status: 'error', message: getApiError(error) });
      });
    return () => {
      active = false;
    };
  }, [isModerator, queueKey, requestedCase]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    getModerationCase(selectedId)
      .then((loaded) => {
        if (active) setDetail(loaded);
      })
      .catch(() => {
        if (active) setDetail(null);
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  const select = useCallback(
    (caseId: string) => {
      setSelectedId(caseId);
      if (requestedCase) router.replace(pathname);
    },
    [pathname, requestedCase, router],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === 'j' || key === 'k') {
        if (ordered.length === 0) return;
        const index = ordered.findIndex((item) => item.caseId === selectedId);
        const next =
          key === 'j'
            ? Math.min(ordered.length - 1, index + 1)
            : Math.max(0, index === -1 ? 0 : index - 1);
        event.preventDefault();
        select(ordered[next].caseId);
      }
      if (key === 'v' || key === 'r') {
        event.preventDefault();
        reasonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [ordered, select, selectedId]);

  if (!isModerator) {
    return (
      <EmptyState
        description="Si creés que deberías tener acceso, hablá con un admin."
        heading="Esta sección es solo para moderación."
      />
    );
  }

  const counts =
    queueState.status === 'ready'
      ? {
          hidden: queueState.queue.hidden.length,
          prior: queueState.queue.priorReview.length,
          reported: queueState.queue.reported.length,
        }
      : null;

  return (
    <div className="grid gap-6 font-sans">
      <ModerationHeader
        active="casos"
        caseCount={counts ? counts.hidden + counts.prior + counts.reported : undefined}
        description="Todo se publica al instante. Acá llega lo que la comunidad reportó y lo que necesita revisión previa. Cada decisión lleva su razón y queda en el historial."
      />

      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {[
          ['V', 'mantener visible'],
          ['R', 'retirar'],
          ['J', 'siguiente'],
          ['K', 'anterior'],
        ].map(([key, label]) => (
          <span className="inline-flex items-center gap-1.5" key={key}>
            <kbd className="rounded border-[1.5px] border-foreground bg-card px-1.5 text-xs font-extrabold">
              {key}
            </kbd>
            {label}
          </span>
        ))}
        <span>Los atajos solo abren la acción: nada se decide sin confirmar.</span>
      </p>

      {counts ? (
        <dl className="grid gap-3 sm:grid-cols-3">
          {[
            [counts.hidden, 'ocultos preventivamente', 'objetivo: 48 h'],
            [counts.prior, 'en revisión previa', 'cuentas nuevas o sin verificar'],
            [counts.reported, 'reportados y visibles', 'objetivo: 7 días'],
          ].map(([count, label, hint]) => (
            <div
              className="rounded-2xl border-[1.5px] border-border bg-card p-4"
              key={String(label)}
            >
              <dt className="order-2 font-extrabold">{label}</dt>
              <dd className="text-3xl font-extrabold">{count}</dd>
              <dd className="text-xs text-muted-foreground">{hint}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {queueState.status === 'loading' ? <LoadingState heading="Cargando casos" /> : null}
      {queueState.status === 'error' ? (
        <ErrorState description={queueState.message} heading="No pudimos cargar los casos" />
      ) : null}

      {queueState.status === 'ready' ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <div className="grid content-start gap-5">
            <h2 className="text-xl font-extrabold">Casos abiertos · {ordered.length}</h2>
            {ordered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay casos abiertos. ¡Todo al día!</p>
            ) : null}
            <QueueGroup
              id="queue-hidden"
              items={queueState.queue.hidden}
              onSelect={select}
              selectedId={selectedId}
              title="Ocultos preventivamente"
            />
            <QueueGroup
              id="queue-prior"
              items={queueState.queue.priorReview}
              onSelect={select}
              selectedId={selectedId}
              title="Revisión previa"
            />
            <QueueGroup
              id="queue-reported"
              items={queueState.queue.reported}
              onSelect={select}
              selectedId={selectedId}
              title="Reportados"
            />
          </div>
          {detail ? (
            <CaseDetailView
              detail={detail}
              key={detail.caseId}
              onDecided={() => {
                setDetail(null);
                setSelectedId(null);
                setQueueKey((key) => key + 1);
              }}
              onRevealed={(author) => setDetail({ ...detail, author })}
              reasonRef={reasonRef}
            />
          ) : selectedId ? (
            <LoadingState heading="Cargando el caso" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
