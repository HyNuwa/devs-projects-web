import type {
  ModerationCaseKind,
  ModerationDecision,
  PublicationStatus,
} from '../../generated/prisma';

export type PublicationAction = ModerationDecision | 'RESUBMIT';

type Transition = {
  kind: ModerationCaseKind;
  from: readonly PublicationStatus[];
  to: PublicationStatus;
};

// docs/README_MODERACION.md §3.3, §4.3 and §5.
const transitions: Record<PublicationAction, Transition> = {
  KEEP_VISIBLE: {
    kind: 'REPORTS',
    from: ['PUBLISHED', 'HIDDEN'],
    to: 'PUBLISHED',
  },
  REMOVE: { kind: 'REPORTS', from: ['PUBLISHED', 'HIDDEN'], to: 'REMOVED' },
  RESTORE: { kind: 'REPORTS', from: ['REMOVED'], to: 'PUBLISHED' },
  APPROVE: { kind: 'PRIOR_REVIEW', from: ['PENDING_REVIEW'], to: 'PUBLISHED' },
  REJECT: { kind: 'PRIOR_REVIEW', from: ['PENDING_REVIEW'], to: 'REJECTED' },
  RESUBMIT: { kind: 'PRIOR_REVIEW', from: ['REJECTED'], to: 'PENDING_REVIEW' },
};

/** The publication status an action leads to, or null when the action is not allowed. */
export function nextStatusFor(
  action: PublicationAction,
  kind: ModerationCaseKind,
  current: PublicationStatus,
): PublicationStatus | null {
  const transition = transitions[action];
  return transition.kind === kind && transition.from.includes(current)
    ? transition.to
    : null;
}
