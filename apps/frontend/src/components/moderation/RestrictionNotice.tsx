'use client';

import { ShieldAlert } from 'lucide-react';

import { cn } from '@/components/ui/shadcn/utils';
import { useAccountRestriction } from '@/hooks/useAccountRestriction';

/**
 * The explanation shown where a silenced or suspended account cannot act, so nobody
 * fills in a form they cannot submit (openspec moderation/sanctions).
 */
export function RestrictionNotice({ className }: { className?: string }) {
  const { message } = useAccountRestriction();
  if (!message) return null;
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-lg border-[1.5px] border-destructive bg-destructive/10 p-3 font-sans text-sm font-semibold text-destructive-ink',
        className,
      )}
      role="alert"
    >
      <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}
