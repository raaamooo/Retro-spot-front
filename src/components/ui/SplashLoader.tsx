'use client';

import React, { useEffect, useState, useRef } from 'react';
import anime from 'animejs';
import { useReducedMotion } from '@/animations/useReducedMotion';
import styles from './SplashLoader.module.css';

export default function SplashLoader() {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<SVGSVGElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const subtextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if session storage indicates we already loaded the splash loader
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (hasSeenSplash || reducedMotion) {
      return;
    }

    setVisible(true);

    const timeline = anime.timeline({
      complete: () => {
        sessionStorage.setItem('hasSeenSplash', 'true');
        setVisible(false);
      }
    });

    timeline
      // 1. Draw the coffee cup SVG path
      .add({
        targets: logoRef.current,
        strokeDashoffset: [400, 0],
        duration: 1200,
        easing: 'easeInOutSine'
      })
      // 2. Fade in/up the main title
      .add({
        targets: textRef.current,
        opacity: [0, 1],
        translateY: [20, 0],
        letterSpacing: ['0.05em', '0.2em'],
        duration: 800,
        easing: 'easeOutExpo'
      }, '-=400')
      // 3. Fade in/up the subtitle
      .add({
        targets: subtextRef.current,
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 600,
        easing: 'easeOutExpo'
      }, '-=400')
      // 4. Hold briefly, then slide the screen up/out
      .add({
        targets: containerRef.current,
        translateY: '-100vh',
        duration: 900,
        easing: 'easeInOutQuart',
        delay: 500
      });

  }, [reducedMotion]);

  if (!visible) return null;

  return (
    <div ref={containerRef} className={styles.splashContainer}>
      <div className={styles.splashContent}>
        {/* Minimalist Coffee Cup SVG path */}
        <svg
          ref={logoRef}
          className={styles.splashLogo}
          viewBox="0 0 24 24"
        >
          <path d="M17 8h1a4 4 0 1 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="2" x2="6" y2="4" />
          <line x1="10" y1="2" x2="10" y2="4" />
          <line x1="14" y1="2" x2="14" y2="4" />
        </svg>
        
        <div ref={textRef} className={styles.splashText}>
          RETRO SPOT
        </div>
        <div ref={subtextRef} className={styles.splashSubtext}>
          Cafe &amp; Workspace
        </div>
      </div>
    </div>
  );
}
