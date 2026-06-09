'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import anime from 'animejs';
import { useReducedMotion } from './useReducedMotion';
import {
  DURATION_SHORT,
  DURATION_MED,
  EASE_IN,
  EASE_OUT,
} from './tokens';

/**
 * Wraps page content and animates route transitions in Next.js App Router.
 *
 * - **Exit** (outgoing): opacity → 0, translateY → −12px  (durationShort, easeIn)
 * - **Enter** (incoming): opacity 0 → 1, translateY +12px → 0 (durationMed, easeOut)
 *
 * Drop this around `{children}` in a client layout or directly inside a page.
 */
export default function TransitionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [prevPath, setPrevPath] = useState(pathname);

  useEffect(() => {
    // On first mount or same path — just show
    if (pathname === prevPath) return;

    const el = wrapperRef.current;
    if (!el) {
      setDisplayChildren(children);
      setPrevPath(pathname);
      return;
    }

    if (reducedMotion) {
      // No animation, just swap
      setDisplayChildren(children);
      setPrevPath(pathname);
      return;
    }

    // ── EXIT animation ──
    const exitAnim = anime({
      targets: el,
      opacity: [1, 0],
      translateY: [0, -12],
      duration: DURATION_SHORT,
      easing: EASE_IN,
    });

    exitAnim.finished.then(() => {
      // Swap to new children
      setDisplayChildren(children);
      setPrevPath(pathname);

      // ── ENTER animation ──
      anime({
        targets: el,
        opacity: [0, 1],
        translateY: [12, 0],
        duration: DURATION_MED,
        easing: EASE_OUT,
      });
    });

    return () => {
      exitAnim.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, children]);

  return (
    <div ref={wrapperRef} style={{ willChange: 'opacity, transform' }}>
      {displayChildren}
    </div>
  );
}
