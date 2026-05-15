'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import Button from './Button';
import { useLanguage } from '@/contexts/LanguageContext';

interface PDFDownloadButtonProps {
  url: string;
  filename?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
}

export default function PDFDownloadButton({
  url,
  filename = 'document.pdf',
  label,
  size = 'md',
  variant = 'outline',
}: PDFDownloadButtonProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      loading={loading}
      onClick={handleDownload}
    >
      <Download size={16} />
      {label || t('download_pdf')}
    </Button>
  );
}
