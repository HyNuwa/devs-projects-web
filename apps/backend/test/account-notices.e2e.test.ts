import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createUser,
  type E2eUser,
} from './support/e2e-app';

describe('what an account is told about its sanciones (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let moderator: E2eUser;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    moderator = await createUser(prisma, 'MODERATOR');
  });

  afterAll(async () => {
    await app.close();
  });

  const me = (user: E2eUser) =>
    request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', bearer(app, user))
      .expect(200);

  const sanction = (user: E2eUser, kind: 'warn' | 'mute', reason: string) =>
    request(app.getHttpServer())
      .post(`/api/v1/moderation/users/${user.id}/${kind}`)
      .set('Authorization', bearer(app, moderator))
      .send({ reason })
      .expect(201);

  it('has no restriction for an account in good standing', async () => {
    const student = await createUser(prisma);

    const { body } = await me(student);

    expect(body).toEqual(
      expect.objectContaining({ restriction: null, unseenWarning: null }),
    );
  });

  it('describes an active silenciamiento: reason, end date and appeal', async () => {
    const student = await createUser(prisma);
    await sanction(student, 'mute', 'Segundo retiro en 90 días.');

    const { body } = await me(student);

    expect(body.restriction).toEqual(
      expect.objectContaining({
        type: 'MUTE',
        reason: 'Segundo retiro en 90 días.',
        appealable: true,
        appealStatus: null,
      }),
    );
    expect(Date.parse(body.restriction.until)).toBeGreaterThan(Date.now());
    expect(body).not.toHaveProperty('restriction.appliedById');
  });

  it('shows an advertencia once, until the account marks it seen', async () => {
    const student = await createUser(prisma);
    await sanction(student, 'warn', 'Insultos en una reseña.');

    const first = await me(student);
    expect(first.body.unseenWarning).toEqual(
      expect.objectContaining({
        reason: 'Insultos en una reseña.',
        appealable: true,
      }),
    );

    await request(app.getHttpServer())
      .post(`/api/v1/me/warnings/${first.body.unseenWarning.id}/seen`)
      .set('Authorization', bearer(app, student))
      .expect(204);

    const second = await me(student);
    expect(second.body.unseenWarning).toBeNull();
  });

  it('does not let an account mark someone else’s advertencia', async () => {
    const student = await createUser(prisma);
    const other = await createUser(prisma);
    await sanction(student, 'warn', 'Spam.');
    const { body } = await me(student);

    await request(app.getHttpServer())
      .post(`/api/v1/me/warnings/${body.unseenWarning.id}/seen`)
      .set('Authorization', bearer(app, other))
      .expect(404);
  });
});
