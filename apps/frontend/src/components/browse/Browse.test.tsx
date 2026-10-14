import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CareerPage, FacultyPage, UniversityCard, UniversityPage } from '@/lib/catalog-client';

const mocks = vi.hoisted(() => ({
  ubicacion: null as null | { facultyId: string; universityId: string },
  myCareers: [] as {
    careerId: string;
    status: string;
    declaredAt: string;
    career: { id: string; name: string; code: string };
    faculty: { id: string; shortName: string };
    university: { id: string; shortName: string };
  }[],
}));

vi.mock('@/stores/ubicacionStore', () => ({
  useUbicacionStore: (selector: (state: unknown) => unknown) =>
    selector({ ubicacion: mocks.ubicacion, myCareers: mocks.myCareers, ready: true }),
}));

import { CareerView } from './CareerView';
import { FacultyView } from './FacultyView';
import { UniversitiesView } from './UniversitiesView';
import { UniversityView } from './UniversityView';

const unju = {
  id: 'u-unju',
  name: 'Universidad Nacional de Jujuy',
  shortName: 'UNJU',
  slug: 'unju',
};
const unsa = {
  id: 'u-unsa',
  name: 'Universidad Nacional de Salta',
  shortName: 'UNSa',
  slug: 'unsa',
};
const uba = { id: 'u-uba', name: 'Universidad de Buenos Aires', shortName: 'UBA', slug: 'uba' };
const fi = { id: 'f-fi', name: 'Facultad de Ingeniería', shortName: 'FI', slug: 'fi' };

const universities: UniversityCard[] = [
  { ...uba, facultyCount: 13, materialCount: 0 },
  { ...unju, facultyCount: 7, materialCount: 120 },
  { ...unsa, facultyCount: 8, materialCount: 0 },
];

afterEach(cleanup);

beforeEach(() => {
  mocks.ubicacion = null;
  mocks.myCareers = [];
});

describe('UniversitiesView', () => {
  it('orders by name, links each universidad, shows real counts and no students', () => {
    render(<UniversitiesView universities={universities} />);
    const list = screen.getByRole('list', { name: 'Universidades' });
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => within(item).getByRole('heading').textContent)).toEqual([
      uba.name,
      unju.name,
      unsa.name,
    ]);
    expect(within(items[1]).getByRole('link', { name: /Ver facultades/ })).toHaveAttribute(
      'href',
      '/universidades/unju',
    );
    expect(items[1]).toHaveTextContent('7 facultades');
    expect(items[1]).toHaveTextContent('120 materiales');
    expect(screen.queryByText(/estudiantes|Próximamente|Avisame/i)).toBeNull();
    expect(screen.getByRole('link', { name: /¿No está la tuya\?/ })).toHaveAttribute(
      'href',
      '/universidades/pedir',
    );
  });

  it('puts the ubicación’s universidad first', () => {
    mocks.ubicacion = { facultyId: 'f-x', universityId: 'u-unsa' };
    render(<UniversitiesView universities={universities} />);
    const items = within(screen.getByRole('list', { name: 'Universidades' })).getAllByRole(
      'listitem',
    );
    expect(within(items[0]).getByRole('heading')).toHaveTextContent(unsa.name);
  });

  it('offers «Tu carrera» only to a student cursando one, the first declared', () => {
    mocks.myCareers = [
      {
        careerId: 'c-ind',
        status: 'ACTIVE',
        declaredAt: '2026-03-02T00:00:00.000Z',
        career: { id: 'c-ind', name: 'Ingeniería Industrial', code: 'IND' },
        faculty: { id: 'f-fi', shortName: 'FI' },
        university: { id: 'u-unju', shortName: 'UNJU' },
      },
      {
        careerId: 'c-inf',
        status: 'ACTIVE',
        declaredAt: '2026-03-01T00:00:00.000Z',
        career: { id: 'c-inf', name: 'Ingeniería Informática', code: 'II' },
        faculty: { id: 'f-fi', shortName: 'FI' },
        university: { id: 'u-unju', shortName: 'UNJU' },
      },
    ];
    render(<UniversitiesView universities={universities} />);
    expect(
      screen.getByRole('link', { name: /Tu carrera: Ingeniería Informática/ }),
    ).toHaveAttribute('href', '/universidades/unju/fi/ii');
    cleanup();

    mocks.myCareers = mocks.myCareers.map((c) => ({ ...c, status: 'COMPLETED' }));
    render(<UniversitiesView universities={universities} />);
    expect(screen.queryByRole('link', { name: /Tu carrera/ })).toBeNull();
  });
});

describe('UniversityView', () => {
  const data: UniversityPage = {
    university: unju,
    faculties: [
      { ...fi, careerCount: 6, materialCount: 120 },
      {
        id: 'f-fce',
        name: 'Facultad de Ciencias Económicas',
        shortName: 'FCE',
        slug: 'fce',
        careerCount: 0,
        materialCount: 0,
      },
    ],
  };

  it('lists facultades as returned, with counts, an empty one without a button, and the breadcrumb', () => {
    render(<UniversityView data={data} />);
    const items = within(screen.getByRole('list', { name: 'Facultades' })).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('6 carreras');
    expect(within(items[0]).getByRole('link', { name: /Ver carreras/ })).toHaveAttribute(
      'href',
      '/universidades/unju/fi',
    );
    expect(items[1]).toHaveTextContent('Todavía no cargamos sus carreras');
    expect(within(items[1]).queryByRole('button')).toBeNull();
    const trail = screen.getByRole('navigation', { name: /ruta/i });
    expect(within(trail).getByRole('link', { name: 'Universidades' })).toHaveAttribute(
      'href',
      '/universidades',
    );
    expect(within(trail).getByText(unju.shortName)).toHaveAttribute('aria-current', 'page');
  });
});

describe('FacultyView', () => {
  it('lists carreras with counts and says when none are loaded', () => {
    const data: FacultyPage = {
      university: unju,
      faculty: fi,
      careers: [
        {
          id: 'c-inf',
          name: 'Ingeniería Informática',
          code: 'II',
          slug: 'ii',
          subjectCount: 49,
          materialCount: 120,
        },
      ],
    };
    render(<FacultyView data={data} />);
    const item = within(screen.getByRole('list', { name: 'Carreras' })).getByRole('listitem');
    expect(item).toHaveTextContent('49 materias');
    expect(within(item).getByRole('link', { name: /Ver materias/ })).toHaveAttribute(
      'href',
      '/universidades/unju/fi/ii',
    );
    cleanup();

    render(<FacultyView data={{ ...data, careers: [] }} />);
    expect(screen.getByText('Todavía no cargamos sus carreras.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('link', { name: 'Pedí tu carrera' })).toHaveAttribute(
      'href',
      `/universidades/pedir?facultad=${data.faculty.id}`,
    );
  });
});

describe('CareerView', () => {
  const data: CareerPage = {
    university: unju,
    faculty: fi,
    career: {
      id: 'c-inf',
      name: 'Ingeniería Informática',
      code: 'II',
      slug: 'ii',
      planUrl: 'https://www.fi.unju.edu.ar/plan',
      years: 5,
      credits: 22,
      subjectCount: 3,
    },
    subjects: [
      {
        id: 's1',
        code: 'IP',
        name: 'Introducción a la Programación',
        year: 1,
        semester: 1,
        credits: 8,
        materialCount: 3,
      },
      {
        id: 's2',
        code: 'AL',
        name: 'Álgebra Lineal',
        year: 1,
        semester: 2,
        credits: 6,
        materialCount: 0,
      },
      {
        id: 's3',
        code: 'BD',
        name: 'Bases de Datos',
        year: 2,
        semester: 1,
        credits: 8,
        materialCount: 1,
      },
    ],
  };

  it('groups materias by año and cuatrimestre, linking with the carrera', () => {
    render(<CareerView data={data} />);
    const year1 = screen.getByRole('region', { name: '1.º año' });
    const first = within(year1).getByRole('list', { name: '1.º cuatrimestre' });
    expect(
      within(first).getByRole('link', { name: /Introducción a la Programación/ }),
    ).toHaveAttribute('href', '/materias/IP?carrera=ii');
    expect(within(year1).getByRole('list', { name: '2.º cuatrimestre' })).toHaveTextContent(
      'Álgebra Lineal',
    );
    expect(screen.getByRole('region', { name: '2.º año' })).toHaveTextContent('Bases de Datos');
    expect(screen.getByText('5 años')).toBeInTheDocument();
    expect(screen.getByText('22 créditos')).toBeInTheDocument();
  });

  it('lists materias anuales first in their año', () => {
    render(
      <CareerView
        data={{
          ...data,
          subjects: [
            ...data.subjects.slice(0, 1),
            {
              id: 's4',
              code: 'AN',
              name: 'Anatomía',
              year: 1,
              semester: 0,
              credits: null,
              materialCount: 0,
            },
            ...data.subjects.slice(1),
          ],
        }}
      />,
    );
    const year1 = screen.getByRole('region', { name: '1.º año' });
    const lists = within(year1).getAllByRole('list');
    expect(lists.map((list) => list.getAttribute('aria-labelledby'))).toEqual([
      'anio-1-anual',
      'anio-1-c1',
      'anio-1-c2',
    ]);
    expect(within(year1).getByRole('list', { name: 'Anual' })).toHaveTextContent('Anatomía');
  });

  it('links the official plan in a new tab and never names a plan', () => {
    render(<CareerView data={data} />);
    const plan = screen.getByRole('link', { name: /Plan oficial/ });
    expect(plan).toHaveAttribute('href', 'https://www.fi.unju.edu.ar/plan');
    expect(plan).toHaveAttribute('target', '_blank');
    expect(plan).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(screen.queryByText(/Plan 20|planes anteriores|vigente/i)).toBeNull();
  });

  it('says when no materias are loaded, and hides the plan link without one', () => {
    render(
      <CareerView data={{ ...data, career: { ...data.career, planUrl: null }, subjects: [] }} />,
    );
    expect(screen.getByText('Todavía no cargamos sus materias.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Plan oficial/ })).toBeNull();
  });

  it('shows the full trail up to the carrera', () => {
    render(<CareerView data={data} />);
    const trail = screen.getByRole('navigation', { name: /ruta/i });
    expect(within(trail).getByRole('link', { name: 'FI' })).toHaveAttribute(
      'href',
      '/universidades/unju/fi',
    );
    expect(within(trail).getByText('Ingeniería Informática')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
