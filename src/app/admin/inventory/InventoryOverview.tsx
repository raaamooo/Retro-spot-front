'use client';
import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSocketEvent } from '@/hooks/useSocket';
import { EVENTS } from '@/lib/socket';
import { API_URL } from '@/lib/constants';
import { Package, AlertTriangle, TrendingDown, DollarSign, Activity, ArrowUp, ArrowDown } from 'lucide-react';

interface DashboardData {
  totalIngredients: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
  todayDeductionCost: number;
  unresolvedAlerts: number;
  recentDeductions: any[];
  recentPurchases: any[];
}

export default function InventoryOverview() {
  const { language } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = () => {
    fetch(`${API_URL}/api/inventory/dashboard`)
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)
      .then(d => { setData(d); setLoading(false); });
  };

  useEffect(() => { fetchDashboard(); }, []);

  useSocketEvent(EVENTS.INVENTORY_STOCK_UPDATED, () => { fetchDashboard(); });

  if (loading) return <div className="text-center py-16 text-muted-foreground animate-pulse">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>;
  if (!data) return <div className="text-center py-16 text-muted-foreground">{language === 'ar' ? 'فشل في تحميل البيانات' : 'Failed to load data'}</div>;

  const kpis = [
    { label: language === 'ar' ? 'إجمالي المكونات' : 'Total Ingredients', value: data.totalIngredients, icon: Package, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { label: language === 'ar' ? 'مخزون منخفض' : 'Low Stock', value: data.lowStockCount, icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
    { label: language === 'ar' ? 'نفذ المخزون' : 'Out of Stock', value: data.outOfStockCount, icon: TrendingDown, color: 'text-danger', bg: 'bg-danger/10 border-danger/20' },
    { label: language === 'ar' ? 'قيمة المخزون' : 'Stock Value', value: `${data.totalValue.toLocaleString()} EGP`, icon: DollarSign, color: 'text-success', bg: 'bg-success/10 border-success/20' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black">{language === 'ar' ? 'نظرة عامة على المخزون' : 'Inventory Overview'}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{language === 'ar' ? 'ملخص حالة المخزون اليوم' : "Today's inventory status at a glance"}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${kpi.bg} transition-all hover:scale-[1.02]`}>
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon size={18} className={kpi.color} />
              <span className="text-xs font-semibold text-muted-foreground">{kpi.label}</span>
            </div>
            <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl border border-border bg-surface">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={16} className="text-primary" />
            <span className="text-xs font-semibold text-muted-foreground">{language === 'ar' ? 'تكلفة خصومات اليوم' : "Today's Deduction Cost"}</span>
          </div>
          <p className="text-xl font-black">{data.todayDeductionCost.toLocaleString()} EGP</p>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-surface">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-danger" />
            <span className="text-xs font-semibold text-muted-foreground">{language === 'ar' ? 'تنبيهات غير محلولة' : 'Unresolved Alerts'}</span>
          </div>
          <p className="text-xl font-black text-danger">{data.unresolvedAlerts}</p>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Deductions */}
        <div className="p-4 rounded-2xl border border-border bg-surface">
          <h3 className="text-sm font-black mb-3 flex items-center gap-2">
            <ArrowDown size={14} className="text-danger" />
            {language === 'ar' ? 'آخر الخصومات' : 'Recent Deductions'}
          </h3>
          {data.recentDeductions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">{language === 'ar' ? 'لا توجد خصومات بعد' : 'No deductions yet'}</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.recentDeductions.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-surface-elevated text-sm">
                  <div>
                    <p className="font-bold text-xs">{language === 'ar' ? d.ingredient?.nameAr : d.ingredient?.nameEn}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{d.reason}</p>
                  </div>
                  <span className="text-danger font-bold text-xs">-{d.quantityDeducted} {d.ingredient?.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Purchases */}
        <div className="p-4 rounded-2xl border border-border bg-surface">
          <h3 className="text-sm font-black mb-3 flex items-center gap-2">
            <ArrowUp size={14} className="text-success" />
            {language === 'ar' ? 'آخر المشتريات' : 'Recent Purchases'}
          </h3>
          {data.recentPurchases.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">{language === 'ar' ? 'لا توجد مشتريات بعد' : 'No purchases yet'}</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.recentPurchases.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-surface-elevated text-sm">
                  <div>
                    <p className="font-bold text-xs">{language === 'ar' ? p.ingredient?.nameAr : p.ingredient?.nameEn}</p>
                    <p className="text-[10px] text-muted-foreground">{p.supplier?.name || (language === 'ar' ? 'بدون مورد' : 'No supplier')}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-success font-bold text-xs">+{p.quantityAdded} {p.ingredient?.unit}</span>
                    <p className="text-[10px] text-muted-foreground">{p.totalCost} EGP</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
