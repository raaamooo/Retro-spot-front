'use client';

import { useEffect, useRef, useState, RefObject } from 'react';
import { useThreeDReveal } from '@/hooks/useThreeDReveal';

interface ScrollRevealThreeDProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // in ms
  duration?: number; // in ms
  once?: boolean;
  applyVisibleToRoot?: boolean;
}

export default function ScrollRevealThreeD({
  children,
  className = '',
  delay = 0,
  duration = 500,
  once = true,
  applyVisibleToRoot = false,
}: ScrollRevealThreeDProps) {
  const [ref, isVisible] = useThreeDReveal({ delay, once });
  const [hasRendered, setHasRendered] = useState(false);

  useEffect(() => {
    if (isVisible && !hasRendered) {
      setHasRendered(true);
    }
  }, [isVisible, hasRendered]);

  if (applyVisibleToRoot) {
    return (
      <div
        ref={ref}
        className={`${className} perspective-3d ${isVisible && hasRendered ? 'visible' : ''}`}
      >
        {hasRendered && children}
      </div>
    );
  } else {
    return (
      <div ref={ref} className={`${className} perspective-3d`}>
        {hasRendered &&
          React.isValidElement(children) && (
            React.cloneElement(children, {
              className: `${children.props.className || ''} ${isVisible ? 'visible' : ''}`
            })
          )}
      </div>
    );
  }
}