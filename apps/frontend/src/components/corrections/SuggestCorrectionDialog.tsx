'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { PencilLine, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, Field, FieldLabel } from '@/components/ui/shadcn';
import { getApiError } from '@/lib/apiHelpers';
import {
  CORRECTION_FIELD_LABELS,
  getCorrectionOptions,
  getMyPrivileges,
  suggestCorrection,
  type CorrectionField,
  type CorrectionOptions,
} from '@/lib/trust-client';
import { useAuthStore } from '@/stores/authStore';

type Props = {
  materialId: string;
  authorId: string;
  onSuggested?: (message: string) => void;
};

const controlClassName =
  'min-h-11 w-full rounded-md border-[1.5px] border-input bg-card px-3 font-sans text-sm text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const FIELDS: CorrectionField[] = ['RESOURCE_TYPE', 'SUBJECT', 'ACADEMIC_YEAR', 'PROFESSOR'];
const COMMENT_MAX = 500;

/**
 * «Sugerir corrección» on someone else's material (openspec
 * academic-resources/corrections): only for students with the privilege. The
 * author decides first; nothing changes until someone accepts.
 */
export function SuggestCorrectionDialog({ materialId, authorId, onSuggested }: Props) {
  const user = useAuthStore((state) => state.user);
  const eligibleViewer = Boolean(user && user.id !== authorId);
  const [allowed, setAllowed] = useState(false);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<CorrectionOptions | null>(null);
  const [field, setField] = useState<CorrectionField>('RESOURCE_TYPE');
  const [value, setValue] = useState('');
  const [comment, setComment] = useState('');
  const [noYear, setNoYear] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!eligibleViewer) return;
    let active = true;
    getMyPrivileges()
      .then((privileges) => {
        if (active) setAllowed(privileges.suggestCorrections.active);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [eligibleViewer]);

  if (!eligibleViewer || !allowed) return null;

  const changeField = (next: CorrectionField) => {
    setField(next);
    setValue('');
    setNoYear(false);
    setError(null);
  };

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    setError(null);
    // Fresh each time: an accepted suggestion changes the current values.
    if (next) {
      try {
        setOptions(await getCorrectionOptions(materialId));
      } catch (caught) {
        setError(getApiError(caught));
      }
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await suggestCorrection(materialId, {
        field,
        proposedValue: noYear || value === '' ? null : value,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      });
      setOpen(false);
      setValue('');
      setComment('');
      onSuggested?.('Enviamos tu sugerencia. Primero la ve quien subió el material.');
    } catch (caught) {
      setError(getApiError(caught));
    } finally {
      setSubmitting(false);
    }
  }

  const current = options?.current[field] ?? null;
  // Materia and tipo always need a value; an empty ciclo or profesor means «sin».
  const missingValue =
    value === '' &&
    (field === 'SUBJECT' || field === 'RESOURCE_TYPE' || (field === 'ACADEMIC_YEAR' && !noYear));
  const changeValue = (next: string) => {
    setValue(next);
    setError(null);
  };

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={open}>
      <Dialog.Trigger asChild>
        <Button variant="outline">
          <PencilLine aria-hidden="true" className="size-4" strokeWidth={1.8} />
          Sugerir corrección
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/35" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto rounded-2xl border-[1.5px] border-border bg-card p-5 font-sans text-card-foreground outline-none sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <Dialog.Title className="text-2xl font-extrabold tracking-[-0.03em]">
                Sugerir una corrección
              </Dialog.Title>
              <Dialog.Description className="text-sm text-secondary-foreground">
                Si el material está mal clasificado, proponé el dato correcto. Primero lo decide
                quien lo subió; si no responde en 7 días, moderación.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Cerrar"
                className="grid size-11 shrink-0 place-items-center rounded-md hover:bg-muted"
                type="button"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <form className="grid gap-4" onSubmit={submit}>
            <Field>
              <FieldLabel htmlFor="correction-field">Qué dato corregís</FieldLabel>
              <select
                className={controlClassName}
                id="correction-field"
                onChange={(event) => changeField(event.target.value as CorrectionField)}
                value={field}
              >
                {FIELDS.map((entry) => (
                  <option key={entry} value={entry}>
                    {CORRECTION_FIELD_LABELS[entry]}
                  </option>
                ))}
              </select>
            </Field>

            <ValueInput
              current={current}
              field={field}
              noYear={noYear}
              onChange={changeValue}
              onNoYear={(checked) => {
                setNoYear(checked);
                setValue('');
                setError(null);
              }}
              options={options}
              value={value}
            />

            <Field>
              <FieldLabel htmlFor="correction-comment">Comentario (opcional)</FieldLabel>
              <textarea
                className={`${controlClassName} min-h-24 py-2`}
                id="correction-comment"
                maxLength={COMMENT_MAX}
                onChange={(event) => setComment(event.target.value)}
                value={comment}
              />
            </Field>

            {error ? (
              <p className="text-sm font-semibold text-destructive-ink" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-3">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button disabled={submitting || !options || missingValue} type="submit">
                Enviar sugerencia
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ValueInput({
  field,
  value,
  current,
  options,
  noYear,
  onChange,
  onNoYear,
}: {
  field: CorrectionField;
  value: string;
  current: string | null;
  options: CorrectionOptions | null;
  noYear: boolean;
  onChange: (value: string) => void;
  onNoYear: (checked: boolean) => void;
}) {
  if (field === 'ACADEMIC_YEAR') {
    return (
      <Field>
        <FieldLabel htmlFor="correction-value">Ciclo lectivo correcto</FieldLabel>
        <input
          className={controlClassName}
          id="correction-value"
          inputMode="numeric"
          max={new Date().getFullYear() + 1}
          min={1900}
          disabled={noYear}
          onChange={(event) => onChange(event.target.value)}
          placeholder={current ?? 'Sin ciclo'}
          type="number"
          value={value}
        />
        {current !== null ? (
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              checked={noYear}
              onChange={(event) => onNoYear(event.target.checked)}
              type="checkbox"
            />
            Sin ciclo lectivo
          </label>
        ) : null}
      </Field>
    );
  }

  const choices =
    field === 'SUBJECT'
      ? (options?.subjects ?? []).map((subject) => ({
          value: subject.id,
          label: subject.code ? `${subject.name} (${subject.code})` : subject.name,
        }))
      : field === 'PROFESSOR'
        ? (options?.professors ?? []).map((professor) => ({
            value: professor.id,
            label: professor.name,
          }))
        : (options?.resourceTypes ?? []);
  const label =
    field === 'SUBJECT'
      ? 'Materia correcta'
      : field === 'PROFESSOR'
        ? 'Profesor correcto'
        : 'Tipo de recurso correcto';

  return (
    <Field>
      <FieldLabel htmlFor="correction-value">{label}</FieldLabel>
      <select
        className={controlClassName}
        id="correction-value"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{field === 'PROFESSOR' ? 'Sin profesor' : 'Elegí una opción'}</option>
        {choices
          .filter((choice) => choice.value !== current)
          .map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
      </select>
    </Field>
  );
}
