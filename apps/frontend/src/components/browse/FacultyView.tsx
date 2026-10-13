import { browsePath, type FacultyPage } from '@/lib/catalog-client';

import { BrowseCard, BrowseShell, count } from './BrowseShell';

/** Step 3: a facultad's carreras, by name. */
export function FacultyView({ data }: { data: FacultyPage }) {
  const { university, faculty, careers } = data;
  return (
    <BrowseShell
      description="Elegí tu carrera para ver sus materias, año por año."
      eyebrow={`Materias · ${faculty.shortName} · ${university.shortName}`}
      title={faculty.name}
      trail={[
        { href: browsePath.universities(), label: 'Universidades' },
        { href: browsePath.university(university.shortName), label: university.shortName },
        { label: faculty.shortName },
      ]}
    >
      {careers.length === 0 ? (
        <p className="rounded-2xl border-[1.5px] border-dashed border-line p-6 text-center text-sm font-semibold text-muted-foreground">
          Todavía no cargamos sus carreras.
        </p>
      ) : (
        <ul aria-label="Carreras" className="grid gap-4 sm:grid-cols-2">
          {careers.map((career) => (
            <BrowseCard
              action="Ver materias"
              empty={career.subjectCount === 0 ? 'Todavía no cargamos sus materias.' : undefined}
              facts={[
                count(career.subjectCount, 'materia', 'materias'),
                count(career.materialCount, 'material', 'materiales'),
              ]}
              href={browsePath.career(university.shortName, faculty.shortName, career.code)}
              key={career.id}
              title={career.name}
            />
          ))}
        </ul>
      )}
    </BrowseShell>
  );
}
