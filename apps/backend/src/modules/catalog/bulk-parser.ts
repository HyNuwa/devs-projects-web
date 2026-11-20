/** 0 = anual, 1 and 2 = cuatrimestres. */
export type Semester = 0 | 1 | 2;

export type ParsedRow = {
  line: number;
  year: number | null;
  semester: Semester | null;
  name: string;
  credits: number | null;
  /** No año or cuatrimestre: `O;;nombre[;créditos]`. */
  optativa: boolean;
  errors: string[];
};

export const YEAR_MAX = 10;
export const NAME_MAX = 150;
export const CREDITS_MAX = 99;

const integer = (text: string) => (/^\d+$/.test(text) ? Number(text) : NaN);

/**
 * Carga masiva: one materia per line, `año;cuatrimestre;nombre[;créditos]`,
 * cuatrimestre 1, 2 or A (anual), or `O;;nombre[;créditos]` for an optativa. Empty lines are skipped; errors are in
 * Spanish because the panel shows them as they are.
 */
export function parseBulk(text: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  text.split(/\r?\n/).forEach((raw, index) => {
    if (!raw.trim()) return;
    const cells = raw.split(';').map((cell) => cell.trim());
    const [yearText = '', semesterText = '', name = '', creditsText] = cells;
    const errors: string[] = [];

    if (cells.length > 4)
      errors.push('Sobran columnas: van año;cuatrimestre;nombre;créditos.');

    const optativa = yearText.toUpperCase() === 'O';
    let year = NaN;
    let semester = NaN;
    if (optativa) {
      if (semesterText)
        errors.push('Una optativa no lleva cuatrimestre: O;;nombre;créditos.');
    } else {
      year = integer(yearText);
      if (!(year >= 1 && year <= YEAR_MAX))
        errors.push(`El año va de 1 a ${YEAR_MAX}, u O para una optativa.`);

      semester =
        semesterText.toUpperCase() === 'A'
          ? 0
          : ['1', '2'].includes(semesterText)
            ? Number(semesterText)
            : NaN;
      if (Number.isNaN(semester))
        errors.push('El cuatrimestre es 1, 2 o A (anual).');
    }

    if (!name) errors.push('Falta el nombre de la materia.');
    else if (name.length > NAME_MAX)
      errors.push(`El nombre tiene más de ${NAME_MAX} caracteres.`);

    let credits: number | null = null;
    if (creditsText !== undefined && creditsText !== '') {
      credits = integer(creditsText);
      if (!(credits >= 0 && credits <= CREDITS_MAX)) {
        errors.push(`Los créditos van de 0 a ${CREDITS_MAX}.`);
        credits = null;
      }
    }

    rows.push({
      line: index + 1,
      year: Number.isNaN(year) ? null : year,
      semester: Number.isNaN(semester) ? null : (semester as Semester),
      name,
      credits,
      optativa,
      errors,
    });
  });
  return rows;
}
