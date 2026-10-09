import { nextStatusFor } from './transitions';

describe('nextStatusFor', () => {
  it.each([
    ['KEEP_VISIBLE', 'REPORTS', 'PUBLISHED', 'PUBLISHED'],
    ['KEEP_VISIBLE', 'REPORTS', 'HIDDEN', 'PUBLISHED'],
    ['REMOVE', 'REPORTS', 'PUBLISHED', 'REMOVED'],
    ['REMOVE', 'REPORTS', 'HIDDEN', 'REMOVED'],
    ['RESTORE', 'REPORTS', 'REMOVED', 'PUBLISHED'],
    ['APPROVE', 'PRIOR_REVIEW', 'PENDING_REVIEW', 'PUBLISHED'],
    ['REJECT', 'PRIOR_REVIEW', 'PENDING_REVIEW', 'REJECTED'],
    ['RESUBMIT', 'PRIOR_REVIEW', 'REJECTED', 'PENDING_REVIEW'],
  ] as const)(
    '%s on a %s caso moves %s to %s',
    (decision, kind, current, expected) => {
      expect(nextStatusFor(decision, kind, current)).toBe(expected);
    },
  );

  it.each([
    ['RESTORE', 'REPORTS', 'PUBLISHED'],
    ['KEEP_VISIBLE', 'REPORTS', 'REMOVED'],
    ['REMOVE', 'REPORTS', 'REMOVED'],
    ['KEEP_VISIBLE', 'PRIOR_REVIEW', 'PENDING_REVIEW'],
    ['REMOVE', 'PRIOR_REVIEW', 'PENDING_REVIEW'],
    ['APPROVE', 'REPORTS', 'HIDDEN'],
    ['APPROVE', 'PRIOR_REVIEW', 'REJECTED'],
    ['REJECT', 'REPORTS', 'PUBLISHED'],
    ['RESUBMIT', 'PRIOR_REVIEW', 'PUBLISHED'],
  ] as const)(
    'refuses %s on a %s caso when the content is %s',
    (decision, kind, current) => {
      expect(nextStatusFor(decision, kind, current)).toBeNull();
    },
  );
});
