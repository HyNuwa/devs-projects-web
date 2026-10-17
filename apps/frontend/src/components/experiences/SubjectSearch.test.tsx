import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getGroupedSuggestions } from '@/lib/discovery-client';
import type { DiscoverySubjectSuggestion, GroupedDiscoverySuggestions } from '@/types/discovery';

import { SubjectSearch } from './SubjectSearch';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
}));

vi.mock('@/lib/discovery-client', () => ({ getGroupedSuggestions: vi.fn() }));

const facultyId = '20000000-0000-4000-8000-0000000000f1';
const otherFacultyId = '20000000-0000-4000-8000-0000000000f2';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

function suggestions(
  subjects: GroupedDiscoverySuggestions['subjects'],
): GroupedDiscoverySuggestions {
  return { materials: [], subjects };
}

function subject(overrides: Partial<DiscoverySubjectSuggestion> = {}): DiscoverySubjectSuggestion {
  return {
    code: '06',
    faculty: {
      id: facultyId,
      name: 'Facultad',
      shortName: 'FI',
      university: { id: 'uni-1', name: 'Universidad', shortName: 'UNJu' },
    },
    id: 's1',
    kind: 'SUBJECT',
    name: 'Análisis Matemático II',
    ...overrides,
  };
}

const analisis = subject();
const fisica = subject({ code: '07', id: 's2', name: 'Física I' });

describe('SubjectSearch', () => {
  beforeEach(() => {
    navigation.push.mockReset();
    vi.mocked(getGroupedSuggestions).mockReset();
    vi.mocked(getGroupedSuggestions).mockResolvedValue(suggestions([analisis]));
  });

  afterEach(cleanup);

  it('suggests only subjects of the facultad and navigates on click', async () => {
    const user = userEvent.setup();
    render(<SubjectSearch facultyId={facultyId} facultyLabel="FI" />);

    await user.type(screen.getByLabelText('Buscá una materia'), 'anali');
    const option = await screen.findByRole('option', {
      name: '06 · Análisis Matemático II',
    });
    await waitFor(() =>
      expect(getGroupedSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({ facultyId, q: 'anali' }),
      ),
    );

    await user.click(option);
    expect(navigation.push).toHaveBeenCalledWith('/experiencias/06');
  });

  it('navigates to the first suggestion on Enter', async () => {
    const user = userEvent.setup();
    vi.mocked(getGroupedSuggestions).mockResolvedValue(suggestions([analisis, fisica]));
    render(<SubjectSearch facultyId={facultyId} facultyLabel="FI" />);

    const input = screen.getByLabelText('Buscá una materia');
    await user.type(input, 'anali');
    await screen.findByRole('option', { name: '07 · Física I' });
    await user.type(input, '{Enter}');

    expect(navigation.push).toHaveBeenCalledWith('/experiencias/06');
  });

  it('shows «No encontramos» and retries without facultad on «Buscar en todas»', async () => {
    const user = userEvent.setup();
    vi.mocked(getGroupedSuggestions)
      .mockResolvedValueOnce(suggestions([]))
      .mockResolvedValueOnce(suggestions([analisis]));
    render(<SubjectSearch facultyId={facultyId} facultyLabel="FI" />);

    await user.type(screen.getByLabelText('Buscá una materia'), 'quimica');
    expect(await screen.findByText('No encontramos esa materia en FI')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Buscar en todas' }));
    await waitFor(() =>
      expect(getGroupedSuggestions).toHaveBeenLastCalledWith(
        expect.not.objectContaining({ facultyId }),
      ),
    );
    expect(
      await screen.findByRole('option', { name: '06 · Análisis Matemático II' }),
    ).toBeInTheDocument();
  });

  it('hides stale suggestions immediately when the facultad changes', async () => {
    const user = userEvent.setup();
    const second = deferred<GroupedDiscoverySuggestions>();
    vi.mocked(getGroupedSuggestions)
      .mockResolvedValueOnce(suggestions([analisis]))
      .mockReturnValueOnce(second.promise);
    const { rerender } = render(<SubjectSearch facultyId={facultyId} facultyLabel="FI" />);

    await user.type(screen.getByLabelText('Buscá una materia'), 'anali');
    await screen.findByRole('option', { name: '06 · Análisis Matemático II' });

    rerender(<SubjectSearch facultyId={otherFacultyId} facultyLabel="Otra" />);
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    await waitFor(() => expect(getGroupedSuggestions).toHaveBeenCalledTimes(2));

    second.resolve(suggestions([fisica]));
    expect(await screen.findByRole('option', { name: '07 · Física I' })).toBeInTheDocument();
  });

  it('ignores a late response that belongs to an older facultad', async () => {
    const user = userEvent.setup();
    const first = deferred<GroupedDiscoverySuggestions>();
    const second = deferred<GroupedDiscoverySuggestions>();
    vi.mocked(getGroupedSuggestions)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { rerender } = render(<SubjectSearch facultyId={facultyId} facultyLabel="FI" />);

    await user.type(screen.getByLabelText('Buscá una materia'), 'anali');
    await waitFor(() => expect(getGroupedSuggestions).toHaveBeenCalledTimes(1));

    rerender(<SubjectSearch facultyId={otherFacultyId} facultyLabel="Otra" />);
    await waitFor(() => expect(getGroupedSuggestions).toHaveBeenCalledTimes(2));

    // The new scope's result lands first and is the one that stays visible.
    second.resolve(suggestions([fisica]));
    expect(await screen.findByRole('option', { name: '07 · Física I' })).toBeInTheDocument();

    // The stale response resolves afterwards: it must not overwrite.
    await act(async () => {
      first.resolve(suggestions([analisis]));
      await first.promise;
    });
    expect(screen.queryByRole('option', { name: '06 · Análisis Matemático II' })).toBeNull();
    expect(screen.getByRole('option', { name: '07 · Física I' })).toBeInTheDocument();
  });

  it('shows an error with «Reintentar» and keeps the same scope', async () => {
    const user = userEvent.setup();
    vi.mocked(getGroupedSuggestions)
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce(suggestions([analisis]));
    render(<SubjectSearch facultyId={facultyId} facultyLabel="FI" />);

    await user.type(screen.getByLabelText('Buscá una materia'), 'anali');
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() =>
      expect(getGroupedSuggestions).toHaveBeenLastCalledWith(
        expect.objectContaining({ facultyId, q: 'anali' }),
      ),
    );
    expect(
      await screen.findByRole('option', { name: '06 · Análisis Matemático II' }),
    ).toBeInTheDocument();
  });

  it('queries from two characters and never shows stale options below it', async () => {
    const user = userEvent.setup();
    render(<SubjectSearch facultyId={facultyId} facultyLabel="FI" />);
    const input = screen.getByLabelText('Buscá una materia');

    await user.type(input, 'a');
    // Wait past the 250ms debounce before asserting nothing was requested.
    await new Promise((wait) => setTimeout(wait, 300));
    expect(getGroupedSuggestions).not.toHaveBeenCalled();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();

    await user.type(input, 'n');
    await waitFor(() =>
      expect(getGroupedSuggestions).toHaveBeenCalledWith(expect.objectContaining({ q: 'an' })),
    );
    await screen.findByRole('option', { name: '06 · Análisis Matemático II' });

    await user.type(input, '{Backspace}');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('shows an accessible loading status until the deferred search resolves', async () => {
    const user = userEvent.setup();
    const pending = deferred<GroupedDiscoverySuggestions>();
    vi.mocked(getGroupedSuggestions).mockReturnValue(pending.promise);
    render(<SubjectSearch facultyId={facultyId} facultyLabel="FI" />);

    await user.type(screen.getByLabelText('Buscá una materia'), 'anali');
    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(getGroupedSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({ facultyId, q: 'anali' }),
      ),
    );

    await act(async () => {
      pending.resolve(suggestions([analisis]));
      await pending.promise;
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(
      await screen.findByRole('option', { name: '06 · Análisis Matemático II' }),
    ).toBeInTheDocument();
  });

  it('moves the active option with arrows, Enter uses it, Escape dismisses', async () => {
    const user = userEvent.setup();
    vi.mocked(getGroupedSuggestions).mockResolvedValue(suggestions([analisis, fisica]));
    render(<SubjectSearch facultyId={facultyId} facultyLabel="FI" />);
    const input = screen.getByLabelText('Buscá una materia');

    await user.type(input, 'anali');
    const first = await screen.findByRole('option', {
      name: '06 · Análisis Matemático II',
    });
    const secondOption = screen.getByRole('option', { name: '07 · Física I' });

    await user.type(input, '{ArrowDown}');
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', first.id);

    await user.type(input, '{ArrowDown}');
    expect(secondOption).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', secondOption.id);

    await user.type(input, '{ArrowUp}');
    expect(first).toHaveAttribute('aria-selected', 'true');

    await user.type(input, '{Escape}');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).not.toHaveAttribute('aria-activedescendant');

    // Arrows reopen the dismissed results.
    await user.type(input, '{ArrowDown}');
    expect(
      await screen.findByRole('option', { name: '06 · Análisis Matemático II' }),
    ).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  it('clears a failed query and its error below two characters', async () => {
    const user = userEvent.setup();
    vi.mocked(getGroupedSuggestions).mockRejectedValue(new Error('down'));
    render(<SubjectSearch facultyId={facultyId} facultyLabel="FI" />);
    const input = screen.getByLabelText('Buscá una materia');

    await user.type(input, 'anali');
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.type(input, '{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('hides a failure immediately when the facultad changes', async () => {
    const user = userEvent.setup();
    const second = deferred<GroupedDiscoverySuggestions>();
    vi.mocked(getGroupedSuggestions)
      .mockRejectedValueOnce(new Error('down'))
      .mockReturnValueOnce(second.promise);
    const { rerender } = render(<SubjectSearch facultyId={facultyId} facultyLabel="FI" />);

    await user.type(screen.getByLabelText('Buscá una materia'), 'anali');
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    rerender(<SubjectSearch facultyId={otherFacultyId} facultyLabel="Otra" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await waitFor(() => expect(getGroupedSuggestions).toHaveBeenCalledTimes(2));
    expect(getGroupedSuggestions).toHaveBeenLastCalledWith(
      expect.objectContaining({ facultyId: otherFacultyId, q: 'anali' }),
    );
  });

  it('navigates to the active option on Enter', async () => {
    const user = userEvent.setup();
    vi.mocked(getGroupedSuggestions).mockResolvedValue(suggestions([analisis, fisica]));
    render(<SubjectSearch facultyId={facultyId} facultyLabel="FI" />);
    const input = screen.getByLabelText('Buscá una materia');

    await user.type(input, 'anali');
    await screen.findByRole('option', { name: '07 · Física I' });
    await user.type(input, '{ArrowDown}{ArrowDown}{Enter}');

    expect(navigation.push).toHaveBeenCalledWith('/experiencias/07');
  });

  it('calls onSelect with the subject instead of navigating when provided', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SubjectSearch facultyId={facultyId} facultyLabel="FI" onSelect={onSelect} />);

    await user.type(screen.getByLabelText('Buscá una materia'), 'anali');
    await user.click(await screen.findByRole('option', { name: '06 · Análisis Matemático II' }));

    expect(onSelect).toHaveBeenCalledWith(analisis);
    expect(navigation.push).not.toHaveBeenCalled();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
});
