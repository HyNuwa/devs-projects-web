import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PointLedger } from '../src/modules/ranking/point-ledger';
import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createUser,
  type E2eUser,
} from './support/e2e-app';

/** «Tu progreso» (openspec reputation/points). */
describe('GET /me/progress (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let ledger: PointLedger;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    ledger = app.get(PointLedger);
  });

  afterAll(async () => {
    await app.close();
  });

  const progress = (user: E2eUser) =>
    request(app.getHttpServer())
      .get('/api/v1/me/progress')
      .set('Authorization', bearer(app, user));

  async function subjectNamed(name: string) {
    return prisma.subject.create({
      data: { name: `${name} ${randomUUID().slice(0, 4)}` },
      select: { id: true, name: true },
    });
  }

  it('shows the level, the points and what the next level unlocks', async () => {
    const student = await createUser(prisma);
    await prisma.$transaction((tx) =>
      ledger.award(tx, {
        userId: student.id,
        reason: 'MATERIAL_PUBLISHED',
        referenceId: randomUUID(),
        amount: 320,
      }),
    );

    const { body } = await progress(student).expect(200);

    expect(body).toEqual(
      expect.objectContaining({
        level: 4,
        levelName: 'Mochila cargada',
        points: 320,
        next: expect.objectContaining({
          level: 5,
          name: 'Siete vidas',
          threshold: 500,
          missing: 180,
          unlocks: 'Marco de avatar y banner ilustrado en el perfil',
        }),
      }),
    );
    expect(body.levels).toHaveLength(10);
    expect(body.levels[0]).toEqual({
      level: 1,
      name: 'Primeros pasos',
      threshold: 0,
    });
  });

  it('shows a negative total as zero', async () => {
    const student = await createUser(prisma);
    await prisma.pointTransaction.create({
      data: {
        userId: student.id,
        reason: 'LEGACY_ADJUSTMENT',
        amount: -3,
        idempotencyKey: `legacy:${randomUUID()}`,
      },
    });
    await prisma.user.update({
      where: { id: student.id },
      data: { points: -3 },
    });

    const { body } = await progress(student).expect(200);

    expect(body).toEqual(expect.objectContaining({ level: 1, points: 0 }));
    expect(body.next.missing).toBe(30);
  });

  it('names the student’s own contribution, never who marked it or what was reported', async () => {
    const student = await createUser(prisma);
    const giver = await createUser(prisma);
    const subject = await subjectNamed('Bases de Datos');
    const material = await prisma.material.create({
      data: {
        title: 'Final de diciembre resuelto',
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: student.id,
        subjectId: subject.id,
      },
    });
    const review = await prisma.courseReview.create({
      data: { userId: student.id, subjectId: subject.id, recommendation: 4 },
    });
    const awards = [
      {
        reason: 'MATERIAL_PUBLISHED' as const,
        referenceId: material.id,
        amount: 10,
      },
      {
        reason: 'HELPFUL_RECEIVED' as const,
        referenceId: `${material.id}:${giver.id}`,
        amount: 1,
      },
      { reason: 'COURSE_REVIEWED' as const, referenceId: review.id, amount: 5 },
      {
        reason: 'REPORT_CONFIRMED' as const,
        referenceId: `${randomUUID()}:${student.id}`,
        amount: 2,
      },
    ];
    for (const award of awards) {
      await prisma.$transaction((tx) =>
        ledger.award(tx, { userId: student.id, ...award }),
      );
    }
    await prisma.$transaction((tx) =>
      ledger.revert(tx, { reason: 'COURSE_REVIEWED', referenceId: review.id }),
    );

    const { body } = await progress(student).expect(200);

    expect(body.movements).toEqual([
      expect.objectContaining({
        reason: 'COURSE_REVIEWED',
        amount: -5,
        reversal: true,
        subject: { type: 'COURSE_REVIEW', title: `Reseña de ${subject.name}` },
      }),
      expect.objectContaining({
        reason: 'REPORT_CONFIRMED',
        amount: 2,
        reversal: false,
        subject: null,
      }),
      expect.objectContaining({
        reason: 'COURSE_REVIEWED',
        amount: 5,
        subject: { type: 'COURSE_REVIEW', title: `Reseña de ${subject.name}` },
      }),
      expect.objectContaining({
        reason: 'HELPFUL_RECEIVED',
        amount: 1,
        subject: { type: 'MATERIAL', title: 'Final de diciembre resuelto' },
      }),
      expect.objectContaining({
        reason: 'MATERIAL_PUBLISHED',
        amount: 10,
        subject: { type: 'MATERIAL', title: 'Final de diciembre resuelto' },
      }),
    ]);
    expect(JSON.stringify(body)).not.toContain(giver.id);
  });

  it('lists only the last 20 movements, newest first', async () => {
    const student = await createUser(prisma);
    for (let i = 0; i < 22; i += 1) {
      await prisma.$transaction((tx) =>
        ledger.award(tx, {
          userId: student.id,
          reason: 'MATERIAL_PUBLISHED',
          referenceId: randomUUID(),
          amount: 1,
        }),
      );
    }

    const { body } = await progress(student).expect(200);

    expect(body.movements).toHaveLength(20);
    expect(body.points).toBe(22);
  });

  it('is only for signed-in accounts', async () => {
    await request(app.getHttpServer()).get('/api/v1/me/progress').expect(401);
  });
});
