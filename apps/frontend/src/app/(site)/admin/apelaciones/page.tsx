import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoadingState } from '@/components/ui/shadcn';
import { AppealsPanel } from '@/components/moderation/AppealsPanel';

export const metadata: Metadata = {
  title: 'Moderación · Apelaciones - DevsProject',
  description: 'Apelaciones de retiros y sanciones para resolver',
};

export default function ModerationAppealsPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 lg:px-10 xl:px-16">
      {/* The panel reads the facultad filter from the URL. */}
      <Suspense fallback={<LoadingState heading="Cargando moderación" />}>
        <AppealsPanel />
      </Suspense>
    </div>
  );
}
