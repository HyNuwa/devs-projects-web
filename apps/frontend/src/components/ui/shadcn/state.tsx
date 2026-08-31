import { CircleAlert, Inbox, LoaderCircle } from 'lucide-react';

import { cn } from './utils';

type StatePanelProps = React.ComponentProps<'section'> & {
  action?: React.ReactNode;
  description?: React.ReactNode;
  icon: React.ReactNode;
  status: 'empty' | 'error' | 'loading';
  title: React.ReactNode;
};

function StatePanel({
  action,
  className,
  description,
  icon,
  status,
  title,
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
        <h2 className="font-serif text-xl font-bold text-card-foreground">{title}</h2>
        {description ? (
          <p className="font-sans text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </section>
  );
}

type PublicStateProps = Omit<StatePanelProps, 'children' | 'icon' | 'status' | 'title'>;

export function LoadingState({ className, ...props }: PublicStateProps) {
  return (
    <StatePanel
      aria-live="polite"
      className={className}
      icon={<LoaderCircle className="size-6 animate-spin text-primary" />}
      role="status"
      status="loading"
      title="Cargando"
      {...props}
    />
  );
}

export function EmptyState({ className, ...props }: PublicStateProps) {
  return (
    <StatePanel
      className={className}
      icon={<Inbox className="size-6 text-primary" />}
      status="empty"
      title="Todavía no hay resultados"
      {...props}
    />
  );
}

export function ErrorState({ className, ...props }: PublicStateProps) {
  return (
    <StatePanel
      aria-live="assertive"
      className={className}
      icon={<CircleAlert className="size-6 text-destructive" />}
      role="alert"
      status="error"
      title="No pudimos cargar esto"
      {...props}
    />
  );
}
