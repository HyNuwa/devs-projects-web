import { api } from '@/lib/api';

/** Solicitudes de carrera, from the student's side (openspec academic-structure/career-requests). */
export type CareerRequestStatus =
  'PENDING' | 'ACCEPTED' | 'PUBLISHED' | 'REJECTED' | 'ALREADY_LOADED' | 'WITHDRAWN';

export type PendingRequest = {
  id: string;
  careerName: string;
  planUrl: string;
  createdAt: string;
  count: number;
  mine: boolean;
  supported: boolean;
};

export type MyCareerRequest = {
  id: string;
  careerName: string;
  planUrl: string;
  faculty: string;
  status: CareerRequestStatus;
  rejectionReason: string | null;
  career: { name: string; path: string } | null;
  count: number;
  mine: boolean;
  createdAt: string;
};

export type NewCareerRequest = {
  facultyId?: string;
  facultyText?: string;
  universityText?: string;
  careerName: string;
  planUrl: string;
  comment?: string;
};

export async function askForCareer(body: NewCareerRequest) {
  return (await api.post<{ id: string }>('/career-requests', body)).data;
}

export async function getPendingRequests(facultyId: string) {
  return (await api.get<PendingRequest[]>('/career-requests', { params: { facultyId } })).data;
}

export async function supportRequest(id: string) {
  await api.post(`/career-requests/${encodeURIComponent(id)}/support`);
}

export async function unsupportRequest(id: string) {
  await api.delete(`/career-requests/${encodeURIComponent(id)}/support`);
}

export async function withdrawRequest(id: string) {
  return (
    await api.delete<{ status: CareerRequestStatus }>(`/career-requests/${encodeURIComponent(id)}`)
  ).data;
}

export async function getMyRequests() {
  return (await api.get<MyCareerRequest[]>('/users/me/career-requests')).data;
}
