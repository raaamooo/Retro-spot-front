'use client';

import { useEffect, useRef, RefObject } from 'react';
import { animate } from './animate';
import { useReducedMotion } from './useReducedMotion';
import { EASE_IN_OUT, DURATION_SHORT } from './tokens';

export function useTabIndicator<T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  activeSelector: string,
  indicatorClassName: string
) {
  const reducedMotion = useReducedMotion();
  const indicatorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!indicatorRef.current) {
      const indicator = document.createElement('div');
      indicator.className = indicatorClassName;
      indicator.style.position = 'absolute';
      // Basic positioning to match tabs, CSS class should handle height, background, border-radius
      indicator.style.top = '10px'; 
      indicator.style.bottom = '10px';
      indicator.style.left = '0';
      indicator.style.zIndex = '-1';
      indicator.style.pointerEvents = 'none';
      
      // Ensure container can house absolute children correctly
      if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
      }
      // Ensure container has zIndex to show pill underneath text but above background
      container.style.zIndex = '1';
      
      container.appendChild(indicator);
      indicatorRef.current = indicator;
    }

    const activeTab = container.querySelector(activeSelector) as HTMLElement;
    const indicator = indicatorRef.current;

    if (activeTab && indicator) {
      const offsetLeft = activeTab.offsetLeft;
      const offsetWidth = activeTab.offsetWidth;
      // We also need offsetTop in case tabs wrap (e.g. coffee hot/iced tabs)
      const offsetTop = activeTab.offsetTop;
      const offsetHeight = activeTab.offsetHeight;

      if (!indicator.style.width) {
        // First render, snap without animation
        indicator.style.width = `${offsetWidth}px`;
        indicator.style.height = `${offsetHeight}px`;
        indicator.style.transform = `translate(${offsetLeft}px, ${offsetTop}px)`;
        // Reset top/bottom if we use translate for Y
        indicator.style.top = '0';
        indicator.style.bottom = 'auto';
      } else {
        animate({
          targets: indicator,
          width: offsetWidth,
          height: offsetHeight,
          translateX: offsetLeft,
          translateY: offsetTop,
          duration: DURATION_SHORT,
          easing: EASE_IN_OUT,
          reducedMotion,
        });
      }
    }
  }, [activeSelector, reducedMotion, indicatorClassName]);
}
