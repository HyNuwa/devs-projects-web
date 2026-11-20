import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearExperienceDraft,
  draftValuesFor,
  EXPERIENCE_DRAFT_KEY,
  readExperienceDraft,
  saveExperienceDraft,
} from './experience-draft';

const empty = {
  academicYear: undefined as string | undefined,
  comment: '',
  isAnonymous: false,
  professorChoice: '',
  promotionGrade: null as number | null,
  topics: [] as string[],
};

const draft = {
  subjectCode: 'ED-01',
  subjectName: 'Estructuras de Datos',
  type: 'resenar' as const,
  values: {
    academicYear: '2026',
    comment: 'Un relato a medio escribir.',
    isAnonymous: true,
    professorChoice: 'professor-1',
    promotionGrade: 8,
    topics: ['Grafos'],
  },
};

describe('experience draft', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('keeps one draft in the «experience-draft» session slot', () => {
    saveExperienceDraft(draft);
    expect(JSON.parse(sessionStorage.getItem(EXPERIENCE_DRAFT_KEY) ?? 'null')).toEqual(draft);
    expect(readExperienceDraft()).toEqual(draft);

    saveExperienceDraft({ ...draft, type: 'final' });
    expect(readExperienceDraft()?.type).toBe('final');

    clearExperienceDraft();
    expect(readExperienceDraft()).toBeNull();
    expect(sessionStorage.getItem(EXPERIENCE_DRAFT_KEY)).toBeNull();
  });

  it('ignores a slot that is not a draft', () => {
    sessionStorage.setItem(EXPERIENCE_DRAFT_KEY, '{not json');
    expect(readExperienceDraft()).toBeNull();
    sessionStorage.setItem(EXPERIENCE_DRAFT_KEY, JSON.stringify({ type: 'otro', values: {} }));
    expect(readExperienceDraft()).toBeNull();
  });

  it('only loses the draft when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('denied');
    });

    expect(() => saveExperienceDraft(draft)).not.toThrow();
    expect(readExperienceDraft()).toBeNull();
    expect(() => clearExperienceDraft()).not.toThrow();
  });

  it('restores every same-type field for the same materia', () => {
    expect(
      draftValuesFor(draft, {
        empty,
        subjectBound: ['professorChoice'],
        subjectCode: 'ED-01',
        type: 'resenar',
      }),
    ).toEqual(draft.values);
  });

  it('drops the materia-bound fields when the materia changed', () => {
    expect(
      draftValuesFor(draft, {
        empty,
        subjectBound: ['professorChoice'],
        subjectCode: 'AM2',
        type: 'resenar',
      }),
    ).not.toHaveProperty('professorChoice');
  });

  it('shares only the narrative and the anonymity across types', () => {
    expect(
      draftValuesFor(draft, { empty, subjectBound: [], subjectCode: 'ED-01', type: 'final' }),
    ).toEqual({ comment: 'Un relato a medio escribir.', isAnonymous: true });
  });

  it('skips values whose shape does not fit the field', () => {
    expect(
      draftValuesFor(
        {
          ...draft,
          values: { comment: 42, isAnonymous: 'sí', topics: 'Grafos', promotionGrade: {} },
        },
        { empty, subjectBound: [], subjectCode: 'ED-01', type: 'resenar' },
      ),
    ).toEqual({});
  });
});
