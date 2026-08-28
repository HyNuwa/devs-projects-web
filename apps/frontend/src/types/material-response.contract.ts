import type { Material } from './material';

const publicMaterialContract = {
  id: '30000000-0000-4000-8000-000000000001',
  title: 'Árboles y grafos',
  description: null,
  fileUrl: '/materials/arboles.pdf',
  fileType: 'pdf',
  fileSize: '1024',
  thumbnailUrl: null,
  authorId: '10000000-0000-4000-8000-000000000001',
  subjectId: '20000000-0000-4000-8000-000000000001',
  resourceType: 'PARCIAL',
  academicYear: 2026,
  professorId: null,
  shift: 'TARDE',
  downloadCount: 4,
  avgRating: '4.50',
  ratingCount: 2,
  helpfulCount: 3,
  commentCount: 1,
  starSummary: { average: '4.50', count: 2 },
  commentSummary: { count: 1 },
  preview: {
    capability: 'PDF',
    url: '/materials/arboles.pdf',
    canPreview: true,
    downloadUrl: '/materials/arboles.pdf',
    fallback: {
      reason: 'PREVIEW_FAILED',
      downloadUrl: '/materials/arboles.pdf',
    },
  },
  createdAt: '2026-08-28T00:00:00.000Z',
  updatedAt: '2026-08-28T00:00:00.000Z',
  author: {
    id: '10000000-0000-4000-8000-000000000001',
    username: 'estudiante',
    displayName: null,
    avatarUrl: null,
  },
  subject: {
    id: '20000000-0000-4000-8000-000000000001',
    name: 'Estructura de Datos',
    code: 'ED-01',
  },
  professor: null,
} satisfies Material;

// Public material contracts deliberately exclude publication-moderation fields.
// @ts-expect-error moderationStatus belongs only to ModeratedMaterial.
publicMaterialContract.moderationStatus;

export {};
