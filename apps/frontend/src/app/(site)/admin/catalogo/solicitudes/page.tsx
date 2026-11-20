import type { Metadata } from 'next';
import { Suspense } from 'react';

import { RequestsPanel } from '@/components/catalog/RequestsPanel';
import { LoadingState } from '@/components/ui/shadcn';

export const metadata: Metadata = {
  title: 'Moderación · Solicitudes de carrera - DevsProject',
  description: 'Las carreras que piden los estudiantes',
};

export default function CareerRequestsPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 lg:px-10 xl:px-16">
      <Suspense fallback={<LoadingState heading="Cargando solicitudes" />}>
        <RequestsPanel />
      </Suspense>
    </div>
  );
}
