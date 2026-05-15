'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sun, Moon, Languages } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tighter text-accent">
          Retro Spot
        </Link>
        
        <div className="hidden md:flex space-x-6 rtl:space-x-reverse">
          <Link href="/" className="hover:text-accent transition-colors">{t('home')}</Link>
          <Link href="/menu" className="hover:text-accent transition-colors">{t('menu')}</Link>
          <Link href="/booking" className="hover:text-accent transition-colors">{t('booking')}</Link>
          <Link href="/arts" className="hover:text-accent transition-colors">{t('arts')}</Link>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleLanguage}
            className="p-2 rounded-full hover:bg-surface transition-colors flex items-center gap-2"
            aria-label="Toggle Language"
          >
            <Languages size={20} />
            <span className="text-sm font-medium uppercase">{language}</span>
          </button>
          
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-surface transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
