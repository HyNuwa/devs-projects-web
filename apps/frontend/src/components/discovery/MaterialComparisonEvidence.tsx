import Link from 'next/link';
import { Eye, Star, ThumbsUp } from 'lucide-react';

import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/components/ui/shadcn/utils';
import type { Material } from '@/types/material';

/** Honest placeholder for academic or community metadata the API did not provide. */
export const notInformedLabel = 'No informado';

export function academicContextValue(value: string | number | null | undefined): string | number {
  return value ?? notInformedLabel;
}

type StarSummary = Material['starSummary'];

/** Stars are compact comparison evidence, never a moderation or accuracy signal. */
export function ratingEvidence(starSummary: StarSummary | null | undefined) {
  if (!starSummary) {
    return {
      accessibleName: `Valoraciones: ${notInformedLabel}`,
      visibleText: notInformedLabel,
    };
  }

  const count = starSummary.count;
  const average = Number(starSummary.average);

  if (!count || !Number.isFinite(average)) {
    return { accessibleName: 'Sin valoraciones todavía', visibleText: 'Sin valoraciones' };
  }

  const formattedAverage = new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(average);

  return {
    accessibleName: `${formattedAverage} de 5 estrellas a partir de ${count} valoraciones`,
    visibleText: `${formattedAverage} ★ · ${count}`,
  };
}

/** Shared `Me sirvió` + star aggregate line used by every material comparison row. */
export function MaterialCommunityEvidence({
  className,
  helpfulCount,
  starSummary,
}: {
  className?: string;
  helpfulCount: number | null | undefined;
  starSummary: StarSummary | null | undefined;
}) {
  const rating = ratingEvidence(starSummary);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-secondary-foreground',
        className,
      )}
    >
      <span className="inline-flex items-center gap-2">
        <ThumbsUp aria-hidden="true" className="size-4 text-primary" strokeWidth={1.8} />
        {typeof helpfulCount === 'number'
          ? `${helpfulCount} dijeron “Me sirvió”`
          : `“Me sirvió”: ${notInformedLabel}`}
      </span>
      <span
        aria-label={rating.accessibleName}
        className="inline-flex items-center gap-1 font-mono font-bold text-primary"
      >
        <Star aria-hidden="true" className="size-4" strokeWidth={1.8} />
        {rating.visibleText}
      </span>
    </div>
  );
}

/** The single open-preview action of a comparison row; it keeps list context via `archivo`. */
export function MaterialPreviewAction({
  className,
  href,
  id,
  title,
}: {
  className?: string;
  href: string;
  id: string;
  title?: string;
}) {
  return (
    <Button asChild className={className} size="sm" variant="outline">
      <Link
        aria-label={title ? `Vista previa de ${title}` : undefined}
        href={href}
        id={id}
        scroll={false}
      >
        <Eye aria-hidden="true" className="size-4" strokeWidth={1.8} />
        Vista previa
      </Link>
    </Button>
  );
}
