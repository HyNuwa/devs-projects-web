'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState } from '@/components/ui/shadcn';
import { cn } from '@/components/ui/shadcn/utils';
import { getApiError } from '@/lib/apiHelpers';
import { getModerationHistory, type HistoryItem } from '@/lib/moderation-client';
import { useAuthStore } from '@/stores/authStore';
import { useModerationFaculty } from './useModerationFaculty';

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
  ROLE_CHANGED: 'Cambio de rol',
  CATALOG_CREATED: 'Catálogo: alta',
  CATALOG_UPDATED: 'Catálogo: edición',
  CATALOG_DELETED: 'Catálogo: baja',
  CAREER_PUBLISHED: 'Carrera publicada',
  CAREER_UNPUBLISHED: 'Carrera a borrador',
  CATALOG_PLACEMENT_CHANGED: 'Materias de una carrera',
  CATALOG_BULK_APPLIED: 'Carga masiva',
  CAREER_REQUEST_RESOLVED: 'Solicitud de carrera',
  CATALOG_PLAN_READ: 'Lectura del plan',
};

const CATALOG_KIND: Record<string, string> = {
  UNIVERSITY: 'Universidad',
  FACULTY: 'Facultad',
  CAREER: 'Carrera',
  SUBJECT: 'Materia',
};

const PLAN_READ_ERROR: Record<string, string> = {
  PLAN_URL_FORBIDDEN: 'Link no permitido',
  PLAN_UNREACHABLE: 'No se pudo abrir el link',
  PLAN_TOO_LARGE: 'Archivo demasiado grande',
  PLAN_UNSUPPORTED_TYPE: 'No es página ni PDF',
  PLAN_NOT_FOUND: 'No encontró el plan',
  AI_NOT_CONFIGURED: 'IA sin configurar',
  AI_QUOTA: 'Cuota de IA agotada',
  AI_FAILED: 'La IA falló',
  UNEXPECTED: 'Error inesperado',
};

/** «Carrera LF · link → PDF · 42 materias, 2 avisos», or the error, for a lectura del plan. */
function planReadLabel(name: string, after: Record<string, unknown>) {
  const source = [after.url, after.linked].filter(Boolean).map(String).join(' → ');
  const result = after.error
    ? (PLAN_READ_ERROR[String(after.error)] ?? String(after.error))
    : `${Number(after.lines ?? 0)} materias, ${Number(after.notices ?? 0)} avisos`;
  return [name, source, result].filter(Boolean).join(' · ');
}

/** «Facultad Exactas · shortName: FCEx → FCE» for a catálogo event. */
function catalogLabel(catalog: NonNullable<HistoryItem['catalog']>, action: string) {
  const name = [catalog.kind ? CATALOG_KIND[catalog.kind] : null, catalog.label]
    .filter(Boolean)
    .join(' ');
  if (action === 'CATALOG_PLAN_READ') return planReadLabel(name, catalog.after ?? {});
  const before = catalog.before ?? {};
  const after = catalog.after ?? {};
  const changes = Object.keys(after)
    .filter((key) => key in before)
    .map((key) => `${key}: ${String(before[key] ?? '—')} → ${String(after[key] ?? '—')}`);
  return [name, ...changes].join(' · ');
}

const ROLE_LABEL: Record<string, string> = {
  USER: 'Estudiante',
  MODERATOR: 'Moderación',
  ADMIN: 'Admin',
  SUPERADMIN: 'Superadmin',
};

const roleName = (role: string) => ROLE_LABEL[role] ?? role;

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
  const facultyId = useModerationFaculty();

  useEffect(() => {
    if (!isModerator) return;
    let active = true;
    getModerationHistory({
      ...(action ? { action } : {}),
      ...(facultyId ? { facultyId } : {}),
    })
      .then((page) => {
        if (active) setState({ status: 'ready', ...page });
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', message: getApiError(error) });
      });
    return () => {
      active = false;
    };
  }, [action, facultyId, isModerator]);

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
        ...(facultyId ? { facultyId } : {}),
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
                      (item.target?.label ??
                      (item.catalog ? catalogLabel(item.catalog, item.action) : '—'))
                    )}
                    {item.targetUser?.username ? (
                      <span className="block text-xs text-muted-foreground">
                        @{item.targetUser.username}
                      </span>
                    ) : null}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {item.roleChange
                      ? `De ${roleName(item.roleChange.from)} a ${roleName(item.roleChange.to)}`
                      : (item.reason ?? '—')}
                  </td>
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
