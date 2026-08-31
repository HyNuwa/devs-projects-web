'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Download, FileText, MessageSquare, X } from 'lucide-react';

import { Button } from '@/components/ui/shadcn/button';
import { api } from '@/lib/api';

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
  const downloadHref = `${api.defaults.baseURL ?? ''}/materials/${encodeURIComponent(file.id)}/download`;
  const uploadedAt = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(
    new Date(file.createdAt),
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
              <a href={downloadHref}>
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
              <div className="max-w-md text-center">
                <FileText
                  aria-hidden="true"
                  className="mx-auto size-10 text-primary"
                  strokeWidth={1.6}
                />
                <h2 className="mt-4 font-serif text-3xl font-bold text-foreground">{file.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-secondary-foreground">
                  La vista previa del contenido se muestra en este espacio sin sacar a la persona de
                  la lista de materiales.
                </p>
              </div>
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
            </aside>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background px-4 py-3 text-sm text-secondary-foreground sm:px-5">
            <span>Publicado el {uploadedAt}</span>
            <Button asChild className="sm:hidden" size="sm" variant="outline">
              <a href={downloadHref}>
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
