'use client';

import React from 'react';
import { TransitionWrapper } from '@/animations';

/**
 * Client-side wrapper that provides anime.js page transition animations
 * around the Next.js page content (children).
 *
 * Used inside the root layout's <main> to animate route changes:
 * - Exit: fade + slide up (−12px)
 * - Enter: fade + slide down (+12px → 0)
 */
export default function ClientTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TransitionWrapper>{children}</TransitionWrapper>;
}
