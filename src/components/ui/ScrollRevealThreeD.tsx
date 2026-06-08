'use client';

import React, { useEffect, useState } from 'react';
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
  const [ref, isVisible] = useThreeDReveal({ once });
  const [hasRendered, setHasRendered] = useState(false);

  useEffect(() => {
    if (isVisible && !hasRendered) {
      setHasRendered(true);
    }
  }, [isVisible, hasRendered]);

  const style = {
    transitionDelay: `${delay}ms`,
    transitionDuration: `${duration}ms`,
  };

  if (applyVisibleToRoot) {
    return (
      <div
        ref={ref}
        className={`${className} perspective-3d ${isVisible && hasRendered ? 'visible' : ''}`}
        style={style}
      >
        {hasRendered && children}
      </div>
    );
  } else {
    const child = React.isValidElement(children) ? (children as React.ReactElement<any>) : null;

    return (
      <div ref={ref} className={`${className} perspective-3d`}>
        {hasRendered && child
          ? React.cloneElement(child, {
              className: `${child.props.className || ''} ${isVisible ? 'visible' : ''}`.trim(),
              style: { ...(child.props.style || {}), ...style }
            })
          : hasRendered && children}
      </div>
    );
  }
}