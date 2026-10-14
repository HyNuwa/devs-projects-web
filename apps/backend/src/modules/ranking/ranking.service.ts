import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { careersOf, materiaOf } from './attribution';
import { semesterRange } from './badges/badge-calendar';
import { helpfulGiverSelect, isValidHelpful } from './helpful-validity';
import type { PointReason } from '../../generated/prisma';
import { startOfLocalMonth } from './point-ledger';
import { competitionRanks } from './ranks';
import { levelForPoints, RPG_LEVELS } from './rpg-levels';

const TOP = 10;
const LEGENDS_LIMIT = 200;
const LEGEND_LEVEL = 10;
const LOCAL_OFFSET_MS = -3 * 3_600_000;

const collator = new Intl.Collator('es', {
  sensitivity: 'base',
  numeric: true,
});

/**
 * Points that would reveal who acted: a confirmed reporte or an accepted
 * correction jumps by 2 right when the author sees the retiro or the change, as
 * the perfil público avoids by never showing exact points. They count nowhere
 * in the monthly ranking.
 */
const REVEALING_REASONS: PointReason[] = [
  'REPORT_CONFIRMED',
  'CORRECTION_ACCEPTED',
];

const PERSON_SELECT = {
  id: true,
  username: true,
  displayName: true,
  points: true,
  isBanned: true,
  bannedUntil: true,
  profileCustomization: { select: { showLevelAndBadges: true } },
} as const;

type Person = {
  username: string;
  displayName: string | null;
  isBanned: boolean;
  bannedUntil: Date | null;
  profileCustomization: { showLevelAndBadges: boolean } | null;
};

const nameOf = (person: { username: string; displayName: string | null }) =>
  person.displayName ?? person.username;

/** «Mostrar mi nivel e insignias» off: out of every ranking of people. */
const hidden = (person: Person) =>
  person.profileCustomization?.showLevelAndBadges === false;

/** A permanent suspensión: the only sanción that takes someone off Leyendas. */
const permanentlySuspended = (person: Person) =>
  person.isBanned && person.bannedUntil === null;

/** 'YYYY-MM' of the local (UTC-3) month of `now`. */
const localMonth = (now: Date) =>
  new Date(now.getTime() + LOCAL_OFFSET_MS).toISOString().slice(0, 7);

/**
 * Bounded rankings (openspec reputation/rankings): this month in a carrera,
 * Leyendas de la facultad and a materia's most useful materials. Exclusions
 * apply here, so no endpoint returns a hidden or excluded account.
 */
@Injectable()
export class RankingService {
  constructor(private prisma: PrismaService) {}

  /** «Este mes en tu carrera»: the top 10 by net points of this local month. */
  async monthly(careerId: string | undefined, now = new Date()) {
    const career = careerId
      ? await this.career(careerId)
      : await this.firstCareer();
    const standings = await this.monthlyStandings(career.id, now);
    return {
      career,
      month: localMonth(now),
      entries: standings
        .slice(0, TOP)
        .map(({ rank, username, displayName, level, points }) => ({
          rank,
          username,
          displayName,
          level,
          points,
        })),
    };
  }

  /**
   * The viewer's side of the monthly ranking: their place in the carrera (null
   * when absent, hidden or sanctioned) and their active plan's carrera, which
   * the page shows by default.
   */
  async monthlyMe(userId: string, careerId?: string, now = new Date()) {
    const plan = await this.prisma.userStudyPlan.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      select: { studyPlan: { select: { careerId: true } } },
    });
    const defaultCareerId = plan?.studyPlan.careerId ?? null;
    const career = careerId
      ? await this.career(careerId)
      : defaultCareerId
        ? { id: defaultCareerId }
        : await this.firstCareer();
    const mine = (await this.monthlyStandings(career.id, now)).find(
      (entry) => entry.userId === userId,
    );
    return {
      careerId: career.id,
      defaultCareerId,
      me: mine ? { rank: mine.rank, points: mine.points } : null,
    };
  }

  /**
   * «Leyendas de la facultad»: accounts whose nivel máximo alcanzado is 10 with
   * an active or finished plan there, alphabetical. Only a permanent suspensión
   * takes someone off, so a temporary sanción is never revealed.
   */
  async legends(facultyId: string | undefined) {
    const faculty = facultyId
      ? await this.faculty(facultyId)
      : await this.firstFaculty();
    const people = await this.prisma.user.findMany({
      where: {
        maxLevel: { gte: LEGEND_LEVEL },
        studyPlans: {
          some: {
            status: { in: ['ACTIVE', 'COMPLETED'] },
            studyPlan: { career: { facultyId: faculty.id } },
          },
        },
      },
      select: PERSON_SELECT,
    });
    const entries = people
      .filter((person) => !hidden(person) && !permanentlySuspended(person))
      .sort((a, b) => collator.compare(nameOf(a), nameOf(b)))
      .map(({ username, displayName }) => ({ username, displayName }));
    return {
      faculty,
      entries: entries.slice(0, LEGENDS_LIMIT),
      truncated: entries.length > LEGENDS_LIMIT,
    };
  }

  /** The viewer's facultad for Leyendas: an active plan's, else a finished one's. */
  async legendsMe(userId: string) {
    const plans = await this.prisma.userStudyPlan.findMany({
      where: { userId, status: { in: ['ACTIVE', 'COMPLETED'] } },
      orderBy: { createdAt: 'asc' },
      select: {
        status: true,
        studyPlan: { select: { career: { select: { facultyId: true } } } },
      },
    });
    const plan =
      plans.find((p) => p.status === 'ACTIVE') ??
      plans.find((p) => p.status === 'COMPLETED');
    return { defaultFacultyId: plan?.studyPlan.career.facultyId ?? null };
  }

  /**
   * «Más útiles este cuatrimestre»: a materia's 10 materials with the most valid
   * «Me sirvió» received this cuatrimestre, whenever they were published.
   */
  async topMaterials(code: string, now = new Date()) {
    const subject = await this.prisma.subject.findFirst({
      where: { code },
      select: { id: true },
    });
    if (!subject) throw new NotFoundException('Materia no encontrada');
    const { semester, start, end } = semesterRange(now);
    const marks = await this.prisma.materialHelpfulness.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        material: {
          subjectId: subject.id,
          publicationStatus: 'PUBLISHED',
          isDeleted: false,
        },
      },
      select: {
        userId: true,
        user: { select: helpfulGiverSelect },
        material: {
          select: {
            id: true,
            title: true,
            authorId: true,
            resourceType: true,
            fileType: true,
            academicYear: true,
            createdAt: true,
          },
        },
      },
    });
    const counts = new Map<
      string,
      { material: (typeof marks)[number]['material']; helpful: number }
    >();
    for (const mark of marks) {
      if (!isValidHelpful(mark.user, mark.userId, mark.material.authorId, now))
        continue;
      const entry = counts.get(mark.material.id) ?? {
        material: mark.material,
        helpful: 0,
      };
      entry.helpful += 1;
      counts.set(mark.material.id, entry);
    }
    const sorted = [...counts.values()].sort(
      (a, b) =>
        b.helpful - a.helpful ||
        collator.compare(a.material.title, b.material.title),
    );
    const ranks = competitionRanks(sorted.map((entry) => entry.helpful));
    return {
      semester,
      entries: sorted
        .slice(0, TOP)
        .map(
          ({ material: { authorId: _author, ...material }, helpful }, i) => ({
            rank: ranks[i],
            material,
            helpful,
          }),
        ),
    };
  }

  /**
   * Every account with positive net points this month in the carrera, without
   * hidden or sanctioned ones, ordered and ranked.
   */
  private async monthlyStandings(careerId: string, now: Date) {
    const monthStart = startOfLocalMonth(now);
    const movements = await this.prisma.pointTransaction.findMany({
      where: {
        createdAt: { gte: monthStart, lt: startOfLocalMonth(now, 1) },
        reason: { notIn: REVEALING_REASONS },
      },
      select: { userId: true, amount: true, reason: true, referenceId: true },
    });
    const subjects = await materiaOf(this.prisma, movements);
    const careers = await careersOf(
      this.prisma,
      subjects.filter((id): id is string => id !== null),
    );
    const totals = new Map<string, number>();
    movements.forEach((movement, i) => {
      const subject = subjects[i];
      if (subject === null || !careers.get(subject)?.has(careerId)) return;
      totals.set(
        movement.userId,
        (totals.get(movement.userId) ?? 0) + movement.amount,
      );
    });
    const positive = [...totals].filter(([, points]) => points > 0);
    const ids = positive.map(([userId]) => userId);
    const [people, sanctioned] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: ids } },
        select: PERSON_SELECT,
      }),
      this.sanctionedAt(ids, monthStart),
    ]);
    const byId = new Map(people.map((person) => [person.id, person]));
    const sorted = positive
      .flatMap(([userId, points]) => {
        const person = byId.get(userId);
        return person && !hidden(person) && !sanctioned.has(userId)
          ? [{ person, points }]
          : [];
      })
      .sort(
        (a, b) =>
          b.points - a.points ||
          collator.compare(nameOf(a.person), nameOf(b.person)),
      );
    const ranks = competitionRanks(sorted.map((entry) => entry.points));
    return sorted.map(({ person, points }, i) => ({
      rank: ranks[i],
      userId: person.id,
      username: person.username,
      displayName: person.displayName,
      level: levelForPoints(person.points),
      points,
    }));
  }

  /**
   * Accounts with a silenciamiento or suspensión in force at `instant`. The
   * monthly ranking judges each account at the start of the month, so it only
   * changes when every carrera starts over and never reveals a sanción applied,
   * lifted or voided during the month.
   */
  private async sanctionedAt(userIds: string[], instant: Date) {
    const rows = await this.prisma.sanction.findMany({
      where: {
        userId: { in: userIds },
        type: { in: ['MUTE', 'SUSPENSION'] },
        startsAt: { lte: instant },
        AND: [
          { OR: [{ endsAt: null }, { endsAt: { gt: instant } }] },
          { OR: [{ liftedAt: null }, { liftedAt: { gt: instant } }] },
          { OR: [{ voidedAt: null }, { voidedAt: { gt: instant } }] },
        ],
      },
      select: { userId: true },
    });
    return new Set(rows.map((row) => row.userId));
  }

  private async career(id: string) {
    const career = await this.prisma.career.findFirst({
      where: { id, status: 'PUBLISHED' },
      select: { id: true, name: true },
    });
    if (!career) throw new NotFoundException('Carrera no encontrada');
    return career;
  }

  private async firstCareer() {
    const careers = await this.prisma.career.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, name: true },
    });
    const [first] = careers.sort((a, b) => collator.compare(a.name, b.name));
    if (!first) throw new NotFoundException('No hay carreras');
    return first;
  }

  private async faculty(id: string) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!faculty) throw new NotFoundException('Facultad no encontrada');
    return faculty;
  }

  private async firstFaculty() {
    const faculties = await this.prisma.faculty.findMany({
      select: { id: true, name: true },
    });
    const [first] = faculties.sort((a, b) => collator.compare(a.name, b.name));
    if (!first) throw new NotFoundException('No hay facultades');
    return first;
  }

  /** The RPG levels table. */
  async getLevelThresholds() {
    return RPG_LEVELS.map(({ level, name, points }) => ({
      level,
      name,
      points,
    }));
  }
}
