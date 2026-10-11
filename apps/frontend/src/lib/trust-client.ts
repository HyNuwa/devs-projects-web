import { api } from '@/lib/api';

/** Privilegios de confianza (openspec reputation/trust-privileges). */
export type Missing =
  | { kind: 'LEVEL'; needed: number; current: number }
  | { kind: 'CONFIRMED_REPORTS'; needed: number; current: number }
  | { kind: 'PRECISION'; needed: number; current: number }
  | { kind: 'STANDING'; until: string | null };

export type Privilege = { active: boolean; missing: Missing[] };

export type MyPrivileges = {
  suggestCorrections: Privilege;
  priorityReports: Privilege;
  standing: { good: boolean; until: string | null; permanent: boolean };
};

export type CorrectionField = 'SUBJECT' | 'RESOURCE_TYPE' | 'ACADEMIC_YEAR' | 'PROFESSOR';

export type CorrectionOptions = {
  subjects: { id: string; code: string | null; name: string }[];
  professors: { id: string; name: string }[];
  resourceTypes: { value: string; label: string }[];
  current: Record<CorrectionField, string | null>;
};

/** A suggestion as the author or moderation sees it: labels, never raw ids. */
export type CorrectionSuggestion = {
  id: string;
  field: CorrectionField;
  material: { id: string; title: string; subject: { code: string | null; name: string } };
  current: string;
  proposed: string;
  comment: string | null;
  createdAt: string;
  /** Only moderation sees who suggested it. */
  suggester?: string;
};

export const CORRECTION_FIELD_LABELS: Record<CorrectionField, string> = {
  SUBJECT: 'Materia',
  RESOURCE_TYPE: 'Tipo de recurso',
  ACADEMIC_YEAR: 'Ciclo lectivo',
  PROFESSOR: 'Profesor',
};

export async function getMyPrivileges(): Promise<MyPrivileges> {
  const { data } = await api.get<MyPrivileges>('/users/me/privileges');
  return data;
}

export async function getCorrectionOptions(materialId: string): Promise<CorrectionOptions> {
  const { data } = await api.get<CorrectionOptions>(`/materials/${materialId}/correction-options`);
  return data;
}

export async function suggestCorrection(
  materialId: string,
  body: { field: CorrectionField; proposedValue: string | null; comment?: string },
) {
  const { data } = await api.post<{ id: string }>(`/materials/${materialId}/corrections`, body);
  return data;
}

export async function getMyCorrectionSuggestions(): Promise<CorrectionSuggestion[]> {
  const { data } = await api.get<CorrectionSuggestion[]>('/users/me/correction-suggestions');
  return data;
}

export async function decideMyCorrection(id: string, accept: boolean) {
  await api.post(`/correction-suggestions/${id}/${accept ? 'accept' : 'reject'}`);
}

export async function getModerationCorrections(): Promise<CorrectionSuggestion[]> {
  const { data } = await api.get<CorrectionSuggestion[]>('/moderation/corrections');
  return data;
}

export async function decideModerationCorrection(id: string, accept: boolean) {
  await api.post(`/moderation/corrections/${id}/${accept ? 'accept' : 'reject'}`);
}

export async function promoteToModerator(userId: string) {
  await api.post(`/moderation/users/${userId}/promote`);
}

/**
 * A decision refused because the suggestion no longer applies (the field
 * changed, the material left, or the author's 7 days ran out): it leaves the
 * list. «Material en revisión» is not one of these: it comes back.
 */
export function noLongerApplies(error: unknown) {
  const response = (error as { response?: { status?: number; data?: { code?: string } } }).response;
  return response?.status === 409 && response.data?.code !== 'MATERIAL_UNDER_REVIEW';
}
