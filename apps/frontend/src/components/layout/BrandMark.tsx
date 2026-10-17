import Link from 'next/link';

import { cn } from '@/components/ui/shadcn/utils';

/**
 * Open-notebook logo and wordmark from the canvas header: compact below lg, full
 * size with the blue sparkle from lg up.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      aria-label="DevsProject, inicio"
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:gap-2.5',
        className,
      )}
      href="/"
    >
      <svg
        aria-hidden="true"
        className="size-[26px] lg:size-[30px]"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
        viewBox="0 0 24 24"
      >
        <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4H9a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H3z" />
        <path d="M21 5.5A1.5 1.5 0 0 0 19.5 4H15a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5H21z" />
      </svg>
      <span className="text-[1.1875rem] font-extrabold tracking-[-0.035em] lg:text-[1.4375rem]">
        DevsProject
      </span>
      <span
        aria-hidden="true"
        className="hidden text-[0.8125rem] leading-none text-primary lg:inline"
      >
        ✦
      </span>
    </Link>
  );
}
