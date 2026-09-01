import { cn } from '@/components/ui/shadcn/utils';

export function ChoiceLabel({
  checked,
  children,
  className,
}: {
  checked?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex min-h-10 items-center justify-center border px-3 py-2 text-center font-sans text-sm font-bold transition-colors',
        checked
          ? 'border-primary bg-primary text-primary-foreground shadow-control'
          : 'border-border bg-background text-foreground hover:bg-secondary',
        className,
      )}
    >
      {children}
    </span>
  );
}
