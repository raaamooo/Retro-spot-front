'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components';

/**
 * Root Error Boundary — catches unhandled exceptions in any page
 * and displays a brand-consistent error screen with a retry option.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 md:p-12 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-6 text-2xl shadow-inner border border-danger/20">
        ⚠
      </div>

      <h2 className="font-display text-[clamp(28px,4vw,40px)] font-light text-foreground mb-3">
        Something went wrong
      </h2>

      <p className="text-muted-foreground max-w-[420px] leading-relaxed mb-8">
        We encountered an unexpected error. Please try again, or head back to the home page.
      </p>

      <div className="flex gap-4 flex-wrap justify-center">
        <Button onClick={reset} size="lg" className="px-8 shadow-lg shadow-primary/20">
          Try Again
        </Button>
        <Link href="/">
          <Button variant="outline" size="lg" className="px-8 bg-surface">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
