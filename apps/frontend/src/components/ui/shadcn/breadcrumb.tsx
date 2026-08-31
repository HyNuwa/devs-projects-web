import Link from 'next/link';
import { useId } from 'react';
import { ChevronRight } from 'lucide-react';

import { cn } from './utils';

export type BreadcrumbItem = {
  href?: string;
  label: string;
};

export type BreadcrumbLabelMap = Record<string, string>;

export type BreadcrumbProps = Omit<React.ComponentProps<'nav'>, 'children'> & {
  items: readonly BreadcrumbItem[];
};

function decodeSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function formatSegment(segment: string) {
  return decodeSegment(segment)
    .replace(/[-_]+/g, ' ')
    .replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase());
}

/**
 * Builds stable ancestor URLs from a pathname. A full-path label takes priority
 * over a segment label, so callers can provide data-backed labels for dynamic routes.
 */
export function deriveBreadcrumbItems(
  pathname: string,
  labels: BreadcrumbLabelMap = {},
): BreadcrumbItem[] {
  const normalizedPath = pathname.split(/[?#]/, 1)[0] || '/';
  const segments = normalizedPath.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [{ label: labels['/'] ?? 'Inicio' }];
  }

  return segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    const decodedSegment = decodeSegment(segment);

    return {
      href,
      label: labels[href] ?? labels[decodedSegment] ?? formatSegment(segment),
    };
  });
}

function BreadcrumbEntry({
  current,
  item,
  responsiveClassName,
  showSeparator,
}: {
  current: boolean;
  item: BreadcrumbItem;
  responsiveClassName?: string;
  showSeparator: boolean;
}) {
  return (
    <li className={cn('flex min-w-0 items-center gap-1', responsiveClassName)}>
      {showSeparator ? (
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      ) : null}
      {current ? (
        <span
          aria-current="page"
          className="max-w-[min(70vw,22rem)] truncate font-sans text-sm font-bold text-foreground"
        >
          {item.label}
        </span>
      ) : (
        <Link
          className="inline-flex min-h-11 max-w-[12rem] items-center truncate px-1 font-sans text-sm font-bold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          href={item.href ?? '#'}
        >
          {item.label}
        </Link>
      )}
    </li>
  );
}

export function Breadcrumb({
  'aria-describedby': ariaDescribedBy,
  'aria-label': ariaLabel = 'Ruta de navegación',
  className,
  items,
  ...props
}: BreadcrumbProps) {
  const overflowDescriptionId = useId();

  if (items.length === 0) {
    return null;
  }

  const firstItem = items[0];
  const lastIndex = items.length - 1;
  const hasIntermediateItems = items.length > 2;
  const intermediateItems = items.slice(1, -1);
  const describedBy = [ariaDescribedBy, hasIntermediateItems ? overflowDescriptionId : undefined]
    .filter(Boolean)
    .join(' ');

  return (
    <nav
      aria-describedby={describedBy || undefined}
      aria-label={ariaLabel}
      className={cn('min-w-0 border-b border-border bg-background', className)}
      data-slot="breadcrumb"
      {...props}
    >
      {hasIntermediateItems ? (
        <span className="sr-only lg:hidden" id={overflowDescriptionId}>
          Ruta abreviada. Niveles intermedios:{' '}
          {intermediateItems.map(({ label }) => label).join(', ')}.
        </span>
      ) : null}
      <ol className="flex min-w-0 items-center gap-1 px-1">
        <BreadcrumbEntry current={lastIndex === 0} item={firstItem} showSeparator={false} />
        {hasIntermediateItems ? (
          <li aria-hidden="true" className="flex items-center gap-1 lg:hidden">
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            <span className="font-sans text-sm font-bold text-muted-foreground">…</span>
          </li>
        ) : null}
        {intermediateItems.map((item) => (
          <BreadcrumbEntry
            current={false}
            item={item}
            key={item.href ?? item.label}
            responsiveClassName="hidden lg:flex"
            showSeparator
          />
        ))}
        {lastIndex > 0 ? <BreadcrumbEntry current item={items[lastIndex]} showSeparator /> : null}
      </ol>
    </nav>
  );
}
