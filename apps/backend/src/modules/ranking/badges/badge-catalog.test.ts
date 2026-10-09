import { describe, expect, it } from 'vitest';

import {
  BADGE_CATALOG,
  type BadgeCalendar,
  type BadgeSnapshot,
  evaluateBadges,
  type SnapshotMaterial,
  type SnapshotReview,
} from './badge-catalog';

const local = (iso: string) => new Date(`${iso}T15:00:00.000Z`);

function material(overrides: Partial<SnapshotMaterial> = {}): SnapshotMaterial {
  return {
    subjectId: 'algebra',
    resourceType: 'FINAL',
    academicYear: 2025,
    createdAt: local('2025-04-01'),
    firstInSubject: false,
    helpfulGiverCareers: [],
    ...overrides,
  };
}

function review(overrides: Partial<SnapshotReview> = {}): SnapshotReview {
  return {
    createdAt: local('2025-04-01'),
    academicYear: 2025,
    hasProfessor: true,
    shift: 'TARDE',
    condition: 'REGULAR',
    difficulty: 'MEDIA',
    ...overrides,
  };
}

function snapshot(overrides: Partial<BadgeSnapshot> = {}): BadgeSnapshot {
  return {
    account: { emailVerified: true, createdAt: local('2025-03-10') },
    materials: [],
    reviews: [],
    exams: [],
    pioneerBonuses: 0,
    confirmedReports: 0,
    ...overrides,
  };
}

/** One valid «Me sirvió» per giver, all from the same carrera unless given. */
const marks = (count: number, careers: string[][] = []) =>
  Array.from({ length: count }, (_, i) => careers[i] ?? ['ing-informatica']);

const calendar: BadgeCalendar = { founder: null };

function stateOf(slug: string, data: BadgeSnapshot, cal = calendar) {
  const state = evaluateBadges(data, cal).find((badge) => badge.slug === slug);
  if (!state) throw new Error(`No existe la insignia ${slug}`);
  return state;
}

const tierOf = (slug: string, data: BadgeSnapshot) =>
  stateOf(slug, data).earned[0]?.tier ?? null;
const holds = (slug: string, data: BadgeSnapshot) =>
  stateOf(slug, data).earned.length > 0;

describe('insignia catalog', () => {
  it('offers the 17 insignias of §6.2 without Lupa, in order', () => {
    expect(BADGE_CATALOG.map((badge) => badge.slug)).toEqual([
      'primer-aporte',
      'primer-me-sirvio',
      'salvavidas',
      'trotamaterias',
      'primera-huella',
      'primera-luz',
      'kit-completo',
      'archivo-historico',
      'puente',
      'constante',
      'voz-de-la-cursada',
      'contexto-completo',
      'cronista-de-mesas',
      'mesa-de-diciembre',
      'temporada-de-finales',
      'ojo-atento',
      'primera-camada',
    ]);
  });

  it('Primer aporte and Primer «Me sirvió»', () => {
    expect(holds('primer-aporte', snapshot())).toBe(false);
    expect(holds('primer-aporte', snapshot({ materials: [material()] }))).toBe(
      true,
    );
    expect(
      holds('primer-me-sirvio', snapshot({ materials: [material()] })),
    ).toBe(false);
    expect(
      holds(
        'primer-me-sirvio',
        snapshot({ materials: [material({ helpfulGiverCareers: marks(1) })] }),
      ),
    ).toBe(true);
  });

  it('Salvavidas grows with the best material, not the sum', () => {
    const with_ = (...counts: number[]) =>
      snapshot({
        materials: counts.map((count) =>
          material({ helpfulGiverCareers: marks(count) }),
        ),
      });
    expect(tierOf('salvavidas', with_(30, 30))).toBeNull();
    expect(tierOf('salvavidas', with_(50))).toBe('BRONCE');
    expect(tierOf('salvavidas', with_(150))).toBe('PLATA');
    expect(tierOf('salvavidas', with_(400))).toBe('ORO');
    expect(stateOf('salvavidas', with_(38)).progress).toEqual({
      current: 38,
      target: 50,
      unit: '«Me sirvió»',
    });
    expect(stateOf('salvavidas', with_(64)).progress).toEqual(
      expect.objectContaining({ current: 64, target: 150 }),
    );
    expect(stateOf('salvavidas', with_(400)).progress).toBeNull();
  });

  it('Trotamaterias counts distinct materias', () => {
    const across = (count: number) =>
      snapshot({
        materials: Array.from({ length: count }, (_, i) =>
          material({ subjectId: `materia-${i}` }),
        ),
      });
    expect(tierOf('trotamaterias', across(4))).toBeNull();
    expect(tierOf('trotamaterias', across(5))).toBe('BRONCE');
    expect(tierOf('trotamaterias', across(10))).toBe('PLATA');
    expect(tierOf('trotamaterias', across(20))).toBe('ORO');
  });

  it('Primera huella counts the pioneer bonuses held', () => {
    expect(
      tierOf('primera-huella', snapshot({ pioneerBonuses: 0 })),
    ).toBeNull();
    expect(tierOf('primera-huella', snapshot({ pioneerBonuses: 1 }))).toBe(
      'BRONCE',
    );
    expect(tierOf('primera-huella', snapshot({ pioneerBonuses: 3 }))).toBe(
      'PLATA',
    );
    expect(tierOf('primera-huella', snapshot({ pioneerBonuses: 8 }))).toBe(
      'ORO',
    );
  });

  it('Primera luz needs the first material ever published in a materia', () => {
    expect(holds('primera-luz', snapshot({ materials: [material()] }))).toBe(
      false,
    );
    expect(
      holds(
        'primera-luz',
        snapshot({ materials: [material({ firstInSubject: true })] }),
      ),
    ).toBe(true);
  });

  it('Kit completo needs 4 types other than Otro in one materia', () => {
    const kit = (
      types: SnapshotMaterial['resourceType'][],
      subject = 'algebra',
    ) =>
      types.map((resourceType) =>
        material({ resourceType, subjectId: subject }),
      );
    expect(
      holds(
        'kit-completo',
        snapshot({ materials: kit(['FINAL', 'PARCIAL', 'APUNTE', 'OTRO']) }),
      ),
    ).toBe(false);
    expect(
      holds(
        'kit-completo',
        snapshot({
          materials: [
            ...kit(['FINAL', 'PARCIAL']),
            ...kit(['APUNTE', 'RESUMEN'], 'fisica'),
          ],
        }),
      ),
    ).toBe(false);
    expect(
      holds(
        'kit-completo',
        snapshot({ materials: kit(['FINAL', 'PARCIAL', 'APUNTE', 'RESUMEN']) }),
      ),
    ).toBe(true);
  });

  it('Archivo histórico needs the same type and materia in 3 ciclos', () => {
    const years = (...values: (number | null)[]) =>
      snapshot({
        materials: values.map((academicYear) => material({ academicYear })),
      });
    expect(holds('archivo-historico', years(2023, 2024, null))).toBe(false);
    expect(holds('archivo-historico', years(2023, 2024, 2024))).toBe(false);
    expect(holds('archivo-historico', years(2023, 2024, 2025))).toBe(true);
  });

  it('Puente needs «Me sirvió» from 3 carreras on one material', () => {
    const giverCareers = [['ing-informatica'], ['ing-civil'], ['lic-sistemas']];
    expect(
      holds(
        'puente',
        snapshot({
          materials: [
            material({ helpfulGiverCareers: marks(2, giverCareers) }),
            material({ helpfulGiverCareers: marks(1, [['lic-sistemas']]) }),
          ],
        }),
      ),
    ).toBe(false);
    expect(
      holds(
        'puente',
        snapshot({
          materials: [
            material({ helpfulGiverCareers: marks(3, giverCareers) }),
          ],
        }),
      ),
    ).toBe(true);
  });

  it('Constante counts consecutive cuatrimestres across every contribution', () => {
    const data = snapshot({
      materials: [material({ createdAt: local('2025-04-01') })],
      reviews: [review({ createdAt: local('2025-09-01') })],
      exams: [
        {
          createdAt: local('2026-02-20'),
          session: 'FEBRERO_MARZO',
          year: 2026,
        },
      ],
    });
    // 2025-1, 2025-2 and February 2026 (still 2025-2): two consecutive.
    expect(tierOf('constante', data)).toBe('BRONCE');
    expect(stateOf('constante', data).progress).toEqual(
      expect.objectContaining({ current: 2, target: 4 }),
    );
  });

  it('Voz de la cursada and Contexto completo count signed reseñas', () => {
    const reviews = (count: number, extra: Partial<SnapshotReview> = {}) =>
      snapshot({ reviews: Array.from({ length: count }, () => review(extra)) });
    expect(tierOf('voz-de-la-cursada', reviews(4))).toBeNull();
    expect(tierOf('voz-de-la-cursada', reviews(5))).toBe('BRONCE');
    expect(tierOf('voz-de-la-cursada', reviews(15))).toBe('PLATA');
    expect(tierOf('voz-de-la-cursada', reviews(40))).toBe('ORO');

    expect(holds('contexto-completo', reviews(10))).toBe(true);
    for (const missing of [
      { academicYear: null },
      { hasProfessor: false },
      { shift: 'NO_INDICO' as const },
      { condition: 'PREFIERO_NO_RESPONDER' as const },
      { difficulty: null },
    ]) {
      expect(holds('contexto-completo', reviews(10, missing))).toBe(false);
    }
  });

  it('Cronista de mesas needs December, July and February/March (or March)', () => {
    const exams = (...sessions: string[]) =>
      snapshot({
        exams: sessions.map((session) => ({
          createdAt: local('2025-08-01'),
          session: session as BadgeSnapshot['exams'][number]['session'],
          year: 2025,
        })),
      });
    expect(holds('cronista-de-mesas', exams('DICIEMBRE', 'JULIO'))).toBe(false);
    expect(
      holds('cronista-de-mesas', exams('DICIEMBRE', 'JULIO', 'MARZO')),
    ).toBe(true);
    expect(
      holds('cronista-de-mesas', exams('DICIEMBRE', 'JULIO', 'FEBRERO_MARZO')),
    ).toBe(true);
    expect(stateOf('cronista-de-mesas', exams('JULIO')).progress).toEqual(
      expect.objectContaining({ current: 1, target: 3 }),
    );
  });

  it('Mesa de diciembre is earned once per year', () => {
    const data = snapshot({
      exams: [
        { createdAt: local('2025-12-20'), session: 'DICIEMBRE', year: 2025 },
        { createdAt: local('2026-12-20'), session: 'DICIEMBRE', year: 2026 },
        { createdAt: local('2026-12-21'), session: 'DICIEMBRE', year: 2026 },
        { createdAt: local('2026-07-21'), session: 'JULIO', year: 2026 },
      ],
    });
    expect(stateOf('mesa-de-diciembre', data).earned).toEqual([
      { edition: 2025, tier: null },
      { edition: 2026, tier: null },
    ]);
  });

  it('Temporada de finales needs 3 contributions within one exam period', () => {
    const data = snapshot({
      materials: [
        material({ createdAt: local('2026-07-02') }),
        material({ createdAt: local('2026-07-20') }),
        material({ createdAt: local('2026-12-01') }),
      ],
      reviews: [
        review({ createdAt: local('2026-07-28') }),
        review({ createdAt: local('2026-08-02') }),
      ],
    });
    expect(stateOf('temporada-de-finales', data).earned).toEqual([
      { edition: 202607, tier: null },
    ]);
  });

  it('Ojo atento needs 10 confirmed reportes', () => {
    expect(holds('ojo-atento', snapshot({ confirmedReports: 9 }))).toBe(false);
    expect(holds('ojo-atento', snapshot({ confirmedReports: 10 }))).toBe(true);
  });

  it('Primera camada needs the configured window, a verified email and a contribution in it', () => {
    const founder = {
      start: local('2025-03-01'),
      end: local('2025-08-01'),
    };
    const inWindow = snapshot({
      materials: [material({ createdAt: local('2025-05-01') })],
    });
    expect(holds('primera-camada', inWindow)).toBe(false);
    expect(stateOf('primera-camada', inWindow, { founder }).earned).toEqual([
      { edition: 0, tier: null },
    ]);
    expect(
      stateOf(
        'primera-camada',
        {
          ...inWindow,
          account: { emailVerified: false, createdAt: local('2025-03-10') },
        },
        { founder },
      ).earned,
    ).toEqual([]);
    expect(
      stateOf(
        'primera-camada',
        snapshot({
          account: { emailVerified: true, createdAt: local('2025-09-01') },
          materials: [material({ createdAt: local('2025-09-02') })],
        }),
        { founder },
      ).earned,
    ).toEqual([]);
  });

  it('seasonal and one-off insignias report no progress', () => {
    for (const slug of [
      'mesa-de-diciembre',
      'temporada-de-finales',
      'primera-camada',
    ]) {
      expect(stateOf(slug, snapshot()).progress).toBeNull();
    }
  });

  it('Puente needs three different students, not one student in three carreras', () => {
    expect(
      holds(
        'puente',
        snapshot({
          materials: [
            material({
              helpfulGiverCareers: [
                ['ing-informatica', 'ing-civil', 'lic-sistemas'],
              ],
            }),
          ],
        }),
      ),
    ).toBe(false);
    expect(
      holds(
        'puente',
        snapshot({
          materials: [
            material({
              helpfulGiverCareers: [
                ['ing-informatica', 'ing-civil'],
                ['ing-informatica'],
                ['ing-civil', 'lic-sistemas'],
              ],
            }),
          ],
        }),
      ),
    ).toBe(true);
  });

  it('Mesa de diciembre counts experiencias shared during that December mesa season', () => {
    const exam = (year: number, sharedOn: string) => ({
      createdAt: local(sharedOn),
      session: 'DICIEMBRE' as const,
      year,
    });
    // Shared in December 2025 or the following January–February: edición 2025.
    // An experiencia of December 2015 shared in 2026 earns nothing.
    const data = snapshot({
      exams: [
        exam(2025, '2025-12-18'),
        exam(2025, '2026-02-10'),
        exam(2015, '2026-04-01'),
      ],
    });
    expect(stateOf('mesa-de-diciembre', data).earned).toEqual([
      { edition: 2025, tier: null },
    ]);
  });

  it('Primera luz reports no progress, since it is earned in one step', () => {
    expect(stateOf('primera-luz', snapshot()).progress).toBeNull();
  });
});
