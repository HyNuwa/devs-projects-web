import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
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

const inDays = (days: number) => new Date(Date.now() + days * 24 * 3_600_000);

describe('write actions of sanctioned accounts (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let materialId: string;
  let subjectCode: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    const author = await createUser(prisma);
    const subject = await createSubject(prisma);
    subjectCode = `E2E${randomUUID().slice(0, 6)}`;
    await prisma.subject.update({
      where: { id: subject.id },
      data: { code: subjectCode },
    });
    materialId = (
      await prisma.material.create({
        data: {
          title: 'Material e2e',
          fileUrl: 'https://drive.example.com/e2e',
          fileType: 'pdf',
          fileSize: BigInt(1000),
          authorId: author.id,
          subjectId: subject.id,
        },
      })
    ).id;
  });

  afterAll(async () => {
    await app.close();
  });

  /** Every write path a silenciamiento or suspensión blocks. */
  const blocked = (): Array<[string, 'post' | 'put' | 'patch', string]> => [
    ['upload a material', 'post', '/api/v1/materials'],
    ['edit a material', 'patch', `/api/v1/materials/${materialId}`],
    ['mark «Me sirvió»', 'put', `/api/v1/materials/${materialId}/helpfulness`],
    ['publish a reseña', 'post', `/api/v1/subjects/${subjectCode}/reviews`],
    ['edit a reseña', 'put', `/api/v1/subjects/reviews/${randomUUID()}`],
    ['publish an experiencia', 'post', `/api/v1/subjects/${subjectCode}/exams`],
    ['edit an experiencia', 'put', `/api/v1/subjects/exams/${randomUUID()}`],
    [
      'resubmit',
      'post',
      `/api/v1/me/submissions/material/${randomUUID()}/resubmit`,
    ],
    ['report', 'post', '/api/v1/reports'],
  ];

  async function expectRefused(
    user: E2eUser,
    code: 'ACCOUNT_MUTED' | 'ACCOUNT_SUSPENDED',
  ) {
    for (const [label, method, path] of blocked()) {
      const response = await request(app.getHttpServer())
        [method](path)
        .set('Authorization', bearer(app, user))
        .send({});
      expect({
        label,
        status: response.status,
        code: response.body.code,
      }).toEqual({ label, status: 403, code });
      expect(response.body).toHaveProperty('until');
    }
  }

  it('refuses every write of a silenced account with its end date', async () => {
    const silenced = await createUser(prisma, 'USER', {
      isMuted: true,
      mutedUntil: inDays(3),
    });

    await expectRefused(silenced, 'ACCOUNT_MUTED');
  });

  it('refuses every write of a suspended account whose access token is still valid', async () => {
    const suspended = await createUser(prisma, 'USER', {
      isBanned: true,
      bannedUntil: null,
    });

    await expectRefused(suspended, 'ACCOUNT_SUSPENDED');
  });

  it('still lets a silenced account save and download', async () => {
    const silenced = await createUser(prisma, 'USER', {
      isMuted: true,
      mutedUntil: inDays(3),
    });

    await request(app.getHttpServer())
      .put(`/api/v1/materials/${materialId}/saved`)
      .set('Authorization', bearer(app, silenced))
      .send({ isSaved: true })
      .expect((response) => expect(response.status).toBeLessThan(300));
    await request(app.getHttpServer())
      .get(`/api/v1/materials/${materialId}/download`)
      .set('Authorization', bearer(app, silenced))
      .expect((response) => expect(response.status).not.toBe(403));
  });

  it('lets the account write again once the silenciamiento is over', async () => {
    const formerlySilenced = await createUser(prisma, 'USER', {
      isMuted: true,
      mutedUntil: inDays(-1),
    });

    await request(app.getHttpServer())
      .post('/api/v1/reports')
      .set('Authorization', bearer(app, formerlySilenced))
      .send({
        targetType: 'MATERIAL',
        targetId: materialId,
        reason: 'NO_RELACIONADO',
      })
      .expect(202);
  });
});
