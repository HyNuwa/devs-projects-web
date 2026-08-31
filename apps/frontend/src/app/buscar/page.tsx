import { Suspense } from 'react';

import { MaterialSearchPage } from '@/components/discovery/MaterialSearchPage';

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main
          aria-live="polite"
          className="min-h-[calc(100dvh-4.5rem)] bg-background p-5 text-secondary-foreground"
        >
          Cargando búsqueda…
        </main>
      }
    >
      <MaterialSearchPage />
    </Suspense>
  );
}
