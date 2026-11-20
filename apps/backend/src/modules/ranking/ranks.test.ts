import { describe, expect, it } from 'vitest';

import { competitionRanks } from './ranks';

describe('competitionRanks', () => {
  it('shares the place on a tie and skips the next one', () => {
    expect(competitionRanks([30, 30, 20])).toEqual([1, 1, 3]);
  });

  it('ranks distinct scores in order', () => {
    expect(competitionRanks([9, 5, 5, 5, 1])).toEqual([1, 2, 2, 2, 5]);
    expect(competitionRanks([])).toEqual([]);
  });
});
