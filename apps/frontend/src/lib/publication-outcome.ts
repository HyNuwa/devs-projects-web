export type PriorReviewReason = 'NEW_ACCOUNT' | 'UNVERIFIED_EMAIL' | 'RECENT_REMOVAL';

export type PublicationOutcome =
  { outcome: 'PUBLISHED'; reason: null } | { outcome: 'PENDING_REVIEW'; reason: PriorReviewReason };

/** Why a contribution waits for revisión previa, in plain words for its author. */
export const priorReviewReasonText: Record<PriorReviewReason, string> = {
  NEW_ACCOUNT: 'Tu cuenta es nueva: los primeros días revisamos los aportes antes de publicarlos.',
  UNVERIFIED_EMAIL:
    'Todavía no verificaste tu email. Cuando lo verifiques, tus aportes se publican al instante.',
  RECENT_REMOVAL:
    'Tuviste un aporte retirado en los últimos 90 días, así que por ahora lo revisamos antes de publicarlo.',
};

type ApiErrorShape = {
  response?: {
    status?: number;
    data?: { code?: string; materialId?: string; message?: string | string[] };
  };
};

/** Maps the upload refusals from the automatic checks to author-facing messages. */
export function uploadRefusal(error: unknown): { message: string; existingId?: string } | null {
  const response = (error as ApiErrorShape | undefined)?.response;
  if (response?.status === 409 && response.data?.code === 'DUPLICATE_MATERIAL') {
    return {
      message: 'Este archivo ya está publicado en esta materia.',
      existingId: response.data.materialId,
    };
  }
  if (response?.status === 429) {
    return {
      message: 'Llegaste al límite de 10 materiales por día. Probá de nuevo mañana.',
    };
  }
  return null;
}
