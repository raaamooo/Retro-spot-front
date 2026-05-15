'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { EVENTS } from '@/lib/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import {
  LayoutDashboard, DollarSign, Users, Package, Bell,
  TrendingUp, TrendingDown, QrCode, Clock, MapPin,
  ShoppingCart, CheckCircle2, AlertTriangle, User,
  Plus, Edit, Trash2, Printer, X
} from 'lucide-react';
import { Button, Card, FormInput, Select } from '@/components';

import { API_URL } from '@/lib/constants';

// --- Types ---
interface Order {
  id: string;
  locationId: string;
  customerName: string;
  status: string;
  total: number;
  tipAmount: number;
  paymentMethod: string;
  createdAt: string;
  location: { id: string; name: string; type: string };
  items: {
    id: string;
    quantity: number;
    menuItem: { nameEn: string; price: number };
  }[];
}

interface AccountingRecord {
  id: string;
  source: string;
  amount: number;
  paymentMethod: string;
  createdAt: string;
}

interface Worker {
  id: string;
  name: string;
  role: string;
  isOnline?: boolean;
}

interface WaiterCall {
  id: string;
  locationId: string;
  status: string;
  createdAt: string;
  location: { name: string };
}

export default function ManagerPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'accounting' | 'workers' | 'qr'>('overview');
  
  // Data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [accounting, setAccounting] = useState<AccountingRecord[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [activeCalls, setActiveCalls] = useState<WaiterCall[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Workers CRUD state
  const [isAddingWorker, setIsAddingWorker] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [workerForm, setWorkerForm] = useState({ name: '', role: 'barista', email: '', phone: '', password: '' });

  // Locations CRUD state
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [locationForm, setLocationForm] = useState({ name: '', type: 'table' });

  // Batch Generation State
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchForm, setBatchForm] = useState({ count: 10, startNum: 1, baseUrl: '' });

  // Set default baseUrl on mount
  useEffect(() => {
    setBatchForm(prev => ({ ...prev, baseUrl: window.location.origin }));
  }, []);

  // --- FETCH INITIAL DATA ---
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/orders`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/api/accounting`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/api/workers`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/api/waitercalls`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/api/locations`).then(r => r.json()).catch(() => []),
    ]).then(([ordersData, accountingData, workersData, callsData, locationsData]) => {
      setOrders(ordersData);
      setAccounting(accountingData);
      setWorkers(workersData);
      setActiveCalls(callsData);
      setLocations(locationsData);
      setLoading(false);
    });
  }, []);

  // --- SOCKET LISTENERS ---
  useSocketEvent<Order>(EVENTS.ORDER_NEW, (order) => {
    setOrders(prev => [order, ...prev]);
  });

  useSocketEvent<Order>(EVENTS.ORDER_STATUS_UPDATED, (order) => {
    setOrders(prev => prev.map(o => o.id === order.id ? order : o));
  });

  useSocketEvent<AccountingRecord>(EVENTS.ACCOUNTING_UPDATED, (record) => {
    setAccounting(prev => [record, ...prev]);
  });

  useSocketEvent<WaiterCall>(EVENTS.WAITER_CALL_NEW, (call) => {
    setActiveCalls(prev => [call, ...prev]);
  });

  useSocketEvent<WaiterCall>(EVENTS.WAITER_CALL_RESOLVED, (call) => {
    setActiveCalls(prev => prev.filter(c => c.id !== call.id));
  });

  // --- COMPUTED DATA ---
  const todayOrders = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter(o => new Date(o.createdAt).toDateString() === today);
  }, [orders]);

  const todayRevenue = useMemo(() => {
    return todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [todayOrders]);

  const todayTips = useMemo(() => {
    return todayOrders.reduce((sum, o) => sum + (o.tipAmount || 0), 0);
  }, [todayOrders]);

  const activeOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  }, [orders]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { barista: 0, waiter: 0, cashier: 0, completed: 0 };
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  }, [orders]);

  // --- QR GENERATION ---
  const generateQR = async (locationId: string) => {
    setSelectedLocation(locationId);
    try {
      const res = await fetch(`${API_URL}/api/locations/${locationId}/qr?baseUrl=${encodeURIComponent(batchForm.baseUrl)}`);
      const data = await res.json();
      setQrDataUrl(data.qrCodeUrl);
    } catch (err) {
      console.error('Failed to generate QR', err);
    }
  };

  // --- WORKERS CRUD ---
  const saveWorker = async () => {
    try {
      const isEdit = !!editingWorkerId;
      const url = isEdit ? `${API_URL}/api/workers/${editingWorkerId}` : `${API_URL}/api/workers`;
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workerForm)
      });
      if (!res.ok) throw new Error('Failed to save worker');
      const updatedWorker = await res.json();
      
      if (isEdit) {
        setWorkers(prev => prev.map(w => w.id === editingWorkerId ? updatedWorker : w));
      } else {
        setWorkers(prev => [...prev, updatedWorker]);
      }
      setIsAddingWorker(false);
      setEditingWorkerId(null);
      setWorkerForm({ name: '', role: 'barista', email: '', phone: '', password: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteWorker = async (id: string) => {
    if (!confirm('Are you sure you want to remove this worker?')) return;
    try {
      const res = await fetch(`${API_URL}/api/workers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete worker');
      setWorkers(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const editWorker = (worker: Worker) => {
    setEditingWorkerId(worker.id);
    setWorkerForm({ name: worker.name, role: worker.role, email: (worker as any).email || '', phone: (worker as any).phone || '', password: '' });
    setIsAddingWorker(true);
  };

  // --- LOCATIONS CRUD ---
  const saveLocation = async () => {
    try {
      const res = await fetch(`${API_URL}/api/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationForm)
      });
      if (!res.ok) throw new Error('Failed to create location');
      const newLoc = await res.json();
      setLocations(prev => [...prev, newLoc]);
      setIsAddingLocation(false);
      setLocationForm({ name: '', type: 'table' });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteLocation = async (id: string) => {
    if (!confirm('Are you sure you want to remove this location?')) return;
    try {
      const res = await fetch(`${API_URL}/api/locations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete location');
      setLocations(prev => prev.filter(l => l.id !== id));
      if (selectedLocation === id) setQrDataUrl(null);
    } catch (err) {
      console.error(err);
    }
  };

  const batchGenerateLocations = async () => {
    try {
      const newLocations: any[] = [];
      for (let i = 0; i < batchForm.count; i++) {
        const name = `Table ${batchForm.startNum + i}`;
        const res = await fetch(`${API_URL}/api/locations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, type: 'table' })
        });
        if (res.ok) {
          newLocations.push(await res.json());
        }
      }
      setLocations(prev => [...prev, ...newLocations]);
      setIsBatchGenerating(false);
    } catch (err) {
      console.error(err);
    }
  };

  const printAllQRs = async () => {
    if (locations.length === 0) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print All QRs</title>
          <style>
            body { font-family: sans-serif; text-align: center; }
            .page { page-break-after: always; padding: 50px; }
            img { max-width: 300px; margin: 0 auto 20px; display: block; }
            h1 { font-size: 24px; margin-bottom: 5px; }
            p { color: #666; font-size: 14px; }
            @media print { body { padding: 0; } .page { padding: 0; padding-top: 50px; } }
          </style>
        </head>
        <body>
    `);

    for (const loc of locations) {
      try {
        const res = await fetch(`${API_URL}/api/locations/${loc.id}/qr?baseUrl=${encodeURIComponent(batchForm.baseUrl)}`);
        const data = await res.json();
        printWindow.document.write(`
          <div class="page">
            <h1>${loc.name}</h1>
            <p>Scan to order or call a waiter</p>
            <img src="${data.qrCodeUrl}" alt="QR Code" />
          </div>
        `);
      } catch (err) {
        console.error('Failed to load QR for', loc.name);
      }
    }

    printWindow.document.write(`
          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printQR = () => {
    if (!qrDataUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const locName = locations.find((l: any) => l.id === selectedLocation)?.name || 'Location';
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - ${locName}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; }
            img { max-width: 300px; margin: 0 auto 20px; display: block; }
            h1 { font-size: 24px; margin-bottom: 5px; }
            p { color: #666; font-size: 14px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>${locName}</h1>
          <p>Scan to order or call a waiter</p>
          <img src="${qrDataUrl}" alt="QR Code" />
          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // --- TABS ---
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'accounting', label: 'Accounting', icon: DollarSign },
    { id: 'workers', label: 'Workers', icon: Users },
    { id: 'qr', label: 'QR Codes', icon: QrCode },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground text-lg font-medium animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-surface border border-border text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Calls Banner */}
      {activeCalls.length > 0 && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-center gap-3 animate-pulse">
          <Bell size={24} className="text-danger" />
          <div>
            <p className="font-bold text-danger">{activeCalls.length} active waiter call(s)</p>
            <p className="text-sm text-danger/70">
              {activeCalls.map(c => c.location?.name || 'Unknown').join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* ═══════════ OVERVIEW TAB ═══════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 text-center">
              <TrendingUp size={28} className="text-success mx-auto mb-2" />
              <p className="text-3xl font-black text-foreground">{todayRevenue.toFixed(0)}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Today's Revenue (EGP)</p>
            </Card>
            <Card className="p-6 text-center">
              <ShoppingCart size={28} className="text-primary mx-auto mb-2" />
              <p className="text-3xl font-black text-foreground">{todayOrders.length}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Today's Orders</p>
            </Card>
            <Card className="p-6 text-center">
              <DollarSign size={28} className="text-accent mx-auto mb-2" />
              <p className="text-3xl font-black text-foreground">{todayTips.toFixed(0)}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tips (EGP)</p>
            </Card>
            <Card className="p-6 text-center">
              <Clock size={28} className="text-warning mx-auto mb-2" />
              <p className="text-3xl font-black text-foreground">{activeOrders.length}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Orders</p>
            </Card>
          </div>

          {/* Pipeline Status */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Order Pipeline</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Barista', count: statusCounts.barista, color: 'text-info bg-info/10 border-info/30' },
                { label: 'Waiter', count: statusCounts.waiter, color: 'text-warning bg-warning/10 border-warning/30' },
                { label: 'Cashier', count: statusCounts.cashier, color: 'text-accent bg-accent/10 border-accent/30' },
                { label: 'Completed', count: statusCounts.completed, color: 'text-success bg-success/10 border-success/30' },
              ].map(stage => (
                <div key={stage.label} className={`p-4 rounded-xl border text-center ${stage.color}`}>
                  <p className="text-2xl font-black">{stage.count}</p>
                  <p className="text-xs font-bold uppercase tracking-wider">{stage.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════ ORDERS TAB ═══════════ */}
      {activeTab === 'orders' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-elevated border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">ID</th>
                    <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Customer</th>
                    <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Location</th>
                    <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Items</th>
                    <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Total</th>
                    <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Status</th>
                    <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 50).map(order => {
                    const statusColor = {
                      barista: 'bg-info/20 text-info',
                      waiter: 'bg-warning/20 text-warning',
                      cashier: 'bg-accent/20 text-accent',
                      completed: 'bg-success/20 text-success',
                      cancelled: 'bg-danger/20 text-danger',
                    }[order.status] || 'bg-surface text-muted';

                    return (
                      <tr key={order.id} className="border-b border-border hover:bg-surface-elevated transition-colors">
                        <td className="p-4 font-mono font-bold text-primary">{order.id.slice(0, 8)}</td>
                        <td className="p-4 font-medium">{order.customerName || 'Guest'}</td>
                        <td className="p-4">
                          <span className="flex items-center gap-1">
                            <MapPin size={14} className="text-muted-foreground" />
                            {order.location?.name || 'N/A'}
                          </span>
                        </td>
                        <td className="p-4">{order.items?.length || 0} item(s)</td>
                        <td className="p-4 font-bold">{(order.total || 0).toFixed(2)} EGP</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusColor}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ ACCOUNTING TAB ═══════════ */}
      {activeTab === 'accounting' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {['menu', 'booking', 'art'].map(source => {
              const total = accounting.filter(r => r.source === source).reduce((sum, r) => sum + r.amount, 0);
              return (
                <Card key={source} className="p-6 text-center">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{source}</p>
                  <p className="text-2xl font-black">{total.toFixed(0)} EGP</p>
                </Card>
              );
            })}
          </div>

          {/* Records Table */}
          <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-elevated border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Source</th>
                    <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Amount</th>
                    <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Payment</th>
                    <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {accounting.slice(0, 50).map(record => (
                    <tr key={record.id} className="border-b border-border hover:bg-surface-elevated">
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary uppercase">{record.source}</span>
                      </td>
                      <td className="p-4 font-bold">{record.amount.toFixed(2)} EGP</td>
                      <td className="p-4 text-muted-foreground capitalize">{record.paymentMethod}</td>
                      <td className="p-4 text-muted-foreground">{new Date(record.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ WORKERS TAB ═══════════ */}
      {activeTab === 'workers' && (
        <div className="space-y-4 animate-in fade-in">
          {isAddingWorker ? (
            <Card className="p-6 max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{editingWorkerId ? 'Edit Worker' : 'Add New Worker'}</h3>
                <button onClick={() => { setIsAddingWorker(false); setEditingWorkerId(null); }} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormInput label="Name" value={workerForm.name} onChange={e => setWorkerForm({...workerForm, name: e.target.value})} />
                <Select
                  label="Role"
                  value={workerForm.role}
                  onChange={e => setWorkerForm({...workerForm, role: e.target.value})}
                  options={[
                    { value: 'barista', label: 'Barista' },
                    { value: 'waiter', label: 'Waiter' },
                    { value: 'cashier', label: 'Cashier' },
                    { value: 'inventory', label: 'Inventory' },
                    { value: 'manager', label: 'Manager' },
                    { value: 'organizer', label: 'Organizer' },
                  ]}
                />
                <FormInput label="Email (Optional)" type="email" value={workerForm.email} onChange={e => setWorkerForm({...workerForm, email: e.target.value})} />
                <FormInput label="Phone (Optional)" value={workerForm.phone} onChange={e => setWorkerForm({...workerForm, phone: e.target.value})} />
                <FormInput label={editingWorkerId ? "New Password (Optional)" : "Password"} type="password" value={workerForm.password} onChange={e => setWorkerForm({...workerForm, password: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => { setIsAddingWorker(false); setEditingWorkerId(null); }}>Cancel</Button>
                <Button onClick={saveWorker} disabled={!workerForm.name || !workerForm.role || (!editingWorkerId && !workerForm.password)}>
                  {editingWorkerId ? 'Update Worker' : 'Save Worker'}
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <Button onClick={() => { setWorkerForm({ name: '', role: 'barista', email: '', phone: '', password: '' }); setIsAddingWorker(true); }} className="w-full md:w-auto h-12 border-dashed" variant="outline">
                <Plus size={20} className="mr-2" /> Add New Worker
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {workers.map(worker => (
                  <Card key={worker.id} className="p-6 relative group">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <User size={28} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{worker.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{worker.role}</p>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button onClick={() => editWorker(worker)} className="p-1.5 bg-surface-elevated text-muted-foreground hover:text-primary rounded-md transition-colors"><Edit size={16} /></button>
                      <button onClick={() => deleteWorker(worker.id)} className="p-1.5 bg-surface-elevated text-danger/70 hover:text-danger hover:bg-danger/10 rounded-md transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </Card>
                ))}
                {workers.length === 0 && (
                  <p className="col-span-full text-center text-muted-foreground py-8">No workers found.</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════ QR TAB ═══════════ */}
      {activeTab === 'qr' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Base URL & Print All Bar */}
          <Card className="p-4 flex flex-col md:flex-row gap-4 items-end justify-between bg-surface border-border">
            <div className="flex-1 w-full max-w-md">
              <FormInput 
                label="Base URL for QR Codes" 
                value={batchForm.baseUrl} 
                onChange={e => setBatchForm({...batchForm, baseUrl: e.target.value})} 
                placeholder="e.g. https://your-public-url.com"
              />
            </div>
            <Button onClick={printAllQRs} disabled={locations.length === 0} className="w-full md:w-auto h-12">
              <Printer size={18} className="mr-2" /> Print All QRs
            </Button>
          </Card>

          {isAddingLocation ? (
            <Card className="p-6 max-w-lg mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Add New Location</h3>
                <button onClick={() => setIsAddingLocation(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4 mb-6">
                <FormInput label="Location Name (e.g. Table 5, Room A)" value={locationForm.name} onChange={e => setLocationForm({...locationForm, name: e.target.value})} />
                <Select
                  label="Type"
                  value={locationForm.type}
                  onChange={e => setLocationForm({...locationForm, type: e.target.value})}
                  options={[
                    { value: 'table', label: 'Table' },
                    { value: 'room', label: 'Room' },
                    { value: 'workspace', label: 'Workspace' },
                    { value: 'custom', label: 'Custom' },
                  ]}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddingLocation(false)}>Cancel</Button>
                <Button onClick={saveLocation} disabled={!locationForm.name}>Save Location</Button>
              </div>
            </Card>
          ) : isBatchGenerating ? (
            <Card className="p-6 max-w-lg mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Batch Generate Tables</h3>
                <button onClick={() => setIsBatchGenerating(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4 mb-6">
                <FormInput label="Number of Tables to Generate" type="number" value={batchForm.count.toString()} onChange={e => setBatchForm({...batchForm, count: parseInt(e.target.value) || 1})} />
                <FormInput label="Starting Table Number (e.g. 1)" type="number" value={batchForm.startNum.toString()} onChange={e => setBatchForm({...batchForm, startNum: parseInt(e.target.value) || 1})} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsBatchGenerating(false)}>Cancel</Button>
                <Button onClick={batchGenerateLocations}>Generate Tables</Button>
              </div>
            </Card>
          ) : (
            <div className="flex gap-4">
              <Button onClick={() => setIsAddingLocation(true)} className="w-full md:w-auto h-12 border-dashed" variant="outline">
                <Plus size={20} className="mr-2" /> Add Single Location
              </Button>
              <Button onClick={() => setIsBatchGenerating(true)} className="w-full md:w-auto h-12 border-dashed border-primary text-primary" variant="outline">
                <Plus size={20} className="mr-2" /> Batch Generate Tables
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {locations.map((loc: any) => (
              <Card
                key={loc.id}
                hoverable
                onClick={() => generateQR(loc.id)}
                className={`p-6 text-center cursor-pointer transition-all relative group ${
                  selectedLocation === loc.id ? 'border-primary ring-2 ring-primary/20' : ''
                }`}
              >
                <QrCode size={32} className="mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-bold">{loc.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">{loc.type}</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteLocation(loc.id); }}
                  className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 bg-surface-elevated text-danger/70 hover:text-danger hover:bg-danger/10 rounded-md transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </Card>
            ))}
          </div>

          {qrDataUrl && (
            <Card className="p-8 text-center max-w-sm mx-auto mt-8">
              <img src={qrDataUrl} alt="QR Code" className="mx-auto mb-4 rounded-xl shadow-sm" />
              <p className="font-bold mb-4">{locations.find((l: any) => l.id === selectedLocation)?.name}</p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = qrDataUrl;
                    a.download = `qr-${selectedLocation}.png`;
                    a.click();
                  }}
                >
                  Download
                </Button>
                <Button onClick={printQR}>
                  <Printer size={18} className="mr-2" /> Print QR
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
