'use client';

import * as Dialog from '@radix-ui/react-dialog';
import {
  Bookmark,
  Download,
  FileText,
  MessageSquare,
  Pencil,
  Star,
  ThumbsUp,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useEffectEvent, useState } from 'react';

import { Button } from '@/components/ui/shadcn/button';
import { api } from '@/lib/api';
import { loginHrefForCurrentLocation } from '@/lib/auth-return-path';
import { getMaterialRatings } from '@/lib/material-community-client';
import { getPublicMaterial } from '@/lib/discovery-client';
import { getMaterialManagementCapabilities } from '@/lib/material-management';
import {
  getMaterialViewerState,
  setMaterialHelpfulness,
  setMaterialSaved,
} from '@/lib/material-viewer-client';
import { useAuthStore } from '@/stores/authStore';
import type { Material, MaterialRating, MaterialViewerState, Paginated } from '@/types/material';

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

type CommunityState =
  | { materialId: string; status: 'loading' }
  | { materialId: string; status: 'error' }
  | { materialId: string; ratings: Paginated<MaterialRating>; status: 'ready' };

const thirdPartyPreviewOrigins = new Set(['https://drive.google.com', 'https://docs.google.com']);
const communityRatingsLimit = 10;

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

type PreviewIdentity = {
  downloadHref: string;
  fileType: string;
  title: string;
};

/** Centred, self-contained failure state: file identity plus download stay in reach. */
function PreviewFallback({
  description,
  identity,
  onRetry,
  title,
}: {
  description: string;
  identity: PreviewIdentity;
  onRetry?: () => void;
  title: string;
}) {
  return (
    <div
      className="mx-auto flex w-full max-w-md flex-col items-center text-center"
      data-slot="material-preview-fallback"
    >
      <TriangleAlert aria-hidden="true" className="size-10 text-primary" strokeWidth={1.6} />
      <h2 className="mt-4 text-balance font-serif text-2xl font-bold leading-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 text-pretty text-sm leading-relaxed text-secondary-foreground">
        {description}
      </p>
      <p className="mt-5 flex max-w-full items-center gap-2 border border-border bg-background px-3 py-2 text-sm text-foreground">
        <FileText aria-hidden="true" className="size-4 shrink-0 text-primary" strokeWidth={1.8} />
        <span className="min-w-0 truncate font-bold">{identity.title}</span>
        {identity.fileType ? (
          <span className="shrink-0 font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-primary">
            {identity.fileType}
          </span>
        ) : null}
      </p>
      <div className="mt-5 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-center">
        <Button asChild>
          <a href={identity.downloadHref} rel="noreferrer">
            <Download aria-hidden="true" className="size-4" strokeWidth={1.8} />
            Descargar archivo
          </a>
        </Button>
        {onRetry ? (
          <Button onClick={onRetry} variant="outline">
            Reintentar vista previa
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function PreviewLoading() {
  return (
    <div aria-live="polite" className="mx-auto max-w-md text-center">
      <FileText aria-hidden="true" className="mx-auto size-10 text-primary" strokeWidth={1.6} />
      <p className="mt-4 font-serif text-2xl font-bold text-foreground sm:text-3xl">
        Preparando vista previa…
      </p>
    </div>
  );
}

/** A rendered document plus the manual escape hatch for frames that fail silently. */
function PreviewFrame({
  children,
  onReportFailure,
}: {
  children: ReactNode;
  onReportFailure: () => void;
}) {
  return (
    // Below `lg` the dialog stacks inside one scroll container with no free space, so rows
    // size to min-content: `auto` rows keep the iframe's min-height in that measure. A
    // `minmax(0,1fr)` row would report 0, let the frame overflow its section, and the
    // community aside would paint over the escape-hatch button.
    <div
      className="grid w-full grid-rows-[auto_auto] gap-3 lg:h-full lg:grid-rows-[minmax(0,1fr)_auto]"
      data-slot="material-preview-frame"
    >
      {children}
      <Button className="justify-self-end" onClick={onReportFailure} size="sm" variant="ghost">
        La vista previa no cargó
      </Button>
    </div>
  );
}

function CommunityRatingSummary({ average, count }: { average: string; count: number }) {
  const parsedAverage = Number(average);
  const hasRatings = count > 0 && Number.isFinite(parsedAverage);

  if (!hasRatings) {
    return <p className="text-sm text-secondary-foreground">Todavía no hay valoraciones.</p>;
  }

  const roundedAverage = Math.round(parsedAverage);
  const label = `${parsedAverage.toLocaleString('es-AR', { maximumFractionDigits: 1 })} de 5 estrellas según ${count} ${count === 1 ? 'valoración' : 'valoraciones'}`;

  return (
    <div
      aria-label={label}
      className="flex flex-wrap items-center gap-2 text-sm text-secondary-foreground"
    >
      <span aria-hidden="true" className="flex gap-0.5 text-primary">
        {[1, 2, 3, 4, 5].map((value) => (
          <Star
            className="size-4"
            fill={value <= roundedAverage ? 'currentColor' : 'none'}
            key={value}
            strokeWidth={1.8}
          />
        ))}
      </span>
      <span>
        {parsedAverage.toLocaleString('es-AR', { maximumFractionDigits: 1 })} · {count}{' '}
        {count === 1 ? 'valoración' : 'valoraciones'}
      </span>
    </div>
  );
}

function LocalPdfPreview({
  url,
  title,
  onError,
}: {
  url: string;
  title: string;
  onError: () => void;
}) {
  const [source, setSource] = useState<{ url: string; objectUrl: string } | null>(null);
  // Lift failures to the dialog so it renders the single, centred fallback.
  const reportFailure = useEffectEvent(() => onError());

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    async function load() {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('PDF unavailable');
        const blob = await response.blob();
        // Only a verified PDF may receive a same-origin object URL. Never embed
        // an HTML error response or a user-controlled active document this way.
        if (
          blob.type.split(';')[0] !== 'application/pdf' ||
          (await blob.slice(0, 5).text()) !== '%PDF-'
        ) {
          throw new Error('Invalid PDF response');
        }
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setSource({ url, objectUrl });
      } catch {
        if (!controller.signal.aborted) reportFailure();
      }
    }
    void load();
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (source?.url !== url) return <PreviewLoading />;
  return (
    <PreviewFrame onReportFailure={onError}>
      <iframe
        className="size-full min-h-[20rem] border-0 bg-background sm:min-h-[28rem]"
        src={source.objectUrl}
        title={title}
        onError={onError}
      />
    </PreviewFrame>
  );
}

function PreviewRegion({
  attempt,
  file,
  identity,
  materialState,
  onPreviewError,
  onRetry,
  previewFailed,
}: {
  attempt: number;
  file: MaterialPreviewDialogFile;
  identity: PreviewIdentity;
  materialState: MaterialState;
  onPreviewError: () => void;
  onRetry: () => void;
  previewFailed: boolean;
}) {
  if (materialState.status === 'loading') {
    return <PreviewLoading />;
  }

  if (materialState.status === 'error') {
    return (
      <PreviewFallback
        identity={identity}
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
        identity={identity}
        description="No pudimos cargar este archivo en el navegador. Podés reintentar o descargarlo para abrirlo en tu dispositivo."
        onRetry={onRetry}
        title="No pudimos cargar la vista previa"
      />
    );
  }

  if (preview.capability === 'UNSUPPORTED') {
    return (
      <PreviewFallback
        identity={identity}
        description="Este formato no admite una vista previa integrada. Podés descargar el archivo para abrirlo en tu dispositivo."
        title="Vista previa no compatible"
      />
    );
  }

  if (preview.capability === 'UNAVAILABLE' || !preview.canPreview || !previewUrl) {
    return (
      <PreviewFallback
        identity={identity}
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
    return new URL(previewUrl).origin === apiOrigin() ? (
      <LocalPdfPreview
        key={`${file.id}-${attempt}`}
        url={previewUrl}
        title={`Vista previa del archivo ${file.title}`}
        onError={onPreviewError}
      />
    ) : (
      <PreviewFrame onReportFailure={onPreviewError}>
        <iframe
          className="size-full min-h-[20rem] border-0 bg-background sm:min-h-[28rem]"
          key={`${file.id}-${attempt}`}
          onError={onPreviewError}
          referrerPolicy="no-referrer"
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
          src={previewUrl}
          title={`Vista previa del archivo ${file.title}`}
        />
      </PreviewFrame>
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
  const [communityState, setCommunityState] = useState<CommunityState>({
    materialId: file.id,
    status: 'loading',
  });
  const [failedPreviewId, setFailedPreviewId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [viewerError, setViewerError] = useState<{ materialId: string; message: string } | null>(
    null,
  );
  const [communityRequest, setCommunityRequest] = useState(0);
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

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    getMaterialRatings(file.id, { limit: communityRatingsLimit, page: 1 }).then(
      (ratings) => {
        if (!cancelled) setCommunityState({ materialId: file.id, ratings, status: 'ready' });
      },
      () => {
        if (!cancelled) setCommunityState({ materialId: file.id, status: 'error' });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [communityRequest, file.id, open]);

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
  const currentCommunityState =
    communityState.materialId === file.id
      ? communityState
      : { materialId: file.id, status: 'loading' as const };
  const viewer = currentViewerState.status === 'ready' ? currentViewerState.viewer : null;
  const material = currentMaterialState.status === 'ready' ? currentMaterialState.material : null;
  const viewerIsLoading = Boolean(user) && currentViewerState.status === 'loading';
  const isViewerError = currentViewerState.status === 'error';
  const previewFailed = failedPreviewId === file.id;
  const actionIsPending = pendingAction !== null;
  const actionIsDisabled = isAuthLoading || (Boolean(user) && (!viewer || actionIsPending));
  const contextualViewerError = viewerError?.materialId === file.id ? viewerError.message : null;

  const downloadHref = `${api.defaults.baseURL ?? ''}/materials/${encodeURIComponent(file.id)}/download`;
  const createdAt = new Date(material?.createdAt ?? file.createdAt);
  const uploadedAt = Number.isNaN(createdAt.getTime())
    ? 'Fecha no informada'
    : new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(createdAt);

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
  const commentCount =
    currentMaterialState.status === 'ready'
      ? currentMaterialState.material.commentSummary.count
      : null;
  const management = getMaterialManagementCapabilities(
    currentMaterialState.status === 'ready' ? currentMaterialState.material : null,
    user,
  );

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
          className="fixed inset-0 z-50 grid max-h-dvh grid-rows-[auto_minmax(0,1fr)] bg-card sm:grid-rows-[auto_minmax(0,1fr)_auto] text-card-foreground shadow-surface outline-none sm:inset-x-5 sm:inset-y-5 sm:border sm:border-border lg:inset-x-10 lg:inset-y-8"
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
                Vista previa: {material?.title ?? file.title}
              </Dialog.Title>
              <Dialog.Description
                className="mt-1 text-sm text-secondary-foreground"
                id="material-preview-description"
              >
                {material?.subject.name ?? subjectName} ·{' '}
                {(material?.fileType ?? file.fileType).toUpperCase()} ·{' '}
                {material?.academicYear ?? file.academicYear ?? 'Ciclo no informado'}
              </Dialog.Description>
            </div>
            {/* One download control, always in the fixed header: mobile never needs a bottom bar. */}
            <Button
              asChild
              className="min-w-11 shrink-0 px-2 sm:min-h-9 sm:px-3 sm:text-xs"
              variant="outline"
            >
              <a href={downloadHref} rel="noreferrer">
                <Download aria-hidden="true" className="size-4" strokeWidth={1.8} />
                <span className="sr-only sm:not-sr-only">Descargar</span>
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

          {/* Block flow below `lg`: as auto grid rows in a scroller without free space, the
              preview section would be clamped to its min-height and overlapped by the aside. */}
          <div
            className="min-h-0 overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:overflow-hidden"
            data-slot="material-preview-body"
          >
            <section
              aria-label={`Vista previa de ${file.title}`}
              className="grid min-h-[20rem] place-items-center border-b border-border bg-secondary p-5 sm:min-h-[28rem] sm:p-8 lg:min-h-0 lg:border-b-0 lg:border-r"
            >
              <PreviewRegion
                attempt={attempt}
                file={file}
                identity={{
                  downloadHref,
                  fileType: (material?.fileType ?? file.fileType).toUpperCase(),
                  title: material?.title ?? file.title,
                }}
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
              className="bg-background px-5 pt-5 pb-[max(4rem,env(safe-area-inset-bottom))] sm:p-6 lg:overflow-y-auto"
              data-slot="material-preview-community"
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
              <div className="mt-4 space-y-3 border-b border-border pb-4">
                <h3 className="font-semibold text-foreground">Valoraciones</h3>
                {currentMaterialState.status === 'ready' ? (
                  <CommunityRatingSummary
                    average={currentMaterialState.material.starSummary.average}
                    count={currentMaterialState.material.starSummary.count}
                  />
                ) : (
                  <p className="text-sm text-secondary-foreground">Cargando valoraciones…</p>
                )}
                <p className="text-xs leading-relaxed text-secondary-foreground">
                  Las estrellas reflejan opiniones de estudiantes y no una verificación académica.
                </p>
              </div>
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
              <div className="mt-6 border-t border-border pt-4">
                <h3 className="font-semibold text-foreground">
                  {commentCount === null ? 'Comentarios' : `Comentarios (${commentCount})`}
                </h3>
                {currentCommunityState.status === 'loading' ? (
                  <p className="mt-3 text-sm text-secondary-foreground">Cargando comentarios…</p>
                ) : currentCommunityState.status === 'error' ? (
                  <div className="mt-3 space-y-3 text-sm text-secondary-foreground">
                    <p>No pudimos cargar los comentarios.</p>
                    <Button
                      onClick={() => setCommunityRequest((value) => value + 1)}
                      size="sm"
                      variant="outline"
                    >
                      Reintentar comentarios
                    </Button>
                  </div>
                ) : currentCommunityState.ratings.data.length === 0 ? (
                  <p className="mt-3 text-sm text-secondary-foreground">
                    Todavía no hay comentarios sobre este archivo.
                  </p>
                ) : (
                  <ol className="mt-3 space-y-4" aria-label="Comentarios de estudiantes">
                    {currentCommunityState.ratings.data.map((rating) => (
                      <li className="border-l-2 border-primary/40 pl-3" key={rating.id}>
                        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs text-secondary-foreground">
                          <strong className="text-foreground">
                            {rating.user.displayName || rating.user.username}
                          </strong>
                          <time dateTime={rating.createdAt}>
                            {new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(
                              new Date(rating.createdAt),
                            )}
                          </time>
                        </div>
                        <CommunityRatingSummary average={String(rating.rating)} count={1} />
                        {rating.comment ? (
                          <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">
                            {rating.comment}
                          </p>
                        ) : (
                          <p className="mt-2 text-xs text-secondary-foreground">
                            Dejó una valoración sin comentario.
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              {management.canManage ? (
                <div className="mt-6 border-t border-border pt-4">
                  <h3 className="font-semibold text-foreground">Administración</h3>
                  <p className="mt-2 text-xs leading-relaxed text-secondary-foreground">
                    Las acciones de edición y eliminación se mantienen fuera de las acciones de
                    estudio.
                  </p>
                  <Button asChild className="mt-3" size="sm" variant="ghost">
                    <a href={`/materiales/${encodeURIComponent(file.id)}`}>
                      <Pencil aria-hidden="true" className="size-4" strokeWidth={1.8} />
                      Gestionar material
                    </a>
                  </Button>
                </div>
              ) : null}
              <p className="mt-6 border-t border-border pt-4 text-sm text-secondary-foreground sm:hidden">
                Publicado el {uploadedAt}
              </p>
            </aside>
          </div>

          <footer
            className="hidden items-center border-t border-border bg-background px-5 py-3 text-sm text-secondary-foreground sm:flex"
            data-slot="material-preview-footer"
          >
            <span>Publicado el {uploadedAt}</span>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
