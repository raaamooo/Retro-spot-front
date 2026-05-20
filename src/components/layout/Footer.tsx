'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { usePathname } from 'next/navigation';
import { MapPin, Phone, Mail, Camera, Share2, MessageSquare } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  const { t, isRtl } = useLanguage();
  const { addToast } = useToast();
  const pathname = usePathname();

  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/menu')
  ) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.topAccent} />

      <div className="container">
        <div className={styles.footerGrid}>
          
          {/* Brand & Description */}
          <div className={styles.brandCol}>
            <Link href="/" className={styles.logoText}>
              Retro Spot
            </Link>
            <p className={styles.desc}>
              {t('subtitle')}
            </p>
            <div className={styles.socials}>
              <a href="https://www.instagram.com/retro__spot/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={`${styles.socialBtn} focus-ring`}>
                <Camera size={16} />
              </a>
              <a href="#" aria-label="Twitter" className={`${styles.socialBtn} focus-ring`}>
                <Share2 size={16} />
              </a>
              <a href="#" aria-label="Facebook" className={`${styles.socialBtn} focus-ring`}>
                <MessageSquare size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className={styles.linksCol}>
            <h3 className={styles.colTitle}>{isRtl ? 'روابط سريعة' : 'Quick Links'}</h3>
            <ul className={styles.linkList}>
              <li><Link href="/menu" className={styles.linkItem}>{t('menu')}</Link></li>
              <li><Link href="/booking" className={styles.linkItem}>{t('booking')}</Link></li>
              <li><Link href="/arts" className={styles.linkItem}>{t('arts')}</Link></li>
            </ul>
          </div>

          {/* Contact & Address */}
          <div className={styles.contactCol}>
            <h3 className={styles.colTitle}>{t('contact_info')}</h3>
            <ul className={styles.linkList}>
              <li className={styles.contactItem}>
                <Phone size={14} className={styles.contactIcon} />
                <span>+20 101 234 5678</span>
              </li>
              <li className={styles.contactItem}>
                <Mail size={14} className={styles.contactIcon} />
                <span>hello@retrospot.cafe</span>
              </li>
              <li className={styles.contactItem} style={{ alignItems: 'flex-start' }}>
                <MapPin size={14} className={styles.contactIcon} style={{ marginTop: '2px' }} />
                <span>
                  {isRtl 
                    ? 'شارع ريترو، وسط البلد، القاهرة، مصر' 
                    : '123 Retro St, Downtown, Cairo, Egypt'}
                </span>
              </li>
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div className={styles.newsletterCol}>
            <h3 className={styles.colTitle}>{isRtl ? 'النشرة الإخبارية' : 'The Dispatch'}</h3>
            <p className={styles.newsletterDesc}>
              {isRtl 
                ? 'اشترك للحصول على دعوات حصرية للفعاليات، أخبار المعرض الفني، وخصومات على حبوب القهوة.'
                : 'Sign up for exclusive event invites, art gallery news, and whole bean discounts.'}
            </p>
            <form className={styles.form} onSubmit={(e) => {
              e.preventDefault();
              // Newsletter integration placeholder — shows user feedback via toast
              const input = e.currentTarget.querySelector('input');
              if (input) input.value = '';
              addToast(isRtl ? 'النشرة الإخبارية قريباً! ترقبوا.' : 'Newsletter coming soon! Stay tuned.', 'info');
            }}>
              <input 
                type="email" 
                placeholder={isRtl ? 'بريدك الإلكتروني' : 'your@email.com'}
                className={styles.input}
                required
              />
              <button type="submit" className={`${styles.submitBtn} focus-ring`}>
                {isRtl ? 'اشترك' : 'Subscribe'}
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Retro Spot. {isRtl ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </p>
          <div className={styles.legalLinks}>
            <a href="#" className={styles.legalLink}>{isRtl ? 'سياسة الخصوصية' : 'Privacy Policy'}</a>
            <a href="#" className={styles.legalLink}>{isRtl ? 'الشروط والأحكام' : 'Terms of Service'}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
