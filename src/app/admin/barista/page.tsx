'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { EVENTS } from '@/lib/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import { Clock, MapPin, User, FileText, CreditCard, Play, Send, Coffee } from 'lucide-react';
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
  subtotal: number;
  total: number;
  tipAmount: number;
  createdAt: string;
  location: { id: string; name: string; type: string };
  items: {
    id: string;
    quantity: number;
    additions: string | null;
    itemPriceAtTime: number;
    notes: string | null;
    menuItem: { id: string; nameEn: string; nameAr: string; price: number };
  }[];
}

// --- Web Audio API Chime ---
const playChime = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.warn("Audio not supported or interaction needed first.");
  }
};

export default function BaristaPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'barista'>('ALL');
  const [flash, setFlash] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- FETCH INITIAL DATA ---
  useEffect(() => {
    fetch(`${API_URL}/api/orders?status=barista`)
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // --- SOCKET LISTENERS ---
  useSocketEvent<Order>(EVENTS.ORDER_NEW, (order) => {
    setOrders(prev => [order, ...prev]);
    setFlash(true);
    playChime();
    setTimeout(() => setFlash(false), 2000);
  });

  useSocketEvent<Order>(EVENTS.ORDER_STATUS_UPDATED, (order) => {
    if (order.status !== 'barista') {
      // Order has moved past barista — remove it
      setOrders(prev => prev.filter(o => o.id !== order.id));
    } else {
      // Update in place
      setOrders(prev => prev.map(o => o.id === order.id ? order : o));
    }
  });

  // --- ACTIONS ---
  const updateStatus = async (id: string, newStatus: string) => {
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    
    try {
      await fetch(`${API_URL}/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  // --- FILTERING ---
  const filteredOrders = orders.filter(o => {
    if (o.status !== 'barista') return false; 
    return true;
  });

  // --- HELPERS ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'barista': return 'bg-info/20 text-info border-info/50';
      case 'preparing': return 'bg-warning/20 text-warning border-warning/50';
      default: return 'bg-surface border-border text-muted';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground text-lg font-medium animate-pulse">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Visual Flash Overlay for New Orders */}
      <AnimatePresence>
        {flash && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none bg-primary/20 mix-blend-overlay"
          />
        )}
      </AnimatePresence>

      {/* ORDERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-24">
        <AnimatePresence>
          {filteredOrders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="col-span-full py-20 text-center text-muted-foreground"
            >
              <Coffee size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-xl font-bold">No orders found.</p>
              <p>Time to clean the espresso machine!</p>
            </motion.div>
          ) : (
            filteredOrders.map(order => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="bg-surface rounded-2xl border border-border shadow-lg flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 border-b border-border bg-surface-elevated flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-primary">{order.id.slice(0, 8).toUpperCase()}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground font-medium mt-1">
                      <Clock size={14} />
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(order.status)}`}>
                    {order.status}
                  </div>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-px bg-border text-sm">
                  <div className="bg-surface p-3 flex items-center gap-2">
                    <MapPin size={16} className="text-muted-foreground" />
                    <span className="font-bold truncate">{order.location?.name || 'Unknown'}</span>
                  </div>
                  <div className="bg-surface p-3 flex items-center gap-2">
                    <User size={16} className="text-muted-foreground" />
                    <span className="font-bold truncate">{order.customerName || 'Guest'}</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="p-4 flex-1">
                  <ul className="space-y-4">
                    {order.items.map(item => (
                      <li key={item.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded bg-primary/10 text-primary font-black flex items-center justify-center shrink-0">
                          {item.quantity}
                        </div>
                        <div>
                          <p className="font-bold text-lg leading-tight">{item.menuItem.nameEn}</p>
                          {item.additions && (
                            <p className="text-sm text-muted-foreground mt-1 font-medium">
                              + {item.additions}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Important Notes */}
                {order.notes && (
                  <div className="mx-4 mb-4 bg-danger/10 border border-danger/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-danger font-black mb-1 uppercase tracking-wider text-xs">
                      <FileText size={14} /> {t('notes')}
                    </div>
                    <p className="font-bold text-foreground leading-snug">{order.notes}</p>
                  </div>
                )}

                {/* Payment & Actions */}
                <div className="p-4 bg-surface-elevated border-t border-border mt-auto">
                  <div className="flex items-center justify-between mb-4 text-sm font-medium">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <CreditCard size={16} /> {t('payment')}:
                    </span>
                    <span>{order.paymentMethod || 'Cash'}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Button size="lg" className="w-full bg-success hover:bg-success/90 shadow-md" onClick={() => updateStatus(order.id, 'waiter')}>
                      <Send size={20} /> {t('send_to_waiter')}
                    </Button>
                  </div>
                </div>

              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
