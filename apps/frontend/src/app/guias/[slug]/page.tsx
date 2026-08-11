import type { Metadata } from 'next';
import { GuideDetail } from '@/components/guides/GuideDetail';

export const metadata: Metadata = {
  title: 'Guía - DevsProject',
  description: 'Detalle de la guía',
};

export default async function GuiaPage({ params }: { params: Promise<{ slug: string }> }) {
  await params;
  return <GuideDetail />;
}
