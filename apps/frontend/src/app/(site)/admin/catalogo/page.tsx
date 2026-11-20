import type { Metadata } from 'next';
import { Suspense } from 'react';

import { CatalogPanel } from '@/components/catalog/CatalogPanel';
import { LoadingState } from '@/components/ui/shadcn';

export const metadata: Metadata = {
  title: 'Moderación · Catálogo - DevsProject',
  description: 'Universidades, facultades, carreras y materias del catálogo',
};

export default function CatalogPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 lg:px-10 xl:px-16">
      {/* The header reads the facultad filter from the URL. */}
      <Suspense fallback={<LoadingState heading="Cargando catálogo" />}>
        <CatalogPanel />
      </Suspense>
    </div>
  );
}
