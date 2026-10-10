export interface RpgLevel {
  level: number;
  name: string;
  points: number;
  /** What reaching the level unlocks, as «Tu progreso» shows it. */
  unlocks: string;
}

/**
 * The levels table of docs/README_PUNTOS_E_INSIGNIAS §4, in ascending order.
 * Unlocks are shown in «Tu progreso» and applied by `users/profile-options.ts`.
 */
export const RPG_LEVELS: RpgLevel[] = [
  {
    level: 1,
    name: 'Primeros pasos',
    points: 0,
    unlocks: '4 avatares de gato básicos',
  },
  {
    level: 2,
    name: 'Bigotes curiosos',
    points: 30,
    unlocks: '4 avatares de gato más y fijar 1 aporte destacado en tu perfil',
  },
  {
    level: 3,
    name: 'De pasillo en pasillo',
    points: 100,
    unlocks:
      'Color de acento del perfil, fijar hasta 3 aportes y el privilegio Sugerir correcciones',
  },
  {
    level: 4,
    name: 'Mochila cargada',
    points: 250,
    unlocks: 'Fondo del perfil: cuadriculado, hoja de apuntes o pixel',
  },
  {
    level: 5,
    name: 'Siete vidas',
    points: 500,
    unlocks: 'Marco de avatar y banner ilustrado en el perfil',
  },
  {
    level: 6,
    name: 'Apuntes de oro',
    points: 900,
    unlocks: 'Título visible, elegido entre tus insignias',
  },
  {
    level: 7,
    name: 'Biblioteca viva',
    points: 1500,
    unlocks: 'Avatares de gato de edición especial',
  },
  {
    level: 8,
    name: 'Faro de la carrera',
    points: 2300,
    unlocks: 'Tema de perfil exclusivo',
  },
  {
    level: 9,
    name: 'Memoria de la facultad',
    points: 3300,
    unlocks: 'Gato animado en el perfil',
  },
  {
    level: 10,
    name: 'Leyenda de la facultad',
    points: 4500,
    unlocks: 'Marco legendario y mención en «Leyendas de la facultad»',
  },
];

/** The level for a points total; a negative total counts as zero. */
export function levelForPoints(points: number): number {
  const total = Math.max(0, points);
  let level = RPG_LEVELS[0].level;
  for (const entry of RPG_LEVELS) {
    if (total < entry.points) break;
    level = entry.level;
  }
  return level;
}

/** The next level and the points still missing for it; null at the top level. */
export function nextLevel(points: number) {
  const total = Math.max(0, points);
  const next = RPG_LEVELS.find((entry) => entry.points > total);
  return next ? { ...next, missing: next.points - total } : null;
}
