import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSelectedLayoutSegments: () => ['auth', 'login'],
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ logout: vi.fn(), user: null }),
}));

import AccessLayout from '@/app/(auth)/layout';
import FocusLayout from '@/app/(focus)/layout';
import SiteLayout from '@/app/(site)/layout';

import { SkipLink } from './SkipLink';

afterEach(cleanup);

const page = <p>Contenido</p>;

describe('shell layouts', () => {
  it('frames regular pages with the header, main content, footer and bottom bar', () => {
    render(<SiteLayout>{page}</SiteLayout>);

    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Contenido');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Secciones' })).toBeInTheDocument();
  });

  it('keeps the header and footer on focus screens but drops the bottom bar', () => {
    render(<FocusLayout>{page}</FocusLayout>);

    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Contenido');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Secciones' })).not.toBeInTheDocument();
  });

  it('gives access screens only the reduced header', () => {
    render(<AccessLayout>{page}</AccessLayout>);

    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Contenido');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });

  it.each([
    ['site', SiteLayout],
    ['focus', FocusLayout],
    ['access', AccessLayout],
  ])('puts the skip link first and targets the %s main region', async (_name, Layout) => {
    const user = userEvent.setup();
    render(
      <>
        <SkipLink />
        <Layout>{page}</Layout>
      </>,
    );

    await user.tab();

    const skip = screen.getByRole('link', { name: 'Saltar al contenido principal' });
    expect(skip).toHaveFocus();
    expect(skip).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
  });
});
