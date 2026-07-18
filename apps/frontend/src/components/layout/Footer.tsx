import Image from 'next/image';
import Link from 'next/link';
import { Globe, Mail, MessageCircle } from 'lucide-react';
import styles from './Footer.module.css';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topSection}>
          {/* Brand & Description */}
          <div className={styles.brandSection}>
            <Link href="/" className={styles.logo}>
              <Image
                src="/assets/logo.png"
                alt="DevsProject Logo"
                width={120}
                height={48}
                className={styles.logoImage}
              />
            </Link>
            <p className={styles.description}>
              Tu aventura académica comienza aquí. Comparte conocimiento, ayuda a otros y
              conviértete en leyenda en nuestra comunidad universitaria.
            </p>
            <div className={styles.socialLinks}>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="Website"
              >
                <Globe size={20} />
              </a>
              <a
                href="mailto:contacto@devsproject.com"
                className={styles.socialIcon}
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="Discord"
              >
                <MessageCircle size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className={styles.linksSection}>
            <h3 className={styles.linksTitle}>Explorar</h3>
            <ul className={styles.linksList}>
              <li>
                <Link href="/foro" className={styles.link}>
                  Foro
                </Link>
              </li>
              <li>
                <Link href="/cursos" className={styles.link}>
                  Cursos
                </Link>
              </li>
              <li>
                <Link href="/guias" className={styles.link}>
                  Guías
                </Link>
              </li>
              <li>
                <Link href="/herramientas" className={styles.link}>
                  Herramientas
                </Link>
              </li>
              <li>
                <Link href="/ranking" className={styles.link}>
                  Ranking
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className={styles.linksSection}>
            <h3 className={styles.linksTitle}>Recursos</h3>
            <ul className={styles.linksList}>
              <li>
                <Link href="/faq" className={styles.link}>
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link href="/reglas" className={styles.link}>
                  Reglas de la Comunidad
                </Link>
              </li>
              <li>
                <Link href="/api" className={styles.link}>
                  API para Desarrolladores
                </Link>
              </li>
              <li>
                <Link href="/contacto" className={styles.link}>
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className={styles.linksSection}>
            <h3 className={styles.linksTitle}>Legal</h3>
            <ul className={styles.linksList}>
              <li>
                <Link href="/terminos" className={styles.link}>
                  Términos de Servicio
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className={styles.link}>
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/cookies" className={styles.link}>
                  Uso de Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.bottomSection}>
          <p className={styles.copyright}>
            &copy; {currentYear} DevsProject Foro. Todos los derechos reservados.
          </p>
          <div className={styles.pixelArt}>⚔️ 🛡️ 🧪</div>
        </div>
      </div>
    </footer>
  );
};
