export type Shift = 'MANANA' | 'TARDE' | 'NOCHE' | 'NO_INDICO';
export type CourseCondition = 'PROMO' | 'REGULAR' | 'LIBRE' | 'PREFIERO_NO_RESPONDER';
export type ExamFormat = 'ESCRITO' | 'ORAL' | 'MIXTO';
export type ExamSession =
  'DICIEMBRE' | 'JULIO' | 'MARZO' | 'FEBRERO_MARZO' | 'ESPECIAL' | 'NO_RECUERDO';
export type CourseAttempt =
  'PRIMERA_CURSADA' | 'PRIMERA_RECURSADA' | 'SEGUNDA_O_MAS_RECURSADAS' | 'PREFIERO_NO_RESPONDER';
export type CommunityDifficulty = 'MUY_BAJA' | 'BAJA' | 'MEDIA' | 'ALTA' | 'MUY_ALTA';
export type ExamOutcome = 'APROBADO' | 'DESAPROBADO' | 'PREFIERO_NO_DECIR';

export interface Subject {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
}

export interface SubjectUser {
  id?: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface SubjectHub extends Subject {
  studyPlans: {
    year: number;
    semester: number;
    credits: number | null;
    studyPlan: {
      name: string;
      career: { name: string };
    };
  }[];
  professors: { professor: { id: string; name: string; bio: string | null } }[];
  stats: {
    avgRecommendation: number | null;
    reviewCount: number;
    examCount: number;
    materialCount: number;
  };
}

export interface CourseReview {
  id: string;
  userId: string;
  subjectId: string;
  academicYear?: number | null;
  shift: Shift;
  condition: CourseCondition;
  attempt?: CourseAttempt | null;
  professorId?: string | null;
  professorName?: string | null;
  difficulty?: CommunityDifficulty | number | null;
  recommendation: number;
  comment: string | null;
  isAnonymous?: boolean;
  createdAt: string;
  updatedAt: string;
  user?: SubjectUser;
}

export interface CourseReviewResponse {
  reviews: CourseReview[];
  conditionBreakdown: { condition: CourseCondition; _count: number }[];
}

export interface ExamExperience {
  id: string;
  userId: string;
  subjectId: string;
  shift: Shift | null;
  year: number;
  session: ExamSession;
  format: ExamFormat;
  examDate?: string | null;
  professorId: string | null;
  examinerName: string | null;
  difficulty?: CommunityDifficulty | null;
  difficultyTheory?: number | null;
  difficultyPractice?: number | null;
  outcome?: ExamOutcome | null;
  grade?: number | null;
  comment: string | null;
  isAnonymous?: boolean;
  createdAt: string;
  updatedAt: string;
  user?: SubjectUser;
  professor?: { id: string; name: string } | null;
}
