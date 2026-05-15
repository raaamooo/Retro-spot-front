'use client';

import React from 'react';
import Card from './Card';

/* ═══════════════════════════════════════════════════════════════
   ResponsiveTable
   ─ On desktop: renders a proper <table>
   ─ On mobile: renders stacked cards
   ═══════════════════════════════════════════════════════════════ */

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export default function ResponsiveTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage,
}: ResponsiveTableProps<T>) {
  if (data.length === 0 && emptyMessage) {
    return (
      <div className="text-center py-12 text-muted text-sm font-medium">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop Table ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={`
                  border-b border-border-subtle
                  transition-colors duration-150
                  ${onRowClick ? 'cursor-pointer hover:bg-surface-elevated' : ''}
                `}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3.5 text-sm text-foreground ${col.className || ''}`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Cards ── */}
      <div className="md:hidden space-y-3">
        {data.map((row) => (
          <Card
            key={keyExtractor(row)}
            padding="md"
            hoverable={!!onRowClick}
            onClick={() => onRowClick?.(row)}
          >
            <div className="space-y-2">
              {columns
                .filter((col) => !col.hideOnMobile)
                .map((col) => (
                  <div key={col.key} className="flex justify-between items-start gap-3">
                    <span className="text-xs font-medium text-muted uppercase tracking-wide shrink-0">
                      {col.header}
                    </span>
                    <span className="text-sm text-foreground text-end">
                      {col.render ? col.render(row) : row[col.key]}
                    </span>
                  </div>
                ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
