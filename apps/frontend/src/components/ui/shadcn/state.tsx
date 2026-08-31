import { CircleAlert, Inbox, LoaderCircle } from 'lucide-react';

import { cn } from './utils';

type StatePanelProps = React.ComponentProps<'section'> & {
  action?: React.ReactNode;
  description?: React.ReactNode;
  heading: React.ReactNode;
  icon: React.ReactNode;
  status: 'empty' | 'error' | 'loading';
};

function StatePanel({
  action,
  className,
  description,
  heading,
  icon,
  status,
  ...props
}: StatePanelProps) {
  return (
    <section
      data-status={status}
      data-slot="state-panel"
      className={cn(
        'flex min-h-40 flex-col items-center justify-center gap-3 border border-border bg-card px-6 py-8 text-center shadow-surface',
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" data-status-icon>
        {icon}
      </span>
      <div className="grid gap-1">
        <h2 className="font-serif text-xl font-bold text-card-foreground">{heading}</h2>
        {description ? (
          <p className="font-sans text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </section>
  );
}

type PublicStateProps = Omit<StatePanelProps, 'children' | 'heading' | 'icon' | 'status'> & {
  heading?: React.ReactNode;
};

export function LoadingState({ className, heading = 'Cargando', ...props }: PublicStateProps) {
  return (
    <StatePanel
      aria-live="polite"
      className={className}
      icon={<LoaderCircle className="size-6 animate-spin text-primary" />}
      role="status"
      status="loading"
      heading={heading}
      {...props}
    />
  );
}

export function EmptyState({
  className,
  heading = 'Todavía no hay resultados',
  ...props
}: PublicStateProps) {
  return (
    <StatePanel
      className={className}
      icon={<Inbox className="size-6 text-primary" />}
      status="empty"
      heading={heading}
      {...props}
    />
  );
}

export function ErrorState({
  className,
  heading = 'No pudimos cargar esto',
  ...props
}: PublicStateProps) {
  return (
    <StatePanel
      aria-live="assertive"
      className={className}
      icon={<CircleAlert className="size-6 text-destructive" />}
      role="alert"
      status="error"
      heading={heading}
      {...props}
    />
  );
}
