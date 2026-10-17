import { api } from '@/lib/api';
import type { InstitutionRef } from '@/types/institution';

export type StudyPlanStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED';

export type StudyPlanRef = { id: string; name: string; code: string };
export type CareerRef = { id: string; name: string; code: string };

/**
 * `GET /institutions`: universidad → facultades → carreras. Each carrera keeps
 * one internal plan the interface never names (ADR 0003).
 */
export type InstitutionTree = (InstitutionRef & {
  faculties: (InstitutionRef & {
    careers: (CareerRef & { planUrl?: string | null; studyPlans: StudyPlanRef[] })[];
  })[];
})[];

/** One carrera the student declared, with its path. Private to its owner. */
export type DeclaredCareer = {
  careerId: string;
  status: StudyPlanStatus;
  /** When it was declared: the first carrera cursando is the default ubicación. */
  declaredAt: string;
  career: CareerRef;
  faculty: InstitutionRef;
  university: InstitutionRef;
};

export type CareerChoice = { careerId: string; status: StudyPlanStatus };

export async function getInstitutions(): Promise<InstitutionTree> {
  const { data } = await api.get<InstitutionTree>('/institutions');
  return data;
}

export async function getMyCareers(
  options: { skipAuthRedirect?: boolean } = {},
): Promise<DeclaredCareer[]> {
  const { data } = await api.get<DeclaredCareer[]>('/users/me/study-plans', options);
  return data;
}

/** Replaces the whole list; the API rejects duplicates and unknown carreras. */
export async function replaceMyCareers(careers: CareerChoice[]): Promise<DeclaredCareer[]> {
  const { data } = await api.put<DeclaredCareer[]>('/users/me/study-plans', { careers });
  return data;
}

/** The carrera cursando the student declared first, if any. */
export function firstCareerCursando(careers: readonly DeclaredCareer[]) {
  return (
    careers
      .filter((career) => career.status === 'ACTIVE')
      .sort((a, b) => a.declaredAt.localeCompare(b.declaredAt))[0] ?? null
  );
}
