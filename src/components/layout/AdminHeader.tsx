'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sun, Moon, Coffee, UtensilsCrossed, CreditCard,
  Package, UserCog, CalendarClock, LogOut, PanelLeftClose, PanelLeft,
} from 'lucide-react';

export default function AdminHeader({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (localStorage.getItem('adminAuth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
  };

  const navLinks = [
    { href: '/admin/barista', label: t('barista'), icon: Coffee },
    { href: '/admin/waiter', label: t('waiter'), icon: UtensilsCrossed },
    { href: '/admin/cashier', label: t('cashier'), icon: CreditCard },
    { href: '/admin/inventory', label: t('inventory'), icon: Package },
    { href: '/admin/manager', label: t('manager'), icon: UserCog },
    { href: '/admin/organizer', label: t('organizer'), icon: CalendarClock },
  ];

  /* ── Login Gate ── */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <form
          onSubmit={handleLogin}
          className="bg-surface p-8 rounded-2xl border border-border shadow-lg max-w-sm w-full"
        >
          <h2 className="text-2xl font-bold text-primary mb-1 text-center">
            {t('admin_dashboard')}
          </h2>
          <p className="text-sm text-muted text-center mb-6">Retro Spot</p>
          <input
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`
              w-full px-4 py-3 mb-4 bg-background border border-border rounded-xl text-foreground
              placeholder:text-muted focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20
            `}
          />
          <button
            type="submit"
            className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-hover transition-colors"
          >
            {t('login')}
          </button>
        </form>
      </div>
    );
  }

  /* ── Admin Shell ── */
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`
          ${sidebarOpen ? 'w-60' : 'w-[68px]'}
          bg-surface border-e border-border
          hidden md:flex flex-col shrink-0
          transition-[width] duration-300 ease-out
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border-subtle shrink-0">
          {sidebarOpen && (
            <span className="text-sm font-bold text-primary truncate">
              {t('admin_dashboard')}
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <ul className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    title={link.label}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl
                      text-sm font-medium transition-all duration-200
                      ${active
                        ? 'bg-primary/12 text-primary font-semibold'
                        : 'text-muted hover:text-foreground hover:bg-surface-elevated'
                      }
                    `}
                  >
                    <Icon size={20} className="shrink-0" />
                    {sidebarOpen && <span className="truncate">{link.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar footer */}
        <div className="px-2 py-3 border-t border-border-subtle shrink-0 space-y-1">
          <button
            onClick={handleLogout}
            className={`
              flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
              text-sm font-medium text-danger hover:bg-danger-bg transition-colors
            `}
            title={t('logout')}
          >
            <LogOut size={18} className="shrink-0" />
            {sidebarOpen && <span>{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 shrink-0 border-b border-border-subtle bg-surface/80 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6">
          {/* Mobile menu (for small screens) */}
          <div className="md:hidden flex items-center gap-2 overflow-x-auto">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    p-2.5 rounded-xl transition-colors shrink-0
                    ${active ? 'bg-primary/12 text-primary' : 'text-muted hover:text-foreground'}
                  `}
                  title={link.label}
                >
                  <Icon size={20} />
                </Link>
              );
            })}
          </div>

          {/* Page title (desktop) */}
          <div className="hidden md:block">
            <h1 className="text-lg font-bold text-foreground capitalize">
              {navLinks.find((l) => pathname === l.href)?.label || t('admin_dashboard')}
            </h1>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleLanguage}
              className={`
                px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider
                bg-surface-elevated text-muted hover:text-foreground
                border border-border-subtle hover:border-border
                transition-all duration-200
              `}
              aria-label="Toggle Language"
            >
              {language === 'en' ? 'AR' : 'EN'}
            </button>
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
