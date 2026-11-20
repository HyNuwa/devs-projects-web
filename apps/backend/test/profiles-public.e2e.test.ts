import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BadgeService } from '../src/modules/ranking/badges/badge.service';
import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createSubject,
  createUser,
  type E2eUser,
} from './support/e2e-app';

type Badge = { slug: string; tier: string | null };
type Profile = {
  id: string;
  username: string;
  memberSince: string;
  avatarCat: string | null;
  customization: {
    accent: string | null;
    background: string | null;
    frame: string | null;
    banner: string | null;
    theme: string | null;
  };
  level: { number: number; name: string } | null;
  title: Badge | null;
  featured: Badge[];
  badges: Badge[];
  pinned: { type: string; id: string; title: string }[];
};

const PUBLIC_FIELDS = [
  'avatarCat',
  'avatarUrl',
  'badges',
  'bio',
  'customization',
  'displayName',
  'featured',
  'id',
  'level',
  'memberSince',
  'pinned',
  'title',
  'username',
];

/** The perfil público API (openspec reputation/public-profile). */
describe('public profile by username (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let badges: BadgeService;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    badges = app.get(BadgeService);
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  async function account(extra: Record<string, unknown> = {}) {
    const user = await createUser(prisma, 'USER', extra);
    const { username } = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { username: true },
    });
    return { ...user, username };
  }

  const profile = async (username: string) =>
    (await http().get(`/api/v1/profiles/${username}`).expect(200))
      .body as Profile;

  async function material(authorId: string, subjectId?: string) {
    return prisma.material.create({
      data: {
        title: `Resumen ${randomUUID().slice(0, 6)}`,
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId,
        subjectId: subjectId ?? (await createSubject(prisma)).id,
        resourceType: 'RESUMEN',
      },
      select: { id: true },
    });
  }

  /** 50 valid «Me sirvió» on one material: Salvavidas in bronce. */
  async function salvavidas(authorId: string) {
    const { id: materialId } = await material(authorId);
    const tag = randomUUID().slice(0, 6);
    const givers = Array.from({ length: 50 }, (_, i) => ({
      id: randomUUID(),
      username: `sv_${tag}_${i}`,
      email: `sv_${tag}_${i}@devsproject.test`,
      passwordHash: 'x',
      emailVerified: true,
      createdAt: new Date(Date.now() - 200 * 86_400_000),
    }));
    await prisma.user.createMany({ data: givers });
    await prisma.materialHelpfulness.createMany({
      data: givers.map((giver) => ({ userId: giver.id, materialId })),
    });
    return materialId;
  }

  const customize = (userId: string, data: Record<string, unknown>) =>
    prisma.profileCustomization.create({ data: { userId, ...data } });

  it('is public, and 404 for an unknown username', async () => {
    const user = await account();

    const body = await profile(user.username);

    expect(Object.keys(body).sort()).toEqual(PUBLIC_FIELDS);
    await http().get('/api/v1/profiles/nadie-existe-123').expect(404);
  });

  it('shows the nivel and never points, email, sanción, plans, Ojo atento or dates', async () => {
    const user = await account({
      points: 640,
      level: 5,
      maxLevel: 5,
      isMuted: true,
      mutedUntil: new Date(Date.now() + 86_400_000),
      createdAt: new Date('2026-03-15T12:00:00Z'),
    });
    await material(user.id);

    const body = await profile(user.username);
    const raw = JSON.stringify(body);

    expect(body.level).toEqual({ number: 5, name: 'Siete vidas' });
    expect(body.memberSince).toBe('2026-03');
    expect(raw).not.toContain('640');
    expect(raw).not.toContain(user.email);
    expect(raw).not.toMatch(/muted|banned|sanction|studyPlan|ojo-atento/i);
    // No date fields at all: «Miembro desde» is only a month.
    expect(raw).not.toMatch(/(created|earned|seen|updated)At"/);
    expect(body.badges.map((b) => b.slug)).toContain('primer-aporte');
  });

  it('dates «Miembro desde» in Argentina time (UTC-3)', async () => {
    // 1 April 01:00 UTC is still 31 March in Jujuy.
    const user = await account({ createdAt: new Date('2026-04-01T01:00:00Z') });

    expect((await profile(user.username)).memberSince).toBe('2026-03');
  });

  it('returns the customization, título and destacadas in order with the current grado', async () => {
    const user = await account({ points: 950, level: 6, maxLevel: 6 });
    await salvavidas(user.id);
    for (let i = 0; i < 9; i += 1) await material(user.id);
    await customize(user.id, {
      avatarCat: 'gato-lentes',
      accent: 'coral',
      background: 'pixel',
      frame: 'marco-salvavidas',
      banner: 'banner-pasillo',
      titleBadge: 'salvavidas',
      featuredBadges: ['trotamaterias', 'salvavidas'],
    });

    const body = await profile(user.username);

    expect(body.avatarCat).toBe('gato-lentes');
    expect(body.customization).toEqual({
      accent: 'coral',
      background: 'pixel',
      frame: 'marco-salvavidas',
      banner: 'banner-pasillo',
      theme: null,
    });
    expect(body.title).toMatchObject({ slug: 'salvavidas', tier: 'BRONCE' });
    expect(body.featured.map((b) => [b.slug, b.tier])).toEqual([
      ['trotamaterias', 'PLATA'],
      ['salvavidas', 'BRONCE'],
    ]);
  });

  it('drops the frame, título and destacada of a lost Salvavidas, and shows the lower grado', async () => {
    const user = await account({ points: 950, level: 6, maxLevel: 6 });
    const lifesaver = await salvavidas(user.id);
    // 11 materias: Trotamaterias in plata. Losing 6 leaves 5, bronce.
    const others: { id: string }[] = [];
    for (let i = 0; i < 10; i += 1) others.push(await material(user.id));
    await customize(user.id, {
      frame: 'marco-salvavidas',
      titleBadge: 'salvavidas',
      featuredBadges: ['salvavidas', 'trotamaterias'],
    });
    await badges.evaluate(user.id);

    await prisma.material.update({
      where: { id: lifesaver },
      data: { publicationStatus: 'REMOVED' },
    });
    await prisma.material.updateMany({
      where: { id: { in: others.slice(0, 5).map((m) => m.id) } },
      data: { isDeleted: true },
    });
    await badges.evaluate(user.id);

    const body = await profile(user.username);

    expect(body.customization.frame).toBeNull();
    expect(body.title).toBeNull();
    expect(body.featured).toEqual([
      expect.objectContaining({ slug: 'trotamaterias', tier: 'BRONCE' }),
    ]);
  });

  it('drops a retired or deleted pin, and shows it again when restored', async () => {
    const user = await account({ maxLevel: 3, level: 3, points: 120 });
    const { id: subjectId } = await createSubject(prisma);
    const kept = await material(user.id, subjectId);
    const retired = await material(user.id, subjectId);
    const review = await prisma.courseReview.create({
      data: { userId: user.id, subjectId, recommendation: 5 },
      select: { id: true },
    });
    await customize(user.id, {
      pinned: [
        { type: 'MATERIAL', id: retired.id },
        { type: 'COURSE_REVIEW', id: review.id },
        { type: 'MATERIAL', id: kept.id },
      ],
    });

    await prisma.material.update({
      where: { id: retired.id },
      data: { publicationStatus: 'REMOVED' },
    });
    await prisma.courseReview.delete({ where: { id: review.id } });
    expect((await profile(user.username)).pinned.map((p) => p.id)).toEqual([
      kept.id,
    ]);

    await prisma.material.update({
      where: { id: retired.id },
      data: { publicationStatus: 'PUBLISHED' },
    });
    expect((await profile(user.username)).pinned.map((p) => p.id)).toEqual([
      retired.id,
      kept.id,
    ]);
  });

  it('hides nivel, insignias and título when the switch is off, and keeps the rest', async () => {
    const user = await account({ points: 4600, level: 10, maxLevel: 10 });
    const pin = await material(user.id);
    await customize(user.id, {
      frame: 'marco-legendario',
      titleBadge: 'primer-aporte',
      featuredBadges: ['primer-aporte'],
      pinned: [{ type: 'MATERIAL', id: pin.id }],
      showLevelAndBadges: false,
    });

    const body = await profile(user.username);

    expect(body.level).toBeNull();
    expect(body.title).toBeNull();
    expect(body.featured).toEqual([]);
    expect(body.badges).toEqual([]);
    expect(body.customization.frame).toBe('marco-legendario');
    expect(body.pinned.map((p) => p.id)).toEqual([pin.id]);
  });

  it('looks the same while the account is muted or suspended', async () => {
    const user = await account({ points: 600, level: 5, maxLevel: 5 });
    await material(user.id);
    await customize(user.id, { banner: 'banner-biblioteca', accent: 'menta' });
    const before = await profile(user.username);

    await prisma.user.update({
      where: { id: user.id },
      data: { isMuted: true, mutedUntil: new Date(Date.now() + 86_400_000) },
    });
    expect(await profile(user.username)).toEqual(before);

    await prisma.user.update({
      where: { id: user.id },
      data: { isBanned: true, bannedUntil: null },
    });
    expect(await profile(user.username)).toEqual(before);
  });

  it('returns the same projection on GET /users/:id', async () => {
    const viewer: E2eUser = await createUser(prisma);
    const user = await account({ points: 120, level: 3, maxLevel: 3 });
    await customize(user.id, { accent: 'cielo' });

    const { body } = await http()
      .get(`/api/v1/users/${user.id}`)
      .set('Authorization', bearer(app, viewer))
      .expect(200);

    expect(body).toEqual(await profile(user.username));
  });
});
