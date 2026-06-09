'use client';

import { useCupLidScrollAnimation } from '@/lib/animations/retrospot-cup-animation';
import './CupLidAnimation.module.css';

interface CupLidAnimationProps {
  className?: string;
}

export default function CupLidAnimation({ className = '' }: CupLidAnimationProps) {
  const {
    scrollProgress,
    isAnimating,
    lidRotation,
    lidTranslationY,
    lidOpacity,
    revealOpacity
  } = useCupLidScrollAnimation();

  return (
    <div
      className={`cup-lid-animation-container ${className}`}
      style={{
        '--liarRotation': `${lidRotation}deg`,
        '--lidTranslationY': `${lidTranslationY}px`,
        '--lidOpacity': `${lidOpacity}`,
        '--revealOpacity': `${revealOpacity}`
      }}
    >
      {/* Cafe scene revealed under the lid */}
      <div className="cafe-scene">
        <div className="cafe-content">
          <h1>Retro <span className="titleAccent">Spot</span></h1>
          <p>Specialty Coffee • Crafted Workspace • Art Gallery</p>
          <div className="cafe-decoration"></div>
          <div className="cafe-decoration"></div>
          <div className="cafe-decoration"></div>
        </div>
      </div>

      {/* Coffee cup with animated lid */}
      <div className="coffee-cup">
        <div className="cup-body">
          {/* Cup details */ }
          <div className="cup-details" style={{
            position: 'absolute',
            top: '20px',
            left: '0',
            right: '0',
            height: '40px',
            background: 'var(--accent)',
            opacity: '0.8'
          }}></div>
        </div>
        <div
          className="cup-lid"
          style={{
            transform: `translateX(-50%) rotate(${lidRotation}deg) translateY(${-lidTranslationY}px)`,
            opacity: `${lidOpacity}`
          }}
        >
          {/* Lid details */ }
          <div className="lid-details" style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'linear-gradient(to bottom, var(--accent) 0%, var(--accent-hover) 100%)',
            borderRadius: '50% 50% 0 0'
          }}></div>
        </div>
      </div>

      {/* Steam effects */}
      <div className="steam"></div>
      <div className="steam"></div>
      <div className="steam"></div>
    </div>
  );
}