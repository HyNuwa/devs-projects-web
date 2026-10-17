// `always` keeps the «hace N …» wording uniform: `auto` would print «ayer» or
// «la semana pasada», and the spec asks for «hace 1 año», «hace 1 mes», etc.
const formatter = new Intl.RelativeTimeFormat('es', { numeric: 'always' });

const MINUTE = 60;

/**
 * «hace 2 días»-style age for experiencia cards (openspec academic-community/
 * experiences): under a minute it reads «ahora», then minutes, hours, days
 * under a week, weeks under five, months under a year, then years.
 */
export function formatRelativeTime(date: Date | string, now: Date): string {
  const then = date instanceof Date ? date : new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < MINUTE) return 'ahora';

  const minutes = Math.floor(seconds / MINUTE);
  if (minutes < 60) return formatter.format(-minutes, 'minute');

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return formatter.format(-hours, 'hour');

  const days = Math.floor(hours / 24);
  if (days < 7) return formatter.format(-days, 'day');

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return formatter.format(-weeks, 'week');

  if (days < 365) {
    const months = Math.min(11, Math.max(1, Math.floor(days / 30)));
    return formatter.format(-months, 'month');
  }

  const years = Math.floor(days / 365);
  return formatter.format(-years, 'year');
}
