import { api } from '@/lib/api';
import type { InstitutionRef } from '@/types/discovery-hierarchy';

export type StudyPlanStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED';

export type StudyPlanRef = { id: string; name: string; code: string };
export type CareerRef = { id: string; name: string; code: string };

/** `GET /institutions`: universidad → facultades → carreras → planes. */
export type InstitutionTree = (InstitutionRef & {
  faculties: (InstitutionRef & {
    careers: (CareerRef & { studyPlans: StudyPlanRef[] })[];
  })[];
})[];

/** One plan the student declared, with its full path. Private to its owner. */
export type DeclaredStudyPlan = {
  studyPlanId: string;
  status: StudyPlanStatus;
  studyPlan: StudyPlanRef;
  career: CareerRef;
  faculty: InstitutionRef;
  university: InstitutionRef;
};

export type StudyPlanChoice = { studyPlanId: string; status: StudyPlanStatus };

export async function getInstitutions(): Promise<InstitutionTree> {
  const { data } = await api.get<InstitutionTree>('/institutions');
  return data;
}

export async function getMyStudyPlans(): Promise<DeclaredStudyPlan[]> {
  const { data } = await api.get<DeclaredStudyPlan[]>('/users/me/study-plans');
  return data;
}

/** Replaces the whole list; the API rejects duplicates and unknown plans. */
export async function replaceMyStudyPlans(plans: StudyPlanChoice[]): Promise<DeclaredStudyPlan[]> {
  const { data } = await api.put<DeclaredStudyPlan[]>('/users/me/study-plans', { plans });
  return data;
}
