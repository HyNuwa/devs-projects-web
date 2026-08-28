import { PrismaClient, Role } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { normalizeSearchKey } from '../src/common/search/search-key';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:1234@localhost:5433/devs_project?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 12;

async function hash(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  // Limpiar datos existentes (en orden inverso de dependencias)
  await prisma.pointTransaction.deleteMany();
  await prisma.materialRating.deleteMany();
  await prisma.material.deleteMany();
  await prisma.guideStep.deleteMany();
  await prisma.guide.deleteMany();
  await prisma.examExperience.deleteMany();
  await prisma.courseReview.deleteMany();
  await prisma.subjectProfessor.deleteMany();
  await prisma.userStudyPlan.deleteMany();
  await prisma.studyPlanSubject.deleteMany();
  await prisma.studyPlan.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.professor.deleteMany();
  await prisma.career.deleteMany();
  await prisma.moderationLog.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.emailVerification.deleteMany();
  await prisma.passwordResetRequest.deleteMany();
  await prisma.user.deleteMany();

  // Usuarios de desarrollo
  const [adminUser, moderatorUser, normalUser] = await Promise.all([
    prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@devsproject.local',
        passwordHash: await hash('AdminPass123!'),
        role: Role.ADMIN,
        displayName: 'Administrador',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        username: 'moderator',
        email: 'moderator@devsproject.local',
        passwordHash: await hash('ModPass123!'),
        role: Role.MODERATOR,
        displayName: 'Moderador',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        username: 'user',
        email: 'user@devsproject.local',
        passwordHash: await hash('UserPass123!'),
        role: Role.USER,
        displayName: 'Usuario de Prueba',
        emailVerified: true,
      },
    }),
  ]);

  console.log(
    `Usuarios creados: ${adminUser.username}, ${moderatorUser.username}, ${normalUser.username}`,
  );

  // Puntos y niveles RPG de los usuarios demo
  const pointSeeds = [
    { user: adminUser, points: 5000, level: 8 },
    { user: moderatorUser, points: 1500, level: 6 },
    { user: normalUser, points: 100, level: 2 },
  ];

  for (const { user, points, level } of pointSeeds) {
    await prisma.user.update({
      where: { id: user.id },
      data: { points, level },
    });

    await prisma.pointTransaction.create({
      data: {
        userId: user.id,
        amount: points,
        reason: 'SEED',
      },
    });
  }

  console.log('Puntos y niveles de usuarios demo configurados');

  // Carrera
  const career = await prisma.career.create({
    data: {
      name: 'Ingeniería Informática',
      code: 'II',
    },
  });

  // Plan de estudios
  const plan = await prisma.studyPlan.create({
    data: {
      careerId: career.id,
      name: 'Plan 2023',
      code: 'II-2023',
      duration: 5,
    },
  });

  // Materias con año, cuatrimestre y créditos
  const subjectsData: Array<{
    code: string;
    name: string;
    year: number;
    semester: number;
    credits: number;
  }> = [
    // Primer año
    {
      code: '01',
      name: 'Introducción a la Programación',
      year: 1,
      semester: 1,
      credits: 8,
    },
    { code: '02', name: 'Álgebra Lineal', year: 1, semester: 1, credits: 6 },
    {
      code: '03',
      name: 'Organización de computadoras',
      year: 1,
      semester: 1,
      credits: 6,
    },
    {
      code: '04',
      name: 'Análisis Matemático I',
      year: 1,
      semester: 1,
      credits: 8,
    },
    {
      code: '05',
      name: 'Metodología de la Programación',
      year: 1,
      semester: 2,
      credits: 6,
    },
    {
      code: '06',
      name: 'Análisis Matemático II',
      year: 1,
      semester: 2,
      credits: 8,
    },
    { code: '07', name: 'Física Mecánica', year: 1, semester: 2, credits: 6 },
    {
      code: '08',
      name: 'Estructura de Datos',
      year: 1,
      semester: 2,
      credits: 6,
    },

    // Segundo año
    {
      code: '09',
      name: 'Matemática Discreta',
      year: 2,
      semester: 1,
      credits: 6,
    },
    {
      code: '10',
      name: 'Teoría de la Información y la Comunicación',
      year: 2,
      semester: 1,
      credits: 6,
    },
    {
      code: '11',
      name: 'Desarrollo Sistemático de Programas',
      year: 2,
      semester: 1,
      credits: 6,
    },
    {
      code: '12',
      name: 'Probabilidades y Estadística',
      year: 2,
      semester: 1,
      credits: 6,
    },
    {
      code: '13',
      name: 'Electricidad y Magnetismo',
      year: 2,
      semester: 2,
      credits: 6,
    },
    { code: '14', name: 'Bases de Datos', year: 2, semester: 2, credits: 8 },
    {
      code: '15',
      name: 'Programación Concurrente',
      year: 2,
      semester: 2,
      credits: 6,
    },
    { code: '16', name: 'Cálculo Numérico', year: 2, semester: 2, credits: 6 },

    // Tercer año
    {
      code: '17',
      name: 'Lógica Computacional',
      year: 3,
      semester: 1,
      credits: 6,
    },
    {
      code: '18',
      name: 'Sistemas Operativos I',
      year: 3,
      semester: 1,
      credits: 8,
    },
    {
      code: '19',
      name: 'Organización Empresarial y Modelos de Negocios',
      year: 3,
      semester: 1,
      credits: 6,
    },
    {
      code: '20',
      name: 'Modelado Orientado a Objetos',
      year: 3,
      semester: 1,
      credits: 6,
    },
    {
      code: '21',
      name: 'Cursos Optativos (90 horas)',
      year: 3,
      semester: 1,
      credits: 4,
    },
    {
      code: '22',
      name: 'Teoría de Autómatas, Lenguajes y Computación',
      year: 3,
      semester: 2,
      credits: 6,
    },
    {
      code: '23',
      name: 'Sistemas Operativos II',
      year: 3,
      semester: 2,
      credits: 6,
    },
    {
      code: '24',
      name: 'Métodos de Simulación',
      year: 3,
      semester: 2,
      credits: 6,
    },

    // Cuarto año
    {
      code: '25',
      name: 'Formulación, Evaluación de Proyectos Informáticos y Emprendedorismo Digital',
      year: 4,
      semester: 1,
      credits: 6,
    },
    {
      code: '26',
      name: 'Calidad de Software y Testing',
      year: 4,
      semester: 1,
      credits: 6,
    },
    {
      code: '27',
      name: 'Arquitectura de Redes',
      year: 4,
      semester: 1,
      credits: 8,
    },
    {
      code: '28',
      name: 'Ingeniería del Conocimiento',
      year: 4,
      semester: 2,
      credits: 6,
    },
    {
      code: '29',
      name: 'Arquitectura de Computadoras Paralelas',
      year: 4,
      semester: 2,
      credits: 6,
    },
    {
      code: '30',
      name: 'Sistemas de Información',
      year: 4,
      semester: 2,
      credits: 8,
    },
    {
      code: '31',
      name: 'Cursos Optativos (180 horas)',
      year: 4,
      semester: 2,
      credits: 6,
    },
    {
      code: '32',
      name: 'Seguridad y Auditoría Informática',
      year: 4,
      semester: 2,
      credits: 6,
    },

    // Quinto año
    {
      code: '33',
      name: 'Ingeniería de Software I',
      year: 5,
      semester: 1,
      credits: 8,
    },
    {
      code: '34',
      name: 'Sistemas Inteligentes',
      year: 5,
      semester: 1,
      credits: 6,
    },
    {
      code: '35',
      name: 'Legislación, Ética y Ejercicio Profesional',
      year: 5,
      semester: 2,
      credits: 4,
    },
    {
      code: '36',
      name: 'Ingeniería de Software II',
      year: 5,
      semester: 2,
      credits: 8,
    },
    {
      code: 'PPS',
      name: 'Práctica Profesional Supervisada',
      year: 5,
      semester: 2,
      credits: 8,
    },
    { code: 'TF', name: 'Trabajo Final', year: 5, semester: 2, credits: 16 },

    // Cursos optativos
    { code: '37', name: 'Compiladores', year: 6, semester: 0, credits: 6 },
    {
      code: '38',
      name: 'Aplicaciones de Bases de Datos I',
      year: 6,
      semester: 0,
      credits: 6,
    },
    {
      code: '39',
      name: 'Aplicaciones de Bases de Datos II',
      year: 6,
      semester: 0,
      credits: 6,
    },
    {
      code: '40',
      name: 'Introducción al Procesamiento Digital de Imágenes',
      year: 6,
      semester: 0,
      credits: 6,
    },
    {
      code: '41',
      name: 'Inteligencia Artificial',
      year: 6,
      semester: 0,
      credits: 6,
    },
    {
      code: '42',
      name: 'Recuperación Avanzada de la Información',
      year: 6,
      semester: 0,
      credits: 6,
    },
    {
      code: '43',
      name: 'Desarrollo y Arquitecturas Avanzadas de Software',
      year: 6,
      semester: 0,
      credits: 6,
    },
    {
      code: '44',
      name: 'Modelado y Proceso de Negocios',
      year: 6,
      semester: 0,
      credits: 6,
    },
    {
      code: '45',
      name: 'Taller de Formación Profesional',
      year: 6,
      semester: 0,
      credits: 4,
    },
    {
      code: '46',
      name: 'Taller de Metodología de la Investigación Científica',
      year: 6,
      semester: 0,
      credits: 4,
    },
    { code: '47', name: 'Gestión Ambiental', year: 6, semester: 0, credits: 4 },
  ];

  const subjects: Record<string, string> = {};

  for (const s of subjectsData) {
    const subject = await prisma.subject.create({
      data: {
        code: s.code,
        name: s.name,
        searchKey: normalizeSearchKey(s.name, s.code),
      },
    });
    subjects[s.code] = subject.id;

    await prisma.studyPlanSubject.create({
      data: {
        studyPlanId: plan.id,
        subjectId: subject.id,
        year: s.year,
        semester: s.semester,
        credits: s.credits,
      },
    });
  }

  console.log(
    `Creada carrera ${career.name} con ${subjectsData.length} materias`,
  );

  // Profesores de ejemplo
  const professors = [
    'Dr. Juan Pérez',
    'Ing. María González',
    'Lic. Carlos Rodríguez',
    'Prof. Ana Martínez',
    'Dr. Diego López',
  ];

  const createdProfessors = await Promise.all(
    professors.map((name) =>
      prisma.professor.create({
        data: {
          name,
          bio: `Docente de la carrera ${career.name}`,
        },
      }),
    ),
  );

  console.log(`Creados ${createdProfessors.length} profesores`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
