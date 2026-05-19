'use client';

import React from 'react';
import Link from 'next/link';

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
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--danger-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          fontSize: '28px',
        }}
      >
        ⚠
      </div>

      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 4vw, 40px)',
          fontWeight: 300,
          color: 'var(--foreground)',
          marginBottom: '12px',
        }}
      >
        Something went wrong
      </h2>

      <p
        style={{
          fontSize: '15px',
          color: 'var(--muted)',
          maxWidth: '420px',
          lineHeight: 1.6,
          marginBottom: '32px',
        }}
      >
        We encountered an unexpected error. Please try again, or head back to the home page.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{
            padding: '12px 28px',
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.02em',
            transition: 'background-color 200ms',
          }}
        >
          Try Again
        </button>
        <Link
          href="/"
          style={{
            padding: '12px 28px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--foreground)',
            textDecoration: 'none',
            letterSpacing: '0.02em',
          }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
