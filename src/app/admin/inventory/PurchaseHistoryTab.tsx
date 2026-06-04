'use client';
import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSocketEvent } from '@/hooks/useSocket';
import { EVENTS } from '@/lib/socket';
import { API_URL } from '@/lib/constants';
import { format } from 'date-fns';

interface Purchase {
  id: string;
  purchasedAt: string;
  quantityAdded: number;
  pricePerUnit: number;
  totalCost: number;
  notes: string | null;
  ingredient: { nameEn: string; nameAr: string; unit: string };
  supplier: { name: string } | null;
}

export default function PurchaseHistoryTab() {
  const { language } = useLanguage();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = () => {
    fetch(`${API_URL}/api/inventory/purchases`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setPurchases(data); setLoading(false); });
  };

  useEffect(() => { fetchPurchases(); }, []);
  useSocketEvent(EVENTS.INVENTORY_RESTOCK_LOGGED, () => fetchPurchases());

  if (loading) return <div className="py-12 text-center text-muted-foreground animate-pulse">Loading...</div>;

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-surface-elevated text-muted-foreground font-semibold">
          <tr>
            <th className="px-4 py-3">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
            <th className="px-4 py-3">{language === 'ar' ? 'المكون' : 'Ingredient'}</th>
            <th className="px-4 py-3">{language === 'ar' ? 'المورد' : 'Supplier'}</th>
            <th className="px-4 py-3 text-right">{language === 'ar' ? 'الكمية' : 'Quantity'}</th>
            <th className="px-4 py-3 text-right">{language === 'ar' ? 'التكلفة الإجمالية' : 'Total Cost'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {purchases.map(p => (
            <tr key={p.id} className="hover:bg-surface-elevated/50">
              <td className="px-4 py-3 text-muted-foreground">{format(new Date(p.purchasedAt), 'MMM dd, HH:mm')}</td>
              <td className="px-4 py-3 font-bold">{language === 'ar' ? p.ingredient.nameAr : p.ingredient.nameEn}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.supplier?.name || '-'}</td>
              <td className="px-4 py-3 text-right font-mono text-xs">+{p.quantityAdded} {p.ingredient.unit}</td>
              <td className="px-4 py-3 text-right text-danger font-bold">-{p.totalCost} EGP</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
