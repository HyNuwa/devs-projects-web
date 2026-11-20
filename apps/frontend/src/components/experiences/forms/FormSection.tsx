import { useId } from 'react';

import { cn } from '@/components/ui/shadcn/utils';

export type Requirement = 'required' | 'optional';

/** «Obligatorio» / «Opcional», as the canvas tags every field and optional section. */
export function RequirementTag({ requirement }: { requirement: Requirement }) {
  return requirement === 'required' ? (
    <span className="font-sans text-[0.6875rem] font-extrabold uppercase tracking-[0.04em] text-destructive-ink">
      Obligatorio
    </span>
  ) : (
    <span className="font-sans text-[0.6875rem] font-bold text-muted-foreground">Opcional</span>
  );
}

/**
 * One numbered section of an experiencia form (openspec
 * academic-community/experiences «Experiencia forms»): the number badge, the
 * title the region is named after, and an optional tag and subtitle.
 */
export function FormSection({
  children,
  className,
  number,
  requirement,
  subtitle,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  number: number;
  requirement?: Requirement;
  subtitle?: string;
  title: string;
}) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        'min-w-0 rounded-xl border-[1.5px] border-foreground bg-card px-4 py-5 sm:px-6',
        className,
      )}
    >
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2
          className="flex items-center gap-3 font-sans text-[1.1875rem] font-extrabold tracking-[-0.03em] text-card-foreground"
          id={headingId}
        >
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground font-sans text-[0.8125rem] font-extrabold text-background"
          >
            {number}
          </span>
          {title}
        </h2>
        {requirement ? <RequirementTag requirement={requirement} /> : null}
        {subtitle ? (
          <span className="font-sans text-[0.8125rem] font-semibold text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/**
 * A labelled field with its «Obligatorio»/«Opcional» tag, help and error.
 * `group` renders a fieldset named by the label (radio rows, steppers); otherwise
 * a label for `htmlFor`. Help and error ids are `<id>-help` and `<id>-error`;
 * a single control describes itself with them, a group is described here.
 */
export function FormField({
  children,
  className,
  error,
  group = false,
  help,
  htmlFor,
  id,
  label,
  requirement,
}: {
  children: React.ReactNode;
  className?: string;
  error?: string;
  group?: boolean;
  help?: React.ReactNode;
  htmlFor?: string;
  id: string;
  label: string;
  requirement?: Requirement;
}) {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const labelId = `${id}-label`;
  const labelClass = 'font-sans text-sm font-extrabold text-card-foreground';
  const heading = (
    <div className="mb-2 flex items-center justify-between gap-3">
      {group ? (
        <span className={labelClass} id={labelId}>
          {label}
        </span>
      ) : (
        <label className={labelClass} htmlFor={htmlFor} id={labelId}>
          {label}
        </label>
      )}
      {requirement ? <RequirementTag requirement={requirement} /> : null}
    </div>
  );
  const footer = (
    <>
      {help ? (
        <p className="mt-2 font-sans text-xs font-semibold text-muted-foreground" id={helpId}>
          {help}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 font-sans text-sm font-bold text-destructive-ink" id={errorId}>
          {error}
        </p>
      ) : null}
    </>
  );

  if (group) {
    return (
      <fieldset
        aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
        aria-labelledby={labelId}
        className={cn('min-w-0', className)}
      >
        {heading}
        {children}
        {footer}
      </fieldset>
    );
  }

  return (
    <div className={cn('min-w-0', className)}>
      {heading}
      {children}
      {footer}
    </div>
  );
}
