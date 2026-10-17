import type { Metadata } from 'next';
import { ReviewForm } from '@/components/subjects/ReviewForm';

export const metadata: Metadata = {
  title: 'Reseñar cursada - DevsProject',
  description: 'Compartí tu experiencia cursando esta materia',
};

export default async function ResenarPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  return <ReviewForm />;
}
