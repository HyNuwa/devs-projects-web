import { Minus, Plus } from 'lucide-react';

/**
 * A number with «Restar» / «Sumar» buttons, as the canvas steppers. Empty
 * means «not declared» (`null`); typing is free and the form schema validates
 * the range, while the buttons stay within `min`–`max`. With `formatValue`
 * the value is shown read-only (an `<output>`) and only the buttons change it.
 */
export function NumberStepper({
  clearBelowMin = false,
  decreaseLabel = 'Restar',
  describedBy,
  formatValue,
  id,
  increaseLabel = 'Sumar',
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
  /** «Restar» at `min` clears the value instead of stopping there. */
  clearBelowMin?: boolean;
  decreaseLabel?: string;
  describedBy?: string;
  /** Shows the value through this formatter instead of an editable input. */
  formatValue?: (value: number) => string;
  id: string;
  increaseLabel?: string;
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
  const decrease = () => {
    if (current === null) return onChange(start ?? min);
    if (clearBelowMin && current <= min) return onChange(null);
    onChange(clamp(current - step));
  };

  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="inline-flex items-center overflow-hidden rounded-[10px] border-[1.5px] border-foreground bg-card has-[[aria-invalid=true]]:border-destructive">
        <button
          aria-label={decreaseLabel}
          className={`${buttonClass} border-r-[1.5px] border-line`}
          disabled={current === null ? Boolean(formatValue) : !clearBelowMin && current <= min}
          onClick={decrease}
          type="button"
        >
          <Minus aria-hidden="true" className="size-4" strokeWidth={2.6} />
        </button>
        {formatValue ? (
          <output
            aria-describedby={describedBy}
            aria-live="polite"
            className="flex h-10 min-w-20 items-center justify-center px-2 font-sans text-[0.95rem] font-extrabold whitespace-nowrap text-card-foreground"
            id={id}
          >
            {current === null ? '—' : formatValue(current)}
          </output>
        ) : (
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
        )}
        <button
          aria-label={increaseLabel}
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
