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
    <PageContainer className="p-0 sm:p-0 md:p-0 lg:p-0 max-w-full">
      {/* 
        ========================================
        HERO SECTION
        ========================================
      */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
        
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[20%] left-[20%] w-[40rem] h-[40rem] bg-accent/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-[20%] right-[10%] w-[35rem] h-[35rem] bg-primary/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        </div>
        
        {/* Geometric Retro Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-40">
          <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="z-10 text-center max-w-4xl mt-12 glass p-10 md:p-16 rounded-[2rem] shadow-2xl relative overflow-hidden"
        >
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none" />
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-br from-foreground via-foreground/90 to-primary tracking-tighter leading-tight relative z-10">
            Retro Spot
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 font-medium leading-relaxed max-w-2xl mx-auto relative z-10">
            {t('subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full relative z-10">
            <Link href="/menu" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-10 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 transform hover:-translate-y-1">
                {t('menu')}
              </Button>
            </Link>
            <Link href="/booking" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg h-14 px-10 rounded-xl border-2 hover:bg-primary/5 transition-all duration-300">
                {t('booking')}
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* 
        ========================================
        NEWS SECTION
        ========================================
      */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface-elevated/30">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="flex items-center gap-3 mb-12">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <Newspaper size={28} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">{t('latest_news')}</h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-pulse text-muted-foreground">Loading news...</div></div>
            ) : newsItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsItems.slice(0, 3).map((item, index) => (
                  <Card key={item.id} hoverable className="h-full flex flex-col p-6 animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'both' }}>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {item.type.replace('_', ' ')}
                      </span>
                      {item.startDate && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <CalendarDays size={14} />
                          {new Date(item.startDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-3 line-clamp-2">{isRtl ? item.titleAr : item.titleEn}</h3>
                    <p className="text-muted-foreground mb-6 flex-1 line-clamp-3">{isRtl ? item.descriptionAr : item.descriptionEn}</p>
                  </Card>
                ))}
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

      {/* 
        ========================================
        OUR STORY SECTION
        ========================================
      */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction={isRtl ? 'right' : 'left'}>
              <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-border relative group shadow-2xl">
                {/* Retro-themed decorative banner */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-surface-elevated" />
                <div className="absolute inset-0" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.04) 39px, rgba(255,255,255,0.04) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.04) 39px, rgba(255,255,255,0.04) 40px)'
                }} />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
                  {/* Animated vinyl record */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    className="w-36 h-36 rounded-full bg-gradient-to-br from-zinc-900 to-zinc-700 border-4 border-primary/30 flex items-center justify-center shadow-2xl"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Music size={20} className="text-white" />
                    </div>
                  </motion.div>
                  <div className="flex gap-4">
                    {[Coffee, Palette, Music].map((Icon, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.2 }}
                        className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white"
                      >
                        <Icon size={22} />
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-white/80 font-bold text-lg tracking-wider uppercase">Where Memories Are Made</p>
                </div>
              </div>
            </ScrollReveal>
            
            <ScrollReveal direction={isRtl ? 'left' : 'right'} delay={0.2}>
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-8">{t('our_story')}</h2>
                <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                  <p>{t('story_text')}</p>
                  <p>Whether you're looking for a quiet corner to finish that novel, a vibrant table to brainstorm with your startup team, or just a really good cup of specialty coffee, we've built this place for you.</p>
                </div>
                <Button className="mt-10 rounded-xl px-8" size="lg" variant="outline">
                  Read Full Story
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 
        ========================================
        MAP SECTION
        ========================================
      */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface-elevated/30">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-6">
              <MapPin size={18} />
              {t('our_location')}
            </div>
            <h2 className="text-4xl font-bold">{t('find_us')}</h2>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.2}>
          <div className="max-w-4xl mx-auto">
            <div className="rounded-3xl overflow-hidden border border-border bg-surface shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Address card */}
                <div className="p-10 flex flex-col justify-center gap-6 border-b md:border-b-0 md:border-r border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                      <MapPin size={24} />
                    </div>
                    <h3 className="text-2xl font-bold">{isRtl ? 'العنوان' : 'Our Address'}</h3>
                  </div>
                  <div className="space-y-2 text-muted-foreground">
                    <p className="font-semibold text-foreground text-lg">Retro Spot Café</p>
                    <p>{isRtl ? 'القاهرة، مصر' : 'Cairo, Egypt'}</p>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      <span className="text-muted-foreground">{isRtl ? 'السبت – الخميس: ١٠ص – ١٢م' : 'Sat – Thu: 10 AM – 12 AM'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                      <span className="text-muted-foreground">{isRtl ? 'الجمعة: ٢م – ١٢م' : 'Friday: 2 PM – 12 AM'}</span>
                    </div>
                  </div>
                  <Link href="/booking">
                    <Button className="rounded-xl mt-2">
                      {isRtl ? 'احجز مكانك' : 'Reserve a Spot'}
                    </Button>
                  </Link>
                </div>
                {/* Interactive Map Link */}
                <a 
                  href="https://maps.app.goo.gl/b11MWcxeD3sN4Z8q7" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="relative min-h-[280px] bg-gradient-to-br from-primary/10 to-accent/10 flex flex-col items-center justify-center overflow-hidden group transition-all hover:opacity-90 cursor-pointer"
                >
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(var(--color-primary)/0.1) 29px, rgba(var(--color-primary)/0.1) 30px), repeating-linear-gradient(90deg, transparent, transparent 29px, rgba(var(--color-primary)/0.1) 29px, rgba(var(--color-primary)/0.1) 30px)'
                  }} />
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative z-10 flex flex-col items-center gap-3"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MapPin size={28} className="text-primary" />
                    </div>
                    <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
                  </motion.div>
                  <div className="relative z-10 mt-4 px-4 py-2 bg-background/80 backdrop-blur-sm rounded-full text-sm font-medium border border-border shadow-sm group-hover:-translate-y-1 transition-transform">
                    {isRtl ? 'افتح في خرائط جوجل' : 'Open in Google Maps'}
                  </div>
                </a>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

    </PageContainer>
  );
}
