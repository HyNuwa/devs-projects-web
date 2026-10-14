import { api } from '@/lib/api';

/** The panel's Catálogo tab (openspec academic-structure/catalog-editing). */
export type CatalogKind = 'UNIVERSITY' | 'FACULTY' | 'CAREER' | 'SUBJECT';
export type CareerStatus = 'DRAFT' | 'PUBLISHED';
/** 0 = anual, 1 and 2 = cuatrimestres. */
export type Semester = 0 | 1 | 2;

export type AdminUniversity = { id: string; name: string; shortName: string; facultyCount: number };
export type AdminFaculty = {
  id: string;
  name: string;
  shortName: string;
  careerCount: number;
  subjectCount: number;
  moderatorCount: number;
};
export type AdminCareer = {
  id: string;
  name: string;
  code: string;
  status: CareerStatus;
  planUrl: string | null;
};
export type AdminSubject = { id: string; name: string; code: string | null; materialCount: number };
export type Placement = {
  subjectId: string;
  name: string;
  code: string | null;
  year: number;
  semester: Semester;
  credits: number | null;
};
export type AdminCareerDetail = AdminCareer & {
  declarationCount: number;
  faculty: {
    id: string;
    name: string;
    shortName: string;
    university: { id: string; name: string; shortName: string };
  };
  placements: Placement[];
};

export type BulkPreviewRow = {
  line: number;
  year: number | null;
  semester: Semester | null;
  name: string;
  credits: number | null;
  errors: string[];
  action: 'reuse' | 'new' | 'invalid';
  subjectId: string | null;
  code: string | null;
  placement: 'add' | 'update' | 'unchanged' | null;
};
export type BulkRow = {
  action: 'reuse' | 'new';
  subjectId?: string;
  name?: string;
  code?: string;
  year: number;
  semester: Semester;
  credits: number | null;
};

export type AliasHolder = {
  kind: CatalogKind;
  id: string;
  name: string;
  shortName?: string;
  code?: string | null;
};

export type AdminCareerRequest = {
  id: string;
  careerName: string;
  planUrl: string;
  comment: string | null;
  facultyText: string | null;
  universityText: string | null;
  createdAt: string;
  updatedAt: string;
  author: string;
  count: number;
  faculty: {
    id: string;
    name: string;
    shortName: string;
    university: { id: string; name: string; shortName: string };
  } | null;
};

export type AcceptRequestBody = {
  /** An existing facultad, for a solicitud whose facultad was free text. */
  facultyId?: string;
  career: { name: string; code: string };
  faculty?: {
    name: string;
    shortName: string;
    universityId?: string;
    university?: { name: string; shortName: string };
  };
};

/** Refusals with a field or the list of what blocks a deletion. */
export type CatalogError = {
  code?: string;
  field?: string;
  blockers?: Record<string, number>;
  errors?: { index: number; message: string }[];
  message?: string;
};

export function catalogError(error: unknown): CatalogError {
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as { response?: { data?: CatalogError } }).response?.data;
    if (data) return data;
  }
  return {};
}

const base = '/admin/catalog';
const id = encodeURIComponent;

export const catalogAdmin = {
  universities: async () => (await api.get<AdminUniversity[]>(`${base}/universities`)).data,
  faculties: async (universityId: string) =>
    (await api.get<AdminFaculty[]>(`${base}/universities/${id(universityId)}/faculties`)).data,
  careers: async (facultyId: string) =>
    (await api.get<AdminCareer[]>(`${base}/faculties/${id(facultyId)}/careers`)).data,
  subjects: async (facultyId: string) =>
    (await api.get<AdminSubject[]>(`${base}/faculties/${id(facultyId)}/subjects`)).data,
  career: async (careerId: string) =>
    (await api.get<AdminCareerDetail>(`${base}/careers/${id(careerId)}`)).data,

  createUniversity: async (body: { name: string; shortName: string }) =>
    (await api.post<{ id: string }>(`${base}/universities`, body)).data,
  updateUniversity: async (universityId: string, body: { name?: string; shortName?: string }) =>
    (await api.patch(`${base}/universities/${id(universityId)}`, body)).data,
  createFaculty: async (body: { universityId: string; name: string; shortName: string }) =>
    (await api.post<{ id: string }>(`${base}/faculties`, body)).data,
  updateFaculty: async (facultyId: string, body: { name?: string; shortName?: string }) =>
    (await api.patch(`${base}/faculties/${id(facultyId)}`, body)).data,
  createCareer: async (body: { facultyId: string; name: string; code: string; planUrl?: string }) =>
    (await api.post<AdminCareer>(`${base}/careers`, body)).data,
  updateCareer: async (
    careerId: string,
    body: { name?: string; code?: string; planUrl?: string | null },
  ) => (await api.patch(`${base}/careers/${id(careerId)}`, body)).data,
  publish: async (careerId: string) =>
    (await api.post(`${base}/careers/${id(careerId)}/publish`)).data,
  unpublish: async (careerId: string) =>
    (await api.post(`${base}/careers/${id(careerId)}/unpublish`)).data,

  codeProposal: async (facultyId: string, name: string) =>
    (await api.post<{ code: string }>(`${base}/subjects/code-proposal`, { facultyId, name })).data
      .code,
  createSubject: async (body: { facultyId: string; name: string; code?: string }) =>
    (await api.post<AdminSubject>(`${base}/subjects`, body)).data,
  updateSubject: async (subjectId: string, body: { name?: string; code?: string }) =>
    (await api.patch(`${base}/subjects/${id(subjectId)}`, body)).data,

  setPlacement: async (
    careerId: string,
    subjectId: string,
    body: { year: number; semester: Semester; credits: number | null },
  ) => (await api.put(`${base}/careers/${id(careerId)}/placements/${id(subjectId)}`, body)).data,
  removePlacement: async (careerId: string, subjectId: string) => {
    await api.delete(`${base}/careers/${id(careerId)}/placements/${id(subjectId)}`);
  },

  remove: async (kind: CatalogKind, entityId: string) => {
    const path = {
      UNIVERSITY: 'universities',
      FACULTY: 'faculties',
      CAREER: 'careers',
      SUBJECT: 'subjects',
    }[kind];
    await api.delete(`${base}/${path}/${id(entityId)}`);
  },

  slugCheck: async (kind: CatalogKind, parentId: string | null, slug: string) =>
    (
      await api.get<{ alias: AliasHolder | null }>(`${base}/slug-check`, {
        params: { kind, slug, ...(parentId ? { parentId } : {}) },
      })
    ).data.alias,

  bulkPreview: async (careerId: string, text: string) =>
    (await api.post<BulkPreviewRow[]>(`${base}/careers/${id(careerId)}/bulk/preview`, { text }))
      .data,
  bulkApply: async (careerId: string, rows: BulkRow[]) =>
    (
      await api.post<{ created: number; added: number; updated: number }>(
        `${base}/careers/${id(careerId)}/bulk/apply`,
        { rows },
      )
    ).data,

  requests: async () => (await api.get<AdminCareerRequest[]>(`${base}/requests`)).data,
  requestCount: async () =>
    (await api.get<{ pending: number }>(`${base}/requests/count`)).data.pending,
  acceptRequest: async (requestId: string, body: AcceptRequestBody) =>
    (await api.post<{ careerId: string }>(`${base}/requests/${id(requestId)}/accept`, body)).data,
  rejectRequest: async (requestId: string, reason: string) => {
    await api.post(`${base}/requests/${id(requestId)}/reject`, { reason });
  },
  alreadyLoaded: async (requestId: string, careerId: string) => {
    await api.post(`${base}/requests/${id(requestId)}/already-loaded`, { careerId });
  },
};
