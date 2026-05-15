'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { EVENTS } from '@/lib/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import { PackageSearch, AlertTriangle, CheckCircle2, Minus, Plus, RefreshCw, Package, ChevronDown, ChevronUp, UtensilsCrossed, Eye, EyeOff, Search, ToggleLeft, ToggleRight, Settings2 } from 'lucide-react';
import { Button } from '@/components';
import { API_URL } from '@/lib/constants';
import { getItemImage } from '@/lib/itemImages';
import MenuManage from './MenuManage';

interface Ingredient { id: string; nameEn: string; nameAr: string; unit: string; quantityAvailable: number; lowStockThreshold: number; }
interface Category { id: string; nameEn: string; nameAr: string; sortOrder: number; }
interface MenuItemFlat {
  id: string; nameEn: string; nameAr: string; price: number;
  descriptionEn?: string; descriptionAr?: string;
  available: boolean; active: boolean; imageUrl: string | null;
  category: { nameEn: string; nameAr: string };
}
type Tab = 'ingredients' | 'control' | 'manage';

export default function InventoryPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('ingredients');

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adjustValues, setAdjustValues] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemFlat[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuFilter, setMenuFilter] = useState<'all'|'available'|'unavailable'>('all');

  useEffect(() => {
    fetch(`${API_URL}/api/ingredients`).then(r=>r.json()).catch(()=>[]).then((d:Ingredient[])=>{ setIngredients(d); setLoading(false); });
    Promise.all([
      fetch(`${API_URL}/api/menu`).then(r=>r.json()).catch(()=>[]),
      fetch(`${API_URL}/api/menu-items`).then(r=>r.json()).catch(()=>[]),
    ]).then(([cats, items]) => {
      setCategories(cats.map((c:any)=>({ id:c.id, nameEn:c.nameEn, nameAr:c.nameAr, sortOrder:c.sortOrder })));
      setMenuItems(items);
      setMenuLoading(false);
    });
  }, []);

  useSocketEvent<Ingredient[]>(EVENTS.INVENTORY_UPDATED, d => setIngredients(d));
  useSocketEvent<{id:string;available:boolean}[]>(EVENTS.MENU_AVAILABILITY, updates => {
    setMenuItems(prev => prev.map(item => { const u=updates.find(x=>x.id===item.id); return u?{...item,available:u.available}:item; }));
  });

  const adjustStock = async (id:string) => {
    const val = adjustValues[id];
    if (val===undefined||val<0) return;
    setSaving(id);
    try { await fetch(`${API_URL}/api/ingredients/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({quantityAvailable:val})}); setExpandedId(null); }
    catch(e){console.error(e);} finally{setSaving(null);}
  };

  const toggleExpand = (id:string) => {
    if (expandedId===id){setExpandedId(null);return;}
    setExpandedId(id);
    const cur=ingredients.find(i=>i.id===id);
    if(cur) setAdjustValues(p=>({...p,[id]:cur.quantityAvailable}));
  };

  const toggleItem = async (item:MenuItemFlat, field:'available'|'active') => {
    setTogglingId(item.id+field);
    const newVal=!item[field];
    setMenuItems(prev=>prev.map(i=>i.id===item.id?{...i,[field]:newVal}:i));
    try { await fetch(`${API_URL}/api/menu-items/${item.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({[field]:newVal})}); }
    catch(e){ setMenuItems(prev=>prev.map(i=>i.id===item.id?{...i,[field]:!newVal}:i)); }
    finally{setTogglingId(null);}
  };

  const ss = (i:Ingredient) => i.quantityAvailable<=0?'out':i.quantityAvailable<=i.lowStockThreshold?'low':'ok';
  const sc = (s:string) => s==='out'?'bg-danger/10 border-danger/50 text-danger':s==='low'?'bg-warning/10 border-warning/50 text-warning':'bg-success/10 border-success/50 text-success';
  const sl = (s:string) => s==='out'?'OUT OF STOCK':s==='low'?'LOW STOCK':'IN STOCK';

  const outOfStock=ingredients.filter(i=>i.quantityAvailable<=0).length;
  const lowStock=ingredients.filter(i=>i.quantityAvailable>0&&i.quantityAvailable<=i.lowStockThreshold).length;
  const inStock=ingredients.length-outOfStock-lowStock;
  const unavailableCount=menuItems.filter(i=>!i.available||!i.active).length;

  const cats=[...new Set(menuItems.map(i=>i.category.nameEn))];
  const filtered=menuItems.filter(item=>{
    const ms=item.nameEn.toLowerCase().includes(menuSearch.toLowerCase())||item.category.nameEn.toLowerCase().includes(menuSearch.toLowerCase());
    const mf=menuFilter==='all'?true:menuFilter==='available'?(item.available&&item.active):(!item.available||!item.active);
    return ms&&mf;
  });

  const tabs=[
    {id:'ingredients' as Tab,label:'Ingredients',icon:Package,badge:undefined as number|undefined},
    {id:'control' as Tab,label:'Menu Control',icon:UtensilsCrossed,badge:unavailableCount>0?unavailableCount:undefined},
    {id:'manage' as Tab,label:'Manage',icon:Settings2,badge:undefined},
  ];

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1.5 p-1 bg-surface rounded-2xl border border-border">
        {tabs.map(tb=>(
          <button key={tb.id} onClick={()=>setTab(tb.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${tab===tb.id?'bg-primary text-white shadow-md':'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'}`}>
            <tb.icon size={15}/>
            <span className="hidden sm:inline">{tb.label}</span>
            {tb.badge!==undefined&&<span className={`px-1.5 py-0.5 rounded-full text-xs ${tab===tb.id?'bg-white/20':'bg-danger/20 text-danger'}`}>{tb.badge}</span>}
          </button>
        ))}
      </div>

      {/* ── INGREDIENTS ── */}
      {tab==='ingredients'&&(
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-success/10 border border-success/30 rounded-2xl p-6 text-center"><CheckCircle2 size={32} className="text-success mx-auto mb-2"/><p className="text-3xl font-black text-success">{inStock}</p><p className="text-xs font-bold text-success/80 uppercase tracking-wider">{t('in_stock')}</p></div>
            <div className="bg-warning/10 border border-warning/30 rounded-2xl p-6 text-center"><AlertTriangle size={32} className="text-warning mx-auto mb-2"/><p className="text-3xl font-black text-warning">{lowStock}</p><p className="text-xs font-bold text-warning/80 uppercase tracking-wider">{t('low_stock')}</p></div>
            <div className="bg-danger/10 border border-danger/30 rounded-2xl p-6 text-center"><PackageSearch size={32} className="text-danger mx-auto mb-2"/><p className="text-3xl font-black text-danger">{outOfStock}</p><p className="text-xs font-bold text-danger/80 uppercase tracking-wider">{t('out_of_stock')}</p></div>
          </div>
          {loading?<div className="text-center py-10 text-muted-foreground animate-pulse">Loading...</div>:(
            <div className="space-y-3">
              <AnimatePresence>
                {ingredients.map(ing=>{
                  const st=ss(ing);const sc2=sc(st);const isExp=expandedId===ing.id;
                  return(
                    <motion.div key={ing.id} layout initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
                      className={`bg-surface rounded-2xl border overflow-hidden ${st==='out'?'border-danger/50':st==='low'?'border-warning/50':'border-border'}`}>
                      <button onClick={()=>toggleExpand(ing.id)} className="w-full p-4 flex items-center gap-4 hover:bg-surface-elevated transition-colors text-left">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${sc2}`}><Package size={20}/></div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg truncate">{ing.nameEn}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sc2}`}>{sl(st)}</span>
                            <span className="text-sm text-muted-foreground">Threshold: {ing.lowStockThreshold} {ing.unit}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-black ${st==='out'?'text-danger':st==='low'?'text-warning':'text-foreground'}`}>{ing.quantityAvailable}</p>
                          <p className="text-xs text-muted-foreground font-medium">{ing.unit}</p>
                        </div>
                        <div className="ml-2 text-muted-foreground">{isExp?<ChevronUp size={20}/>:<ChevronDown size={20}/>}</div>
                      </button>
                      <AnimatePresence>
                        {isExp&&(
                          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="border-t border-border overflow-hidden">
                            <div className="p-4 bg-surface-elevated space-y-4">
                              <p className="text-sm text-muted-foreground font-medium">Set new stock level:</p>
                              <div className="flex items-center gap-3 justify-center">
                                <button onClick={()=>setAdjustValues(p=>({...p,[ing.id]:Math.max(0,(p[ing.id]||0)-10)}))} className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center hover:bg-danger/10 hover:border-danger/30 transition-colors"><Minus size={20}/></button>
                                <input type="number" value={adjustValues[ing.id]??ing.quantityAvailable} onChange={e=>setAdjustValues(p=>({...p,[ing.id]:Math.max(0,parseInt(e.target.value)||0)}))} className="w-28 h-12 text-center text-2xl font-black bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"/>
                                <button onClick={()=>setAdjustValues(p=>({...p,[ing.id]:(p[ing.id]||0)+10}))} className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center hover:bg-success/10 hover:border-success/30 transition-colors"><Plus size={20}/></button>
                              </div>
                              <Button className="w-full bg-primary hover:bg-primary/90" onClick={()=>adjustStock(ing.id)} loading={saving===ing.id} disabled={saving===ing.id}><RefreshCw size={18}/> Update Stock</Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ── MENU CONTROL ── */}
      {tab==='control'&&(
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="text-xl font-black">Menu Control</h2><p className="text-sm text-muted-foreground mt-0.5">Toggle availability — updates the customer menu instantly.</p></div>
            <div className="flex gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-bold border border-success/20">{menuItems.filter(i=>i.available&&i.active).length} ON</span>
              <span className="px-3 py-1.5 rounded-full bg-danger/10 text-danger text-xs font-bold border border-danger/20">{unavailableCount} OFF</span>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
              <input type="text" placeholder="Search..." value={menuSearch} onChange={e=>setMenuSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
            </div>
            <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
              {(['all','available','unavailable'] as const).map(f=>(
                <button key={f} onClick={()=>setMenuFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${menuFilter===f?'bg-primary text-white':'text-muted-foreground hover:text-foreground'}`}>{f}</button>
              ))}
            </div>
          </div>
          {menuLoading?<div className="text-center py-12 text-muted-foreground animate-pulse">Loading...</div>:(
            <div className="space-y-6">
              {cats.map(cat=>{
                const catItems=filtered.filter(i=>i.category.nameEn===cat);
                if(!catItems.length) return null;
                const avail=catItems.filter(i=>i.available&&i.active).length;
                return(
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-black text-base flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary inline-block"/>{cat}</h3>
                      <span className="text-xs text-muted-foreground">{avail}/{catItems.length} available</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {catItems.map(item=>{
                        const img=item.imageUrl||getItemImage(item.nameEn);
                        const isOn=item.available&&item.active;
                        return(
                          <motion.div key={item.id} layout className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${isOn?'bg-surface border-border':'bg-danger/5 border-danger/20 opacity-75'}`}>
                            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border bg-surface-elevated">
                              {img?<img src={img} alt={item.nameEn} className="w-full h-full object-cover" onError={e=>{e.currentTarget.style.display='none'}}/>:<div className="w-full h-full flex items-center justify-center text-xs font-black text-primary/30">{item.nameEn.slice(0,2).toUpperCase()}</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold text-sm truncate ${!isOn?'text-muted-foreground':''}`}>{item.nameEn}</p>
                              <p className="text-xs text-muted-foreground">{item.price} EGP</p>
                              <div className="flex gap-1 mt-1">
                                {!item.available&&<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-danger/10 text-danger font-bold border border-danger/20">sold out</span>}
                                {!item.active&&<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/30 text-muted-foreground font-bold border border-border">hidden</span>}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 shrink-0">
                              <button onClick={()=>toggleItem(item,'available')} disabled={togglingId===item.id+'available'} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${item.available?'bg-success/10 text-success border border-success/20 hover:bg-success/20':'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20'}`}>
                                {item.available?<Eye size={11}/>:<EyeOff size={11}/>}{item.available?'In Stock':'Sold Out'}
                              </button>
                              <button onClick={()=>toggleItem(item,'active')} disabled={togglingId===item.id+'active'} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${item.active?'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20':'bg-surface-elevated text-muted-foreground border border-border'}`}>
                                {item.active?<ToggleRight size={11}/>:<ToggleLeft size={11}/>}{item.active?'Visible':'Hidden'}
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {filtered.length===0&&<div className="text-center py-16 text-muted-foreground"><UtensilsCrossed size={40} className="mx-auto mb-3 opacity-30"/><p className="font-medium">No items found</p></div>}
            </div>
          )}
        </div>
      )}

      {/* ── MANAGE ── */}
      {tab==='manage'&&(
        <MenuManage
          categories={categories}
          menuItems={menuItems}
          ingredients={ingredients}
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
