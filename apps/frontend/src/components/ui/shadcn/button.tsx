import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './utils';

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border-[1.5px] px-5 py-2 font-sans text-sm font-bold transition-[color,background-color,border-color,box-shadow,translate] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
        secondary:
          'border-secondary bg-secondary text-secondary-foreground hover:border-foreground/20',
        outline: 'border-line bg-card text-foreground hover:border-foreground',
        ghost: 'border-transparent bg-transparent text-foreground hover:bg-muted',
        destructive:
          'border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90',
        // The canvas' emphasized action (Subir): navy outline with a hard offset shadow
        // that collapses on press.
        pop: 'border-foreground bg-primary text-primary-foreground shadow-pop hover:bg-primary/90 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
      },
      size: {
        sm: 'min-h-11 px-4 text-[0.8125rem]',
        default: 'min-h-11 px-5 text-sm',
        lg: 'min-h-12 px-6 text-base',
        icon: 'min-h-11 min-w-11 rounded-lg px-2',
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
