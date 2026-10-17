'use client';

import { useState } from 'react';

import { restrictionMessage } from '@/lib/account-restriction';
import { useAuthStore } from '@/stores/authStore';

/**
 * Whether the signed-in account may write right now (publish, edit, resubmit,
 * report, «Me sirvió»), and the explanation to show when it cannot. The server
 * refuses those actions regardless; this only avoids useless forms.
 */
export function useAccountRestriction() {
  const restriction = useAuthStore((state) => state.user?.restriction ?? null);
  // Read the clock once per mount; a restriction that ends meanwhile clears on reload.
  const [now] = useState(() => Date.now());
  const active =
    restriction !== null &&
    (restriction.until === null || new Date(restriction.until).getTime() > now);
  return {
    blocked: active,
    restriction: active ? restriction : null,
    message: active ? restrictionMessage(restriction) : null,
  };
}
