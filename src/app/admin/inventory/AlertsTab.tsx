'use client';
import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSocketEvent } from '@/hooks/useSocket';
import { EVENTS } from '@/lib/socket';
import { API_URL } from '@/lib/constants';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Alert {
  id: string;
  alertType: 'low_stock' | 'out_of_stock';
  isResolved: boolean;
  triggeredAt: string;
  resolvedAt: string | null;
  ingredient: { nameEn: string; nameAr: string; currentStock: number; unit: string };
}

export default function AlertsTab({ onAlertResolved }: { onAlertResolved: () => void }) {
  const { language } = useLanguage();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = () => {
    fetch(`${API_URL}/api/inventory/alerts`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setAlerts(data); setLoading(false); });
  };

  useEffect(() => { fetchAlerts(); }, []);
  useSocketEvent(EVENTS.INVENTORY_LOW_STOCK, () => fetchAlerts());
  useSocketEvent(EVENTS.INVENTORY_OUT_OF_STOCK, () => fetchAlerts());

  const resolveAlert = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/inventory/alerts/${id}/resolve`, { method: 'PATCH' });
      if (res.ok) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, isResolved: true, resolvedAt: new Date().toISOString() } : a));
        onAlertResolved();
      }
    } catch (e) {}
  };

  if (loading) return <div className="py-12 text-center text-muted-foreground animate-pulse">Loading...</div>;

  return (
    <div className="space-y-3">
      {alerts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground border border-border rounded-2xl bg-surface/50">
          <CheckCircle2 size={32} className="mx-auto mb-2 text-success opacity-50" />
          <p>{language === 'ar' ? 'لا توجد تنبيهات.' : 'No alerts.'}</p>
        </div>
      )}
      {alerts.map(alert => (
        <div key={alert.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center transition-colors ${alert.isResolved ? 'bg-surface border-border opacity-60' : alert.alertType === 'out_of_stock' ? 'bg-danger/10 border-danger/20' : 'bg-warning/10 border-warning/20'}`}>
          <div className="flex gap-3 items-center">
            <AlertTriangle size={20} className={alert.isResolved ? 'text-muted-foreground' : alert.alertType === 'out_of_stock' ? 'text-danger' : 'text-warning'} />
            <div>
              <p className="font-bold text-sm">
                {language === 'ar' ? alert.ingredient.nameAr : alert.ingredient.nameEn}
                <span className="mx-2 text-muted-foreground font-normal text-xs">• {alert.ingredient.currentStock} {alert.ingredient.unit} left</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(alert.triggeredAt), 'MMM dd, HH:mm')}
                {alert.isResolved && alert.resolvedAt && ` • Resolved ${format(new Date(alert.resolvedAt), 'HH:mm')}`}
              </p>
            </div>
          </div>
          {!alert.isResolved && (
            <button 
              onClick={() => resolveAlert(alert.id)}
              className="w-full sm:w-auto px-3 py-1.5 bg-surface-elevated hover:bg-surface border border-border rounded-lg text-xs font-bold transition-colors"
            >
              {language === 'ar' ? 'تحديد كمحلول' : 'Mark Resolved'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
