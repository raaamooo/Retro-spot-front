'use client';

import { useEffect } from 'react';
import anime from 'animejs';
import { useReducedMotion } from './useReducedMotion';
import { EASE_OUT, DURATION_SHORT } from './tokens';

export function useGlobal3DTilt(selector: string = '.card-3d-tilt', depth: number = 10) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window === 'undefined' || reducedMotion || matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const elements = document.querySelectorAll(selector);
    const cleanups: (() => void)[] = [];

    elements.forEach((elNode) => {
      const el = elNode as HTMLElement;
      let animation: anime.AnimeInstance | null = null;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -depth;
        const rotateY = ((x - centerX) / centerX) * depth;

        animation = anime({
          targets: el,
          rotateX: rotateX,
          rotateY: rotateY,
          scale: 1.02,
          duration: 150,
          easing: 'linear',
        });
      };

      const handleMouseEnter = () => {
        el.style.transformOrigin = 'center center';
        el.style.willChange = 'transform';
      };

      const handleMouseLeave = () => {
        if (animation) animation.pause();
        el.style.willChange = 'auto';
        
        anime({
          targets: el,
          rotateX: 0,
          rotateY: 0,
          scale: 1,
          duration: DURATION_SHORT * 2,
          easing: EASE_OUT,
        });
      };

      el.addEventListener('mousemove', handleMouseMove);
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);

      cleanups.push(() => {
        el.removeEventListener('mousemove', handleMouseMove);
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
        if (animation) animation.pause();
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [reducedMotion, selector, depth]);
}
