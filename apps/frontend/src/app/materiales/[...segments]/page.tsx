import type { Metadata } from 'next';

import { MaterialHierarchyPage } from '@/components/discovery/MaterialHierarchyPage';

export const metadata: Metadata = {
  title: 'Materiales - DevsProject',
  description: 'Explorá recursos por carrera, año, materia y tipo de archivo.',
};

type MaterialesHierarchyRouteProps = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function MaterialesHierarchyRoute({
  params,
  searchParams,
}: MaterialesHierarchyRouteProps) {
  const [{ segments }, queryParams] = await Promise.all([params, searchParams]);
  const query = Array.isArray(queryParams.q) ? queryParams.q[0] : (queryParams.q ?? '');

  return <MaterialHierarchyPage query={query} segments={segments} />;
}
