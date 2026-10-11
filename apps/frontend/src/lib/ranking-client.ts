import { api } from '@/lib/api';

/** Bounded rankings (openspec reputation/rankings). */
export type MonthlyEntry = {
  rank: number;
  username: string;
  displayName: string | null;
  level: number;
  points: number;
};

export type MonthlyRanking = {
  career: { id: string; name: string };
  /** YYYY-MM, in Argentina time. */
  month: string;
  entries: MonthlyEntry[];
};

export type MyMonthlyPlace = {
  careerId: string;
  defaultCareerId: string | null;
  me: { rank: number; points: number } | null;
};

export type Legends = {
  faculty: { id: string; name: string };
  entries: { username: string; displayName: string | null }[];
  truncated: boolean;
};

export type TopMaterial = {
  rank: number;
  material: {
    id: string;
    title: string;
    resourceType: string;
    fileType: string;
    academicYear: number | null;
    createdAt: string;
  };
  helpful: number;
};

export type TopMaterials = {
  semester: { year: number; half: 1 | 2 };
  entries: TopMaterial[];
};

export async function getMonthlyRanking(careerId?: string): Promise<MonthlyRanking> {
  const { data } = await api.get<MonthlyRanking>('/ranking/monthly', {
    params: careerId ? { careerId } : undefined,
  });
  return data;
}

export async function getMyMonthlyPlace(careerId?: string): Promise<MyMonthlyPlace> {
  const { data } = await api.get<MyMonthlyPlace>('/ranking/monthly/me', {
    params: careerId ? { careerId } : undefined,
  });
  return data;
}

export async function getLegends(facultyId?: string): Promise<Legends> {
  const { data } = await api.get<Legends>('/ranking/legends', {
    params: facultyId ? { facultyId } : undefined,
  });
  return data;
}

export async function getMyLegendsFaculty(): Promise<{ defaultFacultyId: string | null }> {
  const { data } = await api.get<{ defaultFacultyId: string | null }>('/ranking/legends/me');
  return data;
}

export async function getTopMaterials(code: string): Promise<TopMaterials> {
  const { data } = await api.get<TopMaterials>(
    `/subjects/${encodeURIComponent(code)}/top-materials`,
  );
  return data;
}
