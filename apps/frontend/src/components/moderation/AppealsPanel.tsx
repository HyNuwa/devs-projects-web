'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState } from '@/components/ui/shadcn';
import { cn } from '@/components/ui/shadcn/utils';
import {
  answerAppeal,
  type AppealDetail,
  type AppealSummary,
  getAppeal,
  getAppeals,
} from '@/lib/appeals-client';
import { getApiError } from '@/lib/apiHelpers';
import { useAuthStore } from '@/stores/authStore';

import { ModerationHeader } from './ModerationHeader';

const MODERATOR_ROLES = new Set(['MODERATOR', 'ADMIN', 'SUPERADMIN']);
const ANSWER_MAX = 1000;
const SANCTION_LABEL = {
  WARNING: 'Advertencia',
  MUTE: 'Silenciamiento',
  SUSPENSION: 'Suspensión',
};

const dateFormat = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' });
const formatDate = (value: string | null) => (value ? dateFormat.format(new Date(value)) : '—');

function ago(value: string) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / (24 * 3_600_000));
  if (days <= 0) return 'hoy';
  return days === 1 ? 'hace 1 día' : `hace ${days} días`;
}

function title(appeal: AppealSummary) {
  if (appeal.decision.kind === 'RETIRO') return `«${appeal.decision.label ?? 'Aporte'}»`;
  const type = appeal.decision.type ? SANCTION_LABEL[appeal.decision.type] : 'Sanción';
  return `${type} de @${appeal.appellant.username ?? 'desconocido'}`;
}

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; appeals: AppealSummary[] };

/** The Apelaciones tab (canvas «ModeracionApelaciones»). */
export function AppealsPanel() {
  const user = useAuthStore((state) => state.user);
  const isModerator = Boolean(user && MODERATOR_ROLES.has(user.role));
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const [list, setList] = useState<ListState>({ status: 'loading' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AppealDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isModerator) return;
    let active = true;
    getAppeals()
      .then((appeals) => {
        if (!active) return;
        setList({ status: 'ready', appeals });
        setSelectedId((current) =>
          current && appeals.some((appeal) => appeal.id === current)
            ? current
            : (appeals[0]?.id ?? null),
        );
      })
      .catch((error: unknown) => {
        if (active) setList({ status: 'error', message: getApiError(error) });
      });
    return () => {
      active = false;
    };
  }, [isModerator, reloadKey]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    getAppeal(selectedId)
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch((error: unknown) => {
        if (active) setDetailError(getApiError(error));
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  if (!isModerator) {
    return (
      <EmptyState
        description="Si creés que deberías tener acceso, hablá con un admin."
        heading="Esta sección es solo para moderación."
      />
    );
  }

  const appeals = list.status === 'ready' ? list.appeals : [];

  return (
    <div className="grid gap-6 font-sans">
      <ModerationHeader
        active="apelaciones"
        description="Cada decisión se puede apelar una vez, dentro de 14 días. La revisa otra persona y su respuesta es final."
      />

      {list.status === 'loading' ? <LoadingState heading="Cargando apelaciones" /> : null}
      {list.status === 'error' ? (
        <ErrorState description={list.message} heading="No pudimos cargar las apelaciones" />
      ) : null}

      {list.status === 'ready' ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <section aria-labelledby="appeals-heading" className="grid content-start gap-3">
            <h2 className="text-xl font-extrabold" id="appeals-heading">
              Apelaciones · {appeals.length}
            </h2>
            {appeals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay apelaciones para resolver.</p>
            ) : (
              <ul className="grid gap-2">
                {appeals.map((appeal) => (
                  <li key={appeal.id}>
                    <button
                      aria-current={selectedId === appeal.id ? 'true' : undefined}
                      className={cn(
                        'grid w-full gap-1 rounded-xl border-[1.5px] p-3 text-left text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
                        selectedId === appeal.id
                          ? 'border-primary bg-secondary'
                          : 'border-border bg-card hover:bg-muted',
                      )}
                      onClick={() => {
                        setDetail(null);
                        setDetailError(null);
                        setSelectedId(appeal.id);
                      }}
                      type="button"
                    >
                      <span className="font-extrabold">{title(appeal)}</span>
                      <span className="text-muted-foreground">
                        {appeal.kind === 'RETIRO' ? 'Retiro' : 'Sanción'} · decidió @
                        {appeal.decidedBy.username ?? 'desconocido'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Apelada {ago(appeal.createdAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              No ves apelaciones de decisiones tuyas.
              {isAdmin ? '' : ' Las de suspensiones las resuelve un admin.'}
            </p>
          </section>

          <div className="min-w-0">
            {detailError ? (
              <ErrorState description={detailError} heading="No pudimos abrir la apelación" />
            ) : null}
            {selectedId && !detail && !detailError ? (
              <LoadingState heading="Cargando la apelación" />
            ) : null}
            {detail ? (
              <AppealView
                appeal={detail}
                key={detail.id}
                onAnswered={() => {
                  setDetail(null);
                  setSelectedId(null);
                  setReloadKey((key) => key + 1);
                }}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AppealView({ appeal, onAnswered }: { appeal: AppealDetail; onAnswered: () => void }) {
  const answerId = useId();
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const retiro = appeal.decision.kind === 'RETIRO';

  const submit = async (accept: boolean) => {
    const trimmed = answer.trim();
    if (!trimmed) {
      setError('Escribí la respuesta: la ve quien apeló, junto con la decisión.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await answerAppeal(appeal.id, { accept, answer: trimmed });
      onAnswered();
    } catch (caught) {
      setError(getApiError(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="grid gap-5 rounded-2xl border-[1.5px] border-border bg-card p-5">
      <header className="grid gap-1">
        <h2 className="text-2xl font-extrabold">Apelación · {title(appeal)}</h2>
        <p className="text-sm text-muted-foreground">
          Apelada por{' '}
          {appeal.appellant.hidden ? (
            <span className="font-bold">Autor oculto</span>
          ) : (
            <span className="font-bold">@{appeal.appellant.username}</span>
          )}{' '}
          {ago(appeal.createdAt)}
        </p>
      </header>

      <section className="grid gap-1 rounded-xl bg-muted p-4 text-sm">
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Decisión apelada
        </h3>
        <p className="font-bold">
          {retiro
            ? `Retirado el ${formatDate(appeal.decision.decidedAt)}`
            : `${appeal.decision.kind === 'SANCTION' && appeal.decision.type ? SANCTION_LABEL[appeal.decision.type] : 'Sanción'} desde el ${formatDate(appeal.decision.decidedAt)}`}
          {appeal.decision.kind === 'SANCTION' && appeal.decision.anonymousCase
            ? ' · por un caso sobre una publicación anónima'
            : ''}
        </p>
        <p>«{appeal.decision.reason ?? 'Sin razón registrada'}»</p>
        <p className="text-muted-foreground">
          Decidió @{appeal.decidedBy.username ?? 'desconocido'}
        </p>
      </section>

      <section className="grid gap-1 text-sm">
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Lo que dice quien apela
        </h3>
        <blockquote className="rounded-xl border-[1.5px] border-line p-4 leading-relaxed">
          «{appeal.explanation}»
        </blockquote>
      </section>

      {appeal.content ? (
        <section className="grid gap-2 text-sm">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Contenido
          </h3>
          {appeal.content.comment ? (
            <blockquote className="rounded-xl border-[1.5px] border-line p-4 leading-relaxed">
              {appeal.content.comment}
            </blockquote>
          ) : null}
          <Link
            className="font-bold text-link underline underline-offset-4"
            href={`/admin?caso=${encodeURIComponent(appeal.content.caseId)}`}
          >
            Abrir el caso
          </Link>
        </section>
      ) : null}

      {appeal.canAnswer ? (
        <div className="grid gap-3">
          <label className="grid gap-1" htmlFor={answerId}>
            <span className="text-sm font-bold">Tu respuesta</span>
            <textarea
              aria-invalid={Boolean(error)}
              className="min-h-24 rounded-lg border-[1.5px] border-input bg-background p-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              id={answerId}
              maxLength={ANSWER_MAX}
              onChange={(event) => setAnswer(event.target.value)}
              value={answer}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Obligatoria. {answer.length} / {ANSWER_MAX}. La respuesta es final.{' '}
            {retiro
              ? 'Si la aceptás, el contenido se restaura, se reotorgan sus puntos y el retiro deja de contar para la escalera.'
              : 'Si la aceptás, la sanción se anula en el momento y deja de contar para la escalera.'}
          </p>
          {error ? (
            <p className="text-sm font-semibold text-destructive-ink" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => submit(false)} variant="outline">
              Mantener la decisión
            </Button>
            <Button disabled={busy} onClick={() => submit(true)}>
              {retiro ? 'Aceptar y restaurar' : 'Aceptar y anular'}
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
