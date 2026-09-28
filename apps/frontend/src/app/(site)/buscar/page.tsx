import { Suspense } from 'react';

import { MaterialSearchPage } from '@/components/discovery/MaterialSearchPage';

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div
          aria-live="polite"
          className="min-h-[calc(100dvh-4.5rem)] p-5 text-secondary-foreground"
          role="status"
        >
          Cargando búsqueda…
        </div>
      }
    >
      <MaterialSearchPage />
    </Suspense>
  );
}
