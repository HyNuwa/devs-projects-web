'use client';

import {
  AlarmClock,
  Building2,
  History,
  MessagesSquare,
  PencilLine,
  Scale,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { cn } from '@/components/ui/shadcn/utils';
import { catalogAdmin } from '@/lib/catalog-admin-client';
import { getModerationSummary, type ModerationSummary } from '@/lib/moderation-client';
import { getInstitutions, type InstitutionTree } from '@/lib/study-plans-client';
import { useAuthStore } from '@/stores/authStore';

import { useModerationFaculty } from './useModerationFaculty';

type Tab = 'casos' | 'correcciones' | 'usuarios' | 'apelaciones' | 'historial' | 'catalogo';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPERADMIN']);

/** Tabs and title shared by the moderation panel pages (canvas «Moderación»). */
export function ModerationHeader({
  active,
  caseCount,
  correctionCount,
  description,
  requestCount,
}: {
  active: Tab;
  /** The Casos panel passes its live count; other pages use the summary. */
  caseCount?: number;
  /** Same for the Correcciones panel. */
  correctionCount?: number;
  description: string;
  /** The Catálogo panel passes its live count of pending solicitudes. */
  requestCount?: number;
}) {
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = Boolean(role && ADMIN_ROLES.has(role));
  const [summary, setSummary] = useState<ModerationSummary | null>(null);
  const facultyId = useModerationFaculty();
  const [pendingRequests, setPendingRequests] = useState<number | undefined>(undefined);

  useEffect(() => {
    let active = true;
    getModerationSummary(facultyId)
      .then((data) => {
        if (active) setSummary(data);
      })
      // Counts are a convenience: the panel works without them.
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [facultyId]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    catalogAdmin
      .requestCount()
      .then((count) => {
        if (active) setPendingRequests(count);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const counts: Record<Tab, number | undefined> = {
    casos: caseCount ?? summary?.openCases,
    correcciones: correctionCount ?? summary?.pendingCorrections,
    usuarios: isAdmin ? (summary?.pendingProposals ?? undefined) : undefined,
    apelaciones: summary?.pendingAppeals,
    historial: undefined,
    catalogo: isAdmin ? (requestCount ?? pendingRequests) : undefined,
  };
  const tabs: Array<{ id: Tab; label: string; href: string; icon: typeof History }> = [
    { id: 'casos', label: 'Casos', href: '/admin', icon: MessagesSquare },
    { id: 'correcciones', label: 'Correcciones', href: '/admin/correcciones', icon: PencilLine },
    { id: 'usuarios', label: 'Usuarios', href: '/admin/usuarios', icon: Users },
    { id: 'apelaciones', label: 'Apelaciones', href: '/admin/apelaciones', icon: Scale },
    { id: 'historial', label: 'Historial', href: '/admin/historial', icon: History },
    // The catálogo is for admins only (openspec academic-structure/catalog-editing).
    ...(isAdmin
      ? [{ id: 'catalogo' as const, label: 'Catálogo', href: '/admin/catalogo', icon: Building2 }]
      : []),
  ];
  const overdue = isAdmin ? (summary?.overdueCases ?? 0) : 0;
  const scope = summary?.scope;
  const covered = scope && !scope.all ? scope.faculties : [];
  const roleLabel = isAdmin
    ? 'Tu rol: admin'
    : covered.length > 0
      ? `Tu rol: moderación · ${covered
          .map((faculty) => `${faculty.shortName} ${faculty.university.shortName}`)
          .join(', ')}`
      : 'Tu rol: moderación';

  return (
    <header className="grid gap-6 font-sans">
      <nav
        aria-label="Moderación"
        className="flex flex-wrap items-center gap-2 rounded-2xl border-[1.5px] border-border bg-card px-3 py-2"
      >
        <span className="px-3 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Moderación
        </span>
        {tabs.map(({ href, icon: Icon, id, label }) => (
          <Link
            aria-current={active === id ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
              active === id
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-muted',
            )}
            href={href}
            key={id}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
            {counts[id] ? ' ' : null}
            {counts[id] ? (
              <span
                className={cn(
                  'rounded-full px-2 text-xs',
                  active === id ? 'bg-card text-primary' : 'bg-secondary text-link',
                )}
              >
                {counts[id]}
              </span>
            ) : null}
          </Link>
        ))}
        <span className="ml-auto hidden items-center gap-2 px-3 text-sm font-semibold sm:flex">
          <ShieldCheck aria-hidden="true" className="size-4" />
          {roleLabel}
        </span>
      </nav>
      {scope && !scope.all && scope.faculties.length === 0 ? (
        <p
          className="rounded-xl border-[1.5px] border-border bg-card px-4 py-3 text-sm font-semibold"
          role="status"
        >
          Todavía no tenés facultades asignadas: cuando un admin te asigne una, vas a ver sus casos
          acá.
        </p>
      ) : null}
      {isAdmin ? <FacultyFilter value={facultyId} /> : null}
      {overdue > 0 ? (
        <div
          className="flex flex-wrap items-center gap-3 rounded-xl border-[1.5px] border-destructive bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive-ink"
          role="status"
        >
          <AlarmClock aria-hidden="true" className="size-4" />
          {overdue === 1 ? '1 caso vencido' : `${overdue} casos vencidos`}: pasaron su plazo de
          respuesta.
          <Link className="underline underline-offset-4" href="/admin">
            Ver vencidos
          </Link>
        </div>
      ) : null}
      <div>
        <h1 className="text-5xl font-extrabold tracking-[-0.05em] sm:text-6xl">
          Moderación<span className="text-primary">.</span>
        </h1>
        <p className="mt-3 max-w-[60ch] text-muted-foreground">{description}</p>
      </div>
    </header>
  );
}

/** The admins' facultad filter (openspec moderation/scope, «Panel label and admin filter»). */
function FacultyFilter({ value }: { value?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tree, setTree] = useState<InstitutionTree>([]);

  useEffect(() => {
    let active = true;
    getInstitutions()
      .then((institutions) => {
        if (active) setTree(institutions);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const choose = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set('facultad', next);
    else params.delete('facultad');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <label className="flex flex-wrap items-center gap-2 text-sm font-bold">
      Facultad
      <select
        className="min-h-11 rounded-xl border-[1.5px] border-foreground bg-background px-3 text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        onChange={(event) => choose(event.target.value)}
        value={value ?? ''}
      >
        <option value="">Todas</option>
        {tree.flatMap((university) =>
          university.faculties.map((faculty) => (
            <option key={faculty.id} value={faculty.id}>
              {faculty.shortName} · {university.shortName}
            </option>
          )),
        )}
      </select>
    </label>
  );
}
