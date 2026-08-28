export function normalizeSearchKey(
  ...parts: ReadonlyArray<string | null | undefined>
): string {
  return parts
    .filter((part): part is string => typeof part === 'string')
    .join(' ')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
