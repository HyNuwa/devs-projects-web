import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';

import { ADMIN_EMAIL, adminPassword, BACKEND_DIR, guardedDatabaseUrl } from './e2e-env.ts';

// Prisma, its pg adapter and bcrypt are the backend's dependencies.
const backendRequire = createRequire(`${BACKEND_DIR}package.json`);

type Db = {
  user: {
    upsert(args: unknown): Promise<{ id: string }>;
    create(args: unknown): Promise<{ id: string }>;
    findUniqueOrThrow(args: unknown): Promise<{ id: string }>;
  };
  university: { create(args: unknown): Promise<{ id: string }> };
  faculty: {
    create(args: unknown): Promise<{ id: string }>;
    findUnique(args: unknown): Promise<{ id: string } | null>;
  };
  subject: {
    create(args: unknown): Promise<{ id: string }>;
    findUnique(args: unknown): Promise<{ name: string; code: string | null } | null>;
  };
  careerRequest: { create(args: unknown): Promise<{ id: string }> };
  $disconnect(): Promise<void>;
};

let client: Db | null = null;

/** A Prisma client on the e2e database only (see `guardedDatabaseUrl`). */
export function db(): Db {
  if (client) return client;
  const url = guardedDatabaseUrl();
  const { PrismaClient } = backendRequire('./src/generated/prisma/index.js');
  const { PrismaPg } = backendRequire('@prisma/adapter-pg');
  client = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) as Db;
  return client;
}

export async function disconnect() {
  await client?.$disconnect();
  client = null;
}

/** Creates or resets the UI tests' ADMIN account. */
export async function seedAdmin() {
  const bcrypt = backendRequire('bcrypt') as { hash(value: string, rounds: number): Promise<string> };
  const passwordHash = await bcrypt.hash(adminPassword(), 12);
  const data = { passwordHash, role: 'ADMIN', emailVerified: true, isBanned: false };
  return db().user.upsert({
    where: { email: ADMIN_EMAIL },
    create: { email: ADMIN_EMAIL, username: 'e2e_ui_admin', ...data },
    update: data,
    select: { id: true },
  });
}

/** A universidad with one facultad, unique per call; the shortNames fit VarChar(20). */
export async function seedFaculty() {
  const tag = randomUUID().slice(0, 6).toUpperCase();
  const university = await db().university.create({
    data: { name: `Universidad UI ${tag}`, shortName: `UI${tag}` },
    select: { id: true },
  });
  const faculty = await db().faculty.create({
    data: { universityId: university.id, name: `Facultad UI ${tag}`, shortName: `FUI${tag}` },
    select: { id: true },
  });
  return {
    tag,
    universityId: university.id,
    universityLabel: `UI${tag} · Universidad UI ${tag}`,
    facultyId: faculty.id,
    facultyShortName: `FUI${tag}`,
    facultyLabel: `FUI${tag} · Facultad UI ${tag}`,
  };
}

export async function seedSubject(facultyId: string, name: string, code: string) {
  return db().subject.create({
    data: { facultyId, name, code, searchKey: `${name.toLowerCase()} ${code}` },
    select: { id: true },
  });
}

/** A solicitud for the facultad, already rejected by the seeded admin. */
export async function seedRejectedRequest(facultyId: string) {
  const admin = await db().user.findUniqueOrThrow({
    where: { email: ADMIN_EMAIL },
    select: { id: true },
  });
  const tag = randomUUID().slice(0, 8);
  const author = await db().user.create({
    data: {
      username: `e2e_ui_${tag}`,
      email: `e2e_ui_${tag}@devsproject.test`,
      passwordHash: 'x',
      emailVerified: true,
    },
    select: { id: true },
  });
  return db().careerRequest.create({
    data: {
      authorId: author.id,
      facultyId,
      careerName: 'Carrera rechazada',
      planUrl: 'https://example.edu.ar/plan',
      status: 'REJECTED',
      rejectionReason: 'No es una carrera de grado',
      resolvedById: admin.id,
      resolvedAt: new Date(),
    },
    select: { id: true },
  });
}

if (import.meta.main) {
  try {
    await seedAdmin();
    console.log(`Seeded ${ADMIN_EMAIL} on ${new URL(guardedDatabaseUrl()).pathname.slice(1)}.`);
  } finally {
    await disconnect();
  }
}
