export type ValidationComment = {
  id: string;
  author: string;
  date: string;
  body: string;
};

export type ValidationResource = {
  id: string;
  title: string;
  fileName: string;
  type: string;
  categorySlug: string;
  subject: string;
  subjectSlug: string;
  subjectCode: string;
  career: string;
  careerSlug: string;
  curriculumYear: number;
  year: string;
  professor: string;
  shift: string;
  helpfulCount: number;
  rating: string;
  ratingCount: number;
  preview: string;
  fileSize: string;
  uploadedAt: string;
  comments: ValidationComment[];
};

export type ValidationSubject = {
  label: string;
  slug: string;
  code: string;
  year: number;
  career: string;
  careerSlug: string;
};

export type ValidationSuggestion = {
  label: string;
  meta: string;
  href: string;
  searchText: string;
};

export const validationCareer = {
  label: 'Ingeniería Informática',
  slug: 'ingenieria-informatica',
  code: 'II',
  years: [1, 2, 3, 4, 5],
} as const;

export const validationSubjects: ValidationSubject[] = [
  {
    label: 'Introducción a la Programación',
    slug: 'introduccion-a-la-programacion',
    code: '01',
    year: 1,
    career: validationCareer.label,
    careerSlug: validationCareer.slug,
  },
  {
    label: 'Análisis Matemático II',
    slug: 'analisis-matematico-ii',
    code: '06',
    year: 1,
    career: validationCareer.label,
    careerSlug: validationCareer.slug,
  },
  {
    label: 'Estructura de Datos',
    slug: 'estructura-de-datos',
    code: '08',
    year: 1,
    career: validationCareer.label,
    careerSlug: validationCareer.slug,
  },
];

export const validationResourceCategories = [
  {
    label: 'Parciales',
    slug: 'parciales',
    description: 'Consignas y resoluciones de evaluaciones.',
  },
  { label: 'Apuntes', slug: 'apuntes', description: 'Notas, guías y material de apoyo.' },
  { label: 'Resúmenes', slug: 'resumenes', description: 'Repasos breves por tema o unidad.' },
] as const;

export const validationResources: ValidationResource[] = [
  {
    id: 'parcial-estructura-datos-2025',
    title: 'Parcial 1 resuelto: complejidad, listas y pilas',
    fileName: 'parcial-1-estructura-datos-resuelto.pdf',
    type: 'Parcial',
    categorySlug: 'parciales',
    subject: 'Estructura de Datos',
    subjectSlug: 'estructura-de-datos',
    subjectCode: '08',
    career: validationCareer.label,
    careerSlug: validationCareer.slug,
    curriculumYear: 1,
    year: '2025 · 1.er cuatrimestre',
    professor: 'Ing. Laura Quiroga',
    shift: 'Tarde',
    helpfulCount: 34,
    rating: '4,6',
    ratingCount: 18,
    preview:
      'Incluye consignas, resolución comentada y una tabla para comparar O(n), O(log n) y O(n²).',
    fileSize: '2,8 MB',
    uploadedAt: '10 jun 2026',
    comments: [
      {
        id: 'comment-1',
        author: 'Luciana G.',
        date: '12 jun 2026',
        body: 'La explicación de listas enlazadas me ayudó a detectar dónde estaba perdiendo referencias.',
      },
    ],
  },
  {
    id: 'guia-listas-2024',
    title: 'Guía práctica de listas enlazadas',
    fileName: 'guia-practica-listas-enlazadas.pdf',
    type: 'Apunte',
    categorySlug: 'apuntes',
    subject: 'Estructura de Datos',
    subjectSlug: 'estructura-de-datos',
    subjectCode: '08',
    career: validationCareer.label,
    careerSlug: validationCareer.slug,
    curriculumYear: 1,
    year: '2024 · 2.º cuatrimestre',
    professor: 'No informado',
    shift: 'Mañana',
    helpfulCount: 21,
    rating: '4,2',
    ratingCount: 11,
    preview:
      'Resumen visual de operaciones de inserción, borrado y recorrido con ejemplos en pseudocódigo.',
    fileSize: '1,4 MB',
    uploadedAt: '4 may 2026',
    comments: [],
  },
  {
    id: 'resumen-complejidad',
    title: 'Resumen de notación asintótica',
    fileName: 'resumen-notacion-asintotica.pdf',
    type: 'Resumen',
    categorySlug: 'resumenes',
    subject: 'Estructura de Datos',
    subjectSlug: 'estructura-de-datos',
    subjectCode: '08',
    career: validationCareer.label,
    careerSlug: validationCareer.slug,
    curriculumYear: 1,
    year: 'No informado',
    professor: 'No informado',
    shift: 'No informado',
    helpfulCount: 9,
    rating: '4,8',
    ratingCount: 6,
    preview: 'Dos páginas con definiciones y ejemplos breves de O, Ω y Θ.',
    fileSize: '640 KB',
    uploadedAt: '18 abr 2026',
    comments: [],
  },
];

const subjectSuggestions: ValidationSuggestion[] = validationSubjects.map((subject) => ({
  label: subject.label,
  meta: `${subject.code} · ${subject.year}.er año`,
  href: `/validacion/pixel-notebook/resultados?q=${encodeURIComponent(subject.label)}`,
  searchText: `${subject.label} ${subject.code} ${subject.career}`,
}));

const resourceSuggestions: ValidationSuggestion[] = validationResources.map((resource) => ({
  label: resource.title,
  meta: `${resource.type} · ${resource.year.split(' · ')[0]}`,
  href: `/validacion/pixel-notebook/resultados?q=${encodeURIComponent(resource.title)}`,
  searchText: `${resource.title} ${resource.type} ${resource.subject} ${resource.professor}`,
}));

export function normalizeValidationSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es-AR')
    .replace(/\s+/g, ' ');
}

function includesNormalized(haystack: string, needle: string) {
  return normalizeValidationSearch(haystack).includes(needle);
}

export function filterValidationSuggestions(query: string) {
  const normalizedQuery = normalizeValidationSearch(query);

  if (!normalizedQuery) {
    return { subjects: [], resources: [] };
  }

  return {
    subjects: subjectSuggestions.filter(({ searchText }) =>
      includesNormalized(searchText, normalizedQuery),
    ),
    resources: resourceSuggestions.filter(({ searchText }) =>
      includesNormalized(searchText, normalizedQuery),
    ),
  };
}

export function filterValidationResources(query: string, subjectSlug?: string) {
  const normalizedQuery = normalizeValidationSearch(query);

  return validationResources.filter((resource) => {
    if (subjectSlug && resource.subjectSlug !== subjectSlug) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return includesNormalized(
      `${resource.title} ${resource.type} ${resource.subject} ${resource.professor} ${resource.preview}`,
      normalizedQuery,
    );
  });
}

export function getValidationResource(resourceId?: string) {
  return validationResources.find(({ id }) => id === resourceId);
}

export function getValidationSubject(subjectSlug?: string) {
  return validationSubjects.find(({ slug }) => slug === subjectSlug);
}
