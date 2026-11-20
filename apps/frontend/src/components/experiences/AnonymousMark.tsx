import { VenetianMask } from 'lucide-react';

import { cn } from '@/components/ui/shadcn/utils';

/**
 * The marca de anónimo (openspec academic-community/discovery): a neutral
 * circle in the avatar slot, with the mask icon. It is decorative — the
 * accessible identity is the «Anónimo» text rendered next to it.
 */
export function AnonymousMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-foreground bg-muted',
        className,
      )}
    >
      <VenetianMask className="size-5 text-muted-foreground" strokeWidth={1.8} />
    </span>
  );
}
