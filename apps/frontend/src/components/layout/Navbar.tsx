'use client';

import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, Shield, Upload, User, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/components/ui/shadcn/utils';
import { useAuthStore } from '@/stores/authStore';

const primaryNavigation = [
  { href: '/materias', label: 'Materias' },
  { href: '/resenas', label: 'Reseñas' },
  { href: '/materiales', label: 'Materiales' },
  { href: '/finales', label: 'Finales' },
] as const;

function isCurrentRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavigationLinksProps = {
  onNavigate?: () => void;
  pathname: string;
  variant: 'desktop' | 'mobile';
};

function NavigationLinks({ onNavigate, pathname, variant }: NavigationLinksProps) {
  return (
    <ul className={cn(variant === 'desktop' ? 'flex items-center gap-1' : 'grid gap-1')}>
      {primaryNavigation.map(({ href, label }) => {
        const current = isCurrentRoute(pathname, href);

        return (
          <li key={href}>
            <Link
              aria-current={current ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-11 items-center border-b-2 border-transparent px-3 font-sans text-sm font-bold text-muted-foreground outline-none transition-colors hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                variant === 'mobile' && 'w-full border px-4 text-foreground',
                current &&
                  'border-primary text-primary underline decoration-2 underline-offset-8 [text-decoration-skip-ink:none]',
                current && variant === 'mobile' && 'bg-accent underline-offset-4',
              )}
              href={href}
              onClick={onNavigate}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = async () => {
    await logout();
    closeMobileMenu();
  };

  const accountLabel = user?.displayName ?? user?.username;
  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex min-h-[72px] w-full max-w-[1180px] items-center justify-between gap-3 px-3 sm:px-6">
        <Link
          aria-label="DevsProject, inicio"
          className="inline-flex min-h-11 items-center gap-2 font-serif text-xl font-bold text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          href="/"
        >
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center border border-primary bg-primary font-mono text-xs font-bold text-primary-foreground shadow-control"
          >
            DP
          </span>
          <span>DevsProject</span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden lg:block">
          <NavigationLinks pathname={pathname} variant="desktop" />
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild size="sm" variant="outline">
            <Link href="/materiales/nuevo">
              <Upload aria-hidden="true" className="size-4" />
              Subir material
            </Link>
          </Button>
          {user ? (
            <>
              <Link
                className="inline-flex min-h-11 items-center gap-2 px-2 font-sans text-sm font-bold text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                href="/profile/me"
              >
                <User aria-hidden="true" className="size-4" />
                <span className="max-w-28 truncate">{accountLabel}</span>
              </Link>
              {canManage ? (
                <Button asChild size="sm" variant="ghost">
                  <Link href="/admin">
                    <Shield aria-hidden="true" className="size-4" />
                    Admin
                  </Link>
                </Button>
              ) : null}
              <Button onClick={handleLogout} size="sm" variant="ghost">
                <LogOut aria-hidden="true" className="size-4" />
                Salir
              </Button>
            </>
          ) : (
            <Button asChild size="sm" variant="ghost">
              <Link href="/auth/login">Iniciar sesión</Link>
            </Button>
          )}
        </div>

        <Dialog.Root onOpenChange={setMobileMenuOpen} open={mobileMenuOpen}>
          <Dialog.Trigger asChild>
            <Button
              aria-label="Abrir navegación"
              className="lg:hidden"
              size="icon"
              variant="outline"
            >
              <Menu aria-hidden="true" className="size-5" />
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/35 lg:hidden" />
            <Dialog.Content className="fixed inset-x-0 top-0 z-50 grid max-h-dvh grid-rows-[auto_minmax(0,1fr)] border-b border-border bg-background shadow-surface outline-none lg:hidden">
              <header className="flex min-h-[72px] items-center justify-between border-b border-border px-3 sm:px-6">
                <div>
                  <Dialog.Title className="font-serif text-2xl font-bold text-foreground">
                    Menú principal
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Navegación y acciones de cuenta de DevsProject.
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <Button aria-label="Cerrar navegación" size="icon" variant="ghost">
                    <X aria-hidden="true" className="size-5" />
                  </Button>
                </Dialog.Close>
              </header>
              <div className="grid content-start gap-6 overflow-y-auto px-3 py-5 sm:px-6">
                <nav aria-label="Navegación principal">
                  <NavigationLinks
                    onNavigate={closeMobileMenu}
                    pathname={pathname}
                    variant="mobile"
                  />
                </nav>
                <div className="grid gap-3 border-t border-border pt-5">
                  <Button asChild className="w-full" onClick={closeMobileMenu}>
                    <Link href="/materiales/nuevo">
                      <Upload aria-hidden="true" className="size-4" />
                      Subir material
                    </Link>
                  </Button>
                  {user ? (
                    <>
                      <Button
                        asChild
                        className="w-full"
                        onClick={closeMobileMenu}
                        variant="outline"
                      >
                        <Link href="/profile/me">
                          <User aria-hidden="true" className="size-4" />
                          {accountLabel}
                        </Link>
                      </Button>
                      {canManage ? (
                        <Button
                          asChild
                          className="w-full"
                          onClick={closeMobileMenu}
                          variant="outline"
                        >
                          <Link href="/admin">
                            <Shield aria-hidden="true" className="size-4" />
                            Administración
                          </Link>
                        </Button>
                      ) : null}
                      <Button className="w-full" onClick={handleLogout} variant="ghost">
                        <LogOut aria-hidden="true" className="size-4" />
                        Cerrar sesión
                      </Button>
                    </>
                  ) : (
                    <Button asChild className="w-full" onClick={closeMobileMenu} variant="outline">
                      <Link href="/auth/login">Iniciar sesión</Link>
                    </Button>
                  )}
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}
