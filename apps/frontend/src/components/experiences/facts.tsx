import { Star } from 'lucide-react';

import { cn } from '@/components/ui/shadcn/utils';

export type FactEntries = Array<[label: string, value: string | null | undefined]>;

export function formatCommunityDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(date);
}

export function CommunityFactList({
  className,
  facts,
}: {
  className?: string;
  facts: FactEntries;
}) {
  const knownFacts = facts.filter(([, value]) => value);

  if (knownFacts.length === 0) {
    return null;
  }

  return (
    <dl className={cn('mt-5 flex flex-wrap gap-2', className)}>
      {knownFacts.map(([label, value]) => (
        <div className="border border-border bg-secondary px-2.5 py-1.5" key={label}>
          <dt className="sr-only">{label}</dt>
          <dd className="font-mono text-[0.68rem] font-bold leading-tight text-secondary-foreground">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function StarRecommendation({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <span
      aria-label={`Recomendación: ${safeValue} de 5 estrellas`}
      className="flex gap-0.5 text-primary"
      role="img"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          aria-hidden="true"
          className={cn('size-4', index < safeValue && 'fill-current')}
          key={index}
          strokeWidth={1.7}
        />
      ))}
    </span>
  );
}
