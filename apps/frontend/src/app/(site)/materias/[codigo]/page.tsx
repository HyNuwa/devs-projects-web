import type { Metadata } from 'next';
import { Suspense } from 'react';

import { SubjectHub } from '@/components/subjects/SubjectHub';
import { redirectOldSubjectCode } from '@/lib/catalog-client';

export const metadata: Metadata = {
  title: 'Materia - DevsProject',
  description: 'Reseñas de cursada, experiencias de final y materiales de la materia',
};

type Props = {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MateriaPage({ params, searchParams }: Props) {
  const { codigo } = await params;
  const query = new URLSearchParams(
    Object.entries(await searchParams).flatMap(([key, value]) =>
      (Array.isArray(value) ? value : value === undefined ? [] : [value]).map((v) => [key, v]),
    ),
  ).toString();
  await redirectOldSubjectCode(codigo, query);
  // The hub reads the carrera and the materia search from the URL.
  return (
    <Suspense fallback={null}>
      <SubjectHub code={codigo} key={codigo} />
    </Suspense>
  );
}
