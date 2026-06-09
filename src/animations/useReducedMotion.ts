import { useState, useEffect } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Detects the user's `prefers-reduced-motion` OS / browser setting.
 *
 * Every animation component MUST consume this hook and skip all
 * anime.js calls when `prefersReducedMotion` is `true`, letting
 * elements render at their final visual state immediately.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // SSR-safe: default to false when window is unavailable
    if (typeof window === 'undefined') return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(QUERY);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Listen for live changes (user toggles the setting mid-session)
    mql.addEventListener('change', handler);
    // Sync in case the value changed between SSR hydration and mount
    setPrefersReducedMotion(mql.matches);

    return () => mql.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}
