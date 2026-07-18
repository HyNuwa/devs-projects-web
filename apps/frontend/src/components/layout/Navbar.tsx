import Link from 'next/link';
import { Home, MessageSquare, BookOpen, Map, Wrench, Trophy, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import styles from './Navbar.module.css';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [
    { name: 'Inicio', href: '/', icon: <Home size={18} /> },
    { name: 'Foro', href: '/foro', icon: <MessageSquare size={18} /> },
    { name: 'Cursos', href: '/cursos', icon: <BookOpen size={18} /> },
    { name: 'Guías', href: '/guias', icon: <Map size={18} /> },
    { name: 'Herramientas', href: '/herramientas', icon: <Wrench size={18} /> },
    { name: 'Ranking', href: '/ranking', icon: <Trophy size={18} /> },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>🦊</div>
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>DEVS</span>
            <span className={styles.logoSubtitle}>PROJECT</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav}>
          <ul className={styles.navList}>
            {navLinks.map((link) => (
              <li key={link.name} className={styles.navItem}>
                <Link
                  href={link.href}
                  className={`${styles.navLink} ${link.name === 'Inicio' ? styles.active : ''}`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right Actions */}
        <div className={styles.actions}>
          <div className={styles.searchContainer}>
            <Search size={18} className={styles.searchIcon} />
            <input type="text" placeholder="Buscar..." className={styles.searchInput} />
          </div>

          <div className={styles.authButtons}>
            <Link href="/login" className={styles.loginBtn}>
              Iniciar sesión
            </Link>
            <Link href="/register" className={styles.registerBtn}>
              Registrarse
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className={styles.mobileToggle} onClick={toggleMenu} aria-label="Menu">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className={styles.mobileNav}>
          <ul className={styles.mobileNavList}>
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className={styles.mobileNavLink}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              </li>
            ))}
            <li className={styles.mobileAuth}>
              <Link href="/login" className={styles.loginBtn} onClick={() => setIsMenuOpen(false)}>
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className={styles.registerBtn}
                onClick={() => setIsMenuOpen(false)}
              >
                Registrarse
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
};
