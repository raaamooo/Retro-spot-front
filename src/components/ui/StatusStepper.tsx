'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  key: string;
}

interface StatusStepperProps {
  steps: Step[];
  currentStep: string;
  compact?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'var(--success)',
  current: 'var(--accent)',
  upcoming: 'var(--muted)',
};

export default function StatusStepper({ steps, currentStep, compact = false }: StatusStepperProps) {
  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: compact ? '4px' : '0',
      width: '100%',
    }}>
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const status = isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming';
        const color = STATUS_COLORS[status];

        return (
          <React.Fragment key={step.key}>
            {/* Step circle + label */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: compact ? '0 0 auto' : '1',
              minWidth: compact ? 'auto' : '0',
            }}>
              <div style={{
                width: compact ? '24px' : '32px',
                height: compact ? '24px' : '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: compact ? '11px' : '13px',
                fontWeight: 700,
                color: isCompleted || isCurrent ? 'white' : 'var(--muted)',
                backgroundColor: isCompleted || isCurrent ? color : 'transparent',
                border: `2px solid ${color}`,
                transition: 'all 300ms ease',
                boxShadow: isCurrent ? `0 0 0 4px ${color}33` : 'none',
              }}>
                {isCompleted ? <Check size={compact ? 14 : 16} /> : index + 1}
              </div>
              {!compact && (
                <span style={{
                  marginTop: '6px',
                  fontSize: '11px',
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent ? 'var(--foreground)' : 'var(--muted)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}>
                  {step.label}
                </span>
              )}
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div style={{
                flex: compact ? '0 0 16px' : '1',
                height: '2px',
                backgroundColor: index < currentIndex ? 'var(--success)' : 'var(--border)',
                transition: 'background-color 300ms ease',
                marginBottom: compact ? '0' : '20px',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
