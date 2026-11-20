/** Longest materia code (openspec academic-structure/catalog-editing). */
export const CODE_MAX = 60;

/** Short names and codes are URL segments: ASCII letters, digits and hyphens. */
export const SLUG_PATTERN = /^[A-Za-z0-9-]+$/;

/** «Álgebra Lineal (I)» → «algebra-lineal-i». */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fit(base: string, suffix: string) {
  return base.slice(0, CODE_MAX - suffix.length).replace(/-+$/, '') + suffix;
}

/**
 * Proposed code for a new materia: universidad, facultad and name, with -2,
 * -3… when `taken` (lowercase codes and materia aliases, plus earlier rows of
 * the same batch) already has it.
 */
export function proposeSubjectCode(
  universityShortName: string,
  facultyShortName: string,
  name: string,
  taken: ReadonlySet<string>,
): string {
  const base = [universityShortName, facultyShortName, name]
    .map(slugify)
    .filter(Boolean)
    .join('-');
  const has = (code: string) => taken.has(code.toLowerCase());

  let code = fit(base, '');
  for (let n = 2; has(code); n += 1) code = fit(base, `-${n}`);
  return code;
}
