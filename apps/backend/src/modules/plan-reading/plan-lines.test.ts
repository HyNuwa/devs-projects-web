import { describe, expect, it } from 'vitest';

import type { ModelMateria } from './plan-model';
import { buildLines } from './plan-lines';

const m = (extra: Partial<ModelMateria>): ModelMateria => ({
  year: 1,
  cuatrimestre: '1',
  optativa: false,
  nombre: 'Álgebra',
  creditos: null,
  ...extra,
});

describe('buildLines', () => {
  it('writes carga masiva lines, optativas as O;;nombre', () => {
    const result = buildLines(
      [
        m({ nombre: 'Análisis Matemático I', creditos: 8 }),
        m({ year: 2, cuatrimestre: 'A', nombre: 'Taller I' }),
        m({
          year: null,
          cuatrimestre: null,
          optativa: true,
          nombre: 'Robótica',
          creditos: 6,
        }),
        m({ year: 4, cuatrimestre: '2', optativa: true, nombre: 'Visión' }),
      ],
      ['Usé el plan 2023.'],
    );
    expect(result.text).toBe(
      [
        '1;1;Análisis Matemático I;8',
        '2;A;Taller I',
        'O;;Robótica;6',
        'O;;Visión',
      ].join('\n'),
    );
    expect(result.lines).toBe(4);
    expect(result.notices).toEqual(['Usé el plan 2023.']);
  });

  it('cleans names that would break the format', () => {
    const { text } = buildLines([m({ nombre: '  Física;\nGeneral  ' })], []);
    expect(text).toBe('1;1;Física General');
  });

  it('turns invalid rows into one notice instead of lines', () => {
    const result = buildLines(
      [
        m({ nombre: 'Bien' }),
        m({ nombre: 'Sin año', year: null }),
        m({ nombre: 'Año 12', year: 12 }),
        m({ nombre: '' }),
        m({ nombre: 'x'.repeat(151) }),
      ],
      [],
    );
    expect(result.text).toBe('1;1;Bien');
    expect(result.notices).toEqual([
      expect.stringMatching(
        /^Descarté 4 filas que no entendí: Sin año, Año 12, /,
      ),
    ]);
  });

  it('drops créditos out of range and repeated materias', () => {
    const result = buildLines(
      [
        m({ nombre: 'Química', creditos: 150 }),
        m({ nombre: 'QUIMICA', year: 2 }),
      ],
      [],
    );
    expect(result.text).toBe('1;1;Química');
    expect(result.notices).toEqual([
      expect.stringMatching(/repetida.*QUIMICA/),
    ]);
  });

  it('cuts after 200 lines with a notice', () => {
    const many = Array.from({ length: 205 }, (_, i) =>
      m({ nombre: `Materia ${i}` }),
    );
    const result = buildLines(many, []);
    expect(result.lines).toBe(200);
    expect(result.notices).toContainEqual(expect.stringMatching(/200/));
  });

  it('caps the model notices in number and length', () => {
    const notices = Array.from({ length: 30 }, () => 'a'.repeat(400));
    const result = buildLines([], notices);
    expect(result.notices).toHaveLength(20);
    expect(result.notices.every((n) => n.length <= 300)).toBe(true);
  });
});
