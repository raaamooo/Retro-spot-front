'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { EVENTS } from '@/lib/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import { Printer, CheckCircle2, Receipt, Coffee } from 'lucide-react';
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
    menuItem: { id: string; nameEn: string; nameAr: string; price: number };
  }[];
}

// Fixed venue locations
const ALL_LOCATIONS = [
  'Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5',
  'Room A', 'Room B', 'Room C',
  'Workspace Seats'
];

export default function CashierPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeReceiptLocation, setActiveReceiptLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // --- FETCH INITIAL DATA ---
  useEffect(() => {
    fetch(`${API_URL}/api/orders?status=cashier`)
      .then(r => r.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // --- SOCKET LISTENERS ---
  useSocketEvent<Order>(EVENTS.ORDER_STATUS_UPDATED, (order) => {
    if (order.status === 'cashier') {
      // New order arrived from waiter
      setOrders(prev => {
        if (prev.some(o => o.id === order.id)) return prev;
        return [order, ...prev];
      });
    } else {
      // Order moved past cashier — remove it
      setOrders(prev => prev.filter(o => o.id !== order.id));
    }
  });

  // --- GROUPING LOGIC ---
  const cashierOrders = orders.filter(o => o.status === 'cashier');
  
  // Create a map of Location -> Orders
  const groupedOrders: Record<string, Order[]> = {};
  ALL_LOCATIONS.forEach(loc => groupedOrders[loc] = []);
  
  cashierOrders.forEach(order => {
    const locName = order.location?.name || 'Unknown';
    if (!groupedOrders[locName]) {
      groupedOrders[locName] = [];
    }
    groupedOrders[locName].push(order);
  });

  const displayLocations = Array.from(new Set([...ALL_LOCATIONS, ...Object.keys(groupedOrders)]));

  // --- ACTIONS ---
  const markDone = async (locationName: string) => {
    const locationOrders = groupedOrders[locationName];
    if (!locationOrders || locationOrders.length === 0) return;

    const orderIds = locationOrders.map(o => o.id);
    // Optimistic removal
    setOrders(prev => prev.filter(o => !orderIds.includes(o.id)));

    // Send to backend
    for (const id of orderIds) {
      try {
        await fetch(`${API_URL}/api/orders/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        });
      } catch (err) {
        console.error('Failed to complete order', err);
      }
    }
  };

  const triggerPrint = (locationId: string) => {
    setActiveReceiptLocation(locationId);
    setTimeout(() => {
      window.print();
      setActiveReceiptLocation(null);
    }, 100);
  };

  // --- PRINT RECEIPT COMPONENT ---
  const renderPrintReceipt = () => {
    if (!activeReceiptLocation) return null;
    const locationOrders = groupedOrders[activeReceiptLocation] || [];
    if (locationOrders.length === 0) return null;

    let subtotal = 0;
    let tips = 0;
    const customers = new Set<string>();
    const paymentMethods = new Set<string>();

    locationOrders.forEach(o => {
      tips += o.tipAmount || 0;
      customers.add(o.customerName || 'Guest');
      paymentMethods.add(o.paymentMethod || 'Cash');
      o.items.forEach(item => {
        subtotal += item.itemPriceAtTime * item.quantity;
      });
    });

    return (
      <div className="hidden print:block w-[80mm] mx-auto text-black bg-white p-4 font-mono text-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black uppercase mb-1">Retro Spot</h1>
          <p className="text-xs">Cafe & Workspace</p>
          <p className="text-xs mt-2 border-b border-black border-dashed pb-2">
            {new Date().toLocaleString()}
          </p>
        </div>

        <div className="mb-4">
          <p className="font-bold text-lg">{activeReceiptLocation}</p>
          <p className="text-xs">Customers: {Array.from(customers).join(', ')}</p>
        </div>

        <table className="w-full mb-4">
          <thead className="border-b border-black border-dashed text-left">
            <tr>
              <th className="pb-1 w-2/3">Item</th>
              <th className="pb-1 w-1/3 text-right">Price</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {locationOrders.flatMap(o => o.items).map((item, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="py-2">
                  <div className="font-bold">{item.quantity}x {item.menuItem.nameEn}</div>
                  {item.additions && (
                    <div className="text-gray-600 pl-2">+ {item.additions}</div>
                  )}
                </td>
                <td className="py-2 text-right">
                  {item.itemPriceAtTime * item.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-black border-dashed pt-2 space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{subtotal.toFixed(2)} EGP</span>
          </div>
          <div className="flex justify-between">
            <span>Tips</span>
            <span>{tips.toFixed(2)} EGP</span>
          </div>
          <div className="flex justify-between font-black text-lg mt-2 border-t border-black pt-2">
            <span>TOTAL</span>
            <span>{(subtotal + tips).toFixed(2)} EGP</span>
          </div>
        </div>

        <div className="mt-6 text-center text-xs">
          <p>Paid via: {Array.from(paymentMethods).join(', ')}</p>
          <p className="mt-4 font-bold">Thank you for visiting Retro Spot!</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground text-lg font-medium animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {renderPrintReceipt()}

      <div className="space-y-6 print:hidden">
        
        <div className="flex items-center gap-3 bg-primary/10 text-primary px-4 py-3 rounded-xl border border-primary/20 w-max">
          <Receipt size={24} />
          <h2 className="text-2xl font-black uppercase tracking-wider">{t('billing')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayLocations.map(locationName => {
            const ordersAtLocation = groupedOrders[locationName] || [];
            const isActive = ordersAtLocation.length > 0;

            if (!isActive) {
              return (
                <div key={locationName} className="bg-surface/50 rounded-2xl border border-dashed border-border p-6 flex flex-col items-center justify-center text-muted-foreground/50 opacity-70">
                  <Coffee size={32} className="mb-2" />
                  <h3 className="text-xl font-bold">{locationName}</h3>
                  <span className="text-sm font-medium">{t('empty_table')}</span>
                </div>
              );
            }

            // Calculate Totals
            let subtotal = 0;
            let tips = 0;
            const paymentMethods = new Set<string>();
            ordersAtLocation.forEach(o => {
              tips += o.tipAmount || 0;
              paymentMethods.add(o.paymentMethod || 'Cash');
              o.items.forEach(item => { subtotal += item.itemPriceAtTime * item.quantity; });
            });
            const total = subtotal + tips;

            return (
              <motion.div
                key={locationName}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface rounded-2xl border-2 border-primary/50 shadow-lg overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="p-4 bg-primary text-primary-foreground flex justify-between items-center">
                  <h3 className="text-2xl font-black tracking-tight">{locationName}</h3>
                  <div className="bg-background/20 px-3 py-1 rounded-full text-xs font-bold">
                    {ordersAtLocation.length} Order{ordersAtLocation.length > 1 ? 's' : ''}
                  </div>
                </div>

                {/* Items Summary */}
                <div className="p-4 flex-1 border-b border-border bg-surface-elevated">
                  <ul className="space-y-3">
                    {ordersAtLocation.flatMap(o => o.items).map((item, idx) => (
                      <li key={idx} className="flex justify-between items-start text-sm">
                        <div>
                          <span className="font-bold text-foreground">{item.quantity}x {item.menuItem.nameEn}</span>
                          {item.additions && (
                            <p className="text-muted-foreground text-xs">+ {item.additions}</p>
                          )}
                        </div>
                        <span className="font-medium text-muted-foreground">{item.itemPriceAtTime * item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Financials */}
                <div className="p-4 space-y-2 text-sm font-medium bg-background">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t('subtotal')}</span>
                    <span>{subtotal.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t('tip')}</span>
                    <span>{tips.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between text-xl font-black text-foreground pt-2 border-t border-border">
                    <span>{t('total')}</span>
                    <span className="text-primary">{total.toFixed(2)} EGP</span>
                  </div>
                  <div className="pt-2 text-xs text-muted-foreground">
                    {t('payment')}: {Array.from(paymentMethods).join(', ')}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 grid grid-cols-2 gap-2 bg-surface-elevated border-t border-border mt-auto">
                  <Button 
                    variant="outline" 
                    className="w-full text-foreground hover:bg-foreground hover:text-background transition-colors"
                    onClick={() => triggerPrint(locationName)}
                  >
                    <Printer size={18} /> {t('print_receipt')}
                  </Button>
                  <Button 
                    className="w-full bg-success hover:bg-success/90 text-white shadow-md"
                    onClick={() => markDone(locationName)}
                  >
                    <CheckCircle2 size={18} /> {t('mark_done')}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
}
