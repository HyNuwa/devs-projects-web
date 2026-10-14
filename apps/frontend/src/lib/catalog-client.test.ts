import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { permanentRedirect } = vi.hoisted(() => ({
  permanentRedirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));
vi.mock('next/navigation', () => ({ permanentRedirect }));

import { getCareerPage, getFacultyPage, redirectOldSubjectCode } from './catalog-client';

const answer = (body: unknown, status = 200) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    }),
  );

/** Old slugs keep working (openspec academic-structure/catalog-editing). */
describe('catalog-client redirects', () => {
  beforeEach(() => {
    permanentRedirect.mockClear();
  });
  afterEach(() => vi.restoreAllMocks());

  it('redirects permanently when a browsing segment is an old slug', async () => {
    answer({ redirect: '/universidades/unsa/fce' });
    await expect(getFacultyPage('unsa', 'fcex')).rejects.toThrow('NEXT_REDIRECT');
    expect(permanentRedirect).toHaveBeenCalledWith('/universidades/unsa/fce');
  });

  it('returns the page when the slug is current', async () => {
    answer({ university: {}, faculty: {}, career: { name: 'Física' }, subjects: [] });
    const page = await getCareerPage('unsa', 'fce', 'lf');
    expect(page?.career.name).toBe('Física');
    expect(permanentRedirect).not.toHaveBeenCalled();
  });

  it('redirects an old materia code, keeping the query', async () => {
    answer({ redirect: '/materias/unsa-fce-optica-1' });
    await expect(redirectOldSubjectCode('unsa-fce-optica', 'carrera=lf')).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(permanentRedirect).toHaveBeenCalledWith('/materias/unsa-fce-optica-1?carrera=lf');
  });

  it('leaves a current materia, or a failed check, to the page', async () => {
    answer({ redirect: null });
    await redirectOldSubjectCode('IP', '');
    answer({ message: 'Error' }, 500);
    await redirectOldSubjectCode('XX', '');
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    await redirectOldSubjectCode('YY', '');
    expect(permanentRedirect).not.toHaveBeenCalled();
  });
});
