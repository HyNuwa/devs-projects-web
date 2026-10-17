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

/** The 403 body of a sign-in refused because of a suspensión. */
export type SuspensionNotice = {
  code: 'ACCOUNT_SUSPENDED';
  message: string;
  reason: string | null;
  until: string | null;
  appealable: boolean;
  appealDeadline: string | null;
  appealStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
  appealAnswer: string | null;
};

export function suspensionNoticeOf(error: unknown): SuspensionNotice | null {
  const response = (error as { response?: { status?: number; data?: { code?: string } } })
    ?.response;
  return response?.status === 403 && response.data?.code === 'ACCOUNT_SUSPENDED'
    ? (response.data as SuspensionNotice)
    : null;
}

/** «Apelar esta suspensión» from sign-in: checks the credentials, never signs in. */
export async function appealSuspension(input: {
  email: string;
  password: string;
  explanation: string;
}) {
  await api.post('/auth/suspension-appeal', input);
}
