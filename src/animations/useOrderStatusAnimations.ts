'use client';

import { useEffect, RefObject } from 'react';
import anime from 'animejs';
import { useReducedMotion } from './useReducedMotion';
import { EASE_OUT, EASE_IN_OUT, DURATION_MED, STAGGER_DELAY } from './tokens';

export function useOrderStatusTimeline(
  containerRef: RefObject<HTMLElement | null>,
  isOpen: boolean
) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || !isOpen || !containerRef.current) return;

    const nodes = containerRef.current.querySelectorAll('.statusNodeAnim');
    if (nodes.length === 0) return;

    anime.set(nodes, { scale: 0.7, opacity: 0 });

    anime({
      targets: nodes,
      scale: [0.7, 1],
      opacity: [0, 1],
      duration: DURATION_MED,
      easing: EASE_OUT,
      delay: anime.stagger(STAGGER_DELAY),
    });
  }, [isOpen, reducedMotion, containerRef]);
}

export function useActiveStepPulse(
  nodeRef: RefObject<HTMLElement | null>,
  isActive: boolean
) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || !nodeRef.current || !isActive) return;

    const animation = anime({
      targets: nodeRef.current,
      scale: [1, 1.08, 1],
      duration: 2000,
      easing: EASE_IN_OUT,
      loop: true,
    });

    return () => {
      animation.pause();
    };
  }, [isActive, reducedMotion, nodeRef]);
}

export function useProgressLine(
  lineRef: RefObject<HTMLElement | null>,
  isCompleted: boolean
) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!lineRef.current) return;
    
    if (reducedMotion) {
      lineRef.current.style.transform = isCompleted ? 'scaleY(1)' : 'scaleY(0)';
      return;
    }

    if (isCompleted) {
      anime({
        targets: lineRef.current,
        scaleY: [0, 1],
        duration: DURATION_MED,
        easing: EASE_OUT,
        // Origin should be set to top in CSS (transform-origin: top)
      });
    } else {
      anime.set(lineRef.current, { scaleY: 0 });
    }
  }, [isCompleted, reducedMotion, lineRef]);
}
