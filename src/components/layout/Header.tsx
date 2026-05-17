'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sun, Moon, Menu, X } from 'lucide-react';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setMounted(true), []);
  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [pathname]);

  // Track scroll position
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
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      scrolled 
        ? 'border-b border-border bg-background/90 backdrop-blur-md py-3 shadow-none' 
        : 'border-b border-transparent bg-transparent py-5'
    }`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="block transition-transform hover:scale-105"
          >
            <img src="/logo.jpeg" alt="Retro Spot" className="w-12 h-12 rounded-full object-cover border border-border" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 rtl:space-x-reverse">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  text-sm font-semibold tracking-widest uppercase transition-all duration-250 relative py-2
                  ${
                    isActive(link.href)
                      ? 'text-accent'
                      : 'text-muted hover:text-foreground'
                  }
                `}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-accent rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Language */}
            <button
              onClick={toggleLanguage}
              className={`
                px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-widest
                bg-surface-elevated text-muted hover:text-foreground
                border border-border hover:border-accent
                transition-all duration-250 focus-ring
              `}
              aria-label="Toggle Language"
            >
              {language === 'en' ? 'AR' : 'EN'}
            </button>

            {/* Theme */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`
                  p-2 rounded-sm text-muted hover:text-foreground hover:bg-surface-elevated
                  border border-transparent hover:border-border
                  transition-colors duration-250 focus-ring
                `}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`
                md:hidden p-2 rounded-sm text-muted hover:text-foreground hover:bg-surface-elevated
                transition-colors duration-250 focus-ring
              `}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-surface-elevated/95 backdrop-blur-lg animate-[slideDown_0.25s_ease-out]">
          <nav className="flex flex-col px-6 py-6 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  text-lg font-semibold tracking-widest uppercase py-2 border-b border-border/10
                  ${
                    isActive(link.href)
                      ? 'text-accent'
                      : 'text-muted hover:text-foreground'
                  }
                `}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}
