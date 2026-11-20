import { describe, expect, it } from 'vitest';

import { CODE_MAX, proposeSubjectCode, slugify } from './catalog-codes';

describe('slugify', () => {
  it('lowercases and strips accents', () => {
    expect(slugify('Álgebra Lineal')).toBe('algebra-lineal');
  });

  it('turns runs of other characters into one hyphen and trims them', () => {
    expect(slugify('  Física I (teórica) / 2.º ')).toBe('fisica-i-teorica-2-o');
  });

  it('keeps ñ as n', () => {
    expect(slugify('Diseño')).toBe('diseno');
  });
});

describe('proposeSubjectCode', () => {
  const none = new Set<string>();

  it('joins universidad, facultad and name', () => {
    expect(proposeSubjectCode('UNSa', 'FCE', 'Álgebra Lineal', none)).toBe(
      'unsa-fce-algebra-lineal',
    );
  });

  it('appends -2, -3 when the code is taken', () => {
    const taken = new Set(['unsa-fce-algebra', 'unsa-fce-algebra-2']);
    expect(proposeSubjectCode('UNSa', 'FCE', 'Álgebra', taken)).toBe(
      'unsa-fce-algebra-3',
    );
  });

  it('compares taken codes ignoring case', () => {
    const taken = new Set(['unsa-fce-algebra']);
    expect(proposeSubjectCode('UNSA', 'fce', 'ALGEBRA', taken)).toBe(
      'unsa-fce-algebra-2',
    );
  });

  it('trims to the maximum length, keeping room for the suffix', () => {
    const name =
      'Introducción a la Teoría General de Sistemas Complejos y Dinámicos';
    const code = proposeSubjectCode('UNCuyo', 'FCEN', name, none);
    expect(code.length).toBeLessThanOrEqual(CODE_MAX);
    expect(code.endsWith('-')).toBe(false);

    const second = proposeSubjectCode('UNCuyo', 'FCEN', name, new Set([code]));
    expect(second.length).toBeLessThanOrEqual(CODE_MAX);
    expect(second.endsWith('-2')).toBe(true);
  });
});
