'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, X, FlaskConical, CheckCircle2, AlertTriangle } from 'lucide-react';
import { API_URL } from '@/lib/constants';

interface Ingredient { id: string; nameEn: string; unit: string; quantityAvailable: number; lowStockThreshold: number; }
interface RecipeLine { ingredientId: string; quantityUsed: number; ingredient: Ingredient; }

interface Props {
  menuItemId: string;
  menuItemName: string;
  ingredients: Ingredient[];
  onClose: () => void;
  onSaved: (available: boolean) => void;
}

export default function RecipeEditor({ menuItemId, menuItemName, ingredients, onClose, onSaved }: Props) {
  const [lines, setLines] = useState<RecipeLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedIngId, setSelectedIngId] = useState('');
  const [qty, setQty] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/menu-items/${menuItemId}/recipes`)
      .then(r => r.json()).catch(() => [])
      .then((data: RecipeLine[]) => { setLines(data); setLoading(false); });
  }, [menuItemId]);

  const addLine = () => {
    if (!selectedIngId || !qty || parseFloat(qty) <= 0) return;
    const ing = ingredients.find(i => i.id === selectedIngId);
    if (!ing) return;
    if (lines.find(l => l.ingredientId === selectedIngId)) {
      // Update existing
      setLines(prev => prev.map(l => l.ingredientId === selectedIngId ? { ...l, quantityUsed: parseFloat(qty) } : l));
    } else {
      setLines(prev => [...prev, { ingredientId: selectedIngId, quantityUsed: parseFloat(qty), ingredient: ing }]);
    }
    setSelectedIngId(''); setQty('');
  };

  const removeLine = (ingredientId: string) => setLines(prev => prev.filter(l => l.ingredientId !== ingredientId));

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API_URL}/api/menu-items/${menuItemId}/recipes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lines.map(l => ({ ingredientId: l.ingredientId, quantityUsed: l.quantityUsed }))),
      });
      const data = await r.json();
      onSaved(data.available);
      onClose();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const stockOk = (line: RecipeLine) => line.ingredient.quantityAvailable >= line.quantityUsed;
  const usedIds = new Set(lines.map(l => l.ingredientId));
  const availableToAdd = ingredients.filter(i => !usedIds.has(i.id));
  const allInStock = lines.length === 0 || lines.every(l => stockOk(l));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background border border-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FlaskConical size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-black text-base">{menuItemName}</p>
              <p className="text-xs text-muted-foreground">Ingredient recipe / inventory sync</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-elevated transition-colors text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Availability status */}
        <div className={`mx-5 mt-4 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold ${allInStock ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
          {allInStock ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {lines.length === 0 ? 'No ingredients linked — item always available' : allInStock ? 'All ingredients in stock — item will be available' : 'Some ingredients out of stock — item will be unavailable'}
        </div>

        {/* Recipe lines */}
        <div className="p-5 space-y-3 max-h-64 overflow-y-auto">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground py-4 animate-pulse">Loading recipe...</p>
          ) : lines.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">No ingredients linked yet. Add ingredients below to enable automatic stock tracking.</p>
          ) : (
            <AnimatePresence>
              {lines.map(line => (
                <motion.div key={line.ingredientId} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${stockOk(line) ? 'bg-surface border-border' : 'bg-danger/5 border-danger/30'}`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${stockOk(line) ? 'bg-success' : 'bg-danger'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{line.ingredient.nameEn}</p>
                    <p className="text-xs text-muted-foreground">
                      Stock: <span className={stockOk(line) ? 'text-success font-bold' : 'text-danger font-bold'}>{line.ingredient.quantityAvailable} {line.ingredient.unit}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      value={line.quantityUsed}
                      onChange={e => setLines(prev => prev.map(l => l.ingredientId === line.ingredientId ? { ...l, quantityUsed: parseFloat(e.target.value) || 0 } : l))}
                      className="w-20 px-2 py-1 text-center text-sm font-bold bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground">{line.ingredient.unit}</span>
                    <button onClick={() => removeLine(line.ingredientId)} className="p-1.5 rounded-lg text-danger/60 hover:text-danger hover:bg-danger/10 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Add ingredient */}
        <div className="px-5 pb-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Add Ingredient</p>
          <div className="flex gap-2">
            <select
              value={selectedIngId}
              onChange={e => setSelectedIngId(e.target.value)}
              className="flex-1 px-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select ingredient...</option>
              {availableToAdd.map(i => (
                <option key={i.id} value={i.id}>{i.nameEn} ({i.quantityAvailable} {i.unit})</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Qty"
              value={qty}
              onChange={e => setQty(e.target.value)}
              className="w-20 px-3 py-2 bg-surface border border-border rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={addLine}
              disabled={!selectedIngId || !qty}
              className="px-3 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2 border-t border-border pt-4">
          <button onClick={onClose} className="flex-1 py-2.5 bg-surface-elevated border border-border rounded-xl text-sm font-bold hover:bg-surface transition-colors">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {saving ? 'Saving...' : <><Save size={15} /> Save & Sync</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
