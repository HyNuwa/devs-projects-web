import { browsePath, type UniversityPage } from '@/lib/catalog-client';

import { BrowseCard, BrowseShell, count } from './BrowseShell';

/** Step 2: a universidad's facultades, those with carreras first. */
export function UniversityView({ data }: { data: UniversityPage }) {
  const { university, faculties } = data;
  return (
    <BrowseShell
      description="Elegí tu facultad para ver sus carreras y, en cada una, sus materias."
      eyebrow="Materias · Paso 2"
      title={university.name}
      trail={[
        { href: browsePath.universities(), label: 'Universidades' },
        { label: university.shortName },
      ]}
    >
      {faculties.length === 0 ? (
        <p className="rounded-2xl border-[1.5px] border-dashed border-line p-6 text-center text-sm font-semibold text-muted-foreground">
          Todavía no cargamos sus facultades.
        </p>
      ) : (
        <ul aria-label="Facultades" className="grid gap-4 sm:grid-cols-2">
          {faculties.map((faculty) => (
            <BrowseCard
              action="Ver carreras"
              empty={faculty.careerCount === 0 ? 'Todavía no cargamos sus carreras.' : undefined}
              facts={[
                count(faculty.careerCount, 'carrera', 'carreras'),
                count(faculty.materialCount, 'material', 'materiales'),
              ]}
              href={browsePath.faculty(university.shortName, faculty.shortName)}
              key={faculty.id}
              subtitle={`${faculty.shortName} · ${university.shortName}`}
              title={faculty.name}
            />
          ))}
        </ul>
      )}
    </BrowseShell>
  );
}
