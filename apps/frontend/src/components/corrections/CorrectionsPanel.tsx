'use client';

import { useEffect, useState } from 'react';

import { ModerationHeader } from '@/components/moderation/ModerationHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/shadcn';
import { getApiError } from '@/lib/apiHelpers';
import {
  decideModerationCorrection,
  getModerationCorrections,
  noLongerApplies,
  type CorrectionSuggestion,
} from '@/lib/trust-client';
import { useAuthStore } from '@/stores/authStore';
import { useModerationFaculty } from '@/components/moderation/useModerationFaculty';

import { CorrectionRow } from './CorrectionRow';

const MODERATOR_ROLES = new Set(['MODERATOR', 'ADMIN', 'SUPERADMIN']);

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; suggestions: CorrectionSuggestion[] };

/**
 * The Correcciones tab (openspec academic-resources/corrections): suggestions
 * their authors did not decide within 7 days, oldest first.
 */
export function CorrectionsPanel() {
  const user = useAuthStore((state) => state.user);
  const isModerator = Boolean(user && MODERATOR_ROLES.has(user.role));
  const [state, setState] = useState<State>({ status: 'loading' });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const facultyId = useModerationFaculty();

  useEffect(() => {
    if (!isModerator) return;
    let active = true;
    getModerationCorrections(facultyId)
      .then((suggestions) => {
        if (active) setState({ status: 'ready', suggestions });
      })
      .catch((caught: unknown) => {
        if (active) setState({ status: 'error', message: getApiError(caught) });
      });
    return () => {
      active = false;
    };
  }, [facultyId, isModerator]);

  if (!isModerator) {
    return (
      <EmptyState
        description="Si creés que deberías tener acceso, hablá con un admin."
        heading="Esta sección es solo para moderación."
      />
    );
  }

  async function decide(id: string, accept: boolean) {
    setBusy(id);
    setError(null);
    try {
      await decideModerationCorrection(id, accept);
      setState((current) =>
        current.status === 'ready'
          ? { ...current, suggestions: current.suggestions.filter((row) => row.id !== id) }
          : current,
      );
    } catch (caught) {
      setError(getApiError(caught));
      if (noLongerApplies(caught)) {
        setState((current) =>
          current.status === 'ready'
            ? { ...current, suggestions: current.suggestions.filter((row) => row.id !== id) }
            : current,
        );
      }
    } finally {
      setBusy(null);
    }
  }

  const count = state.status === 'ready' ? state.suggestions.length : undefined;

  return (
    <div className="grid gap-6 font-sans">
      <ModerationHeader
        active="correcciones"
        correctionCount={count}
        description="Sugerencias que sus autores no decidieron en 7 días. Aceptar cambia el material como si lo editara su autor."
      />
      {error ? (
        <p className="text-sm font-semibold text-destructive-ink" role="alert">
          {error}
        </p>
      ) : null}
      {state.status === 'loading' ? <LoadingState heading="Cargando correcciones" /> : null}
      {state.status === 'error' ? (
        <ErrorState description={state.message} heading="No pudimos cargar las correcciones" />
      ) : null}
      {state.status === 'ready' && state.suggestions.length === 0 ? (
        <EmptyState heading="No hay correcciones para decidir." />
      ) : null}
      {state.status === 'ready' && state.suggestions.length > 0 ? (
        <ul className="grid gap-3">
          {state.suggestions.map((suggestion) => (
            <CorrectionRow
              busy={busy === suggestion.id}
              key={suggestion.id}
              onDecide={(accept) => decide(suggestion.id, accept)}
              suggestion={suggestion}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
