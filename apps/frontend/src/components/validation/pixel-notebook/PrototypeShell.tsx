import Link from 'next/link';
import type { ReactNode } from 'react';
import { ScrollReset } from './ScrollReset';
import styles from './PrototypeShell.module.css';

export function PrototypeShell({ children }: { children: ReactNode }) {
  return (
    <div id="pixel-notebook-validation" className={styles.viewport}>
      <ScrollReset />
      <a className={styles.skipLink} href="#prototype-content">
        Saltar al contenido
      </a>
      <header className={styles.siteHeader}>
        <Link
          className={styles.brand}
          href="/validacion/pixel-notebook"
          aria-label="DevsProject, inicio del prototipo"
        >
          <span aria-hidden="true">DP</span>
          <strong>DevsProject</strong>
        </Link>

        <nav className={styles.primaryNav} aria-label="Navegación del prototipo">
          <Link href="/validacion/pixel-notebook/materiales">Materias</Link>
          <span aria-disabled="true">Reseñas</span>
          <Link href="/validacion/pixel-notebook/materiales">Materiales</Link>
          <span aria-disabled="true">Finales</span>
        </nav>

        <span className={styles.prototypeBadge}>Prototipo · datos sintéticos</span>
      </header>
      {/* The root layout owns the only <main> landmark. */}
      <div id="prototype-content" className={styles.main} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
