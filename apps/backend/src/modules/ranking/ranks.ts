/**
 * Competition ranks for scores already sorted descending: equal scores share the
 * place and the next distinct score skips the shared ones (30, 30, 20 → 1, 1, 3).
 */
export function competitionRanks(scores: number[]) {
  const ranks: number[] = [];
  scores.forEach((score, i) => {
    ranks.push(i > 0 && scores[i - 1] === score ? ranks[i - 1] : i + 1);
  });
  return ranks;
}
