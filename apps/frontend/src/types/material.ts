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

export type MaterialModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Material {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: string; // BigInt serialized as string
  thumbnailUrl: string | null;
  authorId: string;
  subjectId: string;
  downloadCount: number;
  avgRating: string; // Decimal serialized as string
  ratingCount: number;
  moderationStatus: MaterialModerationStatus;
  moderationReason: string | null;
  driveFileId: string | null;
  drivePreviewUrl: string | null;
  driveDownloadUrl: string | null;
  isApproved: boolean;
  isDeleted: boolean;
  isRemoved: boolean;
  createdAt: string;
  updatedAt: string;
  author: MaterialAuthor;
  subject: MaterialSubject;
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
