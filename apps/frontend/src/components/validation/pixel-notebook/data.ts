export type ValidationResource = {
  id: string;
  title: string;
  type: string;
  subject: string;
  year: string;
  professor: string;
  shift: string;
  reviewed: boolean;
  helpfulCount: number;
  rating: string;
  ratingCount: number;
  preview: string;
};

export const validationResources: ValidationResource[] = [
  {
    id: 'parcial-algoritmos-2025',
    title: 'Parcial 1 resuelto: complejidad, listas y pilas',
    type: 'Parcial',
    subject: 'Algoritmos y Estructuras de Datos',
    year: '2025 · 1.er cuatrimestre',
    professor: 'Ing. Laura Quiroga',
    shift: 'Tarde',
    reviewed: true,
    helpfulCount: 34,
    rating: '4,6',
    ratingCount: 18,
    preview:
      'Incluye consignas, resolución comentada y una tabla para comparar O(n), O(log n) y O(n²).',
  },
  {
    id: 'guia-listas-2024',
    title: 'Guía práctica de listas enlazadas',
    type: 'Apunte',
    subject: 'Algoritmos y Estructuras de Datos',
    year: '2024 · 2.º cuatrimestre',
    professor: 'No informado',
    shift: 'Mañana',
    reviewed: false,
    helpfulCount: 21,
    rating: '4,2',
    ratingCount: 11,
    preview:
      'Resumen visual de operaciones de inserción, borrado y recorrido con ejemplos en pseudocódigo.',
  },
  {
    id: 'resumen-complejidad',
    title: 'Resumen de notación asintótica',
    type: 'Resumen',
    subject: 'Algoritmos y Estructuras de Datos',
    year: 'No informado',
    professor: 'No informado',
    shift: 'No informado',
    reviewed: false,
    helpfulCount: 9,
    rating: '4,8',
    ratingCount: 6,
    preview: 'Dos páginas con definiciones y ejemplos breves de O, Ω y Θ.',
  },
];
