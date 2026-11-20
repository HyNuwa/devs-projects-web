'use client';

import { useSearchParams } from 'next/navigation';

/**
 * The admin facultad filter of the moderation panel, kept in `?facultad=`
 * (openspec moderation/scope). Every panel sends it as `facultyId`.
 */
export function useModerationFaculty(): string | undefined {
  return useSearchParams().get('facultad') || undefined;
}
