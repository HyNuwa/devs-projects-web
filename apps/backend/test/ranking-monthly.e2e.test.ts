import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { FI_UNJU_FACULTY_ID } from '../src/modules/institutions/institutions.constants';
import { startOfLocalMonth } from '../src/modules/ranking/point-ledger';
import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createSubject,
  createUser,
} from './support/e2e-app';

type Entry = {
  rank: number;
  username: string;
  displayName: string | null;
  level: number;
  points: number;
};
type Monthly = {
  career: { id: string; name: string };
  month: string;
  entries: Entry[];
};

/** «Este mes en tu carrera» (openspec reputation/rankings). */
describe('monthly ranking per carrera (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
  });

  /** Carreras this file creates; the hierarchy pages carreras, so they must not pile up. */
  const careerIds: string[] = [];

  afterAll(async () => {
    await prisma.career.deleteMany({ where: { id: { in: careerIds } } });
    await app.close();
  });

  const tag = () => randomUUID().slice(0, 6);

  /** A carrera with one plan holding the given materias. */
  async function career(subjectIds: string[]) {
    const code = tag();
    const created = await prisma.career.create({
      data: {
        facultyId: FI_UNJU_FACULTY_ID,
        name: `Carrera ranking ${code}`,
        code: `R${code}`,
        studyPlans: { create: [{ name: 'Plan', code: 'P', duration: 5 }] },
      },
      select: { id: true, studyPlans: { select: { id: true } } },
    });
    careerIds.push(created.id);
    const planId = created.studyPlans[0].id;
    await prisma.studyPlanSubject.createMany({
      data: subjectIds.map((subjectId, i) => ({
        studyPlanId: planId,
        subjectId,
        year: 1,
        semester: i + 1,
      })),
    });
    return { id: created.id, planId };
  }

  async function material(authorId: string, subjectId: string) {
    return prisma.material.create({
      data: {
        title: 'Resumen ranking',
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId,
        subjectId,
        resourceType: 'RESUMEN',
      },
      select: { id: true },
    });
  }

  async function account(extra: Record<string, unknown> = {}) {
    const user = await createUser(prisma, 'USER', extra);
    const { username } = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { username: true },
    });
    return { ...user, username };
  }

  /** A movimiento of `amount` for a material, at `at` (now by default). */
  async function movement(
    userId: string,
    materialId: string,
    amount: number,
    at = new Date(),
    reversesId?: string,
  ) {
    return prisma.pointTransaction.create({
      data: {
        userId,
        amount,
        reason: 'MATERIAL_PUBLISHED',
        referenceId: materialId,
        idempotencyKey: `e2e:${randomUUID()}`,
        reversesId,
        createdAt: at,
      },
      select: { id: true },
    });
  }

  /** An account that earned `points` this month for a material of `subjectId`. */
  async function earner(
    subjectId: string,
    points: number,
    extra: Record<string, unknown> = {},
  ) {
    const user = await account({ points: 500, ...extra });
    const { id } = await material(user.id, subjectId);
    await movement(user.id, id, points);
    return user;
  }

  const monthly = async (careerId: string) =>
    (
      await http()
        .get(`/api/v1/ranking/monthly?careerId=${careerId}`)
        .expect(200)
    ).body as Monthly;

  it('sums net points of this month in Argentina time, with reversals', async () => {
    const subject = await createSubject(prisma);
    const { id: careerId } = await career([subject.id]);
    const start = startOfLocalMonth(new Date());
    const user = await account({ points: 500, displayName: 'Ana Ranking' });
    const old = await material(user.id, subject.id);
    const fresh = await material(user.id, subject.id);
    const lastMonth = await movement(
      user.id,
      old.id,
      10,
      new Date(start.getTime() - 60_000),
    );
    await movement(user.id, old.id, -10, new Date(), lastMonth.id);
    await movement(user.id, fresh.id, 20, new Date(start.getTime() + 60_000));
    await movement(user.id, fresh.id, 5);

    const body = await monthly(careerId);
    expect(body.career.id).toBe(careerId);
    expect(body.month).toMatch(/^\d{4}-\d{2}$/);
    expect(body.entries).toEqual([
      {
        rank: 1,
        username: user.username,
        displayName: 'Ana Ranking',
        level: expect.any(Number),
        points: 15,
      },
    ]);
  });

  it('counts a shared materia for every carrera that has it', async () => {
    const own = await createSubject(prisma);
    const shared = await createSubject(prisma);
    const informatica = await career([own.id, shared.id]);
    const industrial = await career([shared.id]);
    const user = await account({ points: 500 });
    const m1 = await material(user.id, own.id);
    const m2 = await material(user.id, shared.id);
    await movement(user.id, m1.id, 10);
    await movement(user.id, m2.id, 5);

    expect((await monthly(informatica.id)).entries[0].points).toBe(15);
    expect((await monthly(industrial.id)).entries[0].points).toBe(5);
  });

  it('lists the top 10 with competition ranks and the current nivel', async () => {
    const subject = await createSubject(prisma);
    const { id: careerId } = await career([subject.id]);
    const points = [40, 30, 30, 20, 19, 18, 17, 16, 15, 14, 13, 12];
    const users: Awaited<ReturnType<typeof earner>>[] = [];
    for (const p of points) users.push(await earner(subject.id, p));

    const body = await monthly(careerId);
    expect(body.entries.map((e) => [e.rank, e.points])).toEqual([
      [1, 40],
      [2, 30],
      [2, 30],
      [4, 20],
      [5, 19],
      [6, 18],
      [7, 17],
      [8, 16],
      [9, 15],
      [10, 14],
    ]);
    // 500 total points is nivel 4 or more; whatever it is, it is the same for all.
    expect(new Set(body.entries.map((e) => e.level)).size).toBe(1);

    const me = await http()
      .get(`/api/v1/ranking/monthly/me?careerId=${careerId}`)
      .set('Authorization', bearer(app, users[11]))
      .expect(200);
    expect(me.body.me).toEqual({ rank: 12, points: 12 });
  });

  /** A sanción of `type` for `userId` from `startsAt` until `endsAt` (null: permanent). */
  async function sanction(
    userId: string,
    type: 'MUTE' | 'SUSPENSION',
    startsAt: Date,
    endsAt: Date | null,
  ) {
    const moderator = await createUser(prisma, 'MODERATOR');
    await prisma.sanction.create({
      data: {
        userId,
        type,
        reason: 'e2e',
        startsAt,
        endsAt,
        appliedById: moderator.id,
      },
    });
    await prisma.user.update({
      where: { id: userId },
      data:
        type === 'MUTE'
          ? { mutedUntil: endsAt }
          : { isBanned: true, bannedUntil: endsAt },
    });
  }

  it('leaves out hidden accounts and those sanctioned when the month began, without a place', async () => {
    const subject = await createSubject(prisma);
    const { id: careerId } = await career([subject.id]);
    const monthStart = startOfLocalMonth(new Date());
    const before = new Date(monthStart.getTime() - 3 * 86_400_000);
    const later = new Date(Date.now() + 7 * 86_400_000);

    const hidden = await earner(subject.id, 50);
    await prisma.profileCustomization.create({
      data: { userId: hidden.id, showLevelAndBadges: false },
    });
    const muted = await earner(subject.id, 40);
    await sanction(muted.id, 'MUTE', before, later);
    const suspended = await earner(subject.id, 35);
    await sanction(suspended.id, 'SUSPENSION', before, later);
    const pastMute = await earner(subject.id, 30);
    await sanction(
      pastMute.id,
      'MUTE',
      new Date(before.getTime() - 86_400_000),
      new Date(monthStart.getTime() - 60_000),
    );
    const visible = await earner(subject.id, 20);

    const body = await monthly(careerId);
    expect(body.entries.map((e) => [e.rank, e.username])).toEqual([
      [1, pastMute.username],
      [2, visible.username],
    ]);

    for (const excluded of [hidden, muted, suspended]) {
      const me = await http()
        .get(`/api/v1/ranking/monthly/me?careerId=${careerId}`)
        .set('Authorization', bearer(app, excluded))
        .expect(200);
      expect(me.body.me).toBeNull();
    }
  });

  it('keeps an account sanctioned during the month, so the list never reveals it', async () => {
    const subject = await createSubject(prisma);
    const { id: careerId } = await career([subject.id]);
    const monthStart = startOfLocalMonth(new Date());
    const silenced = await earner(subject.id, 40);
    await sanction(
      silenced.id,
      'MUTE',
      new Date(Math.max(monthStart.getTime() + 1000, Date.now() - 60_000)),
      new Date(Date.now() + 7 * 86_400_000),
    );

    expect((await monthly(careerId)).entries.map((e) => e.username)).toEqual([
      silenced.username,
    ]);
  });

  it('does not count confirmed reportes or accepted corrections, which would reveal who made them', async () => {
    const subject = await createSubject(prisma);
    const { id: careerId } = await career([subject.id]);
    const author = await account();
    const reporter = await account({ points: 500 });
    const { id: materialId } = await material(author.id, subject.id);
    const reportCase = await prisma.moderationCase.create({
      data: { kind: 'REPORTS', targetType: 'MATERIAL', materialId },
      select: { id: true },
    });
    const suggestion = await prisma.correctionSuggestion.create({
      data: {
        materialId,
        suggesterId: reporter.id,
        field: 'ACADEMIC_YEAR',
        proposedValue: '2025',
      },
      select: { id: true },
    });
    for (const [reason, referenceId] of [
      ['REPORT_CONFIRMED', `${reportCase.id}:${reporter.id}`],
      ['CORRECTION_ACCEPTED', suggestion.id],
    ] as const) {
      await prisma.pointTransaction.create({
        data: {
          userId: reporter.id,
          amount: 2,
          reason,
          referenceId,
          idempotencyKey: `e2e:${randomUUID()}`,
        },
      });
    }

    expect((await monthly(careerId)).entries).toEqual([]);
  });

  it('ignores a movimiento whose reference is not an id', async () => {
    const subject = await createSubject(prisma);
    const { id: careerId } = await career([subject.id]);
    const user = await account();
    await prisma.pointTransaction.create({
      data: {
        userId: user.id,
        amount: 3,
        reason: 'MATERIAL_PUBLISHED',
        referenceId: 'ajuste-manual',
        idempotencyKey: `e2e:${randomUUID()}`,
      },
    });
    await http()
      .get(`/api/v1/ranking/monthly?careerId=${careerId}`)
      .expect(200);
  });

  it('shows the first carrera by name without careerId, publicly', async () => {
    const careers = await prisma.career.findMany({
      select: { id: true, name: true },
    });
    const collator = new Intl.Collator('es', {
      sensitivity: 'base',
      numeric: true,
    });
    const first = careers.sort((a, b) => collator.compare(a.name, b.name))[0];

    const body = (await http().get('/api/v1/ranking/monthly').expect(200))
      .body as Monthly;
    expect(body.career).toEqual({ id: first.id, name: first.name });
  });

  it('404s for an unknown carrera and 400s for a malformed id', async () => {
    await http()
      .get(`/api/v1/ranking/monthly?careerId=${randomUUID()}`)
      .expect(404);
    await http().get('/api/v1/ranking/monthly?careerId=nope').expect(400);
  });

  it('gives the viewer their place and their active plan as default', async () => {
    const subject = await createSubject(prisma);
    const { id: careerId, planId } = await career([subject.id]);
    const user = await earner(subject.id, 9);
    await prisma.userStudyPlan.create({
      data: { userId: user.id, studyPlanId: planId, status: 'ACTIVE' },
    });

    const me = await http()
      .get('/api/v1/ranking/monthly/me')
      .set('Authorization', bearer(app, user))
      .expect(200);
    expect(me.body).toEqual({
      careerId,
      defaultCareerId: careerId,
      me: { rank: 1, points: 9 },
    });

    const outsider = await account();
    const none = await http()
      .get(`/api/v1/ranking/monthly/me?careerId=${careerId}`)
      .set('Authorization', bearer(app, outsider))
      .expect(200);
    expect(none.body).toEqual({ careerId, defaultCareerId: null, me: null });
  });

  it('401s for /monthly/me without a session', async () => {
    await http().get('/api/v1/ranking/monthly/me').expect(401);
  });
});
