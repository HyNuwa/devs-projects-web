import Link from 'next/link';

import { Button, EmptyState } from '@/components/ui/shadcn';

export default function ExperienciasMateriaNotFound() {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-3 py-16 sm:px-6">
      <EmptyState
        action={
          <Button asChild variant="outline">
            <Link href="/experiencias">Volver a Experiencias</Link>
          </Button>
        }
        description="Esa materia no existe o cambió de código. Buscala desde las experiencias."
        heading="Materia no encontrada"
      />
    </div>
  );
}
