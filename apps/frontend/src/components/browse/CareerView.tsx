import Link from 'next/link';

import {
  browsePath,
  type CareerOptativa,
  type CareerPage,
  type CareerSubject,
} from '@/lib/catalog-client';

import { BrowseShell, count } from './BrowseShell';

const ordinal = (value: number) => `${value}.º`;

/** 0 is anual (catalog-editing); it goes first in its año. */
const semesterLabel = (semester: number) =>
  semester === 0 ? 'Anual' : `${ordinal(semester)} cuatrimestre`;
const semesterId = (year: number, semester: number) =>
  semester === 0 ? `anio-${year}-anual` : `anio-${year}-c${semester}`;

/** Materias grouped by año, then anuales and each cuatrimestre, keeping the server's order. */
function group(subjects: CareerSubject[]) {
  const years = new Map<number, Map<number, CareerSubject[]>>();
  for (const subject of subjects) {
    const semesters = years.get(subject.year) ?? new Map<number, CareerSubject[]>();
    semesters.set(subject.semester, [...(semesters.get(subject.semester) ?? []), subject]);
    years.set(subject.year, semesters);
  }
  return [...years.entries()]
    .sort(([a], [b]) => a - b)
    .map(
      ([year, semesters]) => [year, [...semesters.entries()].sort(([a], [b]) => a - b)] as const,
    );
}

function SubjectLink({ subject, career }: { subject: CareerOptativa; career: string }) {
  return (
    <li>
      <Link
        className="flex min-h-11 items-center justify-between gap-3 rounded-xl border-[1.5px] border-line bg-background px-3 py-2 hover:border-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        href={`/materias/${encodeURIComponent(subject.code ?? subject.id)}?carrera=${career}`}
      >
        <span className="min-w-0 break-words font-bold">{subject.name}</span>
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">
          {count(subject.materialCount, 'material', 'materiales')}
        </span>
      </Link>
    </li>
  );
}

const sectionClass = 'rounded-2xl border-[1.5px] border-foreground bg-card p-5 shadow-pop';

/**
 * Step 4: a carrera's materias by año and cuatrimestre, then its optativas,
 * without plans (ADR 0003).
 */
export function CareerView({ data }: { data: CareerPage }) {
  const { university, faculty, career, subjects, optativas } = data;
  const facts = [
    career.years ? count(career.years, 'año', 'años') : null,
    count(career.subjectCount, 'materia', 'materias'),
    career.credits > 0 ? count(career.credits, 'crédito', 'créditos') : null,
  ].filter((fact): fact is string => fact !== null);

  return (
    <BrowseShell
      aside={
        career.planUrl ? (
          <a
            className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-foreground px-4 text-sm font-extrabold hover:bg-secondary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            href={career.planUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Plan oficial <span aria-hidden="true">&nbsp;↗</span>
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
        ) : null
      }
      description={`Las materias de la carrera, año por año. Tocá una para ver sus parciales, apuntes y experiencias.`}
      eyebrow={`Carrera · ${faculty.shortName} · ${university.shortName}`}
      title={career.name}
      trail={[
        { href: browsePath.universities(), label: 'Universidades' },
        { href: browsePath.university(university.shortName), label: university.shortName },
        {
          href: browsePath.faculty(university.shortName, faculty.shortName),
          label: faculty.shortName,
        },
        { label: career.name },
      ]}
    >
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold">
        {facts.map((fact) => (
          <span key={fact}>{fact}</span>
        ))}
      </p>
      {subjects.length === 0 && optativas.length === 0 ? (
        <p className="rounded-2xl border-[1.5px] border-dashed border-line p-6 text-center text-sm font-semibold text-muted-foreground">
          Todavía no cargamos sus materias.
        </p>
      ) : (
        group(subjects).map(([year, semesters]) => (
          <section aria-labelledby={`anio-${year}`} className={sectionClass} key={year}>
            <h2 className="text-2xl font-extrabold tracking-[-0.04em]" id={`anio-${year}`}>
              {ordinal(year)} año
            </h2>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              {semesters.map(([semester, list]) => (
                <div className="min-w-0" key={semester}>
                  <h3
                    className="text-xs font-bold uppercase tracking-[0.15em] text-link"
                    id={semesterId(year, semester)}
                  >
                    {semesterLabel(semester)}
                  </h3>
                  <ul aria-labelledby={semesterId(year, semester)} className="mt-2 grid gap-2">
                    {list.map((subject) => (
                      <SubjectLink career={career.slug} key={subject.id} subject={subject} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
      {optativas.length > 0 ? (
        <section aria-labelledby="optativas" className={sectionClass}>
          <h2 className="text-2xl font-extrabold tracking-[-0.04em]" id="optativas">
            Optativas
          </h2>
          <ul aria-labelledby="optativas" className="mt-4 grid gap-2 md:grid-cols-2">
            {optativas.map((subject) => (
              <SubjectLink career={career.slug} key={subject.id} subject={subject} />
            ))}
          </ul>
        </section>
      ) : null}
    </BrowseShell>
  );
}
