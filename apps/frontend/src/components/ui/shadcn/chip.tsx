import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './utils';

const chipVariants = cva(
  'inline-flex min-h-9 items-center border px-3 font-sans text-xs font-bold tracking-[0.04em]',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-muted text-muted-foreground',
        accent: 'border-primary bg-accent text-accent-foreground',
        success: 'border-success bg-success/10 text-success',
        destructive: 'border-destructive bg-destructive/10 text-destructive',
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
