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

  useEffect(() => setMounted(true), []);
  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [pathname]);

  if (pathname?.startsWith('/admin')) {
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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-[var(--header-blur)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl sm:text-2xl font-bold tracking-tight text-primary transition-colors hover:text-primary-hover"
          >
            Retro Spot
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 rtl:space-x-reverse">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                  ${
                    isActive(link.href)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted hover:text-foreground hover:bg-surface-elevated'
                  }
                `}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Language */}
            <button
              onClick={toggleLanguage}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider
                bg-surface-elevated text-muted hover:text-foreground
                border border-border-subtle hover:border-border
                transition-all duration-200 focus-ring
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
                  p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated
                  transition-colors duration-200 focus-ring
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
                md:hidden p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated
                transition-colors duration-200 focus-ring
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
        <div className="md:hidden border-t border-border-subtle bg-surface animate-[slideDown_0.2s_ease-out]">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                  ${
                    isActive(link.href)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted hover:text-foreground hover:bg-surface-elevated'
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
