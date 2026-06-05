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
  ORDER_ITEM_STATUS_UPDATED: 'order_item:status_updated',
  ORDER_RUSH_FLAGGED: 'order:rush_flagged',

  // ── Waiter Calls ──
  WAITER_CALL_NEW: 'waiter_call:new',
  WAITER_CALL_RESOLVED: 'waiter_call:resolved',

  // ── Inventory (v2) ──
  INVENTORY_LOW_STOCK: 'inventory:low_stock',
  INVENTORY_OUT_OF_STOCK: 'inventory:out_of_stock',
  INVENTORY_STOCK_UPDATED: 'inventory:stock_updated',
  INVENTORY_RESTOCK_LOGGED: 'inventory:restock_logged',
  MENU_ITEM_UNAVAILABLE: 'menu:item_unavailable',
  MENU_ITEM_AVAILABLE: 'menu:item_available',
  MENU_AVAILABILITY: 'menu:availability',

  // ── Bookings ──
  BOOKING_NEW: 'booking:new',
  BOOKING_STATUS_UPDATED: 'booking:status_updated',

  // ── Arts & Bids ──
  BID_NEW: 'bid:new',
  BID_DELETED: 'bid:deleted',
  ART_STATUS_UPDATED: 'art:status_updated',

  // ── Accounting ──
  ACCOUNTING_UPDATED: 'accounting:updated',

  // ── System Configuration ──
  CONFIG_UPDATED: 'config:updated',

  // ── Shifts ──
  SHIFT_STARTED: 'shift:started',
  SHIFT_ENDED: 'shift:ended',

  // ── Notifications ──
  NOTIFICATION_NEW: 'notification:new',
} as const;
