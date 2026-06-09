'use client';

import { useEffect, useRef } from 'react';
import { animate } from './animate';
import { useReducedMotion } from './useReducedMotion';
import { DURATION_MED, EASE_OUT } from './tokens';

/**
 * Animates a container on mount: opacity 0→1, translateY +18→0.
 * Attach the returned ref to the outermost wrapper of any page.
 *
 * If `prefers-reduced-motion` is active the element renders at its
 * final state immediately — no flash, no movement.
 */
export function usePageEntrance<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Set initial state before animation frame
    el.style.opacity = reducedMotion ? '1' : '0';
    el.style.transform = reducedMotion ? 'none' : 'translateY(18px)';

    if (reducedMotion) return;

    // Let the browser paint the initial state, then animate
    requestAnimationFrame(() => {
      animate({
        targets: el,
        opacity: [0, 1],
        translateY: [18, 0],
        duration: DURATION_MED,
        easing: EASE_OUT,
        reducedMotion,
      });
    });
  }, [reducedMotion]);

  return ref;
}
