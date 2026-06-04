'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { PackageSearch, AlertTriangle, CheckCircle2, ArrowDownToLine, Plus, Search, Filter, TrendingDown, History, Package, Truck, FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSocketEvent } from '@/hooks/useSocket';
import { EVENTS } from '@/lib/socket';
import { API_URL } from '@/lib/constants';
import { Button, Drawer, StatusStepper } from '@/components';
import { useToast } from '@/contexts/ToastContext';

interface Ingredient {
  id: string;
  nameEn: string;
  nameAr: string;
  unit: string;
  quantityAvailable: number;
  lowStockThreshold: number;
  costPerUnit: number;
  supplierId?: string;
  supplier?: { name: string };
  lastRestocked?: string;
}

interface Supplier {
  id: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
}

interface StockLog {
  id: string;
  action: string;
  ingredient: { nameEn: string };
  user: { name: string };
  details: any;
  createdAt: string;
}

export default function InventoryManagement() {
  const { t } = useLanguage();
  const { addToast } = useToast();
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'stock' | 'suppliers' | 'logs'>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drawers state
  const [isIngredientDrawerOpen, setIsIngredientDrawerOpen] = useState(false);
  const [isRestockDrawerOpen, setIsRestockDrawerOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  
  // Forms state
  const [ingForm, setIngForm] = useState<Partial<Ingredient>>({});
  const [restockForm, setRestockForm] = useState<{ingredientId: string, quantity: number, supplierId: string, cost: number}[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Real-time updates
  useSocketEvent<Ingredient[]>(EVENTS.INVENTORY_UPDATED, d => setIngredients(d));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ingRes, supRes, logRes] = await Promise.all([
        fetch(`${API_URL}/api/ingredients`),
        fetch(`${API_URL}/api/suppliers`),
        fetch(`${API_URL}/api/inventory/logs`)
      ]);
      
      const ing = ingRes.ok ? await ingRes.json() : [];
      const sup = supRes.ok ? await supRes.json() : [];
      const logs = logRes.ok ? await logRes.json() : [];
      
      setIngredients(Array.isArray(ing) ? ing : []);
      setSuppliers(Array.isArray(sup) ? sup : []);
      setStockLogs(Array.isArray(logs) ? logs : []);
    } catch (e) {
      console.error(e);
      addToast('Failed to load inventory data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations
  const outOfStock = ingredients.filter(i => i.quantityAvailable <= 0).length;
  const lowStock = ingredients.filter(i => i.quantityAvailable > 0 && i.quantityAvailable <= i.lowStockThreshold).length;
  const inStock = ingredients.length - outOfStock - lowStock;
  const totalValue = ingredients.reduce((sum, i) => sum + (i.quantityAvailable * (i.costPerUnit || 0)), 0);

  // Filtered ingredients
  const filteredIngredients = useMemo(() => {
    return ingredients.filter(i => 
      i.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) || 
      i.nameAr.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      // Sort by stock status (out -> low -> ok)
      const statusA = a.quantityAvailable <= 0 ? 0 : a.quantityAvailable <= a.lowStockThreshold ? 1 : 2;
      const statusB = b.quantityAvailable <= 0 ? 0 : b.quantityAvailable <= b.lowStockThreshold ? 1 : 2;
      if (statusA !== statusB) return statusA - statusB;
      return a.nameEn.localeCompare(b.nameEn);
    });
  }, [ingredients, searchQuery]);

  const exportCSV = () => {
    const headers = ['Name', 'Unit', 'Available', 'Threshold', 'Cost', 'Supplier'];
    const rows = filteredIngredients.map(i => [
      i.nameEn, i.unit, i.quantityAvailable, i.lowStockThreshold, i.costPerUnit || 0, i.supplier?.name || 'N/A'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Export downloaded successfully', 'success');
  };

  const openIngredientEditor = (ing: Ingredient | null = null) => {
    setSelectedIngredient(ing);
    setIngForm(ing || {
      nameEn: '',
      nameAr: '',
      unit: '',
      quantityAvailable: 0,
      lowStockThreshold: 10,
      costPerUnit: 0,
      supplierId: ''
    });
    setIsIngredientDrawerOpen(true);
  };

  const saveIngredient = async () => {
    setIsSaving(true);
    try {
      const method = selectedIngredient ? 'PATCH' : 'POST';
      const url = selectedIngredient 
        ? `${API_URL}/api/ingredients/${selectedIngredient.id}` 
        : `${API_URL}/api/ingredients`;
        
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingForm)
      });
      
      if (!res.ok) throw new Error('Failed to save');
      
      await fetchData();
      setIsIngredientDrawerOpen(false);
      addToast(`Ingredient ${selectedIngredient ? 'updated' : 'added'} successfully`, 'success');
    } catch (e) {
      console.error(e);
      addToast('Failed to save ingredient', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const openRestockDrawer = () => {
    setRestockForm([{ ingredientId: '', quantity: 0, supplierId: '', cost: 0 }]);
    setIsRestockDrawerOpen(true);
  };

  const submitRestock = async () => {
    setIsSaving(true);
    try {
      const validItems = restockForm.filter(f => f.ingredientId && f.quantity > 0);
      if (validItems.length === 0) {
        addToast('No valid items to restock', 'warning');
        setIsSaving(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/ingredients/batch-restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: validItems })
      });
      
      if (!res.ok) throw new Error('Failed to restock');
      
      await fetchData();
      setIsRestockDrawerOpen(false);
      addToast(`Successfully restocked ${validItems.length} items`, 'success');
    } catch (e) {
      console.error(e);
      addToast('Failed to process restock', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── KPI Dashboard Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-success/30 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-success/10 rounded-full transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4 relative">
            <div className="w-12 h-12 bg-success/20 text-success rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('in_stock') || 'Healthy Stock'}</p>
              <h3 className="text-3xl font-black text-foreground">{inStock}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-surface border border-warning/30 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-warning/10 rounded-full transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4 relative">
            <div className="w-12 h-12 bg-warning/20 text-warning rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('low_stock') || 'Low Stock'}</p>
              <h3 className="text-3xl font-black text-foreground">{lowStock}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-surface border border-danger/30 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-danger/10 rounded-full transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4 relative">
            <div className="w-12 h-12 bg-danger/20 text-danger rounded-xl flex items-center justify-center shrink-0">
              <PackageSearch size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('out_of_stock') || 'Out of Stock'}</p>
              <h3 className="text-3xl font-black text-foreground">{outOfStock}</h3>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-info/30 rounded-2xl p-5 shadow-sm relative overflow-hidden group hidden md:block">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-info/10 rounded-full transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4 relative">
            <div className="w-12 h-12 bg-info/20 text-info rounded-xl flex items-center justify-center shrink-0">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Value</p>
              <h3 className="text-2xl font-black text-foreground">{totalValue.toFixed(0)} <span className="text-sm text-muted-foreground font-medium">EGP</span></h3>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action & Filter Bar ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-4 flex flex-col md:flex-row gap-4 justify-between items-center border-b border-border-subtle">
        <div className="flex bg-surface rounded-xl p-1 shadow-sm border border-border">
          <button 
            onClick={() => setActiveView('stock')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeView === 'stock' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-surface-elevated'}`}
          >
            <Package size={16} /> Inventory
          </button>
          <button 
            onClick={() => setActiveView('suppliers')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeView === 'suppliers' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-surface-elevated'}`}
          >
            <Truck size={16} /> Suppliers
          </button>
          <button 
            onClick={() => setActiveView('logs')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeView === 'logs' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-surface-elevated'}`}
          >
            <History size={16} /> Audit Log
          </button>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {activeView === 'stock' && (
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="text" 
                placeholder="Search inventory..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          
          {activeView === 'stock' && (
            <>
              <button 
                onClick={exportCSV}
                className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-surface-elevated transition-colors text-foreground whitespace-nowrap"
              >
                <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Export</span>
              </button>
              <button 
                onClick={openRestockDrawer}
                className="px-4 py-2.5 bg-accent text-accent-foreground rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-accent-hover transition-colors whitespace-nowrap shadow-sm"
              >
                <ArrowDownToLine size={16} /> <span className="hidden sm:inline">Batch Restock</span>
              </button>
              <button 
                onClick={() => openIngredientEditor(null)}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary-hover transition-colors whitespace-nowrap shadow-sm"
              >
                <Plus size={16} /> <span className="hidden sm:inline">Add Item</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="pb-24">
        {activeView === 'stock' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIngredients.map(ing => {
              const status = ing.quantityAvailable <= 0 ? 'out' : ing.quantityAvailable <= ing.lowStockThreshold ? 'low' : 'ok';
              const percent = status === 'out' ? 0 : Math.min(100, (ing.quantityAvailable / (ing.lowStockThreshold * 3)) * 100);
              
              return (
                <div 
                  key={ing.id} 
                  onClick={() => openIngredientEditor(ing)}
                  className={`bg-surface border rounded-2xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-all group
                    ${status === 'out' ? 'border-danger/40 hover:border-danger' : 
                      status === 'low' ? 'border-warning/40 hover:border-warning' : 'border-border hover:border-primary/50'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">{ing.nameEn}</h3>
                      <p className="text-xs text-muted-foreground">{ing.supplier?.name || 'No Supplier'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-black ${status === 'out' ? 'text-danger' : status === 'low' ? 'text-warning' : 'text-foreground'}`}>
                        {ing.quantityAvailable}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground ml-1">{ing.unit}</span>
                    </div>
                  </div>
                  
                  {/* Stock Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-muted-foreground">Stock Level</span>
                      <span className={status === 'out' ? 'text-danger font-bold' : status === 'low' ? 'text-warning font-bold' : 'text-success font-bold'}>
                        {status === 'out' ? 'OUT OF STOCK' : status === 'low' ? 'LOW STOCK' : 'HEALTHY'}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out
                          ${status === 'out' ? 'bg-danger w-full' : status === 'low' ? 'bg-warning' : 'bg-success'}`}
                        style={{ width: status === 'out' ? '100%' : `${percent}%`, opacity: status === 'out' ? 0.2 : 1 }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>0</span>
                      <span>Min: {ing.lowStockThreshold} {ing.unit}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredIngredients.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground bg-surface rounded-2xl border border-border border-dashed">
                <Package size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">No ingredients found</p>
                <p className="text-sm">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        )}

        {activeView === 'suppliers' && (
          <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-elevated border-b border-border">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Supplier Name</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact Email</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact Phone</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Items Supplied</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {suppliers.map(s => {
                    const suppliedCount = ingredients.filter(i => i.supplierId === s.id).length;
                    return (
                      <tr key={s.id} className="hover:bg-surface-elevated/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{s.name}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{s.contactEmail || '—'}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{s.contactPhone || '—'}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold border border-primary/20">
                            {suppliedCount} items
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-sm font-medium text-primary hover:underline">Edit</button>
                        </td>
                      </tr>
                    );
                  })}
                  {suppliers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        No suppliers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'logs' && (
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-6">Recent Stock Activity</h3>
            <div className="space-y-6">
              {stockLogs.map(log => (
                <div key={log.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-elevated border border-border flex items-center justify-center shrink-0">
                    <History size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-bold text-foreground">{log.user?.name || 'System'}</span>{' '}
                      <span className="text-muted-foreground">{log.action === 'RESTOCK' ? 'restocked' : 'adjusted'}</span>{' '}
                      <span className="font-bold text-foreground">{log.ingredient?.nameEn || 'an item'}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                    {log.details && (
                      <div className="mt-2 text-xs bg-surface-elevated p-2 rounded-md border border-border font-mono text-muted-foreground inline-block">
                        {log.details.oldValue} → {log.details.newValue} ({log.details.difference > 0 ? '+' : ''}{log.details.difference})
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {stockLogs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No recent activity</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Drawers ── */}
      <Drawer
        open={isIngredientDrawerOpen}
        onClose={() => setIsIngredientDrawerOpen(false)}
        title={selectedIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
      >
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">English Name</label>
              <input 
                value={ingForm.nameEn || ''} 
                onChange={e => setIngForm(p => ({ ...p, nameEn: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Arabic Name</label>
              <input 
                value={ingForm.nameAr || ''} 
                onChange={e => setIngForm(p => ({ ...p, nameAr: e.target.value }))}
                dir="rtl"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Unit (e.g. kg, L, pcs)</label>
              <input 
                value={ingForm.unit || ''} 
                onChange={e => setIngForm(p => ({ ...p, unit: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Supplier</label>
              <select 
                value={ingForm.supplierId || ''} 
                onChange={e => setIngForm(p => ({ ...p, supplierId: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" 
              >
                <option value="">No Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Current Stock</label>
              <input 
                type="number"
                value={ingForm.quantityAvailable || 0} 
                onChange={e => setIngForm(p => ({ ...p, quantityAvailable: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Low Stock Alert Level</label>
              <input 
                type="number"
                value={ingForm.lowStockThreshold || 0} 
                onChange={e => setIngForm(p => ({ ...p, lowStockThreshold: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Cost per Unit (EGP)</label>
              <input 
                type="number"
                value={ingForm.costPerUnit || 0} 
                onChange={e => setIngForm(p => ({ ...p, costPerUnit: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" 
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-border mt-6">
            <Button 
              onClick={saveIngredient} 
              loading={isSaving}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-colors"
            >
              {selectedIngredient ? 'Update Ingredient' : 'Create Ingredient'}
            </Button>
          </div>
        </div>
      </Drawer>

      <Drawer
        open={isRestockDrawerOpen}
        onClose={() => setIsRestockDrawerOpen(false)}
        title="Batch Restock"
      >
        <div className="p-6 space-y-4 flex flex-col h-full">
          <p className="text-sm text-muted-foreground">Scan or manually enter items received from suppliers.</p>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            {restockForm.map((item, index) => (
              <div key={index} className="p-4 bg-surface-elevated border border-border rounded-xl relative">
                {restockForm.length > 1 && (
                  <button 
                    onClick={() => setRestockForm(p => p.filter((_, i) => i !== index))}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-danger text-white rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform"
                  >
                    &times;
                  </button>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Ingredient</label>
                    <select 
                      value={item.ingredientId}
                      onChange={e => setRestockForm(p => p.map((f, i) => i === index ? { ...f, ingredientId: e.target.value } : f))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="">Select ingredient...</option>
                      {ingredients.map(ing => (
                        <option key={ing.id} value={ing.id}>{ing.nameEn} ({ing.unit})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Quantity Received</label>
                    <input 
                      type="number"
                      value={item.quantity || ''}
                      onChange={e => setRestockForm(p => p.map((f, i) => i === index ? { ...f, quantity: parseFloat(e.target.value) || 0 } : f))}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Total Cost (Optional)</label>
                    <input 
                      type="number"
                      value={item.cost || ''}
                      onChange={e => setRestockForm(p => p.map((f, i) => i === index ? { ...f, cost: parseFloat(e.target.value) || 0 } : f))}
                      placeholder="EGP"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => setRestockForm(p => [...p, { ingredientId: '', quantity: 0, supplierId: '', cost: 0 }])}
            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground font-bold hover:bg-surface-elevated transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add Another Item
          </button>
          
          <div className="pt-4 border-t border-border mt-4">
            <Button 
              onClick={submitRestock} 
              loading={isSaving}
              disabled={restockForm.length === 0 || !restockForm.some(f => f.ingredientId && f.quantity > 0)}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-3 rounded-xl transition-colors"
            >
              Complete Restock
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
