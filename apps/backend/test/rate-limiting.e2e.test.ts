import type { NestExpressApplication } from '@nestjs/platform-express';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
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

/** A fresh client IP per test, so counters never leak between tests. */
const clientIp = () =>
  `10.${[0, 0, 0].map(() => Math.floor(Math.random() * 250)).join('.')}`;

function expectTooManyRequests(response: request.Response) {
  expect(response.status).toBe(429);
  const retryAfter = Number(response.headers['retry-after']);
  expect(retryAfter).toBeGreaterThan(0);
  expect(response.body).toEqual(
    expect.objectContaining({
      code: 'TOO_MANY_REQUESTS',
      message: expect.stringMatching(
        /^Demasiados intentos\. Probá de nuevo en \d+ minutos?$/,
      ),
    }),
  );
}

// Behind a proxy (TRUST_PROXY=1) each X-Forwarded-For is its own client.
describe('rate limiting (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let passwordHash: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    // What `configureApp` does with TRUST_PROXY=1 (see configure-app.test.ts):
    // the config is validated when AppModule is imported, too early to set here.
    app.set('trust proxy', 1);
    passwordHash = await bcrypt.hash(PASSWORD, 4);
  });

  afterAll(async () => {
    await app.close();
  });

  const post = (path: string, ip: string, body: object) =>
    request(app.getHttpServer())
      .post(`/api/v1${path}`)
      .set('X-Forwarded-For', ip)
      .send(body);

  const login = (ip: string, email: string, password: string) =>
    post('/auth/login', ip, { email, password });

  it('reports the memory limiter as healthy', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    expect(response.body).toEqual({ status: 'ok', rateLimiter: 'memory' });
  });

  it('refuses the sixth sign-in after five wrong passwords, even with the right one', async () => {
    const ip = clientIp();
    const student = await createUser(prisma, 'USER', { passwordHash });
    for (let i = 0; i < 5; i += 1) {
      await login(ip, student.email, 'Incorrecta1!').expect(401);
    }
    expectTooManyRequests(await login(ip, student.email, PASSWORD));
    // Another client is not affected.
    await login(clientIp(), student.email, PASSWORD).expect(201);
  });

  it('a correct sign-in clears the email counter', async () => {
    const ip = clientIp();
    const student = await createUser(prisma, 'USER', { passwordHash });
    await login(ip, student.email, 'Incorrecta1!').expect(401);
    await login(ip, student.email, 'Incorrecta1!').expect(401);
    await login(ip, student.email, PASSWORD).expect(201);
    for (let i = 0; i < 5; i += 1) {
      await login(ip, student.email, 'Incorrecta1!').expect(401);
    }
    expectTooManyRequests(await login(ip, student.email, 'Incorrecta1!'));
  });

  it('a suspended account with the right password does not count as a failure', async () => {
    const ip = clientIp();
    const admin = await createUser(prisma, 'ADMIN');
    const student = await createUser(prisma, 'USER', { passwordHash });
    await request(app.getHttpServer())
      .post(`/api/v1/moderation/users/${student.id}/suspend`)
      .set('Authorization', bearer(app, admin))
      .send({ reason: 'Tercer retiro por insultos.', duration: '30_DAYS' })
      .expect(201);
    for (let i = 0; i < 4; i += 1) {
      await login(ip, student.email, 'Incorrecta1!').expect(401);
    }
    await login(ip, student.email, PASSWORD).expect(403);
    // The counter restarted: five more failures fit before the limit.
    for (let i = 0; i < 5; i += 1) {
      await login(ip, student.email, 'Incorrecta1!').expect(401);
    }
    expectTooManyRequests(await login(ip, student.email, PASSWORD));
  });

  it('blocks a client after 20 failed sign-ins across emails', async () => {
    const ip = clientIp();
    for (let i = 0; i < 20; i += 1) {
      await login(ip, `nadie_${randomUUID()}@x.test`, 'Incorrecta1!').expect(
        401,
      );
    }
    expectTooManyRequests(
      await login(ip, `nadie_${randomUUID()}@x.test`, 'Incorrecta1!'),
    );
  });

  it('allows three sign-ups per client per hour', async () => {
    const ip = clientIp();
    // Invalid bodies still count: the limit applies before validation.
    for (let i = 0; i < 3; i += 1) {
      await post('/auth/register', ip, {}).expect(400);
    }
    expectTooManyRequests(await post('/auth/register', ip, {}));
  });

  it('limits recovery the same way whether or not the account exists', async () => {
    const student = await createUser(prisma, 'USER', { passwordHash });
    const unknown = `nadie_${randomUUID()}@x.test`;
    const ask = (email: string, ip = clientIp()) =>
      post('/auth/forgot-password', ip, { email });

    for (let i = 0; i < 3; i += 1) {
      await ask(unknown).expect((r) => expect(r.status).toBeLessThan(300));
      await ask(student.email).expect((r) =>
        expect(r.status).toBeLessThan(300),
      );
    }
    const forUnknown = await ask(unknown);
    const forExisting = await ask(student.email);
    expectTooManyRequests(forUnknown);
    expectTooManyRequests(forExisting);
    const { timestamp: _a, path: _b, ...unknownBody } = forUnknown.body;
    const { timestamp: _c, path: _d, ...existingBody } = forExisting.body;
    expect(unknownBody).toEqual(existingBody);
  });

  it('limits recovery per client across emails', async () => {
    const ip = clientIp();
    for (let i = 0; i < 3; i += 1) {
      await post('/auth/forgot-password', ip, {
        email: `nadie_${randomUUID()}@x.test`,
      }).expect((r) => expect(r.status).toBeLessThan(300));
    }
    expectTooManyRequests(
      await post('/auth/forgot-password', ip, {
        email: `nadie_${randomUUID()}@x.test`,
      }),
    );
  });

  it('refuses the sixth suspension appeal attempt', async () => {
    const ip = clientIp();
    const body = {
      email: `nadie_${randomUUID()}@x.test`,
      password: 'Incorrecta1!',
      explanation: 'Quiero explicar lo que pasó con mi cuenta.',
    };
    for (let i = 0; i < 5; i += 1) {
      await post('/auth/suspension-appeal', ip, body).expect(401);
    }
    expectTooManyRequests(await post('/auth/suspension-appeal', ip, body));
  });

  it('counts wrong passwords on the suspension appeal against the client’s sign-in cap', async () => {
    const ip = clientIp();
    const admin = await createUser(prisma, 'ADMIN');
    const suspended = await createUser(prisma, 'USER', { passwordHash });
    await request(app.getHttpServer())
      .post(`/api/v1/moderation/users/${suspended.id}/suspend`)
      .set('Authorization', bearer(app, admin))
      .send({ reason: 'Tercer retiro por insultos.', duration: '30_DAYS' })
      .expect(201);
    const appeal = (email: string, password: string) =>
      post('/auth/suspension-appeal', ip, {
        email,
        password,
        explanation: 'Quiero explicar lo que pasó con mi cuenta.',
      });

    for (let i = 0; i < 19; i += 1) {
      await appeal(`nadie_${randomUUID()}@x.test`, 'Incorrecta1!').expect(401);
    }
    // The right password gives its attempt back, as a sign-in does.
    await appeal(suspended.email, PASSWORD).expect(201);
    await login(ip, `nadie_${randomUUID()}@x.test`, 'Incorrecta1!').expect(401);
    expectTooManyRequests(
      await appeal(`nadie_${randomUUID()}@x.test`, 'Incorrecta1!'),
    );
    expectTooManyRequests(await login(ip, suspended.email, PASSWORD));
  });

  it('refuses a seventh reporte within a minute', async () => {
    const student: E2eUser = await createUser(prisma);
    const report = () =>
      request(app.getHttpServer())
        .post('/api/v1/reports')
        .set('Authorization', bearer(app, student))
        .send({});
    for (let i = 0; i < 6; i += 1) await report().expect(400);
    expectTooManyRequests(await report());
  });
});

describe('client IP without TRUST_PROXY (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    ({ app } = await createE2eApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('ignores X-Forwarded-For, so spoofing it does not reset the counter', async () => {
    const register = (i: number) =>
      request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .set('X-Forwarded-For', `172.16.0.${i}`)
        .send({});
    for (let i = 0; i < 3; i += 1) await register(i).expect(400);
    expectTooManyRequests(await register(99));
  });
});
