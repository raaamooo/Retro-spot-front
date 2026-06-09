/**
 * Premium Cup Lid Scroll Animation for RetroSpot
 * Handles scroll-based animation of coffee cup lid lifting to reveal cafe scene
 */

import { useEffect, useState, useCallback } from 'react';

/**
 * Custom hook to track scroll progress for cup lid animation
 * @returns {Object} Object containing scroll progress and animation values
 */
export function useCupLidScrollAnimation() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate scroll progress (0 at top, 1 at trigger point)
  const handleScroll = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const triggerPoint = windowHeight * 0.8; // Start animating when 80% of viewport is scrolled

    // Calculate progress from 0 to 1 based on scroll position
    let progress = scrollTop / triggerPoint;
    progress = Math.max(0, Math.min(1, progress)); // Clamp between 0 and 1

    setScrollProgress(progress);
    setIsAnimating(progress > 0 && progress < 1);
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Return animation values for the cup lid
  const lidRotation = scrollProgress * -15; // Rotate lid up to -15 degrees
  const lidTranslationY = scrollProgress * 20; // Lift lid up to 20px
  const lidOpacity = 1 - (scrollProgress * 0.3); // Slightly fade lid as it lifts
  const revealOpacity = scrollProgress; // Increase reveal opacity as lid lifts

  return {
    scrollProgress,
    isAnimating,
    lidRotation,
    lidTranslationY,
    lidOpacity,
    revealOpacity
  };
}

export default useCupLidScrollAnimation;