export interface RpgLevel {
  level: number;
  name: string;
  points: number;
}

/**
 * Tabla de niveles RPG (fuente: docs/README_BACKEND.md).
 * Ordenada ascendentemente por puntos requeridos.
 */
export const RPG_LEVELS: RpgLevel[] = [
  { level: 1, name: 'Viajero Novato', points: 0 },
  { level: 2, name: 'Aprendiz', points: 50 },
  { level: 3, name: 'Explorador', points: 150 },
  { level: 4, name: 'Aventurero', points: 400 },
  { level: 5, name: 'Caballero del Código', points: 800 },
  { level: 6, name: 'Mago del Saber', points: 1500 },
  { level: 7, name: 'Maestro Arcano', points: 3000 },
  { level: 8, name: 'Guardián Legendario', points: 5000 },
  { level: 9, name: 'Sabio Ancestral', points: 8000 },
  { level: 10, name: 'Leyenda Eterna', points: 12000 },
];

/** Devuelve el nivel correspondiente a una cantidad de puntos. */
export function levelForPoints(points: number): number {
  let level = RPG_LEVELS[0].level;
  for (const entry of RPG_LEVELS) {
    if (points >= entry.points) {
      level = entry.level;
    } else {
      break;
    }
  }
  return level;
}
