import Link from 'next/link';
import type { ReactNode } from 'react';

import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/shadcn';

/** Page frame shared by the four browsing steps (openspec academic-structure/browsing). */
export function BrowseShell({
  eyebrow,
  title,
  description,
  trail,
  aside,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  trail: BreadcrumbItem[];
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto grid w-full max-w-5xl grid-cols-[minmax(0,1fr)] gap-6 px-4 py-10 font-sans sm:py-14">
      {trail.length > 1 ? <Breadcrumb aria-label="Ruta" items={trail} /> : null}
      <header className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-link">{eyebrow}</p>
          <h1 className="mt-1 break-words text-4xl font-extrabold leading-none tracking-[-0.05em] sm:text-5xl">
            {title}
            <span className="text-primary">.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base font-semibold text-muted-foreground">
            {description}
          </p>
        </div>
        {aside}
      </header>
      {children}
    </article>
  );
}

/** A count label in Spanish: «1 carrera», «6 carreras». */
export function count(value: number, one: string, many: string) {
  return `${value.toLocaleString('es-AR')} ${value === 1 ? one : many}`;
}

/** One card of a browsing list, linking to the next step when it has content. */
export function BrowseCard({
  title,
  subtitle,
  facts,
  href,
  action,
  empty,
}: {
  title: string;
  subtitle?: string;
  facts: string[];
  href: string;
  action: string;
  empty?: string;
}) {
  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-2xl border-[1.5px] border-foreground bg-card p-5 shadow-pop">
      <div className="min-w-0">
        <h2 className="break-words text-xl font-extrabold tracking-[-0.03em]">{title}</h2>
        {subtitle ? (
          <p className="text-sm font-semibold text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {empty ? (
        <p className="text-sm font-semibold text-muted-foreground">{empty}</p>
      ) : (
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-bold">
          {facts.map((fact) => (
            <span key={fact}>{fact}</span>
          ))}
        </p>
      )}
      <Link
        className="mt-auto inline-flex min-h-11 w-fit items-center rounded-full border-[1.5px] border-foreground px-4 text-sm font-extrabold hover:bg-secondary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        href={href}
      >
        {action} <span aria-hidden="true">&nbsp;→</span>
      </Link>
    </li>
  );
}
