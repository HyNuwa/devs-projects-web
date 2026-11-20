import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { MailService } from '../src/modules/mail/mail.service';
import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createUser,
  type E2eUser,
} from './support/e2e-app';

const PLAN = 'https://exactas.example.edu.ar/plan';

/** Emails of the solicitudes de carrera (openspec academic-structure/career-requests). */
describe('Solicitudes de carrera: emails (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let mail: MailService;
  let admin: E2eUser;
  let facultyId: string;
  const http = () => request(app.getHttpServer());
  const tag = randomUUID().slice(0, 6).toLowerCase();
  const as = (user: E2eUser) => ({ Authorization: bearer(app, user) });

  /** A solicitud by a verified author, joined by a verified and an unverified student. */
  const solicitud = async (careerName: string) => {
    const author = await createUser(prisma, 'USER');
    const supporter = await createUser(prisma, 'USER');
    const unverified = await createUser(prisma, 'USER');
    const { id } = (
      await http()
        .post('/api/v1/career-requests')
        .set(as(author))
        .send({ facultyId, careerName, planUrl: PLAN })
        .expect(201)
    ).body;
    await http()
      .post(`/api/v1/career-requests/${id}/support`)
      .set(as(supporter))
      .expect(204);
    await http()
      .post(`/api/v1/career-requests/${id}/support`)
      .set(as(unverified))
      .expect(204);
    await prisma.user.update({
      where: { id: unverified.id },
      data: { emailVerified: false },
    });
    return { id, author, supporter, unverified };
  };

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    mail = app.get(MailService);
    admin = await createUser(prisma, 'ADMIN');
    const university = await http()
      .post('/api/v1/admin/catalog/universities')
      .set(as(admin))
      .send({ name: `Correo ${tag}`, shortName: `uc${tag}` })
      .expect(201);
    facultyId = (
      await http()
        .post('/api/v1/admin/catalog/faculties')
        .set(as(admin))
        .send({
          universityId: university.body.id,
          name: 'Exactas',
          shortName: 'FCE',
        })
        .expect(201)
    ).body.id;
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('emails every verified student when a solicitud is rejected', async () => {
    const sent = vi
      .spyOn(mail, 'sendCareerRequestRejected')
      .mockResolvedValue();
    const { id, author, supporter } = await solicitud(`Rechazo ${tag}`);
    await http()
      .post(`/api/v1/admin/catalog/requests/${id}/reject`)
      .set(as(admin))
      .send({ reason: 'No es de grado' })
      .expect(204);
    expect(sent.mock.calls.map((call) => call[0]).sort()).toEqual(
      [author.email, supporter.email].sort(),
    );
    expect(sent.mock.calls[0].slice(2)).toEqual([
      `Rechazo ${tag}`,
      'No es de grado',
    ]);
  });

  it('emails them when the carrera is published, with its address', async () => {
    const sent = vi.spyOn(mail, 'sendCareerPublished').mockResolvedValue();
    const { id, author, supporter } = await solicitud(`Publicada ${tag}`);
    const { careerId } = (
      await http()
        .post(`/api/v1/admin/catalog/requests/${id}/accept`)
        .set(as(admin))
        .send({ career: { name: 'Meteorología', code: 'MET' } })
        .expect(200)
    ).body;
    expect(sent).not.toHaveBeenCalled();

    await http()
      .post(`/api/v1/admin/catalog/careers/${careerId}/publish`)
      .set(as(admin))
      .expect(200);
    expect(sent.mock.calls.map((call) => call[0]).sort()).toEqual(
      [author.email, supporter.email].sort(),
    );
    expect(sent.mock.calls[0].slice(2)).toEqual([
      'Meteorología',
      `/universidades/uc${tag}/fce/met`,
    ]);
  });

  it('keeps the decision when an email fails', async () => {
    vi.spyOn(mail, 'sendCareerRequestRejected').mockRejectedValue(
      new Error('smtp down'),
    );
    const { id } = await solicitud(`Falla ${tag}`);
    await http()
      .post(`/api/v1/admin/catalog/requests/${id}/reject`)
      .set(as(admin))
      .send({ reason: 'Duplicada' })
      .expect(204);
    const row = await prisma.careerRequest.findUniqueOrThrow({ where: { id } });
    expect(row.status).toBe('REJECTED');
  });
});
