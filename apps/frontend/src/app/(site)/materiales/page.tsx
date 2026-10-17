import { redirect } from 'next/navigation';

/**
 * The old materials browser became the browsing steps (openspec
 * academic-structure/browsing). A shared preview link keeps opening its material.
 */
export default async function MaterialesPage({
  searchParams,
}: {
  searchParams: Promise<{ archivo?: string | string[] }>;
}) {
  const { archivo } = await searchParams;
  const id = Array.isArray(archivo) ? archivo[0] : archivo;
  redirect(id ? `/materiales/${encodeURIComponent(id)}` : '/universidades');
}
