import { describe, expect, it } from 'vitest';

import {
  examSharedContext,
  relatedExamWhere,
  relatedReviewWhere,
  reviewSharedContext,
} from './experiences-related';

describe('experiences-related context keys', () => {
  it('names professor and franja when a reseña declares both', () => {
    const context = reviewSharedContext({
      professorId: 'prof-1',
      professor: { id: 'prof-1', name: 'Laura Quiroga' },
      professorName: null,
      shift: 'TARDE',
    });
    expect(context).toEqual({
      professor: { id: 'prof-1', name: 'Laura Quiroga' },
      shift: 'TARDE',
    });
  });

  it('names only the manual professor name when there is no franja', () => {
    const context = reviewSharedContext({
      professorId: null,
      professor: null,
      professorName: '  A. Gómez  ',
      shift: 'NO_INDICO',
    });
    expect(context).toEqual({ professor: { name: 'A. Gómez' } });
    expect(context).not.toHaveProperty('shift');
  });

  it('names only the franja when there is no professor', () => {
    const context = reviewSharedContext({
      professorId: null,
      professor: null,
      professorName: null,
      shift: 'MANANA',
    });
    expect(context).toEqual({ shift: 'MANANA' });
    expect(context).not.toHaveProperty('professor');
  });

  it('has no context when the reseña declared neither fact', () => {
    expect(
      reviewSharedContext({
        professorId: null,
        professor: null,
        professorName: '   ',
        shift: 'NO_INDICO',
      }),
    ).toBeNull();
  });

  it('builds the reseña where only with the declared facts', () => {
    expect(
      relatedReviewWhere({
        professorId: 'prof-1',
        professorName: 'A. Gómez',
        shift: 'TARDE',
      }),
    ).toEqual({ professorId: 'prof-1', shift: 'TARDE' });

    expect(
      relatedReviewWhere({
        professorId: null,
        professorName: ' A. Gómez ',
        shift: 'NO_INDICO',
      }),
    ).toEqual({
      professorName: { equals: 'A. Gómez', mode: 'insensitive' },
    });

    expect(
      relatedReviewWhere({
        professorId: null,
        professorName: null,
        shift: 'NO_INDICO',
      }),
    ).toBeNull();
  });

  it('always keeps the formato and adds the período only when remembered', () => {
    expect(
      examSharedContext({ session: 'NO_RECUERDO', format: 'ESCRITO' }),
    ).toEqual({ format: 'ESCRITO' });
    expect(examSharedContext({ session: 'JULIO', format: 'ORAL' })).toEqual({
      session: 'JULIO',
      format: 'ORAL',
    });

    expect(
      relatedExamWhere({ session: 'NO_RECUERDO', format: 'ESCRITO' }),
    ).toEqual({ format: 'ESCRITO' });
    expect(relatedExamWhere({ session: 'DICIEMBRE', format: 'MIXTO' })).toEqual(
      { session: 'DICIEMBRE', format: 'MIXTO' },
    );
  });
});
