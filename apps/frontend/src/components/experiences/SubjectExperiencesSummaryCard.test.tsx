import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getSubjectExperiencesSummary } from '@/lib/experiences-client';
import { summaryFixture } from '@/test/experiences';

import { SubjectExperiencesSummaryCard } from './SubjectExperiencesSummaryCard';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/api', () => ({ api: { post: vi.fn() } }));
vi.mock('@/lib/experiences-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/experiences-client')>()),
  getSubjectExperiencesSummary: vi.fn(),
}));

const fixture = {
  ...summaryFixture,
  subject: { code: 'ED-01', id: 'subject-1', name: 'Estructuras de Datos' },
};

describe('SubjectExperiencesSummaryCard', () => {
  beforeEach(() => {
    vi.mocked(getSubjectExperiencesSummary).mockReset();
    vi.mocked(getSubjectExperiencesSummary).mockResolvedValue(fixture);
  });

  afterEach(cleanup);

  it('shows the four shared figures and links to the experiences page', async () => {
    render(<SubjectExperiencesSummaryCard code="ED-01" />);

    expect(await screen.findByText('34')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('3,9/5')).toBeInTheDocument();
    expect(screen.getByText(/15 de 22/)).toBeInTheDocument();
    expect(screen.getByText(/aprobaron/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver experiencias/i })).toHaveAttribute(
      'href',
      '/experiencias/ED-01',
    );
  });

  it('carries the active carrera into the experiences page', async () => {
    render(<SubjectExperiencesSummaryCard careerId="c-inf" code="ED-01" />);

    expect(await screen.findByRole('link', { name: /ver experiencias/i })).toHaveAttribute(
      'href',
      '/experiencias/ED-01?carrera=c-inf',
    );
  });

  it('offers both writing actions as direct links', async () => {
    render(<SubjectExperiencesSummaryCard code="ED-01" />);
    await screen.findByRole('link', { name: /ver experiencias/i });

    expect(screen.getByRole('link', { name: 'Reseña de cursada' })).toHaveAttribute(
      'href',
      '/materias/ED-01/resenar',
    );
    expect(screen.getByRole('link', { name: 'Experiencia de final' })).toHaveAttribute(
      'href',
      '/materias/ED-01/final',
    );
  });

  it('fails with its own retry without blocking anything else', async () => {
    const user = userEvent.setup();
    vi.mocked(getSubjectExperiencesSummary)
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce(fixture);
    render(<SubjectExperiencesSummaryCard code="ED-01" />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(getSubjectExperiencesSummary).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('34')).toBeInTheDocument();
  });
});
