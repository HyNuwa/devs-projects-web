'use client';

import { useId, useState } from 'react';

import { Button } from '@/components/ui/shadcn';
import { appealSuspension, type SuspensionNotice } from '@/lib/account-restriction';
import { getApiError } from '@/lib/apiHelpers';

const EXPLANATION_MAX = 1000;
const dateFormat = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * What a suspended account sees when it signs in: why, until when, and «Apelar esta
 * suspensión» with the same credentials (openspec moderation/appeals). It never
 * signs in.
 */
export function SuspendedAccount({
  credentials,
  notice,
}: {
  credentials: { email: string; password: string };
  notice: SuspensionNotice;
}) {
  const explanationId = useId();
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const appeal = async () => {
    const trimmed = explanation.trim();
    if (!trimmed) {
      setError('Contá por qué apelás.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await appealSuspension({ ...credentials, explanation: trimmed });
      setSent(true);
    } catch (caught) {
      setError(getApiError(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto grid w-full max-w-lg gap-5 rounded-2xl border-[1.5px] border-destructive bg-card p-6 font-sans">
      <h1 className="text-2xl font-extrabold">Tu cuenta está suspendida</h1>
      <p>
        {notice.until
          ? `La suspensión dura hasta el ${dateFormat.format(new Date(notice.until))}. Después vas a poder ingresar de nuevo.`
          : 'La suspensión es permanente.'}
      </p>
      <p>
        <span className="font-bold">Razón:</span> {notice.reason ?? 'Sin razón registrada.'}
      </p>

      {sent || notice.appealStatus === 'PENDING' ? (
        <p className="rounded-lg bg-secondary p-3 text-sm font-semibold" role="status">
          Recibimos tu apelación. La revisa un admin que no tomó la decisión; si la acepta, vas a
          poder ingresar de nuevo.
        </p>
      ) : notice.appealStatus === 'REJECTED' ? (
        <p className="rounded-lg bg-muted p-3 text-sm">
          <span className="font-bold">Tu apelación fue rechazada.</span> Respuesta:{' '}
          {notice.appealAnswer}
        </p>
      ) : notice.appealable ? (
        <div className="grid gap-3">
          <label className="grid gap-1" htmlFor={explanationId}>
            <span className="text-sm font-bold">Por qué apelás</span>
            <textarea
              className="min-h-24 rounded-lg border-[1.5px] border-input bg-background p-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              id={explanationId}
              maxLength={EXPLANATION_MAX}
              onChange={(event) => setExplanation(event.target.value)}
              value={explanation}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Se puede apelar una vez
            {notice.appealDeadline
              ? `, hasta el ${dateFormat.format(new Date(notice.appealDeadline))}`
              : ''}
            . La revisa otra persona y su respuesta es final.
          </p>
          {error ? (
            <p className="text-sm font-semibold text-destructive-ink" role="alert">
              {error}
            </p>
          ) : null}
          <Button disabled={busy} onClick={appeal}>
            Apelar esta suspensión
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Ya no se puede apelar: pasaron más de 14 días desde la suspensión.
        </p>
      )}
    </section>
  );
}
