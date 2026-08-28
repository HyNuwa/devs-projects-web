import type { QueryResult, QueryResultRow } from 'pg';
import { normalizeSearchKey } from '../../src/common/search/search-key';

export interface BackfillQueryable {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: ReadonlyArray<unknown>,
  ): Promise<QueryResult<T>>;
}

interface SearchKeyUpdate {
  id: string;
  searchKey: string;
}

export interface SearchKeyBackfillPlan {
  subjects: {
    scanned: number;
    updates: SearchKeyUpdate[];
  };
  materials: {
    scanned: number;
    updates: SearchKeyUpdate[];
  };
}

export async function planSearchKeyBackfill(
  database: BackfillQueryable,
): Promise<SearchKeyBackfillPlan> {
  const [subjects, materials] = await Promise.all([
    database.query<{
      id: string;
      name: string;
      code: string | null;
      search_key: string;
    }>('SELECT "id", "name", "code", "search_key" FROM "subjects"'),
    database.query<{ id: string; title: string; search_key: string }>(
      'SELECT "id", "title", "search_key" FROM "materials"',
    ),
  ]);

  return {
    subjects: {
      scanned: subjects.rowCount ?? subjects.rows.length,
      updates: subjects.rows
        .map((subject) => ({
          id: subject.id,
          searchKey: normalizeSearchKey(subject.name, subject.code),
          currentSearchKey: subject.search_key,
        }))
        .filter(
          ({ searchKey, currentSearchKey }) => searchKey !== currentSearchKey,
        )
        .map(({ id, searchKey }) => ({ id, searchKey })),
    },
    materials: {
      scanned: materials.rowCount ?? materials.rows.length,
      updates: materials.rows
        .map((material) => ({
          id: material.id,
          searchKey: normalizeSearchKey(material.title),
          currentSearchKey: material.search_key,
        }))
        .filter(
          ({ searchKey, currentSearchKey }) => searchKey !== currentSearchKey,
        )
        .map(({ id, searchKey }) => ({ id, searchKey })),
    },
  };
}

export async function applySearchKeyBackfill(
  database: BackfillQueryable,
  plan: SearchKeyBackfillPlan,
): Promise<void> {
  for (const update of plan.subjects.updates) {
    await database.query(
      'UPDATE "subjects" SET "search_key" = $1 WHERE "id" = $2',
      [update.searchKey, update.id],
    );
  }

  for (const update of plan.materials.updates) {
    await database.query(
      'UPDATE "materials" SET "search_key" = $1 WHERE "id" = $2',
      [update.searchKey, update.id],
    );
  }
}

export function summarizeSearchKeyBackfill(plan: SearchKeyBackfillPlan) {
  return {
    subjectsScanned: plan.subjects.scanned,
    subjectUpdates: plan.subjects.updates.length,
    materialsScanned: plan.materials.scanned,
    materialUpdates: plan.materials.updates.length,
  };
}
