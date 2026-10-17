import type { Metadata } from 'next';
import { Suspense } from 'react';

import { CasesPanel } from '@/components/moderation/CasesPanel';
import { LoadingState } from '@/components/ui/shadcn';

export const metadata: Metadata = {
  title: 'Moderación · Casos - DevsProject',
  description: 'Casos de moderación: ocultos, revisión previa y reportados',
};

export default function ModerationCasesPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 lg:px-10 xl:px-16">
      <Suspense fallback={<LoadingState heading="Cargando moderación" />}>
        <CasesPanel />
      </Suspense>
    </div>
  );
}
