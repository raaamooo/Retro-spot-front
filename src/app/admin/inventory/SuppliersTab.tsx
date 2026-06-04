'use client';
import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { API_URL } from '@/lib/constants';
import { Truck, Mail, Phone, MapPin, Edit2, Trash2, Plus } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export default function SuppliersTab() {
  const { language } = useLanguage();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/inventory/suppliers`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setSuppliers(data); setLoading(false); });
  }, []);

  if (loading) return <div className="py-12 text-center text-muted-foreground animate-pulse">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm flex items-center gap-2">
          <Plus size={16} />
          {language === 'ar' ? 'إضافة مورد' : 'Add Supplier'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(sup => (
          <div key={sup.id} className="p-4 bg-surface border border-border rounded-2xl relative group">
            <h3 className="font-black text-lg mb-3 flex items-center gap-2">
              <Truck size={18} className="text-primary" />
              {sup.name}
            </h3>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              {sup.contactName && <p className="flex items-center gap-2"><span className="w-4" />{sup.contactName}</p>}
              {sup.phone && <p className="flex items-center gap-2"><Phone size={14} /> {sup.phone}</p>}
              {sup.email && <p className="flex items-center gap-2"><Mail size={14} /> {sup.email}</p>}
              {sup.address && <p className="flex items-center gap-2"><MapPin size={14} /> {sup.address}</p>}
            </div>

            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1.5 text-muted-foreground hover:text-primary bg-surface-elevated rounded-lg"><Edit2 size={14}/></button>
              <button className="p-1.5 text-muted-foreground hover:text-danger bg-surface-elevated rounded-lg"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
