import { describe, expect, it } from 'vitest';

import {
  parseCourseReviewDiscoveryState,
  toCourseReviewDiscoveryHref,
} from './course-review-discovery-state';

const subjectId = '20000000-0000-4000-8000-000000000001';
const professorId = '20000000-0000-4000-8000-000000000002';

describe('course-review-discovery-state', () => {
  it('keeps only supported URL values and defaults malformed values safely', () => {
    const state = parseCourseReviewDiscoveryState(
      new URLSearchParams(
        `subjectId=${subjectId}&professorId=${professorId}&academicYear=2026&difficulty=ALTA&attempt=PRIMERA_RECURSADA&sort=STARS_DESC&page=3&unknown=value`,
      ),
    );

    expect(state).toEqual({
      academicYear: 2026,
      attempt: 'PRIMERA_RECURSADA',
      difficulty: 'ALTA',
      page: 3,
      professorId,
      sort: 'STARS_DESC',
      subjectId,
    });
  });

  it('drops malformed state and creates a compact shareable URL', () => {
    expect(
      parseCourseReviewDiscoveryState(
        new URLSearchParams(
          'subjectId=nope&academicYear=1800&difficulty=UNKNOWN&sort=RANDOM&page=0',
        ),
      ),
    ).toEqual({
      academicYear: undefined,
      attempt: undefined,
      difficulty: undefined,
      page: 1,
      professorId: undefined,
      sort: 'RECENT',
      subjectId: undefined,
    });

    expect(
      toCourseReviewDiscoveryHref({
        academicYear: 2026,
        attempt: undefined,
        difficulty: 'ALTA',
        page: 2,
        professorId: undefined,
        sort: 'STARS_DESC',
        subjectId,
      }),
    ).toBe(
      `/resenas?subjectId=${subjectId}&academicYear=2026&difficulty=ALTA&sort=STARS_DESC&page=2`,
    );
  });
});
