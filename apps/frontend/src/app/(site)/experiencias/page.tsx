import { Suspense } from 'react';
import type { Metadata } from 'next';

import { ExperiencesLanding } from '@/components/experiences/ExperiencesLanding';

export const metadata: Metadata = {
  title: 'Experiencias - DevsProject',
  description: 'Reseñas de cursada y experiencias de final escritas por estudiantes.',
};

export default function ExperienciasPage() {
  return (
    <Suspense
      fallback={
        <div
          aria-live="polite"
          className="min-h-[calc(100dvh-4.5rem)] p-5 text-secondary-foreground"
          role="status"
        >
          Cargando experiencias…
        </div>
      }
    >
      <ExperiencesLanding />
    </Suspense>
  );
}
