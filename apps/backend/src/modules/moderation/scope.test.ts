import { describe, expect, it, vi } from 'vitest';

import {
  accountWhere,
  appealWhere,
  caseWhere,
  correctionWhere,
  NOTHING,
  scopeOf,
} from './scope';

const fi = 'f1';
const fce = 'f2';

describe('scopeOf', () => {
  it('covers every facultad for ADMIN and SUPERADMIN without reading assignments', async () => {
    const findMany = vi.fn();
    const db = { moderatorScope: { findMany } };
    expect(await scopeOf(db, { id: 'a', role: 'ADMIN' })).toBe('ALL');
    expect(await scopeOf(db, { id: 's', role: 'SUPERADMIN' })).toBe('ALL');
    expect(findMany).not.toHaveBeenCalled();
  });

  it('gives a MODERATOR their assigned facultades, possibly none', async () => {
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([{ facultyId: fi }, { facultyId: fce }])
      .mockResolvedValueOnce([]);
    const db = { moderatorScope: { findMany } };
    expect(await scopeOf(db, { id: 'm', role: 'MODERATOR' })).toEqual([
      fi,
      fce,
    ]);
    expect(findMany).toHaveBeenCalledWith({
      where: { userId: 'm' },
      select: { facultyId: true },
    });
    expect(await scopeOf(db, { id: 'n', role: 'MODERATOR' })).toEqual([]);
  });

  it('gives anyone else no facultades', async () => {
    const db = { moderatorScope: { findMany: vi.fn() } };
    expect(await scopeOf(db, { id: 'u', role: 'USER' })).toEqual([]);
  });
});

describe('where builders', () => {
  it('add no restriction for ALL', async () => {
    expect(caseWhere('ALL')).toEqual({});
    expect(correctionWhere('ALL')).toEqual({});
    expect(appealWhere('ALL', {})).toEqual({});
    expect(
      await accountWhere({ moderationCase: { findMany: vi.fn() } }, 'ALL'),
    ).toEqual({});
  });

  it('match nothing for an empty list', async () => {
    expect(caseWhere([])).toEqual(NOTHING);
    expect(correctionWhere([])).toEqual(NOTHING);
    expect(appealWhere([], NOTHING)).toEqual(NOTHING);
    const findMany = vi.fn();
    expect(await accountWhere({ moderationCase: { findMany } }, [])).toEqual(
      NOTHING,
    );
    expect(findMany).not.toHaveBeenCalled();
  });

  it('limit casos to the facultad of their content materia', () => {
    const subject = { subject: { facultyId: { in: [fi] } } };
    expect(caseWhere([fi])).toEqual({
      OR: [
        { material: { is: subject } },
        { courseReview: { is: subject } },
        { examExperience: { is: subject } },
      ],
    });
  });

  it('limit corrections to the facultad of their material', () => {
    expect(correctionWhere([fi])).toEqual({
      material: { subject: { facultyId: { in: [fi] } } },
    });
  });

  it('limit appeals by their caso, or by the sanctioned account when there is no caso', () => {
    const account = { id: { in: ['visible'] } };
    expect(appealWhere([fi], account)).toEqual({
      OR: [
        { case: { is: caseWhere([fi]) } },
        {
          caseId: null,
          sanction: {
            is: {
              OR: [
                { case: { is: caseWhere([fi]) } },
                { caseId: null, user: { is: account } },
              ],
            },
          },
        },
      ],
    });
  });

  it('limit accounts to a carrera in the facultades or a signed caso there, never an anonymous one', async () => {
    const findMany = vi.fn().mockResolvedValue([{ targetAuthorId: 'author' }]);
    const where = await accountWhere({ moderationCase: { findMany } }, [fi]);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          caseWhere([fi]),
          expect.objectContaining({ OR: expect.any(Array) }),
        ],
        targetAuthorId: { not: null },
      },
      select: { targetAuthorId: true },
      distinct: ['targetAuthorId'],
    });
    const signed = findMany.mock.calls[0][0].where.AND[1];
    expect(signed.OR).toContainEqual({
      courseReview: { is: { isAnonymous: false } },
    });
    expect(signed.OR).toContainEqual({
      examExperience: { is: { isAnonymous: false } },
    });
    expect(where).toEqual({
      OR: [
        {
          studyPlans: {
            some: { studyPlan: { career: { facultyId: { in: [fi] } } } },
          },
        },
        { id: { in: ['author'] } },
      ],
    });
  });
});
