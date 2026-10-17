import { describe, expect, it } from 'vitest';

import { type SanctionHistory, suggestedStep } from './escalera';

const now = new Date('2026-09-30T12:00:00.000Z');
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 3_600_000);

const history = (partial: Partial<SanctionHistory>): SanctionHistory => ({
  retiros: [],
  warnings: [],
  mutes: [],
  suspensions: [],
  ...partial,
});

describe('suggestedStep', () => {
  it('suggests nothing without retiros', () => {
    expect(suggestedStep(history({}), now)).toBe('NONE');
  });

  it('suggests an advertencia for a first retiro in 90 days', () => {
    expect(suggestedStep(history({ retiros: [daysAgo(1)] }), now)).toBe(
      'WARNING',
    );
  });

  it('suggests silencing 7 days for a second retiro in 90 days', () => {
    expect(
      suggestedStep(
        history({
          retiros: [daysAgo(40), daysAgo(1)],
          warnings: [daysAgo(40)],
        }),
        now,
      ),
    ).toBe('MUTE');
  });

  it('suggests proposing a suspensión for a third retiro in 90 days', () => {
    expect(
      suggestedStep(
        history({ retiros: [daysAgo(80), daysAgo(40), daysAgo(1)] }),
        now,
      ),
    ).toBe('PROPOSE_SUSPENSION');
  });

  it('suggests a suspensión for a retiro after a silenciamiento in the last 90 days', () => {
    expect(
      suggestedStep(
        history({ retiros: [daysAgo(95), daysAgo(1)], mutes: [daysAgo(30)] }),
        now,
      ),
    ).toBe('PROPOSE_SUSPENSION');
  });

  it('ignores retiros older than 90 days', () => {
    expect(
      suggestedStep(history({ retiros: [daysAgo(120), daysAgo(1)] }), now),
    ).toBe('WARNING');
  });

  it('ignores an advertencia older than 90 days', () => {
    expect(
      suggestedStep(
        history({
          retiros: [daysAgo(100), daysAgo(1)],
          warnings: [daysAgo(100)],
        }),
        now,
      ),
    ).toBe('WARNING');
  });

  it('ignores a silenciamiento older than 90 days', () => {
    expect(
      suggestedStep(
        history({ retiros: [daysAgo(1)], mutes: [daysAgo(100)] }),
        now,
      ),
    ).toBe('WARNING');
  });

  it('keeps counting a suspensión forever', () => {
    expect(
      suggestedStep(
        history({ retiros: [daysAgo(1)], suspensions: [daysAgo(400)] }),
        now,
      ),
    ).toBe('PROPOSE_SUSPENSION');
  });

  describe('when the step was already applied for the latest retiro', () => {
    it('suggests nothing after the advertencia for a first retiro', () => {
      expect(
        suggestedStep(
          history({ retiros: [daysAgo(3)], warnings: [daysAgo(3)] }),
          now,
        ),
      ).toBe('NONE');
    });

    it('suggests nothing after silencing for a second retiro', () => {
      expect(
        suggestedStep(
          history({
            retiros: [daysAgo(40), daysAgo(5)],
            warnings: [daysAgo(40)],
            mutes: [daysAgo(5)],
          }),
          now,
        ),
      ).toBe('NONE');
    });

    it('still suggests silencing when only an advertencia followed a second retiro', () => {
      expect(
        suggestedStep(
          history({
            retiros: [daysAgo(40), daysAgo(5)],
            warnings: [daysAgo(4)],
          }),
          now,
        ),
      ).toBe('MUTE');
    });
  });
});
