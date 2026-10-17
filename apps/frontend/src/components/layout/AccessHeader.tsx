'use client';

import Link from 'next/link';
import { useSelectedLayoutSegments } from 'next/navigation';

import { Button } from '@/components/ui/shadcn/button';

import { BrandMark } from './BrandMark';

/** Reduced header for /auth/**: the logo and a link to the complementary access action. */
export function AccessHeader() {
  const onRegister = useSelectedLayoutSegments().includes('register');

  return (
    <header className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-3 px-4 lg:h-[68px] lg:px-10 xl:px-16">
      <BrandMark />
      <div className="flex items-center gap-3.5 text-sm font-semibold text-foreground/80">
        <span className="hidden sm:inline">
          {onRegister ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}
        </span>
        <Button asChild className="border-foreground" size="sm" variant="outline">
          {onRegister ? (
            <Link href="/auth/login">Ingresar</Link>
          ) : (
            <Link href="/auth/register">Crear cuenta</Link>
          )}
        </Button>
      </div>
    </header>
  );
}
