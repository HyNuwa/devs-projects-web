import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ pathname: vi.fn() }));

vi.mock('next/navigation', () => ({ usePathname: mocks.pathname }));

import { BottomBar } from './BottomBar';

afterEach(cleanup);

beforeEach(() => {
  mocks.pathname.mockReturnValue('/');
});

const bar = () => screen.getByRole('navigation', { name: 'Secciones' });

describe('BottomBar', () => {
  it('lists Inicio · Materias · Subir · Experiencias in order', () => {
    render(<BottomBar />);

    expect(
      within(bar())
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['Inicio', '/'],
      ['Materias', '/materias'],
      ['Subir', '/materiales/nuevo'],
      ['Experiencias', '/resenas'],
    ]);
  });

  it('labels the upload button for assistive technology', () => {
    render(<BottomBar />);

    expect(within(bar()).getByRole('link', { name: 'Subir material' })).toBeInTheDocument();
  });

  it.each([
    ['/', 'Inicio'],
    ['/materiales/abc', 'Materias'],
    ['/finales', 'Experiencias'],
    ['/materiales/nuevo', 'Subir material'],
  ])('marks the current item on %s', (pathname, current) => {
    mocks.pathname.mockReturnValue(pathname);
    render(<BottomBar />);

    const currentLinks = within(bar())
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');
    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0]).toHaveAccessibleName(current);
  });

  it('marks nothing on routes outside the menu', () => {
    mocks.pathname.mockReturnValue('/buscar');
    render(<BottomBar />);

    expect(
      within(bar())
        .getAllByRole('link')
        .some((link) => link.hasAttribute('aria-current')),
    ).toBe(false);
  });
});
