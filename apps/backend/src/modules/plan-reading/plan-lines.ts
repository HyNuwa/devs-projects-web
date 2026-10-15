import { normalizeSearchKey } from '../../common/search/search-key';
import { BULK_MAX_ROWS } from '../catalog/catalog-bulk.service';
import { CREDITS_MAX, NAME_MAX, YEAR_MAX } from '../catalog/bulk-parser';
import type { ModelMateria } from './plan-model';

export const NOTICES_MAX = 20;
export const NOTICE_LENGTH_MAX = 300;

const label = (name: string) =>
  name ? (name.length > 40 ? `${name.slice(0, 40)}…` : name) : '(sin nombre)';

/**
 * Turns the model's materias into carga masiva text (openspec
 * academic-structure/plan-reading, «What a lectura returns»). The server
 * writes the format, so the model never does: names lose `;` and line breaks,
 * rows that do not fit become one notice, repeated materias are dropped, and
 * at most the carga masiva limit is returned.
 */
export function buildLines(
  materias: ModelMateria[],
  modelNotices: string[],
): { text: string; lines: number; notices: string[] } {
  const notices = modelNotices
    .map((notice) => notice.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, NOTICES_MAX)
    .map((notice) => notice.slice(0, NOTICE_LENGTH_MAX));

  const lines: string[] = [];
  const invalid: string[] = [];
  const repeated: string[] = [];
  const seen = new Set<string>();
  for (const materia of materias) {
    const name = materia.nombre
      .replace(/[;\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const credits =
      Number.isInteger(materia.creditos) &&
      materia.creditos! >= 0 &&
      materia.creditos! <= CREDITS_MAX
        ? `;${materia.creditos}`
        : '';
    let place: string;
    if (materia.optativa) {
      place = 'O;';
    } else if (
      Number.isInteger(materia.year) &&
      materia.year! >= 1 &&
      materia.year! <= YEAR_MAX &&
      materia.cuatrimestre
    ) {
      place = `${materia.year};${materia.cuatrimestre}`;
    } else {
      invalid.push(label(name));
      continue;
    }
    if (!name || name.length > NAME_MAX) {
      invalid.push(label(name));
      continue;
    }
    const key = normalizeSearchKey(name);
    if (seen.has(key)) {
      repeated.push(name);
      continue;
    }
    seen.add(key);
    lines.push(`${place};${name}${credits}`);
  }

  if (invalid.length > 0) {
    notices.push(
      `Descarté ${invalid.length} ${invalid.length === 1 ? 'fila' : 'filas'} que no entendí: ${invalid.join(', ')}.`,
    );
  }
  if (repeated.length > 0) {
    notices.push(
      `Quité ${repeated.length} ${repeated.length === 1 ? 'materia repetida' : 'materias repetidas'}: ${repeated.join(', ')}.`,
    );
  }
  if (lines.length > BULK_MAX_ROWS) {
    notices.push(
      `El plan tiene ${lines.length} materias; la carga masiva toma ${BULK_MAX_ROWS} por vez. Cargá el resto en otra tanda.`,
    );
  }
  const kept = lines.slice(0, BULK_MAX_ROWS);
  return { text: kept.join('\n'), lines: kept.length, notices };
}
