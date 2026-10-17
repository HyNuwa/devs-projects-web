'use client';

import { Scale } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/shadcn';
import { fileAppeal } from '@/lib/appeals-client';
import { getApiError } from '@/lib/apiHelpers';

const EXPLANATION_MAX = 1000;
const dateFormat = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' });

type Target = { kind: 'RETIRO'; caseId: string } | { kind: 'SANCTION'; sanctionId: string };

/**
 * «Apelar» a retiro or a sanción: once, within 14 days, with a required
 * explanation (openspec moderation/appeals).
 */
export function AppealForm({
  deadline,
  onDone,
  target,
}: {
  deadline: string | null;
  onDone: () => void;
  target: Target;
}) {
  const explanationId = useId();
  const [open, setOpen] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setOpen(true)} size="sm" variant="outline">
          <Scale aria-hidden="true" className="size-4" />
          Apelar
        </Button>
        {deadline ? (
          <span className="text-xs text-muted-foreground">
            Podés apelar una vez, hasta el {dateFormat.format(new Date(deadline))}.
          </span>
        ) : null}
      </div>
    );
  }

  const send = async () => {
    const trimmed = explanation.trim();
    if (!trimmed) {
      setError('Contá por qué apelás.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await fileAppeal({ ...target, explanation: trimmed });
      onDone();
    } catch (caught) {
      setError(getApiError(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-2 rounded-lg border-[1.5px] border-line p-3">
      <label className="grid gap-1" htmlFor={explanationId}>
        <span className="text-sm font-bold">Por qué apelás</span>
        <textarea
          className="min-h-20 rounded-lg border-[1.5px] border-input bg-background p-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
          id={explanationId}
          maxLength={EXPLANATION_MAX}
          onChange={(event) => setExplanation(event.target.value)}
          value={explanation}
        />
      </label>
      <p className="text-xs text-muted-foreground">
        La revisa otra persona de moderación y su respuesta es final.
      </p>
      {error ? (
        <p className="text-sm font-semibold text-destructive-ink" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={send} size="sm">
          Enviar apelación
        </Button>
        <Button disabled={busy} onClick={() => setOpen(false)} size="sm" variant="ghost">
          Cancelar
        </Button>
      </div>
    </div>
  );
}

const APPEAL_STATUS = {
  PENDING: 'Apelación en revisión',
  ACCEPTED: 'Apelación aceptada',
  REJECTED: 'Apelación rechazada',
} as const;

/** The status of an appeal and its answer, without who answered. */
export function AppealOutcome({
  answer,
  status,
}: {
  answer: string | null;
  status: keyof typeof APPEAL_STATUS;
}) {
  return (
    <p className="rounded-lg bg-secondary px-3 py-2 text-sm">
      <span className="font-bold">{APPEAL_STATUS[status]}</span>
      {answer ? `. Respuesta: ${answer}` : status === 'PENDING' ? '. Te avisamos acá.' : ''}
    </p>
  );
}
