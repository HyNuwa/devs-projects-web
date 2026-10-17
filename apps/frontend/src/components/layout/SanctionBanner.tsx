'use client';

import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

import { useAccountRestriction } from '@/hooks/useAccountRestriction';
import { markWarningSeen } from '@/lib/account-restriction';
import { useAuthStore } from '@/stores/authStore';

/**
 * Tells the account about its sanción on every page (openspec moderation/sanctions,
 * «The account knows its sanction»): an active silenciamiento or suspensión, or an
 * advertencia shown once. Never who applied it.
 */
export function SanctionBanner() {
  const { message, restriction } = useAccountRestriction();
  const warning = useAuthStore((state) => state.user?.unseenWarning ?? null);

  if (restriction) {
    return (
      <div
        className="border-b-[1.5px] border-destructive bg-destructive/10 font-sans"
        role="status"
      >
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm lg:px-10 xl:px-16">
          <ShieldAlert aria-hidden="true" className="size-4 text-destructive-ink" />
          <span className="font-bold text-destructive-ink">{message}</span>
          <span className="text-foreground">Razón: {restriction.reason}</span>
          {restriction.appealStatus === 'PENDING' ? (
            <span className="text-muted-foreground">Tu apelación está en revisión.</span>
          ) : restriction.appealable ? (
            <Link
              className="font-bold text-link underline underline-offset-4"
              href="/profile/me#sanciones"
            >
              Apelar
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  if (warning) {
    const dismiss = async () => {
      await markWarningSeen(warning.id).catch(() => undefined);
      useAuthStore.setState((state) =>
        state.user ? { user: { ...state.user, unseenWarning: null } } : state,
      );
    };
    return (
      <div className="border-b-[1.5px] border-accent bg-accent/20 font-sans" role="status">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm lg:px-10 xl:px-16">
          <ShieldAlert aria-hidden="true" className="size-4" />
          <span className="font-bold">Recibiste una advertencia de moderación.</span>
          <span>Razón: {warning.reason}</span>
          <Link
            className="font-bold text-link underline underline-offset-4"
            href="/profile/me#sanciones"
          >
            Ver en Mis envíos
          </Link>
          <button
            className="ml-auto min-h-11 rounded-lg border-[1.5px] border-foreground px-4 font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
            onClick={dismiss}
            type="button"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  return null;
}
