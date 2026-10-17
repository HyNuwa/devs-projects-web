import Link from 'next/link';

import { primaryDestinations, uploadDestination } from './navigation';

const linkClassName =
  'inline-flex min-h-11 items-center rounded-sm outline-none hover:text-link focus-visible:ring-[3px] focus-visible:ring-ring';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t-[1.5px] border-foreground/10 font-sans text-foreground">
      <div className="mx-auto grid w-full max-w-[1440px] gap-6 px-4 py-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start lg:px-10 xl:px-16">
        <div>
          <Link
            className="inline-flex min-h-11 items-center rounded-sm text-xl font-extrabold tracking-[-0.035em] outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
            href="/"
          >
            DevsProject
          </Link>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
            Parciales, apuntes y experiencias de la comunidad FI · UNJu. Entre todos, llegamos más
            lejos.
          </p>
        </div>
        <nav aria-label="Explorar DevsProject">
          <ul className="grid grid-cols-2 gap-x-8 text-sm font-semibold sm:flex sm:gap-x-6">
            {primaryDestinations.map(({ href, id, label }) => (
              <li key={id}>
                <Link className={linkClassName} href={href}>
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link className={`${linkClassName} text-link`} href={uploadDestination.href}>
                Subir material
              </Link>
            </li>
            <li>
              <Link className={linkClassName} href="/normas">
                Normas
              </Link>
            </li>
          </ul>
        </nav>
        <p className="border-t border-line pt-5 text-xs text-muted-foreground sm:col-span-2">
          © {new Date().getFullYear()} DevsProject
        </p>
      </div>
    </footer>
  );
}
