'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sun, Moon, Menu, X } from 'lucide-react';
import anime from 'animejs';
import { useReducedMotion, DURATION_SHORT, EASE_OUT } from '@/animations';
import styles from './Header.module.css';

/**
 * Attaches anime.js hover underline animation to a single nav link element.
 */
function useNavLinkHover(reducedMotion: boolean) {
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const underlineRef = useRef<HTMLSpanElement | null>(null);
  const animInstance = useRef<anime.AnimeInstance | null>(null);

  const setRefs = useCallback(
    (node: HTMLAnchorElement | null) => {
      linkRef.current = node;
      if (!node) return;

      // Find or create underline span
      let underline = node.querySelector<HTMLSpanElement>('.nav-underline-el');
      if (!underline) {
        underline = document.createElement('span');
        underline.className = 'nav-underline-el';
        Object.assign(underline.style, {
          position: 'absolute',
          bottom: '0',
          left: '0',
          width: '100%',
          height: '2px',
          backgroundColor: 'var(--accent)',
          transformOrigin: 'left',
          transform: 'scaleX(0)',
          pointerEvents: 'none',
        });
        node.appendChild(underline);
      }
      underlineRef.current = underline;
    },
    [],
  );

  useEffect(() => {
    const el = linkRef.current;
    if (!el || reducedMotion) return;

    const handleEnter = () => {
      const ul = underlineRef.current;
      if (!ul) return;
      ul.style.transformOrigin = 'left';
      animInstance.current?.pause();
      animInstance.current = anime({
        targets: ul,
        scaleX: [0, 1],
        duration: DURATION_SHORT,
        easing: EASE_OUT,
      });
    };

    const handleLeave = () => {
      const ul = underlineRef.current;
      if (!ul) return;
      ul.style.transformOrigin = 'right';
      animInstance.current?.pause();
      animInstance.current = anime({
        targets: ul,
        scaleX: [1, 0],
        duration: DURATION_SHORT,
        easing: EASE_OUT,
      });
    };

    el.addEventListener('mouseenter', handleEnter);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mouseenter', handleEnter);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [reducedMotion]);

  return setRefs;
}

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reducedMotion = useReducedMotion();

  // One hook per nav link (stable count)
  const homeRef = useNavLinkHover(reducedMotion);
  const menuRef = useNavLinkHover(reducedMotion);
  const bookingRef = useNavLinkHover(reducedMotion);
  const artsRef = useNavLinkHover(reducedMotion);

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
    { href: '/', label: t('home'), ref: homeRef },
    { href: '/menu', label: t('menu'), ref: menuRef },
    { href: '/booking', label: t('booking'), ref: bookingRef },
    { href: '/arts', label: t('arts'), ref: artsRef },
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
              <Image src="/logo.jpeg" alt="Retro Spot" width={40} height={40} className={styles.logoImg} />
            </Link>

            {/* Desktop Nav */}
            <nav className={styles.desktopNav}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  ref={link.ref}
                  className={`${styles.navLink} ${isActive(link.href) ? styles.navLinkActive : ''}`}
                >
                  {link.label}
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
