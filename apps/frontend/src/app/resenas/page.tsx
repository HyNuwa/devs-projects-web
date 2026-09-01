import { Suspense } from 'react';
import type { Metadata } from 'next';

import { CourseReviewDiscoveryPage } from '@/components/community/CourseReviewDiscoveryPage';

export const metadata: Metadata = {
  title: 'Reseñas de cursada - DevsProject',
  description: 'Explorá experiencias de cursada publicadas por la comunidad.',
};

export default function ReviewsPage() {
  return (
    <Suspense
      fallback={
        <main
          aria-live="polite"
          className="min-h-[calc(100dvh-4.5rem)] bg-background p-5 text-secondary-foreground"
        >
          Cargando reseñas…
        </main>
      }
    >
      <CourseReviewDiscoveryPage />
    </Suspense>
  );
}
