import Link from 'next/link';

import { BottomBar } from '@/components/layout/BottomBar';
import { MainContent } from '@/components/layout/MainContent';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { Button } from '@/components/ui/shadcn/button';

// Unknown URLs render outside every route group, so this page brings the full shell.
export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col pb-[calc(62px+env(safe-area-inset-bottom))] lg:pb-0">
      <SiteHeader />
      <MainContent className="mx-auto grid w-full max-w-2xl content-center gap-4 px-4 py-16 text-center">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.15em] text-link">Error 404</p>
        <h1 className="text-4xl font-extrabold tracking-[-0.05em] text-foreground sm:text-5xl">
          Esta página no existe.
        </h1>
        <p className="text-muted-foreground">
          Puede que el enlace esté roto o que la página se haya movido.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Ir al inicio</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/materias">Ver materias</Link>
          </Button>
        </div>
      </MainContent>
      <SiteFooter />
      <BottomBar />
    </div>
  );
}
