import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { UniversityView } from '@/components/browse/UniversityView';
import { getUniversityPage } from '@/lib/catalog-client';

type Params = { params: Promise<{ uni: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { uni } = await params;
  const data = await getUniversityPage(uni);
  if (!data) return { title: 'Universidad - DevsProject' };
  const empty = data.faculties.every((faculty) => faculty.careerCount === 0);
  return {
    title: `${data.university.name} - DevsProject`,
    description: `Facultades de ${data.university.name} en DevsProject.`,
    // Nothing loaded yet: keep it out of search engines until it has content.
    ...(empty && { robots: { index: false } }),
  };
}

export default async function UniversidadPage({ params }: Params) {
  const { uni } = await params;
  const data = await getUniversityPage(uni);
  if (!data) notFound();
  return <UniversityView data={data} />;
}
