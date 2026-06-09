'use client';

import { useEffect } from 'react';
import { useReducedMotion } from './useReducedMotion';

export function useParallax(selector: string, speed: number = 0.15) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Disable on reduced motion or mobile devices
    if (typeof window === 'undefined' || reducedMotion || matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) return;

    let ticking = false;

    const updateParallax = () => {
      const scrollY = window.scrollY;
      elements.forEach((elNode) => {
        const el = elNode as HTMLElement;
        const rect = el.getBoundingClientRect();
        
        // Only animate if element is in/near viewport
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const relativeScroll = scrollY - (el.offsetTop - window.innerHeight / 2);
          const yPos = relativeScroll * speed;
          el.style.transform = `translate3d(0, ${yPos}px, 0)`;
        }
      });
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Initial call
    updateParallax();

    return () => {
      window.removeEventListener('scroll', onScroll);
      elements.forEach((elNode) => {
        const el = elNode as HTMLElement;
        el.style.transform = '';
      });
    };
  }, [selector, speed, reducedMotion]);
}
