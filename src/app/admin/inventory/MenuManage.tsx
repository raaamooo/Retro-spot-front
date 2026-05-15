'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, ChevronDown, ChevronUp, Edit2, Check, FlaskConical } from 'lucide-react';
import { API_URL } from '@/lib/constants';
import { getItemImage } from '@/lib/itemImages';
import RecipeEditor from './RecipeEditor';

interface Ingredient { id: string; nameEn: string; unit: string; quantityAvailable: number; lowStockThreshold: number; }
interface Category { id: string; nameEn: string; nameAr: string; sortOrder: number; }
interface MenuItemFlat {
  id: string; nameEn: string; nameAr: string; price: number;
  descriptionEn?: string; descriptionAr?: string;
  available: boolean; active: boolean; imageUrl: string | null;
  category: { nameEn: string; nameAr: string };
}

interface Props {
  categories: Category[];
  menuItems: MenuItemFlat[];
  ingredients: Ingredient[];
  onCategoryAdded: (cat: Category) => void;
  onCategoryDeleted: (id: string) => void;
  onItemAdded: (item: MenuItemFlat) => void;
  onItemDeleted: (id: string) => void;
  onItemUpdated: (item: MenuItemFlat) => void;
}

export default function MenuManage({ categories, menuItems, ingredients, onCategoryAdded, onCategoryDeleted, onItemAdded, onItemDeleted, onItemUpdated }: Props) {
  const [showAddCat, setShowAddCat] = useState(false);
  const [catForm, setCatForm] = useState({ nameEn: '', nameAr: '' });
  const [savingCat, setSavingCat] = useState(false);

  const [showAddItem, setShowAddItem] = useState(false);
  const [itemForm, setItemForm] = useState({ categoryId: '', nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '', price: '' });
  const [itemImage, setItemImage] = useState<File | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editItem, setEditItem] = useState<MenuItemFlat | null>(null);
  const [editForm, setEditForm] = useState({ nameEn: '', nameAr: '', price: '', descriptionEn: '', descriptionAr: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const [recipeItem, setRecipeItem] = useState<MenuItemFlat | null>(null);

  const addCategory = async () => {
    if (!catForm.nameEn || !catForm.nameAr) return;
    setSavingCat(true);
    try {
      const r = await fetch(`${API_URL}/api/menu-categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nameEn: catForm.nameEn, nameAr: catForm.nameAr }) });
      const cat = await r.json();
      onCategoryAdded(cat);
      setCatForm({ nameEn: '', nameAr: '' });
      setShowAddCat(false);
    } catch(e) { console.error(e); }
    setSavingCat(false);
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its items?')) return;
    setDeletingId(id);
    await fetch(`${API_URL}/api/menu-categories/${id}`, { method: 'DELETE' });
    onCategoryDeleted(id);
    setDeletingId(null);
  };

  const addItem = async () => {
    if (!itemForm.categoryId || !itemForm.nameEn || !itemForm.nameAr || !itemForm.price) return;
    setSavingItem(true);
    try {
      const fd = new FormData();
      Object.entries(itemForm).forEach(([k, v]) => fd.append(k, v));
      if (itemImage) fd.append('image', itemImage);
      const r = await fetch(`${API_URL}/api/menu-items`, { method: 'POST', body: fd });
      const item = await r.json();
      onItemAdded(item);
      setItemForm({ categoryId: '', nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '', price: '' });
      setItemImage(null);
      setShowAddItem(false);
      // Auto-open recipe editor for new item
      setRecipeItem(item);
    } catch(e) { console.error(e); }
    setSavingItem(false);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    setDeletingId(id);
    await fetch(`${API_URL}/api/menu-items/${id}`, { method: 'DELETE' });
    onItemDeleted(id);
    setDeletingId(null);
  };

  const startEdit = (item: MenuItemFlat) => {
    setEditItem(item);
    setEditForm({ nameEn: item.nameEn, nameAr: item.nameAr, price: String(item.price), descriptionEn: item.descriptionEn || '', descriptionAr: item.descriptionAr || '' });
  };

  const saveEdit = async () => {
    if (!editItem) return;
    setSavingEdit(true);
    try {
      const r = await fetch(`${API_URL}/api/menu-items/${editItem.id}/details`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
      const updated = await r.json();
      onItemUpdated(updated);
      setEditItem(null);
    } catch(e) { console.error(e); }
    setSavingEdit(false);
  };

  const inp = 'w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <div className="space-y-4">
      {/* Recipe editor modal */}
      <AnimatePresence>
        {recipeItem && (
          <RecipeEditor
            menuItemId={recipeItem.id}
            menuItemName={recipeItem.nameEn}
            ingredients={ingredients}
            onClose={() => setRecipeItem(null)}
            onSaved={(available) => {
              onItemUpdated({ ...recipeItem, available });
              setRecipeItem(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Header actions */}
      <div className="flex gap-2">
        <button onClick={() => { setShowAddCat(!showAddCat); setShowAddItem(false); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${showAddCat ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-foreground hover:border-primary/40'}`}>
          <Plus size={16} /> Add Category
        </button>
        <button onClick={() => { setShowAddItem(!showAddItem); setShowAddCat(false); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${showAddItem ? 'bg-accent text-white border-accent' : 'bg-surface border-border text-foreground hover:border-accent/40'}`}>
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Add Category form */}
      <AnimatePresence>
        {showAddCat && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-4 bg-surface border border-primary/20 rounded-2xl space-y-3">
              <p className="font-bold text-sm text-primary">New Category</p>
              <div className="grid grid-cols-2 gap-3">
                <input className={inp} placeholder="English name" value={catForm.nameEn} onChange={e => setCatForm(p => ({...p, nameEn: e.target.value}))} />
                <input className={inp} placeholder="Arabic name" value={catForm.nameAr} onChange={e => setCatForm(p => ({...p, nameAr: e.target.value}))} dir="rtl" />
              </div>
              <div className="flex gap-2">
                <button onClick={addCategory} disabled={savingCat} className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50">
                  {savingCat ? 'Saving...' : 'Create Category'}
                </button>
                <button onClick={() => setShowAddCat(false)} className="px-4 py-2 bg-surface-elevated border border-border rounded-xl text-sm"><X size={16}/></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Item form */}
      <AnimatePresence>
        {showAddItem && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-4 bg-surface border border-accent/20 rounded-2xl space-y-3">
              <p className="font-bold text-sm text-accent">New Menu Item</p>
              <select className={inp} value={itemForm.categoryId} onChange={e => setItemForm(p => ({...p, categoryId: e.target.value}))}>
                <option value="">Select category...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input className={inp} placeholder="English name" value={itemForm.nameEn} onChange={e => setItemForm(p => ({...p, nameEn: e.target.value}))} />
                <input className={inp} placeholder="Arabic name" value={itemForm.nameAr} onChange={e => setItemForm(p => ({...p, nameAr: e.target.value}))} dir="rtl" />
                <input className={inp} placeholder="Description EN" value={itemForm.descriptionEn} onChange={e => setItemForm(p => ({...p, descriptionEn: e.target.value}))} />
                <input className={inp} placeholder="Description AR" value={itemForm.descriptionAr} onChange={e => setItemForm(p => ({...p, descriptionAr: e.target.value}))} dir="rtl" />
                <input className={inp} type="number" placeholder="Price (EGP)" value={itemForm.price} onChange={e => setItemForm(p => ({...p, price: e.target.value}))} />
                <label className="flex items-center gap-2 px-3 py-2.5 bg-background border border-border rounded-xl cursor-pointer text-sm text-muted-foreground hover:border-primary/40 transition-colors">
                  <Plus size={14}/> {itemImage ? itemImage.name : 'Upload image...'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => setItemImage(e.target.files?.[0] || null)} />
                </label>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><FlaskConical size={12}/> After creating, you'll be prompted to link ingredients for inventory sync.</p>
              <div className="flex gap-2">
                <button onClick={addItem} disabled={savingItem} className="flex-1 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent/90 disabled:opacity-50">
                  {savingItem ? 'Saving...' : 'Create Item'}
                </button>
                <button onClick={() => setShowAddItem(false)} className="px-4 py-2 bg-surface-elevated border border-border rounded-xl text-sm"><X size={16}/></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category list */}
      <div className="space-y-3">
        {categories.map(cat => {
          const catItems = menuItems.filter(i => i.category.nameEn === cat.nameEn);
          const isExp = expandedCat === cat.id;
          return (
            <div key={cat.id} className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedCat(isExp ? null : cat.id)}
                onKeyDown={e => e.key === 'Enter' && setExpandedCat(isExp ? null : cat.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-surface-elevated transition-colors text-left cursor-pointer select-none">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <div className="flex-1">
                  <p className="font-bold">{cat.nameEn}</p>
                  <p className="text-xs text-muted-foreground">{cat.nameAr} · {catItems.length} items</p>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteCategory(cat.id); }} disabled={deletingId === cat.id}
                  className="p-1.5 rounded-lg text-danger/60 hover:text-danger hover:bg-danger/10 transition-colors mr-2">
                  <Trash2 size={15}/>
                </button>
                {isExp ? <ChevronUp size={18} className="text-muted-foreground"/> : <ChevronDown size={18} className="text-muted-foreground"/>}
              </div>
              <AnimatePresence>
                {isExp && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-border">
                    <div className="p-3 space-y-2 bg-surface-elevated">
                      {catItems.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No items in this category</p>}
                      {catItems.map(item => {
                        const img = item.imageUrl || getItemImage(item.nameEn);
                        const isEditing = editItem?.id === item.id;
                        return (
                          <div key={item.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-border-subtle bg-surface-elevated">
                              {img ? <img src={img} alt={item.nameEn} className="w-full h-full object-cover" onError={e=>{e.currentTarget.style.display='none'}}/> :
                                <div className="w-full h-full flex items-center justify-center text-xs font-black text-primary/30">{item.nameEn.slice(0,2).toUpperCase()}</div>}
                            </div>
                            {isEditing ? (
                              <div className="flex-1 grid grid-cols-2 gap-1.5">
                                <input className="col-span-2 px-2 py-1 text-xs bg-background border border-primary rounded-lg focus:outline-none" value={editForm.nameEn} onChange={e=>setEditForm(p=>({...p,nameEn:e.target.value}))} placeholder="English name"/>
                                <input className="px-2 py-1 text-xs bg-background border border-border rounded-lg focus:outline-none" value={editForm.descriptionEn} onChange={e=>setEditForm(p=>({...p,descriptionEn:e.target.value}))} placeholder="Description"/>
                                <input className="px-2 py-1 text-xs bg-background border border-border rounded-lg focus:outline-none" type="number" value={editForm.price} onChange={e=>setEditForm(p=>({...p,price:e.target.value}))} placeholder="Price"/>
                              </div>
                            ) : (
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate">{item.nameEn}</p>
                                <p className="text-xs text-muted-foreground">{item.price} EGP · {item.available ? '✓ Available' : '✗ Sold out'}</p>
                              </div>
                            )}
                            <div className="flex gap-1 shrink-0">
                              {/* Recipe / sync button */}
                              <button onClick={() => setRecipeItem(item)} title="Edit ingredient recipe & sync inventory"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <FlaskConical size={14}/>
                              </button>
                              {isEditing ? (
                                <>
                                  <button onClick={saveEdit} disabled={savingEdit} className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"><Check size={14}/></button>
                                  <button onClick={()=>setEditItem(null)} className="p-1.5 rounded-lg bg-surface border border-border hover:bg-surface-elevated transition-colors"><X size={14}/></button>
                                </>
                              ) : (
                                <>
                                  <button onClick={()=>startEdit(item)} className="p-1.5 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"><Edit2 size={14}/></button>
                                  <button onClick={()=>deleteItem(item.id)} disabled={deletingId===item.id} className="p-1.5 rounded-lg text-danger/60 hover:text-danger hover:bg-danger/10 transition-colors"><Trash2 size={14}/></button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        {categories.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-medium">No categories yet</p>
            <p className="text-sm mt-1">Click "Add Category" to create your first menu category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
