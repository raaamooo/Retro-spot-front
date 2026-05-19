'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { EVENTS } from '@/lib/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import { useToast } from '@/contexts/ToastContext';
import { 
  Clock, MapPin, User, FileText, CreditCard, Play, Send, Coffee, 
  AlertCircle, Zap, BookOpen, Printer, CheckCircle2, GripVertical, TrendingUp, Sparkles
} from 'lucide-react';
import { Button, Modal } from '@/components';
import { API_URL } from '@/lib/constants';

// --- Types ---
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
  voidReason: string | null;
  menuItem: { id: string; nameEn: string; nameAr: string; price: number };
}

interface Order {
  id: string;
  locationId: string;
  customerName: string;
  notes: string;
  paymentMethod: string;
  status: string; // placed, barista, waiter, cashier, completed
  orderType: string; // dine_in, takeaway, delivery
  priority: string; // normal, rush
  subtotal: number;
  total: number;
  tipAmount: number;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  location: { id: string; name: string; type: string };
  items: OrderItem[];
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

// --- Order Prep Timer Component ---
function OrderTimer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(createdAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${minutes}m ${seconds}s`;

  let colorClass = 'text-success border-success/30 bg-success/5';
  if (minutes >= 10 && minutes < 15) {
    colorClass = 'text-warning border-warning/30 bg-warning/5 animate-pulse';
  } else if (minutes >= 15) {
    colorClass = 'text-danger border-danger border-danger/20 bg-danger/5 animate-pulse';
  }

  return (
    <div className={`px-2.5 py-1 rounded-lg text-xs font-black border flex items-center gap-1.5 ${colorClass}`}>
      <Clock size={12} />
      {timeStr}
    </div>
  );
}

export default function BaristaPage() {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [flash, setFlash] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [activeRecipeItem, setActiveRecipeItem] = useState<{ id: string; name: string } | null>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  const [printTicketOrder, setPrintTicketOrder] = useState<Order | null>(null);

  // --- FETCH INITIAL ACTIVE ORDERS ---
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders`);
      const data = await res.json();
      setOrders(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // --- SOCKET LISTENERS ---
  useSocketEvent<Order>(EVENTS.ORDER_NEW, (order) => {
    setOrders(prev => {
      if (prev.some(o => o.id === order.id)) return prev;
      return [order, ...prev];
    });
    setFlash(true);
    playChime();
    setTimeout(() => setFlash(false), 2000);
  });

  useSocketEvent<Order>(EVENTS.ORDER_STATUS_UPDATED, (order) => {
    setOrders(prev => {
      if (order.archived) {
        return prev.filter(o => o.id !== order.id);
      }
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

  useSocketEvent<Order>(EVENTS.ORDER_RUSH_FLAGGED, (order) => {
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, priority: 'rush' } : o));
    playChime();
    addToast('Rush Priority Flagged!', 'warning');
  });

  // --- API ACTIONS ---
  const updateItemStatus = async (itemId: string, newStatus: string) => {
    // Optimistic local update
    setOrders(prev => prev.map(o => ({
      ...o,
      items: o.items.map(item => item.id === itemId ? { ...item, status: newStatus } : item)
    })));

    try {
      const res = await fetch(`${API_URL}/api/order-items/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error();
    } catch (err) {
      addToast('Failed to update item status', 'error');
      fetchOrders();
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    // Optimistic local update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error();
      addToast(`Order status updated to ${newStatus}`, 'success');
    } catch (err) {
      addToast('Failed to update order status', 'error');
      fetchOrders();
    }
  };

  const toggleRush = async (orderId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/rush`, {
        method: 'PATCH'
      });
      if (!res.ok) throw new Error();
      addToast('Order flagged as rush priority!', 'warning');
    } catch (err) {
      addToast('Failed to toggle rush priority', 'error');
    }
  };

  // --- RECIPE FETCHING ---
  const handleViewRecipe = async (itemId: string, itemName: string) => {
    setActiveRecipeItem({ id: itemId, name: itemName });
    setLoadingRecipe(true);
    try {
      const res = await fetch(`${API_URL}/api/menu-items/${itemId}/recipes`);
      const data = await res.json();
      setRecipes(data);
    } catch (err) {
      addToast('Failed to load recipe', 'error');
      setRecipes([]);
    } finally {
      setLoadingRecipe(false);
    }
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('orderId', orderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    if (!orderId) return;

    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      if (targetColumn === 'new') {
        await updateOrderStatus(orderId, 'barista');
        await Promise.all(order.items.map(item => updateItemStatus(item.id, 'ordered')));
      } else if (targetColumn === 'preparing') {
        await updateOrderStatus(orderId, 'barista');
        await Promise.all(order.items.map(item => updateItemStatus(item.id, 'preparing')));
      } else if (targetColumn === 'ready') {
        await updateOrderStatus(orderId, 'waiter');
        await Promise.all(order.items.map(item => updateItemStatus(item.id, 'ready')));
      } else if (targetColumn === 'served') {
        await updateOrderStatus(orderId, 'completed');
        await Promise.all(order.items.map(item => updateItemStatus(item.id, 'served')));
      }
    } catch (err) {
      addToast('Drag & Drop updates failed', 'error');
    }
  };

  // --- KANBAN COLUMN SEGREGATION & SORTING ---
  const getRushWeight = (o: Order) => (o.priority === 'rush' ? 2 : 1);
  const sortByPriorityAndCreated = (a: Order, b: Order) => {
    const rushDiff = getRushWeight(b) - getRushWeight(a);
    if (rushDiff !== 0) return rushDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  };

  const columns = {
    new: orders
      .filter(o => o.status === 'barista' && o.items.every(it => it.status === 'ordered'))
      .sort(sortByPriorityAndCreated),
    preparing: orders
      .filter(o => o.status === 'barista' && o.items.some(it => it.status === 'preparing') && !o.items.every(it => it.status === 'ready' || it.status === 'served'))
      .sort(sortByPriorityAndCreated),
    ready: orders
      .filter(o => o.status === 'waiter' || (o.status === 'barista' && o.items.every(it => it.status === 'ready' || it.status === 'served')))
      .sort(sortByPriorityAndCreated),
    served: orders
      .filter(o => o.status === 'completed' || o.status === 'cashier' || o.items.every(it => it.status === 'served'))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) // latest served first
      .slice(0, 12) // Limit history inServed column
  };

  // --- STATS PANEL CALCS ---
  const totalActive = columns.new.length + columns.preparing.length;
  const totalReady = columns.ready.length;
  const totalServedToday = orders.filter(o => o.status === 'completed').length;
  const totalRush = orders.filter(o => o.priority === 'rush' && o.status !== 'completed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[80vh]">
        <div className="text-center space-y-4">
          <Coffee size={64} className="mx-auto text-primary animate-bounce opacity-80" />
          <div className="text-muted-foreground text-lg font-bold animate-pulse">Preheating the espresso machine...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Visual Flash Overlay for New Orders */}
      {flash && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-primary/10 border-4 border-primary animate-pulse" />
      )}

      {/* OPERATIONAL SUMMARY BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-info/10 text-info flex items-center justify-center font-bold">
            <Coffee size={24} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Active Prep</p>
            <p className="text-2xl font-black">{totalActive}</p>
          </div>
        </div>
        <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center font-bold">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Ready to Serve</p>
            <p className="text-2xl font-black text-success">{totalReady}</p>
          </div>
        </div>
        <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-danger/10 text-danger flex items-center justify-center font-bold animate-pulse">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Rush Priority</p>
            <p className="text-2xl font-black text-danger">{totalRush}</p>
          </div>
        </div>
        <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Completed Today</p>
            <p className="text-2xl font-black text-primary">{totalServedToday}</p>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 min-h-[70vh] pb-24">
        
        {/* COLUMN 1: NEW / ORDERED */}
        <div 
          className="bg-surface-elevated/40 rounded-2xl border border-border/60 flex flex-col p-4 space-y-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'new')}
        >
          <div className="flex justify-between items-center pb-2 border-b border-border/80">
            <h3 className="font-bold text-sm tracking-wider uppercase text-info flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-info" />
              New / Ordered ({columns.new.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[75vh] pr-1">
            {columns.new.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onDragStart={handleDragStart} 
                onViewRecipe={handleViewRecipe}
                onPrintTicket={setPrintTicketOrder}
                onToggleRush={toggleRush}
                updateItemStatus={updateItemStatus}
                updateOrderStatus={updateOrderStatus}
              />
            ))}
            {columns.new.length === 0 && <EmptyColumnState />}
          </div>
        </div>

        {/* COLUMN 2: PREPARING */}
        <div 
          className="bg-surface-elevated/40 rounded-2xl border border-border/60 flex flex-col p-4 space-y-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'preparing')}
        >
          <div className="flex justify-between items-center pb-2 border-b border-border/80">
            <h3 className="font-bold text-sm tracking-wider uppercase text-warning flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-warning" />
              Preparing ({columns.preparing.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[75vh] pr-1">
            {columns.preparing.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onDragStart={handleDragStart} 
                onViewRecipe={handleViewRecipe}
                onPrintTicket={setPrintTicketOrder}
                onToggleRush={toggleRush}
                updateItemStatus={updateItemStatus}
                updateOrderStatus={updateOrderStatus}
              />
            ))}
            {columns.preparing.length === 0 && <EmptyColumnState />}
          </div>
        </div>

        {/* COLUMN 3: READY TO SERVE */}
        <div 
          className="bg-surface-elevated/40 rounded-2xl border border-border/60 flex flex-col p-4 space-y-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'ready')}
        >
          <div className="flex justify-between items-center pb-2 border-b border-border/80">
            <h3 className="font-bold text-sm tracking-wider uppercase text-success flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-success" />
              Ready to Serve ({columns.ready.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[75vh] pr-1">
            {columns.ready.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onDragStart={handleDragStart} 
                onViewRecipe={handleViewRecipe}
                onPrintTicket={setPrintTicketOrder}
                onToggleRush={toggleRush}
                updateItemStatus={updateItemStatus}
                updateOrderStatus={updateOrderStatus}
              />
            ))}
            {columns.ready.length === 0 && <EmptyColumnState />}
          </div>
        </div>

        {/* COLUMN 4: SERVED / COMPLETED */}
        <div 
          className="bg-surface-elevated/40 rounded-2xl border border-border/60 flex flex-col p-4 space-y-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'served')}
        >
          <div className="flex justify-between items-center pb-2 border-b border-border/80">
            <h3 className="font-bold text-sm tracking-wider uppercase text-muted-foreground flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
              Served / Completed ({columns.served.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[75vh] pr-1">
            {columns.served.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onDragStart={handleDragStart} 
                onViewRecipe={handleViewRecipe}
                onPrintTicket={setPrintTicketOrder}
                onToggleRush={toggleRush}
                updateItemStatus={updateItemStatus}
                updateOrderStatus={updateOrderStatus}
                isServed={true}
              />
            ))}
            {columns.served.length === 0 && <EmptyColumnState />}
          </div>
        </div>

      </div>

      {/* RECIPE MODAL */}
      <Modal open={activeRecipeItem !== null} onClose={() => setActiveRecipeItem(null)} title={`Recipe: ${activeRecipeItem?.name}`}>
        {loadingRecipe ? (
          <div className="py-8 text-center animate-pulse">Consulting the barista handbook...</div>
        ) : recipes.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Sparkles size={36} className="opacity-40" />
            <p className="font-bold">No standard recipe found.</p>
            <p className="text-xs">Barista intuition is required here!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-surface-elevated p-4 rounded-xl border border-border">
              <h4 className="text-sm font-bold text-primary mb-3">Required Ingredients</h4>
              <div className="space-y-2">
                {recipes.map((rec, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-border-subtle py-1.5 text-sm">
                    <span className="font-medium text-foreground">{rec.ingredient.nameEn} ({rec.ingredient.nameAr})</span>
                    <span className="font-black text-primary">{rec.quantityUsed} {rec.ingredient.unit}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground italic text-center">Ensure standard coffee brewing parameters (1:2 ratio, 9 bar pressure) are met.</p>
          </div>
        )}
      </Modal>

      {/* PRINT PREPARATION TICKET */}
      <Modal open={printTicketOrder !== null} onClose={() => setPrintTicketOrder(null)} title="Prep Ticket Print Preview">
        {printTicketOrder && (
          <div className="space-y-6">
            <div className="border border-foreground/30 p-6 bg-white text-black font-mono text-xs w-[320px] mx-auto shadow-md relative">
              <div className="text-center space-y-1 mb-4">
                <h4 className="font-bold text-sm tracking-wider uppercase">RETRO SPOT</h4>
                <p className="text-[10px]">PREPARATION TICKET ONLY</p>
                <div className="border-b border-dashed border-black/50 my-2" />
              </div>

              <div className="space-y-1 text-[11px] mb-3">
                <p className="font-bold">TICKET: #{printTicketOrder.id.slice(0, 8).toUpperCase()}</p>
                <p>Location: {printTicketOrder.location?.name || 'Unknown'}</p>
                <p>Customer: {printTicketOrder.customerName || 'Guest'}</p>
                <p>Time: {new Date(printTicketOrder.createdAt).toLocaleTimeString()}</p>
                <p>Type: {printTicketOrder.orderType?.toUpperCase() || 'DINE IN'}</p>
              </div>

              <div className="border-b border-dashed border-black/50 my-2" />

              <table className="w-full text-left text-[11px] my-3">
                <thead>
                  <tr className="border-b border-dashed border-black/50">
                    <th className="pb-1 font-bold">QTY</th>
                    <th className="pb-1 font-bold">ITEM</th>
                  </tr>
                </thead>
                <tbody>
                  {printTicketOrder.items.map(item => (
                    <tr key={item.id} className="align-top">
                      <td className="py-1 font-bold pr-2">{item.quantity}x</td>
                      <td className="py-1">
                        <span className="font-bold">{item.menuItem.nameEn}</span>
                        {item.additions && (
                          <div className="text-[10px] pl-2 text-black/80">+ {item.additions}</div>
                        )}
                        {item.notes && (
                          <div className="text-[10px] pl-2 font-bold italic text-black/90">* {item.notes}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-b border-dashed border-black/50 my-2" />

              {printTicketOrder.notes && (
                <div className="border border-black/60 p-2 my-2 bg-black/5">
                  <p className="font-bold text-[10px] uppercase">Waitstaff Notes:</p>
                  <p className="text-[10px] leading-tight">{printTicketOrder.notes}</p>
                </div>
              )}

              <div className="text-center pt-4 text-[9px]">
                <p>Please double check recipes</p>
                <p>{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex gap-4 max-w-xs mx-auto">
              <Button className="flex-1 bg-black text-white hover:bg-black/90 flex items-center justify-center gap-2" onClick={() => window.print()}>
                <Printer size={18} /> Print Ticket
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setPrintTicketOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}

// --- SUB-COMPONENTS ---

interface OrderCardProps {
  order: Order;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onViewRecipe: (itemId: string, name: string) => void;
  onPrintTicket: (order: Order) => void;
  onToggleRush: (id: string) => void;
  updateItemStatus: (itemId: string, newStatus: string) => void;
  updateOrderStatus: (id: string, status: string) => void;
  isServed?: boolean;
}

function OrderCard({ 
  order, onDragStart, onViewRecipe, onPrintTicket, onToggleRush, updateItemStatus, updateOrderStatus, isServed = false 
}: OrderCardProps) {

  // Map individual item check state transitions
  const handleItemCheck = (item: OrderItem) => {
    if (item.status === 'ordered') {
      updateItemStatus(item.id, 'preparing');
    } else if (item.status === 'preparing') {
      updateItemStatus(item.id, 'ready');
    } else if (item.status === 'ready') {
      updateItemStatus(item.id, 'served');
    } else if (item.status === 'served') {
      updateItemStatus(item.id, 'ordered'); // Undo/reset
    }
  };

  const getCardStyle = () => {
    let base = "bg-surface border rounded-2xl shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing relative overflow-hidden flex flex-col ";
    if (order.priority === 'rush') {
      base += "border-danger border-2 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-[pulse_3s_infinite] ";
    } else {
      base += "border-border/80 hover:border-border hover:shadow-md ";
    }
    return base;
  };

  const getOrderStatusButton = () => {
    if (order.status === 'barista') {
      return (
        <Button size="sm" className="w-full bg-success hover:bg-success/90 flex justify-center items-center gap-1" onClick={() => updateOrderStatus(order.id, 'waiter')}>
          <Send size={14} /> Send to Waiter
        </Button>
      );
    }
    if (order.status === 'waiter') {
      return (
        <Button size="sm" className="w-full bg-primary hover:bg-primary/90 flex justify-center items-center gap-1" onClick={() => updateOrderStatus(order.id, 'completed')}>
          <CheckCircle2 size={14} /> Mark Served
        </Button>
      );
    }
    return null;
  };

  return (
    <div 
      draggable 
      onDragStart={(e) => onDragStart(e, order.id)}
      className={getCardStyle()}
    >
      {/* Rush Accent Header */}
      {order.priority === 'rush' && (
        <div className="bg-danger text-white py-1 px-3 flex items-center justify-between font-black text-[10px] tracking-widest uppercase">
          <span className="flex items-center gap-1"><AlertCircle size={10} /> Priority Rush</span>
          <span>Fast Track</span>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-border/40 bg-surface-elevated/40 flex justify-between items-start gap-4">
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground/60 cursor-grab"><GripVertical size={16} /></div>
          <div>
            <h4 className="text-base font-black text-foreground tracking-tight">#{order.id.slice(-5).toUpperCase()}</h4>
            <div className="flex items-center gap-1 mt-0.5">
              {order.orderType === 'takeaway' ? (
                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-500/20 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-amber-500/20">
                  Takeaway
                </span>
              ) : (
                <span className="bg-primary/10 text-primary dark:bg-primary/20 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-primary/20">
                  Dine In
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {!isServed && <OrderTimer createdAt={order.createdAt} />}
          <div className="flex gap-1">
            <button 
              onClick={() => onPrintTicket(order)}
              className="p-1 rounded bg-surface border border-border text-muted hover:text-foreground transition-colors"
              title="Print Prep Ticket"
            >
              <Printer size={13} />
            </button>
            {order.priority !== 'rush' && (
              <button 
                onClick={() => onToggleRush(order.id)}
                className="p-1 rounded bg-surface border border-border text-muted hover:text-danger hover:border-danger/30 transition-colors"
                title="Mark Rush"
              >
                <Zap size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-px bg-border/40 border-b border-border/40 text-xs font-semibold text-muted-foreground">
        <div className="bg-surface/50 p-2.5 flex items-center gap-1.5 truncate">
          <MapPin size={13} className="shrink-0" />
          <span className="text-foreground truncate">{order.location?.name || 'Unknown'}</span>
        </div>
        <div className="bg-surface/50 p-2.5 flex items-center gap-1.5 truncate">
          <User size={13} className="shrink-0" />
          <span className="text-foreground truncate">{order.customerName || 'Guest'}</span>
        </div>
      </div>

      {/* Items List Checklist */}
      <div className="p-4 flex-1">
        <ul className="space-y-3.5">
          {order.items.map(item => {
            const isChecked = item.status === 'ready' || item.status === 'served';
            const isPreparing = item.status === 'preparing';
            return (
              <li key={item.id} className={`flex items-start gap-3 transition-opacity ${isChecked ? 'opacity-55' : ''}`}>
                
                {/* Visual Status Indicator / Checkbox Button */}
                <button 
                  onClick={() => handleItemCheck(item)}
                  className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                    isChecked ? 'border-success bg-success text-white' : 
                    isPreparing ? 'border-warning bg-warning/10 text-warning animate-pulse' : 
                    'border-border hover:border-primary'
                  }`}
                >
                  {isChecked && <CheckCircle2 size={12} />}
                  {isPreparing && <span className="w-1.5 h-1.5 rounded-full bg-warning" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className={`font-bold text-sm leading-tight text-foreground ${isChecked ? 'line-through' : ''}`}>
                      <span className="text-primary font-black mr-1">{item.quantity}x</span> 
                      {item.menuItem.nameEn}
                    </p>
                    <button 
                      onClick={() => onViewRecipe(item.menuItemId, item.menuItem.nameEn)}
                      className="text-muted hover:text-primary transition-colors mt-0.5 shrink-0"
                      title="View Recipe"
                    >
                      <BookOpen size={13} />
                    </button>
                  </div>
                  {item.additions && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-medium leading-tight">
                      + {item.additions}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-[11px] text-accent font-bold mt-1 bg-accent/5 px-1.5 py-0.5 rounded border border-accent/15 leading-tight">
                      {item.notes}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Order Level Special Instructions */}
      {order.notes && (
        <div className="mx-4 mb-4 bg-danger/5 border border-danger/15 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-danger font-black mb-1 uppercase tracking-widest text-[9px]">
            <FileText size={12} /> Special Request
          </div>
          <p className="font-bold text-xs text-foreground leading-snug">{order.notes}</p>
        </div>
      )}

      {/* Actions */}
      {!isServed && getOrderStatusButton() && (
        <div className="p-4 bg-surface-elevated/40 border-t border-border/40 mt-auto">
          {getOrderStatusButton()}
        </div>
      )}
    </div>
  );
}

function EmptyColumnState() {
  return (
    <div className="py-12 text-center text-muted-foreground/60 border border-dashed border-border/30 rounded-2xl flex flex-col justify-center items-center gap-2 bg-surface/20">
      <Coffee size={36} className="opacity-40 animate-pulse" />
      <p className="text-xs font-bold uppercase tracking-wider">No active orders</p>
      <p className="text-[10px]">Machine is clean & preheated</p>
    </div>
  );
}
