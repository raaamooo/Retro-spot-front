'use client';

import { useEffect, useRef } from 'react';
import { socket } from '@/lib/socket';

/**
 * Hook to subscribe to a Socket.IO event with automatic cleanup.
 *
 * @param eventName - The event name to listen for
 * @param handler - Callback invoked when the event fires
 *
 * @example
 * ```tsx
 * useSocketEvent(EVENTS.ORDER_NEW, (order) => {
 *   setOrders(prev => [order, ...prev]);
 * });
 * ```
 */
export function useSocketEvent<T = any>(eventName: string, handler: (data: T) => void) {
  const savedHandler = useRef(handler);

  // Keep the handler ref up-to-date so we don't re-subscribe on every render
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventHandler = (data: T) => savedHandler.current(data);

    socket.on(eventName, eventHandler);

    return () => {
      socket.off(eventName, eventHandler);
    };
  }, [eventName]);
}

/**
 * Returns the raw socket instance for imperative use.
 * Prefer useSocketEvent for listening; use this only for
 * connection state checks.
 */
export function useSocket() {
  return socket;
}
