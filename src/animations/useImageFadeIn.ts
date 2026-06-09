'use client';

import { useCallback } from 'react';
import { animate } from './animate';
import { useReducedMotion } from './useReducedMotion';
import { EASE_OUT, DURATION_MED } from './tokens';

export function useImageFadeIn() {
  const reducedMotion = useReducedMotion();

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;

    // Set initial state before animating if not reduced motion
    if (!reducedMotion) {
      target.style.opacity = '0';
      target.style.filter = 'blur(4px)';
    }

    animate({
      targets: target,
      opacity: [0, 1],
      filter: ['blur(4px)', 'blur(0px)'],
      duration: DURATION_MED,
      easing: EASE_OUT,
      reducedMotion,
    });
  }, [reducedMotion]);

  return handleImageLoad;
}
