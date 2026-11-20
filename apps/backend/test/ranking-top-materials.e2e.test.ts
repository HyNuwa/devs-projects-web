import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { FI_UNJU_FACULTY_ID } from '../src/modules/institutions/institutions.constants';
import { semesterRange } from '../src/modules/ranking/badges/badge-calendar';
import type { PrismaService } from '../src/prisma/prisma.service';
import { createE2eApp, createUser } from './support/e2e-app';

type Top = {
  semester: { year: number; half: number };
  entries: {
    rank: number;
    material: { id: string; title: string; resourceType: string };
    helpful: number;
  }[];
};

/** «Más útiles este cuatrimestre» (openspec reputation/rankings). */
describe('most useful materials of a materia (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
  });

  afterAll(async () => {
    await app.close();
  });

  async function subject() {
    const code = `T${randomUUID().slice(0, 8)}`;
    await prisma.subject.create({
      data: {
        facultyId: FI_UNJU_FACULTY_ID,
        name: `Materia top ${code}`,
        code,
      },
    });
    return code;
  }

  async function material(
    code: string,
    title: string,
    extra: Record<string, unknown> = {},
  ) {
    const author = await createUser(prisma);
    const { id: subjectId } = await prisma.subject.findFirstOrThrow({
      where: { code },
      select: { id: true },
    });
    const { id } = await prisma.material.create({
      data: {
        title,
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: author.id,
        subjectId,
        resourceType: 'RESUMEN',
        ...extra,
      },
      select: { id: true },
    });
    return { id, authorId: author.id };
  }

  /** `count` «Me sirvió» from fresh verified accounts, at `at` (now by default). */
  async function helpful(
    materialId: string,
    count: number,
    at = new Date(),
    giver: Record<string, unknown> = {},
  ) {
    for (let i = 0; i < count; i += 1) {
      const user = await createUser(prisma, 'USER', giver);
      await prisma.materialHelpfulness.create({
        data: { userId: user.id, materialId, createdAt: at },
      });
    }
  }

  const top = async (code: string) =>
    (await http().get(`/api/v1/subjects/${code}/top-materials`).expect(200))
      .body as Top;

  it('counts only valid «Me sirvió» received this cuatrimestre, whenever published', async () => {
    const code = await subject();
    const old = await material(code, 'Resumen viejo', {
      createdAt: new Date(Date.now() - 2 * 365 * 86_400_000),
    });
    const { start } = semesterRange(new Date());
    await helpful(old.id, 3);
    await helpful(old.id, 4, new Date(start.getTime() - 60_000));

    const body = await top(code);
    expect(body.semester).toEqual(semesterRange(new Date()).semester);
    expect(body.entries).toEqual([
      {
        rank: 1,
        material: expect.objectContaining({
          id: old.id,
          title: 'Resumen viejo',
          resourceType: 'RESUMEN',
        }),
        helpful: 3,
      },
    ]);
    expect(body.entries[0].material).not.toHaveProperty('authorId');
  });

  it('excludes retired or deleted materials, invalid givers and the author', async () => {
    const code = await subject();
    const kept = await material(code, 'Válido');
    const removed = await material(code, 'Retirado', {
      publicationStatus: 'REMOVED',
    });
    const deleted = await material(code, 'Borrado', { isDeleted: true });
    await helpful(kept.id, 1);
    await helpful(removed.id, 5);
    await helpful(deleted.id, 5);
    await helpful(kept.id, 3, new Date(), { emailVerified: false });
    await helpful(kept.id, 2, new Date(), {
      mutedUntil: new Date(Date.now() + 86_400_000),
    });
    await prisma.materialHelpfulness.create({
      data: { userId: kept.authorId, materialId: kept.id },
    });

    expect(
      (await top(code)).entries.map((e) => [e.material.id, e.helpful]),
    ).toEqual([[kept.id, 1]]);
  });

  it('lists the top 10 with competition ranks', async () => {
    const code = await subject();
    const counts = [5, 4, 4, 3, 2, 2, 1, 1, 1, 1, 1];
    const ids: string[] = [];
    for (const [i, count] of counts.entries()) {
      const { id } = await material(
        code,
        `Material ${String(i).padStart(2, '0')}`,
      );
      await helpful(id, count);
      ids.push(id);
    }
    const body = await top(code);
    expect(body.entries.map((e) => [e.rank, e.helpful])).toEqual([
      [1, 5],
      [2, 4],
      [2, 4],
      [4, 3],
      [5, 2],
      [5, 2],
      [7, 1],
      [7, 1],
      [7, 1],
      [7, 1],
    ]);
  });

  it('is an empty list without activity, and 404 for an unknown materia', async () => {
    const code = await subject();
    await material(code, 'Sin votos');
    expect((await top(code)).entries).toEqual([]);
    await http().get('/api/v1/subjects/NOPE-XYZ/top-materials').expect(404);
  });
});
