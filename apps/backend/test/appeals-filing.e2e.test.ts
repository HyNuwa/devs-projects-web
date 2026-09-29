import type { NestExpressApplication } from '@nestjs/platform-express';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createSubject,
  createUser,
  type E2eUser,
} from './support/e2e-app';

const PASSWORD = 'ClaveE2e123!';
const DAY = 24 * 3_600_000;

describe('filing appeals (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let moderator: E2eUser;
  let admin: E2eUser;
  let subjectId: string;
  let passwordHash: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    moderator = await createUser(prisma, 'MODERATOR');
    admin = await createUser(prisma, 'ADMIN');
    ({ id: subjectId } = await createSubject(prisma));
    passwordHash = await bcrypt.hash(PASSWORD, 4);
  });

  afterAll(async () => {
    await app.close();
  });

  /** A material by `author` retired `daysAgo` through its caso. */
  async function retired(author: E2eUser, daysAgo = 3, decision = 'REMOVE') {
    const material = await prisma.material.create({
      data: {
        title: 'Resumen e2e',
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: author.id,
        subjectId,
        publicationStatus: decision === 'REMOVE' ? 'REMOVED' : 'REJECTED',
      },
    });
    return prisma.moderationCase.create({
      data: {
        kind: decision === 'REMOVE' ? 'REPORTS' : 'PRIOR_REVIEW',
        targetType: 'MATERIAL',
        materialId: material.id,
        targetAuthorId: author.id,
        status: 'CLOSED',
        closedAt: new Date(Date.now() - daysAgo * DAY),
        decision: decision as 'REMOVE',
        decidedById: moderator.id,
        decisionReason: 'Motivo',
      },
    });
  }

  const appeal = (user: E2eUser, body: object) =>
    request(app.getHttpServer())
      .post('/api/v1/me/appeals')
      .set('Authorization', bearer(app, user))
      .send(body);

  it('lets the author appeal a retiro once, within 14 days', async () => {
    const author = await createUser(prisma);
    const moderationCase = await retired(author);

    await appeal(author, {
      kind: 'RETIRO',
      caseId: moderationCase.id,
      explanation: 'Cubre otra unidad.',
    }).expect(201);
    await appeal(author, {
      kind: 'RETIRO',
      caseId: moderationCase.id,
      explanation: 'Otra vez.',
    }).expect(409);
  });

  it('refuses an appeal after 14 days and of a revisión previa rejection', async () => {
    const author = await createUser(prisma);

    await appeal(author, {
      kind: 'RETIRO',
      caseId: (await retired(author, 15)).id,
      explanation: 'x',
    }).expect(409);
    await appeal(author, {
      kind: 'RETIRO',
      caseId: (await retired(author, 1, 'REJECT')).id,
      explanation: 'x',
    }).expect(409);
  });

  it('lets a silenced account appeal its silenciamiento', async () => {
    const student = await createUser(prisma);
    await request(app.getHttpServer())
      .post(`/api/v1/moderation/users/${student.id}/mute`)
      .set('Authorization', bearer(app, moderator))
      .send({ reason: 'Segundo retiro.' })
      .expect(201);
    const sanction = await prisma.sanction.findFirstOrThrow({
      where: { userId: student.id },
    });

    await appeal(student, {
      kind: 'SANCTION',
      sanctionId: sanction.id,
      explanation: 'La segunda guía era mía.',
    }).expect(201);
  });

  describe('from the sign-in screen of a suspended account', () => {
    const suspensionAppeal = (email: string, password: string) =>
      request(app.getHttpServer())
        .post('/api/v1/auth/suspension-appeal')
        .send({ email, password, explanation: 'No publiqué ese spam.' });

    it('files the appeal with correct credentials and never signs in', async () => {
      const student = await createUser(prisma, 'USER', { passwordHash });
      await request(app.getHttpServer())
        .post(`/api/v1/moderation/users/${student.id}/suspend`)
        .set('Authorization', bearer(app, admin))
        .send({ reason: 'Spam.', duration: '30_DAYS' })
        .expect(201);

      const response = await suspensionAppeal(student.email, PASSWORD).expect(
        201,
      );

      expect(response.headers['set-cookie']).toBeUndefined();
      expect(
        await prisma.appeal.count({
          where: { appellantId: student.id, kind: 'SANCTION' },
        }),
      ).toBe(1);
      await suspensionAppeal(student.email, PASSWORD).expect(409);
    });

    it('refuses wrong credentials without saying whether the account exists', async () => {
      const student = await createUser(prisma, 'USER', {
        passwordHash,
        isBanned: true,
        bannedUntil: null,
      });

      const wrong = await suspensionAppeal(student.email, 'otra').expect(401);
      const unknown = await suspensionAppeal(
        'nadie@devsproject.test',
        PASSWORD,
      ).expect(401);
      expect(wrong.body.message).toBe(unknown.body.message);
    });
  });
});
