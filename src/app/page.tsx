'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Newspaper, CalendarDays, Coffee, Music, Palette } from 'lucide-react';
import { Button, Card, EmptyState, ScrollReveal, PageContainer } from '@/components';
import { API_URL } from '@/lib/constants';

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
    <PageContainer className="p-0 sm:p-0 md:p-0 lg:p-0 max-w-full overflow-hidden">
      {/* 
        ========================================
        HERO SECTION (Editorial Magazine Cover Style)
        ========================================
      */}
      <section className="relative min-h-[90vh] flex flex-col justify-center px-4 sm:px-8 lg:px-16 py-20 md:py-32">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Headline and Narrative */}
          <div className="lg:col-span-8 space-y-8 text-left z-10">
            <span className="text-xs uppercase tracking-widest text-accent font-bold">
              {isRtl ? 'القهوة • العمل • الفن' : 'Specialty Coffee • Crafted Workspace • Art Gallery'}
            </span>
            
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-light text-foreground tracking-tight leading-[1.05]">
              Retro <br />
              <span className="italic font-normal text-accent">Spot</span>
            </h1>

            <div className="w-24 h-px bg-accent opacity-60" />

            <p className="text-lg md:text-xl text-muted leading-relaxed max-w-xl">
              {t('subtitle')}
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/menu">
                <Button variant="primary" size="lg" className="h-12 px-8 uppercase tracking-widest text-xs font-bold">
                  {t('order_now')}
                </Button>
              </Link>
              <Link href="/booking">
                <Button variant="outline" size="lg" className="h-12 px-8 uppercase tracking-widest text-xs font-bold">
                  {t('book_table')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Side Feature (Vinyl Record / Visual Ornament) */}
          <div className="lg:col-span-4 flex justify-center z-10">
            <div className="relative group p-8 border border-border bg-surface-elevated/40 rounded-sm max-w-sm w-full text-center">
              <div className="absolute inset-0 bg-accent/5 pointer-events-none rounded-sm" />
              <div className="aspect-square flex items-center justify-center relative mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                  className="w-48 h-48 rounded-full bg-gradient-to-br from-zinc-950 to-zinc-800 border-[6px] border-[#3D2010] flex items-center justify-center shadow-2xl relative"
                >
                  <div className="w-16 h-16 rounded-full bg-[#EDD9C0] dark:bg-[#2C1A0E] flex items-center justify-center border border-border/40">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  </div>
                </motion.div>
              </div>
              <h3 className="font-display text-2xl font-light text-foreground italic mb-2">The Listening Table</h3>
              <p className="text-xs text-muted leading-relaxed">
                {isRtl ? 'استمع إلى أسطوانات الفينيل المختارة بعناية أثناء العمل.' : 'Analog vibes, pour-overs, and a hand-curated vinyl library for your focus.'}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Gold Fine Divider */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full h-px bg-accent opacity-20" />
      </div>

      {/* 
        ========================================
        NEWS SECTION (Latest Dispatch - Staggered Card Grid)
        ========================================
      */}
      <section className="py-28 px-4 sm:px-8 lg:px-16 bg-surface/20">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 mb-16 border-b border-border/20 pb-6">
              <div>
                <span className="text-xs uppercase tracking-widest text-accent font-bold">
                  {isRtl ? 'الأخبار والأحداث' : 'The Gazette'}
                </span>
                <h2 className="text-4xl md:text-5xl font-display font-light text-foreground mt-2">
                  {t('latest_news')}
                </h2>
              </div>
              <p className="text-sm text-muted max-w-xs md:text-right">
                {isRtl ? 'كن على اطلاع دائم بآخر المستجدات والأنشطة لدينا.' : 'Artisan workshops, music listings, and seasonal coffee updates from our baristas.'}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="text-sm font-medium tracking-widest uppercase text-muted animate-pulse">
                  {t('loading')}
                </div>
              </div>
            ) : newsItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {newsItems.slice(0, 3).map((item, index) => {
                  const isEven = index % 2 === 1;
                  return (
                    <div 
                      key={item.id} 
                      className={`flex flex-col transition-all duration-300 ${
                        isEven ? 'md:translate-y-8' : ''
                      }`}
                    >
                      <Card 
                        hoverable 
                        className="flex flex-col p-8 h-full bg-surface border border-border rounded-sm relative overflow-hidden"
                      >
                        <div className="flex justify-between items-baseline mb-6">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-accent border border-accent/30 px-2 py-0.5 rounded-sm">
                            {item.type.replace('_', ' ')}
                          </span>
                          {item.startDate && (
                            <span className="text-xs text-muted flex items-center gap-1.5 font-medium">
                              <CalendarDays size={12} />
                              {new Date(item.startDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <h3 className="text-2xl font-display font-light text-foreground mb-4 line-clamp-2 leading-snug">
                          {isRtl ? item.titleAr : item.titleEn}
                        </h3>
                        <p className="text-sm text-muted mb-8 leading-relaxed line-clamp-3">
                          {isRtl ? item.descriptionAr : item.descriptionEn}
                        </p>
                      </Card>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState 
                icon={Newspaper}
                title={t('no_news')}
                description="Check back later for exciting updates and events!"
              />
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* Gold Fine Divider */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full h-px bg-accent opacity-20" />
      </div>

      {/* 
        ========================================
        OUR STORY SECTION (Asymmetric editorial spread)
        ========================================
      */}
      <section className="py-28 px-4 sm:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Editorial Media Container */}
            <div className="lg:col-span-6">
              <ScrollReveal direction={isRtl ? 'right' : 'left'}>
                <div className="aspect-[4/3] border border-border bg-surface-elevated p-8 relative rounded-sm flex flex-col justify-center items-center text-center overflow-hidden">
                  {/* Amber multiply tint overlay pattern */}
                  <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
                  
                  <div className="space-y-6 relative z-10">
                    <div className="flex gap-4 justify-center">
                      {[Coffee, Palette, Music].map((Icon, i) => (
                        <div key={i} className="p-3 border border-border rounded-sm bg-surface/60 text-accent">
                          <Icon size={20} />
                        </div>
                      ))}
                    </div>
                    <h3 className="font-display text-3xl font-light italic text-foreground mt-4">
                      {isRtl ? 'ملتقى الحواس' : 'Sensory Gathering'}
                    </h3>
                    <p className="text-xs text-muted max-w-xs leading-relaxed uppercase tracking-wider">
                      {isRtl ? 'الجمع بين الإلهام والراحة البصرية' : 'Cozy corners, single-origins, and local art galleries in a single room'}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
            
            {/* Narrative Editorial Text */}
            <div className="lg:col-span-6 space-y-6">
              <ScrollReveal direction={isRtl ? 'left' : 'right'} delay={0.2}>
                <span className="text-xs uppercase tracking-widest text-accent font-bold">
                  {t('our_story')}
                </span>
                <h2 className="text-4xl md:text-5xl font-display font-light text-foreground leading-tight">
                  {isRtl ? 'أكثر من مجرد مقهى' : 'A space built for slow coffee and deep work'}
                </h2>
                <div className="space-y-6 text-base text-muted leading-relaxed font-normal">
                  <p>{t('story_text')}</p>
                  <p>Whether you're looking for a quiet corner to finish that novel, a vibrant table to brainstorm with your startup team, or just a really good cup of specialty coffee, we've built this place for you.</p>
                </div>
                <div className="pt-4">
                  <Link href="/booking">
                    <Button variant="outline" size="md" className="uppercase tracking-widest text-xs font-bold px-6">
                      {isRtl ? 'احجز طاولة' : 'Read Our Story'}
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>
            </div>

          </div>
        </div>
      </section>

      {/* Gold Fine Divider */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full h-px bg-accent opacity-20" />
      </div>

      {/* 
        ========================================
        MAP & INFO SECTION
        ========================================
      */}
      <section className="py-28 px-4 sm:px-8 lg:px-16 bg-surface/20">
        <div className="max-w-6xl mx-auto">
          
          <ScrollReveal>
            <div className="text-center mb-16 space-y-4">
              <span className="text-xs uppercase tracking-widest text-accent font-bold">
                {t('our_location')}
              </span>
              <h2 className="text-4xl md:text-5xl font-display font-light text-foreground">
                {t('find_us')}
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="max-w-5xl mx-auto">
              <div className="border border-border bg-surface rounded-sm overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  
                  {/* Address info */}
                  <div className="p-10 md:p-14 flex flex-col justify-center gap-8 border-b md:border-b-0 md:border-r border-border">
                    <div className="space-y-2">
                      <h3 className="text-3xl font-display font-light text-foreground">{isRtl ? 'العنوان' : 'The Spot'}</h3>
                      <p className="text-sm text-muted">{isRtl ? 'القاهرة، مصر' : 'Cairo, Egypt'}</p>
                    </div>

                    <div className="w-12 h-px bg-accent opacity-60" />

                    <div className="space-y-4 text-sm text-muted">
                      <p className="font-semibold text-foreground text-lg">Retro Spot Café</p>
                      <div className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                        <span>{isRtl ? 'السبت – الخميس: ١٠ص – ١٢م' : 'Sat – Thu: 10 AM – 12 AM'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                        <span>{isRtl ? 'الجمعة: ٢م – ١٢م' : 'Friday: 2 PM – 12 AM'}</span>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Link href="/booking">
                        <Button variant="primary" size="md" className="uppercase tracking-widest text-xs font-bold px-8 h-11">
                          {isRtl ? 'احجز مكانك' : 'Reserve a Spot'}
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Google maps link element */}
                  <a 
                    href="https://maps.app.goo.gl/b11MWcxeD3sN4Z8q7" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative min-h-[300px] bg-surface-elevated flex flex-col items-center justify-center overflow-hidden group transition-all hover:bg-surface-elevated/70 cursor-pointer p-8"
                  >
                    <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
                    
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="relative z-10 flex flex-col items-center gap-4 text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center group-hover:scale-105 transition-all">
                        <MapPin size={24} className="text-accent" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-display text-lg text-foreground font-semibold">{isRtl ? 'افتح في خرائط جوجل' : 'Open in Google Maps'}</h4>
                        <p className="text-xs text-muted max-w-xs">{isRtl ? 'انقر للحصول على الاتجاهات مباشرة' : 'Click to launch navigation directions'}</p>
                      </div>
                    </motion.div>
                  </a>

                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </PageContainer>
  );
}
