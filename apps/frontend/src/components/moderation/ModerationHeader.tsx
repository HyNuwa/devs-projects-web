'use client';

import { AlarmClock, History, MessagesSquare, Scale, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { cn } from '@/components/ui/shadcn/utils';
import { getModerationSummary, type ModerationSummary } from '@/lib/moderation-client';
import { useAuthStore } from '@/stores/authStore';

type Tab = 'casos' | 'usuarios' | 'apelaciones' | 'historial';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPERADMIN']);

/** Tabs and title shared by the moderation panel pages (canvas «Moderación»). */
export function ModerationHeader({
  active,
  caseCount,
  description,
}: {
  active: Tab;
  /** The Casos panel passes its live count; other pages use the summary. */
  caseCount?: number;
  description: string;
}) {
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = Boolean(role && ADMIN_ROLES.has(role));
  const [summary, setSummary] = useState<ModerationSummary | null>(null);

  useEffect(() => {
    let active = true;
    getModerationSummary()
      .then((data) => {
        if (active) setSummary(data);
      })
      // Counts are a convenience: the panel works without them.
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const counts: Record<Tab, number | undefined> = {
    casos: caseCount ?? summary?.openCases,
    usuarios: isAdmin ? (summary?.pendingProposals ?? undefined) : undefined,
    apelaciones: summary?.pendingAppeals,
    historial: undefined,
  };
  const tabs: Array<{ id: Tab; label: string; href: string; icon: typeof History }> = [
    { id: 'casos', label: 'Casos', href: '/admin', icon: MessagesSquare },
    { id: 'usuarios', label: 'Usuarios', href: '/admin/usuarios', icon: Users },
    { id: 'apelaciones', label: 'Apelaciones', href: '/admin/apelaciones', icon: Scale },
    { id: 'historial', label: 'Historial', href: '/admin/historial', icon: History },
  ];
  const overdue = isAdmin ? (summary?.overdueCases ?? 0) : 0;

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
          Tu rol: {isAdmin ? 'admin' : 'moderación'}
        </span>
      </nav>
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
