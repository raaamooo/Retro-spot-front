'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useSocketEvent } from '@/hooks/useSocket';
import { EVENTS } from '@/lib/socket';
import { API_URL } from '@/lib/constants';
import { Button, Drawer, Modal } from '@/components';
import { Coffee, Search, Receipt, Plus, Minus, Trash2, CheckCircle2, X, Calculator, CreditCard, Banknote, SplitSquareHorizontal } from 'lucide-react';

// --- Types ---
interface MenuItem {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number;
  categoryId: string;
  category?: { nameEn: string; nameAr: string };
  imageUrl?: string;
}

interface MenuCategory {
  id: string;
  nameEn: string;
  nameAr: string;
}

interface OrderItem {
  id: string; // temp id for cart
  menuItem: MenuItem;
  quantity: number;
  additions: string | null;
  itemPriceAtTime: number;
}

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
    menuItem: MenuItem;
  }[];
}

interface Location {
  id: string;
  name: string;
  type: string;
}

export default function CashierManagement() {
  const { t } = useLanguage();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // POS State
  const [activeTab, setActiveTab] = useState<'menu' | 'pending' | 'snapshot'>('menu');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart State
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<'takeaway' | 'dine_in'>('takeaway');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(14); // Default 14% VAT
  const [servicePercent, setServicePercent] = useState(0); // 12% if dine-in
  const [loadedOrderId, setLoadedOrderId] = useState<string | null>(null); // If editing an existing order
  
  // Payment State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'visa' | 'split'>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  
  // Receipt
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<any>(null);

  // Snapshot & Completed Orders
  const [snapshotData, setSnapshotData] = useState<any>(null);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);

  // Loyalty
  const [customerPhone, setCustomerPhone] = useState('');
  const [loyaltyAccount, setLoyaltyAccount] = useState<any>(null);
  const [redeemedPoints, setRedeemedPoints] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, menuRes, ordRes, locRes] = await Promise.all([
        fetch(`${API_URL}/api/menu-categories`),
        fetch(`${API_URL}/api/menu-items`),
        fetch(`${API_URL}/api/orders?status=cashier`),
        fetch(`${API_URL}/api/locations`)
      ]);
      
      setCategories(await catRes.json());
      setMenuItems(await menuRes.json());
      setPendingOrders(await ordRes.json());
      setLocations(await locRes.json());
      setLoading(false);
    } catch (err) {
      console.error(err);
      addToast('Failed to load POS data', 'error');
      setLoading(false);
    }
  };

  useSocketEvent<Order>(EVENTS.ORDER_STATUS_UPDATED, (order) => {
    if (order.status === 'cashier') {
      setPendingOrders(prev => {
        if (prev.some(o => o.id === order.id)) {
          return prev.map(o => o.id === order.id ? order : o);
        }
        return [order, ...prev];
      });
    } else {
      setPendingOrders(prev => prev.filter(o => o.id !== order.id));
    }
    
    // Refresh snapshot if an order is completed
    if (order.status === 'completed' && activeTab === 'snapshot') {
      fetchSnapshotData();
    }
  });

  const fetchSnapshotData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders/snapshot`);
      const data = await res.json();
      setSnapshotData(data);

      const ordRes = await fetch(`${API_URL}/api/orders?status=completed`);
      const ordData = await ordRes.json();
      // Only keep today's completed orders
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      setCompletedOrders(ordData.filter((o: any) => new Date(o.createdAt) >= startOfDay));
    } catch (err) {
      console.error(err);
      addToast('Failed to load snapshot', 'error');
    }
  };

  useEffect(() => {
    if (activeTab === 'snapshot') {
      fetchSnapshotData();
    }
  }, [activeTab]);

  // --- Cart Calculations ---
  useEffect(() => {
    if (orderType === 'dine_in') {
      setServicePercent(12);
    } else {
      setServicePercent(0);
      setSelectedLocationId('');
    }
  }, [orderType]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.itemPriceAtTime * item.quantity), 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const serviceCharge = subtotalAfterDiscount * (servicePercent / 100);
  const taxAmount = (subtotalAfterDiscount + serviceCharge) * (taxPercent / 100);
  const loyaltyDiscount = redeemedPoints; // 1 Point = 1 EGP
  const total = Math.max(0, subtotalAfterDiscount + serviceCharge + taxAmount - loyaltyDiscount);

  // --- Actions ---
  const addToCart = (item: MenuItem) => {
    const existing = cartItems.find(i => i.menuItem.id === item.id && !i.additions);
    if (existing) {
      setCartItems(prev => prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCartItems(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        menuItem: item,
        quantity: 1,
        additions: null,
        itemPriceAtTime: item.price
      }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(i => {
      if (i.id === id) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }));
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setLoyaltyAccount(null);
    setRedeemedPoints(0);
    setLoadedOrderId(null);
    setDiscountPercent(0);
    setOrderType('takeaway');
  };

  const loadPendingOrder = (order: Order) => {
    setLoadedOrderId(order.id);
    setOrderType('dine_in');
    if (order.locationId) setSelectedLocationId(order.locationId);
    setCustomerName(order.customerName || '');
    setCartItems(order.items.map(i => ({
      id: Math.random().toString(36).substr(2, 9),
      menuItem: i.menuItem,
      quantity: i.quantity,
      additions: i.additions,
      itemPriceAtTime: i.itemPriceAtTime
    })));
    setActiveTab('menu');
  };

  // --- Payment & Checkout ---
  const handleCheckout = () => {
    if (cartItems.length === 0) return addToast('Cart is empty', 'error');
    if (orderType === 'dine_in' && !selectedLocationId && !loadedOrderId) {
      return addToast('Select a table for dine-in', 'error');
    }
    setCashTendered(total.toFixed(2));
    setIsPaymentModalOpen(true);
  };

  const processPayment = async () => {
    try {
      const payload = {
        locationId: selectedLocationId || undefined,
        customerName,
        orderType,
        paymentMethod,
        subtotal,
        taxAmount,
        discountAmount,
        serviceCharge,
        total,
        status: loadedOrderId ? 'completed' : 'barista', // If walking in, send to barista. If paying existing, complete it.
        items: cartItems.map(i => ({
          menuItemId: i.menuItem.id,
          quantity: i.quantity,
          additions: i.additions,
          itemPriceAtTime: i.itemPriceAtTime
        }))
      };

      let res;
      if (loadedOrderId) {
        // Settle existing order
        res = await fetch(`${API_URL}/api/orders/${loadedOrderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, status: 'completed' })
        });
      } else {
        // Create new POS order
        res = await fetch(`${API_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) throw new Error('Failed to process order');
      const savedOrder = await res.json();
      
      // Award loyalty points if phone provided
      if (customerPhone) {
        const pointsToEarn = Math.floor(total / 100); // 1 point per 100 EGP
        await fetch(`${API_URL}/api/loyalty/${customerPhone}/earn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ points: pointsToEarn, customerName })
        });
        
        // Also redeem points if any were applied
        if (redeemedPoints > 0) {
          await fetch(`${API_URL}/api/loyalty/${customerPhone}/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points: redeemedPoints })
          });
        }
      }

      addToast('Payment successful!', 'success');
      setIsPaymentModalOpen(false);
      setLastCompletedOrder({ ...savedOrder, _cartItems: cartItems });
      setIsReceiptOpen(true);
      clearCart();
      
      // Refresh pending if we just settled one
      if (loadedOrderId) {
        setPendingOrders(prev => prev.filter(o => o.id !== loadedOrderId));
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to process payment', 'error');
    }
  };

  const handleRefund = async (orderId: string, amount: number) => {
    const reason = prompt('Enter refund reason:');
    if (!reason) return;

    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason })
      });
      if (!res.ok) throw new Error('Refund failed');
      addToast('Refund processed successfully', 'success');
      fetchSnapshotData();
    } catch (err) {
      console.error(err);
      addToast('Failed to process refund', 'error');
    }
  };

  const checkLoyalty = async () => {
    if (!customerPhone || customerPhone.length < 10) return addToast('Enter valid phone number', 'error');
    try {
      const res = await fetch(`${API_URL}/api/loyalty/${customerPhone}`);
      const data = await res.json();
      setLoyaltyAccount(data);
      if (data.pointsBalance > 0) {
        addToast(`Customer has ${data.pointsBalance} points!`, 'success');
      } else {
        addToast('No points available for this number', 'info');
      }
    } catch (err) {
      addToast('Failed to check loyalty', 'error');
    }
  };

  // --- Numpad Logic ---
  const handleNumpad = (val: string) => {
    if (val === 'C') {
      setCashTendered('0');
    } else if (val === 'DEL') {
      setCashTendered(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else {
      setCashTendered(prev => prev === '0' ? val : prev + val);
    }
  };
  
  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - total);

  // --- Filtering Menu ---
  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => {
      const matchCat = selectedCategoryId === 'all' || item.categoryId === selectedCategoryId;
      const matchSearch = item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.nameAr.includes(searchQuery);
      return matchCat && matchSearch;
    });
  }, [menuItems, selectedCategoryId, searchQuery]);


  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-pulse font-bold text-xl text-primary">Loading POS...</div></div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)] w-full max-w-[1600px] mx-auto pb-6">
      
      {/* ── LEFT PANEL: TICKET BUILDER ── */}
      <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col bg-surface border border-border shadow-lg rounded-2xl overflow-hidden shrink-0">
        
        {/* Ticket Header */}
        <div className="bg-primary text-primary-foreground p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black uppercase flex items-center gap-2">
              <Receipt size={20} /> Current Ticket
            </h2>
            {loadedOrderId && (
              <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold animate-pulse">EDITING TABLE ORDER</span>
            )}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setOrderType('takeaway')}
              className={`flex-1 py-1.5 text-xs font-bold rounded ${orderType === 'takeaway' ? 'bg-white text-primary shadow' : 'bg-primary-foreground/10 hover:bg-primary-foreground/20'}`}
            >
              Takeaway
            </button>
            <button 
              onClick={() => setOrderType('dine_in')}
              className={`flex-1 py-1.5 text-xs font-bold rounded ${orderType === 'dine_in' ? 'bg-white text-primary shadow' : 'bg-primary-foreground/10 hover:bg-primary-foreground/20'}`}
            >
              Dine-In
            </button>
          </div>

          {orderType === 'dine_in' && !loadedOrderId && (
            <select 
              value={selectedLocationId}
              onChange={e => setSelectedLocationId(e.target.value)}
              className="bg-primary-foreground/10 text-primary-foreground text-sm p-2 rounded border border-primary-foreground/20 outline-none"
            >
              <option value="" disabled className="text-black">Select Table...</option>
              {locations.map(l => <option key={l.id} value={l.id} className="text-black">{l.name}</option>)}
            </select>
          )}
          
          <input 
            type="text" 
            placeholder="Customer Name (Optional)" 
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/60 text-sm p-2 rounded border border-primary-foreground/20 outline-none"
          />
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-elevated">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50">
              <Coffee size={48} className="mb-4 opacity-50" />
              <p className="font-bold">Cart is empty</p>
              <p className="text-sm">Select items from the menu to build a ticket</p>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className="flex flex-col bg-background p-3 rounded-xl border border-border shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <p className="font-bold text-foreground text-sm leading-tight">{item.menuItem.nameEn}</p>
                    <p className="text-xs text-primary font-bold mt-1">{(item.itemPriceAtTime * item.quantity).toFixed(2)} EGP</p>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-surface rounded-lg border border-border">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 text-muted-foreground hover:text-danger"><Minus size={14} /></button>
                    <span className="font-black text-sm w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 text-muted-foreground hover:text-success"><Plus size={14} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Checkout */}
        <div className="bg-surface border-t border-border p-4 space-y-2 text-sm font-medium">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground group">
            <span>Discount %</span>
            <input 
              type="number" 
              value={discountPercent} 
              onChange={e => setDiscountPercent(Number(e.target.value) || 0)}
              className="w-16 text-right bg-background border border-border rounded px-1 group-hover:border-primary"
            />
          </div>
          {(taxPercent > 0 || servicePercent > 0) && (
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>Tax ({taxPercent}%) & Serv ({servicePercent}%)</span>
              <span>{(taxAmount + serviceCharge).toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-end border-t border-border pt-3 mt-1">
            <button onClick={clearCart} className="text-danger text-xs font-bold flex items-center hover:underline">
              <Trash2 size={14} className="mr-1"/> Clear
            </button>
            <div className="text-right">
              <span className="block text-xs text-muted-foreground uppercase tracking-widest mb-1">Total to Pay</span>
              <span className="text-3xl font-black text-primary">{total.toFixed(2)} <span className="text-sm">EGP</span></span>
            </div>
          </div>

          <Button 
            className="w-full h-14 mt-4 bg-primary hover:bg-primary-dark text-primary-foreground text-lg shadow-lg"
            onClick={handleCheckout}
            disabled={cartItems.length === 0}
          >
            Charge {total.toFixed(2)} EGP
          </Button>
        </div>
      </div>

      {/* ── RIGHT PANEL: POS & TABS ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button 
            className={`flex-1 py-4 font-bold text-sm tracking-wider transition-colors ${activeTab === 'menu' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-muted-foreground hover:bg-surface-elevated'}`}
            onClick={() => setActiveTab('menu')}
          >
            MENU PICKER
          </button>
          <button 
            className={`flex-1 py-4 font-bold text-sm tracking-wider transition-colors flex justify-center items-center gap-2 ${activeTab === 'pending' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-muted-foreground hover:bg-surface-elevated'}`}
            onClick={() => setActiveTab('pending')}
          >
            TABLE ORDERS 
            {pendingOrders.length > 0 && <span className="bg-danger text-white text-[10px] px-2 py-0.5 rounded-full">{pendingOrders.length}</span>}
          </button>
          <button 
            className={`flex-1 py-4 font-bold text-sm tracking-wider transition-colors ${activeTab === 'snapshot' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-muted-foreground hover:bg-surface-elevated'}`}
            onClick={() => setActiveTab('snapshot')}
          >
            DAILY SNAPSHOT
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          
          {/* MENU TAB */}
          {activeTab === 'menu' && (
            <>
              {/* Filters */}
              <div className="p-4 flex gap-4 bg-surface border-b border-border overflow-x-auto hide-scrollbar">
                <div className="relative shrink-0">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search menu..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-background border border-border rounded-full text-sm outline-none focus:border-primary w-48"
                  />
                </div>
                <button 
                  onClick={() => setSelectedCategoryId('all')}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-colors ${selectedCategoryId === 'all' ? 'bg-primary text-primary-foreground' : 'bg-surface-elevated text-foreground hover:bg-border'}`}
                >
                  All Items
                </button>
                {categories.map(c => (
                  <button 
                    key={c.id}
                    onClick={() => setSelectedCategoryId(c.id)}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-colors ${selectedCategoryId === c.id ? 'bg-primary text-primary-foreground' : 'bg-surface-elevated text-foreground hover:bg-border'}`}
                  >
                    {c.nameEn}
                  </button>
                ))}
              </div>

              {/* Menu Grid */}
              <div className="flex-1 p-4 overflow-y-auto bg-surface-elevated">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {filteredMenu.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="bg-background rounded-xl p-3 border border-border cursor-pointer hover:border-primary hover:shadow-md transition-all active:scale-95 flex flex-col h-32 relative overflow-hidden group"
                    >
                      <div className="font-bold text-sm leading-tight text-foreground line-clamp-2 pr-4">{item.nameEn}</div>
                      <div className="text-xs text-muted-foreground mt-1">{item.category?.nameEn}</div>
                      <div className="mt-auto font-black text-primary text-lg">{item.price}</div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-white rounded-full p-1">
                        <Plus size={14} />
                      </div>
                    </div>
                  ))}
                  {filteredMenu.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground">No menu items found.</div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* PENDING TABLE ORDERS TAB */}
          {activeTab === 'pending' && (
            <div className="flex-1 p-6 overflow-y-auto bg-surface-elevated">
              {pendingOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <CheckCircle2 size={48} className="mb-4 opacity-50" />
                  <p className="font-bold text-lg">All caught up!</p>
                  <p>No active orders waiting for checkout.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {pendingOrders.map(order => (
                    <div key={order.id} className="bg-background rounded-xl border border-border shadow-sm p-4 flex flex-col relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-warning"></div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-black text-lg">{order.location?.name}</h3>
                          <p className="text-xs text-muted-foreground">Order #{order.id.slice(-5).toUpperCase()}</p>
                        </div>
                        <span className="font-bold text-primary text-xl">{order.total.toFixed(2)} EGP</span>
                      </div>
                      <ul className="text-sm space-y-1 mb-4 flex-1">
                        {order.items.slice(0, 3).map(i => (
                          <li key={i.id} className="truncate text-muted-foreground">{i.quantity}x {i.menuItem.nameEn}</li>
                        ))}
                        {order.items.length > 3 && <li className="text-xs italic">+{order.items.length - 3} more items</li>}
                      </ul>
                      <Button 
                        onClick={() => loadPendingOrder(order)}
                        className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                      >
                        Load to POS
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DAILY SNAPSHOT TAB */}
          {activeTab === 'snapshot' && (
            <div className="flex-1 p-6 overflow-y-auto bg-surface-elevated">
              {snapshotData ? (
                <div className="space-y-8">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-background p-4 rounded-xl border border-border shadow-sm">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Gross Sales</p>
                      <p className="text-2xl font-black text-foreground">{snapshotData.grossSales.toFixed(2)}</p>
                    </div>
                    <div className="bg-background p-4 rounded-xl border border-border shadow-sm">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Net Sales</p>
                      <p className="text-2xl font-black text-success">{snapshotData.netSales.toFixed(2)}</p>
                    </div>
                    <div className="bg-background p-4 rounded-xl border border-border shadow-sm">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Cash</p>
                      <p className="text-2xl font-black text-foreground">{snapshotData.cashSales.toFixed(2)}</p>
                    </div>
                    <div className="bg-background p-4 rounded-xl border border-border shadow-sm">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Visa</p>
                      <p className="text-2xl font-black text-foreground">{snapshotData.visaSales.toFixed(2)}</p>
                    </div>
                    <div className="bg-background p-4 rounded-xl border border-border shadow-sm">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Total Tips</p>
                      <p className="text-2xl font-black text-foreground">{snapshotData.totalTips.toFixed(2)}</p>
                    </div>
                    <div className="bg-background p-4 rounded-xl border border-border shadow-sm">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Voids/Waste</p>
                      <p className="text-2xl font-black text-danger">{snapshotData.totalVoids.toFixed(2)}</p>
                    </div>
                    <div className="bg-background p-4 rounded-xl border border-border shadow-sm">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Orders</p>
                      <p className="text-2xl font-black text-foreground">{snapshotData.completedOrders}</p>
                    </div>
                    <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 shadow-sm flex flex-col justify-center items-center cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => {
                        if (confirm('Are you sure you want to print the Z-Report and close shift?')) {
                          addToast('Shift closed and report sent to printer!', 'success');
                        }
                      }}>
                      <Receipt size={24} className="text-primary mb-1" />
                      <p className="text-sm font-bold text-primary">Print Z-Report</p>
                    </div>
                  </div>

                  {/* Completed Orders List for Refunds */}
                  <div>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><CheckCircle2 size={18} /> Today's Completed Orders</h3>
                    {completedOrders.length === 0 ? (
                      <p className="text-muted-foreground">No completed orders yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {completedOrders.map(order => (
                          <div key={order.id} className="bg-background p-4 rounded-xl border border-border flex justify-between items-center">
                            <div>
                              <p className="font-bold text-sm">Order #{order.id.slice(-5).toUpperCase()} <span className="text-xs text-muted-foreground ml-2">{new Date(order.createdAt).toLocaleTimeString()}</span></p>
                              <p className="text-xs text-muted-foreground mt-1">{order.items.length} items • {order.paymentMethod.toUpperCase()}</p>
                              {(order as any).refundAmount > 0 && (
                                <p className="text-xs text-danger font-bold mt-1">Refunded: {(order as any).refundAmount.toFixed(2)} EGP</p>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="font-black text-lg">{order.total.toFixed(2)}</p>
                              <Button variant="outline" className="border-danger text-danger hover:bg-danger/10" onClick={() => handleRefund(order.id, order.total)}>
                                Refund
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full"><div className="animate-pulse">Loading snapshot...</div></div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── PAYMENT MODAL ── */}
      <Modal 
        open={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)}
        title="Checkout Payment"
      >
        <div className="p-4 space-y-6">
          <div className="flex justify-between items-center bg-surface-elevated p-4 rounded-xl border border-border">
            <span className="text-muted-foreground uppercase font-bold tracking-widest text-sm">Total Due</span>
            <span className="text-4xl font-black text-primary">{total.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => setPaymentMethod('cash')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 font-bold transition-colors ${paymentMethod === 'cash' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-surface-elevated'}`}
            >
              <Banknote size={24} /> Cash
            </button>
            <button 
              onClick={() => setPaymentMethod('visa')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 font-bold transition-colors ${paymentMethod === 'visa' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-surface-elevated'}`}
            >
              <CreditCard size={24} /> Card
            </button>
            <button 
              onClick={() => setPaymentMethod('split')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 font-bold transition-colors ${paymentMethod === 'split' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-surface-elevated'}`}
            >
              <SplitSquareHorizontal size={24} /> Split
            </button>
          </div>

          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Tendered Amount</label>
                  <input 
                    type="text" 
                    value={cashTendered}
                    readOnly
                    className="w-full text-2xl font-black p-3 bg-background border border-border rounded-xl outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Change Due</label>
                  <div className={`text-2xl font-black p-3 rounded-xl border ${changeDue > 0 ? 'bg-success/10 text-success border-success/30' : 'bg-surface-elevated text-muted-foreground border-transparent'}`}>
                    {changeDue.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Numpad */}
              <div className="numpad-grid">
                {['1','2','3','4','5','6','7','8','9','C','0','DEL'].map(key => (
                  <button 
                    key={key} 
                    onClick={() => handleNumpad(key)}
                    className="numpad-btn"
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loyalty Section */}
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">Loyalty Points (Optional)</h4>
            <div className="flex gap-2 mb-2">
              <input 
                type="text" 
                placeholder="Phone Number (e.g. 010...)" 
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="flex-1 bg-background border border-border rounded-lg p-2 text-sm outline-none focus:border-primary"
              />
              <Button variant="outline" onClick={checkLoyalty}>Check</Button>
            </div>
            
            {loyaltyAccount && (
              <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-primary">{loyaltyAccount.pointsBalance} Points Available</p>
                  <p className="text-xs text-muted-foreground">Will earn {Math.floor(total / 100)} new points on this order.</p>
                </div>
                {loyaltyAccount.pointsBalance > 0 && (
                  <Button 
                    size="sm" 
                    onClick={() => {
                      const maxRedeem = Math.min(loyaltyAccount.pointsBalance, total);
                      const pointsToUse = parseInt(prompt(`How many points to redeem? (Max ${maxRedeem})`, maxRedeem.toString()) || '0');
                      if (pointsToUse > 0 && pointsToUse <= maxRedeem && pointsToUse <= loyaltyAccount.pointsBalance) {
                        setRedeemedPoints(pointsToUse);
                      }
                    }}
                  >
                    Redeem
                  </Button>
                )}
              </div>
            )}
            {redeemedPoints > 0 && (
              <p className="text-xs font-bold text-danger mt-2">- {redeemedPoints} EGP Discount Applied</p>
            )}
          </div>

          <Button 
            className="w-full h-14 bg-success hover:bg-success/90 text-white text-lg shadow-lg"
            onClick={processPayment}
            disabled={paymentMethod === 'cash' && tenderedNum < total}
          >
            Complete Transaction
          </Button>
        </div>
      </Modal>

      {/* ── RECEIPT DRAWER ── */}
      <Drawer
        open={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        title="Transaction Complete"
        width="400px"
      >
        {lastCompletedOrder && (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center bg-white text-black p-6 font-mono text-sm shadow-inner rounded-lg mb-6 border border-gray-200" id="receipt-preview">
              <h1 className="text-2xl font-black uppercase mb-1 tracking-tighter">Retro Spot</h1>
              <p className="text-xs mb-1">Order #{lastCompletedOrder.id.slice(-6).toUpperCase()}</p>
              <p className="text-xs font-bold uppercase tracking-wider mb-4 bg-gray-100 px-2 py-0.5 rounded inline-block">
                Type: {lastCompletedOrder.orderType || 'dine_in'}
              </p>
              
              <div className="w-full border-b border-dashed border-black mb-4"></div>
              
              <table className="w-full mb-4">
                <tbody>
                  {lastCompletedOrder._cartItems?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-1">
                        <div>{item.quantity}x {item.menuItem.nameEn}</div>
                        {item.additions && <div className="text-xs text-gray-500 pl-4">+ {item.additions}</div>}
                      </td>
                      <td className="py-1 text-right">{(item.itemPriceAtTime * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="w-full border-b border-dashed border-black mb-4"></div>
              
              <div className="w-full space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>{lastCompletedOrder.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>{lastCompletedOrder.taxAmount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Service</span><span>{lastCompletedOrder.serviceCharge.toFixed(2)}</span></div>
                {lastCompletedOrder.discountAmount > 0 && (
                  <div className="flex justify-between"><span>Discount</span><span>-{lastCompletedOrder.discountAmount.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between font-black text-lg pt-2 mt-2 border-t border-black">
                  <span>TOTAL</span>
                  <span>{lastCompletedOrder.total.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mt-8 text-center text-xs space-y-1">
                <p>Payment: {lastCompletedOrder.paymentMethod.toUpperCase()}</p>
                <p>{new Date().toLocaleString()}</p>
                <p className="mt-4 font-bold">Thank you for visiting Retro Spot!</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto">
              <Button variant="outline" onClick={() => setIsReceiptOpen(false)}>Close</Button>
              <Button onClick={() => {
                const content = document.getElementById('receipt-preview')?.innerHTML;
                const printWindow = window.open('', '', 'height=600,width=400');
                if (printWindow && content) {
                  printWindow.document.write('<html><head><title>Print Receipt</title>');
                  printWindow.document.write('<style>body{font-family:monospace;padding:20px;}</style>');
                  printWindow.document.write('</head><body>');
                  printWindow.document.write(content);
                  printWindow.document.write('</body></html>');
                  printWindow.document.close();
                  printWindow.print();
                }
              }}>
                <Receipt size={18} className="mr-2" /> Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Drawer>

    </div>
  );
}
