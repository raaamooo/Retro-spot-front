'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sun, Moon, Menu, X } from 'lucide-react';
import styles from './Header.module.css';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/menu')
  ) {
    return null;
  }

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/menu', label: t('menu') },
    { href: '/booking', label: t('booking') },
    { href: '/arts', label: t('arts') },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className="container">
          <div className={styles.headerContainer}>
            {/* Logo */}
            <Link href="/" className={styles.logo}>
              <img src="/logo.jpeg" alt="Retro Spot" className={styles.logoImg} />
            </Link>

            {/* Desktop Nav */}
            <nav className={styles.desktopNav}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.navLink} ${isActive(link.href) ? styles.navLinkActive : ''}`}
                >
                  {link.label}
                  {isActive(link.href) && <span className={styles.activeDot} />}
                </Link>
              ))}
            </nav>

            {/* Controls */}
            <div className={styles.controls}>
              <button
                onClick={toggleLanguage}
                className={`${styles.iconBtn} focus-ring`}
                aria-label="Toggle Language"
              >
                {language === 'en' ? 'AR' : 'EN'}
              </button>

              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={`${styles.iconBtn} focus-ring`}
                  aria-label="Toggle Theme"
                  style={{ padding: '8px' }}
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                className={styles.mobileMenuBtn}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle Menu"
              >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${mobileOpen ? styles.mobileMenuOpen : ''}`}>
        <nav className={styles.mobileNav}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileNavLink} ${isActive(link.href) ? styles.mobileNavLinkActive : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
