'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/constants';

interface AuthUser {
  id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
}

interface AuthContextProps {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isManager: boolean;
  isCashier: boolean;
  isBarista: boolean;
  isWaiter: boolean;
  isInventory: boolean;
  isOrganizer: boolean;
  canAccess: (page: string) => boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Role-based page access mapping
const ROLE_ACCESS: Record<string, string[]> = {
  manager:   ['barista', 'waiter', 'cashier', 'inventory', 'manager', 'organizer'],
  barista:   ['barista'],
  waiter:    ['waiter'],
  cashier:   ['cashier'],
  inventory: ['inventory'],
  organizer: ['organizer'],
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('retro_auth_user');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch { /* ignored */ }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        return { success: false, error: err.error || 'Login failed' };
      }

      const userData: AuthUser = await res.json();
      setUser(userData);
      localStorage.setItem('retro_auth_user', JSON.stringify(userData));
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('retro_auth_user');
  }, []);

  const canAccess = useCallback((page: string) => {
    if (!user) return false;
    const allowed = ROLE_ACCESS[user.role] || [];
    return allowed.includes(page);
  }, [user]);

  const value: AuthContextProps = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    isManager: user?.role === 'manager',
    isCashier: user?.role === 'cashier',
    isBarista: user?.role === 'barista',
    isWaiter: user?.role === 'waiter',
    isInventory: user?.role === 'inventory',
    isOrganizer: user?.role === 'organizer',
    canAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
