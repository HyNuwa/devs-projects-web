import type {
  BadgeRarity,
  BadgeTier,
  CommunityDifficulty,
  CourseCondition,
  ExamSession,
  MaterialResourceType,
  Shift,
} from '../../../generated/prisma';
import {
  examPeriodEdition,
  longestConsecutiveSemesters,
} from './badge-calendar';

/** A published material of the account, with its valid «Me sirvió». */
export type SnapshotMaterial = {
  subjectId: string;
  resourceType: MaterialResourceType;
  academicYear: number | null;
  createdAt: Date;
  /** It is the first material ever published in its materia. */
  firstInSubject: boolean;
  /** One entry per valid «Me sirvió»: the giver's carreras (active study plans). */
  helpfulGiverCareers: string[][];
};

/** A published reseña signed with the account's name. */
export type SnapshotReview = {
  createdAt: Date;
  academicYear: number | null;
  hasProfessor: boolean;
  shift: Shift | null;
  condition: CourseCondition | null;
  difficulty: CommunityDifficulty | null;
};

/** A published experiencia de final signed with the account's name. */
export type SnapshotExam = {
  createdAt: Date;
  session: ExamSession;
  year: number;
};

/**
 * What insignias are computed from (openspec reputation/badges): only what
 * currently counts. Anonymous entries and invalid «Me sirvió» never get here.
 */
export type BadgeSnapshot = {
  account: { emailVerified: boolean; createdAt: Date };
  materials: SnapshotMaterial[];
  reviews: SnapshotReview[];
  exams: SnapshotExam[];
  /** Pioneer bonuses currently held. */
  pioneerBonuses: number;
  /** Reportes whose retiro stands. */
  confirmedReports: number;
  /** Correction suggestions accepted, whatever happened to the material later. */
  acceptedCorrections: number;
};

export type BadgeCalendar = { founder: { start: Date; end: Date } | null };

export type BadgeProgress = { current: number; target: number; unit: string };

export type BadgeState = {
  slug: string;
  /** One entry per edición held (edition 0 when not seasonal); empty when not held. */
  earned: { edition: number; tier: BadgeTier | null }[];
  /** Progress to the insignia or its next grado; null when complete or seasonal. */
  progress: BadgeProgress | null;
};

export type BadgeDefinition = {
  slug: string;
  name: string;
  description: string;
  rarity: BadgeRarity;
  /** It grows through bronce, plata and oro. */
  tiered?: boolean;
  evaluate: (
    snapshot: BadgeSnapshot,
    calendar: BadgeCalendar,
  ) => Omit<BadgeState, 'slug'>;
};

const TIERS: BadgeTier[] = ['BRONCE', 'PLATA', 'ORO'];

/** An insignia earned at a single threshold. */
function single(value: number, target: number, unit: string) {
  return value >= target
    ? { earned: [{ edition: 0, tier: null }], progress: null }
    : { earned: [], progress: { current: value, target, unit } };
}

/** An insignia with bronce, plata and oro thresholds. */
function tiered(
  value: number,
  thresholds: [number, number, number],
  unit: string,
) {
  let reached = -1;
  thresholds.forEach((threshold, index) => {
    if (value >= threshold) reached = index;
  });
  const next = thresholds[reached + 1];
  return {
    earned: reached >= 0 ? [{ edition: 0, tier: TIERS[reached] }] : [],
    progress:
      next === undefined ? null : { current: value, target: next, unit },
  };
}

const maxOf = (values: number[]) =>
  values.reduce((max, v) => Math.max(max, v), 0);

/** The largest group size, after grouping `items` by `key`. */
function largestGroup<T>(
  items: T[],
  key: (item: T) => string,
  count: (group: T[]) => number,
) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    groups.set(k, [...(groups.get(k) ?? []), item]);
  }
  return maxOf([...groups.values()].map(count));
}

/**
 * The most givers of different carreras among one material's «Me sirvió»: each
 * carrera must come from a different student, so a student enrolled in three
 * carreras counts once (a small bipartite matching).
 */
function distinctCareerGivers(givers: string[][]) {
  const holder = new Map<string, number>();
  const assign = (giver: number, tried: Set<string>): boolean => {
    for (const career of givers[giver]) {
      if (tried.has(career)) continue;
      tried.add(career);
      const current = holder.get(career);
      if (current === undefined || assign(current, tried)) {
        holder.set(career, giver);
        return true;
      }
    }
    return false;
  };
  let matched = 0;
  for (let giver = 0; giver < givers.length; giver += 1) {
    if (assign(giver, new Set())) matched += 1;
  }
  return matched;
}

/**
 * Shared during the December mesas of `year`: in that December or the following
 * January–February (UTC-3), so an old mesa told today earns no past edición.
 */
function sharedDuringDecemberMesas(createdAt: Date, year: number) {
  const local = new Date(createdAt.getTime() - 3 * 3_600_000);
  const sharedYear = local.getUTCFullYear();
  const month = local.getUTCMonth() + 1;
  return (
    (sharedYear === year && month === 12) ||
    (sharedYear === year + 1 && month <= 2)
  );
}

const contributionDates = (s: BadgeSnapshot) => [
  ...s.materials.map((m) => m.createdAt),
  ...s.reviews.map((r) => r.createdAt),
  ...s.exams.map((e) => e.createdAt),
];

const seasonal = (editions: number[]) => ({
  earned: [...new Set(editions)]
    .sort((a, b) => a - b)
    .map((edition) => ({ edition, tier: null })),
  progress: null,
});

/** The catalog of README_PUNTOS_E_INSIGNIAS §6.2, in display order. */
export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    slug: 'primer-aporte',
    name: 'Primer aporte',
    description: 'Tu primer material publicado.',
    rarity: 'COMUN',
    evaluate: (s) => single(s.materials.length, 1, 'material publicado'),
  },
  {
    slug: 'primer-me-sirvio',
    name: 'Primer «Me sirvió»',
    description: 'Recibís tu primer «Me sirvió» válido.',
    rarity: 'COMUN',
    evaluate: (s) =>
      single(
        s.materials.reduce((sum, m) => sum + m.helpfulGiverCareers.length, 0),
        1,
        '«Me sirvió»',
      ),
  },
  {
    slug: 'salvavidas',
    name: 'Salvavidas',
    description:
      'Un material tuyo llega a 50 «Me sirvió» (plata: 150, oro: 400).',
    rarity: 'RARA',
    tiered: true,
    evaluate: (s) =>
      tiered(
        maxOf(s.materials.map((m) => m.helpfulGiverCareers.length)),
        [50, 150, 400],
        '«Me sirvió»',
      ),
  },
  {
    slug: 'trotamaterias',
    name: 'Trotamaterias',
    description: 'Materiales publicados en 5 materias (plata: 10, oro: 20).',
    rarity: 'COMUN',
    tiered: true,
    evaluate: (s) =>
      tiered(
        new Set(s.materials.map((m) => m.subjectId)).size,
        [5, 10, 20],
        'materias',
      ),
  },
  {
    slug: 'primera-huella',
    name: 'Primera huella',
    description:
      'Primer material de un tipo en una materia, con 3 «Me sirvió» (plata: 3 veces, oro: 8).',
    rarity: 'RARA',
    tiered: true,
    evaluate: (s) =>
      tiered(s.pioneerBonuses, [1, 3, 8], 'bonos Primera huella'),
  },
  {
    slug: 'primera-luz',
    name: 'Primera luz',
    description:
      'Primer material publicado de una materia que no tenía ninguno.',
    rarity: 'RARA',
    evaluate: (s) => ({
      // Earned in one step: no progress to show.
      earned: s.materials.some((m) => m.firstInSubject)
        ? [{ edition: 0, tier: null }]
        : [],
      progress: null,
    }),
  },
  {
    slug: 'kit-completo',
    name: 'Kit completo',
    description: 'Materiales de 4 tipos distintos en una misma materia.',
    rarity: 'RARA',
    evaluate: (s) =>
      single(
        largestGroup(
          s.materials.filter((m) => m.resourceType !== 'OTRO'),
          (m) => m.subjectId,
          (group) => new Set(group.map((m) => m.resourceType)).size,
        ),
        4,
        'tipos de material en una materia',
      ),
  },
  {
    slug: 'archivo-historico',
    name: 'Archivo histórico',
    description: 'Materiales del mismo tipo y materia en 3 ciclos lectivos.',
    rarity: 'RARA',
    evaluate: (s) =>
      single(
        largestGroup(
          s.materials.filter((m) => m.academicYear !== null),
          (m) => `${m.subjectId}:${m.resourceType}`,
          (group) => new Set(group.map((m) => m.academicYear)).size,
        ),
        3,
        'ciclos lectivos',
      ),
  },
  {
    slug: 'puente',
    name: 'Puente',
    description:
      'Un material tuyo recibe «Me sirvió» de estudiantes de 3 carreras.',
    rarity: 'RARA',
    evaluate: (s) =>
      single(
        maxOf(
          s.materials.map((m) => distinctCareerGivers(m.helpfulGiverCareers)),
        ),
        3,
        'carreras',
      ),
  },
  {
    slug: 'constante',
    name: 'Constante',
    description: 'Aportes en 2 cuatrimestres seguidos (plata: 4, oro: 8).',
    rarity: 'COMUN',
    tiered: true,
    evaluate: (s) =>
      tiered(
        longestConsecutiveSemesters(contributionDates(s)),
        [2, 4, 8],
        'cuatrimestres seguidos',
      ),
  },
  {
    slug: 'voz-de-la-cursada',
    name: 'Voz de la cursada',
    description: '5 reseñas de cursada con nombre (plata: 15, oro: 40).',
    rarity: 'COMUN',
    tiered: true,
    evaluate: (s) =>
      tiered(s.reviews.length, [5, 15, 40], 'reseñas con nombre'),
  },
  {
    slug: 'contexto-completo',
    name: 'Contexto completo',
    description: '10 reseñas con nombre con todo el contexto de la cursada.',
    rarity: 'RARA',
    evaluate: (s) =>
      single(
        s.reviews.filter(
          (r) =>
            r.academicYear !== null &&
            r.hasProfessor &&
            r.shift !== null &&
            r.shift !== 'NO_INDICO' &&
            r.condition !== null &&
            r.condition !== 'PREFIERO_NO_RESPONDER' &&
            r.difficulty !== null,
        ).length,
        10,
        'reseñas con todo el contexto',
      ),
  },
  {
    slug: 'cronista-de-mesas',
    name: 'Cronista de mesas',
    description:
      'Experiencias de final con nombre de las mesas de diciembre, julio y febrero/marzo.',
    rarity: 'RARA',
    evaluate: (s) => {
      const sessions = new Set(s.exams.map((e) => e.session));
      const mesas = [
        sessions.has('DICIEMBRE'),
        sessions.has('JULIO'),
        sessions.has('FEBRERO_MARZO') || sessions.has('MARZO'),
      ].filter(Boolean).length;
      return single(mesas, 3, 'mesas');
    },
  },
  {
    slug: 'mesa-de-diciembre',
    name: 'Mesa de diciembre',
    description:
      'Contaste con nombre una experiencia de final de la mesa de diciembre.',
    rarity: 'TEMPORADA',
    evaluate: (s) =>
      seasonal(
        s.exams
          .filter(
            (e) =>
              e.session === 'DICIEMBRE' &&
              sharedDuringDecemberMesas(e.createdAt, e.year),
          )
          .map((e) => e.year),
      ),
  },
  {
    slug: 'temporada-de-finales',
    name: 'Temporada de finales',
    description: '3 aportes publicados durante un período de mesas.',
    rarity: 'TEMPORADA',
    evaluate: (s) => {
      const perPeriod = new Map<number, number>();
      for (const date of contributionDates(s)) {
        const period = examPeriodEdition(date);
        if (period !== null)
          perPeriod.set(period, (perPeriod.get(period) ?? 0) + 1);
      }
      return seasonal(
        [...perPeriod]
          .filter(([, count]) => count >= 3)
          .map(([period]) => period),
      );
    },
  },
  {
    slug: 'ojo-atento',
    name: 'Ojo atento',
    description: '10 reportes confirmados por moderación.',
    rarity: 'RARA',
    evaluate: (s) => single(s.confirmedReports, 10, 'reportes confirmados'),
  },
  {
    slug: 'lupa',
    name: 'Lupa',
    description: '10 correcciones aceptadas.',
    rarity: 'RARA',
    evaluate: (s) =>
      single(s.acceptedCorrections, 10, 'correcciones aceptadas'),
  },
  {
    slug: 'primera-camada',
    name: 'Primera camada',
    description:
      'Cuenta del primer cuatrimestre de la plataforma, con un aporte en ese período.',
    rarity: 'EDICION_UNICA',
    evaluate: (s, calendar) => {
      const window = calendar.founder;
      const within = (date: Date) =>
        window !== null &&
        date.getTime() >= window.start.getTime() &&
        date.getTime() < window.end.getTime();
      const holds =
        s.account.emailVerified &&
        within(s.account.createdAt) &&
        contributionDates(s).some(within);
      return {
        earned: holds ? [{ edition: 0, tier: null }] : [],
        progress: null,
      };
    },
  },
];

const SEASONAL_OR_ONE_OFF = new Set<BadgeRarity>([
  'TEMPORADA',
  'EDICION_UNICA',
]);

/** Every insignia's current state for one account. */
export function evaluateBadges(
  snapshot: BadgeSnapshot,
  calendar: BadgeCalendar,
): BadgeState[] {
  return BADGE_CATALOG.map((badge) => {
    const state = badge.evaluate(snapshot, calendar);
    return {
      slug: badge.slug,
      earned: state.earned,
      progress: SEASONAL_OR_ONE_OFF.has(badge.rarity) ? null : state.progress,
    };
  });
}
