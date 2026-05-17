'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePathname } from 'next/navigation';
import { MapPin, Phone, Mail, Camera, Share2, MessageSquare } from 'lucide-react';

export default function Footer() {
  const { t, language, isRtl } = useLanguage();
  const pathname = usePathname();

  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/menu')
  ) {
    return null;
  }

  return (
    <footer className="w-full border-t border-border bg-[#2C1A0E] text-[#EDD9C0] dark:bg-[#1C0E06] py-16 mt-auto relative overflow-hidden">
      {/* Decorative top gold line overlay */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-accent opacity-40" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Brand & Description */}
          <div className="col-span-1 md:col-span-4 space-y-6">
            <Link href="/" className="text-3xl font-display font-light tracking-wide text-accent hover:text-accent-hover transition-colors block">
              Retro Spot
            </Link>
            <p className="text-[#C4A882] text-sm leading-relaxed max-w-sm">
              {t('subtitle')}
            </p>
            {/* Social Media */}
            <div className="flex gap-4">
              <a href="#" aria-label="Instagram" className="text-[#C4A882] hover:text-[#EDD9C0] border border-border p-2 rounded-sm transition-colors focus-ring">
                <Camera size={16} />
              </a>
              <a href="#" aria-label="Twitter" className="text-[#C4A882] hover:text-[#EDD9C0] border border-border p-2 rounded-sm transition-colors focus-ring">
                <Share2 size={16} />
              </a>
              <a href="#" aria-label="Facebook" className="text-[#C4A882] hover:text-[#EDD9C0] border border-border p-2 rounded-sm transition-colors focus-ring">
                <MessageSquare size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-[#EDD9C0] font-bold">{isRtl ? 'روابط سريعة' : 'Quick Links'}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/menu" className="text-sm text-[#C4A882] hover:text-[#EDD9C0] transition-colors font-medium">
                  {t('menu')}
                </Link>
              </li>
              <li>
                <Link href="/booking" className="text-sm text-[#C4A882] hover:text-[#EDD9C0] transition-colors font-medium">
                  {t('booking')}
                </Link>
              </li>
              <li>
                <Link href="/arts" className="text-sm text-[#C4A882] hover:text-[#EDD9C0] transition-colors font-medium">
                  {t('arts')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Address */}
          <div className="col-span-1 md:col-span-3 space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-[#EDD9C0] font-bold">{t('contact_info')}</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-[#C4A882]">
                <Phone size={14} className="text-accent shrink-0" />
                <span>+20 101 234 5678</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#C4A882]">
                <Mail size={14} className="text-accent shrink-0" />
                <span>hello@retrospot.cafe</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#C4A882]">
                <MapPin size={14} className="text-accent shrink-0 mt-0.5" />
                <span>
                  {isRtl 
                    ? 'شارع ريترو، وسط البلد، القاهرة، مصر' 
                    : '123 Retro St, Downtown, Cairo, Egypt'}
                </span>
              </li>
            </ul>
          </div>

          {/* Newsletter Signup (Premium Editorial Component) */}
          <div className="col-span-1 md:col-span-3 space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-[#EDD9C0] font-bold">
              {isRtl ? 'النشرة الإخبارية' : 'The Dispatch'}
            </h3>
            <p className="text-xs text-[#C4A882] leading-relaxed">
              {isRtl 
                ? 'اشترك في النشرة الإخبارية الأسبوعية للحصول على عروض حصرية وفعاليات فنية.' 
                : 'Subscribe to our dispatch for recipes, art reveals, and exclusive offers.'}
            </p>
            <form onSubmit={(e) => { e.preventDefault(); alert(isRtl ? 'تم الاشتراك بنجاح!' : 'Subscribed successfully!'); }} className="flex gap-2 w-full mt-2">
              <input 
                type="email" 
                required
                placeholder={isRtl ? 'بريدك الإلكتروني' : 'Your email'} 
                className="bg-transparent border border-border rounded-sm px-3 py-2 text-xs text-[#EDD9C0] placeholder:text-[#C4A882]/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 w-full transition-all"
              />
              <button 
                type="submit"
                className="bg-accent text-[#2C1A0E] px-4 py-2 text-xs font-bold rounded-sm hover:bg-accent-hover active:scale-95 transition-all uppercase tracking-widest shrink-0"
              >
                {isRtl ? 'اشترك' : 'Join'}
              </button>
            </form>
          </div>

        </div>

        {/* Divider line */}
        <div className="w-full h-px bg-border opacity-20 my-10" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#C4A882]">
          <p>
            &copy; {new Date().getFullYear()} Retro Spot. {isRtl ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </p>
          <div className="flex gap-6 font-medium">
            <a href="#" className="hover:text-[#EDD9C0] transition-colors">{isRtl ? 'سياسة الخصوصية' : 'Privacy Policy'}</a>
            <a href="#" className="hover:text-[#EDD9C0] transition-colors">{isRtl ? 'شروط الخدمة' : 'Terms of Service'}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
