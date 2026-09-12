import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background font-sans text-foreground">
      <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center font-serif text-2xl font-bold"
            >
              DevsProject
            </Link>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-secondary-foreground">
              Parciales, apuntes y experiencias de la comunidad FI · UNJu.
            </p>
          </div>
          <nav
            aria-label="Explorar DevsProject"
            className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm"
          >
            <Link className="inline-flex min-h-11 items-center hover:underline" href="/materias">
              Materias
            </Link>
            <Link className="inline-flex min-h-11 items-center hover:underline" href="/resenas">
              Reseñas
            </Link>
            <Link className="inline-flex min-h-11 items-center hover:underline" href="/materiales">
              Materiales
            </Link>
            <Link className="inline-flex min-h-11 items-center hover:underline" href="/finales">
              Finales
            </Link>
            <Link
              className="inline-flex min-h-11 items-center font-bold text-primary hover:underline"
              href="/materiales/nuevo"
            >
              Subir material
            </Link>
            <Link className="inline-flex min-h-11 items-center hover:underline" href="/foro">
              Foro
            </Link>
          </nav>
        </div>
        <p className="mt-8 border-t border-line pt-5 text-xs text-secondary-foreground">
          &copy; {new Date().getFullYear()} DevsProject
        </p>
      </div>
    </footer>
  );
}
