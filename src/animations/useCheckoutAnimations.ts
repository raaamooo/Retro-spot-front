'use client';

import { useEffect, RefObject } from 'react';
import anime from 'animejs';
import { useReducedMotion } from './useReducedMotion';
import { EASE_OUT, EASE_IN_OUT, DURATION_MED, STAGGER_DELAY } from './tokens';

export function useCheckoutStagger(
  containerRef: RefObject<HTMLElement | null>,
  step: number
) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || !containerRef.current) return;

    const fields = containerRef.current.querySelectorAll('.checkoutFieldAnim');
    if (fields.length === 0) return;

    anime.set(fields, { translateY: 16, opacity: 0 });

    anime({
      targets: fields,
      translateY: 0,
      opacity: 1,
      duration: DURATION_MED,
      easing: EASE_OUT,
      delay: anime.stagger(STAGGER_DELAY),
    });
  }, [step, reducedMotion, containerRef]);
}

export function useStepIndicator(
  barRef: RefObject<HTMLElement | null>,
  progressPercentage: number
) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      if (barRef.current) barRef.current.style.width = `${progressPercentage}%`;
      return;
    }

    if (barRef.current) {
      anime({
        targets: barRef.current,
        width: `${progressPercentage}%`,
        duration: DURATION_MED,
        easing: EASE_IN_OUT,
      });
    }
  }, [progressPercentage, reducedMotion, barRef]);
}

export function animateSuccessCheckmark(
  pathRef: RefObject<SVGPathElement | null>,
  cardRef: RefObject<HTMLElement | null>,
  reducedMotion: boolean
) {
  if (reducedMotion) {
    if (pathRef.current) pathRef.current.style.strokeDashoffset = '0';
    if (cardRef.current) {
      cardRef.current.style.opacity = '1';
      cardRef.current.style.transform = 'translateY(0)';
    }
    return;
  }

  const tl = anime.timeline({ autoplay: true });

  if (pathRef.current) {
    anime.set(pathRef.current, { strokeDashoffset: anime.setDashoffset });
    tl.add({
      targets: pathRef.current,
      strokeDashoffset: [anime.setDashoffset, 0],
      duration: DURATION_MED,
      easing: EASE_OUT,
    });
  }

  if (cardRef.current) {
    anime.set(cardRef.current, { opacity: 0, translateY: 10 });
    tl.add({
      targets: cardRef.current,
      opacity: [0, 1],
      translateY: [10, 0],
      duration: DURATION_MED,
      easing: EASE_OUT,
    }, '-=200');
  }
}
