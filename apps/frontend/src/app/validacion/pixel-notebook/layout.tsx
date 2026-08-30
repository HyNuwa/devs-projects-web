import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PrototypeShell } from '@/components/validation/pixel-notebook/PrototypeShell';

export const metadata: Metadata = {
  title: 'Validación Pixel Notebook | DevsProject',
  description: 'Recorrido sintético para validar descubrimiento y confianza antes de implementar.',
};

export default function PixelNotebookValidationLayout({ children }: { children: ReactNode }) {
  return <PrototypeShell>{children}</PrototypeShell>;
}
