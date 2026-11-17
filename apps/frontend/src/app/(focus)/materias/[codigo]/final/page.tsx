import type { Metadata } from 'next';
import { ExamForm } from '@/components/experiences/forms/ExamForm';

export const metadata: Metadata = {
  title: 'Experiencia de final - DevsProject',
  description: 'Compartí tu experiencia de final de esta materia',
};

export default async function FinalPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  return <ExamForm />;
}
