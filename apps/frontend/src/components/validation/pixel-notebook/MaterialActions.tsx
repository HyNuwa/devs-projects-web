'use client';

import { Bookmark, Download, Eye, FileText, ThumbsUp, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import styles from './PrototypeShell.module.css';

export function MaterialActions({ initialHelpfulCount }: { initialHelpfulCount: number }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [helpful, setHelpful] = useState(false);

  return (
    <section className={styles.materialWorkspace} aria-label="Vista previa y acciones del material">
      <div className={styles.previewRegion} id="vista-previa">
        {previewFailed ? (
          <div className={styles.previewFallback} role="status">
            <TriangleAlert aria-hidden="true" size={30} />
            <h2>La vista previa no está disponible</h2>
            <p>
              El contexto y la revisión siguen visibles. Podés descargar el archivo para abrirlo.
            </p>
            <button type="button" onClick={() => setPreviewFailed(false)}>
              Reintentar vista previa
            </button>
          </div>
        ) : previewOpen ? (
          <div className={styles.previewDocument}>
            <div className={styles.documentTopline}>
              <span>Vista previa · página 1 de 4</span>
              <button type="button" onClick={() => setPreviewFailed(true)}>
                Simular fallo
              </button>
            </div>
            <p className={styles.documentKicker}>Algoritmos y Estructuras de Datos · Parcial 1</p>
            <h2>Complejidad, listas y pilas</h2>
            <ol>
              <li>Compará la complejidad temporal de búsqueda lineal y binaria.</li>
              <li>Implementá una pila usando una lista simplemente enlazada.</li>
              <li>Explicá cuándo una operación tiene costo amortizado.</li>
            </ol>
            <p className={styles.previewDisclaimer}>
              Contenido sintético preparado solo para esta validación.
            </p>
          </div>
        ) : (
          <div className={styles.previewEmpty}>
            <FileText aria-hidden="true" size={42} strokeWidth={1.4} />
            <h2>Vista previa del parcial</h2>
            <p>Abrila para revisar el contenido sin perder el contexto ni las acciones.</p>
          </div>
        )}
      </div>

      <aside className={styles.actionRail} aria-label="Acciones del material">
        <button
          className={styles.primaryButton}
          type="button"
          aria-controls="vista-previa"
          aria-expanded={previewOpen && !previewFailed}
          onClick={() => {
            setPreviewOpen(true);
            setPreviewFailed(false);
          }}
        >
          <Eye aria-hidden="true" size={18} />
          Abrir vista previa
        </button>
        <a
          className={styles.secondaryButton}
          href="/validacion/pixel-notebook/parcial-algoritmos.txt"
          download
        >
          <Download aria-hidden="true" size={18} />
          Descargar
        </a>
        <button
          className={styles.secondaryButton}
          type="button"
          aria-pressed={saved}
          onClick={() => setSaved((current) => !current)}
        >
          <Bookmark aria-hidden="true" fill={saved ? 'currentColor' : 'none'} size={18} />
          {saved ? 'Guardado' : 'Guardar'}
        </button>

        <div className={styles.actionDivider} />

        <p>Señal de utilidad</p>
        <button
          className={styles.helpfulButton}
          type="button"
          aria-pressed={helpful}
          onClick={() => setHelpful((current) => !current)}
        >
          <ThumbsUp aria-hidden="true" fill={helpful ? 'currentColor' : 'none'} size={17} />
          Me sirvió · {initialHelpfulCount + (helpful ? 1 : 0)}
        </button>
        <small>No modifica la revisión ni las estrellas.</small>
      </aside>
    </section>
  );
}
