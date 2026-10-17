import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AuthorLink } from './AuthorLink';

afterEach(cleanup);

describe('AuthorLink (reputation/public-profile)', () => {
  it('links a named author to their perfil público', () => {
    render(<AuthorLink author={{ username: 'vale', displayName: 'Vale' }} />);

    expect(screen.getByRole('link', { name: 'Vale' })).toHaveAttribute('href', '/usuarios/vale');
  });

  it('never links an anonymous entry', () => {
    render(
      <>
        <AuthorLink author={{ username: 'Anónimo' }} />
        <AuthorLink author={null} />
      </>,
    );

    expect(screen.getAllByText('Anónimo')).toHaveLength(2);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
