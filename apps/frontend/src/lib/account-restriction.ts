import { api } from '@/lib/api';

/** A sanción as its own account sees it: never who applied it. */
export type OwnSanction = {
  id: string;
  type: 'WARNING' | 'MUTE' | 'SUSPENSION';
  reason: string;
  since: string;
  until: string | null;
  appealable: boolean;
  appealDeadline: string | null;
  appealStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
};

const dateFormat = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' });

export function formatShortDate(value: string) {
  return dateFormat.format(new Date(value));
}

/** The explanation shown wherever a silenced or suspended account cannot act. */
export function restrictionMessage(restriction: OwnSanction) {
  if (restriction.type === 'SUSPENSION') {
    return restriction.until
      ? `Tu cuenta está suspendida hasta el ${formatShortDate(restriction.until)}.`
      : 'Tu cuenta está suspendida.';
  }
  return `Estás silenciado hasta el ${formatShortDate(restriction.until ?? restriction.since)}: no podés publicar, reportar ni marcar Me sirvió.`;
}

export async function markWarningSeen(sanctionId: string) {
  await api.post(`/me/warnings/${encodeURIComponent(sanctionId)}/seen`);
}

export async function getMySanctions() {
  return (await api.get<Array<OwnSanction & { lifted: boolean; voided: boolean }>>('/me/sanctions'))
    .data;
}
