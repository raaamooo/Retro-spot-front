import Link from 'next/link';

/**
 * Custom 404 page — brand-consistent "not found" with navigation back.
 * This is a Server Component (no 'use client' needed).
 */
export default function NotFound() {
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
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(72px, 10vw, 120px)',
          fontWeight: 300,
          color: 'var(--accent)',
          lineHeight: 1,
          marginBottom: '16px',
          letterSpacing: '-0.03em',
        }}
      >
        404
      </h1>

      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(24px, 4vw, 36px)',
          fontWeight: 300,
          color: 'var(--foreground)',
          marginBottom: '12px',
        }}
      >
        Page not found
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
        The page you're looking for doesn't exist or may have been moved. 
        Let's get you back on track.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/"
          style={{
            padding: '12px 28px',
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            letterSpacing: '0.02em',
          }}
        >
          Back to Home
        </Link>
        <Link
          href="/menu"
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
          Browse Menu
        </Link>
      </div>
    </div>
  );
}
