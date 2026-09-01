import { describe, expect, it } from 'vitest';

import {
  parseExamExperienceDiscoveryState,
  toExamExperienceDiscoveryHref,
} from './exam-experience-discovery-state';

const subjectId = '20000000-0000-4000-8000-000000000001';
const professorId = '20000000-0000-4000-8000-000000000002';

describe('exam-experience-discovery-state', () => {
  it('keeps supported final-experience filters and paging from the URL', () => {
    const state = parseExamExperienceDiscoveryState(
      new URLSearchParams(
        `subjectId=${subjectId}&year=2026&session=JULIO&professorId=${professorId}&format=ORAL&outcome=APROBADO&page=3&sort=GRADE_DESC`,
      ),
    );

    expect(state).toEqual({
      format: 'ORAL',
      outcome: 'APROBADO',
      page: 3,
      professorId,
      session: 'JULIO',
      subjectId,
      year: 2026,
    });
  });

  it('drops malformed values and cannot create a grade-sort URL', () => {
    expect(
      parseExamExperienceDiscoveryState(
        new URLSearchParams(
          'subjectId=nope&year=1800&session=UNKNOWN&format=VIDEO&outcome=UNKNOWN&page=0',
        ),
      ),
    ).toEqual({
      format: undefined,
      outcome: undefined,
      page: 1,
      professorId: undefined,
      session: undefined,
      subjectId: undefined,
      year: undefined,
    });

    expect(
      toExamExperienceDiscoveryHref({
        format: 'ORAL',
        outcome: 'APROBADO',
        page: 2,
        professorId: undefined,
        session: 'JULIO',
        subjectId,
        year: 2026,
      }),
    ).toBe(
      `/finales?subjectId=${subjectId}&year=2026&session=JULIO&format=ORAL&outcome=APROBADO&page=2`,
    );
  });
});
