'use client';

import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './UploadInput.module.css';

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
    <div className={styles.container}>
      {label && (
        <label className={styles.label}>{label}</label>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        className={`${styles.dropZone} ${error ? styles.dropZoneError : ''} ${preview ? styles.dropZonePreview : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className={styles.hiddenInput}
        />

        {preview ? (
          <div className={styles.previewWrap}>
            <img
              src={preview}
              alt="Preview"
              className={styles.previewImage}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className={styles.removeBtn}
              aria-label="Remove"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={24} className={styles.uploadIcon} />
            <p className={styles.uploadText}>
              <span className={styles.browseLink}>{t('browse_files')}</span>{' '}
              {t('or_drag')}
            </p>
            {fileName && (
              <p className={styles.fileName}>{fileName}</p>
            )}
          </>
        )}
      </div>
      {error && (
        <p className={styles.errorText}>{error}</p>
      )}
    </div>
  );
}
