'use client';

import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, LoaderCircle, Pencil, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, FieldError } from '@/components/ui/shadcn';
import { getApiError } from '@/lib/apiHelpers';
import {
  deleteCommunityEntry,
  getCommunityManagement,
  type CommunityEntryKind,
  type CommunityManagementView,
} from '@/lib/community-management-client';
import { formatCommunityDate } from '@/components/community/CommunitySummaryCards';
import { useAuthStore } from '@/stores/authStore';

type ManagementState =
  | { status: 'idle' }
  | { management: CommunityManagementView; status: 'ready' }
  | { status: 'unavailable' };

function isUnavailableManagementError(error: unknown) {
  const status = (error as { response?: { status?: number } } | undefined)?.response?.status;
  return status === 403 || status === 404;
}

function DeleteEntryDialog({
  id,
  kind,
  onDeleted,
}: {
  id: string;
  kind: CommunityEntryKind;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const entryLabel = kind === 'course-review' ? 'reseña' : 'experiencia de final';

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setError(null);
  };

  const deleteEntry = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      await deleteCommunityEntry(kind, id);
      setOpen(false);
      onDeleted();
    } catch (deleteError) {
      setError(getApiError(deleteError));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={open}>
      <Dialog.Trigger asChild>
        <Button variant="destructive">
          <Trash2 aria-hidden="true" className="size-4" strokeWidth={1.8} />
          Eliminar permanentemente
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/35 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 grid w-[min(34rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto border border-border bg-card p-5 text-card-foreground shadow-surface outline-none sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-serif text-2xl font-bold leading-tight">
                ¿Eliminar esta {entryLabel}?
              </Dialog.Title>
              <Dialog.Description className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">
                Esta acción es permanente. La publicación dejará de aparecer en la materia, en los
                resultados, en su enlace público y en los promedios.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button aria-label="Cerrar confirmación de eliminación" size="icon" variant="ghost">
                <X aria-hidden="true" className="size-5" />
              </Button>
            </Dialog.Close>
          </div>
          <FieldError>{error}</FieldError>
          <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
            <Dialog.Close asChild>
              <Button disabled={isDeleting} variant="outline">
                Cancelar
              </Button>
            </Dialog.Close>
            <Button disabled={isDeleting} onClick={deleteEntry} variant="destructive">
              {isDeleting ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              Sí, eliminar permanentemente
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function OwnerRemovalEvidence({ management }: { management: CommunityManagementView }) {
  const date = management.moderation.date ? formatCommunityDate(management.moderation.date) : null;

  return (
    <section
      aria-labelledby="removed-entry-title"
      className="border border-destructive bg-destructive/10 p-5 shadow-surface"
      role="status"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="grid gap-2">
          <h1 className="font-serif text-2xl font-bold text-foreground" id="removed-entry-title">
            Tu publicación fue retirada de la vista pública
          </h1>
          <p className="font-sans text-sm leading-relaxed text-foreground">
            {management.moderation.reason ?? 'Moderación no indicó un motivo visible.'}
          </p>
          {date ? (
            <p className="font-sans text-sm text-muted-foreground">Retirada el {date}.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function CommunityEntryManagement({
  id,
  kind,
  subjectHref,
}: {
  id: string;
  kind: CommunityEntryKind;
  subjectHref?: string;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const [state, setState] = useState<ManagementState>({ status: 'idle' });
  const listPath = kind === 'course-review' ? '/resenas' : '/finales';
  const editHref =
    subjectHref &&
    `${subjectHref}/${kind === 'course-review' ? 'resenar' : 'final'}?editar=${encodeURIComponent(id)}`;

  useEffect(() => {
    if (!user || isAuthLoading) return;

    let isCurrent = true;

    void getCommunityManagement(kind, id)
      .then((management) => {
        if (isCurrent) setState({ management, status: 'ready' });
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setState(
            isUnavailableManagementError(error) ? { status: 'unavailable' } : { status: 'idle' },
          );
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [id, isAuthLoading, kind, user]);

  if (state.status !== 'ready' || state.management.author.id !== user?.id) {
    return null;
  }

  const onDeleted = () => {
    router.replace(listPath);
  };

  if (state.management.moderation.isRemoved) {
    return (
      <div className="grid gap-4">
        <OwnerRemovalEvidence management={state.management} />
        <aside className="grid content-start gap-3 border border-border bg-card p-4 shadow-surface">
          <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Gestión de tu publicación
          </p>
          {editHref ? (
            <Button asChild variant="outline">
              <Link href={editHref}>
                <Pencil aria-hidden="true" className="size-4" strokeWidth={1.8} />
                Editar publicación
              </Link>
            </Button>
          ) : null}
          <DeleteEntryDialog id={id} kind={kind} onDeleted={onDeleted} />
        </aside>
      </div>
    );
  }

  return (
    <aside className="grid content-start gap-3 border border-border bg-card p-4 shadow-surface">
      <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        Gestión de tu publicación
      </p>
      {editHref ? (
        <Button asChild variant="outline">
          <Link href={editHref}>
            <Pencil aria-hidden="true" className="size-4" strokeWidth={1.8} />
            Editar publicación
          </Link>
        </Button>
      ) : null}
      <DeleteEntryDialog id={id} kind={kind} onDeleted={onDeleted} />
    </aside>
  );
}
