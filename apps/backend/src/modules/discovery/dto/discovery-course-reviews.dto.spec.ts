import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CommunityDifficulty, CourseAttempt } from '../../../generated/prisma';
import {
  DiscoveryCourseReviewsQueryDto,
  DiscoveryCourseReviewSort,
} from './discovery-course-reviews.dto';

async function errorsFor(input: Record<string, unknown>) {
  return validate(plainToInstance(DiscoveryCourseReviewsQueryDto, input));
}

describe('DiscoveryCourseReviewsQueryDto', () => {
  it('acepta filtros de URL independientes y transforma página, límite y año', async () => {
    const dto = plainToInstance(DiscoveryCourseReviewsQueryDto, {
      subjectId: '30000000-0000-4000-8000-000000000001',
      academicYear: '2026',
      professorId: '40000000-0000-4000-8000-000000000001',
      difficulty: CommunityDifficulty.ALTA,
      attempt: CourseAttempt.PRIMERA_RECURSADA,
      sort: DiscoveryCourseReviewSort.STARS_DESC,
      page: '2',
      limit: '20',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({
      academicYear: 2026,
      page: 2,
      limit: 20,
    });
  });

  it.each([
    { subjectId: 'materia-1' },
    { professorId: 'profesor-1' },
    { difficulty: 'IMPOSIBLE' },
    { attempt: 'RECURSADA_INFINITA' },
    { sort: 'POPULAR' },
    { page: 0 },
    { limit: 101 },
  ])('rechaza filtros no soportados: %j', async (input) => {
    await expect(errorsFor(input)).resolves.not.toHaveLength(0);
  });
});
