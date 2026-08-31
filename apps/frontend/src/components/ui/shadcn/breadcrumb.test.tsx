import axe from 'axe-core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup } from '@testing-library/react';

import { Breadcrumb, deriveBreadcrumbItems } from './breadcrumb';

afterEach(cleanup);

describe('Breadcrumb', () => {
  it('derives stable ancestor URLs and human route labels', () => {
    expect(
      deriveBreadcrumbItems('/materiales/ingenieria-informatica/1/algoritmos?tipo=parcial', {
        '/materiales': 'Materiales',
        'ingenieria-informatica': 'Ingeniería Informática',
        '1': '1.er año',
        algoritmos: 'Algoritmos y Estructuras de Datos',
      }),
    ).toEqual([
      { href: '/materiales', label: 'Materiales' },
      { href: '/materiales/ingenieria-informatica', label: 'Ingeniería Informática' },
      { href: '/materiales/ingenieria-informatica/1', label: '1.er año' },
      {
        href: '/materiales/ingenieria-informatica/1/algoritmos',
        label: 'Algoritmos y Estructuras de Datos',
      },
    ]);
  });

  it('links ancestors, marks the current route, and remains keyboard operable', async () => {
    const user = userEvent.setup();
    const items = deriveBreadcrumbItems('/materiales/ingenieria-informatica/1/algoritmos', {
      '/materiales': 'Materiales',
      'ingenieria-informatica': 'Ingeniería Informática',
      '1': '1.er año',
      algoritmos: 'Algoritmos',
    });

    const { container } = render(<Breadcrumb items={items} />);
    const navigation = screen.getByRole('navigation', { name: 'Ruta de navegación' });
    const links = screen.getAllByRole('link');

    expect(links).toHaveLength(3);
    expect(links[1]).toHaveAttribute('href', '/materiales/ingenieria-informatica');
    expect(screen.getByText('Algoritmos')).toHaveAttribute('aria-current', 'page');

    await user.tab();
    expect(links[0]).toHaveFocus();

    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });

    expect(navigation).toHaveAttribute('data-slot', 'breadcrumb');
    expect(results.violations).toHaveLength(0);
  });

  it('keeps first and current locations usable in its compact narrow and zoom layout', () => {
    const { container } = render(
      <Breadcrumb
        items={[
          { href: '/materiales', label: 'Materiales' },
          { href: '/materiales/ingenieria-informatica', label: 'Ingeniería Informática' },
          { href: '/materiales/ingenieria-informatica/1', label: '1.er año' },
          {
            href: '/materiales/ingenieria-informatica/1/algoritmos',
            label: 'Algoritmos y Estructuras de Datos',
          },
        ]}
      />,
    );

    const navigation = screen.getByRole('navigation');
    const current = screen.getByText('Algoritmos y Estructuras de Datos');
    const intermediateLink = screen
      .getByRole('link', { name: 'Ingeniería Informática' })
      .closest('li');
    const compactIndicator = screen.getByText('…');

    expect(navigation).toHaveAttribute('aria-describedby');
    expect(current).toHaveClass('max-w-[min(70vw,22rem)]');
    expect(intermediateLink).toHaveClass('hidden', 'lg:flex');
    expect(compactIndicator.closest('li')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.sr-only.lg\\:hidden')).toHaveTextContent('Ruta abreviada');
  });
});
