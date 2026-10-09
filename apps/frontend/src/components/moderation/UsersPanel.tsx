'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId, useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState } from '@/components/ui/shadcn';
import { cn } from '@/components/ui/shadcn/utils';
import { getApiError } from '@/lib/apiHelpers';
import {
  type AccountStatus,
  confirmProposal,
  getModerationUser,
  getModerationUsers,
  liftSuspension,
  muteUser,
  proposeSuspension,
  rejectProposal,
  type SanctionAction,
  type SuggestedStep,
  suspendUser,
  type SuspensionDuration,
  type TimelineEntry,
  unmuteUser,
  type UserFile,
  type UsersFilter,
  type UsersList,
  warnUser,
} from '@/lib/moderation-users-client';
import { reportReasonLabels, type ReportReason } from '@/lib/report-client';
import { useAuthStore } from '@/stores/authStore';

import { ModerationHeader } from './ModerationHeader';

const MODERATOR_ROLES = new Set(['MODERATOR', 'ADMIN', 'SUPERADMIN']);
const REASON_MAX = 1000;

const FILTERS: Array<{ id: UsersFilter; label: string }> = [
  { id: 'suggested', label: 'Con sugerencias' },
  { id: 'sanctioned', label: 'Sancionados' },
  { id: 'prior-review', label: 'Revisión previa' },
];

const STEP_LABEL: Record<SuggestedStep, string> = {
  NONE: 'ninguno',
  WARNING: 'advertir',
  MUTE: 'silenciar 7 días',
  PROPOSE_SUSPENSION: 'proponer una suspensión',
};

const SANCTION_LABEL = { WARNING: 'Advertencia', MUTE: 'Silenciamiento', SUSPENSION: 'Suspensión' };

const DECISION_LABEL: Record<string, string> = {
  REMOVE: 'Retiro',
  KEEP_VISIBLE: 'Se mantuvo visible',
  RESTORE: 'Restauración',
  APPROVE: 'Revisión previa aprobada',
  REJECT: 'Revisión previa rechazada',
};

const DURATIONS: Array<{ id: SuspensionDuration; label: string }> = [
  { id: '7_DAYS', label: '7 días' },
  { id: '30_DAYS', label: '30 días' },
  { id: 'PERMANENT', label: 'Permanente' },
];

const dateFormat = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' });
const formatDate = (value: string) => dateFormat.format(new Date(value));

function accountAge(days: number) {
  if (days < 31) return `cuenta de ${days} ${days === 1 ? 'día' : 'días'}`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `cuenta de ${months} ${months === 1 ? 'mes' : 'meses'}`;
  }
  const years = Math.floor(days / 365);
  return `cuenta de ${years} ${years === 1 ? 'año' : 'años'}`;
}

function statusLabel(status: AccountStatus) {
  const until = status.until ? ` hasta el ${formatDate(status.until)}` : '';
  switch (status.kind) {
    case 'WARNED':
      return `Advertido${until}`;
    case 'MUTED':
      return `Silenciado${until}`;
    case 'SUSPENDED':
      return status.until ? `Suspendido${until}` : 'Suspendido sin fecha de fin';
    default:
      return 'Activo';
  }
}

function durationOf(days: number | null): SuspensionDuration {
  return days === 7 ? '7_DAYS' : days === 30 ? '30_DAYS' : 'PERMANENT';
}

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: UsersList };

type FileState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; file: UserFile };

/** The Usuarios tab (canvas «ModeracionUsuarios»). */
export function UsersPanel() {
  const user = useAuthStore((state) => state.user);
  const isModerator = Boolean(user && MODERATOR_ROLES.has(user.role));
  const [filter, setFilter] = useState<UsersFilter>('suggested');
  const [query, setQuery] = useState('');
  const [list, setList] = useState<ListState>({ status: 'loading' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fileState, setFileState] = useState<FileState>({ status: 'idle' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isModerator) return;
    let active = true;
    const q = query.trim();
    getModerationUsers(q ? { q } : { filter })
      .then((data) => {
        if (!active) return;
        setList({ status: 'ready', data });
        setSelectedId((current) => current ?? data.users[0]?.id ?? null);
      })
      .catch((error: unknown) => {
        if (active) setList({ status: 'error', message: getApiError(error) });
      });
    return () => {
      active = false;
    };
  }, [filter, isModerator, query, reloadKey]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    getModerationUser(selectedId)
      .then((file) => {
        if (active) setFileState({ status: 'ready', file });
      })
      .catch((error: unknown) => {
        if (active) setFileState({ status: 'error', message: getApiError(error) });
      });
    return () => {
      active = false;
    };
  }, [selectedId, reloadKey]);

  if (!isModerator) {
    return (
      <EmptyState
        description="Si creés que deberías tener acceso, hablá con un admin."
        heading="Esta sección es solo para moderación."
      />
    );
  }

  const select = (id: string) => {
    // Reselecting the open account would leave it loading: its load does not re-run.
    if (id === selectedId) return;
    setFileState({ status: 'loading' });
    setSelectedId(id);
  };

  return (
    <div className="grid gap-6 font-sans">
      <ModerationHeader
        active="usuarios"
        description="Cuentas con sanciones, sugerencias o revisión previa. El sistema sugiere el paso; la decisión es tuya."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="grid content-start gap-4">
          <label className="relative block">
            <span className="sr-only">Buscar por usuario</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              aria-label="Buscar por usuario"
              className="min-h-11 w-full rounded-lg border-[1.5px] border-input bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por usuario"
              type="search"
              value={query}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(({ id, label }) => (
              <button
                aria-pressed={filter === id && !query.trim()}
                className={cn(
                  'min-h-11 rounded-full border-[1.5px] px-4 text-sm font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
                  filter === id && !query.trim()
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-card hover:bg-muted',
                )}
                key={id}
                onClick={() => {
                  setQuery('');
                  setFilter(id);
                }}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          {list.status === 'loading' ? <LoadingState heading="Cargando cuentas" /> : null}
          {list.status === 'error' ? (
            <ErrorState description={list.message} heading="No pudimos cargar las cuentas" />
          ) : null}
          {list.status === 'ready' ? (
            <>
              {list.data.proposals && list.data.proposals.length > 0 ? (
                <section aria-labelledby="proposals-heading" className="grid gap-2">
                  <h2
                    className="text-xs font-bold uppercase tracking-[0.15em] text-destructive-ink"
                    id="proposals-heading"
                  >
                    Suspensiones propuestas · {list.data.proposals.length}
                  </h2>
                  {list.data.proposals.map((proposal) => (
                    <button
                      className="grid gap-1 rounded-xl border-[1.5px] border-destructive bg-card p-3 text-left text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                      key={proposal.id}
                      onClick={() => select(proposal.user.id)}
                      type="button"
                    >
                      <span className="font-extrabold">@{proposal.user.username}</span>
                      <span className="text-muted-foreground">
                        {proposal.reason} · propuesta por @
                        {proposal.proposedBy.username ?? 'desconocido'}
                      </span>
                    </button>
                  ))}
                </section>
              ) : null}
              {list.data.users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay cuentas con ese filtro.</p>
              ) : (
                <ul className="grid gap-2">
                  {list.data.users.map((entry) => (
                    <li key={entry.id}>
                      <button
                        aria-current={selectedId === entry.id ? 'true' : undefined}
                        className={cn(
                          'grid w-full gap-1 rounded-xl border-[1.5px] p-3 text-left text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
                          selectedId === entry.id
                            ? 'border-primary bg-secondary'
                            : 'border-border bg-card hover:bg-muted',
                        )}
                        onClick={() => select(entry.id)}
                        type="button"
                      >
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-extrabold">@{entry.username}</span>
                          <span className="rounded-sm bg-muted px-2 py-0.5 text-xs font-bold">
                            {statusLabel(entry.status)}
                          </span>
                        </span>
                        <span className="text-muted-foreground">
                          {[entry.career, accountAge(entry.accountAgeDays)]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                        {entry.suggestedStep !== 'NONE' ? (
                          <span className="font-semibold text-destructive-ink">
                            Sugerido: {STEP_LABEL[entry.suggestedStep]}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : null}
        </div>

        <div className="min-w-0">
          {fileState.status === 'loading' ? <LoadingState heading="Cargando la ficha" /> : null}
          {fileState.status === 'error' ? (
            <ErrorState description={fileState.message} heading="No pudimos cargar la ficha" />
          ) : null}
          {fileState.status === 'ready' ? (
            <UserFileView
              file={fileState.file}
              key={fileState.file.id}
              onChanged={() => setReloadKey((key) => key + 1)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ entry }: { entry: TimelineEntry }) {
  switch (entry.type) {
    case 'CASE':
      return (
        <>
          <span className="font-bold">
            {DECISION_LABEL[entry.decision ?? ''] ?? 'Caso'}
            {entry.reverted ? ' (revertido)' : ''}
          </span>{' '}
          <Link
            className="font-semibold text-link underline underline-offset-4"
            href={`/admin?caso=${encodeURIComponent(entry.caseId)}`}
          >
            {entry.label}
          </Link>
        </>
      );
    case 'SANCTION':
      return (
        <>
          <span className="font-bold">{SANCTION_LABEL[entry.kind]}</span>
          {entry.anonymousCase ? ' · por un caso sobre una publicación anónima' : null}
          {entry.voided ? ' · anulada por apelación' : entry.lifted ? ' · levantada' : null}
          <span className="block text-muted-foreground">{entry.reason}</span>
        </>
      );
    case 'REPORT_DISMISSED':
      return (
        <>
          <span className="font-bold">Reporte desestimado</span>{' '}
          <span className="text-muted-foreground">
            «{reportReasonLabels[entry.reason as ReportReason] ?? entry.reason}»
          </span>
        </>
      );
    case 'ACCOUNT_CREATED':
      return (
        <span className="font-bold">
          Cuenta creada{entry.emailVerified ? '' : ' · sin email verificado'}
        </span>
      );
  }
}

function UserFileView({ file, onChanged }: { file: UserFile; onChanged: () => void }) {
  const reasonId = useId();
  const durationId = useId();
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<SuspensionDuration>('7_DAYS');
  const [retire, setRetire] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const can = (action: SanctionAction) => file.actions.includes(action);

  const run = async (action: SanctionAction) => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Escribí la razón de la sanción.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (action === 'WARN') await warnUser(file.id, trimmed);
      if (action === 'MUTE') await muteUser(file.id, trimmed);
      if (action === 'UNMUTE') await unmuteUser(file.id, trimmed);
      if (action === 'PROPOSE_SUSPENSION') await proposeSuspension(file.id, trimmed, duration);
      if (action === 'SUSPEND') await suspendUser(file.id, trimmed, duration, retire);
      if (action === 'LIFT_SUSPENSION') await liftSuspension(file.id, trimmed);
      setReason('');
      setNotice('Listo. Quedó registrado en el historial.');
      onChanged();
    } catch (caught) {
      setError(getApiError(caught));
    } finally {
      setBusy(false);
    }
  };

  const step = file.suggestedStep !== 'NONE' ? file.suggestedStep : file.nextStepIfRetired;

  return (
    <article className="grid gap-5 rounded-2xl border-[1.5px] border-border bg-card p-5">
      <header className="grid gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-extrabold">@{file.username}</h2>
          <span className="rounded-sm bg-muted px-2 py-0.5 text-xs font-bold">
            {statusLabel(file.status)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {[
            file.career,
            accountAge(file.accountAgeDays),
            `${file.emailMasked} ${file.emailVerified ? 'verificado' : 'sin verificar'}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </header>

      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-muted p-3">
          <dd className="text-2xl font-extrabold">{file.counts.published}</dd>
          <dt className="text-sm">aportes publicados</dt>
        </div>
        <div className="rounded-xl bg-muted p-3">
          <dd className="text-2xl font-extrabold">{file.counts.retiros90d}</dd>
          <dt className="text-sm">retiros por normas en 90 días</dt>
        </div>
        <div className="rounded-xl bg-muted p-3">
          {file.reportPrecision === null ? (
            <dt className="text-sm text-muted-foreground">
              Tiene pocos reportes para calcular su precisión ({file.resolvedReports} resueltos).
            </dt>
          ) : (
            <>
              <dd className="text-2xl font-extrabold">
                {Math.round(file.reportPrecision * 100)} %
              </dd>
              <dt className="text-sm">precisión de sus reportes</dt>
            </>
          )}
        </div>
      </dl>

      <section className="grid gap-2">
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Línea de tiempo
        </h3>
        <ul aria-label="Línea de tiempo" className="grid gap-2 text-sm">
          {file.timeline.map((entry, index) => (
            <li className="grid grid-cols-[5rem_minmax(0,1fr)] gap-2" key={index}>
              <span className="text-muted-foreground">{formatDate(entry.date)}</span>
              <span>
                <TimelineItem entry={entry} />
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Sus publicaciones anónimas no se listan acá. Para relacionarlas con esta cuenta hay que
          usar «Ver autor» desde el caso.
        </p>
      </section>

      <p className="rounded-xl bg-secondary p-3 text-sm font-semibold">
        {step
          ? `Paso sugerido: ${STEP_LABEL[step]}${
              file.suggestedStep === 'NONE' ? ' si se retira el caso abierto' : ''
            }.`
          : 'Sin paso sugerido.'}{' '}
        <span className="font-normal text-muted-foreground">
          El sistema sugiere; la decisión es tuya.
        </span>
      </p>

      {file.pendingProposal ? (
        can('DECIDE_PROPOSAL') ? (
          <ProposalDecision onChanged={onChanged} proposal={file.pendingProposal} />
        ) : (
          <p className="rounded-xl border-[1.5px] border-destructive p-3 text-sm">
            Hay una propuesta de suspensión pendiente: la decide un admin.
          </p>
        )
      ) : null}

      {file.actions.some((action) => action !== 'DECIDE_PROPOSAL') ? (
        <form className="grid gap-3" onSubmit={(event) => event.preventDefault()}>
          <label className="grid gap-1" htmlFor={reasonId}>
            <span className="text-sm font-bold">Razón de la sanción</span>
            <textarea
              aria-describedby={error ? `${reasonId}-error` : undefined}
              aria-invalid={Boolean(error)}
              className="min-h-24 rounded-lg border-[1.5px] border-input bg-background p-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              id={reasonId}
              maxLength={REASON_MAX}
              onChange={(event) => setReason(event.target.value)}
              value={reason}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Obligatoria. La ve la cuenta sancionada, sin saber quién decidió. {reason.length} /{' '}
            {REASON_MAX}
          </p>
          {can('PROPOSE_SUSPENSION') || can('SUSPEND') ? (
            <div className="flex flex-wrap items-end gap-3">
              <label className="grid gap-1" htmlFor={durationId}>
                <span className="text-sm font-bold">Duración</span>
                <select
                  className="min-h-11 rounded-lg border-[1.5px] border-input bg-card px-3 text-sm"
                  id={durationId}
                  onChange={(event) => setDuration(event.target.value as SuspensionDuration)}
                  value={duration}
                >
                  {DURATIONS.map(({ id, label }) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {can('SUSPEND') ? (
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    checked={retire}
                    className="size-4"
                    onChange={(event) => setRetire(event.target.checked)}
                    type="checkbox"
                  />
                  Retirar también sus aportes publicados
                </label>
              ) : null}
            </div>
          ) : null}
          {error ? (
            <p
              className="text-sm font-semibold text-destructive-ink"
              id={`${reasonId}-error`}
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="text-sm font-semibold text-success-ink" role="status">
              {notice}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {can('WARN') ? (
              <Button disabled={busy} onClick={() => run('WARN')} variant="outline">
                Advertir
              </Button>
            ) : null}
            {can('MUTE') ? (
              <Button disabled={busy} onClick={() => run('MUTE')} variant="outline">
                Silenciar 7 días
              </Button>
            ) : null}
            {can('UNMUTE') ? (
              <Button disabled={busy} onClick={() => run('UNMUTE')} variant="outline">
                Quitar silencio
              </Button>
            ) : null}
            {can('PROPOSE_SUSPENSION') ? (
              <Button disabled={busy} onClick={() => run('PROPOSE_SUSPENSION')} variant="outline">
                Proponer suspensión
              </Button>
            ) : null}
            {can('SUSPEND') ? (
              <Button disabled={busy} onClick={() => run('SUSPEND')} variant="destructive">
                Suspender
              </Button>
            ) : null}
            {can('LIFT_SUSPENSION') ? (
              <Button disabled={busy} onClick={() => run('LIFT_SUSPENSION')} variant="outline">
                Levantar suspensión
              </Button>
            ) : null}
          </div>
          {can('PROPOSE_SUSPENSION') && !can('SUSPEND') ? (
            <p className="text-xs text-muted-foreground">La suspensión la confirma un admin.</p>
          ) : null}
        </form>
      ) : null}
    </article>
  );
}

function ProposalDecision({
  onChanged,
  proposal,
}: {
  onChanged: () => void;
  proposal: NonNullable<UserFile['pendingProposal']>;
}) {
  const reasonId = useId();
  const durationId = useId();
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<SuspensionDuration>(durationOf(proposal.durationDays));
  const [retire, setRetire] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const decide = async (confirm: boolean) => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Escribí la razón de la decisión.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (confirm) {
        await confirmProposal(proposal.id, {
          reason: trimmed,
          duration,
          retireContributions: retire,
        });
      } else {
        await rejectProposal(proposal.id, trimmed);
      }
      onChanged();
    } catch (caught) {
      setError(getApiError(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      aria-label="Propuesta de suspensión"
      className="grid gap-3 rounded-xl border-[1.5px] border-destructive p-4"
      role="group"
    >
      <p className="text-sm">
        <span className="font-bold">Propuesta de suspensión</span> ·{' '}
        {DURATIONS.find(({ id }) => id === durationOf(proposal.durationDays))?.label} ·{' '}
        {proposal.reason}
      </p>
      <label className="grid gap-1" htmlFor={durationId}>
        <span className="text-sm font-bold">Duración</span>
        <select
          className="min-h-11 rounded-lg border-[1.5px] border-input bg-card px-3 text-sm"
          id={durationId}
          onChange={(event) => setDuration(event.target.value as SuspensionDuration)}
          value={duration}
        >
          {DURATIONS.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1" htmlFor={reasonId}>
        <span className="text-sm font-bold">Razón de la decisión</span>
        <textarea
          className="min-h-20 rounded-lg border-[1.5px] border-input bg-background p-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
          id={reasonId}
          maxLength={REASON_MAX}
          onChange={(event) => setReason(event.target.value)}
          value={reason}
        />
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          checked={retire}
          className="size-4"
          onChange={(event) => setRetire(event.target.checked)}
          type="checkbox"
        />
        Retirar también sus aportes publicados
      </label>
      {error ? (
        <p className="text-sm font-semibold text-destructive-ink" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => decide(false)} variant="outline">
          Rechazar
        </Button>
        <Button disabled={busy} onClick={() => decide(true)} variant="destructive">
          Confirmar suspensión
        </Button>
      </div>
    </div>
  );
}
