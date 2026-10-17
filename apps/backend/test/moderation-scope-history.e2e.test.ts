import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Prisma } from '../src/generated/prisma';
import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createUser,
  type E2eUser,
} from './support/e2e-app';

/** The history follows the alcance de moderación (openspec moderation/cases, moderation/scope). */
describe('History within the moderator facultades (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  const tag = randomUUID().slice(0, 6).toUpperCase();
  let universityId: string;
  const faculties: Record<'A' | 'B', string> = { A: '', B: '' };
  const subjects: Record<'A' | 'B', string> = { A: '', B: '' };
  let modA: E2eUser;
  let admin: E2eUser;
  const events: Record<string, string> = {};
  const users: string[] = [];

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    ({ id: universityId } = await prisma.university.create({
      data: { name: `Universidad historial ${tag}`, shortName: `UH${tag}` },
      select: { id: true },
    }));
    for (const key of ['A', 'B'] as const) {
      faculties[key] = (
        await prisma.faculty.create({
          data: {
            universityId,
            name: `Facultad ${key} ${tag}`,
            shortName: `F${key}`,
          },
          select: { id: true },
        })
      ).id;
      subjects[key] = (
        await prisma.subject.create({
          data: { facultyId: faculties[key], name: `Materia ${key} ${tag}` },
          select: { id: true },
        })
      ).id;
    }
    const career = await prisma.career.create({
      data: {
        status: 'PUBLISHED',
        facultyId: faculties.A,
        name: `Carrera ${tag}`,
        code: 'CA',
        studyPlans: { create: [{ name: 'Plan', code: 'P', duration: 5 }] },
      },
      select: { studyPlans: { select: { id: true } } },
    });
    modA = await createUser(
      prisma,
      'MODERATOR',
      {},
      { faculties: [faculties.A] },
    );
    admin = await createUser(prisma, 'ADMIN');
    const author = await createUser(prisma);
    const studentA = await createUser(prisma);
    const outsider = await createUser(prisma);
    users.push(author.id, studentA.id, outsider.id);
    await prisma.userStudyPlan.create({
      data: { userId: studentA.id, studyPlanId: career.studyPlans[0].id },
    });

    const material = async (key: 'A' | 'B', authorId = author.id) =>
      (
        await prisma.material.create({
          data: {
            title: `Material ${key}`,
            fileUrl: 'https://drive.example.com/history-scope',
            fileType: 'pdf',
            fileSize: 10,
            authorId,
            subjectId: subjects[key],
            resourceType: 'PARCIAL',
            publicationStatus: 'REMOVED',
          },
          select: { id: true },
        })
      ).id;
    const event = async (name: string, data: Record<string, unknown>) => {
      events[name] = (
        await prisma.moderationEvent.create({
          data: {
            actorId: admin.id,
            reason: `Evento ${name} ${tag}`,
            ...data,
          } as Prisma.ModerationEventUncheckedCreateInput,
          select: { id: true },
        })
      ).id;
    };
    await event('retiroA', {
      action: 'REMOVED',
      targetType: 'MATERIAL',
      materialId: await material('A'),
    });
    await event('retiroB', {
      action: 'REMOVED',
      targetType: 'MATERIAL',
      materialId: await material('B'),
    });
    // Content events name the author too, even of anonymous content: an
    // account the moderator sees must not pull in another facultad's content.
    await event('retiroBByVisible', {
      action: 'REMOVED',
      targetType: 'MATERIAL',
      materialId: await material('B', studentA.id),
      targetUserId: studentA.id,
    });
    await event('muteVisible', { action: 'MUTED', targetUserId: studentA.id });
    await event('muteOutsider', { action: 'MUTED', targetUserId: outsider.id });
    await event('role', { action: 'ROLE_CHANGED', targetUserId: studentA.id });
    await event('scope', {
      action: 'MODERATOR_SCOPE_CHANGED',
      targetUserId: modA.id,
      metadata: { before: [], after: [faculties.A] },
    });
  });

  afterAll(async () => {
    // moderation_events is append-only: its rows stay, as in every history test.
    await prisma.material.deleteMany({
      where: { subjectId: { in: Object.values(subjects) } },
    });
    await prisma.subject.deleteMany({
      where: { id: { in: Object.values(subjects) } },
    });
    await prisma.userStudyPlan.deleteMany({ where: { userId: { in: users } } });
    await prisma.career.deleteMany({ where: { facultyId: faculties.A } });
    await prisma.moderatorScope.deleteMany({
      where: { facultyId: { in: Object.values(faculties) } },
    });
    await prisma.faculty.deleteMany({ where: { universityId } });
    await prisma.university.delete({ where: { id: universityId } });
    await app.close();
  });

  /** Every page of the history, filtered to this test's events. */
  async function seen(user: E2eUser, query: Record<string, string> = {}) {
    const ids = new Set(Object.values(events));
    const found: string[] = [];
    let cursor: string | null = null;
    do {
      const res = await http()
        .get('/api/v1/moderation/history')
        .query({ ...query, ...(cursor ? { cursor } : {}) })
        .set('Authorization', bearer(app, user))
        .expect(200);
      for (const item of res.body.items as { id: string }[]) {
        if (ids.has(item.id)) found.push(item.id);
      }
      cursor = res.body.nextCursor;
    } while (cursor);
    return found;
  }

  it('shows a moderator content events of their facultades and events of accounts they can see', async () => {
    const ids = await seen(modA, { actorId: admin.id });
    expect(ids).toEqual(
      expect.arrayContaining([events.retiroA, events.muteVisible]),
    );
    expect(ids).not.toContain(events.retiroB);
    expect(ids).not.toContain(events.retiroBByVisible);
    expect(ids).not.toContain(events.muteOutsider);
  });

  it('lists role and facultad changes only to admins', async () => {
    const mine = await seen(modA, { actorId: admin.id });
    expect(mine).not.toContain(events.role);
    expect(mine).not.toContain(events.scope);
    expect(await seen(modA, { action: 'MODERATOR_SCOPE_CHANGED' })).toEqual([]);

    const all = await seen(admin, { actorId: admin.id });
    expect(all).toEqual(expect.arrayContaining(Object.values(events)));
  });

  it('pages a moderator through their whole history', async () => {
    // A fresh actor keeps this run's events apart from earlier runs.
    const actorId = randomUUID();
    const created = await prisma.moderationEvent.createManyAndReturn({
      data: Array.from({ length: 55 }, () => ({
        actorId,
        action: 'MUTED' as const,
        targetUserId: users[1],
      })),
      select: { id: true },
    });
    const pages: string[] = [];
    let cursor: string | null = null;
    do {
      const res = await http()
        .get('/api/v1/moderation/history')
        .query({ actorId, ...(cursor ? { cursor } : {}) })
        .set('Authorization', bearer(app, modA))
        .expect(200);
      pages.push(
        ...(res.body.items as { id: string }[]).map((item) => item.id),
      );
      cursor = res.body.nextCursor;
    } while (cursor);
    expect(pages).toHaveLength(55);
    expect(new Set(pages)).toEqual(new Set(created.map((row) => row.id)));
  });

  it('keeps working when a facultad has more materials than one query can list', async () => {
    await prisma.$executeRaw`
      INSERT INTO "materials" ("id", "title", "file_url", "file_type", "file_size", "author_id", "subject_id", "updated_at")
      SELECT gen_random_uuid(), 'Material masivo', 'https://drive.example.com/bulk', 'pdf', 1, ${users[0]}::uuid, ${subjects.A}::uuid, CURRENT_TIMESTAMP
      FROM generate_series(1, 70000)`;
    expect(await seen(modA, { actorId: admin.id })).toContain(events.retiroA);
  });

  it('lets an admin filter the history by facultad', async () => {
    const onlyA = await seen(admin, {
      actorId: admin.id,
      facultyId: faculties.A,
    });
    expect(onlyA).toContain(events.retiroA);
    expect(onlyA).not.toContain(events.retiroB);
  });
});
