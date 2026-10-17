import type { NestExpressApplication } from '@nestjs/platform-express';
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

/** Old slugs keep working (openspec academic-structure/catalog-editing). */
describe('Catálogo: slug aliases (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: E2eUser;
  let auth: { Authorization: string };
  const http = () => request(app.getHttpServer());
  const tag = randomUUID().slice(0, 6).toLowerCase();
  const uni = `ua${tag}`;
  let universityId: string;
  let facultyId: string;
  let careerId: string;
  let subjectId: string;

  const admin$ = (method: 'post' | 'patch', path: string, body: object) =>
    http()[method](`/api/v1/admin/catalog/${path}`).set(auth).send(body);
  const browse = (path: string) =>
    http().get(`/api/v1/institutions/browse/${path}`).expect(200);

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    admin = await createUser(prisma, 'ADMIN');
    auth = { Authorization: bearer(app, admin) };

    universityId = (
      await admin$('post', 'universities', {
        name: `Alias ${tag}`,
        shortName: uni,
      }).expect(201)
    ).body.id;
    facultyId = (
      await admin$('post', 'faculties', {
        universityId,
        name: 'Exactas',
        shortName: 'FCEx',
      }).expect(201)
    ).body.id;
    careerId = (
      await admin$('post', 'careers', {
        facultyId,
        name: 'Física',
        code: 'LF',
      }).expect(201)
    ).body.id;
    await http()
      .post(`/api/v1/admin/catalog/careers/${careerId}/publish`)
      .set(auth)
      .expect(200);
    subjectId = (
      await admin$('post', 'subjects', {
        facultyId,
        name: 'Óptica',
        code: `optica-${tag}`,
      }).expect(201)
    ).body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('redirects a renamed facultad and the carreras under it', async () => {
    await admin$('patch', `faculties/${facultyId}`, {
      shortName: 'FCE',
    }).expect(200);

    expect((await browse(`${uni}/fcex`)).body).toEqual({
      redirect: `/universidades/${uni}/fce`,
    });
    expect((await browse(`${uni}/fcex/lf`)).body).toEqual({
      redirect: `/universidades/${uni}/fce/lf`,
    });
    expect((await browse(`${uni}/fce`)).body.faculty.shortName).toBe('FCE');
  });

  it('redirects a renamed universidad', async () => {
    await admin$('patch', `universities/${universityId}`, {
      shortName: `ub${tag}`,
    }).expect(200);
    expect((await browse(uni)).body).toEqual({
      redirect: `/universidades/ub${tag}`,
    });
    expect((await browse(`${uni}/fce/lf`)).body).toEqual({
      redirect: `/universidades/ub${tag}/fce/lf`,
    });
    await admin$('patch', `universities/${universityId}`, {
      shortName: uni,
    }).expect(200);
    const aliases = await prisma.catalogSlugAlias.findMany({
      where: { targetId: universityId },
    });
    expect(aliases.map((a) => a.slug)).toEqual([`ub${tag}`]);
  });

  it('redirects a renamed carrera', async () => {
    await admin$('patch', `careers/${careerId}`, { code: 'LFIS' }).expect(200);
    expect((await browse(`${uni}/fce/lf`)).body).toEqual({
      redirect: `/universidades/${uni}/fce/lfis`,
    });
  });

  it('redirects an old materia code', async () => {
    await admin$('patch', `subjects/${subjectId}`, {
      code: `optica-1-${tag}`,
    }).expect(200);
    const response = await http()
      .get(`/api/v1/subjects/optica-${tag}`)
      .expect(200);
    expect(response.body).toEqual({ redirect: `/materias/optica-1-${tag}` });
    const current = await http()
      .get(`/api/v1/subjects/optica-${tag}/current`)
      .expect(200);
    expect(current.body).toEqual({ redirect: `/materias/optica-1-${tag}` });
    const same = await http()
      .get(`/api/v1/subjects/optica-1-${tag}/current`)
      .expect(200);
    expect(same.body).toEqual({ redirect: null });
  });

  it('renaming back removes the alias', async () => {
    await admin$('patch', `faculties/${facultyId}`, {
      shortName: 'FCEx',
    }).expect(200);
    expect((await browse(`${uni}/fcex`)).body.faculty.shortName).toBe('FCEx');
    const aliases = await prisma.catalogSlugAlias.findMany({
      where: { targetId: facultyId },
    });
    expect(aliases.map((a) => a.slug)).toEqual(['fce']);
  });

  it('warns about an alias and lets a new facultad take it', async () => {
    const check = await http()
      .get('/api/v1/admin/catalog/slug-check')
      .query({ kind: 'FACULTY', parentId: universityId, slug: 'FCE' })
      .set(auth)
      .expect(200);
    expect(check.body.alias).toMatchObject({
      id: facultyId,
      shortName: 'FCEx',
    });

    const other = await admin$('post', 'faculties', {
      universityId,
      name: 'Económicas',
      shortName: 'FCE',
    }).expect(201);
    expect((await browse(`${uni}/fce`)).body.faculty.id).toBe(other.body.id);
    expect(
      await prisma.catalogSlugAlias.count({ where: { targetId: facultyId } }),
    ).toBe(0);
  });

  it('deleting an entity deletes its aliases', async () => {
    const extra = (
      await admin$('post', 'subjects', {
        facultyId,
        name: 'Borrar',
        code: `borrar-${tag}`,
      }).expect(201)
    ).body.id;
    await admin$('patch', `subjects/${extra}`, {
      code: `borrar-2-${tag}`,
    }).expect(200);
    await http()
      .delete(`/api/v1/admin/catalog/subjects/${extra}`)
      .set(auth)
      .expect(204);
    expect(
      await prisma.catalogSlugAlias.count({ where: { targetId: extra } }),
    ).toBe(0);
    await http().get(`/api/v1/subjects/borrar-${tag}`).expect(404);
  });
});
