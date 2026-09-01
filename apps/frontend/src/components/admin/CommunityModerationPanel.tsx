'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Eye, EyeOff, LoaderCircle, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, Field, FieldError, FieldLabel } from '@/components/ui/shadcn';
import { cn } from '@/components/ui/shadcn/utils';
import { formatCommunityDate } from '@/components/community/CommunitySummaryCards';
import { getApiError } from '@/lib/apiHelpers';
import {
  getCommunityModerationReports,
  moderateCommunityEntry,
  type CommunityEntryKind,
  type CommunityModerationAction,
  type CommunityModerationReport,
} from '@/lib/community-management-client';
import { useAuthStore } from '@/stores/authStore';

const reportReasonLabels: Record<CommunityModerationReport['reason'], string> = {
  SPAM_O_REPETIDO: 'Spam o contenido repetido',
  INSULTOS_O_ACOSO: 'Insultos o acoso',
  DATOS_PERSONALES: 'Expone datos personales',
  NO_RELACIONADO: 'No está relacionado con la materia',
  POSIBLEMENTE_ENGANOSO: 'Información posiblemente engañosa',
  OTRO: 'Otro motivo',
};

const moderatorRoles = new Set(['MODERATOR', 'ADMIN', 'SUPERADMIN']);

function entryKindFromReport(report: CommunityModerationReport): CommunityEntryKind {
  return report.target.type === 'COURSE_REVIEW' ? 'course-review' : 'exam-experience';
}

function ModerationDecisionDialog({
  action,
  report,
  onComplete,
}: {
  action: CommunityModerationAction;
  report: CommunityModerationReport;
  onComplete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRemoval = action === 'remove';
  const actionLabel = isRemoval ? 'Retirar de la vista pública' : 'Restaurar publicación';

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setReason('');
      setError(null);
    }
  };

  const submitDecision = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedReason = reason.trim();

    if (normalizedReason.length < 3) {
      setError('Indicá una razón de al menos 3 caracteres.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await moderateCommunityEntry(
        entryKindFromReport(report),
        report.target.id,
        action,
        normalizedReason,
      );
      setOpen(false);
      onComplete();
    } catch (decisionError) {
      setError(getApiError(decisionError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={open}>
      <Dialog.Trigger asChild>
        <Button variant={isRemoval ? 'destructive' : 'secondary'}>
          {isRemoval ? (
            <EyeOff aria-hidden="true" className="size-4" strokeWidth={1.8} />
          ) : (
            <Eye aria-hidden="true" className="size-4" strokeWidth={1.8} />
          )}
          {actionLabel}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/35 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 grid w-[min(34rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto border border-border bg-card p-5 text-card-foreground shadow-surface outline-none sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-serif text-2xl font-bold leading-tight">
                {actionLabel}
              </Dialog.Title>
              <Dialog.Description className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">
                {isRemoval
                  ? 'La publicación dejará de ser pública y no contará en los agregados. Su autor verá esta razón y la fecha de la decisión.'
                  : 'La misma publicación volverá a ser pública sin recrear su historial.'}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button aria-label="Cerrar decisión de moderación" size="icon" variant="ghost">
                <X aria-hidden="true" className="size-5" />
              </Button>
            </Dialog.Close>
          </div>

          <form className="grid gap-5" onSubmit={submitDecision}>
            <Field>
              <FieldLabel htmlFor={`community-moderation-reason-${report.id}`}>
                Razón para el registro
              </FieldLabel>
              <textarea
                aria-describedby={`community-moderation-reason-help-${report.id} community-moderation-error-${report.id}`}
                aria-invalid={Boolean(error)}
                className={cn(
                  'min-h-28 w-full resize-y border border-input bg-background px-3 py-3 font-sans text-sm text-foreground outline-none shadow-field focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
                id={`community-moderation-reason-${report.id}`}
                maxLength={1000}
                onChange={(event) => setReason(event.target.value)}
                placeholder={
                  isRemoval
                    ? 'Explicá por qué se retira la publicación.'
                    : 'Explicá por qué se restaura.'
                }
                required
                value={reason}
              />
              <p
                className="font-sans text-sm text-muted-foreground"
                id={`community-moderation-reason-help-${report.id}`}
              >
                Entre 3 y 1.000 caracteres de texto plano.
              </p>
            </Field>
            <FieldError id={`community-moderation-error-${report.id}`}>{error}</FieldError>
            <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
              <Dialog.Close asChild>
                <Button disabled={isSubmitting} variant="outline">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button
                disabled={isSubmitting}
                type="submit"
                variant={isRemoval ? 'destructive' : 'secondary'}
              >
                {isSubmitting ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : null}
                Confirmar decisión
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function CommunityModerationPanel() {
  const user = useAuthStore((state) => state.user);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const isModerator = user ? moderatorRoles.has(user.role) : false;
  const [attempt, setAttempt] = useState(0);
  const [reports, setReports] = useState<CommunityModerationReport[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading || !isModerator) return;

    let isCurrent = true;

    void getCommunityModerationReports()
      .then((nextReports) => {
        if (isCurrent) {
          setReports(nextReports);
          setState('ready');
        }
      })
      .catch((loadError) => {
        if (isCurrent) {
          setError(getApiError(loadError));
          setState('error');
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [attempt, isAuthLoading, isModerator]);

  if (!isModerator) return null;

  return (
    <section
      className="mx-auto grid w-full max-w-5xl gap-5 px-5 pb-12"
      aria-labelledby="community-moderation-title"
    >
      <header className="border border-border bg-card p-5 shadow-surface sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.08em] text-primary">
              Moderación de comunidad
            </p>
            <h2
              className="mt-2 font-serif text-3xl font-bold text-card-foreground"
              id="community-moderation-title"
            >
              Reportes sobre reseñas y finales
            </h2>
            <p className="mt-2 max-w-3xl font-sans leading-relaxed text-muted-foreground">
              Un reporte no oculta nada por sí solo. Las decisiones quedan registradas y las
              publicaciones retiradas permanecen disponibles para su autor y para moderación.
            </p>
          </div>
          <ShieldCheck aria-hidden="true" className="size-8 text-primary" strokeWidth={1.6} />
        </div>
      </header>

      {state === 'loading' ? (
        <div
          className="flex items-center gap-3 border border-border bg-card p-5 font-sans text-muted-foreground shadow-surface"
          role="status"
        >
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-primary" />
          Cargando reportes de comunidad…
        </div>
      ) : null}

      {state === 'error' ? (
        <div
          className="grid gap-4 border border-destructive bg-card p-5 shadow-surface"
          role="alert"
        >
          <p className="font-sans text-destructive">{error}</p>
          <Button
            className="justify-self-start"
            onClick={() => setAttempt((value) => value + 1)}
            variant="outline"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Reintentar
          </Button>
        </div>
      ) : null}

      {state === 'ready' && reports.length === 0 ? (
        <div className="border border-border bg-card p-5 font-sans text-muted-foreground shadow-surface">
          No hay reportes de comunidad pendientes de revisión.
        </div>
      ) : null}

      {state === 'ready'
        ? reports.map((report) => {
            const isRemoved = report.target.moderation.isRemoved;
            const publicLabel = report.target.isAnonymous
              ? 'Publicada como Anónimo'
              : 'Publicada con identidad visible';
            const authorLabel = report.target.author.displayName
              ? `${report.target.author.displayName} (@${report.target.author.username})`
              : `@${report.target.author.username}`;
            const targetKind =
              report.target.type === 'COURSE_REVIEW' ? 'Reseña de cursada' : 'Experiencia de final';

            return (
              <article
                className="grid gap-4 border border-border bg-card p-5 shadow-surface"
                key={report.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.08em] text-primary">
                      {targetKind} · {reportReasonLabels[report.reason]}
                    </p>
                    <h3 className="mt-2 font-serif text-2xl font-bold text-card-foreground">
                      {report.target.subject.name}
                    </h3>
                    <p className="mt-1 font-sans text-sm text-muted-foreground">
                      Reportado el {formatCommunityDate(report.createdAt) ?? 'fecha no informada'}
                    </p>
                  </div>
                  <span className="border border-border px-2 py-1 font-mono text-[0.65rem] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                    {isRemoved ? 'Retirada de la vista pública' : 'Sigue visible'}
                  </span>
                </div>

                {report.explanation ? (
                  <p className="border-l-2 border-primary pl-3 font-sans text-sm leading-relaxed text-foreground">
                    {report.explanation}
                  </p>
                ) : null}

                <dl className="grid gap-2 border-y border-border py-4 font-sans text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-bold text-muted-foreground">Publicación</dt>
                    <dd className="mt-1 text-foreground">{publicLabel}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-muted-foreground">Autor interno</dt>
                    <dd className="mt-1 text-foreground">{authorLabel}</dd>
                  </div>
                </dl>

                <ModerationDecisionDialog
                  action={isRemoved ? 'restore' : 'remove'}
                  onComplete={() => setAttempt((value) => value + 1)}
                  report={report}
                />
              </article>
            );
          })
        : null}
    </section>
  );
}
