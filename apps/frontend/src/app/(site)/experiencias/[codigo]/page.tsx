import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { SubjectExperiencesPage } from '@/components/experiences/SubjectExperiencesPage';
import { getSubjectPage, redirectOldSubjectCode } from '@/lib/catalog-client';

export const metadata: Metadata = {
  title: 'Experiencias de la materia - DevsProject',
  description: 'Reseñas de cursada y experiencias de final de la materia',
};

type Props = {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ExperienciasMateriaPage({ params, searchParams }: Props) {
  const { codigo } = await params;
  const query = new URLSearchParams(
    Object.entries(await searchParams).flatMap(([key, value]) =>
      (Array.isArray(value) ? value : value === undefined ? [] : [value]).map((v) => [key, v]),
    ),
  ).toString();
  await redirectOldSubjectCode(codigo, query, '/experiencias');
  const subject = await getSubjectPage(codigo, query, '/experiencias');
  if (!subject) notFound();
  return (
    <Suspense fallback={null}>
      <SubjectExperiencesPage code={codigo} subject={subject} />
    </Suspense>
  );
}
