import { normalizeSearchKey } from '../../common/search/search-key';
import { BULK_MAX_ROWS } from '../catalog/catalog-bulk.service';
import { CREDITS_MAX, NAME_MAX, YEAR_MAX } from '../catalog/bulk-parser';
import type { ModelMateria } from './plan-model';

export const NOTICES_MAX = 20;
export const NOTICE_LENGTH_MAX = 300;

/** Controls other than whitespace, plus format characters: bidi and zero-width. */
// eslint-disable-next-line no-control-regex -- matching control characters is the point: they are stripped from model output.
const INVISIBLE = /[\u0000-\u0008\u000E-\u001F\u007F-\u009F\p{Cf}]/gu;

const label = (name: string) =>
  name ? (name.length > 40 ? `${name.slice(0, 40)}…` : name) : '(sin nombre)';

const cap = (notice: string) =>
  notice.length > NOTICE_LENGTH_MAX
    ? `${notice.slice(0, NOTICE_LENGTH_MAX - 1)}…`
    : notice;

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
  const lines: string[] = [];
  const invalid: string[] = [];
  const repeated: string[] = [];
  const seen = new Set<string>();
  for (const materia of materias) {
    const name = materia.nombre
      .replace(INVISIBLE, '')
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

  const own: string[] = [];
  if (invalid.length > 0) {
    own.push(
      `Descarté ${invalid.length} ${invalid.length === 1 ? 'fila' : 'filas'} que no entendí: ${invalid.join(', ')}.`,
    );
  }
  if (repeated.length > 0) {
    own.push(
      `Quité ${repeated.length} ${repeated.length === 1 ? 'materia repetida' : 'materias repetidas'}: ${repeated.join(', ')}.`,
    );
  }
  if (lines.length > BULK_MAX_ROWS) {
    own.push(
      `El plan tiene ${lines.length} materias; la carga masiva toma ${BULK_MAX_ROWS} por vez. Cargá el resto en otra tanda.`,
    );
  }
  const notices = [
    ...modelNotices
      .map((notice) => notice.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, NOTICES_MAX - own.length),
    ...own,
  ].map(cap);
  const kept = lines.slice(0, BULK_MAX_ROWS);
  return { text: kept.join('\n'), lines: kept.length, notices };
}
