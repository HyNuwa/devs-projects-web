import Link from 'next/link';

import { cn } from '@/components/ui/shadcn/utils';

/** The discovery API sends anonymous entries with this placeholder username. */
const ANONYMOUS = 'Anónimo';

type Author = { username?: string | null; displayName?: string | null } | null | undefined;

/**
 * The author of a contribution (openspec reputation/public-profile): a named
 * author links to their perfil público; «Anónimo» is never a link.
 */
export function AuthorLink({ author, className }: { author: Author; className?: string }) {
  const username = author?.username;
  if (!username || username === ANONYMOUS) {
    return <span className={className}>{ANONYMOUS}</span>;
  }
  return (
    <Link
      className={cn('font-semibold underline-offset-4 hover:underline', className)}
      href={`/usuarios/${encodeURIComponent(username)}`}
    >
      {author.displayName || username}
    </Link>
  );
}
