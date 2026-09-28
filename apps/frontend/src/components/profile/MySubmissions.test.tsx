import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(() => new Promise(() => {})) },
}));

import { MySubmissions } from './MySubmissions';

afterEach(cleanup);

describe('MySubmissions', () => {
  it('is the «Mis envíos» section the account menu links to', () => {
    render(<MySubmissions />);

    const heading = screen.getByRole('heading', { level: 2, name: 'Mis envíos' });
    expect(heading.closest('section')).toHaveAttribute('id', 'mis-envios');
  });
});
