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

type Pin = { type: string; id: string };
type Choices = {
  avatarCat: string | null;
  accent: string | null;
  background: string | null;
  frame: string | null;
  banner: string | null;
  theme: string | null;
  titleBadge: string | null;
  featuredBadges: string[];
  pinned: Pin[];
  showLevelAndBadges: boolean;
};
type Option = {
  id: string;
  kind: string;
  unlocked: boolean;
  unlockLabel: string;
};
type Mine = {
  choices: Choices;
  options: Option[];
  limits: { pins: number; featured: number; titleUnlocked: boolean };
  eligibleBadges: { slug: string; tier: string | null }[];
};

const DEFAULTS: Choices = {
  avatarCat: null,
  accent: null,
  background: null,
  frame: null,
  banner: null,
  theme: null,
  titleBadge: null,
  featuredBadges: [],
  pinned: [],
  showLevelAndBadges: true,
};

const PATH = '/api/v1/users/me/profile-customization';

/** Mi perfil → «Perfil público» (openspec reputation/profile-customization). */
describe('profile customization API (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  const student = (maxLevel: number) =>
    createUser(prisma, 'USER', { maxLevel, level: maxLevel });

  async function holdBadge(userId: string, slug: string, tier = 'PLATA') {
    const badge = await prisma.badge.findUniqueOrThrow({ where: { slug } });
    await prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
        tier: tier as 'PLATA',
        edition: 0,
      },
    });
  }

  async function material(authorId: string, extra: object = {}) {
    const { id: subjectId } = await createSubject(prisma);
    return prisma.material.create({
      data: {
        title: `Parcial ${randomUUID().slice(0, 6)}`,
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId,
        subjectId,
        resourceType: 'PARCIAL',
        ...extra,
      },
      select: { id: true },
    });
  }

  async function review(userId: string, isAnonymous: boolean) {
    const { id: subjectId } = await createSubject(prisma);
    return prisma.courseReview.create({
      data: { userId, subjectId, recommendation: 4, isAnonymous },
      select: { id: true },
    });
  }

  const save = (user: E2eUser, choices: Partial<Choices>) =>
    http()
      .put(PATH)
      .set('Authorization', bearer(app, user))
      .send({ ...DEFAULTS, ...choices });

  const mine = async (user: E2eUser) =>
    (await http().get(PATH).set('Authorization', bearer(app, user)).expect(200))
      .body as Mine;

  it('returns the defaults and each option with its lock state', async () => {
    const user = await student(3);

    const body = await mine(user);

    expect(body.choices).toEqual(DEFAULTS);
    expect(body.limits).toEqual({ pins: 3, featured: 3, titleUnlocked: false });
    const option = (id: string) => body.options.find((o) => o.id === id);
    expect(option('menta')).toMatchObject({ kind: 'accent', unlocked: true });
    expect(option('banner-biblioteca')).toMatchObject({
      unlocked: false,
      unlockLabel: 'Nv. 5',
    });
    expect(option('marco-salvavidas')).toMatchObject({
      unlocked: false,
      unlockLabel: 'Insignia Salvavidas',
    });
  });

  it('saves every choice at once, replacing the previous ones', async () => {
    const user = await student(6);
    await holdBadge(user.id, 'salvavidas');
    await holdBadge(user.id, 'trotamaterias', 'BRONCE');
    const { id: materialId } = await material(user.id);
    const { id: reviewId } = await review(user.id, false);
    const choices: Choices = {
      avatarCat: 'gato-lentes',
      accent: 'coral',
      background: 'hoja',
      frame: 'marco-salvavidas',
      banner: 'banner-pasillo',
      theme: null,
      titleBadge: 'salvavidas',
      featuredBadges: ['trotamaterias', 'salvavidas'],
      pinned: [
        { type: 'COURSE_REVIEW', id: reviewId },
        { type: 'MATERIAL', id: materialId },
      ],
      showLevelAndBadges: false,
    };

    await save(user, choices).expect(200);
    expect((await mine(user)).choices).toEqual(choices);

    await save(user, { accent: 'menta' }).expect(200);
    expect((await mine(user)).choices).toEqual({
      ...DEFAULTS,
      accent: 'menta',
    });
  });

  it('lists the held public insignias as eligible, never Ojo atento', async () => {
    const user = await student(1);
    await holdBadge(user.id, 'salvavidas');
    await holdBadge(user.id, 'ojo-atento', 'BRONCE');

    const { eligibleBadges } = await mine(user);

    expect(eligibleBadges.map((badge) => badge.slug)).toEqual(['salvavidas']);
  });

  it.each([
    ['an unknown option', 3, { accent: 'fucsia' }],
    ['an option of another kind', 3, { accent: 'hoja' }],
    ['a locked option', 3, { banner: 'banner-biblioteca' }],
    ['a locked cat', 1, { avatarCat: 'gato-lentes' }],
    ['a título below nivel 6', 5, { titleBadge: 'salvavidas' }],
    ['a título not held', 6, { titleBadge: 'puente' }],
    ['Ojo atento as título', 6, { titleBadge: 'ojo-atento' }],
    ['Ojo atento as destacada', 1, { featuredBadges: ['ojo-atento'] }],
    ['a destacada not held', 1, { featuredBadges: ['puente'] }],
    [
      'more than 3 destacadas',
      1,
      {
        featuredBadges: ['salvavidas', 'puente', 'constante', 'primer-aporte'],
      },
    ],
    [
      'a repeated destacada',
      1,
      { featuredBadges: ['salvavidas', 'salvavidas'] },
    ],
  ])('rejects %s and keeps the previous choices', async (_, level, choices) => {
    const user = await student(level);
    await holdBadge(user.id, 'salvavidas');
    await holdBadge(user.id, 'ojo-atento', 'BRONCE');
    await save(user, { accent: level >= 3 ? 'cielo' : null }).expect(200);
    const before = (await mine(user)).choices;

    await save(user, { ...before, ...choices }).expect(400);

    expect((await mine(user)).choices).toEqual(before);
  });

  it('rejects the Salvavidas frame without the insignia, at any nivel', async () => {
    const user = await student(10);

    await save(user, { frame: 'marco-salvavidas' }).expect(400);
    await save(user, { frame: 'marco-legendario' }).expect(200);
  });

  it('limits aportes fijados by nivel', async () => {
    const novice = await student(1);
    const { id: first } = await material(novice.id);
    await save(novice, { pinned: [{ type: 'MATERIAL', id: first }] }).expect(
      400,
    );

    const level2 = await student(2);
    const one = await material(level2.id);
    const two = await material(level2.id);
    await save(level2, { pinned: [{ type: 'MATERIAL', id: one.id }] }).expect(
      200,
    );
    await save(level2, {
      pinned: [
        { type: 'MATERIAL', id: one.id },
        { type: 'MATERIAL', id: two.id },
      ],
    }).expect(400);
    await save(level2, {
      pinned: [
        { type: 'MATERIAL', id: one.id },
        { type: 'MATERIAL', id: one.id },
      ],
    }).expect(400);
  });

  it('rejects pins that are not the student’s own, published and named, with one message', async () => {
    const user = await student(3);
    const other = await student(3);
    const cases: Pin[] = [
      { type: 'MATERIAL', id: (await material(other.id)).id },
      { type: 'COURSE_REVIEW', id: (await review(user.id, true)).id },
      { type: 'COURSE_REVIEW', id: (await review(other.id, true)).id },
      {
        type: 'MATERIAL',
        id: (await material(user.id, { publicationStatus: 'REMOVED' })).id,
      },
      {
        type: 'MATERIAL',
        id: (await material(user.id, { isDeleted: true })).id,
      },
      { type: 'EXAM_EXPERIENCE', id: randomUUID() },
    ];

    const messages = new Set<string>();
    for (const pin of cases) {
      const { body } = await save(user, { pinned: [pin] }).expect(400);
      messages.add(JSON.stringify((body as { message: unknown }).message));
    }

    expect(messages.size).toBe(1);
    expect((await mine(user)).choices.pinned).toEqual([]);
  });

  it('requires a session', async () => {
    await http().get(PATH).expect(401);
    await http().put(PATH).send(DEFAULTS).expect(401);
  });

  it('returns only the choices that still hold, so saving them back works', async () => {
    const user = await student(6);
    await holdBadge(user.id, 'primer-aporte', 'BRONCE');
    const kept = await material(user.id);
    const retired = await material(user.id, { publicationStatus: 'REMOVED' });
    // Stored before the unlocks were lost: the Salvavidas insignia, a nivel-7
    // cat after a rebuild, and a material moderation retired.
    await prisma.profileCustomization.create({
      data: {
        userId: user.id,
        avatarCat: 'gato-dorado',
        accent: 'coral',
        frame: 'marco-salvavidas',
        titleBadge: 'salvavidas',
        featuredBadges: ['salvavidas', 'primer-aporte'],
        pinned: [
          { type: 'MATERIAL', id: retired.id },
          { type: 'MATERIAL', id: kept.id },
        ],
      },
    });

    const { choices } = await mine(user);

    expect(choices).toEqual({
      ...DEFAULTS,
      accent: 'coral',
      featuredBadges: ['primer-aporte'],
      pinned: [{ type: 'MATERIAL', id: kept.id }],
    });
    await save(user, choices).expect(200);

    const { body } = await http()
      .get('/api/v1/users/me')
      .set('Authorization', bearer(app, user))
      .expect(200);
    expect((body as { avatarCat: string | null }).avatarCat).toBeNull();
  });

  it('returns the chosen cat on /users/me', async () => {
    const user = await student(2);
    await save(user, { avatarCat: 'gato-mate' }).expect(200);

    const { body } = await http()
      .get('/api/v1/users/me')
      .set('Authorization', bearer(app, user))
      .expect(200);

    expect((body as { avatarCat: string }).avatarCat).toBe('gato-mate');

    // The shell reads the session from /auth/me.
    const { body: session } = await http()
      .get('/api/v1/auth/me')
      .set('Authorization', bearer(app, user))
      .expect(200);
    expect((session as { avatarCat: string }).avatarCat).toBe('gato-mate');
  });
});
