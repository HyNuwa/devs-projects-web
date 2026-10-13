import type { Metadata } from 'next';
import { Suspense } from 'react';

import { SubjectHub } from '@/components/subjects/SubjectHub';

export const metadata: Metadata = {
  title: 'Materia - DevsProject',
  description: 'Reseñas de cursada, experiencias de final y materiales de la materia',
};

export default async function MateriaPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  // The hub reads the carrera and the materia search from the URL.
  return (
    <Suspense fallback={null}>
      <SubjectHub code={codigo} key={codigo} />
    </Suspense>
  );
}
