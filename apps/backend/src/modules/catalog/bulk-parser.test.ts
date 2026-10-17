import { describe, expect, it } from 'vitest';

import { parseBulk } from './bulk-parser';

describe('parseBulk', () => {
  it('reads lines with and without créditos', () => {
    expect(parseBulk('1;1;Álgebra Lineal;6\n1;2; Física I ')).toEqual([
      {
        line: 1,
        year: 1,
        semester: 1,
        name: 'Álgebra Lineal',
        credits: 6,
        optativa: false,
        errors: [],
      },
      {
        line: 2,
        year: 1,
        semester: 2,
        name: 'Física I',
        credits: null,
        optativa: false,
        errors: [],
      },
    ]);
  });

  it('reads O and o as optativa, without año or cuatrimestre', () => {
    expect(parseBulk('O;;Robótica\no;;Inteligencia Artificial;6')).toEqual([
      {
        line: 1,
        year: null,
        semester: null,
        name: 'Robótica',
        credits: null,
        optativa: true,
        errors: [],
      },
      {
        line: 2,
        year: null,
        semester: null,
        name: 'Inteligencia Artificial',
        credits: 6,
        optativa: true,
        errors: [],
      },
    ]);
  });

  it.each(['O;2;Robótica', 'O;A;Robótica'])(
    'refuses a cuatrimestre on an optativa: %s',
    (line) => {
      const [row] = parseBulk(line);
      expect(row.optativa).toBe(true);
      expect(row.errors).toEqual([
        'Una optativa no lleva cuatrimestre: O;;nombre;créditos.',
      ]);
    },
  );

  it('reads A and a as anual', () => {
    const rows = parseBulk('2;A;Anatomía\n3;a;Fisiología');
    expect(rows.map((row) => row.semester)).toEqual([0, 0]);
  });

  it('skips empty lines but keeps line numbers', () => {
    const rows = parseBulk('\n1;1;Química\r\n   \n2;2;Biología\n');
    expect(rows.map((row) => [row.line, row.name])).toEqual([
      [2, 'Química'],
      [4, 'Biología'],
    ]);
  });

  it.each([
    ['0;1;Física', 'año'],
    ['11;1;Física', 'año'],
    ['x;1;Física', 'año'],
    ['1;3;Física', 'cuatrimestre'],
    ['1;1;', 'nombre'],
    ['1;1', 'nombre'],
    [`1;1;${'a'.repeat(151)}`, 'nombre'],
    ['1;1;Física;100', 'créditos'],
    ['1;1;Física;-1', 'créditos'],
    ['1;1;Física;6;extra', 'columnas'],
  ])('reports %s as invalid (%s)', (text, field) => {
    const [row] = parseBulk(text);
    expect(row.line).toBe(1);
    expect(row.errors.join(' ')).toContain(field);
  });
});
