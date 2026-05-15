'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { EVENTS } from '@/lib/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import { Clock, MapPin, CheckCircle2, FileText, BellRing } from 'lucide-react';
import { Button } from '@/components';

import { API_URL } from '@/lib/constants';

// --- Types ---
interface Order {
  id: string;
  locationId: string;
  customerName: string;
  notes: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  location: { id: string; name: string; type: string };
  items: {
    id: string;
    quantity: number;
    additions: string | null;
    menuItem: { id: string; nameEn: string; nameAr: string };
  }[];
}

interface WaiterCall {
  id: string;
  locationId: string;
  status: string;
  createdAt: string;
  location: { id: string; name: string; type: string };
}

// --- Web Audio API_URL Chime ---
const playWaiterChime = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playBeep = (timeOffset: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + timeOffset); // C6
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
      gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + timeOffset + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.15);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime + timeOffset);
      osc.stop(ctx.currentTime + timeOffset + 0.15);
    };

    playBeep(0);
    playBeep(0.2); // Double beep

  } catch (e) {
    console.warn("Audio not supported or interaction needed first.");
  }
};

export default function WaiterPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [flash, setFlash] = useState(false);
  const [loading, setLoading] = useState(true);

  const triggerAlert = () => {
    setFlash(true);
    playWaiterChime();
    setTimeout(() => setFlash(false), 2000);
  };

  // --- FETCH INITIAL DATA ---
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/orders?status=waiter`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/api/waitercalls`).then(r => r.json()).catch(() => []),
    ]).then(([ordersData, callsData]) => {
      setOrders(ordersData);
      setCalls(callsData);
      setLoading(false);
    });
  }, []);

  // --- SOCKET LISTENERS ---
  useSocketEvent<Order>(EVENTS.ORDER_STATUS_UPDATED, (order) => {
    if (order.status === 'waiter') {
      // A new order just arrived from the barista
      setOrders(prev => {
        if (prev.some(o => o.id === order.id)) return prev;
        return [order, ...prev];
      });
      triggerAlert();
    } else {
      // Order moved past waiter — remove it
      setOrders(prev => prev.filter(o => o.id !== order.id));
    }
  });

  useSocketEvent<WaiterCall>(EVENTS.WAITER_CALL_NEW, (call) => {
    setCalls(prev => [call, ...prev]);
    triggerAlert();
  });

  useSocketEvent<WaiterCall>(EVENTS.WAITER_CALL_RESOLVED, (call) => {
    setCalls(prev => prev.filter(c => c.id !== call.id));
  });

  // --- ACTIONS ---
  const markDelivered = async (id: string) => {
    // Optimistic removal
    setOrders(prev => prev.filter(o => o.id !== id));
    try {
      await fetch(`${API_URL}/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cashier' }),
      });
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const markCallHandled = async (id: string) => {
    setCalls(prev => prev.filter(c => c.id !== id));
    try {
      await fetch(`${API_URL}/api/waitercalls/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Failed to resolve call', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground text-lg font-medium animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      
      {/* Visual Flash Overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none bg-danger/20 mix-blend-overlay"
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full items-start">
        
        {/* =========================================
            SECTION 1: ACTIVE CALLS 
            ========================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 bg-danger/10 text-danger px-4 py-3 rounded-xl border border-danger/30">
            <BellRing size={24} className="animate-pulse" />
            <h2 className="text-2xl font-black uppercase tracking-wider">{t('waiter_calls')} ({calls.length})</h2>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {calls.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="p-8 text-center text-muted-foreground bg-surface border border-dashed border-border rounded-2xl"
                >
                  No active calls.
                </motion.div>
              ) : (
                calls.map(call => (
                  <motion.div
                    key={call.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: 20 }}
                    className="bg-danger/5 rounded-2xl border-2 border-danger/50 shadow-lg p-6 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-danger pointer-events-none">
                      <BellRing size={120} className="transform rotate-12" />
                    </div>

                    <p className="text-danger font-bold text-sm uppercase tracking-widest mb-1">{t('call_from')}</p>
                    <h3 className="text-5xl sm:text-6xl font-black text-foreground mb-6 break-words tracking-tighter">
                      {call.location?.name || 'Unknown'}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-muted-foreground font-medium mb-6 bg-surface/50 p-3 rounded-lg w-max">
                      <Clock size={16} />
                      {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <Button 
                      size="lg" 
                      className="w-full text-lg shadow-md bg-foreground text-background hover:bg-foreground/90" 
                      onClick={() => markCallHandled(call.id)}
                    >
                      <CheckCircle2 size={24} /> {t('mark_handled')}
                    </Button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>


        {/* =========================================
            SECTION 2: READY ORDERS 
            ========================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 bg-success/10 text-success px-4 py-3 rounded-xl border border-success/30">
            <CheckCircle2 size={24} />
            <h2 className="text-2xl font-black uppercase tracking-wider">{t('ready_orders')} ({orders.length})</h2>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {orders.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="p-8 text-center text-muted-foreground bg-surface border border-dashed border-border rounded-2xl"
                >
                  No orders ready for delivery.
                </motion.div>
              ) : (
                orders.map(order => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    className="bg-surface rounded-2xl border border-border shadow-lg flex flex-col overflow-hidden"
                  >
                    {/* Massive Location Header */}
                    <div className="p-6 bg-primary text-primary-foreground text-center">
                      <p className="font-bold text-primary-foreground/70 text-sm uppercase tracking-widest mb-1">{t('serve_to')}</p>
                      <h3 className="text-5xl sm:text-6xl font-black tracking-tighter break-words">
                        {order.location?.name || 'Unknown'}
                      </h3>
                    </div>

                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                        <span className="font-bold text-lg">{order.customerName || 'Guest'}</span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground font-medium">
                          <Clock size={16} />
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* Items List */}
                      <ul className="space-y-4 mb-6">
                        {order.items.map(item => (
                          <li key={item.id} className="flex gap-4 items-center">
                            <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-border font-black flex items-center justify-center shrink-0 text-xl">
                              {item.quantity}
                            </div>
                            <div>
                              <p className="font-bold text-xl leading-tight">{item.menuItem.nameEn}</p>
                            </div>
                          </li>
                        ))}
                      </ul>

                      {/* Important Notes */}
                      {order.notes && (
                        <div className="mb-6 bg-warning/10 border border-warning/30 rounded-xl p-4">
                          <div className="flex items-center gap-2 text-warning font-black mb-1 uppercase tracking-wider text-sm">
                            <FileText size={16} /> {t('notes')}
                          </div>
                          <p className="font-bold text-foreground text-lg leading-snug">{order.notes}</p>
                        </div>
                      )}

                      <Button 
                        size="lg" 
                        className="w-full text-lg shadow-md bg-success hover:bg-success/90" 
                        onClick={() => markDelivered(order.id)}
                      >
                        <CheckCircle2 size={24} /> {t('mark_delivered')}
                      </Button>
                    </div>

                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>

      </div>
    </div>
  );
}
