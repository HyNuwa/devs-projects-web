import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getSubjectExamTopics } from '@/lib/experiences-client';

import { TopicsInput } from './TopicsInput';

vi.mock('@/lib/experiences-client', () => ({ getSubjectExamTopics: vi.fn() }));

const onSubmit = vi.fn();

function Harness({ initial = [] }: { initial?: string[] }) {
  const [topics, setTopics] = useState<string[]>(initial);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <TopicsInput id="topics" onChange={setTopics} subjectCode="AM2" value={topics} />
      <output data-testid="value">{JSON.stringify(topics)}</output>
    </form>
  );
}

const value = () => JSON.parse(screen.getByTestId('value').textContent ?? '[]') as string[];
const chips = () =>
  within(screen.getByRole('list', { name: 'Temas agregados' }))
    .queryAllByRole('listitem')
    .map((item) => item.textContent);

describe('TopicsInput', () => {
  beforeEach(() => {
    onSubmit.mockReset();
    vi.mocked(getSubjectExamTopics).mockReset();
    vi.mocked(getSubjectExamTopics).mockResolvedValue({ topics: [] });
  });

  afterEach(cleanup);

  it('adds the typed topic as a chip on Enter without submitting the form', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(
      screen.getByRole('textbox', { name: 'Agregar un tema' }),
      '  Integrales   dobles {Enter}',
    );

    expect(value()).toEqual(['Integrales dobles']);
    expect(chips()).toEqual(['Integrales dobles']);
    expect(screen.getByRole('textbox', { name: 'Agregar un tema' })).toHaveValue('');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('ignores a duplicate that differs only in case or spacing', async () => {
    const user = userEvent.setup();
    render(<Harness initial={['Integrales dobles']} />);

    await user.type(
      screen.getByRole('textbox', { name: 'Agregar un tema' }),
      'integrales  dobles{Enter}',
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Agregar un tema' }),
      'Teorema de Green{Enter}',
    );

    expect(value()).toEqual(['Integrales dobles', 'Teorema de Green']);
  });

  it('refuses a one-character topic with a message', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByRole('textbox', { name: 'Agregar un tema' }), 'x{Enter}');

    expect(value()).toEqual([]);
    expect(screen.getByText('Cada tema necesita al menos 2 caracteres.')).toBeInTheDocument();
  });

  it('removes a chip', async () => {
    const user = userEvent.setup();
    render(<Harness initial={['Integrales dobles', 'Teorema de Green']} />);

    await user.click(screen.getByRole('button', { name: 'Quitar Integrales dobles' }));

    expect(value()).toEqual(['Teorema de Green']);
    expect(chips()).toEqual(['Teorema de Green']);
  });

  it('refuses the eleventh topic with a message', async () => {
    const user = userEvent.setup();
    const ten = Array.from({ length: 10 }, (_, index) => `Tema ${index + 1}`);
    render(<Harness initial={ten} />);

    const input = screen.getByRole('textbox', { name: 'Agregar un tema' });
    await user.type(input, 'Tema 11{Enter}');

    expect(value()).toEqual(ten);
    expect(screen.getByText('Podés cargar hasta 10 temas.')).toBeInTheDocument();
    expect(input).toHaveAccessibleDescription('Podés cargar hasta 10 temas.');
  });

  it('suggests the materia’s shared topics, leaving out added ones, and adds one on click', async () => {
    const user = userEvent.setup();
    vi.mocked(getSubjectExamTopics).mockResolvedValue({
      topics: [
        { topic: 'Series de Fourier', count: 3 },
        { topic: 'Integrales  Dobles', count: 2 },
        { topic: 'Teorema de Green', count: 2 },
      ],
    });
    render(<Harness initial={['integrales dobles']} />);

    const suggestions = await screen.findByRole('group', {
      name: 'Los cargaron otros en esta materia:',
    });
    expect(getSubjectExamTopics).toHaveBeenCalledWith('AM2');
    expect(
      within(suggestions)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Series de Fourier', 'Teorema de Green']);

    await user.click(
      within(suggestions).getByRole('button', { name: 'Agregar Series de Fourier' }),
    );

    expect(value()).toEqual(['integrales dobles', 'Series de Fourier']);
    await waitFor(() =>
      expect(within(suggestions).queryByRole('button', { name: /Series de Fourier/ })).toBeNull(),
    );
  });

  it('shows no suggestions when the materia has none or they fail to load', async () => {
    vi.mocked(getSubjectExamTopics).mockRejectedValue(new Error('offline'));
    render(<Harness />);

    await waitFor(() => expect(getSubjectExamTopics).toHaveBeenCalled());
    expect(screen.queryByText('Los cargaron otros en esta materia:')).not.toBeInTheDocument();
  });
});
