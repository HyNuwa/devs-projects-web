import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './utils';

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-none border px-4 py-2 font-sans text-sm font-bold tracking-[0.02em] transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'border-primary bg-primary text-primary-foreground shadow-control hover:bg-primary/90',
        secondary:
          'border-secondary bg-secondary text-secondary-foreground shadow-control hover:bg-secondary/80',
        outline: 'border-border bg-background text-foreground shadow-control hover:bg-accent',
        ghost: 'border-transparent bg-transparent text-foreground hover:bg-muted',
        destructive:
          'border-destructive bg-destructive text-destructive-foreground shadow-control hover:bg-destructive/90',
      },
      size: {
        sm: 'min-h-9 px-3 text-xs',
        default: 'min-h-11 px-4 text-sm',
        lg: 'min-h-12 px-5 text-base',
        icon: 'min-h-11 min-w-11 px-2',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ asChild = false, className, size, type, variant, ...props }: ButtonProps) {
  const styles = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return <Slot data-slot="button" className={styles} {...props} />;
  }

  return <button data-slot="button" className={styles} type={type ?? 'button'} {...props} />;
}

export { buttonVariants };
