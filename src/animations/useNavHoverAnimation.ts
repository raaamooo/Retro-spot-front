'use client';

import { useEffect, useRef, useCallback, type RefObject } from 'react';
import anime from 'animejs';
import { useReducedMotion } from './useReducedMotion';
import { DURATION_SHORT, EASE_OUT } from './tokens';

/**
 * Animates a pseudo-element underline scaleX on hover for nav links.
 *
 * This hook controls a **real child element** acting as the underline
 * (since anime.js cannot target `::after`). The link must contain a
 * child `<span className="nav-underline" />` positioned at the bottom.
 *
 * Alternatively, call this hook and it will *create* the underline
 * element automatically on mount.
 *
 * Animation:
 * - Hover in:  scaleX 0 → 1 (origin: left), durationShort, easeOut
 * - Hover out: scaleX 1 → 0 (origin: right), reverse
 */
export function useNavHoverAnimation<T extends HTMLElement = HTMLAnchorElement>(): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const reducedMotion = useReducedMotion();
  const underlineRef = useRef<HTMLSpanElement | null>(null);
  const animInstance = useRef<anime.AnimeInstance | null>(null);

  // Create or find the underline element on mount
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Ensure the nav link is positioned
    const computed = getComputedStyle(el);
    if (computed.position === 'static') {
      el.style.position = 'relative';
    }

    let underline = el.querySelector<HTMLSpanElement>('.nav-underline');
    if (!underline) {
      underline = document.createElement('span');
      underline.className = 'nav-underline';
      Object.assign(underline.style, {
        position: 'absolute',
        bottom: '0',
        left: '0',
        width: '100%',
        height: '2px',
        backgroundColor: 'var(--accent)',
        transformOrigin: 'left',
        transform: 'scaleX(0)',
        pointerEvents: 'none',
      });
      el.appendChild(underline);
    }

    underlineRef.current = underline;

    return () => {
      // Clean up only if we created it
      if (underline && underline.parentNode === el) {
        el.removeChild(underline);
      }
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (reducedMotion || !underlineRef.current) return;
    const ul = underlineRef.current;
    ul.style.transformOrigin = 'left';
    animInstance.current?.pause();
    animInstance.current = anime({
      targets: ul,
      scaleX: [0, 1],
      duration: DURATION_SHORT,
      easing: EASE_OUT,
    });
  }, [reducedMotion]);

  const handleMouseLeave = useCallback(() => {
    if (reducedMotion || !underlineRef.current) return;
    const ul = underlineRef.current;
    ul.style.transformOrigin = 'right';
    animInstance.current?.pause();
    animInstance.current = anime({
      targets: ul,
      scaleX: [1, 0],
      duration: DURATION_SHORT,
      easing: EASE_OUT,
    });
  }, [reducedMotion]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseEnter, handleMouseLeave]);

  return ref;
}
