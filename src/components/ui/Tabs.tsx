'use client';

import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pill';
}

export default function Tabs({ tabs, activeTab, onChange, variant = 'pill' }: TabsProps) {
  const [active, setActive] = useState(activeTab || tabs[0]?.id || '');

  const handleClick = (id: string) => {
    setActive(id);
    onChange(id);
  };

  const currentActive = activeTab ?? active;

  if (variant === 'underline') {
    return (
      <div className="flex border-b border-border gap-1 overflow-x-auto" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={currentActive === tab.id}
            onClick={() => handleClick(tab.id)}
            className={`
              relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors
              ${
                currentActive === tab.id
                  ? 'text-primary'
                  : 'text-muted hover:text-foreground'
              }
            `}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ms-1.5 text-xs opacity-60">({tab.count})</span>
            )}
            {currentActive === tab.id && (
              <span className="absolute bottom-0 inset-x-2 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>
    );
  }

  // Pill variant
  return (
    <div className="flex gap-1.5 p-1 bg-surface-elevated rounded-xl overflow-x-auto" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={currentActive === tab.id}
          onClick={() => handleClick(tab.id)}
          className={`
            px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200
            ${
              currentActive === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-surface'
            }
          `}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ms-1.5 text-xs opacity-70">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
