'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { EVENTS } from '@/lib/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import {
  LayoutDashboard, DollarSign, Users, Package, Bell,
  TrendingUp, TrendingDown, QrCode, Clock, MapPin,
  ShoppingCart, CheckCircle2, AlertTriangle, User,
  Plus, Edit, Trash2, Printer, X, Archive, ArchiveRestore,
  Trash, BarChart3, PieChart, FileText, Check, Activity,
  ChevronRight, RefreshCw
} from 'lucide-react';
import { Button, Card, FormInput, Select } from '@/components';
import { API_URL } from '@/lib/constants';

// --- Types ---
interface Order {
  id: string;
  locationId: string;
  customerName: string;
  status: string;
  archived: boolean;
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
  email?: string;
  phone?: string;
}

interface WaiterCall {
  id: string;
  locationId: string;
  type?: string;
  status: string;
  createdAt: string;
  location: { name: string };
}

interface Ingredient {
  id: string;
  nameEn: string;
  nameAr?: string;
  quantityAvailable: number;
  unit: string;
  lowStockThreshold: number;
}

interface AuditLog {
  id: string;
  ingredientId: string;
  previousQty: number;
  newQty: number;
  reason: string;
  staffName: string;
  details?: string;
  createdAt: string;
  ingredient: {
    nameEn: string;
    unit: string;
  };
}

export default function ManagerPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'orders' | 'accounting' | 'waste' | 'workers' | 'qr' | 'zreport'>('overview');
  
  // Data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [accounting, setAccounting] = useState<AccountingRecord[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [activeCalls, setActiveCalls] = useState<WaiterCall[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

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

  // Waste Reporting Form State
  const [reportingWaste, setReportingWaste] = useState(false);
  const [wasteForm, setWasteForm] = useState({
    ingredientId: '',
    quantity: '',
    reason: 'waste',
    details: '',
    staffName: 'Manager'
  });

  // Set default baseUrl on mount
  useEffect(() => {
    setBatchForm(prev => ({ ...prev, baseUrl: window.location.origin }));
  }, []);

  // --- FETCH INITIAL DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        ordersData,
        accountingData,
        workersData,
        callsData,
        locationsData,
        ingredientsData,
        logsData
      ] = await Promise.all([
        fetch(`${API_URL}/api/orders?archived=all`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/accounting`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/workers`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/waitercalls`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/locations`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/ingredients`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/inventory/logs?limit=150`).then(r => r.json()).catch(() => []),
      ]);

      setOrders(ordersData);
      setAccounting(accountingData);
      setWorkers(workersData);
      setActiveCalls(callsData);
      setLocations(locationsData);
      setIngredients(ingredientsData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  useSocketEvent<any>(EVENTS.INVENTORY_STOCK_UPDATED, (log) => {
    setAuditLogs(prev => [log, ...prev]);
    // Refresh ingredients to reflect updated quantities
    fetch(`${API_URL}/api/ingredients`)
      .then(r => r.json())
      .then(data => setIngredients(data))
      .catch(e => console.error(e));
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
    return orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && !o.archived);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (showArchived) return orders;
    return orders.filter(o => !o.archived);
  }, [orders, showArchived]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { barista: 0, waiter: 0, cashier: 0, completed: 0 };
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  }, [orders]);

  // --- CHARTS CALCULATIONS (PURE SVG) ---
  const paymentCounts = useMemo(() => {
    const counts = { cash: 0, visa: 0, loyalty: 0 };
    orders.forEach(o => {
      const method = (o.paymentMethod || '').toLowerCase();
      if (method.includes('cash')) counts.cash += o.total || 0;
      else if (method.includes('visa')) counts.visa += o.total || 0;
      else counts.loyalty += o.total || 0;
    });
    const total = counts.cash + counts.visa + counts.loyalty || 1;
    return {
      cash: { amount: counts.cash, pct: (counts.cash / total) * 100 },
      visa: { amount: counts.visa, pct: (counts.visa / total) * 100 },
      loyalty: { amount: counts.loyalty, pct: (counts.loyalty / total) * 100 },
      totalAmount: total
    };
  }, [orders]);

  const hourlySales = useMemo(() => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 9); // 9 AM to 8 PM
    const salesMap: Record<number, number> = {};
    hours.forEach(h => { salesMap[h] = 0; });

    orders.forEach(o => {
      const date = new Date(o.createdAt);
      const h = date.getHours();
      if (h >= 9 && h <= 20) {
        salesMap[h] += o.total || 0;
      }
    });

    const maxSale = Math.max(...Object.values(salesMap)) || 100;
    return hours.map(h => ({
      hour: `${h === 12 ? '12:00' : h > 12 ? `${h - 12} PM` : `${h} AM`}`,
      amount: salesMap[h],
      heightPct: (salesMap[h] / maxSale) * 100,
    }));
  }, [orders]);

  const categorySales = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    orders.forEach(o => {
      o.items?.forEach(item => {
        const name = (item.menuItem?.nameEn || '').toLowerCase();
        let cat = 'Coffee & Brews';
        if (name.includes('cake') || name.includes('brownie') || name.includes('croissant') || name.includes('waffle') || name.includes('cookie')) {
          cat = 'Desserts & Bakes';
        } else if (name.includes('soda') || name.includes('juice') || name.includes('water') || name.includes('mojito') || name.includes('shake')) {
          cat = 'Cold Refreshers';
        }
        categoryMap[cat] = (categoryMap[cat] || 0) + (item.quantity || 1);
      });
    });
    const totalItems = Object.values(categoryMap).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(categoryMap).map(([name, count]) => ({
      name,
      count,
      pct: (count / totalItems) * 100,
    })).sort((a, b) => b.count - a.count);
  }, [orders]);

  // --- STAFF PERFORMANCE METRICS ---
  const staffMetrics = useMemo(() => {
    const metrics: Record<string, { name: string; completedCount: number; activeCount: number; volume: number }> = {};
    workers.forEach(w => {
      metrics[w.name] = { name: w.name, completedCount: 0, activeCount: 0, volume: 0 };
    });

    // Populate using cashier / barista records
    orders.forEach(o => {
      const staffName = o.customerName || 'Staff';
      if (metrics[staffName]) {
        if (o.status === 'completed') {
          metrics[staffName].completedCount++;
          metrics[staffName].volume += o.total || 0;
        } else {
          metrics[staffName].activeCount++;
        }
      }
    });

    return Object.values(metrics).sort((a, b) => b.completedCount - a.completedCount);
  }, [workers, orders]);

  // --- INVENTORY WASTE COMPUTED ---
  const wasteLogs = useMemo(() => {
    return auditLogs.filter(log => log.reason === 'waste' || log.reason === 'void');
  }, [auditLogs]);

  const totalWastedCost = useMemo(() => {
    // Arbitrary EGP cost factor per ingredient unit for demonstration/loss valuation
    return wasteLogs.reduce((sum, log) => {
      const diff = Math.abs(log.previousQty - log.newQty);
      return sum + (diff * 45); // average 45 EGP loss factor
    }, 0);
  }, [wasteLogs]);

  // --- REPORT MANUAL INVENTORY WASTE ---
  const reportWaste = async () => {
    const { ingredientId, quantity, reason, details, staffName } = wasteForm;
    if (!ingredientId || !quantity) return;

    const ing = ingredients.find(i => i.id === ingredientId);
    if (!ing) return;

    const wasteQty = Number(quantity);
    const newQty = Math.max(0, ing.quantityAvailable - wasteQty);

    try {
      const res = await fetch(`${API_URL}/api/ingredients/${ingredientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantityAvailable: newQty,
          reason,
          staffName,
          details: details || `Manual Waste report: ${details}`
        })
      });

      if (!res.ok) throw new Error('Failed to update ingredient');
      
      setReportingWaste(false);
      setWasteForm({
        ingredientId: '',
        quantity: '',
        reason: 'waste',
        details: '',
        staffName: 'Manager'
      });
      // reload logs & ingredients
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

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
    setWorkerForm({ name: worker.name, role: worker.role, email: worker.email || '', phone: worker.phone || '', password: '' });
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

  const toggleArchive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !currentStatus })
      });
      if (!res.ok) throw new Error('Failed to archive order');
      const updated = await res.json();
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
    } catch (err) {
      console.error(err);
    }
  };

  const printZReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cashShare = paymentCounts.cash.amount.toFixed(2);
    const visaShare = paymentCounts.visa.amount.toFixed(2);
    const loyaltyShare = paymentCounts.loyalty.amount.toFixed(2);
    const netRevenue = todayRevenue - todayTips;

    printWindow.document.write(`
      <html>
        <head>
          <title>Z-Report Shift Receipts</title>
          <style>
            @page { size: 58mm auto; margin: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 58mm;
              padding: 4mm;
              margin: 0 auto;
              background: #fff;
              color: #000;
              font-size: 11px;
              line-height: 1.4;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .header { margin-bottom: 5px; }
            .title { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; }
            .footer { margin-top: 25px; text-align: center; }
            .signature { border-top: 1px dotted #000; margin-top: 30px; padding-top: 5px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="center header">
            <span class="title">RETRO SPOT</span><br/>
            <span>COFFEE BAR & MAGAZINE</span><br/>
            <span>Maadi, Cairo, Egypt</span>
          </div>
          <div class="divider"></div>
          <div class="center bold">SHIFT END Z-REPORT</div>
          <div class="row">
            <span>Date/Time:</span>
            <span>${new Date().toLocaleString()}</span>
          </div>
          <div class="row">
            <span>Report ID:</span>
            <span>Z-${new Date().getTime().toString().slice(-6)}</span>
          </div>
          <div class="row">
            <span>Terminal:</span>
            <span>Register 01</span>
          </div>
          <div class="divider"></div>
          
          <div class="row bold">
            <span>TOTAL GROSS SALES</span>
            <span>${todayRevenue.toFixed(2)} EGP</span>
          </div>
          <div class="row">
            <span>Completed Orders:</span>
            <span>${todayOrders.length}</span>
          </div>
          <div class="divider"></div>
          
          <div class="center bold">PAYMENT SUMMARY</div>
          <div class="row">
            <span>CASH TOTAL:</span>
            <span>${cashShare} EGP</span>
          </div>
          <div class="row">
            <span>VISA CARD TOTAL:</span>
            <span>${visaShare} EGP</span>
          </div>
          <div class="row">
            <span>LOYALTY POINTS REDEEM:</span>
            <span>${loyaltyShare} EGP</span>
          </div>
          
          <div class="divider"></div>
          <div class="row">
            <span>TOTAL TIPS:</span>
            <span>${todayTips.toFixed(2)} EGP</span>
          </div>
          <div class="row bold">
            <span>NET OPERATING SALES</span>
            <span>${netRevenue.toFixed(2)} EGP</span>
          </div>
          
          <div class="divider"></div>
          <div class="center bold">AUDIT SUMMARY</div>
          <div class="row">
            <span>Voids / Waste Events:</span>
            <span>${wasteLogs.length}</span>
          </div>
          <div class="row">
            <span>Estimated Loss Cost:</span>
            <span>${totalWastedCost.toFixed(2)} EGP</span>
          </div>
          
          <div class="signature">
            <span>Shift Manager Signature</span>
          </div>
          
          <div class="footer">
            <span>*** END OF REPORT ***</span>
          </div>
          
          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // --- TABS LIST ---
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'accounting', label: 'Accounting', icon: DollarSign },
    { id: 'waste', label: 'Waste & Loss', icon: Trash },
    { id: 'workers', label: 'Workers & Leaderboard', icon: Users },
    { id: 'qr', label: 'QR Codes', icon: QrCode },
  ] as const;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Activity size={48} className="text-primary animate-spin" />
        <div className="text-muted-foreground text-lg font-medium animate-pulse">
          Analyzing Retro Spot dashboards...
        </div>
      </div>
    );
  }

  // Calculate segment coordinates for Donut SVG
  const donutC = 2 * Math.PI * 40; // radius 40
  const cashStrokeOffset = 0;
  const visaStrokeOffset = donutC * (paymentCounts.cash.pct / 100);
  const loyaltyStrokeOffset = donutC * ((paymentCounts.cash.pct + paymentCounts.visa.pct) / 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0">
      
      {/* Header and Z-report trigger */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            Manager Control Hub
          </h1>
          <p className="text-muted-foreground text-sm">
            Real-time business audit, analytics, and operational compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" className="h-11">
            <RefreshCw size={16} className="mr-2" /> Reload Data
          </Button>
          <Button onClick={printZReport} className="h-11 shadow-lg shadow-primary/25">
            <Printer size={16} className="mr-2" /> Shift Z-Report
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide border-b border-border/50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-102'
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
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-center gap-3 animate-pulse shadow-md">
          <Bell size={24} className="text-danger" />
          <div className="flex-1">
            <p className="font-bold text-danger">{activeCalls.length} active service call(s)</p>
            <p className="text-sm text-danger/80">
              Tables: {activeCalls.map(c => c.location?.name || 'Unknown').join(', ')}
            </p>
          </div>
          <span className="text-xs bg-danger/20 text-danger px-3 py-1 rounded-full font-bold uppercase">
            Urgent Response
          </span>
        </div>
      )}

      {/* ═══════════ OVERVIEW TAB ═══════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-6 relative overflow-hidden border-border bg-gradient-to-br from-surface to-surface-elevated">
              <div className="absolute top-4 right-4 p-2 bg-success/10 rounded-lg text-success">
                <TrendingUp size={20} />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Today's Gross Sales</p>
              <p className="text-3xl font-black text-foreground mt-2">{todayRevenue.toFixed(1)} <span className="text-xs text-muted-foreground font-medium">EGP</span></p>
              <div className="flex items-center gap-1.5 text-xs text-success font-semibold mt-3">
                <CheckCircle2 size={12} /> Live sales updates
              </div>
            </Card>

            <Card className="p-6 relative overflow-hidden border-border bg-gradient-to-br from-surface to-surface-elevated">
              <div className="absolute top-4 right-4 p-2 bg-primary/10 rounded-lg text-primary">
                <ShoppingCart size={20} />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Orders Processed</p>
              <p className="text-3xl font-black text-foreground mt-2">{todayOrders.length}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                <Clock size={12} /> Average {todayOrders.length > 0 ? (todayRevenue / todayOrders.length).toFixed(0) : 0} EGP / order
              </div>
            </Card>

            <Card className="p-6 relative overflow-hidden border-border bg-gradient-to-br from-surface to-surface-elevated">
              <div className="absolute top-4 right-4 p-2 bg-accent/10 rounded-lg text-accent">
                <DollarSign size={20} />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Tips Earned</p>
              <p className="text-3xl font-black text-foreground mt-2">{todayTips.toFixed(1)} <span className="text-xs text-muted-foreground font-medium">EGP</span></p>
              <div className="flex items-center gap-1.5 text-xs text-accent font-semibold mt-3">
                <CheckCircle2 size={12} /> 100% staff allocated
              </div>
            </Card>

            <Card className="p-6 relative overflow-hidden border-border bg-gradient-to-br from-surface to-surface-elevated">
              <div className="absolute top-4 right-4 p-2 bg-warning/10 rounded-lg text-warning">
                <Clock size={20} />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Tickets</p>
              <p className="text-3xl font-black text-foreground mt-2">{activeOrders.length}</p>
              <div className="flex items-center gap-1.5 text-xs text-warning mt-3">
                <AlertTriangle size={12} className="animate-pulse" /> Kitchen prep buffer active
              </div>
            </Card>
          </div>

          {/* Pipeline Status Stepper */}
          <Card className="p-6 border-border">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Activity size={18} className="text-primary" /> Active Workflow Pipeline
                </h3>
                <p className="text-xs text-muted-foreground">Detailed status overview of all orders currently processing</p>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold uppercase">
                {activeOrders.length} active orders
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Barista (Prep)', count: statusCounts.barista, color: 'text-info bg-info/10 border-info/20 shadow-info/5' },
                { label: 'Waiter (Deliver)', count: statusCounts.waiter, color: 'text-warning bg-warning/10 border-warning/20 shadow-warning/5' },
                { label: 'Cashier (Checkout)', count: statusCounts.cashier, color: 'text-accent bg-accent/10 border-accent/20 shadow-accent/5' },
                { label: 'Completed (Total)', count: statusCounts.completed, color: 'text-success bg-success/10 border-success/20 shadow-success/5' },
              ].map((stage, idx) => (
                <div key={stage.label} className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] shadow-md flex items-center gap-4 ${stage.color}`}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 font-black text-xl">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-2xl font-black">{stage.count}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stage.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Stock Alerts Card */}
            <Card className="p-6 border-border">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-warning" /> Low Stock Safeguard
              </h3>
              <div className="space-y-3">
                {ingredients
                  .filter(ing => ing.quantityAvailable <= ing.lowStockThreshold)
                  .map(ing => (
                    <div key={ing.id} className="flex justify-between items-center p-3.5 bg-surface-elevated border border-border/80 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
                        <div>
                          <p className="font-bold text-sm">{ing.nameEn}</p>
                          <p className="text-xs text-muted-foreground">Threshold: {ing.lowStockThreshold} {ing.unit}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-danger bg-danger/10 px-3 py-1 rounded-full">
                        {ing.quantityAvailable} {ing.unit}
                      </span>
                    </div>
                  ))}
                {ingredients.filter(ing => ing.quantityAvailable <= ing.lowStockThreshold).length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    ✅ All ingredient stock levels inside safe operating zones.
                  </div>
                )}
              </div>
            </Card>

            {/* Shift Activity Summary */}
            <Card className="p-6 border-border">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Clock size={18} className="text-primary" /> Shift Activity Feed
              </h3>
              <div className="space-y-4">
                {orders.slice(0, 4).map(o => (
                  <div key={o.id} className="flex justify-between items-center text-sm border-b border-border/40 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-bold">Order #{o.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleTimeString()} • {o.location?.name || 'Table'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{(o.total || 0).toFixed(1)} EGP</p>
                      <span className="text-xxs uppercase tracking-wider font-bold text-primary">{o.paymentMethod || 'Dine-In'}</span>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">No shift logs found yet today.</div>
                )}
              </div>
            </Card>

          </div>
        </div>
      )}

      {/* ═══════════ ANALYTICS TAB ═══════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Sales Hourly Trend Pure SVG Bar Chart */}
            <Card className="p-6 border-border">
              <h3 className="text-lg font-black mb-1 flex items-center gap-2">
                <BarChart3 size={18} className="text-primary" /> Hourly Sales Trend
              </h3>
              <p className="text-xs text-muted-foreground mb-6">Today's revenue volume breakdown in EGP across operational hours</p>
              
              <div className="h-64 flex items-end justify-between gap-2.5 pt-6 pb-2 px-2 border-b border-l border-border/80">
                {hourlySales.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group h-full justify-end">
                    <div className="text-xxs font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-surface px-2 py-0.5 border border-border rounded shadow-sm whitespace-nowrap">
                      {h.amount.toFixed(0)} EGP
                    </div>
                    {/* The animated vertical bar */}
                    <div 
                      style={{ height: `${Math.max(4, h.heightPct)}%` }}
                      className="w-full bg-gradient-to-t from-primary/70 to-primary rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-lg shadow-primary/10 cursor-pointer"
                    />
                    <span className="text-[10px] text-muted-foreground font-medium mt-3 whitespace-nowrap truncate max-w-full">
                      {h.hour}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Payment Method Proportions Circular Donut SVG Chart */}
            <Card className="p-6 border-border">
              <h3 className="text-lg font-black mb-1 flex items-center gap-2">
                <PieChart size={18} className="text-accent" /> Payment Method Volume Share
              </h3>
              <p className="text-xs text-muted-foreground mb-6">Ratio of Cash, Cards, and Points used in completed purchases</p>

              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
                {/* SVG Donut Circle */}
                <div className="relative w-44 h-44">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1f2125" strokeWidth="8" />
                    
                    {/* Segment Cash */}
                    {paymentCounts.cash.pct > 0 && (
                      <circle
                        cx="50" cy="50" r="40"
                        fill="transparent"
                        stroke="#b58d63" /* accent */
                        strokeWidth="8.5"
                        strokeDasharray={`${donutC * (paymentCounts.cash.pct / 100)} ${donutC}`}
                        strokeDashoffset={-cashStrokeOffset}
                        className="transition-all duration-500 hover:stroke-[10px] cursor-pointer"
                      />
                    )}

                    {/* Segment Visa */}
                    {paymentCounts.visa.pct > 0 && (
                      <circle
                        cx="50" cy="50" r="40"
                        fill="transparent"
                        stroke="#5c9be5" /* info */
                        strokeWidth="8.5"
                        strokeDasharray={`${donutC * (paymentCounts.visa.pct / 100)} ${donutC}`}
                        strokeDashoffset={-visaStrokeOffset}
                        className="transition-all duration-500 hover:stroke-[10px] cursor-pointer"
                      />
                    )}

                    {/* Segment Loyalty */}
                    {paymentCounts.loyalty.pct > 0 && (
                      <circle
                        cx="50" cy="50" r="40"
                        fill="transparent"
                        stroke="#10b981" /* success */
                        strokeWidth="8.5"
                        strokeDasharray={`${donutC * (paymentCounts.loyalty.pct / 100)} ${donutC}`}
                        strokeDashoffset={-loyaltyStrokeOffset}
                        className="transition-all duration-500 hover:stroke-[10px] cursor-pointer"
                      />
                    )}
                  </svg>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xxs uppercase tracking-wider text-muted-foreground">Total Sales</span>
                    <span className="text-lg font-black">{paymentCounts.totalAmount.toFixed(0)}</span>
                    <span className="text-[10px] text-muted-foreground font-bold">EGP</span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="space-y-3.5 flex-1 max-w-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-elevated transition-all">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded bg-accent" />
                      <span className="text-xs font-bold">Cash</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">{paymentCounts.cash.amount.toFixed(0)} EGP</p>
                      <p className="text-xxs text-muted-foreground">{paymentCounts.cash.pct.toFixed(0)}% share</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-elevated transition-all">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded bg-info" />
                      <span className="text-xs font-bold">Visa / Card</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">{paymentCounts.visa.amount.toFixed(0)} EGP</p>
                      <p className="text-xxs text-muted-foreground">{paymentCounts.visa.pct.toFixed(0)}% share</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-elevated transition-all">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded bg-success" />
                      <span className="text-xs font-bold">Loyalty Points</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">{paymentCounts.loyalty.amount.toFixed(0)} EGP</p>
                      <p className="text-xxs text-muted-foreground">{paymentCounts.loyalty.pct.toFixed(0)}% share</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

          </div>

          {/* Category Sales Breakdown Progress List */}
          <Card className="p-6 border-border">
            <h3 className="text-lg font-black mb-1 flex items-center gap-2">
              <Package size={18} className="text-primary" /> Popular Category Shares
            </h3>
            <p className="text-xs text-muted-foreground mb-6">Percentage share of total items sold grouped by menu category</p>
            
            <div className="space-y-5">
              {categorySales.map((cat, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">0{idx + 1}.</span> {cat.name}
                    </span>
                    <span className="text-muted-foreground">
                      {cat.count} units <span className="text-xs font-bold text-foreground">({cat.pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-3.5 w-full bg-[#1b1c20] rounded-full overflow-hidden border border-border/40">
                    <div 
                      style={{ width: `${cat.pct}%` }}
                      className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-1000 shadow-inner"
                    />
                  </div>
                </div>
              ))}
              {categorySales.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No menu item sales recorded yet.</div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════ ORDERS TAB ═══════════ */}
      {activeTab === 'orders' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center bg-surface border border-border border-b-0 rounded-t-2xl p-4">
            <h3 className="font-bold">Recent Orders</h3>
            <button 
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                showArchived ? 'bg-primary text-white' : 'bg-surface border border-border text-muted-foreground'
              }`}
            >
              {showArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
              {showArchived ? 'Showing All' : 'Hide Archived'}
            </button>
          </div>

          <div className="bg-surface rounded-b-2xl border border-border overflow-hidden">
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
                    <th className="text-right p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.slice(0, 100).map(order => {
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
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => toggleArchive(order.id, order.archived)}
                            className={`p-2 rounded-lg transition-all ${
                              order.archived 
                                ? 'bg-success/10 text-success hover:bg-success/20' 
                                : 'bg-muted/10 text-muted-foreground hover:bg-muted/20'
                            }`}
                            title={order.archived ? 'Restore' : 'Archive'}
                          >
                            {order.archived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                          </button>
                        </td>
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

      {/* ═══════════ WASTE & LOSS TAB ═══════════ */}
      {activeTab === 'waste' && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-surface to-surface-elevated">
              <div className="absolute top-4 right-4 p-2 bg-danger/10 text-danger rounded-lg">
                <Trash size={20} />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Estimated Shift Loss Cost</p>
              <p className="text-3xl font-black text-danger mt-2">{totalWastedCost.toFixed(2)} <span className="text-xs font-bold text-muted-foreground">EGP</span></p>
              <p className="text-xs text-muted-foreground mt-3">Calculated from total registered voids and manual waste reports</p>
            </Card>

            <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-surface to-surface-elevated">
              <div className="absolute top-4 right-4 p-2 bg-warning/10 text-warning rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Waste Events</p>
              <p className="text-3xl font-black text-warning mt-2">{wasteLogs.length}</p>
              <p className="text-xs text-muted-foreground mt-3">Requires manager reconciliation upon shift closing</p>
            </Card>
          </div>

          {/* Form to log manual waste */}
          {reportingWaste ? (
            <Card className="p-6 border-border max-w-xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Trash size={18} className="text-danger" /> Log Manual Stock Waste
                </h3>
                <button onClick={() => setReportingWaste(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <Select
                  label="Select Ingredient"
                  value={wasteForm.ingredientId}
                  onChange={e => setWasteForm({...wasteForm, ingredientId: e.target.value})}
                  options={[
                    { value: '', label: 'Select stock item...' },
                    ...ingredients.map(i => ({ value: i.id, label: `${i.nameEn} (Available: ${i.quantityAvailable} ${i.unit})` }))
                  ]}
                />

                <FormInput
                  label="Waste Quantity (to deduct)"
                  type="number"
                  placeholder="e.g. 5"
                  value={wasteForm.quantity}
                  onChange={e => setWasteForm({...wasteForm, quantity: e.target.value})}
                />

                <Select
                  label="Deduction Reason"
                  value={wasteForm.reason}
                  onChange={e => setWasteForm({...wasteForm, reason: e.target.value})}
                  options={[
                    { value: 'waste', label: 'Manual Waste / Expired' },
                    { value: 'void', label: 'Void Order' },
                    { value: 'manual_adjustment', label: 'General Stock Discrepancy' }
                  ]}
                />

                <FormInput
                  label="Short Context / Comment"
                  placeholder="e.g. spilled beans, expired dairy package"
                  value={wasteForm.details}
                  onChange={e => setWasteForm({...wasteForm, details: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setReportingWaste(false)}>Cancel</Button>
                <Button onClick={reportWaste} disabled={!wasteForm.ingredientId || !wasteForm.quantity}>
                  Log Deduction
                </Button>
              </div>
            </Card>
          ) : (
            <Button onClick={() => setReportingWaste(true)} className="w-full md:w-auto h-12 border-dashed" variant="outline">
              <Plus size={20} className="mr-2" /> Log Manual Ingredient Waste
            </Button>
          )}

          {/* Waste Timeline Logs */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold">Waste & Void Timeline Logs</h3>
            <div className="bg-surface rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-elevated border-b border-border">
                    <tr>
                      <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Item</th>
                      <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Qty Change</th>
                      <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Reason</th>
                      <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Staff</th>
                      <th className="text-left p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Context Details</th>
                      <th className="text-right p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wasteLogs.map((log, idx) => {
                      const qtyDiff = log.previousQty - log.newQty;
                      return (
                        <tr key={log.id || idx} className="border-b border-border hover:bg-surface-elevated transition-colors">
                          <td className="p-4 font-bold">{log.ingredient?.nameEn || 'Unknown Ingredient'}</td>
                          <td className="p-4 text-danger font-semibold">-{qtyDiff.toFixed(1)} {log.ingredient?.unit}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-full text-xxs font-bold bg-danger/10 text-danger uppercase">
                              {log.reason}
                            </span>
                          </td>
                          <td className="p-4 font-medium">{log.staffName || 'System'}</td>
                          <td className="p-4 text-muted-foreground">{log.details || 'No details provided'}</td>
                          <td className="p-4 text-right text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                          </td>
                        </tr>
                      );
                    })}
                    {wasteLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                          No waste/loss actions logged for this shift.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ═══════════ WORKERS & LEADERBOARD TAB ═══════════ */}
      {activeTab === 'workers' && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Leaderboard Card */}
            <Card className="p-6 border-border lg:col-span-1">
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-success" /> Shift Leaderboard
              </h3>
              
              <div className="space-y-4">
                {staffMetrics.map((staff, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-surface-elevated border border-border/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{staff.name}</p>
                        <p className="text-xxs text-muted-foreground uppercase">{staff.completedCount} orders done</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm">{staff.volume.toFixed(0)} <span className="text-xxs font-bold text-muted-foreground">EGP</span></p>
                      <span className="text-xxs text-success font-semibold flex items-center gap-0.5 justify-end">
                        <Check size={10} /> Active
                      </span>
                    </div>
                  </div>
                ))}
                {staffMetrics.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">No active metrics recorded.</div>
                )}
              </div>
            </Card>

            {/* Workers Panel CRUD */}
            <div className="lg:col-span-2 space-y-4">
              {isAddingWorker ? (
                <Card className="p-6">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {workers.map(worker => (
                      <Card key={worker.id} className="p-4 relative group hover:scale-[1.005] transition-all border-border">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User size={24} className="text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-base">{worker.name}</h3>
                            <p className="text-xs text-muted-foreground capitalize">{worker.role}</p>
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

          </div>

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
