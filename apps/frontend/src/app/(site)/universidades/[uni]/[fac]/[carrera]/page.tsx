import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CareerView } from '@/components/browse/CareerView';
import { getCareerPage } from '@/lib/catalog-client';

type Params = { params: Promise<{ uni: string; fac: string; carrera: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { uni, fac, carrera } = await params;
  const data = await getCareerPage(uni, fac, carrera);
  if (!data) return { title: 'Carrera - DevsProject' };
  return {
    title: `${data.career.name} (${data.faculty.shortName} · ${data.university.shortName}) - DevsProject`,
    description: `Materias de ${data.career.name}, año por año, con sus parciales, apuntes y experiencias.`,
    ...(data.subjects.length === 0 && { robots: { index: false } }),
  };
}

export default async function CarreraPage({ params }: Params) {
  const { uni, fac, carrera } = await params;
  const data = await getCareerPage(uni, fac, carrera);
  if (!data) notFound();
  return <CareerView data={data} />;
}
