'use client';

import { useEffect, useState } from 'react';

import { ErrorState, LoadingState } from '@/components/ui/shadcn';
import { getMySanctions, type OwnSanction } from '@/lib/account-restriction';
import { getApiError } from '@/lib/apiHelpers';

import { AppealForm, AppealOutcome } from './AppealForm';

type Row = OwnSanction & { lifted: boolean; voided: boolean; appealAnswer?: string | null };

const TYPE_LABEL = {
  WARNING: 'Advertencia',
  MUTE: 'Silenciamiento',
  SUSPENSION: 'Suspensión',
};

const dateFormat = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' });
const format = (value: string) => dateFormat.format(new Date(value));

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; sanctions: Row[] };

/** The account's own sanciones (openspec moderation/publication, Mis envíos). */
export function MySanctions() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    getMySanctions()
      .then((sanctions) => {
        if (active) setState({ status: 'ready', sanctions });
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', message: getApiError(error) });
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  return (
    <section aria-labelledby="sanciones-heading" className="grid gap-3 font-sans" id="sanciones">
      <h2 className="text-2xl font-extrabold tracking-[-0.03em]" id="sanciones-heading">
        Sanciones
      </h2>
      {state.status === 'loading' ? <LoadingState heading="Cargando tus sanciones" /> : null}
      {state.status === 'error' ? (
        <ErrorState description={state.message} heading="No pudimos cargar tus sanciones" />
      ) : null}
      {state.status === 'ready' && state.sanctions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tenés sanciones.</p>
      ) : null}
      {state.status === 'ready' && state.sanctions.length > 0 ? (
        <ul className="grid gap-3">
          {state.sanctions.map((sanction) => (
            <li
              className="grid gap-2 rounded-xl border-[1.5px] border-border bg-card p-4 text-sm"
              key={sanction.id}
            >
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold">{TYPE_LABEL[sanction.type]}</span>
                <span className="text-muted-foreground">
                  desde el {format(sanction.since)}
                  {sanction.until ? ` hasta el ${format(sanction.until)}` : ''}
                </span>
                {sanction.voided ? (
                  <span className="rounded-sm bg-success/12 px-2 py-0.5 text-xs font-bold text-success-ink">
                    Anulada por apelación
                  </span>
                ) : sanction.lifted ? (
                  <span className="rounded-sm bg-muted px-2 py-0.5 text-xs font-bold">
                    Levantada antes de tiempo
                  </span>
                ) : null}
              </p>
              <p>
                <span className="font-semibold">Razón: </span>
                {sanction.reason}
              </p>
              {sanction.appealStatus ? (
                <AppealOutcome
                  answer={sanction.appealAnswer ?? null}
                  status={sanction.appealStatus}
                />
              ) : sanction.appealable ? (
                <AppealForm
                  deadline={sanction.appealDeadline}
                  onDone={() => setReloadKey((key) => key + 1)}
                  target={{ kind: 'SANCTION', sanctionId: sanction.id }}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
