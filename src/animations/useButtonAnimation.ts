'use client';

import { useEffect, useRef, useCallback, type RefObject } from 'react';
import anime from 'animejs';
import { useReducedMotion } from './useReducedMotion';
import { DURATION_SHORT, EASE_OUT } from './tokens';

/**
 * Attaches hover micro-interactions to a primary CTA button:
 *
 * - **Hover in**: scale 1 → 1.03  (durationShort, easeOut)
 * - **Click**: scale 1.03 → 0.96 → 1  (punchy timeline)
 * - **Hover out**: scale → 1
 *
 * The hook returns a ref to attach to the `<button>` element.
 * All animations are skipped when `prefers-reduced-motion` is active.
 */
export function useButtonAnimation<T extends HTMLElement = HTMLButtonElement>(): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const reducedMotion = useReducedMotion();
  // Track running hover animation so we can cancel it
  const hoverAnim = useRef<anime.AnimeInstance | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (reducedMotion || !ref.current) return;
    hoverAnim.current?.pause();
    hoverAnim.current = anime({
      targets: ref.current,
      scale: [1, 1.03],
      duration: DURATION_SHORT,
      easing: EASE_OUT,
    });
  }, [reducedMotion]);

  const handleMouseLeave = useCallback(() => {
    if (reducedMotion || !ref.current) return;
    hoverAnim.current?.pause();
    hoverAnim.current = anime({
      targets: ref.current,
      scale: 1,
      duration: DURATION_SHORT,
      easing: EASE_OUT,
    });
  }, [reducedMotion]);

  const handleClick = useCallback(() => {
    if (reducedMotion || !ref.current) return;
    // Cancel any running hover animation so the timeline takes over
    hoverAnim.current?.pause();

    const tl = anime.timeline({
      targets: ref.current,
      easing: EASE_OUT,
    });

    tl.add({
      scale: 0.96,
      duration: 100,
    }).add({
      scale: 1,
      duration: DURATION_SHORT,
    });
  }, [reducedMotion]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('click', handleClick);

    return () => {
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('click', handleClick);
    };
  }, [handleMouseEnter, handleMouseLeave, handleClick]);

  return ref;
}
