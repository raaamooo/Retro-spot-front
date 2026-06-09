'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { MapPin, Newspaper, CalendarDays, Coffee, Music, Palette } from 'lucide-react';
import { Button, Card, EmptyState, PageContainer, DecorativeLine, MorphingAccent } from '@/components';
import TakeawayCupAnimation from '@/components/ui/TakeawayCupAnimation';
import { useHeroTimeline, useSectionTimeline } from '@/animations';
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


  const heroVisualRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const newsSectionRef = useRef<HTMLElement>(null);
  const storySectionRef = useRef<HTMLElement>(null);

  const featuresSectionRef = useRef<HTMLElement>(null);
  const footerSectionRef = useRef<HTMLElement>(null);

  useHeroTimeline(heroVisualRef, headlineRef, subheadRef, ctaRef);
  useSectionTimeline(newsSectionRef, [newsItems]);
  useSectionTimeline(storySectionRef);
  useSectionTimeline(featuresSectionRef);
  useSectionTimeline(footerSectionRef);

  return (
    <PageContainer>
      {/* HERO SECTION - Premium Cup Lid Scroll Animation */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroNarrative}>
            <h1 ref={headlineRef} className={styles.title} style={{ willChange: 'transform, opacity' }}>
              Retro Spot <span className={styles.titleAccent}>Café</span>
            </h1>
            <p ref={subheadRef} className={styles.subtitle} style={{ willChange: 'opacity' }}>
              {t('about_desc') || "Experience the perfect blend of rich coffee, curated art, and soulful music in a space designed for connection."}
            </p>
            <div ref={ctaRef} className={styles.actions} style={{ willChange: 'transform, opacity' }}>
              <Link href="/menu">
                <Button variant="filled" size="xl">{t('menu') || "View Menu"}</Button>
              </Link>
            </div>
          </div>
          <div ref={heroVisualRef} className={styles.featureBox} style={{ willChange: 'opacity' }}>
            <TakeawayCupAnimation className="cup-lid-hero" />
          </div>
        </div>
      </section>

      <div className="container"><DecorativeLine /></div>

      {/* NEWS SECTION */}
      <section ref={newsSectionRef} className={`${styles.section} ${styles.bgSurface}`}>
        <div className="container">
            <div className={styles.sectionHeader}>
              <div className="heading-3d-drop">
                <span className={styles.kicker}>
                  {t('gazette')}
                </span>
                <h2 className="h2">
                  {t('latest_news')} <MorphingAccent />
                </h2>
              </div>
              <p className={`${styles.sectionDesc} subtext`}>
                {t('gazette_desc')}
              </p>
            </div>

            {loading ? (
              <div className={styles.heroNarrative}>{t('loading')}</div>
            ) : newsItems.length > 0 ? (
              <div className={`${styles.newsGrid} card-grid`}>
                {newsItems.slice(0, 3).map((item, index) => {
                  const isEven = index % 2 === 1;
                  return (
                      <div key={item.id} className={`${styles.newsCard} animated-card ${isEven ? styles.staggered : ''}`}>
                        <div className={`${styles.newsCardInner} card-3d-tilt`}>
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
        </div>
      </section>

      <div className="container"><DecorativeLine /></div>

      {/* OUR STORY SECTION */}
      <section ref={storySectionRef} className={styles.section}>
        <div className="container">
          <div className={styles.storyGrid}>
            <div className={styles.storyContent}>
                <div className="heading-3d-drop">
                  <span className={styles.kicker}>
                    {t('about_us')}
                  </span>
                  <h2 className="h2">
                    {t('about_us')} <MorphingAccent />
                  </h2>
                </div>
                <div className={styles.divider} />
                <p className="body-text subtext">{t('about_desc')}</p>
                <div className={styles.actions} style={{ marginTop: '32px' }}>
                  <Link href="/menu">
                    <Button variant="ghost">{t('menu')}</Button>
                  </Link>
                </div>
            </div>
            <div className={`${styles.storyImageContainer} animated-card`}>
                <div className={styles.storyImageWrapper}>
                  <img src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2071&auto=format&fit=crop" alt="Coffee pouring" className={styles.storyImage} />
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section ref={featuresSectionRef} className={`${styles.section} ${styles.bgSurface}`}>
        <div className="container">
            <div className={styles.sectionHeader} style={{ borderBottom: 'none' }}>
              <div className="heading-3d-drop">
                <h2 className="h2" style={{ textAlign: 'center', width: '100%' }}>
                  {t('What We Offer')} <MorphingAccent />
                </h2>
              </div>
            </div>

            <div className={`${styles.featuresGrid} feature-3d-rotate card-grid`}>
              {[
                { icon: Coffee, title: t('coffee'), desc: t('coffee_desc') },
                { icon: Music, title: t('music'), desc: t('music_desc') },
                { icon: Palette, title: t('art_gallery'), desc: t('art_gallery_desc') }
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
        </div>
      </section>

      {/* FOOTER CTA */}
      <section ref={footerSectionRef} className={`${styles.section} footer-3d-rise`} style={{ textAlign: 'center', padding: '160px 24px' }}>
          <div className="heading-3d-drop">
            <h2 className="h2" style={{ margin: '0 auto 24px', maxWidth: '800px' }}>
              {t('ready_to_experience')} <MorphingAccent />
            </h2>
          </div>
          <div className={styles.actions} style={{ justifyContent: 'center', marginTop: '48px' }}>
            <Link href="/booking">
              <Button variant="filled" size="xl">{t('book_table')}</Button>
            </Link>
          </div>
      </section>
    </PageContainer>
  );
}