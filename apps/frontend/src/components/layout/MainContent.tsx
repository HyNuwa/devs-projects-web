import { cn } from '@/components/ui/shadcn/utils';

/** The page's only <main> landmark and the skip link's target. */
export function MainContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn('flex-1 outline-none', className)} id="main-content" tabIndex={-1}>
      {children}
    </main>
  );
}
