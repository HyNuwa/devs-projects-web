import type { Metadata } from 'next';
import { SubjectHub } from '@/components/subjects/SubjectHub';

export const metadata: Metadata = {
  title: 'Materia - DevsProject',
  description: 'Reseñas de cursada, experiencias de final y materiales de la materia',
};

export default async function MateriaPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  return <SubjectHub code={codigo} key={codigo} />;
}
