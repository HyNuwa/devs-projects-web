'use client';

import Link from 'next/link';

import { Button, ErrorState } from '@/components/ui/shadcn';

export default function ExperienciasMateriaError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-3 py-16 sm:px-6">
      <ErrorState
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={reset}>Reintentar</Button>
            <Button asChild variant="outline">
              <Link href="/experiencias">Volver a Experiencias</Link>
            </Button>
          </div>
        }
        description="La materia no pudo cargarse ahora. Intentá de nuevo en un momento."
        heading="No pudimos cargar la materia"
      />
    </div>
  );
}
