import type { FacultyRef as DiscoveryHierarchyFaculty } from './institution';
import type { MaterialResourceType } from './material';

export interface DiscoverySubjectSuggestion {
  kind: 'SUBJECT';
  id: string;
  name: string;
  code: string | null;
  faculty: DiscoveryHierarchyFaculty;
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
  /** Present only for named authors; anonymous entries carry just `username`. */
  id?: string;
  avatarUrl?: string | null;
  avatarCat?: string | null;
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
  /** Nota de promoción (1–10), only with PROMO; `null` when undeclared. */
  promotionGrade?: number | null;
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

/** Full public projection for a shareable course-review detail route. */
export interface DiscoveryCourseReviewDetail extends Omit<DiscoveryCourseReview, 'excerpt'> {
  comment: string | null;
}

export interface DiscoveryExamExperience {
  id: string;
  subject: DiscoverySubjectLink;
  author: DiscoveryPublicAuthor;
  year: number;
  session: 'DICIEMBRE' | 'JULIO' | 'MARZO' | 'FEBRERO_MARZO' | 'ESPECIAL' | 'NO_RECUERDO';
  format: 'ESCRITO' | 'ORAL' | 'MIXTO';
  examDate?: string;
  shift?: 'MANANA' | 'TARDE' | 'NOCHE' | 'NO_INDICO';
  professor?: { id: string; name: string };
  examinerName?: string;
  /** Verbal dificultad of older finales, before teoría and práctica. */
  difficulty?: 'MUY_BAJA' | 'BAJA' | 'MEDIA' | 'ALTA' | 'MUY_ALTA';
  difficultyTheory?: number;
  difficultyPractice?: number;
  outcome?: 'APROBADO' | 'DESAPROBADO' | 'PREFIERO_NO_DECIR';
  /** Nota declared by the author; absent when none was shared. */
  grade?: number;
  /** Profesores en la mesa. */
  boardSize?: number;
  /** Tiempo del examen, in minutes. */
  durationMinutes?: number;
  excerpt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveryExamExperienceList {
  data: DiscoveryExamExperience[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Full public projection for a shareable final-experience detail route. */
export interface DiscoveryExamExperienceDetail extends Omit<DiscoveryExamExperience, 'excerpt'> {
  /** How many days before the exam the author started studying. */
  prepLeadDays?: number;
  /** Study time per day, in minutes. */
  prepDailyMinutes?: number;
  /** round(prepLeadDays × prepDailyMinutes / 60), only when both exist. */
  estimatedStudyHours?: number;
  /** Temas que tomaron (up to ten). */
  topics: string[];
  comment: string | null;
}
