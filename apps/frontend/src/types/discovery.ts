import type { MaterialResourceType } from './material';

export interface DiscoverySubjectSuggestion {
  kind: 'SUBJECT';
  id: string;
  name: string;
  code: string | null;
}

export interface DiscoveryMaterialSuggestion {
  kind: 'MATERIAL';
  id: string;
  title: string;
  resourceType: MaterialResourceType;
  subject: {
    id: string;
    name: string;
    code: string | null;
  };
}

/** Bounded groups returned in academic context before individual resources. */
export interface GroupedDiscoverySuggestions {
  subjects: DiscoverySubjectSuggestion[];
  materials: DiscoveryMaterialSuggestion[];
}

export interface DiscoverySubjectLink {
  id: string;
  name: string;
  code: string | null;
  href: string;
}

export interface DiscoveryPublicAuthor {
  username: string;
}

export interface DiscoveryCourseReview {
  id: string;
  subject: DiscoverySubjectLink;
  author: DiscoveryPublicAuthor;
  academicYear: number | null;
  shift: 'MANANA' | 'TARDE' | 'NOCHE' | 'NO_INDICO';
  condition: 'PROMO' | 'REGULAR' | 'LIBRE' | 'PREFIERO_NO_RESPONDER';
  attempt:
    | 'PRIMERA_CURSADA'
    | 'PRIMERA_RECURSADA'
    | 'SEGUNDA_O_MAS_RECURSADAS'
    | 'PREFIERO_NO_RESPONDER'
    | null;
  difficulty: 'MUY_BAJA' | 'BAJA' | 'MEDIA' | 'ALTA' | 'MUY_ALTA' | null;
  recommendation: number;
  professor: { id: string; name: string } | null;
  professorName: string | null;
  excerpt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveryCourseReviewList {
  data: DiscoveryCourseReview[];
  aggregate: {
    averageRecommendation: number | null;
    reviewCount: number;
  };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
