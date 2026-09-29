import { History, MessagesSquare, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/components/ui/shadcn/utils';

type Tab = 'casos' | 'historial';

/** Tabs and title shared by the moderation panel pages (canvas «Moderación»). */
export function ModerationHeader({
  active,
  caseCount,
  description,
}: {
  active: Tab;
  caseCount?: number;
  description: string;
}) {
  const tabs: Array<{ id: Tab; label: string; href: string; icon: typeof History }> = [
    { id: 'casos', label: 'Casos', href: '/admin', icon: MessagesSquare },
    { id: 'historial', label: 'Historial', href: '/admin/historial', icon: History },
  ];

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
            {id === 'casos' && caseCount !== undefined ? (
              <span
                className={cn(
                  'rounded-full px-2 text-xs',
                  active === id ? 'bg-card text-primary' : 'bg-secondary text-link',
                )}
              >
                {caseCount}
              </span>
            ) : null}
          </Link>
        ))}
        <span className="ml-auto hidden items-center gap-2 px-3 text-sm font-semibold sm:flex">
          <ShieldCheck aria-hidden="true" className="size-4" />
          Tu rol: moderación
        </span>
      </nav>
      <div>
        <h1 className="text-5xl font-extrabold tracking-[-0.05em] sm:text-6xl">
          Moderación<span className="text-primary">.</span>
        </h1>
        <p className="mt-3 max-w-[60ch] text-muted-foreground">{description}</p>
      </div>
    </header>
  );
}
