import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import { createE2eApp, createUser } from './support/e2e-app';

/** Search starts at the ubicación: the facultad filter (openspec academic-resources/discovery). */
describe('Search by facultad (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  const tag = `zfac${randomUUID().slice(0, 6)}`;
  let universityId: string;
  let facultyA: string;
  let facultyB: string;
  const subjectIds: string[] = [];

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    const author = await createUser(prisma);
    ({ id: universityId } = await prisma.university.create({
      data: {
        name: `Universidad búsqueda ${tag}`,
        shortName: tag.toUpperCase(),
      },
      select: { id: true },
    }));
    for (const [i, short] of ['FA', 'FB'].entries()) {
      const faculty = await prisma.faculty.create({
        data: {
          universityId,
          name: `Facultad ${short} ${tag}`,
          shortName: short,
        },
        select: { id: true },
      });
      if (i === 0) facultyA = faculty.id;
      else facultyB = faculty.id;
      const subject = await prisma.subject.create({
        data: {
          facultyId: faculty.id,
          name: `Materia ${tag} ${short}`,
          searchKey: `materia ${tag} ${short.toLowerCase()}`,
        },
        select: { id: true },
      });
      subjectIds.push(subject.id);
      await prisma.material.create({
        data: {
          title: `Parcial ${tag} ${short}`,
          searchKey: `parcial ${tag} ${short.toLowerCase()}`,
          fileUrl: 'https://drive.example.com/search',
          fileType: 'pdf',
          fileSize: 10,
          authorId: author.id,
          subjectId: subject.id,
          resourceType: 'PARCIAL',
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.material.deleteMany({
      where: { subjectId: { in: subjectIds } },
    });
    await prisma.subject.deleteMany({ where: { id: { in: subjectIds } } });
    await prisma.faculty.deleteMany({ where: { universityId } });
    await prisma.university.delete({ where: { id: universityId } });
    await app.close();
  });

  const titles = (body: { data: { title: string }[] }) =>
    body.data.map((material) => material.title).sort();

  it('lists only materials of the facultad, and everything without the filter', async () => {
    const only = await http()
      .get('/api/v1/materials')
      .query({ search: tag, facultyId: facultyA })
      .expect(200);
    expect(titles(only.body)).toEqual([`Parcial ${tag} FA`]);

    const all = await http()
      .get('/api/v1/materials')
      .query({ search: tag })
      .expect(200);
    expect(titles(all.body)).toEqual([
      `Parcial ${tag} FA`,
      `Parcial ${tag} FB`,
    ]);
  });

  it('limits the materia and material suggestions to the facultad', async () => {
    const res = await http()
      .get('/api/v1/discovery/suggestions')
      .query({ q: tag, facultyId: facultyB })
      .expect(200);
    expect(
      (res.body.subjects as { name: string }[]).map((s) => s.name),
    ).toEqual([`Materia ${tag} FB`]);
    expect(
      (res.body.materials as { title: string }[]).map((m) => m.title),
    ).toEqual([`Parcial ${tag} FB`]);
  });

  it('rejects a facultad that is not an id', async () => {
    await http()
      .get('/api/v1/materials')
      .query({ facultyId: 'fi' })
      .expect(400);
  });
});
