import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PublicationSection } from './PublicationSection';

const ANONYMITY_COPY =
  'Se muestra como «Anónimo» y no aparece en tu perfil. Las publicaciones anónimas no suman puntos.';
const RULE_COPY =
  'Se publica al instante. Si alguien la reporta y no cumple las normas, moderación puede retirarla.';

function Harness({
  isAnonymous = false,
  isEditing = false,
  onCancel,
}: {
  isAnonymous?: boolean;
  isEditing?: boolean;
  onCancel?: () => void;
}) {
  const { register } = useForm({ defaultValues: { isAnonymous } });
  return (
    <form>
      <PublicationSection
        anonymousField={register('isAnonymous')}
        cancelHref="/materias/ED-01"
        isEditing={isEditing}
        isSubmitting={false}
        number={5}
        onCancel={onCancel}
        submitLabel="Publicar reseña"
      />
    </form>
  );
}

const byText = (text: string) => (_: string, element: Element | null) =>
  element?.tagName === 'P' && element.textContent === text;

describe('PublicationSection', () => {
  afterEach(cleanup);

  it('offers anonymity off by default with the exact copy', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByRole('region', { name: 'Publicación' })).toBeInTheDocument();
    const anonymous = screen.getByRole('switch', { name: 'Publicar como anónimo' });
    expect(anonymous).not.toBeChecked();
    expect(anonymous).toBeEnabled();
    expect(anonymous).toHaveAccessibleDescription(ANONYMITY_COPY);

    await user.click(anonymous);
    expect(anonymous).toBeChecked();
  });

  it('states the publication rule with a link to the normas', () => {
    render(<Harness />);

    expect(screen.getByText(byText(RULE_COPY))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'normas' })).toHaveAttribute('href', '/normas');
  });

  it('shows the anonymity chosen at publishing but does not let an edit change it', () => {
    render(<Harness isAnonymous isEditing />);

    const anonymous = screen.getByRole('switch', { name: 'Publicar como anónimo' });
    expect(anonymous).toBeChecked();
    expect(anonymous).toBeDisabled();
    expect(screen.getByText('Se elige al publicar y no cambia al editar.')).toBeInTheDocument();
  });

  it('holds the submit button and «Cancelar» in the publish bar', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<Harness onCancel={onCancel} />);

    expect(screen.getByRole('button', { name: 'Publicar reseña' })).toHaveAttribute(
      'type',
      'submit',
    );
    const cancel = screen.getByRole('link', { name: 'Cancelar' });
    expect(cancel).toHaveAttribute('href', '/materias/ED-01');
    cancel.addEventListener('click', (event) => event.preventDefault());
    await user.click(cancel);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
