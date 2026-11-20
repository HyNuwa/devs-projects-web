import { Button } from '@/components/ui/shadcn';
import { CORRECTION_FIELD_LABELS, type CorrectionSuggestion } from '@/lib/trust-client';

/**
 * One correction suggestion with its decision buttons, shared by «Mis envíos»
 * and the Correcciones tab. Who suggested it shows only when given.
 */
export function CorrectionRow({
  suggestion,
  busy,
  onDecide,
}: {
  suggestion: CorrectionSuggestion;
  busy: boolean;
  onDecide: (accept: boolean) => void;
}) {
  const { material } = suggestion;
  return (
    <li className="grid gap-3 rounded-xl border-[1.5px] border-border bg-card p-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="grid gap-1">
        <p className="font-extrabold">{material.title}</p>
        <p className="text-muted-foreground">
          {material.subject.code ? `${material.subject.code} · ` : ''}
          {material.subject.name}
        </p>
        <p>
          <span className="font-semibold">{CORRECTION_FIELD_LABELS[suggestion.field]}:</span>{' '}
          {suggestion.current} → <span className="font-semibold">{suggestion.proposed}</span>
        </p>
        {suggestion.comment ? (
          <p className="text-secondary-foreground">«{suggestion.comment}»</p>
        ) : null}
        {suggestion.suggester ? (
          <p className="text-muted-foreground">Sugerida por @{suggestion.suggester}</p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button disabled={busy} onClick={() => onDecide(true)}>
          Aceptar
        </Button>
        <Button disabled={busy} onClick={() => onDecide(false)} variant="outline">
          Rechazar
        </Button>
      </div>
    </li>
  );
}
