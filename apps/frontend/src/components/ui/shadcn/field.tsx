import { cn } from './utils';

export function Field({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="field" className={cn('grid gap-2', className)} {...props} />;
}

export function FieldLabel({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      data-slot="field-label"
      className={cn('font-sans text-sm font-bold text-foreground', className)}
      {...props}
    />
  );
}

export function FieldDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="field-description"
      className={cn('font-sans text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function FieldError({ className, children, ...props }: React.ComponentProps<'p'>) {
  if (!children) {
    return null;
  }

  return (
    <p
      data-slot="field-error"
      role="alert"
      className={cn('font-sans text-sm font-bold text-destructive', className)}
      {...props}
    >
      {children}
    </p>
  );
}
