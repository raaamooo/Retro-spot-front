'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  Sun, Moon, Coffee, UtensilsCrossed, CreditCard,
  Package, UserCog, CalendarClock, LogOut, PanelLeftClose, PanelLeft,
  Bell, Clock, AlertTriangle, ShoppingBag, Zap, Info, X,
} from 'lucide-react';

// ── Notification type icons ──
const NOTIF_ICONS: Record<string, React.ReactNode> = {
  low_stock: <Package size={14} />,
  long_wait: <Clock size={14} />,
  cash_discrepancy: <AlertTriangle size={14} />,
  rush_order: <Zap size={14} />,
  new_order: <ShoppingBag size={14} />,
  info: <Info size={14} />,
};

const NOTIF_COLORS: Record<string, string> = {
  low_stock: 'var(--warning)',
  long_wait: 'var(--danger)',
  cash_discrepancy: 'var(--danger)',
  rush_order: 'var(--danger)',
  new_order: 'var(--success)',
  info: 'var(--info)',
};

function LiveClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '13px',
      fontWeight: 500,
      color: 'var(--muted)',
      fontFamily: 'var(--font-body)',
    }}>
      <Clock size={14} />
      {time}
    </span>
  );
}

export default function AdminHeader({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { user, isAuthenticated, login, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // Legacy fallback auth (kept for backward compat with existing admin123 flow)
  const [legacyAuth, setLegacyAuth] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    // Check legacy auth
    if (localStorage.getItem('adminAuth') === 'true') {
      setLegacyAuth(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    // Try real auth first
    const result = await login(loginEmail, loginPassword);

    if (result.success) {
      setLoginLoading(false);
      return;
    }

    // Fallback: legacy password check
    // ⚠️ SECURITY: Plaintext fallback — replace with JWT auth when ready.
    if (loginPassword === 'admin123') {
      setLegacyAuth(true);
      localStorage.setItem('adminAuth', 'true');
      setLoginLoading(false);
      return;
    }

    setLoginError(result.error || 'Invalid credentials');
    setLoginLoading(false);
  };

  const handleLogout = () => {
    logout();
    setLegacyAuth(false);
    localStorage.removeItem('adminAuth');
  };

  const navLinks = [
    { href: '/admin/barista', label: t('barista'), icon: Coffee, page: 'barista' },
    { href: '/admin/waiter', label: t('waiter'), icon: UtensilsCrossed, page: 'waiter' },
    { href: '/admin/cashier', label: t('cashier'), icon: CreditCard, page: 'cashier' },
    { href: '/admin/inventory', label: t('inventory'), icon: Package, page: 'inventory' },
    { href: '/admin/manager', label: t('manager'), icon: UserCog, page: 'manager' },
    { href: '/admin/organizer', label: t('organizer'), icon: CalendarClock, page: 'organizer' },
  ];

  const isAuthed = isAuthenticated || legacyAuth;

  /* ── Login Gate ── */
  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <form
          onSubmit={handleLogin}
          className="bg-surface p-8 rounded-2xl border border-border shadow-lg max-w-sm w-full"
        >
          {/* Retro logo accent */}
          <div style={{
            display: 'flex', justifyContent: 'center', marginBottom: '16px',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              backgroundColor: 'var(--primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Coffee size={28} color="var(--primary-foreground)" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-primary mb-1 text-center">
            {t('admin_dashboard')}
          </h2>
          <p className="text-sm text-muted text-center mb-6">Retro Spot Staff Portal</p>

          {loginError && (
            <div style={{
              padding: '10px 14px', marginBottom: '12px',
              backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--danger)',
            }}>
              {loginError}
            </div>
          )}

          <input
            type="email"
            placeholder={`${t('password')} / Email`}
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className={`
              w-full px-4 py-3 mb-3 bg-background border border-border rounded-xl text-foreground
              placeholder:text-muted focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20
            `}
            style={{ fontSize: '14px' }}
          />
          <input
            type="password"
            placeholder={t('password')}
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className={`
              w-full px-4 py-3 mb-4 bg-background border border-border rounded-xl text-foreground
              placeholder:text-muted focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20
            `}
            style={{ fontSize: '14px' }}
          />
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-hover transition-colors"
            style={{ opacity: loginLoading ? 0.7 : 1 }}
          >
            {loginLoading ? '...' : t('login')}
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

        {/* User info */}
        {sidebarOpen && user && (
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: 'var(--accent)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: 'white',
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.3 }}>
                  {user.name}
                </div>
                <div style={{
                  fontSize: '11px', color: 'var(--accent)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {user.role}
                </div>
              </div>
            </div>
          </div>
        )}

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

          {/* Page title + user role (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <h1 className="text-lg font-bold text-foreground capitalize">
              {navLinks.find((l) => pathname === l.href)?.label || t('admin_dashboard')}
            </h1>
            {user && (
              <span style={{
                fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: 'var(--accent)',
                backgroundColor: 'rgba(196, 153, 63, 0.1)',
                padding: '3px 10px', borderRadius: '20px',
              }}>
                {user.role}
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live clock */}
            <div className="hidden md:flex">
              <LiveClock />
            </div>

            {/* Notification bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
                style={{ position: 'relative' }}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '4px', right: '4px',
                    width: '16px', height: '16px', borderRadius: '50%',
                    backgroundColor: 'var(--danger)', color: 'white',
                    fontSize: '10px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifications && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0,
                  width: '340px', maxHeight: '400px',
                  backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  zIndex: 100, overflow: 'hidden',
                  animation: 'fadeIn 150ms ease-out',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)',
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Notifications</span>
                    <button
                      onClick={() => { markAllAsRead(); }}
                      style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 500 }}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div style={{ overflowY: 'auto', maxHeight: '340px' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                        No notifications
                      </div>
                    ) : (
                      notifications.slice(0, 20).map(n => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: '10px',
                            padding: '10px 16px', cursor: 'pointer',
                            backgroundColor: n.read ? 'transparent' : 'rgba(196, 153, 63, 0.04)',
                            borderBottom: '1px solid var(--border-subtle)',
                            transition: 'background-color 150ms',
                          }}
                        >
                          <span style={{ color: NOTIF_COLORS[n.type] || 'var(--muted)', marginTop: '2px', flexShrink: 0 }}>
                            {NOTIF_ICONS[n.type] || <Info size={14} />}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: n.read ? 400 : 600, color: 'var(--foreground)', lineHeight: 1.3 }}>
                              {n.title}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px', lineHeight: 1.4 }}>
                              {n.message}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', opacity: 0.6, marginTop: '4px' }}>
                              {new Date(n.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {!n.read && (
                            <div style={{
                              width: '6px', height: '6px', borderRadius: '50%',
                              backgroundColor: 'var(--accent)', flexShrink: 0, marginTop: '6px',
                            }} />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Language toggle */}
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

            {/* Theme toggle */}
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

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
}
