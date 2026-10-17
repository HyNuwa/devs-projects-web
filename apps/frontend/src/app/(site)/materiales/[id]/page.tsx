import type { Metadata } from 'next';
import { MaterialDetail } from '@/components/materials/MaterialDetail';

export const metadata: Metadata = {
  title: 'Material - DevsProject',
  description: 'Detalle del material académico',
};

export default async function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await params;

  return <MaterialDetail />;
}
