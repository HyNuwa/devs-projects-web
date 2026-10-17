import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  CommunityFactList,
  StarRecommendation,
  formatCommunityDate,
} from '@/components/experiences/facts';

// The retired card module is gone; the shared fact helpers it used now get
// their own coverage here (openspec academic-community/experiences).
describe('shared community facts', () => {
  afterEach(cleanup);

  it('clamps the star recommendation to the 0-5 accessible range', () => {
    render(<StarRecommendation value={7} />);
    expect(
      screen.getByRole('img', { name: 'Recomendación: 5 de 5 estrellas' }),
    ).toBeInTheDocument();

    cleanup();
    render(<StarRecommendation value={-2} />);
    expect(
      screen.getByRole('img', { name: 'Recomendación: 0 de 5 estrellas' }),
    ).toBeInTheDocument();
  });

  it('lists only known facts and stays quiet when all are missing', () => {
    render(
      <CommunityFactList
        facts={[
          ['Ciclo', '2025'],
          ['Franja', undefined],
          ['Resultado', 'Promoción'],
        ]}
      />,
    );
    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.getByText('Promoción')).toBeInTheDocument();
    expect(screen.queryByText('Franja')).not.toBeInTheDocument();

    cleanup();
    const { container } = render(
      <CommunityFactList
        facts={[
          ['Ciclo', undefined],
          ['Resultado', null],
        ]}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('formats a full date in es-AR and returns null for garbage input', () => {
    expect(formatCommunityDate('2026-08-31T12:00:00.000Z')).toBe('31 ago 2026');
    expect(formatCommunityDate('not-a-date')).toBeNull();
  });
});
