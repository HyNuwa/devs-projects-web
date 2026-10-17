import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { permanentRedirect } = vi.hoisted(() => ({
  permanentRedirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));
vi.mock('next/navigation', () => ({ permanentRedirect }));

import {
  getCareerPage,
  getFacultyPage,
  getSubjectPage,
  redirectOldSubjectCode,
} from './catalog-client';

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

  it('remaps an old materia alias to the experiencias prefix, keeping the query', async () => {
    answer({ redirect: '/materias/unsa-fce-optica-1' });
    await expect(
      redirectOldSubjectCode('unsa-fce-optica', 'carrera=lf', '/experiencias'),
    ).rejects.toThrow('NEXT_REDIRECT');
    expect(permanentRedirect).toHaveBeenCalledWith('/experiencias/unsa-fce-optica-1?carrera=lf');
  });

  it('ignores an unrelated alias target rather than redirecting there', async () => {
    answer({ redirect: 'https://otro.example.com/materias/x' });
    await redirectOldSubjectCode('old-code', '', '/experiencias');
    expect(permanentRedirect).not.toHaveBeenCalled();
  });

  it.each(['/materias/', '/materias/a/b', '/materias/a?x=1', '/materias/a#f'])(
    'rejects the malformed alias %s',
    async (target) => {
      answer({ redirect: target });
      await expect(getSubjectPage('xx')).rejects.toThrow();
      expect(permanentRedirect).not.toHaveBeenCalled();
    },
  );

  it('reads the materia for the page, redirects its alias and notFounds a 404', async () => {
    answer({ name: 'Óptica', id: 's1' });
    const page = await getSubjectPage('opt-1', 'tab=finales', '/experiencias');
    expect(page).toMatchObject({ id: 's1' });
    expect(permanentRedirect).not.toHaveBeenCalled();

    answer({ redirect: '/materias/optica' });
    await expect(getSubjectPage('opt-1', 'tab=finales', '/experiencias')).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(permanentRedirect).toHaveBeenCalledWith('/experiencias/optica?tab=finales');

    answer({ message: 'Not found' }, 404);
    await expect(getSubjectPage('xx')).resolves.toBeNull();
    answer({ message: 'Down' }, 500);
    await expect(getSubjectPage('yy')).rejects.toThrow(/500/);

    answer({ redirect: 'https://otro.example.com/alias' });
    await expect(getSubjectPage('zz')).rejects.toThrow();
  });
});
