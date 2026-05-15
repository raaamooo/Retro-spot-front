'use client';

import React from 'react';
import { Printer } from 'lucide-react';
import Button from './Button';
import { useLanguage } from '@/contexts/LanguageContext';

interface PrintButtonProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  printTarget?: string; // CSS selector for element to print, or omit for full page
}

export default function PrintButton({
  label,
  size = 'md',
  variant = 'outline',
  printTarget,
}: PrintButtonProps) {
  const { t } = useLanguage();

  const handlePrint = () => {
    if (printTarget) {
      const el = document.querySelector(printTarget);
      if (!el) return window.print();
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(`
        <html>
          <head><title>Print</title></head>
          <body style="font-family: system-ui, sans-serif; padding: 24px;">
            ${el.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } else {
      window.print();
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handlePrint}>
      <Printer size={16} />
      {label || t('print')}
    </Button>
  );
}
