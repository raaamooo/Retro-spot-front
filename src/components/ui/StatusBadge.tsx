'use client';

import React from 'react';

type BadgeVariant =
  | 'placed'
  | 'barista'
  | 'waiter'
  | 'cashier'
  | 'completed'
  | 'archived'
  | 'active'
  | 'resolved'
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'open'
  | 'printed'
  | 'paid'
  | 'cleared'
  | 'low_stock'
  | 'in_stock'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'winning'
  | 'lost'
  | 'verified'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'default';

interface StatusBadgeProps {
  status: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

const variantMap: Record<string, string> = {
  // Order flow
  placed: 'bg-info-bg text-info',
  barista: 'bg-warning-bg text-warning',
  waiter: 'bg-info-bg text-info',
  cashier: 'bg-primary/15 text-primary',
  completed: 'bg-success-bg text-success',
  archived: 'bg-surface-elevated text-muted',

  // Waiter calls
  active: 'bg-warning-bg text-warning',
  resolved: 'bg-success-bg text-success',

  // Booking
  pending: 'bg-warning-bg text-warning',
  confirmed: 'bg-success-bg text-success',
  cancelled: 'bg-danger-bg text-danger',

  // Receipt
  open: 'bg-info-bg text-info',
  printed: 'bg-primary/15 text-primary',
  paid: 'bg-success-bg text-success',
  cleared: 'bg-surface-elevated text-muted',

  // Inventory
  low_stock: 'bg-danger-bg text-danger',
  in_stock: 'bg-success-bg text-success',

  // Art
  submitted: 'bg-info-bg text-info',
  approved: 'bg-success-bg text-success',
  rejected: 'bg-danger-bg text-danger',
  selected_for_bid: 'bg-primary/15 text-primary',
  sold: 'bg-success-bg text-success',
  winning: 'bg-success-bg text-success',
  lost: 'bg-danger-bg text-danger',

  // Payment
  verified: 'bg-success-bg text-success',

  // Semantic
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
  default: 'bg-surface-elevated text-muted',
};

export default function StatusBadge({
  status,
  children,
  size = 'sm',
  pulse = false,
}: StatusBadgeProps) {
  const key = status.toLowerCase().replace(/\s+/g, '_');
  const classes = variantMap[key] || variantMap.default;
  const label = children || status.replace(/_/g, ' ');

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide rounded-full
        ${classes}
        ${size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3.5 py-1 text-xs'}
      `}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current`} />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {label}
    </span>
  );
}
