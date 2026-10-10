import styles from './PublicProfile.module.css';

/**
 * How each perfil público option id is drawn (openspec
 * reputation/profile-customization). The server decides what is unlocked; this
 * only maps ids to colors, classes and art.
 */
export const ACCENT_COLORS: Record<string, string> = {
  menta: 'var(--dp-green)',
  coral: 'var(--dp-pink)',
  cielo: 'var(--dp-blue)',
  ambar: 'var(--dp-gold)',
  lavanda: 'var(--profile-lavanda, #6d4fd1)',
  pizarra: 'var(--dp-ink-soft)',
};

export function bannerSrc(id: string) {
  return `/assets/perfil/banners/${id}.webp`;
}

const classFor = (prefix: string, id: string | null) =>
  id ? (styles[`${prefix}-${id}`] ?? '') : '';

export const backgroundClass = (id: string | null) => classFor('bg', id);
export const frameClass = (id: string | null) => classFor('frame', id);
export const themeClass = (id: string | null) => classFor('theme', id);

export { styles as profileStyles };
