import { describe, expect, it } from 'vitest';

import { currentDestination, primaryDestinations, uploadDestination } from './navigation';

describe('primary destinations', () => {
  it('lists only the destinations that exist today, in menu order', () => {
    expect(primaryDestinations.map(({ label, href }) => [label, href])).toEqual([
      ['Inicio', '/'],
      ['Materias', '/materias'],
      ['Experiencias', '/resenas'],
    ]);
  });

  it('sends Subir to the upload form', () => {
    expect(uploadDestination.href).toBe('/materiales/nuevo');
  });
});

describe('currentDestination', () => {
  it.each([
    ['/', 'inicio'],
    ['/materias', 'materias'],
    ['/materias/IP-101', 'materias'],
    ['/materiales', 'materias'],
    ['/materiales/ingenieria-informatica/1/ip-101', 'materias'],
    ['/materiales/abc123', 'materias'],
    ['/resenas', 'experiencias'],
    ['/resenas/r-1', 'experiencias'],
    ['/finales', 'experiencias'],
    ['/finales/f-9', 'experiencias'],
    ['/materias/IP-101/resenar', 'experiencias'],
    ['/materias/IP-101/final', 'experiencias'],
    ['/materiales/nuevo', 'subir'],
    ['/buscar', null],
    ['/profile/me', null],
    ['/admin', null],
    ['/foro', null],
    ['/foro/general', null],
    ['/profesores/p-1', null],
    ['/ranking', null],
    ['/materiasx', null],
  ])('%s → %s', (pathname, expected) => {
    expect(currentDestination(pathname)).toBe(expected);
  });

  it('ignores a trailing slash', () => {
    expect(currentDestination('/materias/IP-101/resenar/')).toBe('experiencias');
  });
});
