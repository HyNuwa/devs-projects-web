import type { Metadata } from 'next';

import { WriteExperienceChooser } from '@/components/experiences/WriteExperienceChooser';

export const metadata: Metadata = {
  title: 'Escribir experiencia - DevsProject',
  description: 'Elegí la materia y contá cómo fue cursarla o rendirla',
};

export default function WriteExperiencePage() {
  return <WriteExperienceChooser />;
}
