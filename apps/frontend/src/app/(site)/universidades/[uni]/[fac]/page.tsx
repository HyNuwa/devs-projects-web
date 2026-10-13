import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { FacultyView } from '@/components/browse/FacultyView';
import { getFacultyPage } from '@/lib/catalog-client';

type Params = { params: Promise<{ uni: string; fac: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { uni, fac } = await params;
  const data = await getFacultyPage(uni, fac);
  if (!data) return { title: 'Facultad - DevsProject' };
  return {
    title: `${data.faculty.name} (${data.university.shortName}) - DevsProject`,
    description: `Carreras de ${data.faculty.name}, ${data.university.name}.`,
    ...(data.careers.length === 0 && { robots: { index: false } }),
  };
}

export default async function FacultadPage({ params }: Params) {
  const { uni, fac } = await params;
  const data = await getFacultyPage(uni, fac);
  if (!data) notFound();
  return <FacultyView data={data} />;
}
