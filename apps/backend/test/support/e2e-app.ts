import { JwtService } from '@nestjs/jwt';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';

import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/config/configure-app';
import type { Role } from '../../src/generated/prisma';
import { FI_UNJU_FACULTY_ID } from '../../src/modules/institutions/institutions.constants';
import { PrismaService } from '../../src/prisma/prisma.service';

/** Boots the whole API with the same pipeline as `main.ts`. */
export async function createE2eApp(
  /** Replaces providers, such as the network and the AI in plan-reading. */
  override: (builder: TestingModuleBuilder) => TestingModuleBuilder = (b) => b,
) {
  const moduleRef = await override(
    Test.createTestingModule({ imports: [AppModule] }),
  ).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({
    logger: false,
  });
  configureApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

export type E2eUser = { id: string; email: string; role: Role };

/**
 * Creates an account with a unique username; older than 7 days and verified by
 * default. A MODERATOR covers FI-UNJU unless `faculties` says otherwise, as the
 * migration of change alcance-por-facultad did for existing moderators.
 */
export async function createUser(
  prisma: PrismaService,
  role: Role = 'USER',
  extra: Record<string, unknown> = {},
  { faculties = [FI_UNJU_FACULTY_ID] }: { faculties?: string[] } = {},
): Promise<E2eUser> {
  const tag = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
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
  if (role === 'MODERATOR' && faculties.length > 0) {
    await prisma.moderatorScope.createMany({
      data: faculties.map((facultyId) => ({ userId: user.id, facultyId })),
    });
  }
  return user;
}

/**
 * A student with a carrera at FI-UNJU, so FI moderators can see the account
 * (openspec moderation/scope). The carrera is shared by every e2e file.
 */
export async function createStudent(
  prisma: PrismaService,
  extra: Record<string, unknown> = {},
): Promise<E2eUser> {
  const user = await createUser(prisma, 'USER', extra);
  await declareFiCareer(prisma, user.id);
  return user;
}

/** Declares the shared FI-UNJU carrera for an existing account. */
export async function declareFiCareer(prisma: PrismaService, userId: string) {
  const studyPlanId = await sharedFiPlan(prisma);
  await prisma.userStudyPlan.create({ data: { userId, studyPlanId } });
}

async function sharedFiPlan(prisma: PrismaService) {
  const where = {
    facultyId_code: { facultyId: FI_UNJU_FACULTY_ID, code: 'E2E' },
  };
  const find = () =>
    prisma.career.findUnique({
      where,
      select: { studyPlans: { select: { id: true } } },
    });
  let career = await find();
  if (!career) {
    try {
      career = await prisma.career.create({
        data: {
          status: 'PUBLISHED',
          facultyId: FI_UNJU_FACULTY_ID,
          name: 'Carrera e2e',
          code: 'E2E',
          studyPlans: { create: [{ name: 'Plan', code: 'E2E', duration: 5 }] },
        },
        select: { studyPlans: { select: { id: true } } },
      });
    } catch {
      // Another test file created it at the same time.
      career = await find();
    }
  }
  return career!.studyPlans[0].id;
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
    data: {
      facultyId: FI_UNJU_FACULTY_ID,
      name: `Materia e2e ${randomUUID().slice(0, 6)}`,
    },
    select: { id: true },
  });
}
