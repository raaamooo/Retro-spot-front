'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { EVENTS } from '@/lib/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import { useToast } from '@/contexts/ToastContext';
import { 
  Clock, MapPin, CheckCircle2, FileText, BellRing, CreditCard, 
  Sparkles, DollarSign, Check, CheckSquare, ListTodo, ArrowRight, User, Coffee, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components';
import { API_URL } from '@/lib/constants';

// --- Types ---
interface MenuItem {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number;
}

interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  additions: string | null;
  itemPriceAtTime: number;
  notes: string | null;
  status: string; // ordered, preparing, ready, served
  voided: boolean;
  menuItem: MenuItem;
}

interface Location {
  id: string;
  name: string;
  type: string;
  active: boolean;
}

interface Order {
  id: string;
  locationId: string;
  customerName: string;
  notes: string;
  paymentMethod: string;
  status: string; // placed, barista, waiter, cashier, completed
  orderType: string;
  priority: string;
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  location: Location;
  items: OrderItem[];
}

interface WaiterCall {
  id: string;
  locationId: string;
  type: string; // "waiter", "check"
  status: string; // active, resolved
  createdAt: string;
  location: Location;
}

// --- Sound Chimes ---
const playBeepChime = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playBeep = (timeOffset: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + timeOffset);
      gainNode.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + timeOffset + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.2);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(ctx.currentTime + timeOffset);
      osc.stop(ctx.currentTime + timeOffset + 0.2);
    };
    playBeep(0, 880);
    playBeep(0.12, 1046.50); // Uplifting dual chime
  } catch (e) {
    console.warn("Audio Context blocked.");
  }
};

export default function WaiterPage() {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- ESTIMATED PREP TIME COUNTER ---
  const calculateEstimatedWait = (order: Order) => {
    // Basic coffee shop standard prep calculations
    let totalMinutes = 0;
    order.items.forEach(it => {
      if (it.status === 'served') return;
      const baseTime = it.menuItem?.nameEn?.toLowerCase().includes('brew') || it.menuItem?.nameEn?.toLowerCase().includes('espresso') ? 3 : 5;
      totalMinutes = Math.max(totalMinutes, baseTime * it.quantity);
    });
    return totalMinutes === 0 ? 0 : totalMinutes;
  };

  // --- UPSELL PROMPTS SELECTOR ---
  const getUpsellPrompt = (order: Order) => {
    const hasBeverage = order.items.some(it => 
      it.menuItem?.nameEn?.toLowerCase().includes('coffee') || 
      it.menuItem?.nameEn?.toLowerCase().includes('tea') || 
      it.menuItem?.nameEn?.toLowerCase().includes('latte')
    );
    const hasDessert = order.items.some(it => 
      it.menuItem?.nameEn?.toLowerCase().includes('cake') || 
      it.menuItem?.nameEn?.toLowerCase().includes('cookie') || 
      it.menuItem?.nameEn?.toLowerCase().includes('croissant')
    );

    if (hasBeverage && !hasDessert) {
      return "Suggest pairing with a fresh Lotus Cheesecake or Pistachio Croissant!";
    }
    if (!hasBeverage && hasDessert) {
      return "Suggest pairing with our signature Double Espresso or Spanish Latte!";
    }
    return "Suggest sizing up their beverage to a double shot or large cup!";
  };

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    try {
      const [locsRes, ordersRes, callsRes] = await Promise.all([
        fetch(`${API_URL}/api/locations`),
        fetch(`${API_URL}/api/orders`),
        fetch(`${API_URL}/api/waitercalls`)
      ]);
      const locs = await locsRes.json();
      const ords = await ordersRes.json();
      const cls = await callsRes.json();

      setLocations(locs.filter((l: any) => l.active));
      setOrders(ords);
      setCalls(cls);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- SOCKET LISTENERS ---
  useSocketEvent<Order>(EVENTS.ORDER_NEW, (order) => {
    setOrders(prev => {
      if (prev.some(o => o.id === order.id)) return prev;
      return [order, ...prev];
    });
    setFlash(true);
    playBeepChime();
    setTimeout(() => setFlash(false), 1500);
  });

  useSocketEvent<Order>(EVENTS.ORDER_STATUS_UPDATED, (order) => {
    setOrders(prev => {
      if (order.archived) return prev.filter(o => o.id !== order.id);
      if (prev.some(o => o.id === order.id)) {
        return prev.map(o => o.id === order.id ? order : o);
      }
      return [order, ...prev];
    });
  });

  useSocketEvent<any>(EVENTS.ORDER_ITEM_STATUS_UPDATED, (item) => {
    setOrders(prev => prev.map(o => {
      if (o.id === item.orderId) {
        return {
          ...o,
          items: o.items.map(it => it.id === item.id ? { ...it, status: item.status } : it)
        };
      }
      return o;
    }));
  });

  useSocketEvent<WaiterCall>(EVENTS.WAITER_CALL_NEW, (call) => {
    setCalls(prev => {
      if (prev.some(c => c.id === call.id)) return prev;
      return [call, ...prev];
    });
    setFlash(true);
    playBeepChime();
    addToast(`New Request at ${call.location?.name}!`, 'warning');
    setTimeout(() => setFlash(false), 1500);
  });

  useSocketEvent<WaiterCall>(EVENTS.WAITER_CALL_RESOLVED, (call) => {
    setCalls(prev => prev.filter(c => c.id !== call.id));
  });

  // --- RESOLVE CALLS ---
  const handleResolveCall = async (locationId: string) => {
    const activeCalls = calls.filter(c => c.locationId === locationId);
    if (activeCalls.length === 0) return;

    // Optimistically update
    setCalls(prev => prev.filter(c => c.locationId !== locationId));

    try {
      await Promise.all(activeCalls.map(c => 
        fetch(`${API_URL}/api/waitercalls/${c.id}/resolve`, { method: 'PATCH' })
      ));
      addToast('Requests marked handled!', 'success');
    } catch (e) {
      addToast('Failed to resolve calls', 'error');
      fetchData();
    }
  };

  // --- DELIVER ITEMS ---
  const handleDeliverItem = async (itemId: string) => {
    setOrders(prev => prev.map(o => ({
      ...o,
      items: o.items.map(it => it.id === itemId ? { ...it, status: 'served' } : it)
    })));

    try {
      const res = await fetch(`${API_URL}/api/order-items/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'served' })
      });
      if (!res.ok) throw new Error();
    } catch (err) {
      addToast('Failed to deliver item', 'error');
      fetchData();
    }
  };

  const handleDeliverAllReady = async (order: Order) => {
    const readyItems = order.items.filter(it => it.status === 'ready');
    if (readyItems.length === 0) return;

    // Optimistically mark all ready items as served
    setOrders(prev => prev.map(o => o.id === order.id ? {
      ...o,
      items: o.items.map(it => it.status === 'ready' ? { ...it, status: 'served' } : it)
    } : o));

    try {
      await Promise.all(readyItems.map(it => 
        fetch(`${API_URL}/api/order-items/${it.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'served' })
        })
      ));
      addToast('All ready items successfully served!', 'success');
    } catch (e) {
      addToast('Failed to complete batch delivery', 'error');
      fetchData();
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cashier' })
      });
      if (!res.ok) throw new Error();
      addToast('Order transferred to checkout status', 'success');
    } catch (err) {
      addToast('Failed to complete order handoff', 'error');
      fetchData();
    }
  };

  const handleCallForBill = async (locationId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/waitercalls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId, type: 'check' })
      });
      if (!res.ok) throw new Error();
      addToast('Receipt/Bill printed & called successfully!', 'success');
    } catch (e) {
      addToast('Failed to coordinate checkout bill print', 'error');
    }
  };

  // --- COMPILE DETAILED STATUS MAPS ---
  const activeTableStats = useMemo(() => {
    const stats: Record<string, {
      calls: WaiterCall[];
      checkCalls: WaiterCall[];
      orders: Order[];
      preparingCount: number;
      readyCount: number;
      occupied: boolean;
    }> = {};

    locations.forEach(loc => {
      const activeCalls = calls.filter(c => c.locationId === loc.id && c.type === 'waiter');
      const checkRequests = calls.filter(c => c.locationId === loc.id && c.type === 'check');
      const activeOrders = orders.filter(o => o.locationId === loc.id && o.status !== 'completed');

      let preparing = 0;
      let ready = 0;
      activeOrders.forEach(o => {
        o.items.forEach(it => {
          if (it.status === 'preparing') preparing += it.quantity;
          if (it.status === 'ready') ready += it.quantity;
        });
      });

      stats[loc.id] = {
        calls: activeCalls,
        checkCalls: checkRequests,
        orders: activeOrders,
        preparingCount: preparing,
        readyCount: ready,
        occupied: activeOrders.length > 0
      };
    });

    return stats;
  }, [locations, orders, calls]);

  // Selected Order
  const activeOrderForSelected = useMemo(() => {
    if (!selectedLocationId) return null;
    return orders.find(o => o.locationId === selectedLocationId && o.status !== 'completed') || null;
  }, [selectedLocationId, orders]);

  // Selected Location stats
  const selectedStats = selectedLocationId ? activeTableStats[selectedLocationId] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[80vh]">
        <div className="text-center space-y-4 animate-pulse">
          <BellRing size={64} className="mx-auto text-primary animate-bounce opacity-80" />
          <div className="text-muted-foreground text-lg font-bold">Synchronizing Waitstaff maps...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col pb-24">
      {/* Alert Overlay */}
      {flash && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-danger/10 border-4 border-danger animate-pulse" />
      )}

      {/* TOP NOTIFICATION BOX */}
      {calls.length > 0 && (
        <div className="bg-danger border border-danger/20 text-white px-5 py-3 rounded-2xl shadow-md flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert size={20} />
            <p className="text-sm font-black uppercase tracking-wider">
              Urgent request at: {calls.map(c => c.location?.name).filter(Boolean).join(', ')}
            </p>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-black tracking-widest uppercase">Action Needed</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-full">
        
        {/* LEFT COLUMN: VISUAL TABLE GRID MAP */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface p-4 rounded-2xl border border-border flex justify-between items-center">
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <MapPin size={20} className="text-primary" />
              TABLE GRID MAP
            </h2>
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
              Live updates
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {locations.map(loc => {
              const tableInfo = activeTableStats[loc.id] || {
                calls: [], checkCalls: [], orders: [], preparingCount: 0, readyCount: 0, occupied: false
              };
              const isSelected = selectedLocationId === loc.id;
              
              let cardBorderClass = isSelected ? 'border-primary border-2 ring-2 ring-primary/20' : 'border-border/80';
              if (tableInfo.calls.length > 0) {
                cardBorderClass = 'border-danger border-2 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse';
              } else if (tableInfo.checkCalls.length > 0) {
                cardBorderClass = 'border-warning border-2 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse';
              }

              return (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocationId(loc.id)}
                  className={`bg-surface p-5 rounded-2xl border text-left transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[140px] relative overflow-hidden ${cardBorderClass}`}
                >
                  {/* Glowing alert overlays */}
                  {tableInfo.calls.length > 0 && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-danger" />
                  )}
                  {tableInfo.checkCalls.length > 0 && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-warning" />
                  )}

                  <div className="flex justify-between items-start w-full">
                    <div>
                      <h3 className="text-2xl font-black text-foreground tracking-tighter">
                        {loc.name}
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                        {loc.type || 'Table'}
                      </p>
                    </div>

                    {/* Occupancy Indicator */}
                    <div className={`w-3.5 h-3.5 rounded-full border-2 ${tableInfo.occupied ? 'bg-primary border-primary/30' : 'bg-transparent border-muted'}`} />
                  </div>

                  {/* Status Badges Row */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {tableInfo.calls.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-danger text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5">
                        <BellRing size={8} /> Service
                      </span>
                    )}
                    {tableInfo.checkCalls.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-warning text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5">
                        <CreditCard size={8} /> Bill
                      </span>
                    )}
                    {tableInfo.preparingCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-info/10 border border-info/20 text-info text-[9px] font-black uppercase tracking-wider">
                        {tableInfo.preparingCount} Prep
                      </span>
                    )}
                    {tableInfo.readyCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-success text-white text-[9px] font-black uppercase tracking-wider animate-bounce">
                        {tableInfo.readyCount} Ready
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: FOCUSED TABLE OPERATIONAL PANEL */}
        <div className="lg:col-span-5">
          {selectedLocationId ? (
            <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-lg flex flex-col">
              
              {/* Table details header */}
              <div className="p-6 bg-surface-elevated/80 border-b border-border/80 flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-3xl font-black text-foreground tracking-tighter">
                    {locations.find(l => l.id === selectedLocationId)?.name || 'Focused Table'}
                  </h3>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">
                    Waitstaff Command Console
                  </p>
                </div>
                
                {/* Resolve call shortcut */}
                {((selectedStats?.calls.length ?? 0) > 0 || (selectedStats?.checkCalls.length ?? 0) > 0) && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-danger/30 hover:bg-danger/5 text-danger font-black text-[10px]" 
                    onClick={() => handleResolveCall(selectedLocationId)}
                  >
                    Clear Calls
                  </Button>
                )}
              </div>

              {/* Active Requests Card */}
              {((selectedStats?.calls.length ?? 0) > 0 || (selectedStats?.checkCalls.length ?? 0) > 0) && (
                <div className="m-5 p-4 bg-danger/5 border-2 border-danger/30 rounded-2xl space-y-3">
                  <h4 className="text-danger font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                    <BellRing size={12} /> Active Alerts at Table
                  </h4>
                  <div className="space-y-1.5">
                    {selectedStats?.calls.map(c => (
                      <div key={c.id} className="text-xs font-bold flex justify-between items-center text-foreground">
                        <span>🛎️ Customer requested table service!</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                      </div>
                    ))}
                    {selectedStats?.checkCalls.map(c => (
                      <div key={c.id} className="text-xs font-bold flex justify-between items-center text-foreground">
                        <span>🪙 Customer requested bill/receipt!</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Info Screen */}
              {activeOrderForSelected ? (
                <div className="p-6 space-y-6">
                  
                  {/* Customer / Timing Metadata */}
                  <div className="grid grid-cols-2 gap-4 border-b border-border/60 pb-4">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Customer</span>
                      <p className="font-bold text-sm text-foreground flex items-center gap-1.5 mt-0.5">
                        <User size={14} className="text-muted-foreground" />
                        {activeOrderForSelected.customerName || 'Guest'}
                      </p>
                    </div>
                    {calculateEstimatedWait(activeOrderForSelected) > 0 && (
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Estimated Wait</span>
                        <p className="font-black text-sm text-primary flex items-center justify-end gap-1 mt-0.5">
                          <Clock size={14} />
                          {calculateEstimatedWait(activeOrderForSelected)} mins
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Items List checklist */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <ListTodo size={14} /> ORDERED ITEMS
                    </h4>
                    
                    <ul className="space-y-3">
                      {activeOrderForSelected.items.map(item => {
                        const isDelivered = item.status === 'served';
                        const isReady = item.status === 'ready';
                        const isPreparing = item.status === 'preparing';

                        return (
                          <li key={item.id} className={`flex items-start justify-between gap-4 p-2.5 rounded-xl border border-border/40 bg-surface/50 ${isDelivered ? 'opacity-55' : ''}`}>
                            <div className="flex gap-3">
                              <span className="w-6 h-6 rounded-lg bg-surface border border-border flex items-center justify-center font-black text-xs shrink-0 text-primary">
                                {item.quantity}x
                              </span>
                              <div>
                                <p className={`font-bold text-xs leading-tight text-foreground ${isDelivered ? 'line-through' : ''}`}>
                                  {item.menuItem?.nameEn}
                                </p>
                                {item.additions && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">
                                    + {item.additions}
                                  </p>
                                )}
                                {item.notes && (
                                  <p className="text-[10px] text-accent font-bold mt-1 leading-none">
                                    * {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Status label / Delivery Tap */}
                            <div>
                              {isDelivered ? (
                                <span className="text-[9px] bg-muted/10 border border-muted/20 text-muted-foreground px-2 py-0.5 rounded font-black uppercase tracking-wider">
                                  Served
                                </span>
                              ) : isReady ? (
                                <button
                                  onClick={() => handleDeliverItem(item.id)}
                                  className="text-[9px] bg-success text-white px-2 py-0.5 rounded font-black uppercase tracking-wider hover:bg-success/90 transition-colors animate-bounce flex items-center gap-0.5"
                                >
                                  Deliver <ArrowRight size={8} />
                                </button>
                              ) : isPreparing ? (
                                <span className="text-[9px] bg-info/10 border border-info/20 text-info px-2 py-0.5 rounded font-black uppercase tracking-wider animate-pulse">
                                  Brewing
                                </span>
                              ) : (
                                <span className="text-[9px] bg-surface border border-border text-muted px-2 py-0.5 rounded font-black uppercase tracking-wider">
                                  Ordered
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Waitstaff notes */}
                  {activeOrderForSelected.notes && (
                    <div className="p-3 bg-warning/5 border border-warning/15 rounded-xl">
                      <p className="text-[9px] font-black text-warning uppercase tracking-widest flex items-center gap-1">
                        <FileText size={10} /> POS Kitchen Notes
                      </p>
                      <p className="text-xs font-bold text-foreground leading-snug mt-1">{activeOrderForSelected.notes}</p>
                    </div>
                  )}

                  {/* Dynamic Upsell Suggestions Box */}
                  <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex gap-3 items-start">
                    <Sparkles className="text-primary shrink-0 mt-0.5 animate-pulse" size={18} />
                    <div className="space-y-0.5">
                      <h5 className="text-[10px] text-primary font-black uppercase tracking-widest">Upsell Suggestion</h5>
                      <p className="text-xs font-bold text-foreground/90 leading-snug">{getUpsellPrompt(activeOrderForSelected)}</p>
                    </div>
                  </div>

                  {/* Primary Call Actions */}
                  <div className="space-y-3 pt-4 border-t border-border/40">
                    
                    {/* Batch Ready Deliveries */}
                    {activeOrderForSelected.items.some(it => it.status === 'ready') && (
                      <Button
                        size="md"
                        className="w-full bg-success hover:bg-success/90 font-bold flex justify-center items-center gap-1.5"
                        onClick={() => handleDeliverAllReady(activeOrderForSelected)}
                      >
                        <Check size={16} /> Serve All Ready Items
                      </Button>
                    )}

                    {/* Order transition Handoffs */}
                    {activeOrderForSelected.status === 'waiter' ? (
                      <Button
                        size="md"
                        className="w-full bg-primary hover:bg-primary/90 font-bold flex justify-center items-center gap-1.5"
                        onClick={() => handleCompleteOrder(activeOrderForSelected.id)}
                      >
                        <CheckSquare size={16} /> Complete Delivery Handoff
                      </Button>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          size="md"
                          variant="outline"
                          onClick={() => handleCallForBill(selectedLocationId)}
                          className="font-bold flex justify-center items-center gap-1"
                        >
                          <DollarSign size={14} /> Call for Bill
                        </Button>
                        <Button
                          size="md"
                          className="font-bold flex justify-center items-center gap-1"
                          onClick={() => handleCompleteOrder(activeOrderForSelected.id)}
                        >
                          <ArrowRight size={14} /> Ready for Check
                        </Button>
                      </div>
                    )}

                  </div>

                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground/60 flex flex-col justify-center items-center gap-2">
                  <Coffee size={40} className="opacity-40" />
                  <p className="text-sm font-bold uppercase tracking-wider">No active order</p>
                  <p className="text-xs">Table is clean & ready for seeding.</p>
                  
                  <div className="pt-4 w-full max-w-xs">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full text-xs font-bold" 
                      onClick={() => handleCallForBill(selectedLocationId)}
                    >
                      Seat Table / Assign Call
                    </Button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-surface border border-border border-dashed p-16 rounded-3xl text-center text-muted-foreground flex flex-col justify-center items-center gap-2 min-h-[400px]">
              <MapPin size={48} className="opacity-40 animate-pulse text-primary" />
              <p className="text-sm font-bold uppercase tracking-wider">Select a Table</p>
              <p className="text-xs">Choose any location from the grid map to display waitstaff controls.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
