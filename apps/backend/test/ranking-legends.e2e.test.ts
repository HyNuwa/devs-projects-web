import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import { bearer, createE2eApp, createUser } from './support/e2e-app';

type Legends = {
  faculty: { id: string; name: string };
  entries: { username: string; displayName: string | null }[];
  truncated: boolean;
};

/** «Leyendas de la facultad» (openspec reputation/rankings). */
describe('Leyendas de la facultad (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let universityId: string;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    const tag = randomUUID().slice(0, 6);
    ({ id: universityId } = await prisma.university.create({
      data: { name: `Universidad leyendas ${tag}`, shortName: `UL${tag}` },
      select: { id: true },
    }));
  });

  afterAll(async () => {
    const where = { faculty: { universityId } };
    await prisma.career.deleteMany({ where });
    await prisma.faculty.deleteMany({ where: { universityId } });
    await prisma.university.delete({ where: { id: universityId } });
    await app.close();
  });

  /** A fresh facultad with one carrera and plan, so each test sees only its legends. */
  async function faculty() {
    const tag = randomUUID().slice(0, 6);
    const created = await prisma.faculty.create({
      data: {
        universityId,
        name: `Facultad leyendas ${tag}`,
        shortName: `F${tag}`,
        careers: {
          create: [
            {
              name: 'Carrera',
              code: 'C',
              studyPlans: {
                create: [{ name: 'Plan', code: 'P', duration: 5 }],
              },
            },
          ],
        },
      },
      select: {
        id: true,
        careers: { select: { studyPlans: { select: { id: true } } } },
      },
    });
    return { id: created.id, planId: created.careers[0].studyPlans[0].id };
  }

  async function account(
    planIds: { planId: string; status?: 'ACTIVE' | 'COMPLETED' | 'DROPPED' }[],
    extra: Record<string, unknown> = {},
  ) {
    const user = await createUser(prisma, 'USER', {
      maxLevel: 10,
      points: 10_000,
      ...extra,
    });
    for (const { planId, status } of planIds) {
      await prisma.userStudyPlan.create({
        data: { userId: user.id, studyPlanId: planId, status },
      });
    }
    const { username } = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { username: true },
    });
    return { ...user, username };
  }

  const legends = async (facultyId: string) =>
    (
      await http()
        .get(`/api/v1/ranking/legends?facultyId=${facultyId}`)
        .expect(200)
    ).body as Legends;
  const names = (body: Legends) => body.entries.map((e) => e.username);

  it('lists nivel máximo 10 with an active or finished plan, not abandoned or none', async () => {
    const f = await faculty();
    const active = await account([{ planId: f.planId }]);
    const finished = await account([{ planId: f.planId, status: 'COMPLETED' }]);
    const dropped = await account([{ planId: f.planId, status: 'DROPPED' }]);
    const noPlan = await account([]);
    const level9 = await account([{ planId: f.planId }], { maxLevel: 9 });

    const body = await legends(f.id);
    expect(body.faculty.id).toBe(f.id);
    expect(names(body).sort()).toEqual(
      [active.username, finished.username].sort(),
    );
    for (const absent of [dropped, noPlan, level9]) {
      expect(names(body)).not.toContain(absent.username);
    }
  });

  it('lists an account with plans in two facultades in both', async () => {
    const a = await faculty();
    const b = await faculty();
    const legend = await account([
      { planId: a.planId },
      { planId: b.planId, status: 'COMPLETED' },
    ]);
    expect(names(await legends(a.id))).toEqual([legend.username]);
    expect(names(await legends(b.id))).toEqual([legend.username]);
  });

  it('orders by display name, and points below nivel 10 keep the place', async () => {
    const f = await faculty();
    const zoe = await account([{ planId: f.planId }], { displayName: 'Zoe' });
    const ana = await account([{ planId: f.planId }], {
      displayName: 'ana',
      points: 10,
    });
    const bruno = await account([{ planId: f.planId }], {
      displayName: 'Bruno',
    });
    expect(names(await legends(f.id))).toEqual([
      ana.username,
      bruno.username,
      zoe.username,
    ]);
  });

  it('leaves out hidden accounts and permanent suspensiones, not temporary sanciones', async () => {
    const f = await faculty();
    const hidden = await account([{ planId: f.planId }]);
    await prisma.profileCustomization.create({
      data: { userId: hidden.id, showLevelAndBadges: false },
    });
    const banned = await account([{ planId: f.planId }], {
      isBanned: true,
      bannedUntil: null,
    });
    const silenced = await account([{ planId: f.planId }], {
      mutedUntil: new Date(Date.now() + 7 * 86_400_000),
    });
    const suspended = await account([{ planId: f.planId }], {
      isBanned: true,
      bannedUntil: new Date(Date.now() + 7 * 86_400_000),
    });

    const body = names(await legends(f.id));
    expect(body.sort()).toEqual([silenced.username, suspended.username].sort());
    expect(body).not.toContain(hidden.username);
    expect(body).not.toContain(banned.username);
  });

  it('defaults to the first facultad by name, publicly, and 404s an unknown one', async () => {
    const faculties = await prisma.faculty.findMany({
      select: { id: true, name: true },
    });
    const collator = new Intl.Collator('es', {
      sensitivity: 'base',
      numeric: true,
    });
    const first = faculties.sort((x, y) => collator.compare(x.name, y.name))[0];
    const body = (await http().get('/api/v1/ranking/legends').expect(200))
      .body as Legends;
    expect(body.faculty).toEqual({ id: first.id, name: first.name });

    await http()
      .get(`/api/v1/ranking/legends?facultyId=${randomUUID()}`)
      .expect(404);
  });

  it('gives the viewer the facultad of an active plan, else a finished one', async () => {
    const a = await faculty();
    const b = await faculty();
    const both = await account([
      { planId: a.planId, status: 'COMPLETED' },
      { planId: b.planId },
    ]);
    const finishedOnly = await account([
      { planId: a.planId, status: 'COMPLETED' },
    ]);
    const none = await account([{ planId: b.planId, status: 'DROPPED' }]);

    const me = async (user: typeof both) =>
      (
        await http()
          .get('/api/v1/ranking/legends/me')
          .set('Authorization', bearer(app, user))
          .expect(200)
      ).body as { defaultFacultyId: string | null };
    expect(await me(both)).toEqual({ defaultFacultyId: b.id });
    expect(await me(finishedOnly)).toEqual({ defaultFacultyId: a.id });
    expect(await me(none)).toEqual({ defaultFacultyId: null });

    await http().get('/api/v1/ranking/legends/me').expect(401);
  });
});
