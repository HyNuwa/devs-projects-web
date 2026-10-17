import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './utils';

const chipVariants = cva(
  'inline-flex min-h-7 items-center gap-1.5 rounded-sm border px-2.5 font-sans text-xs font-extrabold',
  {
    variants: {
      tone: {
        neutral: 'border-transparent bg-muted text-foreground',
        accent: 'border-transparent bg-accent/30 text-accent-foreground',
        success: 'border-transparent bg-success/12 text-success-ink',
        destructive: 'border-transparent bg-destructive/10 text-destructive-ink',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  },
);

export type ChipProps = React.ComponentProps<'span'> & VariantProps<typeof chipVariants>;

export function Chip({ className, tone, ...props }: ChipProps) {
  return <span data-slot="chip" className={cn(chipVariants({ tone }), className)} {...props} />;
}

export { chipVariants };
