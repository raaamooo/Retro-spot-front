'use client';

import { useEffect, RefObject, useRef } from 'react';
import anime from 'animejs';
import { useReducedMotion } from './useReducedMotion';
import { EASE_OUT, DURATION_MED } from './tokens';

export function useSectionTimeline<T extends HTMLElement>(
  ref: RefObject<T | null>,
  dependencies: any[] = []
) {
  const reducedMotion = useReducedMotion();
  const animationRef = useRef<anime.AnimeTimelineInstance | null>(null);

  useEffect(() => {
    const section = ref.current;
    if (!section || reducedMotion) return;

    // Elements to animate
    const line = section.querySelector('.decorative-line');
    const headings = section.querySelectorAll('h1, h2, h3');
    const subtext = section.querySelectorAll('.subtext');
    const cards = section.querySelectorAll('.card-grid > *, .animated-card');

    const isMobile = (typeof window !== 'undefined' && window.matchMedia?.('(max-width: 768px)').matches) || false;

    // Set initial states to prevent FOUC
    if (headings.length) anime.set(headings, { opacity: 0, translateY: isMobile ? 0 : 20 });
    if (subtext.length) anime.set(subtext, { opacity: 0 });
    if (cards.length) anime.set(cards, { opacity: 0, translateY: isMobile ? 0 : 20 });
    // Note: line scales from 0 via its CSS class by default, so we don't need to set it here

    // Set up Intersection Observer to trigger timeline on scroll into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animationRef.current) {
            
            // Build the timeline
            const tl = anime.timeline({
              easing: EASE_OUT,
            });

            // 1. Decorative line
            if (line) {
              tl.add({
                targets: line,
                scaleX: [0, 1],
                duration: 520, // slightly longer for the draw effect
              });
            }

            // 2. Heading
            if (headings.length) {
              tl.add({
                targets: headings,
                opacity: [0, 1],
                translateY: isMobile ? undefined : [20, 0],
                duration: DURATION_MED,
              }, line ? '-=220' : 0); // +200ms offset relative to 520ms line = 300ms start
            }

            // 3. Subtext
            if (subtext.length) {
              tl.add({
                targets: subtext,
                opacity: [0, 1],
                duration: DURATION_MED,
              }, '-=370'); // +150ms offset
            }

            // 4. Cards stagger
            if (cards.length) {
              tl.add({
                targets: cards,
                opacity: [0, 1],
                translateY: isMobile ? undefined : [20, 0],
                duration: DURATION_MED,
                delay: anime.stagger(80, { from: 'center' }), // Wave effect
              }, '-=420'); // +100ms offset
            }

            animationRef.current = tl;
            observer.unobserve(section);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      if (animationRef.current) {
        animationRef.current.pause();
      }
    };
  }, [reducedMotion, ...dependencies]);
}
