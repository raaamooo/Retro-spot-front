'use client';

import { useEffect, useRef, useState, RefObject } from 'react';
import { useThreeDReveal } from '@/hooks/useThreeDReveal';

interface ThreeDRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // in ms
  duration?: number; // in ms
}

export default function ThreeDReveal({
  children,
  className = '',
  delay = 0,
  duration = 500,
}: ThreeDRevealProps) {
  const [ref, isVisible] = useThreeDReveal({ once: true });
  const [hasRendered, setHasRendered] = useState(false);

  useEffect(() => {
    if (isVisible && !hasRendered) {
      setHasRendered(true);
    }
  }, [isVisible, hasRendered]);

  // We don't need to add delay here because the hook already handles visibility.
  // But we want to delay the animation start by the specified delay.
  // We can use CSS transition-delay for that.
  // However, we want to delay the addition of the visible class?
  // Actually, we want the visible class to be added when the element is visible,
  // but the animation should start after the delay.
  // We can handle this by setting a state that becomes true after delay when isVisible is true.
  const [delayedVisible, setDelayedVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const handler = setTimeout(() => setDelayedVisible(true), delay);
      return () => clearTimeout(handler);
    } else {
      setDelayedVisible(false);
      setHasRendered(false);
    }
  }, [isVisible, delay]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        // We'll let the child handle its own animation via the visible class.
        // We don't need to set opacity or transform here.
      }}
    >
      {hasRendered && (
        <div className={`${className} ${delayedVisible ? 'visible' : ''}`}>
          {children}
        </div>
      )}
    </div>
  );
}