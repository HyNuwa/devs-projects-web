import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoadingState } from '@/components/ui/shadcn';
import { UsersPanel } from '@/components/moderation/UsersPanel';

export const metadata: Metadata = {
  title: 'Moderación · Usuarios - DevsProject',
  description: 'Cuentas con sanciones, sugerencias o revisión previa',
};

export default function ModerationUsersPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 lg:px-10 xl:px-16">
      {/* The panel reads the facultad filter from the URL. */}
      <Suspense fallback={<LoadingState heading="Cargando moderación" />}>
        <UsersPanel />
      </Suspense>
    </div>
  );
}
