import type { Metadata } from 'next';
import { Suspense } from 'react';

import { WriteExperienceChooser } from '@/components/experiences/WriteExperienceChooser';

export const metadata: Metadata = {
  title: 'Escribir experiencia - DevsProject',
  description: 'Elegí la materia y contá cómo fue cursarla o rendirla',
};

export default function WriteExperiencePage() {
  // The chooser reads `tipo`, `materia` and `desde` from the URL.
  return (
    <Suspense>
      <WriteExperienceChooser />
    </Suspense>
  );
}
