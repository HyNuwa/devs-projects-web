export type Shift = 'MANANA' | 'TARDE' | 'NOCHE' | 'NO_INDICO';
export type CourseCondition = 'PROMO' | 'REGULAR' | 'LIBRE' | 'PREFIERO_NO_RESPONDER';
export type ExamFormat = 'ESCRITO' | 'ORAL' | 'MIXTO';
export type ExamSession =
  'DICIEMBRE' | 'JULIO' | 'MARZO' | 'FEBRERO_MARZO' | 'ESPECIAL' | 'NO_RECUERDO';

export interface Subject {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
}

export interface SubjectUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
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
  shift: Shift;
  condition: CourseCondition;
  recommendation: number;
  comment: string | null;
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
  professorId: string | null;
  examinerName: string | null;
  difficultyTheory: number;
  difficultyPractice: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  user?: SubjectUser;
  professor?: { id: string; name: string } | null;
}
