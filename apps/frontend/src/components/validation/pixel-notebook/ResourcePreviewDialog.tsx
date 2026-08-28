'use client';

import {
  Bookmark,
  Download,
  FileText,
  MessageSquare,
  Star,
  ThumbsUp,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ValidationResource } from './data';
import styles from './PrototypeShell.module.css';

type ResourcePreviewDialogProps = {
  resource: ValidationResource;
  closeHref: string;
};

export function ResourcePreviewDialog({ resource, closeHref }: ResourcePreviewDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [helpful, setHelpful] = useState(false);

  const dismiss = useCallback(() => {
    dialogRef.current?.close();
    router.replace(closeHref, { scroll: false });
  }, [closeHref, router]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
      }
    };

    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    window.addEventListener('keydown', handleEscape, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleEscape, { capture: true });
      if (opener instanceof HTMLElement) {
        opener.focus();
      }
    };
  }, [dismiss]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.resourceDialog}
      aria-labelledby="resource-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          dismiss();
        }
      }}
    >
      <div className={styles.dialogSurface}>
        <header className={styles.dialogHeader}>
          <span className={styles.dialogFileType}>{resource.type}</span>
          <div>
            <h2 id="resource-dialog-title">{resource.fileName}</h2>
            <p>
              {resource.subject} · {resource.fileSize}
            </p>
          </div>
          <a href="/validacion/pixel-notebook/parcial-algoritmos.txt" download>
            <Download aria-hidden="true" size={17} />
            Descargar
          </a>
          <button type="button" aria-label="Cerrar vista previa" onClick={dismiss}>
            <X aria-hidden="true" size={21} />
          </button>
        </header>

        <div className={styles.dialogWorkspace}>
          <section className={styles.dialogPreview} aria-label="Vista previa del archivo">
            {previewFailed ? (
              <div className={styles.previewFallback} role="status">
                <TriangleAlert aria-hidden="true" size={32} />
                <h3>No pudimos cargar la vista previa</h3>
                <p>Podés reintentar o descargar el archivo para abrirlo en tu dispositivo.</p>
                <button type="button" onClick={() => setPreviewFailed(false)}>
                  Reintentar
                </button>
              </div>
            ) : (
              <div className={styles.previewDocument}>
                <div className={styles.documentTopline}>
                  <span>Vista previa sintética · página 1 de 4</span>
                  <button type="button" onClick={() => setPreviewFailed(true)}>
                    Simular fallo
                  </button>
                </div>
                <p className={styles.documentKicker}>
                  {resource.subject} · {resource.type}
                </p>
                <h3>{resource.title}</h3>
                <p>{resource.preview}</p>
                <ol>
                  <li>Compará la complejidad temporal de búsqueda lineal y binaria.</li>
                  <li>Implementá una pila usando una lista simplemente enlazada.</li>
                  <li>Explicá cuándo una operación tiene costo amortizado.</li>
                </ol>
                <p className={styles.previewDisclaimer}>
                  <FileText aria-hidden="true" size={15} />
                  Contenido sintético preparado solo para esta validación.
                </p>
              </div>
            )}
          </section>

          <aside className={styles.dialogComments} aria-labelledby="comments-title">
            <div className={styles.dialogCommentsHeader}>
              <MessageSquare aria-hidden="true" size={18} />
              <h3 id="comments-title">Comentarios ({resource.comments.length})</h3>
            </div>
            <div className={styles.dialogSignals} aria-label="Acciones y señales del archivo">
              <span
                className={styles.dialogRating}
                aria-label={`${resource.rating} de 5 estrellas, ${resource.ratingCount} valoraciones`}
              >
                <Star aria-hidden="true" size={17} />
                {resource.rating} · {resource.ratingCount} valoraciones
              </span>
              <button
                type="button"
                aria-pressed={saved}
                onClick={() => setSaved((value) => !value)}
              >
                <Bookmark aria-hidden="true" fill={saved ? 'currentColor' : 'none'} size={17} />
                {saved ? 'Guardado' : 'Guardar'}
              </button>
              <button
                type="button"
                aria-pressed={helpful}
                onClick={() => setHelpful((value) => !value)}
              >
                <ThumbsUp aria-hidden="true" fill={helpful ? 'currentColor' : 'none'} size={17} />
                Me sirvió · {resource.helpfulCount + (helpful ? 1 : 0)}
              </button>
            </div>
            <div className={styles.commentList}>
              {resource.comments.length > 0 ? (
                resource.comments.map((comment) => (
                  <article key={comment.id}>
                    <strong>{comment.author}</strong>
                    <time>{comment.date}</time>
                    <p>{comment.body}</p>
                  </article>
                ))
              ) : (
                <p className={styles.commentsEmpty}>
                  Todavía no hay comentarios sobre este archivo.
                </p>
              )}
            </div>
            <button className={styles.commentLogin} type="button">
              Iniciá sesión para comentar
            </button>
          </aside>
        </div>

        <footer className={styles.dialogFooter}>
          <span>{resource.fileSize}</span>
          <span>{resource.uploadedAt}</span>
          <span>Presioná Esc o hacé clic afuera para cerrar</span>
        </footer>
      </div>
    </dialog>
  );
}
