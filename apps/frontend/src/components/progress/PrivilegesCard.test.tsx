import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getMyPrivileges, type MyPrivileges } from '@/lib/trust-client';

import { PrivilegesCard } from './PrivilegesCard';

vi.mock('@/lib/trust-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/trust-client')>()),
  getMyPrivileges: vi.fn(),
}));

const base: MyPrivileges = {
  suggestCorrections: { active: true, missing: [] },
  priorityReports: {
    active: false,
    missing: [{ kind: 'PRECISION', needed: 70, current: 56 }],
  },
  standing: { good: true, until: null, permanent: false },
};

afterEach(cleanup);

describe('PrivilegesCard («Tu progreso»)', () => {
  beforeEach(() => {
    vi.mocked(getMyPrivileges).mockReset().mockResolvedValue(base);
  });

  it('shows each privilege as active or with what is missing', async () => {
    render(<PrivilegesCard />);

    const card = await screen.findByRole('region', { name: 'Privilegios de confianza' });
    const items = within(card).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Sugerir correcciones');
    expect(items[0]).toHaveTextContent('Activo');
    expect(items[1]).toHaveTextContent('Reportes prioritarios');
    expect(items[1]).toHaveTextContent('Tu precisión es 56 %; hacen falta 70 %.');
  });

  it('explains missing niveles, reportes and the date good standing comes back', async () => {
    vi.mocked(getMyPrivileges).mockResolvedValue({
      suggestCorrections: {
        active: false,
        missing: [
          { kind: 'LEVEL', needed: 3, current: 2 },
          { kind: 'STANDING', until: '2027-01-08T12:00:00.000Z' },
        ],
      },
      priorityReports: {
        active: false,
        missing: [{ kind: 'CONFIRMED_REPORTS', needed: 5, current: 3 }],
      },
      standing: { good: false, until: '2027-01-08T12:00:00.000Z', permanent: false },
    });
    render(<PrivilegesCard />);

    const items = await screen.findAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Se desbloquea en el Nv. 3.');
    expect(items[0]).toHaveTextContent(
      'Vuelve el 8 de enero de 2027, a 90 días de tu última sanción o retiro.',
    );
    expect(items[1]).toHaveTextContent('Te faltan 2 reportes confirmados en los últimos 90 días.');
  });

  it('says privileges never come back after a permanent suspensión', async () => {
    vi.mocked(getMyPrivileges).mockResolvedValue({
      ...base,
      suggestCorrections: { active: false, missing: [{ kind: 'STANDING', until: null }] },
      standing: { good: false, until: null, permanent: true },
    });
    render(<PrivilegesCard />);

    expect((await screen.findAllByRole('listitem'))[0]).toHaveTextContent(
      'No vuelven: la suspensión es permanente.',
    );
  });

  it('never mentions moderating', async () => {
    render(<PrivilegesCard />);

    const card = await screen.findByRole('region', { name: 'Privilegios de confianza' });
    expect(card).not.toHaveTextContent(/moder/i);
  });
});
