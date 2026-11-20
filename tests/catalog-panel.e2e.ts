import { afterAll, describe, test } from '@e2e-dev/web';
import { credentials, expect } from 'e2e';

import {
  db,
  disconnect,
  seedFaculty,
  seedRejectedRequest,
  seedSubject,
} from './support/seed-e2e.ts';

type Faculty = Awaited<ReturnType<typeof seedFaculty>>;

test.setup('signs in as the admin', { sessions: ['admin'] }, async ({ app, screen, session, browser }) => {
  const admin = credentials.user('admin');
  await app.open('/auth/login');
  await screen.getByLabel('Email').fill(admin.username);
  await screen.getByLabel('Contraseña').fill(admin.password);
  await screen.getByRole('button', 'Iniciar Sesión').tap();
  await expect(browser).toHaveURL('/');
  await session.save('admin');
});

/** A universidad and facultad of their own for each test, written on the e2e database. */
const catalogTest = test.extend<{ faculty: Faculty }>({
  // eslint-disable-next-line no-empty-pattern
  faculty: async ({}, use) => {
    await use(await seedFaculty());
  },
});

describe('catálogo panel', { session: 'admin' }, () => {
  afterAll(async () => {
    await disconnect();
  });

  catalogTest('renames a materia', async ({ app, screen, faculty }) => {
    const name = `Algebra UI ${faculty.tag}`;
    const subject = await seedSubject(faculty.facultyId, name, `ui-${faculty.tag}-algebra`.toLowerCase());
    await app.open('/admin/catalogo');
    await screen.getByRole('button', faculty.universityLabel).tap();
    await screen.getByRole('button', `Editar ${faculty.facultyShortName}`).tap();
    const materias = screen.getByRole('region', 'Materias de la facultad');
    await materias.getByRole('button', `Editar ${name}`).tap();
    await materias.getByLabel('Nombre').waitFor();

    await materias.getByLabel('Nombre').fill(`Álgebra Lineal UI ${faculty.tag}`);
    await materias.getByRole('button', 'Guardar').tap();

    await expect(materias.getByText('Guardado.')).toBeVisible();
    await expect(materias.getByLabel('Nombre')).toHaveValue(`Álgebra Lineal UI ${faculty.tag}`);
    await expect
      .poll(async () => (await db().subject.findUnique({ where: { id: subject.id } }))?.name)
      .toBe(`Álgebra Lineal UI ${faculty.tag}`);
  });

  catalogTest('changes the code of a materia', async ({ app, screen, faculty }) => {
    const name = `Fisica UI ${faculty.tag}`;
    const code = `ui-${faculty.tag}-fisica`.toLowerCase();
    const subject = await seedSubject(faculty.facultyId, name, code);
    await app.open('/admin/catalogo');
    await screen.getByRole('button', faculty.universityLabel).tap();
    await screen.getByRole('button', `Editar ${faculty.facultyShortName}`).tap();
    const materias = screen.getByRole('region', 'Materias de la facultad');
    await materias.getByRole('button', `Editar ${name}`).tap();
    await materias.getByLabel('Código').waitFor();

    await materias.getByLabel('Código').fill(`${code}-1`);
    await materias.getByRole('button', 'Guardar').tap();

    await expect(materias.getByText('Guardado.')).toBeVisible();
    await expect
      .poll(async () => (await db().subject.findUnique({ where: { id: subject.id } }))?.code)
      .toBe(`${code}-1`);
  });

  catalogTest('deletes a materia', async ({ app, screen, faculty }) => {
    const name = `Quimica UI ${faculty.tag}`;
    const subject = await seedSubject(faculty.facultyId, name, `ui-${faculty.tag}-quimica`.toLowerCase());
    await app.open('/admin/catalogo');
    await screen.getByRole('button', faculty.universityLabel).tap();
    await screen.getByRole('button', `Editar ${faculty.facultyShortName}`).tap();
    const materias = screen.getByRole('region', 'Materias de la facultad');
    await materias.getByRole('button', `Editar ${name}`).tap();
    await materias.getByRole('button', 'Borrar').waitFor();

    await materias.getByRole('button', 'Borrar').tap();
    await materias.getByRole('button', 'Sí, borrar').tap();

    await expect(materias.getByText('La facultad todavía no tiene materias.')).toBeVisible();
    await expect.poll(async () => db().subject.findUnique({ where: { id: subject.id } })).toBeNull();
  });

  catalogTest(
    'deletes an empty facultad that has a resolved solicitud',
    async ({ app, screen, faculty }) => {
      await seedRejectedRequest(faculty.facultyId);
      await app.open('/admin/catalogo');
      await screen.getByRole('button', faculty.universityLabel).tap();
      await screen.getByRole('button', `Editar ${faculty.facultyShortName}`).tap();
      const editor = screen.getByRole('form', 'Editar facultad');
      await editor.getByRole('button', 'Borrar').waitFor();

      await editor.getByRole('button', 'Borrar').tap();
      await editor.getByRole('button', 'Sí, borrar').tap();

      await expect(
        screen.getByText('Elegí una universidad, facultad o carrera para editarla.'),
      ).toBeVisible();
      await expect
        .poll(async () => db().faculty.findUnique({ where: { id: faculty.facultyId } }))
        .toBeNull();
    },
  );
});
