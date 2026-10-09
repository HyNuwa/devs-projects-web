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

type Earned = {
  slug: string;
  name: string;
  rarity: string;
  tier: string | null;
  edition: number;
  earnedAt: string;
  seen: boolean;
};

/** «Tu progreso» insignias (openspec reputation/badges). */
describe('GET /me/badges (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
  });

  afterAll(async () => {
    await app.close();
  });

  const get = (user: E2eUser) =>
    request(app.getHttpServer())
      .get('/api/v1/me/badges')
      .set('Authorization', bearer(app, user));

  /** A published material with `helpful` valid «Me sirvió». */
  async function material(author: E2eUser, helpful = 0) {
    const { id: subjectId } = await createSubject(prisma);
    const created = await prisma.material.create({
      data: {
        title: `Apunte ${randomUUID().slice(0, 6)}`,
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: author.id,
        subjectId,
        resourceType: 'OTRO',
      },
    });
    for (let i = 0; i < helpful; i += 1) {
      const giver = await createUser(prisma);
      await prisma.materialHelpfulness.create({
        data: { userId: giver.id, materialId: created.id },
      });
    }
    return created;
  }

  it('lists the earned insignias with grado, edición, date and whether they were seen', async () => {
    const author = await createUser(prisma);
    await material(author, 1);

    const { body } = await get(author).expect(200);

    const earned = body.earned as Earned[];
    expect(earned.map((badge) => badge.slug).sort()).toEqual([
      'primer-aporte',
      'primer-me-sirvio',
      'primera-luz',
    ]);
    expect(earned.find((badge) => badge.slug === 'primer-aporte')).toEqual(
      expect.objectContaining({
        name: 'Primer aporte',
        rarity: 'COMUN',
        tier: null,
        edition: 0,
        earnedAt: expect.any(String),
        seen: false,
      }),
    );
  });

  it('lists every other insignia as pending, with its criterion', async () => {
    const author = await createUser(prisma);

    const { body } = await get(author).expect(200);

    expect(body.earned).toEqual([]);
    expect(body.pending).toHaveLength(17);
    expect(body.pending[0]).toEqual({
      slug: 'primer-aporte',
      name: 'Primer aporte',
      rarity: 'COMUN',
      description: 'Tu primer material publicado.',
    });
  });

  it('suggests the three closest insignias or grados, with the missing amount in words', async () => {
    const author = await createUser(prisma);
    await material(author, 38);

    const { body } = await get(author).expect(200);

    expect(body.closest).toHaveLength(3);
    expect(body.closest).toContainEqual({
      slug: 'salvavidas',
      name: 'Salvavidas',
      tier: 'BRONCE',
      current: 38,
      target: 50,
      missing: 'Te faltan 12 «Me sirvió»',
    });
  });

  it('marks the insignias as seen, so the entrada animation plays once', async () => {
    const author = await createUser(prisma);
    await material(author);
    const shown = (await get(author).expect(200)).body.earned as Earned[];

    await request(app.getHttpServer())
      .post('/api/v1/me/badges/seen')
      .set('Authorization', bearer(app, author))
      .send({
        badges: shown.map(({ slug, edition }) => ({ slug, edition })),
      })
      .expect(204);

    const { body } = await get(author).expect(200);
    expect((body.earned as Earned[]).every((badge) => badge.seen)).toBe(true);
  });

  it('is only for signed-in accounts', async () => {
    await request(app.getHttpServer()).get('/api/v1/me/badges').expect(401);
  });

  it('marks as seen only the insignias the page showed', async () => {
    const author = await createUser(prisma);
    await material(author, 1);
    await get(author).expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/me/badges/seen')
      .set('Authorization', bearer(app, author))
      .send({ badges: [{ slug: 'primer-aporte', edition: 0 }] })
      .expect(204);

    const { body } = await get(author).expect(200);
    const seen = Object.fromEntries(
      (body.earned as Earned[]).map((badge) => [badge.slug, badge.seen]),
    );
    expect(seen).toEqual(
      expect.objectContaining({
        'primer-aporte': true,
        'primer-me-sirvio': false,
      }),
    );
  });
});
