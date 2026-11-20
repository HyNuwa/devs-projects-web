import type { Metadata } from 'next';
import { connection } from 'next/server';

import { UniversitiesView } from '@/components/browse/UniversitiesView';
import { getUniversities } from '@/lib/catalog-client';

export const metadata: Metadata = {
  title: 'Universidades - DevsProject',
  description: 'Elegí tu universidad, tu facultad y tu carrera para llegar a cada materia.',
};

export default async function UniversidadesPage() {
  // Read the catalog per request (its fetch stays cached), never at build time.
  await connection();
  const universities = (await getUniversities()) ?? [];
  return <UniversitiesView universities={universities} />;
}
