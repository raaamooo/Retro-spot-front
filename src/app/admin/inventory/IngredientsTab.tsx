'use client';
import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSocketEvent } from '@/hooks/useSocket';
import { EVENTS } from '@/lib/socket';
import { API_URL } from '@/lib/constants';
import { PackagePlus, Trash2, Edit2, AlertCircle, Plus, Search } from 'lucide-react';

interface Ingredient {
  id: string;
  nameEn: string;
  nameAr: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  costPerUnit: number;
  category: string | null;
  ingredientSupplier: { supplierId: string; supplier: { name: string } } | null;
}

export default function IngredientsTab() {
  const { language } = useLanguage();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  const fetchIngredients = () => {
    fetch(`${API_URL}/api/inventory/ingredients`)
      .then(r => r.ok ? r.json() : [])
      .catch(() => [])
      .then(data => { setIngredients(data); setLoading(false); });
  };

  useEffect(() => { fetchIngredients(); }, []);
  useSocketEvent(EVENTS.INVENTORY_STOCK_UPDATED, () => { fetchIngredients(); });

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المكون؟' : 'Are you sure you want to delete this ingredient?')) return;
    try {
      await fetch(`${API_URL}/api/inventory/ingredients/${id}`, { method: 'DELETE' });
    } catch (e) {
      alert('Error deleting ingredient');
    }
  };

  const filtered = ingredients.filter(i => 
    i.nameEn.toLowerCase().includes(search.toLowerCase()) || 
    i.nameAr.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder={language === 'ar' ? 'بحث عن مكون...' : 'Search ingredients...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          {language === 'ar' ? 'إضافة مكون' : 'Add Ingredient'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground animate-pulse">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-border rounded-2xl bg-surface/50">
          <PackagePlus size={32} className="mx-auto mb-2 opacity-50" />
          <p>{language === 'ar' ? 'لا يوجد مكونات.' : 'No ingredients found.'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-surface border border-border rounded-2xl">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-elevated text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3">{language === 'ar' ? 'الاسم' : 'Name'}</th>
                <th className="px-4 py-3">{language === 'ar' ? 'المخزون الحالي' : 'Current Stock'}</th>
                <th className="px-4 py-3">{language === 'ar' ? 'الحد الأدنى' : 'Min Stock'}</th>
                <th className="px-4 py-3">{language === 'ar' ? 'التكلفة' : 'Cost/Unit'}</th>
                <th className="px-4 py-3">{language === 'ar' ? 'المورد' : 'Supplier'}</th>
                <th className="px-4 py-3 text-right">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(i => {
                const isLow = i.currentStock <= i.minimumStock;
                const isOut = i.currentStock <= 0;
                return (
                  <tr key={i.id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold">{language === 'ar' ? i.nameAr : i.nameEn}</p>
                      {i.category && <p className="text-[10px] text-muted-foreground capitalize">{i.category}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-black ${isOut ? 'text-danger' : isLow ? 'text-warning' : ''}`}>
                          {i.currentStock} {i.unit}
                        </span>
                        {isOut ? <AlertCircle size={14} className="text-danger" /> : isLow ? <AlertCircle size={14} className="text-warning" /> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{i.minimumStock} {i.unit}</td>
                    <td className="px-4 py-3">{i.costPerUnit} EGP</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {i.ingredientSupplier?.supplier.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditingIngredient(i)} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(i.id)} className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
