import Link from 'next/link';
import { ArrowRight, BookOpen, Folder, GraduationCap, Search } from 'lucide-react';
import { PrototypeBreadcrumbs } from '@/components/validation/pixel-notebook/PrototypeBreadcrumbs';
import { ResourcePreviewDialog } from '@/components/validation/pixel-notebook/ResourcePreviewDialog';
import { ResourceRow } from '@/components/validation/pixel-notebook/ResourceRow';
import {
  filterValidationResources,
  getValidationSubject,
  validationCareer,
  validationResourceCategories,
  validationSubjects,
} from '@/components/validation/pixel-notebook/data';
import styles from '@/components/validation/pixel-notebook/PrototypeShell.module.css';

type MaterialsPageProps = {
  params: Promise<{ segments?: string[] }>;
  searchParams: Promise<{ q?: string | string[]; archivo?: string | string[] }>;
};

const materialsRoot = '/validacion/pixel-notebook/materiales';

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function yearLabel(year: number) {
  return `${year}.º año`;
}

function fileHref(basePath: string, query: string, resourceId: string) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  params.set('archivo', resourceId);
  return `${basePath}?${params.toString()}`;
}

function unavailable(message: string) {
  return (
    <section className={styles.hierarchyEmpty}>
      <h1>Esta ruta no está disponible en el prototipo</h1>
      <p>{message}</p>
      <Link href={materialsRoot}>Volver a carreras</Link>
    </section>
  );
}

export default async function PixelNotebookMaterialsPage({
  params,
  searchParams,
}: MaterialsPageProps) {
  const { segments = [] } = await params;
  const queryParams = await searchParams;
  const query = readParam(queryParams.q).trim();
  const selectedResourceId = readParam(queryParams.archivo);
  const [careerSlug, yearSegment, subjectSlug, categorySlug] = segments;
  const year = Number(yearSegment);

  if (segments.length === 0) {
    return (
      <div className={styles.hierarchyPage}>
        <PrototypeBreadcrumbs items={[{ label: 'Materiales' }]} />
        <header className={styles.hierarchyHeader}>
          <h1>Elegí tu carrera</h1>
          <p>Entrá por el plan que cursás para encontrar materias y archivos en su contexto.</p>
        </header>
        <div className={styles.hierarchyList}>
          <Link className={styles.hierarchyItem} href={`${materialsRoot}/${validationCareer.slug}`}>
            <span className={styles.hierarchyIcon} aria-hidden="true">
              <GraduationCap size={22} />
            </span>
            <span>
              <strong>{validationCareer.label}</strong>
              <small>Plan 2023 · {validationCareer.years.length} años</small>
            </span>
            <ArrowRight aria-hidden="true" size={19} />
          </Link>
        </div>
      </div>
    );
  }

  if (careerSlug !== validationCareer.slug) {
    return unavailable('La validación conectada usa por ahora el plan de Ingeniería Informática.');
  }

  const careerHref = `${materialsRoot}/${validationCareer.slug}`;
  const baseBreadcrumbs = [
    { label: 'Materiales', href: materialsRoot },
    { label: validationCareer.label, href: careerHref },
  ];

  if (segments.length === 1) {
    return (
      <div className={styles.hierarchyPage}>
        <PrototypeBreadcrumbs items={baseBreadcrumbs} />
        <header className={styles.hierarchyHeader}>
          <h1>{validationCareer.label}</h1>
          <p>Elegí el año del plan para ver sus materias.</p>
        </header>
        <div className={styles.hierarchyList}>
          {validationCareer.years.map((curriculumYear) => {
            const subjectCount = validationSubjects.filter(
              (subject) => subject.year === curriculumYear,
            ).length;

            return (
              <Link
                className={styles.hierarchyItem}
                href={`${careerHref}/${curriculumYear}`}
                key={curriculumYear}
              >
                <span className={styles.hierarchyNumber}>{curriculumYear}</span>
                <span>
                  <strong>{yearLabel(curriculumYear)}</strong>
                  <small>
                    {subjectCount > 0
                      ? `${subjectCount} materias disponibles en esta validación`
                      : 'Estructura preparada · sin datos sintéticos'}
                  </small>
                </span>
                <ArrowRight aria-hidden="true" size={19} />
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  if (!validationCareer.years.includes(year as 1 | 2 | 3 | 4 | 5)) {
    return unavailable('El año indicado no pertenece al plan mostrado.');
  }

  const yearHref = `${careerHref}/${year}`;
  const yearBreadcrumbs = [...baseBreadcrumbs, { label: yearLabel(year), href: yearHref }];
  const subjectsForYear = validationSubjects.filter((subject) => subject.year === year);

  if (segments.length === 2) {
    return (
      <div className={styles.hierarchyPage}>
        <PrototypeBreadcrumbs items={yearBreadcrumbs} />
        <header className={styles.hierarchyHeader}>
          <h1>Materias de {yearLabel(year)}</h1>
          <p>{validationCareer.label} · plan 2023</p>
        </header>
        {subjectsForYear.length > 0 ? (
          <div className={styles.hierarchyList}>
            {subjectsForYear.map((subject) => (
              <Link
                className={styles.hierarchyItem}
                href={`${yearHref}/${subject.slug}`}
                key={subject.slug}
              >
                <span className={styles.hierarchyCode}>{subject.code}</span>
                <span>
                  <strong>{subject.label}</strong>
                  <small>Código {subject.code}</small>
                </span>
                <ArrowRight aria-hidden="true" size={19} />
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.hierarchyEmpty}>
            <h2>Sin materias cargadas en esta validación</h2>
            <p>La navegación está definida; los datos sintéticos se concentran en 1.er año.</p>
            <Link href={`${careerHref}/1`}>Ver 1.er año</Link>
          </div>
        )}
      </div>
    );
  }

  const subject = getValidationSubject(subjectSlug);
  if (!subject || subject.year !== year) {
    return unavailable('La materia indicada no corresponde al año seleccionado.');
  }

  const subjectHref = `${yearHref}/${subject.slug}`;
  const subjectBreadcrumbs = [...yearBreadcrumbs, { label: subject.label, href: subjectHref }];

  if (segments.length === 3) {
    const subjectResources = filterValidationResources(query, subject.slug);
    const selectedSubjectResource = subjectResources.find(({ id }) => id === selectedResourceId);
    const subjectCloseParams = new URLSearchParams();
    if (query) subjectCloseParams.set('q', query);
    const subjectCloseHref =
      subjectCloseParams.size > 0 ? `${subjectHref}?${subjectCloseParams}` : subjectHref;

    return (
      <div className={styles.hierarchyPage}>
        <PrototypeBreadcrumbs items={subjectBreadcrumbs} />
        <header className={styles.subjectIdentity}>
          <span aria-hidden="true">{subject.code}</span>
          <div>
            <h1>{subject.label}</h1>
            <p>
              {yearLabel(subject.year)} · {subject.career} · código {subject.code}
            </p>
          </div>
        </header>
        <form className={styles.subjectSearch} action={subjectHref} method="get" role="search">
          <Search aria-hidden="true" size={18} />
          <label className={styles.visuallyHidden} htmlFor="subject-query">
            Buscar en esta materia
          </label>
          <input
            id="subject-query"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Buscar en esta materia…"
          />
          <button type="submit">Buscar</button>
        </form>
        {query ? (
          <section aria-labelledby="subject-search-results">
            <div className={styles.sectionHeading}>
              <h2 id="subject-search-results">
                {subjectResources.length}{' '}
                {subjectResources.length === 1 ? 'resultado' : 'resultados'} para “{query}”
              </h2>
              <Link href={subjectHref}>Borrar búsqueda</Link>
            </div>
            {subjectResources.length > 0 ? (
              <div className={styles.resourceList}>
                {subjectResources.map((resource) => (
                  <ResourceRow
                    key={resource.id}
                    resource={resource}
                    href={fileHref(subjectHref, query, resource.id)}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.hierarchyEmpty}>
                <h2>No encontramos archivos en esta materia</h2>
                <p>Probá con otro término o borrá la búsqueda para explorar por categoría.</p>
                <Link href={subjectHref}>Explorar categorías</Link>
              </div>
            )}
            {selectedSubjectResource ? (
              <ResourcePreviewDialog
                resource={selectedSubjectResource}
                closeHref={subjectCloseHref}
              />
            ) : null}
          </section>
        ) : (
          <div className={styles.categoryList}>
            {validationResourceCategories.map((category) => {
              const count = filterValidationResources('', subject.slug).filter(
                (resource) => resource.categorySlug === category.slug,
              ).length;

              return (
                <Link
                  className={styles.categoryItem}
                  href={`${subjectHref}/${category.slug}`}
                  key={category.slug}
                >
                  <Folder aria-hidden="true" size={21} />
                  <span>
                    <strong>{category.label}</strong>
                    <small>{category.description}</small>
                  </span>
                  <span>{count}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const category = validationResourceCategories.find(({ slug }) => slug === categorySlug);
  if (!category || segments.length > 4) {
    return unavailable('La categoría indicada no existe para esta materia.');
  }

  const categoryHref = `${subjectHref}/${category.slug}`;
  const resources = filterValidationResources(query, subject.slug).filter(
    (resource) => resource.categorySlug === category.slug,
  );
  const selectedResource = resources.find(({ id }) => id === selectedResourceId);
  const closeParams = new URLSearchParams();
  if (query) closeParams.set('q', query);
  const closeHref = closeParams.size > 0 ? `${categoryHref}?${closeParams}` : categoryHref;

  return (
    <div className={styles.hierarchyPage}>
      <PrototypeBreadcrumbs items={[...subjectBreadcrumbs, { label: category.label }]} />
      <header className={styles.categoryHeader}>
        <div>
          <BookOpen aria-hidden="true" size={24} />
          <h1>{category.label}</h1>
        </div>
        <p>
          {subject.label} · {resources.length} {resources.length === 1 ? 'archivo' : 'archivos'}
        </p>
      </header>
      <form className={styles.subjectSearch} action={categoryHref} method="get" role="search">
        <Search aria-hidden="true" size={18} />
        <label className={styles.visuallyHidden} htmlFor="category-query">
          Buscar en esta materia
        </label>
        <input
          id="category-query"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Buscar en esta materia…"
        />
        <button type="submit">Buscar</button>
      </form>
      {resources.length > 0 ? (
        <div className={styles.resourceList}>
          {resources.map((resource) => (
            <ResourceRow
              key={resource.id}
              resource={resource}
              href={fileHref(categoryHref, query, resource.id)}
            />
          ))}
        </div>
      ) : (
        <div className={styles.hierarchyEmpty}>
          <h2>No encontramos archivos</h2>
          <p>Probá con otro término o borrá la búsqueda para ver toda la categoría.</p>
          <Link href={categoryHref}>Ver todos los archivos</Link>
        </div>
      )}
      {selectedResource ? (
        <ResourcePreviewDialog resource={selectedResource} closeHref={closeHref} />
      ) : null}
    </div>
  );
}
