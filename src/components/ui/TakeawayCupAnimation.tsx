'use client';

import React from 'react';
import { useTakeawayCupScroll } from '@/lib/animations/takeaway-cup-animation';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { Button } from '@/components';
import './TakeawayCupAnimation.module.css';

interface TakeawayCupAnimationProps {
  className?: string;
}

export default function TakeawayCupAnimation({ className = '' }: TakeawayCupAnimationProps) {
  const { t } = useLanguage();
  const lidRef = React.useRef<HTMLDivElement>(null);
  const buttonsRef = React.useRef<HTMLDivElement>(null);
  const { isAnimating } = useTakeawayCupScroll(lidRef, buttonsRef);
  return (
    <div className={`takeaway-cup-container ${className}`}>
      {/* Scene under lid (menu + booking buttons) */}
      <div ref={buttonsRef} className="cup-content">
        <Link href="/menu">
          <Button variant="outline">{t('menu')}</Button>
        </Link>
        <Link href="/booking">
          <Button variant="filled">{t('book_table')}</Button>
        </Link>
      </div>

      {/* Cup lid */}
      <div ref={lidRef} className="cup-lid" />
      {/* Cup body (optional simple outline) */}
      <div className="cup-body" />
    </div>
  );
}