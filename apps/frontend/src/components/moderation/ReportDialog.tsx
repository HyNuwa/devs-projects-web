'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Flag, LoaderCircle, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button, Field, FieldError, FieldLabel } from '@/components/ui/shadcn';
import { cn } from '@/components/ui/shadcn/utils';
import { getApiError } from '@/lib/apiHelpers';
import { loginHrefForReturnPath } from '@/lib/auth-return-path';
import {
  createReport,
  type ModerationTargetType,
  type ReportReason,
  reportReasonLabels,
  reportReasons,
} from '@/lib/report-client';
import { useAuthStore } from '@/stores/authStore';

type ReportDialogProps = {
  targetType: ModerationTargetType;
  targetId: string;
  /** Where to send a visitor back after signing in. */
  returnPath: string;
  onReported?: (message: string) => void;
};

const controlClassName =
  'min-h-11 w-full rounded-md border-[1.5px] border-input bg-card px-3 font-sans text-sm text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const DEFAULT_REASON: ReportReason = 'SPAM_O_REPETIDO';

/** «Reportar» for any published material, reseña or experiencia (openspec moderation/cases). */
export function ReportDialog({ onReported, returnPath, targetId, targetType }: ReportDialogProps) {
  const user = useAuthStore((state) => state.user);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>(DEFAULT_REASON);
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthLoading) {
    return (
      <Button disabled variant="outline">
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        Cargando cuenta
      </Button>
    );
  }

  if (!user) {
    return (
      <Button asChild variant="outline">
        <Link href={loginHrefForReturnPath(returnPath)}>Iniciá sesión para reportar</Link>
      </Button>
    );
  }

  const reset = () => {
    setReason(DEFAULT_REASON);
    setExplanation('');
    setError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = explanation.trim();
    if (reason === 'OTRO' && normalized.length < 3) {
      setError('Explicá el motivo en al menos 3 caracteres.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await createReport({
        targetType,
        targetId,
        reason,
        ...(reason === 'OTRO' ? { explanation: normalized } : {}),
      });
      setOpen(false);
      reset();
      onReported?.('Gracias. Moderación va a revisarlo.');
    } catch (submissionError) {
      setError(getApiError(submissionError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={open}>
      <Dialog.Trigger asChild>
        <Button variant="outline">
          <Flag aria-hidden="true" className="size-4" strokeWidth={1.8} />
          Reportar
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/35" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto rounded-2xl border-[1.5px] border-border bg-card p-5 font-sans text-card-foreground outline-none sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-2xl font-extrabold tracking-[-0.03em]">
                Reportar publicación
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Moderación lo revisa. Reportar no borra nada: si varias personas reportan lo mismo,
                o si expone datos personales, se oculta mientras se revisa.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button aria-label="Cerrar reporte" size="icon" variant="ghost">
                <X aria-hidden="true" className="size-5" />
              </Button>
            </Dialog.Close>
          </div>

          <form className="grid gap-5" onSubmit={submit}>
            <Field>
              <FieldLabel htmlFor="report-reason">Motivo</FieldLabel>
              <select
                className={controlClassName}
                id="report-reason"
                onChange={(event) => setReason(event.target.value as ReportReason)}
                value={reason}
              >
                {reportReasons.map((value) => (
                  <option key={value} value={value}>
                    {reportReasonLabels[value]}
                  </option>
                ))}
              </select>
            </Field>

            {reason === 'OTRO' ? (
              <Field>
                <FieldLabel htmlFor="report-explanation">Explicación</FieldLabel>
                <textarea
                  aria-describedby="report-explanation-help report-error"
                  aria-invalid={Boolean(error)}
                  aria-required="true"
                  className={cn(controlClassName, 'min-h-28 resize-y py-3')}
                  id="report-explanation"
                  maxLength={1000}
                  onChange={(event) => setExplanation(event.target.value)}
                  placeholder="Contá qué debería revisar moderación."
                  value={explanation}
                />
                <p className="text-sm text-muted-foreground" id="report-explanation-help">
                  Entre 3 y 1.000 caracteres, sin datos sensibles propios o ajenos.
                </p>
              </Field>
            ) : null}

            <FieldError id="report-error">{error}</FieldError>
            <p className="text-sm text-muted-foreground">
              ¿Dudás si corresponde? Revisá las{' '}
              <Link
                className="font-semibold text-link underline-offset-4 hover:underline"
                href="/normas"
              >
                Normas de la comunidad
              </Link>
              .
            </p>
            <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-4">
              <Dialog.Close asChild>
                <Button disabled={isSubmitting} variant="outline">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : null}
                Enviar reporte
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
