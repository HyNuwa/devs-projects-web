import { Minus, Plus } from 'lucide-react';

/**
 * A number with «Restar» / «Sumar» buttons, as the canvas steppers. Empty
 * means «not declared» (`null`); typing is free and the form schema validates
 * the range, while the buttons stay within `min`–`max`.
 */
export function NumberStepper({
  describedBy,
  id,
  invalid = false,
  max,
  min,
  onBlur,
  onChange,
  start,
  step = 1,
  suffix,
  value,
}: {
  describedBy?: string;
  id: string;
  invalid?: boolean;
  max: number;
  min: number;
  onBlur?: () => void;
  onChange: (value: number | null) => void;
  /** First value «Sumar» sets on an empty field; defaults to `min`. */
  start?: number;
  step?: number;
  suffix?: string;
  value: number | null | undefined;
}) {
  const current = value ?? null;
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  const buttonClass =
    'grid h-10 w-9 place-items-center text-card-foreground hover:bg-muted disabled:text-muted-foreground disabled:hover:bg-transparent focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none';

  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="inline-flex items-center overflow-hidden rounded-[10px] border-[1.5px] border-foreground bg-card has-[[aria-invalid=true]]:border-destructive">
        <button
          aria-label="Restar"
          className={`${buttonClass} border-r-[1.5px] border-line`}
          disabled={current !== null && current <= min}
          onClick={() => onChange(current === null ? (start ?? min) : clamp(current - step))}
          type="button"
        >
          <Minus aria-hidden="true" className="size-4" strokeWidth={2.6} />
        </button>
        <input
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className="h-10 w-14 [appearance:textfield] bg-transparent text-center font-sans text-[1.0625rem] font-extrabold text-card-foreground outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          id={id}
          inputMode="numeric"
          onBlur={onBlur}
          onChange={(event) => {
            const raw = event.target.value.trim();
            const parsed = Number(raw);
            onChange(raw === '' || Number.isNaN(parsed) ? null : parsed);
          }}
          step={step}
          type="number"
          value={current ?? ''}
        />
        <button
          aria-label="Sumar"
          className={`${buttonClass} border-l-[1.5px] border-line`}
          disabled={current !== null && current >= max}
          onClick={() => onChange(current === null ? (start ?? min) : clamp(current + step))}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4" strokeWidth={2.6} />
        </button>
      </span>
      {suffix ? (
        <span className="font-sans text-[0.84rem] font-bold text-muted-foreground">{suffix}</span>
      ) : null}
    </span>
  );
}
