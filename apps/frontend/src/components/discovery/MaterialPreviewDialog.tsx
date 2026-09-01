'use client';

import * as Dialog from '@radix-ui/react-dialog';
import {
  Bookmark,
  Download,
  FileText,
  MessageSquare,
  ThumbsUp,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/shadcn/button';
import { api } from '@/lib/api';
import { loginHrefForCurrentLocation } from '@/lib/auth-return-path';
import { getPublicMaterial } from '@/lib/discovery-client';
import {
  getMaterialViewerState,
  setMaterialHelpfulness,
  setMaterialSaved,
} from '@/lib/material-viewer-client';
import { useAuthStore } from '@/stores/authStore';
import type { Material, MaterialViewerState } from '@/types/material';

export type MaterialPreviewDialogFile = {
  academicYear: number | null;
  createdAt: string;
  fileType: string;
  id: string;
  title: string;
};

type MaterialPreviewDialogProps = {
  file: MaterialPreviewDialogFile;
  focusTargetId: string;
  onRequestClose: () => void;
  open: boolean;
  subjectName: string;
};

type MaterialState =
  | { status: 'loading' }
  | { material: Material; status: 'ready' }
  | { materialId: string; status: 'error' };

type ViewerState =
  | { materialId: string; status: 'loading' }
  | { materialId: string; status: 'error' }
  | { materialId: string; status: 'ready'; viewer: MaterialViewerState };

type PendingAction = 'helpfulness' | 'saved' | null;

const thirdPartyPreviewOrigins = new Set(['https://drive.google.com', 'https://docs.google.com']);

function apiOrigin(): string {
  return new URL(api.defaults.baseURL ?? '/', window.location.origin).origin;
}

/** Resolves only first-party storage or explicitly reviewed embed providers. */
export function resolveAllowedPreviewUrl(previewUrl: string | null): string | null {
  if (!previewUrl) return null;

  try {
    const resolved = new URL(previewUrl, apiOrigin());
    if (resolved.origin === apiOrigin() || resolved.origin === window.location.origin) {
      return resolved.toString();
    }

    return thirdPartyPreviewOrigins.has(resolved.origin) ? resolved.toString() : null;
  } catch {
    return null;
  }
}

function PreviewFallback({
  description,
  onRetry,
  title,
}: {
  description: string;
  onRetry?: () => void;
  title: string;
}) {
  return (
    <div className="max-w-md text-center">
      <TriangleAlert
        aria-hidden="true"
        className="mx-auto size-10 text-primary"
        strokeWidth={1.6}
      />
      <h2 className="mt-4 font-serif text-3xl font-bold text-foreground">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-secondary-foreground">{description}</p>
      {onRetry ? (
        <Button className="mt-5" onClick={onRetry} variant="outline">
          Reintentar vista previa
        </Button>
      ) : null}
    </div>
  );
}

function PreviewRegion({
  attempt,
  file,
  materialState,
  onPreviewError,
  onRetry,
  previewFailed,
}: {
  attempt: number;
  file: MaterialPreviewDialogFile;
  materialState: MaterialState;
  onPreviewError: () => void;
  onRetry: () => void;
  previewFailed: boolean;
}) {
  if (materialState.status === 'loading') {
    return (
      <div aria-live="polite" className="max-w-md text-center">
        <FileText aria-hidden="true" className="mx-auto size-10 text-primary" strokeWidth={1.6} />
        <p className="mt-4 font-serif text-3xl font-bold text-foreground">
          Preparando vista previa…
        </p>
      </div>
    );
  }

  if (materialState.status === 'error') {
    return (
      <PreviewFallback
        description="No pudimos obtener una fuente de vista previa. Todavía podés descargar el archivo."
        title="Vista previa no disponible"
      />
    );
  }

  const preview = materialState.material.preview;
  const previewUrl = resolveAllowedPreviewUrl(preview.url);

  if (previewFailed) {
    return (
      <PreviewFallback
        description="No pudimos cargar este archivo en el navegador. Podés reintentar o descargarlo para abrirlo en tu dispositivo."
        onRetry={onRetry}
        title="No pudimos cargar la vista previa"
      />
    );
  }

  if (preview.capability === 'UNSUPPORTED') {
    return (
      <PreviewFallback
        description="Este formato no admite una vista previa integrada. Podés descargar el archivo para abrirlo en tu dispositivo."
        title="Vista previa no compatible"
      />
    );
  }

  if (preview.capability === 'UNAVAILABLE' || !preview.canPreview || !previewUrl) {
    return (
      <PreviewFallback
        description={
          preview.url && !previewUrl
            ? 'Por seguridad no cargamos vistas previas desde ese origen. Podés descargar el archivo.'
            : 'Este material no tiene una vista previa disponible. Podés descargar el archivo para abrirlo en tu dispositivo.'
        }
        title="Vista previa no disponible"
      />
    );
  }

  if (preview.capability === 'PDF') {
    return (
      <div className="grid size-full grid-rows-[minmax(0,1fr)_auto] gap-3">
        <iframe
          className="size-full min-h-[20rem] border-0 bg-background sm:min-h-[28rem]"
          key={`${file.id}-${attempt}`}
          onError={onPreviewError}
          referrerPolicy="no-referrer"
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
          src={previewUrl}
          title={`Vista previa del archivo ${file.title}`}
        />
        <Button className="justify-self-end" onClick={onPreviewError} size="sm" variant="ghost">
          La vista previa no cargó
        </Button>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={`Vista previa de ${file.title}`}
      className="max-h-full max-w-full object-contain"
      key={`${file.id}-${attempt}`}
      onError={onPreviewError}
      referrerPolicy="no-referrer"
      src={previewUrl}
    />
  );
}

/**
 * Keeps a selected material in its list context while Radix owns modal focus,
 * inert background behavior, Escape, and outside-close interactions.
 */
export function MaterialPreviewDialog({
  file,
  focusTargetId,
  onRequestClose,
  open,
  subjectName,
}: MaterialPreviewDialogProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const [materialState, setMaterialState] = useState<MaterialState>({ status: 'loading' });
  const [viewerState, setViewerState] = useState<ViewerState>({
    materialId: file.id,
    status: 'loading',
  });
  const [failedPreviewId, setFailedPreviewId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [viewerError, setViewerError] = useState<{ materialId: string; message: string } | null>(
    null,
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    getPublicMaterial(file.id).then(
      (material) => {
        if (!cancelled) setMaterialState({ material, status: 'ready' });
      },
      () => {
        if (!cancelled) setMaterialState({ materialId: file.id, status: 'error' });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [file.id, open]);

  useEffect(() => {
    if (!open || !user) return;

    let cancelled = false;

    getMaterialViewerState(file.id).then(
      (viewer) => {
        if (!cancelled) setViewerState({ materialId: file.id, status: 'ready', viewer });
      },
      () => {
        if (!cancelled) setViewerState({ materialId: file.id, status: 'error' });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [file.id, open, user]);

  const currentMaterialState =
    materialState.status === 'ready' && materialState.material.id !== file.id
      ? { status: 'loading' as const }
      : materialState.status === 'error' && materialState.materialId !== file.id
        ? { status: 'loading' as const }
        : materialState;
  const currentViewerState =
    viewerState.materialId === file.id
      ? viewerState
      : { materialId: file.id, status: 'loading' as const };
  const viewer = currentViewerState.status === 'ready' ? currentViewerState.viewer : null;
  const viewerIsLoading = Boolean(user) && currentViewerState.status === 'loading';
  const isViewerError = currentViewerState.status === 'error';
  const previewFailed = failedPreviewId === file.id;
  const actionIsPending = pendingAction !== null;
  const actionIsDisabled = isAuthLoading || (Boolean(user) && (!viewer || actionIsPending));
  const contextualViewerError = viewerError?.materialId === file.id ? viewerError.message : null;

  const defaultDownloadHref = `${api.defaults.baseURL ?? ''}/materials/${encodeURIComponent(file.id)}/download`;
  const downloadHref =
    currentMaterialState.status === 'ready'
      ? currentMaterialState.material.preview.downloadUrl
      : defaultDownloadHref;
  const uploadedAt = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(
    new Date(file.createdAt),
  );

  const requestSignIn = () => {
    router.push(loginHrefForCurrentLocation());
  };

  const updateSaved = async () => {
    if (!user) {
      requestSignIn();
      return;
    }
    if (!viewer || actionIsPending) return;

    setPendingAction('saved');
    setViewerError(null);
    try {
      const nextViewer = await setMaterialSaved(file.id, !viewer.isSaved);
      setViewerState({ materialId: file.id, status: 'ready', viewer: nextViewer });
    } catch {
      setViewerError({
        materialId: file.id,
        message: 'No pudimos actualizar tus guardados. Intentá nuevamente.',
      });
    } finally {
      setPendingAction(null);
    }
  };

  const updateHelpfulness = async () => {
    if (!user) {
      requestSignIn();
      return;
    }
    if (!viewer || actionIsPending) return;

    setPendingAction('helpfulness');
    setViewerError(null);
    try {
      const nextViewer = await setMaterialHelpfulness(file.id, !viewer.isHelpful);
      setViewerState({ materialId: file.id, status: 'ready', viewer: nextViewer });
      setMaterialState((current) => {
        if (current.status !== 'ready' || current.material.id !== file.id) return current;

        return {
          material: { ...current.material, helpfulCount: nextViewer.helpfulCount },
          status: 'ready',
        };
      });
    } catch {
      setViewerError({
        materialId: file.id,
        message: 'No pudimos actualizar la señal de utilidad. Intentá nuevamente.',
      });
    } finally {
      setPendingAction(null);
    }
  };

  const helpfulCount =
    currentMaterialState.status === 'ready' ? currentMaterialState.material.helpfulCount : 0;

  return (
    <Dialog.Root
      modal
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onRequestClose();
      }}
      open={open}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[1px]"
          data-testid="material-preview-overlay"
        />
        <Dialog.Content
          aria-describedby="material-preview-description"
          className="fixed inset-0 z-50 grid max-h-dvh grid-rows-[auto_minmax(0,1fr)_auto] bg-card text-card-foreground shadow-surface outline-none sm:inset-x-5 sm:inset-y-5 sm:border sm:border-border lg:inset-x-10 lg:inset-y-8"
          data-slot="material-preview-dialog"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            window.requestAnimationFrame(() => {
              const target = document.getElementById(focusTargetId);
              if (target instanceof HTMLElement) target.focus();
            });
          }}
        >
          <header className="flex min-w-0 items-start gap-3 border-b border-border bg-background px-4 py-3 sm:px-5">
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center border border-border bg-secondary text-primary"
            >
              <FileText className="size-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="truncate font-serif text-xl font-bold text-foreground sm:text-2xl">
                Vista previa: {file.title}
              </Dialog.Title>
              <Dialog.Description
                className="mt-1 text-sm text-secondary-foreground"
                id="material-preview-description"
              >
                {subjectName} · {file.fileType.toUpperCase()} ·{' '}
                {file.academicYear ?? 'Ciclo no informado'}
              </Dialog.Description>
            </div>
            <Button asChild className="hidden shrink-0 sm:inline-flex" size="sm" variant="outline">
              <a href={downloadHref} rel="noreferrer">
                <Download aria-hidden="true" className="size-4" strokeWidth={1.8} />
                Descargar
              </a>
            </Button>
            <Dialog.Close asChild>
              <Button
                aria-label="Cerrar vista previa"
                className="shrink-0"
                size="icon"
                variant="ghost"
              >
                <X aria-hidden="true" className="size-5" strokeWidth={1.8} />
              </Button>
            </Dialog.Close>
          </header>

          <div className="grid min-h-0 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_22rem] lg:overflow-hidden">
            <section
              aria-label={`Vista previa de ${file.title}`}
              className="grid min-h-[20rem] place-items-center border-b border-border bg-secondary p-5 sm:min-h-[28rem] sm:p-8 lg:min-h-0 lg:border-b-0 lg:border-r"
            >
              <PreviewRegion
                attempt={attempt}
                file={file}
                materialState={currentMaterialState}
                onPreviewError={() => setFailedPreviewId(file.id)}
                onRetry={() => {
                  setFailedPreviewId(null);
                  setAttempt((value) => value + 1);
                }}
                previewFailed={previewFailed}
              />
            </section>

            <aside
              aria-labelledby="material-preview-community"
              className="bg-background p-5 sm:p-6"
            >
              <div className="flex items-center gap-2 text-primary">
                <MessageSquare aria-hidden="true" className="size-5" strokeWidth={1.8} />
                <h2
                  className="font-serif text-2xl font-bold text-foreground"
                  id="material-preview-community"
                >
                  Comunidad
                </h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-secondary-foreground">
                Las valoraciones y los comentarios de este material aparecen en este panel sin
                perder la vista previa.
              </p>
              <div className="mt-6 grid gap-3 border-y border-border py-4">
                <Button
                  aria-pressed={viewer?.isSaved ?? false}
                  disabled={actionIsDisabled}
                  onClick={updateSaved}
                  variant={viewer?.isSaved ? 'secondary' : 'outline'}
                >
                  <Bookmark aria-hidden="true" className="size-4" strokeWidth={1.8} />
                  {pendingAction === 'saved'
                    ? 'Guardando…'
                    : viewer?.isSaved
                      ? 'Guardado'
                      : 'Guardar'}
                </Button>
                <Button
                  aria-pressed={viewer?.isHelpful ?? false}
                  disabled={actionIsDisabled}
                  onClick={updateHelpfulness}
                  variant={viewer?.isHelpful ? 'secondary' : 'outline'}
                >
                  <ThumbsUp aria-hidden="true" className="size-4" strokeWidth={1.8} />
                  {pendingAction === 'helpfulness' ? 'Actualizando…' : 'Me sirvió'}
                </Button>
              </div>
              <p
                aria-live="polite"
                className="mt-3 text-xs leading-relaxed text-secondary-foreground"
              >
                {contextualViewerError
                  ? contextualViewerError
                  : isAuthLoading
                    ? 'Comprobando tu sesión…'
                    : !user
                      ? 'Iniciá sesión para guardar este material o indicar que te sirvió.'
                      : viewerIsLoading
                        ? 'Cargando tu actividad en este material…'
                        : isViewerError
                          ? 'No pudimos cargar tu actividad. Podés volver a abrir esta vista.'
                          : helpfulCount === 1
                            ? '1 persona indicó que le sirvió.'
                            : `${helpfulCount} personas indicaron que les sirvió.`}
              </p>
            </aside>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background px-4 py-3 text-sm text-secondary-foreground sm:px-5">
            <span>Publicado el {uploadedAt}</span>
            <Button asChild className="sm:hidden" size="sm" variant="outline">
              <a href={downloadHref} rel="noreferrer">
                <Download aria-hidden="true" className="size-4" strokeWidth={1.8} />
                Descargar
              </a>
            </Button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
