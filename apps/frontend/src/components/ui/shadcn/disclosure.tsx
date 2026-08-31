import { ChevronDown } from 'lucide-react';

import { cn } from './utils';

export type DisclosureProps = Omit<React.ComponentProps<'details'>, 'children'> & {
  title: React.ReactNode;
  children: React.ReactNode;
};

export function Disclosure({ children, className, title, ...props }: DisclosureProps) {
  return (
    <details
      data-slot="disclosure"
      className={cn(
        'group border border-border bg-card text-card-foreground shadow-surface',
        className,
      )}
      {...props}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-4 py-2 font-sans text-sm font-bold text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-inset">
        <span>{title}</span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-border px-4 py-3 font-sans text-sm text-muted-foreground">
        {children}
      </div>
    </details>
  );
}
