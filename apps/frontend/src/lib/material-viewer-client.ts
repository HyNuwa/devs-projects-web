import { api } from '@/lib/api';
import { getData } from '@/lib/apiHelpers';
import type { MaterialHelpfulnessState, MaterialViewerState } from '@/types/material';

function viewerStatePath(id: string): string {
  return `/materials/${encodeURIComponent(id)}/viewer-state`;
}

/**
 * Reads the signed-in viewer's private, per-material state. It is a background read on public
 * pages, so an expired session must degrade the viewer controls instead of leaving the page.
 */
export async function getMaterialViewerState(id: string): Promise<MaterialViewerState> {
  const response = await api.get<MaterialViewerState>(viewerStatePath(id), {
    skipAuthRedirect: true,
  });

  return getData(response);
}

/** The idempotent endpoint reconciles the helpful flag and aggregate count. */
export async function setMaterialHelpfulness(
  id: string,
  isHelpful: boolean,
): Promise<MaterialHelpfulnessState> {
  const response = await api.put<MaterialHelpfulnessState>(
    `/materials/${encodeURIComponent(id)}/helpfulness`,
    { isHelpful },
  );

  return getData(response);
}

/** The idempotent endpoint reconciles the viewer's saved-material flag. */
export async function setMaterialSaved(id: string, isSaved: boolean): Promise<MaterialViewerState> {
  const response = await api.put<MaterialViewerState>(
    `/materials/${encodeURIComponent(id)}/saved`,
    {
      isSaved,
    },
  );

  return getData(response);
}
