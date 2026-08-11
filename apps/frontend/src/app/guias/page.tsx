import type { Metadata } from 'next';
import { GuideList } from '@/components/guides/GuideList';

export const metadata: Metadata = {
  title: 'Guías - DevsProject',
  description: 'Guías paso a paso y rutas de aprendizaje creadas por la comunidad de DevsProject',
};

export default function GuiasPage() {
  return <GuideList title="Guías" />;
}
