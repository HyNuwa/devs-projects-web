import { JwtService } from '@nestjs/jwt';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';

import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/config/configure-app';
import type { Role } from '../../src/generated/prisma';
import { PrismaService } from '../../src/prisma/prisma.service';

/** Boots the whole API with the same pipeline as `main.ts`. */
export async function createE2eApp() {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({
    logger: false,
  });
  configureApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

export type E2eUser = { id: string; email: string; role: Role };

/** Creates an account with a unique username; older than 7 days and verified by default. */
export async function createUser(
  prisma: PrismaService,
  role: Role = 'USER',
  extra: Record<string, unknown> = {},
): Promise<E2eUser> {
  const tag = randomUUID().slice(0, 8);
  return prisma.user.create({
    data: {
      username: `e2e_${tag}`,
      email: `e2e_${tag}@devsproject.test`,
      passwordHash: 'x',
      role,
      emailVerified: true,
      createdAt: new Date(Date.now() - 200 * 24 * 3_600_000),
      ...extra,
    },
    select: { id: true, email: true, role: true },
  });
}

/** An Authorization header for `user`, signed like a real access token. */
export function bearer(app: NestExpressApplication, user: E2eUser) {
  const token = app
    .get(JwtService, { strict: false })
    .sign({ sub: user.id, email: user.email, role: user.role });
  return `Bearer ${token}`;
}

export async function createSubject(prisma: PrismaService) {
  return prisma.subject.create({
    data: { name: `Materia e2e ${randomUUID().slice(0, 6)}` },
    select: { id: true },
  });
}
