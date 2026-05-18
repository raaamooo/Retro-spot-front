'use client';

import React, { useEffect, useState } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import { EVENTS } from '@/lib/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import { Printer, CheckCircle2, Receipt, Coffee, Edit, Plus, Minus, Trash2, X } from 'lucide-react';
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

interface MenuItem {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number;
  category?: { nameEn: string; nameAr: string };
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
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeReceiptLocation, setActiveReceiptLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal States
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [editOrdersState, setEditOrdersState] = useState<Order[]>([]);
  const [saving, setSaving] = useState(false);

  // --- FETCH INITIAL DATA ---
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/orders?status=cashier`).then(r => r.json()),
      fetch(`${API_URL}/api/menu-items`).then(r => r.json())
    ])
      .then(([ordersData, menuData]) => {
        setOrders(ordersData);
        setMenuItems(menuData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // --- SOCKET LISTENERS ---
  useSocketEvent<Order>(EVENTS.ORDER_STATUS_UPDATED, (order) => {
    if (order.status === 'cashier') {
      // New order arrived from waiter or updated
      setOrders(prev => {
        if (prev.some(o => o.id === order.id)) {
          return prev.map(o => o.id === order.id ? order : o);
        }
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

  // --- EDIT MODAL HANDLERS ---
  const openEditModal = (locationName: string) => {
    const locationOrders = groupedOrders[locationName] || [];
    const cloned = JSON.parse(JSON.stringify(locationOrders));
    setEditOrdersState(cloned);
    setEditingLocation(locationName);
  };

  const handleUpdateQuantity = (orderId: string, itemIdx: number, delta: number) => {
    setEditOrdersState(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const updatedItems = [...order.items];
      const currentQty = updatedItems[itemIdx].quantity;
      const newQty = currentQty + delta;
      if (newQty <= 0) {
        updatedItems.splice(itemIdx, 1);
      } else {
        updatedItems[itemIdx] = { ...updatedItems[itemIdx], quantity: newQty };
      }
      
      let subtotal = 0;
      updatedItems.forEach(item => {
        subtotal += item.itemPriceAtTime * item.quantity;
      });
      const total = subtotal + (order.tipAmount || 0);

      return { ...order, items: updatedItems, subtotal, total };
    }));
  };

  const handleUpdatePrice = (orderId: string, itemIdx: number, newPrice: number) => {
    setEditOrdersState(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const updatedItems = [...order.items];
      updatedItems[itemIdx] = { ...updatedItems[itemIdx], itemPriceAtTime: newPrice };
      
      let subtotal = 0;
      updatedItems.forEach(item => {
        subtotal += item.itemPriceAtTime * item.quantity;
      });
      const total = subtotal + (order.tipAmount || 0);

      return { ...order, items: updatedItems, subtotal, total };
    }));
  };

  const handleUpdateAdditions = (orderId: string, itemIdx: number, additions: string) => {
    setEditOrdersState(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const updatedItems = [...order.items];
      updatedItems[itemIdx] = { ...updatedItems[itemIdx], additions: additions || null };
      return { ...order, items: updatedItems };
    }));
  };

  const handleAddItem = (orderId: string, menuItemId: string) => {
    const selectedMenu = menuItems.find(m => m.id === menuItemId);
    if (!selectedMenu) return;

    setEditOrdersState(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const newItem = {
        id: 'temp-' + Date.now() + Math.random(),
        quantity: 1,
        additions: null,
        itemPriceAtTime: selectedMenu.price,
        menuItem: selectedMenu
      };
      const updatedItems = [...order.items, newItem];
      
      let subtotal = 0;
      updatedItems.forEach(item => {
        subtotal += item.itemPriceAtTime * item.quantity;
      });
      const total = subtotal + (order.tipAmount || 0);

      return { ...order, items: updatedItems, subtotal, total };
    }));
  };

  const handleUpdateTip = (orderId: string, tipAmount: number) => {
    setEditOrdersState(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const total = order.subtotal + (tipAmount || 0);
      return { ...order, tipAmount: tipAmount || 0, total };
    }));
  };

  const handleSaveEdits = async () => {
    setSaving(true);
    try {
      for (const order of editOrdersState) {
        const payload = {
          subtotal: order.subtotal,
          total: order.total,
          tipAmount: order.tipAmount,
          items: order.items.map(item => ({
            menuItemId: item.menuItem.id,
            quantity: item.quantity,
            additions: item.additions,
            itemPriceAtTime: item.itemPriceAtTime,
            notes: ''
          }))
        };

        await fetch(`${API_URL}/api/orders/${order.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      setEditingLocation(null);
    } catch (err) {
      console.error('Failed to save edits', err);
    } finally {
      setSaving(false);
    }
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
      <div className="hidden print:block text-black bg-white font-mono text-sm">
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

      {/* EDIT MODAL */}
      {editingLocation && (
        <div className="bg-background/80 backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-primary text-primary-foreground flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Edit Order(s)</h3>
                <p className="text-xs opacity-90">{editingLocation}</p>
              </div>
              <button 
                onClick={() => setEditingLocation(null)}
                className="text-primary-foreground/80 hover:text-primary-foreground p-1 transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              {editOrdersState.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No active orders found for this table.</p>
              ) : (
                editOrdersState.map((order) => (
                  <div key={order.id} className="bg-surface-elevated border border-border rounded-xl p-6 space-y-6 shadow-sm">
                    <div className="flex justify-between items-center border-b border-border pb-4">
                      <h4 className="text-lg font-black text-foreground">
                        Order #{order.id.slice(-6).toUpperCase()} {order.customerName ? `(${order.customerName})` : ''}
                      </h4>
                      <span className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-full">
                        {order.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-4">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('items') || 'Items'}</h5>
                      {order.items.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No items in this order.</p>
                      ) : (
                        order.items.map((item, idx) => (
                          <div key={item.id || idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-background rounded-xl border border-border">
                            <div className="flex-1 space-y-1">
                              <div className="font-bold text-foreground text-base">
                                {item.menuItem.nameEn} <span className="text-xs text-muted-foreground">({item.menuItem.nameAr})</span>
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <span className="text-xs text-muted-foreground">Additions:</span>
                                <input 
                                  type="text" 
                                  value={item.additions || ''} 
                                  onChange={(e) => handleUpdateAdditions(order.id, idx, e.target.value)}
                                  placeholder="e.g. Oat milk, caramel..." 
                                  className="bg-surface text-xs text-foreground px-2 py-1 rounded border border-border focus:outline-none focus:border-primary w-48"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-4 sm:gap-6">
                              {/* Price Input */}
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">Price:</span>
                                <input 
                                  type="number" 
                                  value={item.itemPriceAtTime} 
                                  onChange={(e) => handleUpdatePrice(order.id, idx, parseFloat(e.target.value) || 0)}
                                  className="bg-surface text-sm font-bold text-foreground px-2 py-1 rounded border border-border focus:outline-none focus:border-primary w-20 text-right"
                                />
                                <span className="text-xs text-muted-foreground">EGP</span>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2 bg-surface px-2 py-1 rounded-lg border border-border">
                                <button 
                                  onClick={() => handleUpdateQuantity(order.id, idx, -1)}
                                  className="text-muted-foreground hover:text-danger p-1 transition-colors"
                                  title="Decrease quantity / Remove"
                                >
                                  <Minus size={16} />
                                </button>
                                <span className="font-black text-sm px-2 text-foreground">{item.quantity}</span>
                                <button 
                                  onClick={() => handleUpdateQuantity(order.id, idx, 1)}
                                  className="text-muted-foreground hover:text-success p-1 transition-colors"
                                  title="Increase quantity"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>

                              {/* Remove Item Button */}
                              <button 
                                onClick={() => handleUpdateQuantity(order.id, idx, -item.quantity)}
                                className="text-muted-foreground hover:text-danger p-2 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add New Item Section */}
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t border-border">
                      <div className="flex-1">
                        <select 
                          id={`select-${order.id}`}
                          defaultValue=""
                          className="w-full bg-background text-sm text-foreground px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:border-primary"
                        >
                          <option value="" disabled>+ Select menu item to add...</option>
                          {menuItems.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.nameEn} ({m.price} EGP)
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button 
                        type="button"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                        onClick={() => {
                          const selectEl = document.getElementById(`select-${order.id}`) as HTMLSelectElement;
                          if (selectEl && selectEl.value) {
                            handleAddItem(order.id, selectEl.value);
                            selectEl.value = "";
                          }
                        }}
                      >
                        <Plus size={18} className="mr-1" /> Add Item
                      </Button>
                    </div>

                    {/* Financial Summary & Tip */}
                    <div className="bg-background p-4 rounded-xl border border-border space-y-3 text-sm">
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-bold text-foreground">{order.subtotal.toFixed(2)} EGP</span>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span className="flex items-center gap-2">
                          Tip Amount:
                          <input 
                            type="number" 
                            value={order.tipAmount} 
                            onChange={(e) => handleUpdateTip(order.id, parseFloat(e.target.value) || 0)}
                            className="bg-surface text-sm font-bold text-foreground px-2 py-1 rounded border border-border focus:outline-none focus:border-primary w-24 text-right"
                          />
                          EGP
                        </span>
                        <span className="font-bold text-foreground">{order.tipAmount.toFixed(2)} EGP</span>
                      </div>
                      <div className="flex justify-between items-center text-base font-black text-foreground pt-2 border-t border-border">
                        <span>Total</span>
                        <span className="text-primary">{order.total.toFixed(2)} EGP</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-surface-elevated border-t border-border flex justify-end gap-4">
              <Button 
                variant="outline" 
                onClick={() => setEditingLocation(null)}
              >
                Cancel
              </Button>
              <Button 
                className="bg-success hover:bg-success/90 text-white shadow-md"
                onClick={handleSaveEdits}
                disabled={saving || editOrdersState.length === 0}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

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
              <div
                key={locationName}
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
                <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-surface-elevated border-t border-border mt-auto">
                  <Button 
                    variant="outline" 
                    className="w-full text-foreground hover:bg-foreground hover:text-background transition-colors text-xs py-2 px-2"
                    onClick={() => triggerPrint(locationName)}
                  >
                    <Printer size={16} className="mr-1" /> {t('print_receipt')}
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-xs py-2 px-2"
                    onClick={() => openEditModal(locationName)}
                  >
                    <Edit size={16} className="mr-1" /> {t('edit') || 'Edit'}
                  </Button>
                  <Button 
                    className="w-full bg-success hover:bg-success/90 text-white shadow-md text-xs py-2 px-2"
                    onClick={() => markDone(locationName)}
                  >
                    <CheckCircle2 size={16} className="mr-1" /> {t('mark_done')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
