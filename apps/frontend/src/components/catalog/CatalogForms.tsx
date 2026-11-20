'use client';

import { useId, useState, type FormEvent } from 'react';

import { Button, Field, FieldError, FieldLabel, Input } from '@/components/ui/shadcn';
import { getApiError } from '@/lib/apiHelpers';
import { catalogError } from '@/lib/catalog-admin-client';

export type FieldSpec = {
  name: string;
  label: string;
  /** Short names and codes: letters without accents, digits and hyphens. */
  slug?: boolean;
  optional?: boolean;
  placeholder?: string;
  type?: 'text' | 'url';
};

export const SLUG_HINT = 'Solo letras sin acentos, números y guiones.';
const SLUG = /^[A-Za-z0-9-]+$/;

/** Client-side checks that mirror the API, so most mistakes never leave the form. */
export function validate(fields: FieldSpec[], values: Record<string, string>) {
  for (const field of fields) {
    const value = values[field.name]?.trim() ?? '';
    if (!value && !field.optional) return `Completá «${field.label}».`;
    if (value && field.slug && !SLUG.test(value)) return `${field.label}: ${SLUG_HINT}`;
    if (value && field.type === 'url' && !value.startsWith('https://')) {
      return 'El link al plan tiene que empezar con https://.';
    }
  }
  return null;
}

export const trimmed = (values: Record<string, string>) =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]));

/** The API message, or for a duplicate the field it names. */
export function errorMessage(error: unknown) {
  const data = catalogError(error);
  return data.message ?? getApiError(error);
}

/** A small «Nueva …» form that opens from a button. */
export function CreateForm({
  fields,
  label,
  onCreate,
}: {
  fields: FieldSpec[];
  label: string;
  onCreate: (values: Record<string, string>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" type="button" variant="outline">
        {label}
      </Button>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const problem = validate(fields, values);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      await onCreate(trimmed(values));
      setValues({});
      setOpen(false);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      aria-label={label}
      className="grid gap-3 rounded-2xl border-[1.5px] border-line bg-background p-4"
      onSubmit={submit}
    >
      <TextFields fields={fields} onChange={setValues} values={values} />
      <FieldError>{error}</FieldError>
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} size="sm" type="submit">
          Crear
        </Button>
        <Button onClick={() => setOpen(false)} size="sm" type="button" variant="ghost">
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function TextFields({
  fields,
  onChange,
  values,
}: {
  fields: FieldSpec[];
  onChange: (values: Record<string, string>) => void;
  values: Record<string, string>;
}) {
  const id = useId();
  return (
    <>
      {fields.map((field) => (
        <Field key={field.name}>
          <FieldLabel htmlFor={`${id}-${field.name}`}>{field.label}</FieldLabel>
          <Input
            autoComplete="off"
            id={`${id}-${field.name}`}
            onChange={(event) => onChange({ ...values, [field.name]: event.target.value })}
            placeholder={field.placeholder}
            type={field.type ?? 'text'}
            value={values[field.name] ?? ''}
          />
          {field.slug ? (
            <p className="text-xs text-muted-foreground">{SLUG_HINT} Va en la dirección.</p>
          ) : null}
        </Field>
      ))}
    </>
  );
}
