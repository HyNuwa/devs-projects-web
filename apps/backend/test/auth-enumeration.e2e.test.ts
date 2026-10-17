import type { NestExpressApplication } from '@nestjs/platform-express';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import { createE2eApp, createUser } from './support/e2e-app';

const PASSWORD = 'ClaveE2e123!';

/** A fresh client per request, so the rate limits never tell the two apart. */
const clientIp = () =>
  `10.${[0, 0, 0].map(() => Math.floor(Math.random() * 250)).join('.')}`;

/**
 * What a client can observe, minus what changes on every request: the date
 * (header and body `timestamp`, so also the ETag computed from the body) and
 * the request id.
 */
function observable(response: request.Response) {
  const headers = { ...response.headers } as Record<string, unknown>;
  for (const name of Object.keys(headers)) {
    if (['date', 'etag'].includes(name) || /request-id/i.test(name)) {
      delete headers[name];
    }
  }
  const body = { ...(response.body as Record<string, unknown>) };
  expect(Date.parse(body.timestamp as string)).not.toBeNaN();
  delete body.timestamp;
  return { status: response.status, body, headers };
}

// openspec security/authentication: «Credential checks do not reveal accounts».
describe('credential checks do not reveal accounts (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let passwordHash: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    app.set('trust proxy', 1);
    passwordHash = await bcrypt.hash(PASSWORD, 4);
  });

  afterAll(async () => {
    await app.close();
  });

  const post = (path: string, body: object) =>
    request(app.getHttpServer())
      .post(`/api/v1${path}`)
      .set('X-Forwarded-For', clientIp())
      .send(body);

  const unknownEmail = () =>
    `nadie_${randomUUID().slice(0, 8)}@devsproject.test`;

  it('sign-in answers an unknown email exactly like a wrong password', async () => {
    const student = await createUser(prisma, 'USER', { passwordHash });

    const unknown = await post('/auth/login', {
      email: unknownEmail(),
      password: 'Incorrecta1!',
    });
    const wrong = await post('/auth/login', {
      email: student.email,
      password: 'Incorrecta1!',
    });

    expect(unknown.status).toBe(401);
    expect(observable(unknown)).toEqual(observable(wrong));
    expect(unknown.body).toEqual(
      expect.objectContaining({ message: 'Credenciales inválidas' }),
    );
  });

  it('«Apelar esta suspensión» answers an unknown email exactly like a wrong password', async () => {
    const student = await createUser(prisma, 'USER', {
      passwordHash,
      isBanned: true,
      bannedUntil: null,
    });
    const explanation = 'No fui yo.';

    const unknown = await post('/auth/suspension-appeal', {
      email: unknownEmail(),
      password: 'Incorrecta1!',
      explanation,
    });
    const wrong = await post('/auth/suspension-appeal', {
      email: student.email,
      password: 'Incorrecta1!',
      explanation,
    });

    expect(unknown.status).toBe(401);
    expect(observable(unknown)).toEqual(observable(wrong));
    expect(
      await prisma.appeal.count({ where: { appellantId: student.id } }),
    ).toBe(0);
  });
});
