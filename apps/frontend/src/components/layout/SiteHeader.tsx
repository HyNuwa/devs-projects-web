'use client';

import { ArrowUp, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/components/ui/shadcn/utils';
import { useAuthStore } from '@/stores/authStore';

import { AccountMenu } from './AccountMenu';
import { BrandMark } from './BrandMark';
import { currentDestination, primaryDestinations } from './navigation';

/**
 * Site header from the canvas. Desktop (lg and up) and compact layouts are both
 * rendered and switched with CSS, so the server markup never depends on the viewport.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const current = currentDestination(pathname);

  return (
    <header className="relative z-30">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-3 px-4 lg:h-[68px] lg:gap-8 lg:px-10 xl:px-16">
        <div className="flex min-w-0 items-center gap-10">
          <BrandMark />

          <nav aria-label="Navegación principal" className="hidden lg:block">
            <ul className="flex items-center gap-6">
              {primaryDestinations.map(({ href, id, label }) => {
                const isCurrent = current === id;
                return (
                  <li key={id}>
                    <Link
                      aria-current={isCurrent ? 'page' : undefined}
                      className={cn(
                        'inline-flex min-h-11 items-center rounded-sm text-[0.9375rem] outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                        isCurrent
                          ? 'font-bold text-link'
                          : 'font-medium text-foreground/80 hover:text-link',
                      )}
                      href={href}
                    >
                      <span
                        className={cn(
                          'border-b-2 pb-[3px]',
                          isCurrent ? 'border-link' : 'border-transparent',
                        )}
                      >
                        {label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          <Link
            aria-label="Buscar"
            className="inline-grid size-11 place-items-center rounded-xl border-[1.5px] border-foreground bg-card text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:border-transparent lg:bg-transparent lg:hover:bg-card"
            href="/buscar"
          >
            <Search aria-hidden="true" className="size-5" strokeWidth={2.1} />
          </Link>

          {user ? null : (
            <>
              <Button asChild className="hidden lg:inline-flex" variant="outline">
                <Link href="/auth/login">Iniciar sesión</Link>
              </Button>
              <Button asChild className="border-foreground lg:hidden" size="sm" variant="outline">
                <Link href="/auth/login">Ingresar</Link>
              </Button>
            </>
          )}

          <Button asChild className="hidden lg:inline-flex">
            <Link href="/materiales/nuevo">
              <ArrowUp aria-hidden="true" className="size-[17px]" strokeWidth={2.3} />
              Subir material
            </Link>
          </Button>

          {user ? (
            <>
              <div className="hidden lg:block">
                <AccountMenu user={user} variant="desktop" />
              </div>
              <div className="lg:hidden">
                <AccountMenu user={user} variant="mobile" />
              </div>
            </>
          ) : null}

          <div
            aria-hidden="true"
            className="ml-2.5 hidden text-right text-[0.656rem] font-bold leading-[1.35] tracking-[0.15em] text-foreground xl:block"
          >
            UNJU
            <br />
            FI
            <div className="mt-[3px] h-0.5 bg-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
}
