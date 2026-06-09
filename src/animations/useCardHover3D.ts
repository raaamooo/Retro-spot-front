'use client';

import { useEffect, RefObject } from 'react';
import anime from 'animejs';
import { useReducedMotion } from './useReducedMotion';
import { EASE_OUT, DURATION_SHORT } from './tokens';

export function useCardHover3D<T extends HTMLElement>(
  ref: RefObject<T | null>,
  depth: number = 10
) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) return;

    let animation: anime.AnimeInstance | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -depth;
      const rotateY = ((x - centerX) / centerX) * depth;

      // Animate smoothly to the current mouse position
      animation = anime({
        targets: el,
        rotateX: rotateX,
        rotateY: rotateY,
        scale: 1.02,
        duration: 100,
        easing: 'linear',
      });
    };

    const handleMouseEnter = () => {
      el.style.transformOrigin = 'center center';
    };

    const handleMouseLeave = () => {
      if (animation) animation.pause();
      
      // Settle back to original position smoothly
      anime({
        targets: el,
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        duration: DURATION_SHORT * 2, // Slower settle
        easing: EASE_OUT,
      });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
      if (animation) animation.pause();
    };
  }, [reducedMotion, depth]);
}
