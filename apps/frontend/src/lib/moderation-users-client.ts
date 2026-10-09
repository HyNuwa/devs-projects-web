import { api } from '@/lib/api';

export type SuggestedStep = 'NONE' | 'WARNING' | 'MUTE' | 'PROPOSE_SUSPENSION';
export type SanctionType = 'WARNING' | 'MUTE' | 'SUSPENSION';
export type SanctionAction =
  | 'WARN'
  | 'MUTE'
  | 'UNMUTE'
  | 'PROPOSE_SUSPENSION'
  | 'SUSPEND'
  | 'DECIDE_PROPOSAL'
  | 'LIFT_SUSPENSION';
export type SuspensionDuration = '7_DAYS' | '30_DAYS' | 'PERMANENT';
export type UsersFilter = 'suggested' | 'sanctioned' | 'prior-review';

export type AccountStatus = {
  kind: 'ACTIVE' | 'WARNED' | 'MUTED' | 'SUSPENDED';
  until: string | null;
};

export type UserListItem = {
  id: string;
  username: string;
  career: string | null;
  createdAt: string;
  accountAgeDays: number;
  emailVerified: boolean;
  status: AccountStatus;
  suggestedStep: SuggestedStep;
};

export type SuspensionProposal = {
  id: string;
  reason: string;
  durationDays: number | null;
  createdAt: string;
  user: { id: string; username: string };
  proposedBy: { username: string | null };
};

export type UsersList = {
  users: UserListItem[];
  /** Pending suspension proposals; only for admins. */
  proposals: SuspensionProposal[] | null;
};

export type TimelineEntry =
  | {
      type: 'CASE';
      date: string;
      decision: string | null;
      reverted: boolean;
      label: string;
      caseId: string;
    }
  | {
      type: 'SANCTION';
      kind: SanctionType;
      reason: string;
      date: string;
      until: string | null;
      lifted: boolean;
      voided: boolean;
      caseId?: string;
      anonymousCase?: boolean;
    }
  | { type: 'REPORT_DISMISSED'; date: string; reason: string }
  | { type: 'ACCOUNT_CREATED'; date: string; emailVerified: boolean };

export type UserFile = UserListItem & {
  role: string;
  emailMasked: string;
  counts: { published: number; retiros90d: number };
  resolvedReports: number;
  reportPrecision: number | null;
  nextStepIfRetired: SuggestedStep | null;
  openCases: Array<{ caseId: string; kind: string; openedAt: string; label: string }>;
  pendingProposal: {
    id: string;
    reason: string;
    durationDays: number | null;
    createdAt: string;
  } | null;
  timeline: TimelineEntry[];
  actions: SanctionAction[];
};

export async function getModerationUsers(params: { filter?: UsersFilter; q?: string }) {
  return (await api.get<UsersList>('/moderation/users', { params })).data;
}

export async function getModerationUser(userId: string) {
  return (await api.get<UserFile>(`/moderation/users/${encodeURIComponent(userId)}`)).data;
}

const userPath = (userId: string, action: string) =>
  `/moderation/users/${encodeURIComponent(userId)}/${action}`;

export async function warnUser(userId: string, reason: string) {
  await api.post(userPath(userId, 'warn'), { reason });
}

export async function muteUser(userId: string, reason: string) {
  await api.post(userPath(userId, 'mute'), { reason });
}

export async function unmuteUser(userId: string, reason: string) {
  await api.post(userPath(userId, 'unmute'), { reason });
}

export async function proposeSuspension(
  userId: string,
  reason: string,
  duration: SuspensionDuration,
) {
  await api.post(userPath(userId, 'suspension-proposals'), { reason, duration });
}

export async function suspendUser(
  userId: string,
  reason: string,
  duration: SuspensionDuration,
  retireContributions: boolean,
) {
  await api.post(userPath(userId, 'suspend'), { reason, duration, retireContributions });
}

export async function liftSuspension(userId: string, reason: string) {
  await api.post(userPath(userId, 'lift-suspension'), { reason });
}

export async function confirmProposal(
  proposalId: string,
  input: { reason: string; duration?: SuspensionDuration; retireContributions?: boolean },
) {
  await api.post(
    `/moderation/suspension-proposals/${encodeURIComponent(proposalId)}/confirm`,
    input,
  );
}

export async function rejectProposal(proposalId: string, reason: string) {
  await api.post(`/moderation/suspension-proposals/${encodeURIComponent(proposalId)}/reject`, {
    reason,
  });
}
