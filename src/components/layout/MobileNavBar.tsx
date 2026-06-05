'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Home, Coffee, CalendarDays, Palette } from 'lucide-react';

export default function MobileNavBar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide on admin and menu pages (menu has its own nav)
  const isHidden =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/menu');

  useEffect(() => {
    if (isHidden) return;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isHidden]);

  if (isHidden) return null;

  const navItems = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/menu', label: t('menu'), icon: Coffee },
    { href: '/booking', label: t('booking'), icon: CalendarDays },
    { href: '/arts', label: t('arts'), icon: Palette },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href);

  return (
    <nav
      className="mobile-nav-bar"
      style={{
        position: 'fixed',
        bottom: visible ? '16px' : '-80px',
        left: '16px',
        right: '16px',
        zIndex: 'var(--z-nav)' as any,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '10px 8px',
        borderRadius: 'var(--radius-2xl)',
        background: 'rgba(245, 232, 213, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(196, 153, 63, 0.2)',
        boxShadow: '0 8px 32px rgba(44, 26, 14, 0.15)',
        transition: 'bottom 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <style>{`
        .dark .mobile-nav-bar {
          background: rgba(28, 14, 6, 0.88) !important;
          border-color: rgba(196, 153, 63, 0.15) !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
        }
        @media (min-width: 769px) {
          .mobile-nav-bar { display: none !important; }
        }
      `}</style>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-lg)',
              color: active ? 'var(--accent)' : 'var(--muted)',
              transition: 'all 200ms',
              textDecoration: 'none',
              position: 'relative',
              background: active ? 'rgba(196, 153, 63, 0.1)' : 'transparent',
            }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{
              fontSize: '10px',
              fontWeight: active ? 700 : 500,
              letterSpacing: '0.02em',
            }}>
              {item.label}
            </span>
            {active && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
              }} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
