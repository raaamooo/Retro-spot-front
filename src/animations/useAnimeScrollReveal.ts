'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { animate } from './animate';
import { useReducedMotion } from './useReducedMotion';
import { DURATION_MED, EASE_OUT } from './tokens';

export interface UseScrollRevealOptions {
  /** IntersectionObserver visibility threshold (0–1). @default 0.15 */
  threshold?: number;
  /** Extra root margin for triggering earlier / later. */
  rootMargin?: string;
  /** Trigger only once (stay revealed). @default true */
  once?: boolean;
  /** Override entrance duration (ms). */
  duration?: number;
  /** Override easing. */
  easing?: string;
  /** Extra delay before animation starts (ms). */
  delay?: number;
  /** Direction the element slides from. @default 'up' */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Slide distance in px. @default 24 */
  distance?: number;
}

/**
 * Anime.js-powered scroll-reveal hook.
 *
 * Usage:
 * ```tsx
 * const [ref, isVisible] = useAnimeScrollReveal<HTMLDivElement>();
 * return <div ref={ref} style={{ opacity: 0 }}>…</div>;
 * ```
 *
 * The element **must** start with `opacity: 0` (inline style) to prevent
 * a flash of unstyled content before the observer fires.
 */
export function useAnimeScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollRevealOptions = {},
): [RefObject<T | null>, boolean] {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -40px 0px',
    once = true,
    duration = DURATION_MED,
    easing = EASE_OUT,
    delay = 0,
    direction = 'up',
    distance = 24,
  } = options;

  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced-motion: immediately show at final state
    if (reducedMotion) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);

          // Build directional properties
          const props: Record<string, [number, number]> = {
            opacity: [0, 1],
          };

          if (direction !== 'none') {
            const axis =
              direction === 'left' || direction === 'right'
                ? 'translateX'
                : 'translateY';
            const sign =
              direction === 'up' || direction === 'left' ? 1 : -1;
            props[axis] = [distance * sign, 0];
          }

          animate({
            targets: el,
            ...props,
            duration,
            easing,
            delay,
            reducedMotion: false,
          });

          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
          // Reset for re-entry
          el.style.opacity = '0';
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  return [ref, isVisible];
}
