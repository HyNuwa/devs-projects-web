import { Client } from 'pg';
import { buildMaterialRankingQuery } from '../../src/modules/materials/material-ranking.query';

const databaseUrl =
  process.env.MIGRATION_TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'Define MIGRATION_TEST_DATABASE_URL o DATABASE_URL para ejecutar la prueba de integración del ranking de materiales.',
  );
}

const schemaName = `material_ranking_${Date.now()}_${Math.random()
  .toString(16)
  .slice(2, 10)}`;
const subjectId = '20000000-0000-4000-8000-000000000001';
const professorId = '30000000-0000-4000-8000-000000000001';

type MaterialFixture = {
  academicYear: number | null;
  avgRating: number;
  createdAt: string;
  helpfulCount: number;
  id: string;
  professorId: string | null;
  ratingCount: number;
  searchKey: string;
  shift: string | null;
};

const fixtures: MaterialFixture[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    searchKey: 'arboles',
    academicYear: 2026,
    professorId,
    shift: 'TARDE',
    createdAt: '2026-08-02T00:00:00.000Z',
    helpfulCount: 0,
    avgRating: 1,
    ratingCount: 1,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    searchKey: 'arboles',
    academicYear: null,
    professorId: null,
    shift: null,
    createdAt: '2026-08-03T00:00:00.000Z',
    helpfulCount: 50,
    avgRating: 5,
    ratingCount: 99,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    searchKey: 'arboles avl',
    academicYear: 2026,
    professorId,
    shift: 'TARDE',
    createdAt: '2026-08-04T00:00:00.000Z',
    helpfulCount: 0,
    avgRating: 1,
    ratingCount: 1,
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    searchKey: 'arboles binarios',
    academicYear: 2026,
    professorId,
    shift: 'TARDE',
    createdAt: '2026-08-01T00:00:00.000Z',
    helpfulCount: 50,
    avgRating: 5,
    ratingCount: 99,
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    searchKey: 'guia de arboles',
    academicYear: 2026,
    professorId,
    shift: 'TARDE',
    createdAt: '2026-08-01T00:00:00.000Z',
    helpfulCount: 2,
    avgRating: 5,
    ratingCount: 99,
  },
  {
    id: '00000000-0000-4000-8000-000000000006',
    searchKey: 'practica de arboles',
    academicYear: 2026,
    professorId,
    shift: 'TARDE',
    createdAt: '2026-08-01T00:00:00.000Z',
    helpfulCount: 2,
    avgRating: 1,
    ratingCount: 1,
  },
];

function assertIds(actual: readonly string[], expected: readonly string[]) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Orden del ranking inesperado: ${JSON.stringify({ actual, expected })}`,
    );
  }
}

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query('BEGIN');
    await client.query(`CREATE SCHEMA "${schemaName}"`);
    await client.query(`SET LOCAL search_path TO "${schemaName}", public`);
    await client.query(`
      CREATE TABLE materials (
        id UUID PRIMARY KEY,
        search_key VARCHAR(200) NOT NULL,
        is_deleted BOOLEAN NOT NULL DEFAULT false,
        moderation_status TEXT NOT NULL,
        subject_id UUID NOT NULL,
        resource_type TEXT NOT NULL,
        academic_year SMALLINT,
        professor_id UUID,
        shift TEXT,
        created_at TIMESTAMP(3) NOT NULL,
        avg_rating NUMERIC(3, 2) NOT NULL,
        rating_count INTEGER NOT NULL
      );
      CREATE TABLE material_helpfulness (
        id UUID PRIMARY KEY,
        material_id UUID NOT NULL REFERENCES materials(id)
      );
    `);

    let helpfulnessId = 1;
    for (const fixture of fixtures) {
      await client.query(
        `
          INSERT INTO materials (
            id, search_key, moderation_status, subject_id, resource_type,
            academic_year, professor_id, shift, created_at, avg_rating, rating_count
          ) VALUES (
            $1, $2, 'APPROVED', $3, 'PARCIAL', $4, $5, $6, $7, $8, $9
          )
        `,
        [
          fixture.id,
          fixture.searchKey,
          subjectId,
          fixture.academicYear,
          fixture.professorId,
          fixture.shift,
          fixture.createdAt,
          fixture.avgRating,
          fixture.ratingCount,
        ],
      );

      for (let index = 0; index < fixture.helpfulCount; index += 1) {
        await client.query(
          'INSERT INTO material_helpfulness (id, material_id) VALUES ($1, $2)',
          [
            `10000000-0000-4000-8000-${String(helpfulnessId).padStart(12, '0')}`,
            fixture.id,
          ],
        );
        helpfulnessId += 1;
      }
    }

    for (const [page, expected] of [
      [1, [fixtures[0].id, fixtures[1].id]],
      [2, [fixtures[2].id, fixtures[3].id]],
      [3, [fixtures[4].id, fixtures[5].id]],
    ] as const) {
      const query = buildMaterialRankingQuery({
        limit: 2,
        offset: (page - 1) * 2,
        searchKey: 'arboles',
      });
      const result = await client.query<{ id: string }>(
        query.text,
        query.values,
      );

      assertIds(
        result.rows.map(({ id }) => id),
        expected,
      );
    }

    console.log(
      JSON.stringify({
        pagesVerified: 3,
        precedence: 'exact,prefix,contains,context,recency,helpfulness,id',
        starAggregates: 'presentation-only',
      }),
    );
  } finally {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  }
}

void main();
