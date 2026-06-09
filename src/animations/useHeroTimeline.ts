'use client';

import { useEffect, RefObject } from 'react';
import anime from 'animejs';
import { useReducedMotion } from './useReducedMotion';
import { EASE_OUT, DURATION_MED, DURATION_LONG } from './tokens';

export function useHeroTimeline(
  heroVisualRef: RefObject<HTMLElement | null>,
  headlineRef: RefObject<HTMLElement | null>,
  subheadRef: RefObject<HTMLElement | null>,
  ctaRef: RefObject<HTMLElement | null>
) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const timeline = anime.timeline({
      autoplay: true,
    });

    if (heroVisualRef.current) {
      heroVisualRef.current.style.opacity = '0';
      timeline.add({
        targets: heroVisualRef.current,
        opacity: [0, 1],
        duration: DURATION_LONG, // 900ms
        easing: EASE_OUT,
      });
    }

    if (headlineRef.current) {
      headlineRef.current.style.transform = 'translateY(40px)';
      headlineRef.current.style.opacity = '0';
      timeline.add({
        targets: headlineRef.current,
        translateY: [40, 0],
        opacity: [0, 1],
        duration: DURATION_LONG,
        easing: EASE_OUT,
      }, 200); // After 200ms
    }

    if (subheadRef.current) {
      subheadRef.current.style.opacity = '0';
      timeline.add({
        targets: subheadRef.current,
        opacity: [0, 1],
        duration: DURATION_MED, // 520ms
        easing: EASE_OUT,
      }, 400); // After 400ms
    }

    if (ctaRef.current) {
      ctaRef.current.style.opacity = '0';
      ctaRef.current.style.transform = 'scale(0.9)';
      timeline.add({
        targets: ctaRef.current,
        opacity: [0, 1],
        scale: [0.9, 1],
        duration: DURATION_MED,
        easing: EASE_OUT,
      }, 600); // After 600ms
    }

    return () => {
      timeline.pause();
    };
  }, [reducedMotion, heroVisualRef, headlineRef, subheadRef, ctaRef]);
}
