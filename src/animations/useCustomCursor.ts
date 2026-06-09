'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { useReducedMotion } from './useReducedMotion';

export function useCustomCursor() {
  const reducedMotion = useReducedMotion();
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable on touch devices
    if (typeof window === 'undefined' || reducedMotion || matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const cursor = cursorRef.current;
    const cursorDot = cursorDotRef.current;
    if (!cursor || !cursorDot) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    
    // Position dot instantly
    anime.set(cursorDot, { x: mouseX, y: mouseY });
    // Position outer ring instantly
    anime.set(cursor, { x: mouseX, y: mouseY });

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Small dot follows instantly
      anime({
        targets: cursorDot,
        x: mouseX,
        y: mouseY,
        duration: 0,
        easing: 'linear'
      });

      // Outer ring follows with spring/easing delay
      anime({
        targets: cursor,
        x: mouseX,
        y: mouseY,
        duration: 400,
        easing: 'easeOutExpo'
      });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable = target.closest('a') || 
                          target.closest('button') || 
                          target.closest('.interactive') ||
                          window.getComputedStyle(target).cursor === 'pointer';
      
      if (isClickable) {
        anime({
          targets: cursor,
          scale: 1.5,
          opacity: 0.5,
          duration: 300,
          easing: 'easeOutQuart'
        });
        anime({
          targets: cursorDot,
          opacity: 0,
          duration: 300,
          easing: 'easeOutQuart'
        });
      } else {
        anime({
          targets: cursor,
          scale: 1,
          opacity: 1,
          duration: 300,
          easing: 'easeOutQuart'
        });
        anime({
          targets: cursorDot,
          opacity: 1,
          duration: 300,
          easing: 'easeOutQuart'
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    // Initial show
    anime({
      targets: [cursor, cursorDot],
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutExpo'
    });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [reducedMotion]);

  return { cursorRef, cursorDotRef };
}
