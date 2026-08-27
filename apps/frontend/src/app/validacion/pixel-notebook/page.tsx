import Link from 'next/link';
import { BookOpenText, FileCheck2, FileText, NotebookPen } from 'lucide-react';
import { HeroArtwork } from '@/components/validation/pixel-notebook/HeroArtwork';
import { PrototypeSearch } from '@/components/validation/pixel-notebook/PrototypeSearch';
import styles from '@/components/validation/pixel-notebook/PrototypeShell.module.css';

const shortcuts = [
  { label: 'Parciales', query: 'parcial', Icon: FileText },
  { label: 'Finales', query: 'final', Icon: FileCheck2 },
  { label: 'Apuntes', query: 'apuntes', Icon: NotebookPen },
  { label: 'Resúmenes', query: 'resumen', Icon: BookOpenText },
];

export default function PixelNotebookValidationHomePage() {
  return (
    <div className={styles.homePage}>
      <section className={styles.homeHero} aria-labelledby="validation-home-title">
        <HeroArtwork />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Comunidad FI · UNJu</p>
          <h1 id="validation-home-title" className={styles.displayTitle}>
            Tu <em>mochila de estudio</em>.
          </h1>
          <p className={styles.lead}>
            Reuní parciales, apuntes y experiencias para preparar una materia con una ruta clara.
          </p>

          <PrototypeSearch />

          <nav className={styles.shortcutList} aria-label="Atajos por tipo de recurso">
            {shortcuts.map(({ label, query, Icon }) => (
              <Link
                key={label}
                className={styles.shortcut}
                href={`/validacion/pixel-notebook/resultados?q=${query}`}
              >
                <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <aside className={styles.validationNote} aria-label="Alcance del prototipo">
        <span className={styles.kaomoji} aria-hidden="true">
          (•̀ᴗ•́)و
        </span>
        <div>
          <strong>Recorrido de prueba</strong>
          <p>
            Los materiales y las acciones son sintéticos. Evaluamos comprensión, no contenido real.
          </p>
        </div>
      </aside>
    </div>
  );
}
