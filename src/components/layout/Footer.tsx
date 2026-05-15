'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePathname } from 'next/navigation';
import { MapPin, Phone, Mail, Camera, Share2, MessageSquare } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();
  const pathname = usePathname();

  if (
    pathname?.startsWith('/menu') || 
    pathname?.startsWith('/booking') || 
    pathname?.startsWith('/arts') || 
    pathname?.startsWith('/admin')
  ) {
    return null;
  }

  return (
    <footer className="w-full border-t border-border bg-surface-elevated py-12 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Description */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="text-2xl font-bold tracking-tight text-primary hover:text-primary-hover transition-colors mb-4 block">
              Retro Spot
            </Link>
            <p className="text-muted-foreground text-sm mb-6">
              {t('subtitle')}
            </p>
            {/* Social Media Placeholders */}
            <div className="flex gap-4">
              <a href="#" aria-label="Instagram" className="text-muted hover:text-primary transition-colors focus-ring rounded-md p-1">
                <Camera size={20} />
              </a>
              <a href="#" aria-label="Twitter" className="text-muted hover:text-primary transition-colors focus-ring rounded-md p-1">
                <Share2 size={20} />
              </a>
              <a href="#" aria-label="Facebook" className="text-muted hover:text-primary transition-colors focus-ring rounded-md p-1">
                <MessageSquare size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="font-semibold text-foreground mb-4">{t('menu')} & {t('booking')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/menu" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('menu')}
                </Link>
              </li>
              <li>
                <Link href="/booking" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('booking')}
                </Link>
              </li>
              <li>
                <Link href="/arts" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('arts')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info Placeholder */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="font-semibold text-foreground mb-4">{t('contact_info')}</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone size={16} className="text-muted" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail size={16} className="text-muted" />
                <span>hello@retrospot.cafe</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin size={16} className="text-muted mt-1 shrink-0" />
                <span>{t('address')} placeholder:<br/>123 Retro Avenue, Neo City 404</span>
              </li>
            </ul>
          </div>

          {/* Opening Hours Placeholder */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="font-semibold text-foreground mb-4">{t('opening_hours')}</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex justify-between">
                <span>Mon - Fri:</span>
                <span>8:00 AM - 10:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Saturday:</span>
                <span>9:00 AM - 11:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Sunday:</span>
                <span>9:00 AM - 8:00 PM</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Retro Spot. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
