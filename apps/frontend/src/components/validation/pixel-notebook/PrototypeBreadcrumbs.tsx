import Link from 'next/link';
import { ChevronRight, FolderOpen } from 'lucide-react';
import styles from './PrototypeShell.module.css';

export type PrototypeBreadcrumb = {
  label: string;
  href?: string;
};

export function PrototypeBreadcrumbs({ items }: { items: PrototypeBreadcrumb[] }) {
  return (
    <nav className={styles.breadcrumbs} aria-label="Ruta de materiales">
      <FolderOpen aria-hidden="true" size={16} />
      <ol>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`}>
              {index > 0 ? <ChevronRight aria-hidden="true" size={15} /> : null}
              {item.href && !isCurrent ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span aria-current={isCurrent ? 'page' : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
