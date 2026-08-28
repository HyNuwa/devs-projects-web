export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface MaterialAuthor {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface MaterialSubject {
  id: string;
  name: string;
  code: string | null;
}

export interface MaterialProfessor {
  id: string;
  name: string;
}

export type MaterialResourceType =
  'PARCIAL' | 'FINAL' | 'APUNTE' | 'RESUMEN' | 'TRABAJO_PRACTICO' | 'GUIA_EJERCICIOS' | 'OTRO';

export type MaterialShift = 'MANANA' | 'TARDE' | 'NOCHE' | 'NO_INDICO';
export type MaterialPreviewCapability = 'PDF' | 'IMAGE' | 'UNSUPPORTED' | 'UNAVAILABLE';
export type MaterialPreviewFallbackReason = 'PREVIEW_FAILED' | 'UNSUPPORTED' | 'UNAVAILABLE';
export type MaterialModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface MaterialIdentity {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: string;
  thumbnailUrl: string | null;
  authorId: string;
  subjectId: string;
  resourceType: MaterialResourceType;
  academicYear: number | null;
  professorId: string | null;
  shift: MaterialShift | null;
  downloadCount: number;
  avgRating: string;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  author: MaterialAuthor;
  subject: MaterialSubject;
  professor: MaterialProfessor | null;
}

export interface MaterialPreview {
  capability: MaterialPreviewCapability;
  url: string | null;
  canPreview: boolean;
  downloadUrl: string;
  fallback: {
    reason: MaterialPreviewFallbackReason;
    downloadUrl: string;
  };
}

export interface MaterialViewerState {
  isHelpful: boolean;
  isSaved: boolean;
}

export interface MaterialHelpfulnessState extends MaterialViewerState {
  helpfulCount: number;
}

/** Public contract: public endpoints only return approved materials. */
export interface Material extends MaterialIdentity {
  helpfulCount: number;
  commentCount: number;
  starSummary: {
    average: string;
    count: number;
  };
  commentSummary: {
    count: number;
  };
  preview: MaterialPreview;
}

/** Contributor/moderator contract. These fields never constitute public trust. */
export interface ModeratedMaterial extends MaterialIdentity {
  moderationStatus: MaterialModerationStatus;
  moderationReason: string | null;
  driveFileId: string | null;
  drivePreviewUrl: string | null;
  driveDownloadUrl: string | null;
  isApproved: boolean;
  isDeleted: boolean;
  isRemoved: boolean;
}

export interface MaterialRating {
  id: string;
  userId: string;
  materialId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: MaterialAuthor;
}
