import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoadingState } from '@/components/ui/shadcn';
import { HistoryPanel } from '@/components/moderation/HistoryPanel';

export const metadata: Metadata = {
  title: 'Moderación · Historial - DevsProject',
  description: 'Historial de moderación de solo lectura',
};

export default function ModerationHistoryPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 lg:px-10 xl:px-16">
      {/* The panel reads the facultad filter from the URL. */}
      <Suspense fallback={<LoadingState heading="Cargando moderación" />}>
        <HistoryPanel />
      </Suspense>
    </div>
  );
}
