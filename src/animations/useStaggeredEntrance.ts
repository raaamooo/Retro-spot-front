'use client';

import { useEffect, RefObject } from 'react';
import anime from 'animejs';
import { animate } from './animate';
import { useReducedMotion } from './useReducedMotion';
import { EASE_OUT, DURATION_MED, STAGGER_DELAY } from './tokens';

export function useStaggeredEntrance<T extends HTMLElement>(
  ref: RefObject<T | null>,
  dependencies: any[] = [],
  itemSelector: string = '> *'
) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const items = Array.from(el.querySelectorAll(itemSelector)) as HTMLElement[];
    if (items.length === 0) return;
    
    const isMobile = (typeof window !== 'undefined' && window.matchMedia?.('(max-width: 768px)').matches) || false;

    // Reset initial state for animation if not reduced motion
    if (!reducedMotion) {
      items.forEach((item) => {
        item.style.opacity = '0';
        if (!isMobile) {
          item.style.transform = 'translateY(20px)';
        }
      });
    }

    const animation = animate({
      targets: items,
      opacity: [0, 1],
      translateY: isMobile ? undefined : [20, 0],
      duration: DURATION_MED,
      easing: EASE_OUT,
      delay: anime.stagger(STAGGER_DELAY, { from: 'center' }),
      reducedMotion,
    });

    return () => {
      if (animation) animation.pause();
    };
  }, [reducedMotion, ...dependencies]);
}
