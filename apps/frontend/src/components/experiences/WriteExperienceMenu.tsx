'use client';

import Link from 'next/link';
import { PenLine } from 'lucide-react';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn';

/**
 * The writing entry of a materia (openspec academic-community/experiences):
 * one menu offering the two existing form routes for the subject code.
 */
export function WriteExperienceMenu({
  code,
  label = 'Escribir experiencia',
}: {
  code: string;
  label?: string;
}) {
  const encoded = encodeURIComponent(code);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <PenLine aria-hidden="true" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label="Escribir experiencia">
        <DropdownMenuItem asChild>
          <Link href={`/materias/${encoded}/resenar`}>Reseña de cursada</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/materias/${encoded}/final`}>Experiencia de final</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
