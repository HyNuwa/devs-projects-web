'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState } from '@/components/ui/shadcn';
import { cn } from '@/components/ui/shadcn/utils';
import { getApiError } from '@/lib/apiHelpers';
import { getModerationHistory, type HistoryItem } from '@/lib/moderation-client';
import { useAuthStore } from '@/stores/authStore';

import { ModerationHeader } from './ModerationHeader';

const MODERATOR_ROLES = new Set(['MODERATOR', 'ADMIN', 'SUPERADMIN']);

const ACTION_LABEL: Record<string, string> = {
  PRIOR_REVIEW_OPENED: 'Revisión previa abierta',
  PRIOR_REVIEW_APPROVED: 'Revisión previa aprobada',
  PRIOR_REVIEW_REJECTED: 'Revisión previa rechazada',
  RESUBMITTED: 'Reenvío',
  REPORT_FILED: 'Reporte',
  AUTO_HIDDEN: 'Ocultamiento',
  AUTO_UNHIDDEN_OVERDUE: 'Vuelve a verse (7 días)',
  KEPT_VISIBLE: 'Mantener visible',
  REMOVED: 'Retiro',
  RESTORED: 'Restauración',
  AUTHOR_REVEALED: 'Ver autor',
  LEGACY_ACTION: 'Acción anterior',
};

const dateFormat = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function actorLabel(actor: HistoryItem['actor']) {
  if (actor.system) return 'Sistema';
  if (actor.hidden) return 'Autor oculto';
  return `@${actor.username ?? 'desconocido'}`;
}

type HistoryState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: HistoryItem[]; nextCursor: string | null };

/** The read-only moderation history (canvas «Historial»). */
export function HistoryPanel() {
  const user = useAuthStore((state) => state.user);
  const isModerator = Boolean(user && MODERATOR_ROLES.has(user.role));
  const [action, setAction] = useState('');
  const [state, setState] = useState<HistoryState>({ status: 'loading' });
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (!isModerator) return;
    let active = true;
    getModerationHistory(action ? { action } : {})
      .then((page) => {
        if (active) setState({ status: 'ready', ...page });
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', message: getApiError(error) });
      });
    return () => {
      active = false;
    };
  }, [action, isModerator]);

  if (!isModerator) {
    return (
      <EmptyState
        description="Si creés que deberías tener acceso, hablá con un admin."
        heading="Esta sección es solo para moderación."
      />
    );
  }

  const loadMore = async () => {
    if (state.status !== 'ready' || !state.nextCursor) return;
    setIsLoadingMore(true);
    try {
      const page = await getModerationHistory({
        ...(action ? { action } : {}),
        cursor: state.nextCursor,
      });
      setState({
        status: 'ready',
        items: [...state.items, ...page.items],
        nextCursor: page.nextCursor,
      });
    } catch (error) {
      setState({ status: 'error', message: getApiError(error) });
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="grid gap-6 font-sans">
      <ModerationHeader
        active="historial"
        description="Todo lo que hizo moderación y el sistema: quién, qué, sobre qué, cuándo y por qué. Es de solo lectura."
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <label className="text-sm font-semibold" htmlFor="history-action">
            Acción
          </label>
          <select
            className="min-h-11 rounded-md border-[1.5px] border-input bg-card px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
            id="history-action"
            onChange={(event) => {
              setState({ status: 'loading' });
              setAction(event.target.value);
            }}
            value={action}
          >
            <option value="">Todas</option>
            {Object.entries(ACTION_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.status === 'loading' ? <LoadingState heading="Cargando historial" /> : null}
      {state.status === 'error' ? (
        <ErrorState description={state.message} heading="No pudimos cargar el historial" />
      ) : null}
      {state.status === 'ready' ? (
        <div className="overflow-x-auto rounded-2xl border-[1.5px] border-border bg-card">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <caption className="sr-only">Historial de moderación</caption>
            <thead className="border-b-[1.5px] border-line text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="p-3" scope="col">
                  Fecha
                </th>
                <th className="p-3" scope="col">
                  Quién
                </th>
                <th className="p-3" scope="col">
                  Acción
                </th>
                <th className="p-3" scope="col">
                  Sobre qué
                </th>
                <th className="p-3" scope="col">
                  Razón
                </th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((item) => (
                <tr
                  className={cn(
                    'border-b border-line last:border-b-0',
                    item.action === 'AUTHOR_REVEALED' && 'bg-secondary',
                  )}
                  key={item.id}
                >
                  <td className="whitespace-nowrap p-3">
                    {dateFormat.format(new Date(item.createdAt))}
                  </td>
                  <td className="p-3 font-semibold">{actorLabel(item.actor)}</td>
                  <td className="p-3">{ACTION_LABEL[item.action] ?? item.action}</td>
                  <td className="p-3">
                    {item.target?.label && item.caseId ? (
                      <Link
                        className="font-semibold text-link underline-offset-4 hover:underline"
                        href={`/admin?caso=${encodeURIComponent(item.caseId)}`}
                      >
                        {item.target.label}
                      </Link>
                    ) : (
                      (item.target?.label ?? '—')
                    )}
                    {item.targetUser?.username ? (
                      <span className="block text-xs text-muted-foreground">
                        @{item.targetUser.username}
                      </span>
                    ) : null}
                  </td>
                  <td className="p-3 text-muted-foreground">{item.reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {state.items.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No hay registros con ese filtro.</p>
          ) : null}
        </div>
      ) : null}
      {state.status === 'ready' && state.nextCursor ? (
        <div>
          <Button disabled={isLoadingMore} onClick={loadMore} variant="outline">
            Cargar más
          </Button>
        </div>
      ) : null}
    </div>
  );
}
