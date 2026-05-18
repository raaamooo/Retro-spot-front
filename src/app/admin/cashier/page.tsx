'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { EVENTS } from '@/lib/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import { Printer, CheckCircle2, Receipt, Coffee, Edit, Plus, Minus, Trash2, X, ShoppingCart, Send } from 'lucide-react';
import { Button, PageContainer, ScrollReveal } from '@/components';
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

interface Location {
  id: string;
  name: string;
  type: string;
  active: boolean;
}

export default function CashierPage() {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeReceiptLocation, setActiveReceiptLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal States
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [editOrdersState, setEditOrdersState] = useState<Order[]>([]);
  const [saving, setSaving] = useState(false);

  // POS System States
  const [posCart, setPosCart] = useState<Array<{
    menuItemId: string;
    nameEn: string;
    price: number;
    quantity: number;
    additions: string;
  }>>([]);
  const [posLocationId, setPosLocationId] = useState<string>('');
  const [posCustomerName, setPosCustomerName] = useState<string>('');
  const [posNotes, setPosNotes] = useState<string>('');
  const [posCategory, setPosCategory] = useState<string>('All');
  const [isSendingPos, setIsSendingPos] = useState<boolean>(false);

  // --- FETCH INITIAL DATA ---
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/orders?status=cashier`)
        .then(r => r.ok ? r.json() : [])
        .then(data => Array.isArray(data) ? data : [])
        .catch(() => []),
      fetch(`${API_URL}/api/menu-items`)
        .then(r => r.ok ? r.json() : [])
        .then(data => Array.isArray(data) ? data : [])
        .catch(() => []),
      fetch(`${API_URL}/api/locations`)
        .then(r => r.ok ? r.json() : [])
        .then(data => Array.isArray(data) ? data : [])
        .catch(() => [])
    ])
      .then(([ordersData, menuData, locationsData]) => {
        setOrders(ordersData);
        setMenuItems(menuData);
        setLocations(locationsData.filter((l: any) => l && l.active));
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
  const cashierOrders = Array.isArray(orders) ? orders.filter(o => o && o.status === 'cashier') : [];
  
  const locationNames = Array.isArray(locations)
    ? locations.filter(l => l && l.name).map(l => l.name)
    : [];
  
  // Create a map of Location -> Orders
  const groupedOrders: Record<string, Order[]> = {};
  locationNames.forEach(loc => {
    if (loc) groupedOrders[loc] = [];
  });
  
  cashierOrders.forEach(order => {
    const locName = order?.location?.name || 'Unknown';
    if (!groupedOrders[locName]) {
      groupedOrders[locName] = [];
    }
    groupedOrders[locName].push(order);
  });

  const displayLocations = Array.from(new Set([...locationNames, ...Object.keys(groupedOrders)]));

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

  // --- POS CART HANDLERS ---
  const handleAddPosCartItem = (item: MenuItem) => {
    setPosCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItemId: item.id, nameEn: item.nameEn, price: item.price, quantity: 1, additions: '' }];
    });
  };

  const handleUpdatePosCartQty = (index: number, delta: number) => {
    setPosCart(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        updated.splice(index, 1);
      } else {
        updated[index] = { ...updated[index], quantity: newQty };
      }
      return updated;
    });
  };

  const handleUpdatePosCartAdditions = (index: number, additions: string) => {
    setPosCart(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], additions };
      return updated;
    });
  };

  const handleSendToBarista = async () => {
    if (posCart.length === 0 || !posLocationId) return;
    setIsSendingPos(true);
    
    const cartTotal = posCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    try {
      const payload = {
        type: 'dine_in',
        locationId: posLocationId,
        customerName: posCustomerName || 'Counter POS',
        items: posCart.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          additions: item.additions || null,
          itemPriceAtTime: item.price,
          notes: null
        })),
        subtotal: cartTotal,
        total: cartTotal,
        paymentMethod: 'cash',
        tipAmount: 0,
        notes: posNotes
      };

      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create POS order');

      addToast('POS order created and sent to barista!', 'success');
      
      // Reset state
      setPosCart([]);
      setPosCustomerName('');
      setPosNotes('');
    } catch (err) {
      console.error('POS order error:', err);
      addToast('Failed to send order to barista', 'error');
    } finally {
      setIsSendingPos(false);
    }
  };

  // Derive categories and filtered menu items for POS view
  const safeMenuItems = Array.isArray(menuItems) ? menuItems.filter(item => item && item.id) : [];
  const posCategories = ['All', ...Array.from(new Set(safeMenuItems.map(item => item.category?.nameEn || 'Other').filter(Boolean)))];
  const filteredMenuItems = posCategory === 'All' 
    ? safeMenuItems 
    : safeMenuItems.filter(item => item.category?.nameEn === posCategory);

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
    <PageContainer>
      <ScrollReveal>
        {renderPrintReceipt()}

        {/* EDIT MODAL */}
        {editingLocation && (
          <div className="bg-background/80 backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-foreground">
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
                                    className="bg-surface text-xs text-foreground px-2 py-1 rounded border border-border focus:outline-none focus:border-primary w-48 font-semibold"
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
                            {safeMenuItems.map(m => (
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
            <h1 className="text-2xl font-black uppercase tracking-wider">{t('billing') || 'Billing & POS'}</h1>
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

          {/* POS SYSTEM SECTION */}
          <div className="space-y-6 pt-12 border-t border-border mt-12 print:hidden">
            <div className="flex items-center gap-3 bg-primary/10 text-primary px-4 py-3 rounded-xl border border-primary/20 w-max">
              <ShoppingCart size={24} />
              <h2 className="text-2xl font-black uppercase tracking-wider">POS System (Create Order)</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-surface p-6 rounded-3xl border border-border shadow-xl">
              {/* LEFT: Menu Picker (7 cols) */}
              <div className="lg:col-span-7 flex flex-col space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black uppercase tracking-wider text-muted-foreground">Menu Items</h3>
                  <span className="text-xs bg-background border border-border px-3 py-1 rounded-full text-foreground font-bold">
                    {filteredMenuItems.length} Items
                  </span>
                </div>

                {/* Category selector pills */}
                <div className="flex flex-wrap gap-2 pb-2">
                  {posCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setPosCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border ${
                        posCategory === cat
                          ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                          : 'bg-background hover:bg-surface-elevated text-muted-foreground border-border hover:border-muted'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Item cards list grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredMenuItems.length === 0 ? (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground">
                      <Coffee size={40} className="mb-2 opacity-50" />
                      <p className="font-bold">No items found</p>
                    </div>
                  ) : (
                    filteredMenuItems.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddPosCartItem(item)}
                        className="group text-left bg-background hover:bg-surface-elevated p-4 rounded-2xl border border-border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between h-36 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500" />
                        
                        <div className="space-y-1 relative z-10">
                          <h4 className="font-black text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {item.nameEn}
                          </h4>
                          <span className="text-xs text-muted-foreground block">
                            {item.category?.nameEn || 'Other'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center w-full relative z-10 pt-2 border-t border-dashed border-border/80">
                          <span className="font-black text-sm text-primary">
                            {item.price.toFixed(2)} EGP
                          </span>
                          <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                            <Plus size={16} />
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* RIGHT: Ticket Builder / Cart (5 cols) */}
              <div className="lg:col-span-5 flex flex-col space-y-6 border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black uppercase tracking-wider text-muted-foreground">Current Ticket</h3>
                  <span className="bg-primary/15 text-primary text-xs font-black px-3 py-1 rounded-full border border-primary/20">
                    {posCart.reduce((acc, curr) => acc + curr.quantity, 0)} Items
                  </span>
                </div>

                {/* Cart Items list */}
                <div className="flex-1 bg-background rounded-2xl border border-border p-4 min-h-[220px] max-h-[300px] overflow-y-auto space-y-3 custom-scrollbar">
                  {posCart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12">
                      <Receipt size={32} className="opacity-40 mb-2" />
                      <p className="text-xs font-bold text-center px-4">
                        Ticket is empty.<br />Tap menu items to start building.
                      </p>
                    </div>
                  ) : (
                    posCart.map((item, index) => (
                      <div key={index} className="flex flex-col gap-2 p-3 bg-surface rounded-xl border border-border/80 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5">
                            <h5 className="font-bold text-sm text-foreground">{item.nameEn}</h5>
                            <span className="text-xs text-primary font-bold">
                              {(item.price * item.quantity).toFixed(2)} EGP
                            </span>
                          </div>
                          
                          {/* Quantity Adjusters */}
                          <div className="flex items-center gap-1.5 bg-background border border-border px-2 py-1 rounded-lg">
                            <button
                              type="button"
                              onClick={() => handleUpdatePosCartQty(index, -1)}
                              className="text-muted-foreground hover:text-primary transition-colors hover:scale-110 active:scale-95 transition-transform"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdatePosCartQty(index, 1)}
                              className="text-muted-foreground hover:text-primary transition-colors hover:scale-110 active:scale-95 transition-transform"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Additions / Custom Notes input field directly inside Cart Item */}
                        <input
                          type="text"
                          placeholder="Additions (e.g. Oat milk, Extra shot)"
                          value={item.additions}
                          onChange={(e) => handleUpdatePosCartAdditions(index, e.target.value)}
                          className="w-full bg-background/50 hover:bg-background focus:bg-background text-xs px-3 py-1.5 rounded-lg border border-border focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
                        />
                      </div>
                    ))
                  )}
                </div>

                {/* Order Fields */}
                <div className="space-y-4">
                  {/* Location Selection Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                      Table / Location <span className="text-danger">*</span>
                    </label>
                    <select
                      value={posLocationId}
                      onChange={(e) => setPosLocationId(e.target.value)}
                      className="w-full bg-background text-sm text-foreground px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:border-primary font-bold shadow-sm"
                    >
                      <option value="" disabled>-- Select Table/Location --</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Customer Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Guest"
                        value={posCustomerName}
                        onChange={(e) => setPosCustomerName(e.target.value)}
                        className="w-full bg-background text-sm text-foreground px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:border-primary shadow-sm"
                      />
                    </div>

                    {/* Special Notes */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Special Notes
                      </label>
                      <input
                        type="text"
                        placeholder="Order instructions..."
                        value={posNotes}
                        onChange={(e) => setPosNotes(e.target.value)}
                        className="w-full bg-background text-sm text-foreground px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:border-primary shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial calculations */}
                <div className="bg-background p-4 rounded-2xl border border-border space-y-3 text-sm">
                  <div className="flex justify-between items-center text-base font-black text-foreground pt-1">
                    <span>Grand Total</span>
                    <span className="text-primary text-xl font-black">
                      {posCart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)} EGP
                    </span>
                  </div>
                </div>

                {/* Send Button */}
                <Button
                  type="button"
                  onClick={handleSendToBarista}
                  disabled={isSendingPos || posCart.length === 0 || !posLocationId}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Send size={18} />
                  {isSendingPos ? 'Sending...' : 'Send to Barista'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </PageContainer>
  );
}
