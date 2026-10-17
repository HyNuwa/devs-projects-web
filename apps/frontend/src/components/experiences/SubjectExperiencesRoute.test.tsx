import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SubjectHub } from '@/types/subject';

const nav = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  permanentRedirect: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: nav.notFound,
  permanentRedirect: nav.permanentRedirect,
}));

const clientMocks = vi.hoisted(() => ({
  SubjectExperiencesPage: vi.fn(() => null),
}));

vi.mock('@/components/experiences/SubjectExperiencesPage', () => clientMocks);
vi.mock('@/lib/catalog-client', () => ({
  getSubjectPage: vi.fn(),
  redirectOldSubjectCode: vi.fn().mockResolvedValue(undefined),
}));

import { getSubjectPage, redirectOldSubjectCode } from '@/lib/catalog-client';
import Page from '@/app/(site)/experiencias/[codigo]/page';

const subject = { id: 's1', name: 'Análisis Matemático II' } as SubjectHub;

describe('experiencias/[codigo] route', () => {
  beforeEach(() => {
    nav.notFound.mockClear();
    nav.permanentRedirect.mockClear();
    vi.mocked(getSubjectPage).mockReset();
    vi.mocked(redirectOldSubjectCode).mockClear();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('renders the page for a known subject under the experiencias prefix', async () => {
    vi.mocked(getSubjectPage).mockResolvedValue(subject);
    const jsx = await Page({
      params: Promise.resolve({ codigo: '06' }),
      searchParams: Promise.resolve({ 'resenas.shift': 'TARDE' }),
    });
    const inner = (jsx as { props: { children: { type: unknown; props: unknown } } }).props
      .children;

    expect(redirectOldSubjectCode).toHaveBeenCalledWith(
      '06',
      'resenas.shift=TARDE',
      '/experiencias',
    );
    expect(getSubjectPage).toHaveBeenCalledWith('06', 'resenas.shift=TARDE', '/experiencias');
    expect(inner.type).toBe(clientMocks.SubjectExperiencesPage);
    expect(inner.props).toEqual(expect.objectContaining({ code: '06', subject }));
  });

  it('answers notFound for an unknown subject', async () => {
    vi.mocked(getSubjectPage).mockResolvedValue(null);
    await expect(
      Page({
        params: Promise.resolve({ codigo: 'xx' }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('lets an upstream failure reach the error boundary, never notFound', async () => {
    vi.mocked(getSubjectPage).mockRejectedValue(new Error('500'));
    await expect(
      Page({
        params: Promise.resolve({ codigo: '06' }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow('500');
    expect(nav.notFound).not.toHaveBeenCalled();
  });

  it('keeps duplicate search params in the query it forwards', async () => {
    vi.mocked(getSubjectPage).mockResolvedValue(subject);
    await Page({
      params: Promise.resolve({ codigo: '06' }),
      searchParams: Promise.resolve({
        'resenas.attempt': ['PRIMERA_CURSADA', 'PRIMERA_RECURSADA'],
      }),
    });
    expect(getSubjectPage).toHaveBeenCalledWith(
      '06',
      expect.stringContaining('resenas.attempt=PRIMERA_RECURSADA'),
      '/experiencias',
    );
    expect(getSubjectPage).toHaveBeenCalledWith(
      '06',
      expect.stringContaining('resenas.attempt=PRIMERA_CURSADA'),
      '/experiencias',
    );
  });
});
