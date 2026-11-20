import { describe, expect, it } from 'vitest';

import { levelForPoints, nextLevel, RPG_LEVELS } from './rpg-levels';

describe('levels table (README_PUNTOS_E_INSIGNIAS §4)', () => {
  it('has the ten neutral names and reachable thresholds', () => {
    expect(
      RPG_LEVELS.map(({ level, name, points }) => [level, name, points]),
    ).toEqual([
      [1, 'Primeros pasos', 0],
      [2, 'Bigotes curiosos', 30],
      [3, 'De pasillo en pasillo', 100],
      [4, 'Mochila cargada', 250],
      [5, 'Siete vidas', 500],
      [6, 'Apuntes de oro', 900],
      [7, 'Biblioteca viva', 1500],
      [8, 'Faro de la carrera', 2300],
      [9, 'Memoria de la facultad', 3300],
      [10, 'Leyenda de la facultad', 4500],
    ]);
  });

  it('says what each level unlocks', () => {
    for (const entry of RPG_LEVELS) {
      expect(entry.unlocks.length).toBeGreaterThan(0);
    }
    expect(RPG_LEVELS[2].unlocks).toContain('Sugerir correcciones');
  });

  it('computes the level from points, starting each level at its threshold', () => {
    expect(levelForPoints(0)).toBe(1);
    expect(levelForPoints(29)).toBe(1);
    expect(levelForPoints(30)).toBe(2);
    expect(levelForPoints(99)).toBe(2);
    expect(levelForPoints(100)).toBe(3);
    expect(levelForPoints(4500)).toBe(10);
    expect(levelForPoints(99_999)).toBe(10);
  });

  it('treats a negative total as zero', () => {
    expect(levelForPoints(-3)).toBe(1);
  });

  it('tells how many points are missing for the next level, or none at the top', () => {
    expect(nextLevel(320)).toEqual(
      expect.objectContaining({ level: 5, name: 'Siete vidas', missing: 180 }),
    );
    expect(nextLevel(-3)).toEqual(
      expect.objectContaining({ level: 2, missing: 30 }),
    );
    expect(nextLevel(4500)).toBeNull();
  });
});
