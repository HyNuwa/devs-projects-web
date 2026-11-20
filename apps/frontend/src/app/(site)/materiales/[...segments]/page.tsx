import { redirect } from 'next/navigation';

import { legacyMaterialesTarget, serverLegacyLoaders } from '@/lib/legacy-redirects';

/** Old `/materiales/carreras/…` addresses go to their carrera or materia page. */
export default async function LegacyMaterialesRoute({
  params,
}: {
  params: Promise<{ segments: string[] }>;
}) {
  const { segments } = await params;
  redirect(await legacyMaterialesTarget(segments, serverLegacyLoaders));
}
