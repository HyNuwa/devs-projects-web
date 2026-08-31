export type LocalKaomoji = {
  meaning: string;
  value: string;
};

/**
 * Reviewed Unicode-only set. Keep additions intentional: these are decorative
 * accents, not a remotely sourced content catalog.
 */
export const kaomojiAllowlist = {
  encouragement: {
    meaning: 'Ánimo para estudiar',
    value: '(•̀ᴗ•́)و',
  },
  focused: {
    meaning: 'Concentración',
    value: '(•̀ω•́)و',
  },
  celebration: {
    meaning: 'Pequeña celebración',
    value: '\\(•◡•)/',
  },
} as const satisfies Record<string, LocalKaomoji>;

export type KaomojiId = keyof typeof kaomojiAllowlist;
