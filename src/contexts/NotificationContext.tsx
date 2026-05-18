'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/lib/constants';

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
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('inventory:low_stock', (ingredient: any) => {
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

    socket.on('order:rush_flagged', (order: any) => {
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

    socket.on('shift:ended', (shift: any) => {
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

    socket.on('notification:new', (notif: any) => {
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

    return () => {
      socket.disconnect();
    };
  }, []);

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
