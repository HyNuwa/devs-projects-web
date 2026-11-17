import Link from 'next/link';
import { Check, LoaderCircle, Lock } from 'lucide-react';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { FormSection } from '@/components/experiences/forms/FormSection';
import { Button } from '@/components/ui/shadcn';
import { cn } from '@/components/ui/shadcn/utils';

/**
 * «Publicación», the last section of both experiencia forms: the anonymity
 * switch (off by default, fixed once published), the publication rule and the
 * publish bar. Render it as a direct child of the form's column: the bar is
 * sticky at the bottom below `lg`, so it stays in reach while scrolling and,
 * taking its own space, never covers the last field.
 */
export function PublicationSection({
  anonymousField,
  cancelHref,
  isEditing,
  isSubmitting,
  number,
  onCancel,
  submitLabel,
}: {
  /** `register('isAnonymous')` of the form. */
  anonymousField: UseFormRegisterReturn;
  cancelHref: string;
  /** Editing keeps the anonymity chosen at publishing, shown but not changeable. */
  isEditing: boolean;
  isSubmitting: boolean;
  number: number;
  /** Runs before «Cancelar» navigates (the draft of change 5b clears here). */
  onCancel?: () => void;
  submitLabel: string;
}) {
  const anonymousId = `${anonymousField.name}-switch`;
  return (
    <>
      <FormSection number={number} title="Publicación">
        <label
          className={cn(
            'flex items-start gap-3.5 rounded-xl border-[1.5px] border-foreground bg-secondary px-4 py-3.5',
            isEditing ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
          htmlFor={anonymousId}
        >
          <input
            aria-describedby={`${anonymousId}-copy${isEditing ? ` ${anonymousId}-locked` : ''}`}
            aria-labelledby={`${anonymousId}-title`}
            className="peer sr-only"
            disabled={isEditing}
            id={anonymousId}
            role="switch"
            type="checkbox"
            {...anonymousField}
          />
          <span
            aria-hidden="true"
            className="relative mt-0.5 h-[26px] w-[46px] shrink-0 rounded-full border-[1.5px] border-foreground bg-muted transition-colors after:absolute after:left-[3px] after:top-[3px] after:size-[17px] after:rounded-full after:bg-card after:transition-transform peer-checked:bg-primary peer-checked:after:translate-x-5 peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring motion-reduce:after:transition-none"
          />
          <span className="min-w-0">
            <span
              className="block font-sans text-[0.9375rem] font-extrabold text-card-foreground"
              id={`${anonymousId}-title`}
            >
              Publicar como anónimo
            </span>
            <span
              className="mt-1 block font-sans text-[0.8125rem] font-medium leading-relaxed text-secondary-foreground"
              id={`${anonymousId}-copy`}
            >
              Se muestra como «Anónimo» y no aparece en tu perfil. Las publicaciones anónimas no
              suman puntos.
            </span>
            {isEditing ? (
              <span
                className="mt-1 block font-sans text-[0.8125rem] font-bold text-card-foreground"
                id={`${anonymousId}-locked`}
              >
                Se elige al publicar y no cambia al editar.
              </span>
            ) : null}
          </span>
          <Lock aria-hidden="true" className="ml-auto size-5 shrink-0 text-card-foreground" />
        </label>
        <p className="mt-4 max-w-[46ch] font-sans text-[0.8125rem] font-semibold leading-snug text-muted-foreground">
          Se publica al instante. Si alguien la reporta y no cumple las{' '}
          <Link className="text-link underline underline-offset-4" href="/normas">
            normas
          </Link>
          , moderación puede retirarla.
        </p>
      </FormSection>

      <div
        className="sticky bottom-0 z-30 flex items-center justify-end gap-3 border-t-[1.5px] border-foreground bg-card px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:static lg:border-t-0 lg:bg-transparent lg:p-0"
        data-publish-bar=""
      >
        <Button asChild className="hidden sm:inline-flex" variant="outline">
          <Link href={cancelHref} onClick={onCancel}>
            Cancelar
          </Link>
        </Button>
        <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
          {isSubmitting ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Check aria-hidden="true" className="size-4" />
          )}
          {isSubmitting ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </>
  );
}
