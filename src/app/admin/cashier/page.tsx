'use client';

import CashierManagement from './CashierManagement';
import { PageContainer, ScrollReveal } from '@/components';
import { useLanguage } from '@/contexts/LanguageContext';
import { Receipt } from 'lucide-react';

export default function CashierPage() {
  const { t } = useLanguage();

  return (
    <PageContainer>
      <ScrollReveal>
        <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-6">
          <div className="flex items-center gap-3 bg-primary/10 text-primary px-4 py-3 rounded-xl border border-primary/20 w-max">
            <Receipt size={24} />
            <h1 className="text-2xl font-black uppercase tracking-wider">{t('billing') || 'Billing & POS'}</h1>
          </div>
          
          <CashierManagement />
        </div>
      </ScrollReveal>
    </PageContainer>
  );
}
