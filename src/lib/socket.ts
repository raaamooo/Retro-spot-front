import { io } from 'socket.io-client';
import { SOCKET_URL } from './constants';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
});

/**
 * ═══════════════════════════════════════════════════════════════
 *  RETRO SPOT — Socket Event Name Constants (Frontend Mirror)
 * ═══════════════════════════════════════════════════════════════
 *
 *  These MUST match the backend socketEvents.ts EVENTS object.
 *  All events flow SERVER → CLIENT only. Client mutations use
 *  REST API calls, not socket.emit().
 *
 * ═══════════════════════════════════════════════════════════════
 */

export const EVENTS = {
  // ── Orders ──
  ORDER_NEW: 'order:new',
  ORDER_STATUS_UPDATED: 'order:status_updated',

  // ── Waiter Calls ──
  WAITER_CALL_NEW: 'waiter_call:new',
  WAITER_CALL_RESOLVED: 'waiter_call:resolved',

  // ── Inventory ──
  INVENTORY_UPDATED: 'inventory:updated',
  INVENTORY_LOW_STOCK: 'inventory:low_stock',
  MENU_AVAILABILITY: 'menu:availability',

  // ── Bookings ──
  BOOKING_NEW: 'booking:new',
  BOOKING_STATUS_UPDATED: 'booking:status_updated',

  // ── Arts & Bids ──
  BID_NEW: 'bid:new',
  ART_STATUS_UPDATED: 'art:status_updated',

  // ── Accounting ──
  ACCOUNTING_UPDATED: 'accounting:updated',
} as const;
