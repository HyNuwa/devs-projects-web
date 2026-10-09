import type { NestExpressApplication } from '@nestjs/platform-express';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createUser,
  type E2eUser,
} from './support/e2e-app';

const PASSWORD = 'ClaveE2e123!';
const DAY = 24 * 3_600_000;

describe('sign-in of a suspended account (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: E2eUser;
  let passwordHash: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    admin = await createUser(prisma, 'ADMIN');
    passwordHash = await bcrypt.hash(PASSWORD, 4);
  });

  afterAll(async () => {
    await app.close();
  });

  const login = (email: string, password = PASSWORD) =>
    request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });

  /** The refresh_token cookie a successful sign-in sets. */
  function refreshCookie(response: request.Response) {
    const cookies = ([] as string[]).concat(
      (response.headers['set-cookie'] as unknown as string[]) ?? [],
    );
    const cookie = cookies.find((value) => value.startsWith('refresh_token='));
    expect(cookie).toBeDefined();
    return cookie!.split(';')[0];
  }

  it('refuses a correct sign-in with the reason, the end date and how to appeal', async () => {
    const student = await createUser(prisma, 'USER', { passwordHash });
    await request(app.getHttpServer())
      .post(`/api/v1/moderation/users/${student.id}/suspend`)
      .set('Authorization', bearer(app, admin))
      .send({ reason: 'Tercer retiro por insultos.', duration: '30_DAYS' })
      .expect(201);

    const response = await login(student.email).expect(403);

    expect(response.body).toEqual(
      expect.objectContaining({
        code: 'ACCOUNT_SUSPENDED',
        reason: 'Tercer retiro por insultos.',
        appealable: true,
      }),
    );
    const body = response.body as { until: string; appealDeadline: string };
    expect(Date.parse(body.until)).toBeGreaterThan(Date.now() + 29 * DAY);
    expect(Date.parse(body.appealDeadline)).toBeGreaterThan(
      Date.now() + 13 * DAY,
    );
  });

  it('tells a suspended account how its appeal went', async () => {
    const student = await createUser(prisma, 'USER', { passwordHash });
    await request(app.getHttpServer())
      .post(`/api/v1/moderation/users/${student.id}/suspend`)
      .set('Authorization', bearer(app, admin))
      .send({ reason: 'Spam.', duration: 'PERMANENT' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/auth/suspension-appeal')
      .send({
        email: student.email,
        password: PASSWORD,
        explanation: 'No fui yo.',
      })
      .expect(201);

    const pending = await login(student.email).expect(403);
    expect(pending.body).toEqual(
      expect.objectContaining({
        appealable: false,
        appealStatus: 'PENDING',
        appealAnswer: null,
      }),
    );

    const appeal = await prisma.appeal.findFirstOrThrow({
      where: { appellantId: student.id },
    });
    const otherAdmin = await createUser(prisma, 'ADMIN');
    await request(app.getHttpServer())
      .post(`/api/v1/moderation/appeals/${appeal.id}/answer`)
      .set('Authorization', bearer(app, otherAdmin))
      .send({ accept: false, answer: 'Las publicaciones son spam.' })
      .expect(201);

    const rejected = await login(student.email).expect(403);
    expect(rejected.body).toEqual(
      expect.objectContaining({
        appealStatus: 'REJECTED',
        appealAnswer: 'Las publicaciones son spam.',
      }),
    );
  });

  it('keeps the generic refusal for a wrong password, revealing nothing', async () => {
    const student = await createUser(prisma, 'USER', {
      passwordHash,
      isBanned: true,
      bannedUntil: null,
    });

    const response = await login(student.email, 'otra-clave').expect(401);

    expect(response.body).not.toHaveProperty('code');
    expect(JSON.stringify(response.body)).not.toMatch(/suspend/i);
  });

  it('ends the session opened before the suspensión: its refresh no longer works', async () => {
    const student = await createUser(prisma, 'USER', { passwordHash });
    const cookie = refreshCookie(await login(student.email).expect(201));

    await request(app.getHttpServer())
      .post(`/api/v1/moderation/users/${student.id}/suspend`)
      .set('Authorization', bearer(app, admin))
      .send({ reason: 'Spam.', duration: 'PERMANENT' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .expect(401);
  });

  it('refuses a refresh for an account suspended by any path', async () => {
    const student = await createUser(prisma, 'USER', { passwordHash });
    const cookie = refreshCookie(await login(student.email).expect(201));
    await prisma.user.update({
      where: { id: student.id },
      data: { isBanned: true, bannedUntil: new Date(Date.now() + 7 * DAY) },
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .expect(403);

    expect(response.body).toEqual(
      expect.objectContaining({ code: 'ACCOUNT_SUSPENDED' }),
    );
  });

  it('lets the account sign in again once a temporary suspensión is over', async () => {
    const student = await createUser(prisma, 'USER', {
      passwordHash,
      isBanned: true,
      bannedUntil: new Date(Date.now() - DAY),
    });

    await login(student.email).expect(201);
  });
});
