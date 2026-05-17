'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { MapPin, Newspaper, CalendarDays, Coffee, Music, Palette } from 'lucide-react';
import { Button, Card, EmptyState, ScrollReveal, PageContainer } from '@/components';
import { API_URL } from '@/lib/constants';
import styles from './Home.module.css';

interface NewsItem {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  type: string;
  startDate?: string;
  endDate?: string;
}

export default function Home() {
  const { t, isRtl } = useLanguage();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/news`)
      .then(res => res.json())
      .then(data => {
        setNewsItems(data.filter((item: any) => item.active !== false));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <PageContainer>
      {/* HERO SECTION */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroNarrative}>
            <span className={styles.kicker}>
              {isRtl ? 'القهوة • العمل • الفن' : 'Specialty Coffee • Crafted Workspace • Art Gallery'}
            </span>
            <h1 className={styles.title}>
              Retro <br />
              <span className={styles.titleAccent}>Spot</span>
            </h1>
            <div className={styles.divider} />
            <p className={styles.subtitle}>{t('subtitle')}</p>
            <div className={styles.actions}>
              <Link href="/menu">
                <Button variant="filled" size="lg">{t('order_now')}</Button>
              </Link>
              <Link href="/booking">
                <Button variant="ghost" size="lg">{t('book_table')}</Button>
              </Link>
            </div>
          </div>
          
          <div className={styles.featureBox}>
            <div className={styles.featureCard}>
              <div className={styles.vinylContainer}>
                <div className={styles.vinyl}>
                  <div className={styles.vinylLabel}>
                    <div className={styles.vinylHole} />
                  </div>
                </div>
              </div>
              <h3 className={styles.featureTitle}>The Listening Table</h3>
              <p className={styles.featureDesc}>
                {isRtl ? 'استمع إلى أسطوانات الفينيل المختارة بعناية أثناء العمل.' : 'Analog vibes, pour-overs, and a hand-curated vinyl library for your focus.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container"><div className="golden-divider" /></div>

      {/* NEWS SECTION */}
      <section className={`${styles.section} ${styles.bgSurface}`}>
        <div className="container">
          <ScrollReveal>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.kicker}>{isRtl ? 'الأخبار والأحداث' : 'The Gazette'}</span>
                <h2 className="h2">{t('latest_news')}</h2>
              </div>
              <p className={styles.sectionDesc}>
                {isRtl ? 'كن على اطلاع دائم بآخر المستجدات.' : 'Artisan workshops, music listings, and seasonal coffee updates from our baristas.'}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            {loading ? (
              <div className={styles.heroNarrative}>{t('loading')}</div>
            ) : newsItems.length > 0 ? (
              <div className={styles.newsGrid}>
                {newsItems.slice(0, 3).map((item, index) => {
                  const isEven = index % 2 === 1;
                  return (
                    <div key={item.id} className={`${styles.newsCard} ${isEven ? styles.staggered : ''}`}>
                      <div className={styles.newsCardInner}>
                        <div className={styles.newsMeta}>
                          <span className={styles.newsType}>{item.type.replace('_', ' ')}</span>
                          {item.startDate && (
                            <span className={styles.newsDate}>
                              <CalendarDays size={12} />
                              {new Date(item.startDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <h3 className={styles.newsTitle}>{isRtl ? item.titleAr : item.titleEn}</h3>
                        <p className={styles.newsDesc}>{isRtl ? item.descriptionAr : item.descriptionEn}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={Newspaper} title={t('no_news')} description="Check back later for exciting updates and events!" />
            )}
          </ScrollReveal>
        </div>
      </section>

      <div className="container"><div className="golden-divider" /></div>

      {/* OUR STORY SECTION */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.storyGrid}>
            <div className={styles.storyContent}>
              <ScrollReveal>
                <span className={styles.kicker}>{isRtl ? 'قصتنا' : 'Our Story'}</span>
                <h2 className="h2">{t('about_us')}</h2>
                <div className={styles.divider} />
                <p className="body-text">{t('about_desc')}</p>
                <div className={styles.actions} style={{ marginTop: '32px' }}>
                  <Link href="/menu">
                    <Button variant="ghost">{t('menu')}</Button>
                  </Link>
                </div>
              </ScrollReveal>
            </div>
            <div className={styles.storyImageContainer}>
              <ScrollReveal delay={200} direction="left">
                <div className={styles.storyImageWrapper}>
                  <img src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2071&auto=format&fit=crop" alt="Coffee pouring" className={styles.storyImage} />
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className={`${styles.section} ${styles.bgSurface}`}>
        <div className="container">
          <ScrollReveal>
            <div className={styles.sectionHeader} style={{ borderBottom: 'none' }}>
              <h2 className="h2" style={{ textAlign: 'center', width: '100%' }}>{isRtl ? 'المميزات' : 'What We Offer'}</h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className={styles.featuresGrid}>
              {[
                { icon: Coffee, title: t('coffee'), desc: isRtl ? 'حبوب قهوة مختصة، محمصة بعناية.' : 'Specialty beans, expertly roasted.' },
                { icon: Music, title: t('music'), desc: isRtl ? 'أجواء موسيقية هادئة للعمل.' : 'Curated playlists and vinyl records.' },
                { icon: Palette, title: t('art_gallery'), desc: isRtl ? 'معرض فني محلي ومتجدد.' : 'Local art gallery and creative space.' }
              ].map((feature, i) => (
                <div key={i} className={styles.featureItem}>
                  <div className={styles.featureIcon}>
                    <feature.icon size={24} />
                  </div>
                  <h3 className="h3" style={{ marginBottom: 0 }}>{feature.title}</h3>
                  <p className="body-text">{feature.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className={styles.section} style={{ textAlign: 'center', padding: '160px 24px' }}>
        <ScrollReveal>
          <h2 className="h2" style={{ margin: '0 auto 24px', maxWidth: '800px' }}>
            {isRtl ? 'جاهز لتجربة ريترو سبوت؟' : 'Ready to experience Retro Spot?'}
          </h2>
          <div className={styles.actions} style={{ justifyContent: 'center', marginTop: '48px' }}>
            <Link href="/booking">
              <Button variant="filled" size="xl">{t('book_table')}</Button>
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </PageContainer>
  );
}
