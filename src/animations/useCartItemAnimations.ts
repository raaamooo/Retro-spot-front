'use client';

import { useEffect, RefObject } from 'react';
import anime from 'animejs';
import { useReducedMotion } from './useReducedMotion';
import { EASE_OUT, DURATION_MED, STAGGER_DELAY, DURATION_SHORT } from './tokens';

export function useCartItemEntrance(
  containerRef: RefObject<HTMLElement | null>,
  isOpen: boolean
) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || !isOpen || !containerRef.current) return;

    const items = containerRef.current.querySelectorAll('.cartItemAnim');
    if (items.length === 0) return;

    anime.set(items, { translateX: -20, opacity: 0 });

    anime({
      targets: items,
      translateX: 0,
      opacity: 1,
      duration: DURATION_MED,
      easing: EASE_OUT,
      delay: anime.stagger(STAGGER_DELAY),
    });
  }, [isOpen, reducedMotion, containerRef]);
}

export function animateCartItemRemoval(
  element: HTMLElement,
  reducedMotion: boolean,
  onComplete: () => void
) {
  if (reducedMotion) {
    onComplete();
    return;
  }
  
  anime.timeline({
    complete: onComplete,
  }).add({
    targets: element,
    height: [element.offsetHeight, 0],
    opacity: [1, 0],
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    duration: DURATION_SHORT,
    easing: 'easeInQuart',
  });
}

export function pulseCartQuantity(
  element: HTMLElement | null,
  reducedMotion: boolean
) {
  if (reducedMotion || !element) return;
  anime({
    targets: element,
    scale: [1, 1.3, 1],
    duration: DURATION_SHORT,
    easing: EASE_OUT,
  });
}

export function flashOrderTotal(
  element: HTMLElement | null,
  reducedMotion: boolean
) {
  if (reducedMotion || !element) return;
  anime({
    targets: element,
    scale: [1, 1.08, 1],
    textShadow: [
      '0 0 0px var(--primary)',
      '0 0 10px var(--primary)',
      '0 0 0px var(--primary)',
    ],
    duration: DURATION_SHORT,
    easing: EASE_OUT,
  });
}
