import Link from 'next/link';
import { Search } from 'lucide-react';
import { PrototypeBreadcrumbs } from '@/components/validation/pixel-notebook/PrototypeBreadcrumbs';
import { PrototypeSearch } from '@/components/validation/pixel-notebook/PrototypeSearch';
import { ResourcePreviewDialog } from '@/components/validation/pixel-notebook/ResourcePreviewDialog';
import { ResourceRow } from '@/components/validation/pixel-notebook/ResourceRow';
import {
  filterValidationResources,
  getValidationResource,
  normalizeValidationSearch,
  validationSubjects,
} from '@/components/validation/pixel-notebook/data';
import styles from '@/components/validation/pixel-notebook/PrototypeShell.module.css';

type ResultsPageProps = {
  searchParams: Promise<{ q?: string | string[]; archivo?: string | string[] }>;
};

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function resourceHref(query: string, resourceId: string) {
  const params = new URLSearchParams({ q: query, archivo: resourceId });
  return `/validacion/pixel-notebook/resultados?${params.toString()}`;
}

export default async function PixelNotebookValidationResultsPage({
  searchParams,
}: ResultsPageProps) {
  const queryParams = await searchParams;
  const query = readParam(queryParams.q).trim() || 'estructura de datos';
  const normalizedQuery = normalizeValidationSearch(query);
  const subjectMatch = validationSubjects.find(({ label }) => {
    const normalizedSubject = normalizeValidationSearch(label);
    return (
      normalizedSubject.includes(normalizedQuery) || normalizedQuery.includes(normalizedSubject)
    );
  });
  const resources = filterValidationResources(query);
  const selectedResource = getValidationResource(readParam(queryParams.archivo));
  const closeHref = `/validacion/pixel-notebook/resultados?q=${encodeURIComponent(query)}`;

  return (
    <div className={styles.resultsPage}>
      <PrototypeBreadcrumbs
        items={[
          { label: 'Materiales', href: '/validacion/pixel-notebook/materiales' },
          { label: 'Resultados' },
        ]}
      />
      <header className={subjectMatch ? styles.subjectResultsHeader : styles.resultsHeader}>
        {subjectMatch ? (
          <div className={styles.subjectIdentity}>
            <span aria-hidden="true">{subjectMatch.code}</span>
            <div>
              <h1>{subjectMatch.label}</h1>
              <p>
                {subjectMatch.year}.er año · {subjectMatch.career} · código {subjectMatch.code}
              </p>
              <Link
                href={`/validacion/pixel-notebook/materiales/${subjectMatch.careerSlug}/${subjectMatch.year}/${subjectMatch.slug}`}
              >
                Explorar la materia
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <h1>Resultados para “{query}”</h1>
            <p>Compará contexto, estrellas y “Me sirvió” antes de abrir un archivo.</p>
          </div>
        )}
        <PrototypeSearch initialQuery={query} compact />
      </header>

      <div className={styles.resultsToolbar}>
        <div className={styles.filterSummary} aria-label="Filtros activos">
          <span>Búsqueda: {query}</span>
          {subjectMatch ? <span>Materia: {subjectMatch.label}</span> : null}
        </div>
        <Link className={styles.allSubjectsLink} href="/validacion/pixel-notebook/materiales">
          <Search aria-hidden="true" size={16} />
          Explorar por carrera
        </Link>
      </div>

      <section aria-labelledby="resources-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="resources-title">
              {resources.length} {resources.length === 1 ? 'resultado' : 'resultados'} para “{query}
              ”
            </h2>
          </div>
          <p>Orden: relevancia, contexto y utilidad</p>
        </div>

        {resources.length > 0 ? (
          <div className={styles.resourceList}>
            {resources.map((resource) => (
              <ResourceRow
                key={resource.id}
                resource={resource}
                href={resourceHref(query, resource.id)}
              />
            ))}
          </div>
        ) : (
          <div className={styles.hierarchyEmpty}>
            <h2>No encontramos recursos</h2>
            <p>Probá con “Estructura de Datos”, “listas” o explorá las materias por carrera.</p>
            <Link href="/validacion/pixel-notebook/materiales">Explorar materiales</Link>
          </div>
        )}
      </section>

      {selectedResource ? (
        <ResourcePreviewDialog resource={selectedResource} closeHref={closeHref} />
      ) : null}
    </div>
  );
}
