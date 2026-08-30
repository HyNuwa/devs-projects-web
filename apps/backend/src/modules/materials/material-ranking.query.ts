import { MaterialResourceType, Prisma } from '../../generated/prisma';
import { MaterialSort } from './dto/materials-query.dto';

export type MaterialRankingQueryInput = {
  academicYear?: number;
  limit: number;
  offset: number;
  professorId?: string;
  resourceType?: MaterialResourceType;
  searchKey?: string;
  sort?: MaterialSort;
  subjectId?: string;
};

export type RankedMaterialId = { id: string };

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

export function buildMaterialRankingQuery(
  input: MaterialRankingQueryInput,
): Prisma.Sql {
  const filters: Prisma.Sql[] = [
    Prisma.sql`m.is_deleted = false`,
    Prisma.sql`m.moderation_status = 'APPROVED'`,
  ];

  const escapedSearchKey = input.searchKey
    ? escapeLikePattern(input.searchKey)
    : undefined;

  if (escapedSearchKey) {
    filters.push(
      Prisma.sql`m.search_key LIKE ${`%${escapedSearchKey}%`} ESCAPE '\\'`,
    );
  }
  if (input.subjectId) {
    filters.push(Prisma.sql`m.subject_id = ${input.subjectId}`);
  }
  if (input.resourceType) {
    filters.push(
      Prisma.sql`m.resource_type = ${input.resourceType}::"MaterialResourceType"`,
    );
  }
  if (input.academicYear) {
    filters.push(Prisma.sql`m.academic_year = ${input.academicYear}`);
  }
  if (input.professorId) {
    filters.push(Prisma.sql`m.professor_id = ${input.professorId}`);
  }

  const ordering =
    input.sort === MaterialSort.RECENT
      ? Prisma.sql`m.created_at DESC, m.id ASC`
      : buildRelevanceOrdering(input.searchKey, escapedSearchKey);

  return Prisma.sql`
    SELECT m.id
    FROM materials AS m
    LEFT JOIN (
      SELECT material_id, COUNT(*)::int AS helpful_count
      FROM material_helpfulness
      GROUP BY material_id
    ) AS helpfulness ON helpfulness.material_id = m.id
    WHERE ${Prisma.join(filters, ' AND ')}
    ORDER BY ${ordering}
    OFFSET ${input.offset}
    LIMIT ${input.limit}
  `;
}

function buildRelevanceOrdering(
  searchKey: string | undefined,
  escapedSearchKey: string | undefined,
): Prisma.Sql {
  const textualRelevance =
    searchKey && escapedSearchKey
      ? Prisma.sql`
          CASE
            WHEN m.search_key = ${searchKey} THEN 0
            WHEN m.search_key LIKE ${`${escapedSearchKey}%`} ESCAPE '\\' THEN 1
            ELSE 2
          END
        `
      : Prisma.sql`0`;

  return Prisma.sql`
    ${textualRelevance} ASC,
    (
      (m.academic_year IS NOT NULL)::int +
      (m.professor_id IS NOT NULL)::int +
      (m.shift IS NOT NULL)::int
    ) DESC,
    m.created_at DESC,
    COALESCE(helpfulness.helpful_count, 0) DESC,
    m.id ASC
  `;
}
