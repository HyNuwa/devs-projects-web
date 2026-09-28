import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ segments: vi.fn() }));

vi.mock('next/navigation', () => ({ useSelectedLayoutSegments: mocks.segments }));

import { AccessHeader } from './AccessHeader';
import { SiteFooter } from './SiteFooter';

afterEach(cleanup);

beforeEach(() => {
  mocks.segments.mockReturnValue(['auth', 'login']);
});

describe('SiteFooter', () => {
  it('links only to the primary destinations and the upload form', () => {
    render(<SiteFooter />);

    const footer = screen.getByRole('contentinfo');
    const links = within(footer).getAllByRole('link');

    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['DevsProject', '/'],
      ['Inicio', '/'],
      ['Materias', '/materias'],
      ['Experiencias', '/resenas'],
      ['Subir material', '/materiales/nuevo'],
    ]);
    expect(within(footer).queryByRole('link', { name: /Foro/ })).not.toBeInTheDocument();
  });

  it('shows the copyright year', () => {
    render(<SiteFooter />);

    expect(screen.getByRole('contentinfo')).toHaveTextContent(`© ${new Date().getFullYear()}`);
  });
});

describe('AccessHeader', () => {
  it('offers account creation on the sign-in screen', () => {
    render(<AccessHeader />);

    expect(screen.getByRole('link', { name: 'DevsProject, inicio' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute(
      'href',
      '/auth/register',
    );
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('offers sign-in on the registration screen', () => {
    mocks.segments.mockReturnValue(['auth', 'register']);
    render(<AccessHeader />);

    expect(screen.getByRole('link', { name: 'Ingresar' })).toHaveAttribute('href', '/auth/login');
    expect(screen.queryByRole('link', { name: 'Crear cuenta' })).not.toBeInTheDocument();
  });
});
