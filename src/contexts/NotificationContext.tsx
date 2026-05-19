'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useSocketEvent } from '@/hooks/useSocket';

/**
 * NotificationContext — Real-time notification system for admin dashboard.
 * 
 * Uses the shared socket singleton (via useSocketEvent) instead of creating
 * a second connection. All socket cleanup is handled by the hook.
 */

export interface Notification {
  id: string;
  type: 'low_stock' | 'long_wait' | 'cash_discrepancy' | 'rush_order' | 'new_order' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

interface NotificationContextProps {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

let notifId = 0;
function createNotification(
  type: Notification['type'],
  title: string,
  message: string,
  data?: any
): Notification {
  return {
    id: `notif_${Date.now()}_${notifId++}`,
    type,
    title,
    message,
    timestamp: new Date(),
    read: false,
    data,
  };
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Subscribe to socket events using the shared singleton — no duplicate connections
  useSocketEvent('inventory:low_stock', (ingredient: any) => {
    setNotifications(prev => [
      createNotification(
        'low_stock',
        'Low Stock Alert',
        `${ingredient.nameEn} is running low (${ingredient.quantityAvailable} ${ingredient.unit} left)`,
        ingredient
      ),
      ...prev,
    ].slice(0, 50));
  });

  useSocketEvent('order:rush_flagged', (order: any) => {
    setNotifications(prev => [
      createNotification(
        'rush_order',
        'Rush Order!',
        `Order for ${order.location?.name || 'Unknown'} flagged as rush`,
        order
      ),
      ...prev,
    ].slice(0, 50));
  });

  useSocketEvent('shift:ended', (shift: any) => {
    if (shift.discrepancy !== 0) {
      setNotifications(prev => [
        createNotification(
          'cash_discrepancy',
          'Cash Discrepancy',
          `Shift ended with ${shift.discrepancy > 0 ? '+' : ''}${shift.discrepancy.toFixed(2)} EGP discrepancy`,
          shift
        ),
        ...prev,
      ].slice(0, 50));
    }
  });

  useSocketEvent('notification:new', (notif: any) => {
    setNotifications(prev => [
      createNotification(
        notif.type || 'info',
        notif.title || 'Notification',
        notif.message || '',
        notif.data
      ),
      ...prev,
    ].slice(0, 50));
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
