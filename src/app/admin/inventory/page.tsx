'use client';
import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { EVENTS } from '@/lib/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import { API_URL } from '@/lib/constants';
import {
  LayoutDashboard, Package, UtensilsCrossed, Truck,
  History, Bell, Settings2, Eye, EyeOff, ToggleLeft,
  ToggleRight, Search
} from 'lucide-react';
import { getItemImage } from '@/lib/itemImages';
import MenuManage from './MenuManage';
import InventoryOverview from './InventoryOverview';
import IngredientsTab from './IngredientsTab';
import RecipesTab from './RecipesTab';
import SuppliersTab from './SuppliersTab';
import PurchaseHistoryTab from './PurchaseHistoryTab';
import AlertsTab from './AlertsTab';

interface Category { id: string; nameEn: string; nameAr: string; sortOrder: number; }
interface MenuItemFlat {
  id: string; nameEn: string; nameAr: string; price: number;
  descriptionEn?: string; descriptionAr?: string;
  available: boolean; active: boolean; imageUrl: string | null;
  category: { nameEn: string; nameAr: string };
}

type Tab = 'overview' | 'ingredients' | 'recipes' | 'suppliers' | 'purchases' | 'alerts' | 'control' | 'manage';

export default function InventoryPage() {
  const { t, language } = useLanguage();
  const [tab, setTab] = useState<Tab>('overview');

  // Menu control state
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemFlat[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuFilter, setMenuFilter] = useState<'all'|'available'|'unavailable'>('all');

  // Alert badge count
  const [unresolvedAlerts, setUnresolvedAlerts] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/menu`).then(r => r.ok ? r.json() : []).catch(()=>[]),
      fetch(`${API_URL}/api/menu-items`).then(r => r.ok ? r.json() : []).catch(()=>[]),
      fetch(`${API_URL}/api/inventory/alerts?resolved=false`).then(r => r.ok ? r.json() : []).catch(()=>[]),
    ]).then(([cats, items, alerts]) => {
      setCategories(cats.map((c:any)=>({ id:c.id, nameEn:c.nameEn, nameAr:c.nameAr, sortOrder:c.sortOrder })));
      setMenuItems(items);
      setUnresolvedAlerts(Array.isArray(alerts) ? alerts.length : 0);
      setMenuLoading(false);
    });
  }, []);

  useSocketEvent<{id:string;available:boolean}[]>(EVENTS.MENU_AVAILABILITY, updates => {
    setMenuItems(prev => prev.map(item => { const u=updates.find(x=>x.id===item.id); return u?{...item,available:u.available}:item; }));
  });

  useSocketEvent(EVENTS.INVENTORY_LOW_STOCK, () => {
    setUnresolvedAlerts(p => p + 1);
  });

  useSocketEvent(EVENTS.INVENTORY_OUT_OF_STOCK, () => {
    setUnresolvedAlerts(p => p + 1);
  });

  const toggleItem = async (item:MenuItemFlat, field:'available'|'active') => {
    setTogglingId(item.id+field);
    const newVal=!item[field];
    setMenuItems(prev=>prev.map(i=>i.id===item.id?{...i,[field]:newVal}:i));
    try { await fetch(`${API_URL}/api/menu-items/${item.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({[field]:newVal})}); }
    catch(e){ setMenuItems(prev=>prev.map(i=>i.id===item.id?{...i,[field]:!newVal}:i)); }
    finally{setTogglingId(null);}
  };

  const unavailableCount=menuItems.filter(i=>!i.available||!i.active).length;

  const filtered=menuItems.filter(item=>{
    const ms=item.nameEn.toLowerCase().includes(menuSearch.toLowerCase())||item.category.nameEn.toLowerCase().includes(menuSearch.toLowerCase());
    const mf=menuFilter==='all'?true:menuFilter==='available'?(item.available&&item.active):(!item.available||!item.active);
    return ms&&mf;
  });

  const tabs: { id: Tab; label: string; labelAr: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'Overview', labelAr: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'ingredients', label: 'Ingredients', labelAr: 'المكونات', icon: Package },
    { id: 'recipes', label: 'Recipes', labelAr: 'الوصفات', icon: UtensilsCrossed },
    { id: 'suppliers', label: 'Suppliers', labelAr: 'الموردين', icon: Truck },
    { id: 'purchases', label: 'Purchases', labelAr: 'المشتريات', icon: History },
    { id: 'alerts', label: 'Alerts', labelAr: 'تنبيهات', icon: Bell, badge: unresolvedAlerts > 0 ? unresolvedAlerts : undefined },
    { id: 'control', label: 'Menu Control', labelAr: 'التحكم بالقائمة', icon: Eye, badge: unavailableCount > 0 ? unavailableCount : undefined },
    { id: 'manage', label: 'Manage', labelAr: 'إدارة', icon: Settings2 },
  ];

  return (
    <div className="space-y-6">
      {/* Tab bar — scrollable on mobile */}
      <div className="flex gap-1.5 p-1 bg-surface rounded-2xl border border-border overflow-x-auto scrollbar-hide">
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`shrink-0 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
              tab === tb.id
                ? 'bg-primary text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
            }`}>
            <tb.icon size={15} />
            <span className="hidden sm:inline">{language === 'ar' ? tb.labelAr : tb.label}</span>
            {tb.badge !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                tab === tb.id ? 'bg-white/20' : 'bg-danger/20 text-danger'
              }`}>{tb.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && <InventoryOverview />}

      {/* ── INGREDIENTS ── */}
      {tab === 'ingredients' && <IngredientsTab />}

      {/* ── RECIPES ── */}
      {tab === 'recipes' && <RecipesTab />}

      {/* ── SUPPLIERS ── */}
      {tab === 'suppliers' && <SuppliersTab />}

      {/* ── PURCHASE HISTORY ── */}
      {tab === 'purchases' && <PurchaseHistoryTab />}

      {/* ── ALERTS ── */}
      {tab === 'alerts' && <AlertsTab onAlertResolved={() => setUnresolvedAlerts(p => Math.max(0, p - 1))} />}

      {/* ── MENU CONTROL ── */}
      {tab === 'control' && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{language === 'ar' ? 'التحكم بالقائمة' : 'Menu Control'}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {language === 'ar' ? 'تبديل التوفر — يحدث قائمة العملاء فوراً.' : 'Toggle availability — updates the customer menu instantly.'}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-bold border border-success/20">{menuItems.filter(i=>i.available&&i.active).length} ON</span>
              <span className="px-3 py-1.5 rounded-full bg-danger/10 text-danger text-xs font-bold border border-danger/20">{unavailableCount} OFF</span>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
              <input type="text" placeholder={language === 'ar' ? 'بحث...' : 'Search...'} value={menuSearch} onChange={e=>setMenuSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
            </div>
            <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
              {(['all','available','unavailable'] as const).map(f=>(
                <button key={f} onClick={()=>setMenuFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${menuFilter===f?'bg-primary text-white':'text-muted-foreground hover:text-foreground'}`}>{f}</button>
              ))}
            </div>
          </div>
          {menuLoading?<div className="text-center py-12 text-muted-foreground animate-pulse">{t('loading')}</div>:(
            <div className="space-y-6">
              {categories.map(cat=>{
                const catItems=filtered.filter(i=>i.category.nameEn===cat.nameEn);
                if(!catItems.length) return null;
                const avail=catItems.filter(i=>i.available&&i.active).length;
                return(
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-black text-base flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary inline-block"/>{language === 'ar' ? cat.nameAr : cat.nameEn}</h3>
                      <span className="text-xs text-muted-foreground">{avail}/{catItems.length} {language === 'ar' ? 'متاح' : 'available'}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {catItems.map(item=>{
                        const img=item.imageUrl||getItemImage(item.nameEn);
                        const isOn=item.available&&item.active;
                        return(
                          <div key={item.id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${isOn?'bg-surface border-border':'bg-danger/5 border-danger/20 opacity-75'}`}>
                            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border bg-surface-elevated">
                              {img?<img src={img} alt={item.nameEn} className="w-full h-full object-cover" onError={e=>{e.currentTarget.style.display='none'}}/>:<div className="w-full h-full flex items-center justify-center text-xs font-black text-primary/30">{item.nameEn.slice(0,2).toUpperCase()}</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold text-sm truncate ${!isOn?'text-muted-foreground':''}`}>{language === 'ar' ? item.nameAr : item.nameEn}</p>
                              <p className="text-xs text-muted-foreground">{item.price} EGP</p>
                              <div className="flex gap-1 mt-1">
                                {!item.available&&<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-danger/10 text-danger font-bold border border-danger/20">{language === 'ar' ? 'نفذ' : 'sold out'}</span>}
                                {!item.active&&<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/30 text-muted-foreground font-bold border border-border">{language === 'ar' ? 'مخفي' : 'hidden'}</span>}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 shrink-0">
                              <button onClick={()=>toggleItem(item,'available')} disabled={togglingId===item.id+'available'} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${item.available?'bg-success/10 text-success border border-success/20 hover:bg-success/20':'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20'}`}>
                                {item.available?<Eye size={11}/>:<EyeOff size={11}/>}{item.available?(language==='ar'?'متوفر':'In Stock'):(language==='ar'?'نفذ':'Sold Out')}
                              </button>
                              <button onClick={()=>toggleItem(item,'active')} disabled={togglingId===item.id+'active'} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${item.active?'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20':'bg-surface-elevated text-muted-foreground border border-border'}`}>
                                {item.active?<ToggleRight size={11}/>:<ToggleLeft size={11}/>}{item.active?(language==='ar'?'ظاهر':'Visible'):(language==='ar'?'مخفي':'Hidden')}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {filtered.length===0&&<div className="text-center py-16 text-muted-foreground"><UtensilsCrossed size={40} className="mx-auto mb-3 opacity-30"/><p className="font-medium">{t('no_results')}</p></div>}
            </div>
          )}
        </div>
      )}

      {/* ── MANAGE ── */}
      {tab === 'manage' && (
        <MenuManage
          categories={categories}
          menuItems={menuItems}
          ingredients={[]}
          onCategoryAdded={cat=>setCategories(p=>[...p,cat])}
          onCategoryDeleted={id=>{ setCategories(p=>p.filter(c=>c.id!==id)); setMenuItems(p=>p.filter(i=>i.category.nameEn!==categories.find(c=>c.id===id)?.nameEn)); }}
          onItemAdded={item=>setMenuItems(p=>[...p,item])}
          onItemDeleted={id=>setMenuItems(p=>p.filter(i=>i.id!==id))}
          onItemUpdated={item=>setMenuItems(p=>p.map(i=>i.id===item.id?item:i))}
        />
      )}
    </div>
  );
}
