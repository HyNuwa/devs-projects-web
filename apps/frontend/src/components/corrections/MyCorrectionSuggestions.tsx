'use client';

import { useEffect, useState } from 'react';

import { getApiError } from '@/lib/apiHelpers';
import {
  decideMyCorrection,
  getMyCorrectionSuggestions,
  noLongerApplies,
  type CorrectionSuggestion,
} from '@/lib/trust-client';

import { CorrectionRow } from './CorrectionRow';

/**
 * «Sugerencias para tus materiales» (openspec academic-resources/corrections):
 * the author decides first, for 7 days, without knowing who suggested it.
 */
export function MyCorrectionSuggestions() {
  const [suggestions, setSuggestions] = useState<CorrectionSuggestion[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMyCorrectionSuggestions()
      .then((rows) => {
        if (active) setSuggestions(rows);
      })
      .catch(() => {
        if (active) setSuggestions([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // Stays mounted while it explains why the last row went away.
  if (!suggestions || (suggestions.length === 0 && !error)) return null;

  async function decide(id: string, accept: boolean) {
    setBusy(id);
    setError(null);
    try {
      await decideMyCorrection(id, accept);
      setSuggestions((rows) => rows?.filter((row) => row.id !== id) ?? rows);
    } catch (caught) {
      setError(getApiError(caught));
      if (noLongerApplies(caught)) {
        setSuggestions((rows) => rows?.filter((row) => row.id !== id) ?? rows);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      aria-labelledby="sugerencias-heading"
      className="grid gap-3 font-sans"
      id="sugerencias"
    >
      <div className="grid gap-1">
        <h3 className="text-xl font-extrabold tracking-[-0.03em]" id="sugerencias-heading">
          Sugerencias para tus materiales
        </h3>
        <p className="text-sm text-muted-foreground">
          Alguien de la comunidad propone corregir cómo está clasificado un material tuyo. Tenés 7
          días para decidir; después decide moderación.
        </p>
      </div>
      {error ? (
        <p className="text-sm font-semibold text-destructive-ink" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="grid gap-3">
        {suggestions.map((suggestion) => (
          <CorrectionRow
            busy={busy === suggestion.id}
            key={suggestion.id}
            onDecide={(accept) => decide(suggestion.id, accept)}
            suggestion={suggestion}
          />
        ))}
      </ul>
    </section>
  );
}
