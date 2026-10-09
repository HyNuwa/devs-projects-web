/**
 * The academic calendar dated insignias use (openspec reputation/badges). Days
 * are local to the faculty (UTC-3, no DST), as the points caps count them.
 * Cuatrimestres and mesas are defaults in code; the Primera camada window comes
 * from FOUNDER_WINDOW_START and FOUNDER_WINDOW_END.
 */
const LOCAL_OFFSET_MS = -3 * 3_600_000;

export type Semester = { year: number; half: 1 | 2 };

function localParts(date: Date) {
  const local = new Date(date.getTime() + LOCAL_OFFSET_MS);
  return { year: local.getUTCFullYear(), month: local.getUTCMonth() + 1 };
}

/**
 * March–July is the first cuatrimestre and August–December the second; January
 * and February (summer and the February mesas) belong to the preceding second.
 */
export function semesterOf(date: Date): Semester {
  const { year, month } = localParts(date);
  if (month <= 2) return { year: year - 1, half: 2 };
  return { year, half: month <= 7 ? 1 : 2 };
}

const semesterIndex = ({ year, half }: Semester) => year * 2 + (half - 1);

/** The longest run of consecutive cuatrimestres that each hold one of `dates`. */
export function longestConsecutiveSemesters(dates: Date[]) {
  const indexes = [
    ...new Set(dates.map((date) => semesterIndex(semesterOf(date)))),
  ].sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  for (let i = 0; i < indexes.length; i += 1) {
    run = i > 0 && indexes[i] === indexes[i - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return longest;
}

/**
 * The exam period a date falls in, as the edición of «Temporada de finales»:
 * YYYYMM of the period's first month (February–March, July, December), or null.
 */
export function examPeriodEdition(date: Date): number | null {
  const { year, month } = localParts(date);
  if (month === 2 || month === 3) return year * 100 + 2;
  if (month === 7) return year * 100 + 7;
  if (month === 12) return year * 100 + 12;
  return null;
}

/** Local midnight at the start of an ISO date (YYYY-MM-DD), plus `days`. */
function localMidnight(isoDate: string, days = 0) {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days) - LOCAL_OFFSET_MS);
}

/**
 * The platform's first cuatrimestre for «Primera camada», from inclusive local
 * dates; null unless both are configured, so nobody earns it by default.
 */
export function founderWindow(config: { start?: string; end?: string }) {
  if (!config.start || !config.end) return null;
  return {
    start: localMidnight(config.start),
    end: localMidnight(config.end, 1),
  };
}
