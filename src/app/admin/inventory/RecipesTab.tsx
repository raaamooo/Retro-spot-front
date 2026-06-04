'use client';
import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { API_URL } from '@/lib/constants';
import { Search, ChevronDown, ChevronRight, Edit2 } from 'lucide-react';

interface MenuItem { id: string; nameEn: string; nameAr: string; category: { nameEn: string } }
interface Ingredient { id: string; nameEn: string; nameAr: string; unit: string; }
interface RecipeLine { ingredientId: string; quantityRequired: number; ingredient?: Ingredient }

export default function RecipesTab() {
  const { language } = useLanguage();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Record<string, RecipeLine[]>>({});
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    fetch(`${API_URL}/api/menu-items`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setMenuItems(data));
  }, []);

  const loadRecipe = async (menuItemId: string) => {
    if (expandedId === menuItemId) { setExpandedId(null); return; }
    setExpandedId(menuItemId);
    if (!recipes[menuItemId]) {
      try {
        const res = await fetch(`${API_URL}/api/inventory/recipes/${menuItemId}`);
        if (res.ok) {
          const data = await res.json();
          setRecipes(prev => ({ ...prev, [menuItemId]: data }));
        }
      } catch (e) {}
    }
  };

  const filtered = menuItems.filter(i => i.nameEn.toLowerCase().includes(search.toLowerCase()) || i.nameAr.includes(search));

  return (
    <div className="space-y-4">
      <div className="relative w-full sm:w-72">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input 
          type="text" 
          placeholder={language === 'ar' ? 'بحث عن عنصر...' : 'Search menu items...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border">
        {filtered.map(item => (
          <div key={item.id} className="flex flex-col">
            <button 
              onClick={() => loadRecipe(item.id)}
              className="flex items-center justify-between p-4 hover:bg-surface-elevated transition-colors text-left"
            >
              <div>
                <p className="font-bold text-sm">{language === 'ar' ? item.nameAr : item.nameEn}</p>
                <p className="text-xs text-muted-foreground">{item.category.nameEn}</p>
              </div>
              {expandedId === item.id ? <ChevronDown size={18} className="text-muted-foreground" /> : <ChevronRight size={18} className="text-muted-foreground" />}
            </button>
            
            {expandedId === item.id && (
              <div className="p-4 bg-surface-elevated border-t border-border">
                {recipes[item.id] ? (
                  recipes[item.id].length > 0 ? (
                    <ul className="space-y-2">
                      {recipes[item.id].map((line, idx) => (
                        <li key={idx} className="flex items-center justify-between text-sm bg-surface p-2 rounded-lg border border-border">
                          <span>{language === 'ar' ? line.ingredient?.nameAr : line.ingredient?.nameEn}</span>
                          <span className="font-mono text-xs font-bold text-muted-foreground">
                            {line.quantityRequired} {line.ingredient?.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      {language === 'ar' ? 'لا توجد وصفة (يتم الخصم يدوياً أو لا يتطلب مكونات)' : 'No recipe set (manual deduction or requires no ingredients)'}
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
                )}
                <div className="mt-4 flex justify-end">
                  <button className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-primary/20">
                    <Edit2 size={12} /> {language === 'ar' ? 'تعديل الوصفة' : 'Edit Recipe'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
