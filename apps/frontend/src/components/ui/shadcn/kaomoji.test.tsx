import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { kaomojiAllowlist, type KaomojiId } from '@/lib/kaomoji';

import { Kaomoji } from './kaomoji';

describe('Kaomoji', () => {
  it('renders a reviewed local Unicode value as decorative content', () => {
    const id: KaomojiId = 'encouragement';
    const { container } = render(<Kaomoji id={id} />);
    const kaomoji = container.querySelector('[data-slot="kaomoji"]');

    expect(kaomoji).toHaveAttribute('aria-hidden', 'true');
    expect(kaomoji).toHaveTextContent(kaomojiAllowlist[id].value);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('keeps the reviewed identifiers and their Unicode values local and typed', () => {
    expect(Object.keys(kaomojiAllowlist)).toEqual(['encouragement', 'focused', 'celebration']);
    expect(kaomojiAllowlist.celebration.value).toBe('\\(•◡•)/');
  });
});
