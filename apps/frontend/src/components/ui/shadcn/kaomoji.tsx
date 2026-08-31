import { kaomojiAllowlist, type KaomojiId } from '@/lib/kaomoji';

import { cn } from './utils';

export type KaomojiProps = {
  className?: string;
  id: KaomojiId;
};

/**
 * Kaomojis are ambient notebook details. They stay out of the accessible name
 * so their Unicode characters never interrupt academic instructions or actions.
 */
export function Kaomoji({ className, id }: KaomojiProps) {
  return (
    <span aria-hidden="true" className={cn('inline-block', className)} data-slot="kaomoji">
      {kaomojiAllowlist[id].value}
    </span>
  );
}
