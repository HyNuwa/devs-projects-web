import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ExamExperienceDiscoveryPage } from '@/components/community/ExamExperienceDiscoveryPage';

export const metadata: Metadata = {
  title: 'Experiencias de final - DevsProject',
  description: 'Explorá mesas de final compartidas por la comunidad.',
};

export default function FinalsPage() {
  return (
    <Suspense
      fallback={
        <main
          aria-live="polite"
          className="min-h-[calc(100dvh-4.5rem)] bg-background p-5 text-secondary-foreground"
        >
          Cargando experiencias de final…
        </main>
      }
    >
      <ExamExperienceDiscoveryPage />
    </Suspense>
  );
}
