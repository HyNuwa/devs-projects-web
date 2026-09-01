import { api } from '@/lib/api';
import { getData } from '@/lib/apiHelpers';
import type { MaterialRating, Paginated } from '@/types/material';

export type MaterialRatingsQuery = {
  limit?: number;
  page?: number;
};

/** Reads public ratings and written comments for an approved material. */
export async function getMaterialRatings(
  id: string,
  query: MaterialRatingsQuery = {},
): Promise<Paginated<MaterialRating>> {
  const response = await api.get<Paginated<MaterialRating>>(
    `/materials/${encodeURIComponent(id)}/ratings`,
    { params: query },
  );

  return getData(response);
}
