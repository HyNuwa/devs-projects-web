import { normalizeSearchKey } from './search-key';

describe('normalizeSearchKey', () => {
  it('elimina acentos, normaliza mayúsculas y colapsa espacios', () => {
    expect(normalizeSearchKey('  ÁLGEBRA   Líneal\nAplicada  ')).toBe(
      'algebra lineal aplicada',
    );
  });

  it('combina nombre y código de materia sin perder el código', () => {
    expect(normalizeSearchKey('Estructura de Datos', 'S2-14')).toBe(
      'estructura de datos s2-14',
    );
  });

  it('produce la misma salida para Unicode compuesto y descompuesto', () => {
    const composed = 'Programación';
    const decomposed = composed.normalize('NFD');

    expect(normalizeSearchKey(composed)).toBe(normalizeSearchKey(decomposed));
  });

  it('ignora partes desconocidas y mantiene una salida determinista', () => {
    const input = ['  Base de Datos ', null, undefined, 'BD-01'] as const;

    expect(normalizeSearchKey(...input)).toBe('base de datos bd-01');
    expect(normalizeSearchKey(...input)).toBe(normalizeSearchKey(...input));
  });
});
