import { api } from '@/lib/api';

export type PointReason =
  | 'MATERIAL_PUBLISHED'
  | 'MATERIAL_PIONEER'
  | 'HELPFUL_RECEIVED'
  | 'COURSE_REVIEWED'
  | 'EXAM_EXPERIENCE_SHARED'
  | 'REPORT_CONFIRMED'
  | 'GUIDE_CREATED'
  | 'LEGACY_ADJUSTMENT';

export type ProgressMovement = {
  reason: PointReason;
  amount: number;
  reversal: boolean;
  createdAt: string;
  /** The student's own contribution; null when it must stay unnamed. */
  subject: { type: string; title: string } | null;
};

export type Progress = {
  level: number;
  levelName: string;
  /** Shown as 0 at least. */
  points: number;
  next: {
    level: number;
    name: string;
    threshold: number;
    missing: number;
    unlocks: string;
  } | null;
  levels: { level: number; name: string; threshold: number }[];
  movements: ProgressMovement[];
};

/** «Tu progreso»: the account's own level, points and latest movements. */
export async function getMyProgress(): Promise<Progress> {
  return (await api.get<Progress>('/me/progress')).data;
}
