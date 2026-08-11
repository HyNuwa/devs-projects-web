'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Home,
  MessageSquare,
  GraduationCap,
  FileText,
  Wrench,
  Trophy,
  Search,
  Menu,
  X,
  User,
  Shield,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import styles from './Navbar.module.css';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const navLinks = [
    { name: 'Inicio', href: '/', icon: <Home size={18} /> },
    { name: 'Foro', href: '/foro', icon: <MessageSquare size={18} /> },
    { name: 'Cursos', href: '/cursos', icon: <GraduationCap size={18} /> },
    { name: 'Guías', href: '/guias', icon: <FileText size={18} /> },
    { name: 'Herramientas', href: '/herramientas', icon: <Wrench size={18} /> },
    { name: 'Ranking', href: '/ranking', icon: <Trophy size={18} /> },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <Image
            src="/assets/logo.png"
            alt="DevsProject Logo"
            width={120}
            height={48}
            className={styles.logoImage}
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav}>
          <ul className={styles.navList}>
            {navLinks.map((link) => (
              <li key={link.name} className={styles.navItem}>
                <Link
                  href={link.href}
                  className={`${styles.navLink} ${isActive(link.href) ? styles.active : ''}`}
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
            {user ? (
              <>
                <div className={styles.userMenu}>
                  <Link href="/profile/me" className={styles.loginBtn}>
                    <User size={18} />
                    <span>{user.username}</span>
                  </Link>
                  {user.role === 'ADMIN' || user.role === 'SUPERADMIN' ? (
                    <Link href="/admin" className={styles.loginBtn}>
                      <Shield size={18} />
                      <span>Admin</span>
                    </Link>
                  ) : null}
                  <button onClick={handleLogout} className={styles.registerBtn}>
                    <LogOut size={18} />
                    <span>Salir</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className={styles.loginBtn}>
                  Iniciar sesión
                </Link>
                <Link href="/auth/register" className={styles.registerBtn}>
                  Registrarse
                </Link>
              </>
            )}
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
              {user ? (
                <>
                  <span className={styles.loginBtn} style={{ cursor: 'default' }}>
                    <User size={18} /> {user.username}
                  </span>
                  <button onClick={handleLogout} className={styles.registerBtn}>
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className={styles.loginBtn}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/auth/register"
                    className={styles.registerBtn}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
};
