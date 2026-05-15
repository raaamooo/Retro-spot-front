'use client';

import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UploadInputProps {
  label?: string;
  accept?: string;
  onFileSelect: (file: File | null) => void;
  error?: string;
  previewUrl?: string;
}

export default function UploadInput({
  label,
  accept = 'image/*',
  onFileSelect,
  error,
  previewUrl,
}: UploadInputProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(previewUrl || null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFileName(file.name);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
      }
      onFileSelect(file);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setFileName(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center
          border-2 border-dashed rounded-xl p-6 cursor-pointer
          transition-colors duration-200
          hover:border-primary/50 hover:bg-surface-elevated/50
          ${error ? 'border-danger' : 'border-border'}
          ${preview ? 'p-2' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        {preview ? (
          <div className="relative w-full">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-48 object-contain rounded-lg"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="absolute top-1 end-1 p-1 bg-danger text-white rounded-full hover:bg-danger/80 transition-colors"
              aria-label="Remove"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={24} className="text-muted mb-2" />
            <p className="text-sm text-muted">
              <span className="text-primary font-medium">{t('browse_files')}</span>{' '}
              {t('or_drag')}
            </p>
            {fileName && (
              <p className="text-xs text-muted mt-1">{fileName}</p>
            )}
          </>
        )}
      </div>
      {error && (
        <p className="text-xs text-danger font-medium">{error}</p>
      )}
    </div>
  );
}
