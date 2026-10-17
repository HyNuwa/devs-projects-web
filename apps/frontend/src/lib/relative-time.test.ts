import { describe, expect, it } from 'vitest';

import { formatRelativeTime } from './relative-time';

const now = new Date('2026-09-15T12:00:00.000Z');
const ago = (ms: number) => new Date(now.getTime() - ms);

describe('formatRelativeTime', () => {
  it('reads «ahora» under a minute', () => {
    expect(formatRelativeTime(ago(30 * 1000), now)).toBe('ahora');
    expect(formatRelativeTime(ago(59_999), now)).toBe('ahora');
  });

  it('reads minutes and hours', () => {
    expect(formatRelativeTime(ago(60 * 1000), now)).toBe('hace 1 minuto');
    expect(formatRelativeTime(ago(5 * 60 * 1000), now)).toBe('hace 5 minutos');
    expect(formatRelativeTime(ago(3 * 60 * 60 * 1000), now)).toBe('hace 3 horas');
    expect(formatRelativeTime(ago(23 * 60 * 60 * 1000), now)).toBe('hace 23 horas');
  });

  it('reads days under a week', () => {
    expect(formatRelativeTime(ago(24 * 60 * 60 * 1000), now)).toBe('hace 1 día');
    expect(formatRelativeTime(ago(2 * 24 * 60 * 60 * 1000), now)).toBe('hace 2 días');
    expect(formatRelativeTime(ago(6 * 24 * 60 * 60 * 1000), now)).toBe('hace 6 días');
  });

  it('reads weeks under five', () => {
    expect(formatRelativeTime(ago(7 * 24 * 60 * 60 * 1000), now)).toBe('hace 1 semana');
    expect(formatRelativeTime(ago(3 * 7 * 24 * 60 * 60 * 1000), now)).toBe('hace 3 semanas');
  });

  it('reads months under a year', () => {
    expect(formatRelativeTime(ago(35 * 24 * 60 * 60 * 1000), now)).toBe('hace 1 mes');
    expect(formatRelativeTime(ago(60 * 24 * 60 * 60 * 1000), now)).toBe('hace 2 meses');
    expect(formatRelativeTime(ago(360 * 24 * 60 * 60 * 1000), now)).toBe('hace 11 meses');
  });

  it('reads years from 365 days on and accepts strings', () => {
    expect(formatRelativeTime(ago(365 * 24 * 60 * 60 * 1000), now)).toBe('hace 1 año');
    expect(formatRelativeTime(ago(800 * 24 * 60 * 60 * 1000), now)).toBe('hace 2 años');
    expect(formatRelativeTime('2026-09-15T11:00:00.000Z', now)).toBe('hace 1 hora');
  });
});
