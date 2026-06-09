'use client';

import React, { useRef, useEffect } from 'react';
import anime from 'animejs';
import styles from './DecorativeComponents.module.css';

interface MorphingAccentProps {
  className?: string;
}

export default function MorphingAccent({ className }: MorphingAccentProps) {
  const iconRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<anime.AnimeInstance | null>(null);
  
  // We don't use useReducedMotion directly here since we only want to skip the transform
  // but it's simpler to just not animate if reducedMotion is true.
  const reducedMotion = (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) || false;

  useEffect(() => {
    return () => {
      if (iconRef.current) {
        anime.remove(iconRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (reducedMotion || !iconRef.current) return;
    
    if (animationRef.current) animationRef.current.pause();
    
    animationRef.current = anime({
      targets: iconRef.current,
      rotate: '45deg',
      scale: 1.15,
      duration: 280,
      easing: 'easeOutExpo'
    });
  };

  const handleMouseLeave = () => {
    if (reducedMotion || !iconRef.current) return;
    
    if (animationRef.current) animationRef.current.pause();
    
    animationRef.current = anime({
      targets: iconRef.current,
      rotate: '0deg',
      scale: 1,
      duration: 520,
      easing: 'easeOutExpo'
    });
  };

  return (
    <span 
      className={`${styles.morphingAccent} ${className || ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-hidden="true"
    >
      <svg 
        ref={iconRef}
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
      </svg>
    </span>
  );
}
