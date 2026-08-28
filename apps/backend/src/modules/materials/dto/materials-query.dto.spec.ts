import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MaterialResourceType } from '../../../generated/prisma';
import {
  MAX_ACADEMIC_YEAR,
  MIN_ACADEMIC_YEAR,
} from '../../../common/validation/academic-year';
import { MaterialSort, MaterialsQueryDto } from './materials-query.dto';

async function errorsFor(input: Record<string, unknown>) {
  return validate(plainToInstance(MaterialsQueryDto, input));
}

describe('MaterialsQueryDto', () => {
  it('acepta filtros independientes y transforma los valores de URL', async () => {
    const dto = plainToInstance(MaterialsQueryDto, {
      subjectId: '30000000-0000-4000-8000-000000000001',
      search: '  Álgebra  ',
      resourceType: MaterialResourceType.PARCIAL,
      academicYear: '2026',
      professorId: '40000000-0000-4000-8000-000000000001',
      sort: MaterialSort.RELEVANCE,
      page: '2',
      limit: '20',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({
      search: 'Álgebra',
      academicYear: 2026,
      page: 2,
      limit: 20,
    });
  });

  it.each([
    { resourceType: 'VIDEO' },
    { academicYear: MIN_ACADEMIC_YEAR - 1 },
    { academicYear: MAX_ACADEMIC_YEAR + 1 },
    { professorId: 'profesor-1' },
    { sort: 'POPULAR' },
    { page: 0 },
    { limit: 101 },
  ])('rechaza filtros no soportados: %j', async (input) => {
    await expect(errorsFor(input)).resolves.not.toHaveLength(0);
  });
});
