'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { browsePath, type UniversityCard } from '@/lib/catalog-client';
import { firstCareerCursando } from '@/lib/study-plans-client';
import { useUbicacionStore } from '@/stores/ubicacionStore';

import { BrowseCard, BrowseShell, count } from './BrowseShell';

/** Step 1: every loaded universidad, the viewer's ubicación first. */
export function UniversitiesView({ universities }: { universities: UniversityCard[] }) {
  const ubicacion = useUbicacionStore((state) => state.ubicacion);
  const myCareers = useUbicacionStore((state) => state.myCareers);
  const mine = firstCareerCursando(myCareers);

  // The server orders by name; the ubicación's universidad moves to the top.
  const ordered = useMemo(() => {
    const first = universities.filter((u) => u.id === ubicacion?.universityId);
    return [...first, ...universities.filter((u) => u.id !== ubicacion?.universityId)];
  }, [universities, ubicacion?.universityId]);

  return (
    <BrowseShell
      aside={
        mine ? (
          <Link
            className="inline-flex min-h-11 items-center rounded-full bg-foreground px-4 text-sm font-extrabold text-background focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            href={browsePath.career(
              mine.university.shortName,
              mine.faculty.shortName,
              mine.career.code,
            )}
          >
            Tu carrera: {mine.career.name} <span aria-hidden="true">&nbsp;→</span>
          </Link>
        ) : null
      }
      description="Elegí tu universidad, después tu facultad y tu carrera, y llegá a cada materia con sus parciales, apuntes y experiencias."
      eyebrow="Materias · Paso 1"
      title="Universidades"
      trail={[{ label: 'Universidades' }]}
    >
      <ul aria-label="Universidades" className="grid gap-4 sm:grid-cols-2">
        {ordered.map((university) => (
          <BrowseCard
            action="Ver facultades"
            facts={[
              count(university.facultyCount, 'facultad', 'facultades'),
              count(university.materialCount, 'material', 'materiales'),
            ]}
            href={browsePath.university(university.shortName)}
            key={university.id}
            subtitle={university.shortName}
            title={university.name}
          />
        ))}
      </ul>
      <p className="rounded-2xl border-[1.5px] border-dashed border-line p-5 text-sm font-semibold text-muted-foreground">
        <Link
          className="font-extrabold text-foreground underline underline-offset-4 hover:text-link"
          href="/universidades/pedir"
        >
          ¿No está la tuya? Pedí tu carrera
        </Link>{' '}
        con el link a su plan de estudios y la sumamos.
      </p>
    </BrowseShell>
  );
}
