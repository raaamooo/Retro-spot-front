'use client';

import React, { useState } from 'react';
import styles from './Tabs.module.css';

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
      <div className={styles.tabsUnderline} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={currentActive === tab.id}
            onClick={() => handleClick(tab.id)}
            className={`${styles.tabUnderline} ${currentActive === tab.id ? styles.tabUnderlineActive : ''}`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={styles.count}>({tab.count})</span>
            )}
            {currentActive === tab.id && <span className={styles.activeIndicator} />}
          </button>
        ))}
      </div>
    );
  }

  // Pill variant
  return (
    <div className={styles.tabsPill} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={currentActive === tab.id}
          onClick={() => handleClick(tab.id)}
          className={`${styles.tabPill} ${currentActive === tab.id ? styles.tabPillActive : ''}`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={styles.count}>({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
