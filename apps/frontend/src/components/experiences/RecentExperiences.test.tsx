import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

import type { ExperiencesOverview } from '@/lib/experiences-client';

import { RecentExperiences } from './RecentExperiences';

vi.mock('@/lib/api', () => ({ api: { post: vi.fn() } }));

const now = new Date('2026-09-15T12:00:00.000Z');
const empty: ExperiencesOverview['recent'] = [];

describe('RecentExperiences empty fallback', () => {
  afterEach(cleanup);

  it.each(['reviews', 'exams', null] as const)('expands in place for kind %s', async (kind) => {
    const onShowAllFaculties = vi.fn();
    render(
      <RecentExperiences
        facultyLabel="Facultad de Ingeniería"
        now={now}
        onShowAllFaculties={onShowAllFaculties}
        overviewKind={kind}
        recent={empty}
      />,
    );

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Ver las de todas las facultades' }));
    expect(onShowAllFaculties).toHaveBeenCalledOnce();
  });

  it('does not offer to expand an already global empty result', () => {
    render(
      <RecentExperiences
        facultyLabel={null}
        now={now}
        onShowAllFaculties={vi.fn()}
        overviewKind={null}
        recent={empty}
      />,
    );

    expect(
      screen.getByText('Todavía no hay experiencias en todas las facultades'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Ver las de todas las facultades' }),
    ).not.toBeInTheDocument();
  });
});
