'use client';

import React from 'react';
import { useAnimeScrollReveal } from '@/animations';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // in ms
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number; // in px
  duration?: number; // in ms
}

/**
 * Scroll-reveal wrapper powered by Anime.js.
 *
 * Child content fades + slides into view when the element crosses
 * the viewport threshold (15 %). Respects `prefers-reduced-motion`.
 */
export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  distance = 24,
  duration = 520,
}: ScrollRevealProps) {
  const [ref] = useAnimeScrollReveal<HTMLDivElement>({
    delay,
    direction,
    distance,
    duration,
  });

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}
