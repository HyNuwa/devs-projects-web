import { describe, expect, it, vi } from 'vitest';

import nextConfig from '../../next.config';
import { legacyMaterialesTarget } from './legacy-redirects';

const careerId = '11111111-1111-4111-8111-111111111111';
const planId = '22222222-2222-4222-8222-222222222222';
const subjectId = '33333333-3333-4333-8333-333333333333';

const catalog = [
  {
    id: 'u1',
    name: 'Universidad Nacional de Jujuy',
    shortName: 'UNJU',
    faculties: [
      {
        id: 'f1',
        name: 'Facultad de Ingeniería',
        shortName: 'FI',
        careers: [{ id: careerId, name: 'Ingeniería Informática', code: 'II', studyPlans: [] }],
      },
    ],
  },
];
const subjects = [{ id: subjectId, code: 'IP', name: 'Introducción a la Programación' }];

const loaders = () => ({
  catalog: vi.fn().mockResolvedValue(catalog),
  subjects: vi.fn().mockResolvedValue(subjects),
});

describe('legacyMaterialesTarget', () => {
  it('sends the old root to Universidades', async () => {
    expect(await legacyMaterialesTarget([], loaders())).toBe('/universidades');
  });

  it('sends an old carrera address to its carrera page', async () => {
    expect(await legacyMaterialesTarget(['carreras', careerId], loaders())).toBe(
      '/universidades/unju/fi/ii',
    );
    expect(
      await legacyMaterialesTarget(
        ['carreras', careerId, 'planes', planId, 'anios', '2'],
        loaders(),
      ),
    ).toBe('/universidades/unju/fi/ii');
  });

  it('sends an old materia address to the materia page, keeping the carrera', async () => {
    const segments = ['carreras', careerId, 'planes', planId, 'anios', '1', 'materias', subjectId];
    expect(await legacyMaterialesTarget(segments, loaders())).toBe('/materias/IP?carrera=ii');
    expect(await legacyMaterialesTarget([...segments, 'PARCIAL'], loaders())).toBe(
      '/materias/IP?carrera=ii',
    );
  });

  it('falls back to Universidades when nothing resolves', async () => {
    expect(await legacyMaterialesTarget(['carreras', 'nope'], loaders())).toBe('/universidades');
    expect(
      await legacyMaterialesTarget(['carreras', '44444444-4444-4444-8444-444444444444'], loaders()),
    ).toBe('/universidades');
    const failing = {
      catalog: vi.fn().mockRejectedValue(new Error('down')),
      subjects: vi.fn().mockRejectedValue(new Error('down')),
    };
    expect(await legacyMaterialesTarget(['carreras', careerId], failing)).toBe('/universidades');
  });
});

describe('next.config redirects', () => {
  it('sends /materias, and only it, to /universidades', async () => {
    const redirects = await nextConfig.redirects!();
    expect(redirects).toContainEqual(
      expect.objectContaining({ source: '/materias', destination: '/universidades' }),
    );
    expect(redirects.some((r) => r.source.startsWith('/materias/'))).toBe(false);
  });
});
