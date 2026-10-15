import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  PlanModel,
  type ModelOutput,
  type PlanModelInput,
} from '../src/modules/plan-reading/plan-model';
import { PlanFetcher } from '../src/modules/plan-reading/plan-fetcher';
import { PlanReadingError } from '../src/modules/plan-reading/plan-reading.errors';
import { PlanReadingLimits } from '../src/modules/plan-reading/plan-reading.limits';
import { startOfArgentinaDay } from '../src/modules/plan-reading/plan-reading.service';
import type { FetchedPlan } from '../src/modules/plan-reading/safe-fetch';
import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createUser,
  type E2eUser,
} from './support/e2e-app';

/** Lecturas this file may run today, on top of those already recorded. */
const ALLOWANCE = 40;

/** The network: each plan address answers with a page, a PDF or an error. */
class FakeFetcher extends PlanFetcher {
  readonly pages = new Map<string, FetchedPlan | PlanReadingError>();
  readonly asked: string[] = [];
  fetch(url: string) {
    this.asked.push(url);
    const page = this.pages.get(url);
    if (!page) return Promise.reject(new PlanReadingError('PLAN_UNREACHABLE'));
    return page instanceof PlanReadingError
      ? Promise.reject(page)
      : Promise.resolve(page);
  }
}

/** The AI: answers by the address of the source it gets. */
class FakeModel extends PlanModel {
  readonly name = 'fake-model';
  readonly answers = new Map<string, ModelOutput | PlanReadingError>();
  readonly inputs: PlanModelInput[] = [];
  extract(input: PlanModelInput) {
    this.inputs.push(input);
    const answer = this.answers.get(input.source.url);
    if (!answer) return Promise.reject(new PlanReadingError('AI_FAILED'));
    return answer instanceof PlanReadingError
      ? Promise.reject(answer)
      : Promise.resolve(answer);
  }
}

const html = (url: string, body: string): FetchedPlan => ({
  url,
  kind: 'html',
  body: Buffer.from(body),
});
const pdf = (url: string): FetchedPlan => ({
  url,
  kind: 'pdf',
  body: Buffer.from('%PDF-1.7'),
});
const materias = (...names: string[]): ModelOutput => ({
  materias: names.map((nombre, i) => ({
    year: 1,
    cuatrimestre: i % 2 ? '2' : '1',
    optativa: false,
    nombre,
    creditos: null,
  })),
  notices: [],
  planLinkIndex: null,
});

type Reading = {
  text: string;
  notices: string[];
  sources: { url: string; kind: string }[];
};

/** Lectura del plan (openspec academic-structure/plan-reading). */
describe('Lectura del plan (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: E2eUser;
  let auth: { Authorization: string };
  const fetcher = new FakeFetcher();
  const model = new FakeModel();
  const http = () => request(app.getHttpServer());
  const tag = randomUUID().slice(0, 6).toLowerCase();
  const site = `https://plan-${tag}.edu.ar`;
  let facultyId: string;
  const limits = { daily: 0 };
  const todayCount = () =>
    prisma.moderationEvent.count({
      where: {
        action: 'CATALOG_PLAN_READ',
        createdAt: { gte: startOfArgentinaDay(new Date()) },
      },
    });

  const post = async (path: string, body: object) =>
    (
      await http()
        .post(`/api/v1/admin/catalog/${path}`)
        .set(auth)
        .send(body)
        .expect(201)
    ).body as { id: string };
  const career = async (code: string, planUrl?: string) =>
    (
      await post('careers', {
        facultyId,
        name: `Carrera ${code}`,
        code,
        ...(planUrl ? { planUrl } : {}),
      })
    ).id;
  const read = (careerId: string, headers = auth) =>
    http()
      .post(`/api/v1/admin/catalog/careers/${careerId}/plan-reading`)
      .set(headers);
  const events = (careerId: string) =>
    prisma.moderationEvent.findMany({
      where: {
        action: 'CATALOG_PLAN_READ',
        metadata: { path: ['id'], equals: careerId },
      },
    });

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp((builder) =>
      builder
        .overrideProvider(PlanFetcher)
        .useValue(fetcher)
        .overrideProvider(PlanModel)
        .useValue(model)
        .overrideProvider(PlanReadingLimits)
        .useValue(limits),
    ));
    // History is append-only, so earlier runs' lecturas stay: the limit sits
    // above today's count instead.
    limits.daily = ALLOWANCE + (await todayCount());
    admin = await createUser(prisma, 'ADMIN');
    auth = { Authorization: bearer(app, admin) };
    const university = await post('universities', {
      name: `Lectura ${tag}`,
      shortName: `ul${tag}`,
    });
    facultyId = (
      await post('faculties', {
        universityId: university.id,
        name: 'Exactas',
        shortName: 'FCE',
      })
    ).id;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    fetcher.pages.clear();
    model.answers.clear();
    model.inputs.length = 0;
  });

  it('returns carga masiva text from a PDF and changes nothing in the carrera', async () => {
    const url = `${site}/lf.pdf`;
    const id = await career('lf', url);
    fetcher.pages.set(url, pdf(url));
    model.answers.set(url, {
      ...materias('Análisis Matemático I', 'Física I'),
      notices: ['Usé el plan 2023.'],
    });

    const response = await read(id).expect(200);
    expect(response.body as Reading).toEqual({
      text: '1;1;Análisis Matemático I\n1;2;Física I',
      notices: ['Usé el plan 2023.'],
      sources: [{ url, kind: 'pdf' }],
    });
    expect(model.inputs[0]).toMatchObject({
      career: 'Carrera lf',
      faculty: 'Exactas',
      source: { kind: 'pdf', url },
    });
    expect(
      await prisma.studyPlanSubject.count({
        where: { studyPlan: { careerId: id } },
      }),
    ).toBe(0);

    const [event] = await events(id);
    expect(event.actorId).toBe(admin.id);
    expect(event.metadata).toMatchObject({
      kind: 'CAREER',
      id,
      label: 'Carrera lf',
      after: {
        url,
        linked: null,
        model: 'fake-model',
        lines: 2,
        notices: 1,
        error: null,
      },
    });
  });

  it('follows the plan link of a page without materias, once', async () => {
    const page = `${site}/carreras/lq`;
    const file = `${site}/docs/plan-lq.pdf`;
    const id = await career('lq', page);
    fetcher.pages.set(
      page,
      html(
        page,
        `<h1>Química</h1><a href="/docs/plan-lq.pdf">Plan de estudios</a>`,
      ),
    );
    fetcher.pages.set(file, pdf(file));
    model.answers.set(page, { materias: [], notices: [], planLinkIndex: 0 });
    model.answers.set(file, materias('Química General'));

    const body = (await read(id).expect(200)).body as Reading;
    expect(body.text).toBe('1;1;Química General');
    expect(body.sources).toEqual([
      { url: page, kind: 'html' },
      { url: file, kind: 'pdf' },
    ]);
    expect(body.notices).toContainEqual(expect.stringContaining(file));
    expect(model.inputs[0].source).toMatchObject({
      kind: 'html',
      links: [{ url: file, text: 'Plan de estudios' }],
    });
    const [event] = await events(id);
    expect(event.metadata).toMatchObject({ after: { linked: file } });
  });

  it('follows the plan link to another page, and no further', async () => {
    const page = `${site}/carreras/lg`;
    const plan = `${site}/carreras/lg/plan-1998`;
    const id = await career('lg', page);
    fetcher.pages.set(
      page,
      html(
        page,
        `<h1>Geología</h1><a href="/carreras/lg/plan-1998">Plan de Estudios 1998</a>`,
      ),
    );
    fetcher.pages.set(
      plan,
      html(
        plan,
        `<h2>Primer año</h2><ul><li>Geología General</li></ul><a href="/otro.pdf">Plan viejo</a>`,
      ),
    );
    model.answers.set(page, { materias: [], notices: [], planLinkIndex: 0 });
    model.answers.set(plan, materias('Geología General'));

    const body = (await read(id).expect(200)).body as Reading;
    expect(body.text).toBe('1;1;Geología General');
    expect(body.sources).toEqual([
      { url: page, kind: 'html' },
      { url: plan, kind: 'html' },
    ]);
    expect(body.notices).toContainEqual(expect.stringContaining(plan));
    // The linked page's own links are not offered: no second hop.
    expect(model.inputs[1].source).toMatchObject({ kind: 'html', links: [] });
    const [event] = await events(id);
    expect(event.metadata).toMatchObject({ after: { linked: plan } });
  });

  it('ends with PLAN_NOT_FOUND when the linked page has no materias either', async () => {
    const page = `${site}/carreras/lv`;
    const plan = `${site}/carreras/lv/plan`;
    const id = await career('lv', page);
    fetcher.pages.set(page, html(page, `<a href="/carreras/lv/plan">Plan</a>`));
    fetcher.pages.set(plan, html(plan, `<a href="/plan.pdf">Plan PDF</a>`));
    model.answers.set(page, { materias: [], notices: [], planLinkIndex: 0 });
    model.answers.set(plan, { materias: [], notices: [], planLinkIndex: 0 });

    expect((await read(id).expect(422)).body).toMatchObject({
      code: 'PLAN_NOT_FOUND',
    });
    expect(fetcher.asked).not.toContain(`${site}/plan.pdf`);
  });

  it('ends with PLAN_NOT_FOUND when a page has no materias and no plan link', async () => {
    const page = `${site}/carreras/lm`;
    const id = await career('lm', page);
    fetcher.pages.set(page, html(page, '<p>Próximamente</p>'));
    model.answers.set(page, { materias: [], notices: [], planLinkIndex: null });

    const response = await read(id).expect(422);
    expect(response.body).toMatchObject({ code: 'PLAN_NOT_FOUND' });
    const [event] = await events(id);
    expect(event.metadata).toMatchObject({
      after: { error: 'PLAN_NOT_FOUND' },
    });
  });

  it('reports fetch and AI errors with their codes, and records them', async () => {
    const forbidden = await career('lb', `${site}/privado`);
    fetcher.pages.set(
      `${site}/privado`,
      new PlanReadingError('PLAN_URL_FORBIDDEN'),
    );
    expect((await read(forbidden).expect(422)).body).toMatchObject({
      code: 'PLAN_URL_FORBIDDEN',
    });
    expect(model.inputs).toHaveLength(0);

    const quota = await career('lc', `${site}/lc.pdf`);
    fetcher.pages.set(`${site}/lc.pdf`, pdf(`${site}/lc.pdf`));
    model.answers.set(`${site}/lc.pdf`, new PlanReadingError('AI_QUOTA'));
    expect((await read(quota).expect(429)).body).toMatchObject({
      code: 'AI_QUOTA',
      message: expect.stringMatching(/cuota/),
    });
    expect(await events(quota)).toHaveLength(1);
  });

  it('decodes a page in its own charset', async () => {
    const page = `${site}/carreras/la`;
    const id = await career('la', page);
    fetcher.pages.set(page, {
      url: page,
      kind: 'html',
      charset: 'iso-8859-1',
      body: Buffer.from('<li>Análisis Matemático I</li>', 'latin1'),
    });
    model.answers.set(page, materias('Análisis Matemático I'));
    await read(id).expect(200);
    expect(model.inputs[0].source).toMatchObject({
      kind: 'html',
      text: '- Análisis Matemático I',
    });
  });

  it('records a lectura that fails unexpectedly', async () => {
    const url = `${site}/lx.pdf`;
    const id = await career('lx', url);
    fetcher.pages.set(url, pdf(url));
    model.answers.set(url, materias('x'));
    const extract = model.extract.bind(model);
    model.extract = () => Promise.reject(new Error('boom'));
    try {
      await read(id).expect(500);
    } finally {
      model.extract = extract;
    }
    const [event] = await events(id);
    expect(event.metadata).toMatchObject({ after: { error: 'UNEXPECTED' } });
  });

  it('shows the lectura in Historial to admins only', async () => {
    const url = `${site}/lh.pdf`;
    const id = await career('lh', url);
    fetcher.pages.set(url, pdf(url));
    model.answers.set(url, materias('Química'));
    await read(id).expect(200);

    const history = async (user: E2eUser) =>
      (
        await http()
          .get('/api/v1/moderation/history')
          .query({ action: 'CATALOG_PLAN_READ', actorId: admin.id })
          .set('Authorization', bearer(app, user))
          .expect(200)
      ).body.items as { catalog: { id: string; after: unknown } | null }[];
    const items = await history(admin);
    expect(items.find((item) => item.catalog?.id === id)).toMatchObject({
      catalog: { after: { url, lines: 1, error: null } },
    });
    expect(await history(await createUser(prisma, 'MODERATOR'))).toEqual([]);
  });

  it('refuses a published carrera, one without plan link and a moderator', async () => {
    const noLink = await career('ln');
    expect((await read(noLink).expect(409)).body).toMatchObject({
      code: 'NO_PLAN_URL',
    });

    const published = await career('lp', `${site}/lp.pdf`);
    await http()
      .post(`/api/v1/admin/catalog/careers/${published}/publish`)
      .set(auth)
      .expect(200);
    expect((await read(published).expect(409)).body).toMatchObject({
      code: 'CAREER_PUBLISHED',
    });

    const moderator = await createUser(prisma, 'MODERATOR');
    await read(noLink, { Authorization: bearer(app, moderator) }).expect(403);
    expect(fetcher.asked).not.toContain(`${site}/lp.pdf`);
    expect(await events(noLink)).toHaveLength(0);
  });

  it('limits each admin to 20 lecturas an hour', async () => {
    const other = await createUser(prisma, 'ADMIN');
    const headers = { Authorization: bearer(app, other) };
    const noLink = await career('lr');
    for (let i = 0; i < 20; i += 1) await read(noLink, headers).expect(409);
    await read(noLink, headers).expect(429);
  });

  it('refuses once the daily limit is reached', async () => {
    const url = `${site}/ld.pdf`;
    const id = await career('ld', url);
    const today = await todayCount();
    await prisma.moderationEvent.createMany({
      data: Array.from({ length: limits.daily - today }, () => ({
        actorId: admin.id,
        action: 'CATALOG_PLAN_READ' as const,
        metadata: { kind: 'CAREER', id: randomUUID() },
      })),
    });
    fetcher.pages.set(url, pdf(url));
    model.answers.set(url, materias('Química'));

    expect((await read(id).expect(429)).body).toMatchObject({
      code: 'DAILY_LIMIT',
    });
    expect(model.inputs).toHaveLength(0);
  });
});
