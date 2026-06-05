import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'image' | 'avatar' | 'table-row';
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function SkeletonLoader({
  variant = 'text',
  count = 1,
  className = '',
  style = {}
}: SkeletonLoaderProps) {
  const renderSkeleton = (idx: number) => {
    switch (variant) {
      case 'text':
        return (
          <div key={idx} style={{ marginBottom: '12px', ...style }}>
            <div className={`skeleton-text ${className}`} />
            <div className={`skeleton-text ${className}`} style={{ width: '85%' }} />
            <div className={`skeleton-text ${className}`} style={{ width: '60%' }} />
          </div>
        );
      case 'card':
        return (
          <div key={idx} className={`skeleton-card ${className}`} style={{ ...style, height: '240px', padding: '16px' }}>
            <div className="skeleton-image" style={{ height: '120px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }} />
            <div className="skeleton-text" />
            <div className="skeleton-text" style={{ width: '70%' }} />
          </div>
        );
      case 'image':
        return <div key={idx} className={`skeleton-image ${className}`} style={style} />;
      case 'avatar':
        return <div key={idx} className={`skeleton-avatar ${className}`} style={style} />;
      case 'table-row':
        return (
          <div key={idx} style={{ display: 'flex', gap: '16px', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', ...style }}>
            <div className="skeleton-avatar" style={{ width: '24px', height: '24px' }} />
            <div className="skeleton-text" style={{ flex: 2, marginBottom: 0, marginTop: '4px' }} />
            <div className="skeleton-text" style={{ flex: 1, marginBottom: 0, marginTop: '4px' }} />
            <div className="skeleton-text" style={{ width: '60px', marginBottom: 0, marginTop: '4px' }} />
          </div>
        );
      default:
        return <div key={idx} className={`skeleton ${className}`} style={{ height: '100%', width: '100%', ...style }} />;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, idx) => renderSkeleton(idx))}
    </>
  );
}
