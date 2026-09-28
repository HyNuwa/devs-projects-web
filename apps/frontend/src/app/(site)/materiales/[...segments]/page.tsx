import type { Metadata } from 'next';

import { MaterialHierarchyPage } from '@/components/discovery/MaterialHierarchyPage';

export const metadata: Metadata = {
  title: 'Materiales - DevsProject',
  description: 'Explorá recursos por carrera, año, materia y tipo de archivo.',
};

type MaterialesHierarchyRouteProps = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ archivo?: string | string[]; q?: string | string[] }>;
};

export default async function MaterialesHierarchyRoute({
  params,
  searchParams,
}: MaterialesHierarchyRouteProps) {
  const [{ segments }, queryParams] = await Promise.all([params, searchParams]);
  const query = Array.isArray(queryParams.q) ? queryParams.q[0] : (queryParams.q ?? '');
  const selectedFileId = Array.isArray(queryParams.archivo)
    ? queryParams.archivo[0]
    : (queryParams.archivo ?? undefined);

  return (
    <MaterialHierarchyPage query={query} selectedFileId={selectedFileId} segments={segments} />
  );
}
