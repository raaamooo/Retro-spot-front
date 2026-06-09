import { useEffect, useState, useCallback } from 'react';
import anime from 'animejs';

/**
 * Custom hook to track scroll progress for takeaway cup lid animation using animejs
 * @param {React.MutableRefObject<HTMLDivElement | null>} lidRef - Ref to the lid element
 * @param {React.MutableRefObject<HTMLDivElement | null>} buttonsRef - Ref to the buttons container
 * @returns {{ isAnimating: boolean }}
 */
export function useTakeawayCupScroll(lidRef, buttonsRef) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate scroll progress (0 at top, 1 at trigger point)
  const handleScroll = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const triggerPoint = windowHeight * 0.8; // Start animating when 80% of viewport is scrolled

    // Calculate progress from 0 to 1 based on scroll position
    let progress = scrollTop / triggerPoint;
    progress = Math.max(0, Math.min(1, progress)); // Clamp between 0 and 1
    console.debug('TakeawayCupScroll progress:', progress);

    // Check for reduced motion preference
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      // Return static styles (lid closed, buttons hidden)
      if (lidRef.current) {
        lidRef.current.style.transform = 'translateX(-50%) rotate(0deg) translateY(0px)';
        lidRef.current.style.opacity = '1';
      }
      if (buttonsRef.current) {
        buttonsRef.current.style.opacity = '0';
      }
      setIsAnimating(false);
      return;
    }

    // Animate lid with animejs
    anime.remove(lidRef.current);
    anime({
      targets: lidRef.current,
      rotate: [-15 * progress, 0], // from 0 to -15deg
      translateY: [0, -20 * progress], // from 0 to -20px
      opacity: [1, 1 - progress * 0.3], // slight fade
      easing: 'linear',
      duration: 0, // instant updates
      update: () => {
        // animejs updates inline styles directly
      }
    });

    // Animate buttons opacity
    anime.remove(buttonsRef.current);
    anime({
      targets: buttonsRef.current,
      opacity: [0, progress], // fade in as lid lifts
      easing: 'linear',
      duration: 0,
      update: () => {
        // animejs updates inline styles directly
      }
    });

    setIsAnimating(progress > 0 && progress < 1);
  }, []);

  useEffect(() => {
    // Initial call to set up refs and initial state
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return { isAnimating };
}

export default useTakeawayCupScroll;