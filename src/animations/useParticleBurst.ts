'use client';

import { useCallback } from 'react';
import anime from 'animejs';
import { useReducedMotion } from './useReducedMotion';
import { EASE_OUT, DURATION_MED } from './tokens';

export function useParticleBurst() {
  const reducedMotion = useReducedMotion();

  const triggerBurst = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (reducedMotion) return;

    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const particles: HTMLElement[] = [];
    const numParticles = 8;

    // Create particles
    for (let i = 0; i < numParticles; i++) {
      const p = document.createElement('div');
      p.style.position = 'fixed';
      p.style.left = `${centerX}px`;
      p.style.top = `${centerY}px`;
      p.style.width = '6px';
      p.style.height = '6px';
      p.style.borderRadius = '50%';
      p.style.backgroundColor = 'var(--accent)';
      p.style.pointerEvents = 'none';
      p.style.zIndex = '9999';
      document.body.appendChild(p);
      particles.push(p);
    }

    // Animate particles
    anime({
      targets: particles,
      translateX: () => anime.random(-40, 40),
      translateY: () => anime.random(-40, -80),
      scale: [1, 0],
      opacity: [1, 0],
      duration: DURATION_MED,
      easing: EASE_OUT,
      complete: () => {
        particles.forEach((p) => p.remove());
      },
    });
  }, [reducedMotion]);

  return triggerBurst;
}
