import type { Metadata } from 'next';

import { MaterialHierarchyPage } from '@/components/discovery/MaterialHierarchyPage';

export const metadata: Metadata = {
  title: 'Materiales - DevsProject',
  description: 'Explorá recursos por carrera, año, materia y tipo de archivo.',
};

export default async function MaterialesPage({
  searchParams,
}: {
  searchParams: Promise<{ archivo?: string }>;
}) {
  const { archivo } = await searchParams;
  return <MaterialHierarchyPage query="" segments={[]} selectedFileId={archivo} />;
}
