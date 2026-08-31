import { CircleAlert, Inbox, LoaderCircle } from 'lucide-react';

import { cn } from './utils';

type StatePanelProps = React.ComponentProps<'section'> & {
  action?: React.ReactNode;
  description?: React.ReactNode;
  title: React.ReactNode;
};

function StatePanel({
  action,
  children,
  className,
  description,
  title,
  ...props
}: StatePanelProps) {
  return (
    <section
      data-slot="state-panel"
      className={cn(
        'flex min-h-40 flex-col items-center justify-center gap-3 border border-border bg-card px-6 py-8 text-center shadow-surface',
        className,
      )}
      {...props}
    >
      {children}
      <div className="grid gap-1">
        <h2 className="font-serif text-xl font-bold text-card-foreground">{title}</h2>
        {description ? (
          <p className="font-sans text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </section>
  );
}

export function LoadingState({ className, ...props }: Omit<StatePanelProps, 'title'>) {
  return (
    <StatePanel aria-live="polite" className={className} role="status" title="Cargando" {...props}>
      <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-primary" />
    </StatePanel>
  );
}

export function EmptyState({ className, ...props }: Omit<StatePanelProps, 'title'>) {
  return (
    <StatePanel className={className} title="Todavía no hay resultados" {...props}>
      <Inbox aria-hidden="true" className="size-6 text-primary" />
    </StatePanel>
  );
}

export function ErrorState({ className, ...props }: Omit<StatePanelProps, 'title'>) {
  return (
    <StatePanel
      aria-live="assertive"
      className={className}
      role="alert"
      title="No pudimos cargar esto"
      {...props}
    >
      <CircleAlert aria-hidden="true" className="size-6 text-destructive" />
    </StatePanel>
  );
}
