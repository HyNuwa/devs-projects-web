import { MaterialResourceType } from '../../generated/prisma';
import { MaterialSort } from './dto/materials-query.dto';
import { buildMaterialRankingQuery } from './material-ranking.query';

describe('buildMaterialRankingQuery', () => {
  it('uses parameterized relevance, context, recency, helpfulness, and id ordering', () => {
    const query = buildMaterialRankingQuery({
      academicYear: 2026,
      limit: 10,
      offset: 20,
      professorId: 'prof-1',
      resourceType: MaterialResourceType.PARCIAL,
      searchKey: 'arboles',
      subjectId: 'subject-1',
    });

    expect(query.text).toContain('CASE');
    expect(query.text).toContain('m.search_key = $');
    expect(query.text).toContain('m.search_key LIKE $');
    expect(query.text).toContain('m.academic_year IS NOT NULL');
    expect(query.text).toContain('m.created_at DESC');
    expect(query.text).toContain('helpfulness.helpful_count');
    expect(query.text).toContain('m.id ASC');
    expect(query.text).not.toContain('avg_rating');
    expect(query.text).not.toContain('rating_count');
    expect(query.values).toEqual(
      expect.arrayContaining([
        '%arboles%',
        'subject-1',
        MaterialResourceType.PARCIAL,
        2026,
        'prof-1',
        'arboles',
        'arboles%',
        20,
        10,
      ]),
    );
  });

  it('escapes LIKE wildcards in the parameter rather than interpolating input', () => {
    const query = buildMaterialRankingQuery({
      limit: 10,
      offset: 0,
      searchKey: '100%_\\',
    });

    expect(query.text).toContain("ESCAPE '\\'");
    expect(query.values).toEqual(
      expect.arrayContaining(['%100\\%\\_\\\\%', '100\\%\\_\\\\%']),
    );
    expect(query.text).not.toContain('100%_');
  });

  it('uses only the explicit recency ordering when the user requests it', () => {
    const query = buildMaterialRankingQuery({
      limit: 5,
      offset: 10,
      searchKey: 'arboles',
      sort: MaterialSort.RECENT,
    });

    expect(query.text).toContain('ORDER BY m.created_at DESC, m.id ASC');
    expect(query.text).not.toContain('helpfulness.helpful_count, 0) DESC');
  });
});
