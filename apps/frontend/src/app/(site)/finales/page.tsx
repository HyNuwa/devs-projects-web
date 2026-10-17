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
        <div
          aria-live="polite"
          className="min-h-[calc(100dvh-4.5rem)] p-5 text-secondary-foreground"
          role="status"
        >
          Cargando experiencias de final…
        </div>
      }
    >
      <ExamExperienceDiscoveryPage />
    </Suspense>
  );
}
