import styles from './PrototypeShell.module.css';

export function HeroArtwork() {
  return (
    <picture className={styles.heroArtwork}>
      <source
        type="image/avif"
        srcSet="/assets/pixel-notebook/heroes/hero-home-brasa-kit-640.avif 640w, /assets/pixel-notebook/heroes/hero-home-brasa-kit-960.avif 960w, /assets/pixel-notebook/heroes/hero-home-brasa-kit-1280.avif 1280w, /assets/pixel-notebook/heroes/hero-home-brasa-kit-1672.avif 1672w"
        sizes="(max-width: 820px) 100vw, 58vw"
      />
      <source
        type="image/webp"
        srcSet="/assets/pixel-notebook/heroes/hero-home-brasa-kit-640.webp 640w, /assets/pixel-notebook/heroes/hero-home-brasa-kit-960.webp 960w, /assets/pixel-notebook/heroes/hero-home-brasa-kit-1280.webp 1280w, /assets/pixel-notebook/heroes/hero-home-brasa-kit-1672.webp 1672w"
        sizes="(max-width: 820px) 100vw, 58vw"
      />
      <img
        src="/assets/pixel-notebook/heroes/hero-home-brasa-kit-1280.webp"
        alt="Mochila pixel art con libros, apuntes y útiles de estudio"
        width="1672"
        height="941"
        fetchPriority="high"
      />
    </picture>
  );
}
