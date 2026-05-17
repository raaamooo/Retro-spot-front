'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EVENTS } from '@/lib/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import { Sun, Moon, MapPin, Bell, ChevronLeft, ArrowRight, Trash2, CheckCircle2, Clock, ChevronDown, ChevronUp, CreditCard, X } from 'lucide-react';
import { Button, Card, ScrollReveal, FormInput, Textarea, Select, EmptyState, LoadingState } from '@/components';
import { useToast } from '@/contexts/ToastContext';

import { API_URL } from '@/lib/constants';
import { getItemImage } from '@/lib/itemImages';
import DrinkQuiz from '@/components/ui/DrinkQuiz';
import styles from './Menu.module.css';

// --- Types ---
type MenuItem = {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  price: number;
  image: string | null;
  category: string;
  available: boolean;
  tags?: string[];
  isAddition?: boolean;
  compatibleWithIds?: string[];
};

type CartItem = MenuItem & {
  cartQuantity: number;
  selectedAdditions?: MenuItem[];
};

function MenuContent() {
  const { t, language, toggleLanguage, isRtl } = useLanguage();
  const { theme, setTheme } = useTheme();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableId, setTableId] = useState<string>('');
  
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [quizHighlight, setQuizHighlight] = useState<string>('');
  
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tip, setTip] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);

  const [flavorModalItem, setFlavorModalItem] = useState<MenuItem | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const ICE_CREAM_FLAVORS = ['Vanilla', 'Chocolate', 'Mango', 'Strawberry'];

  useEffect(() => {
    setMounted(true);
    const table = searchParams.get('locationId');
    if (table) setTableId(table);

    fetch(`${API_URL}/api/menu`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch menu');
        return res.json();
      })
      .then((data: any[]) => {
        const allItems: MenuItem[] = data.flatMap((cat: any) => 
          cat.items.map((item: any) => ({
            ...item,
            name: language === 'ar' ? item.nameAr : item.nameEn,
            nameEn: item.nameEn,
            description: language === 'ar' ? item.descriptionAr : item.descriptionEn,
            category: language === 'ar' ? cat.nameAr : cat.nameEn,
            isAddition: cat.nameEn === 'Additions' || item.isAddition
          }))
        );

        const enrichedData = allItems.map((d: any) => ({
          ...d,
          tags: d.tags ? (typeof d.tags === 'string' ? d.tags.split(',') : d.tags) : ['hot', 'coffee'],
        }));
        setMenuItems(enrichedData);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Menu load error:', err);
        setIsLoading(false);
      });
  }, [language, searchParams]);

  const checkActiveOrder = async (tid: string) => {
    try {
      const res = await fetch(`${API_URL}/api/orders?locationId=${tid}`);
      if (!res.ok) return;
      const data = await res.json();
      const active = data.some((o: any) => o.status !== 'completed');
      setHasActiveOrder(active);
    } catch (err) {
      console.error('Error checking active order:', err);
    }
  };

  useEffect(() => {
    if (tableId) {
      checkActiveOrder(tableId);
      const interval = setInterval(() => checkActiveOrder(tableId), 10000);
      return () => clearInterval(interval);
    }
  }, [tableId]);

  useSocketEvent(EVENTS.ORDER_STATUS_UPDATED, (data: any) => {
    if (data.locationId === tableId) checkActiveOrder(tableId);
  });

  const categories = Array.from(new Set(menuItems.filter(i => !i.isAddition).map(i => i.category)));
  const additions = menuItems.filter(i => i.isAddition);

  useEffect(() => {
    if (categories.length > 0 && expandedCategories.length === 0 && !quizHighlight) {
      setExpandedCategories([categories[0]]);
    }
  }, [categories, expandedCategories, quizHighlight]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleQuizComplete = (recommendedCategory: string) => {
    const localizedCatName = recommendedCategory;
    const isCatExist = categories.find(c => c.toLowerCase() === localizedCatName.toLowerCase());
    if (isCatExist) {
      if (!expandedCategories.includes(isCatExist)) {
        setExpandedCategories(prev => [...prev, isCatExist]);
      }
      setQuizHighlight(isCatExist);
      setTimeout(() => {
        const el = document.getElementById(`category-${isCatExist}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      setTimeout(() => setQuizHighlight(''), 3000);
    }
  };

  const isIceCream = (item: MenuItem) => {
    return item.nameEn?.toLowerCase().includes('ice cream') || 
           item.category.toLowerCase().includes('ice cream');
  };

  const getAdditionsForItem = (item: MenuItem) => {
    return additions.filter(add => 
      !add.compatibleWithIds || add.compatibleWithIds.length === 0 || add.compatibleWithIds.includes(item.id)
    );
  };

  const addToCart = (item: MenuItem) => {
    if (isIceCream(item)) {
      setFlavorModalItem(item);
      setSelectedFlavors([]);
      return;
    }
    const itemAdditions = getAdditionsForItem(item);
    if (itemAdditions.length > 0) {
      // Logic for adding with additions is simplified here. In a real scenario, you'd show a modal.
      // For now, we just add it.
    }
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.map(i => i.id === item.id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i);
      return [...prev, { ...item, cartQuantity: 1 }];
    });
    addToast(t('item_added'), 'success');
  };

  const addIceCreamToCart = () => {
    if (!flavorModalItem) return;
    if (selectedFlavors.length === 0) {
      addToast('Please select at least one flavor', 'error');
      return;
    }
    const flavorsDesc = `Flavors: ${selectedFlavors.join(', ')}`;
    const finalItem: CartItem = {
      ...flavorModalItem,
      cartQuantity: 1,
      description: `${flavorModalItem.description}\n${flavorsDesc}`
    };
    setCart(prev => [...prev, finalItem]);
    setFlavorModalItem(null);
    setSelectedFlavors([]);
    addToast(t('item_added'), 'success');
  };

  const toggleFlavor = (f: string) => {
    setSelectedFlavors(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const newCart = [...prev];
      newCart[index].cartQuantity += delta;
      if (newCart[index].cartQuantity <= 0) newCart.splice(index, 1);
      return newCart;
    });
  };

  const cartTotal = cart.reduce((sum, item) => {
    let itemTotal = item.price;
    if (item.selectedAdditions) itemTotal += item.selectedAdditions.reduce((s, a) => s + a.price, 0);
    return sum + (itemTotal * item.cartQuantity);
  }, 0);

  const finalTotal = cartTotal + tip;

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const orderData = {
        type: 'dine_in',
        locationId: tableId || 'Table 1',
        customerName: customerName || 'Guest',
        items: cart.map(i => ({
          menuItemId: i.id,
          quantity: i.cartQuantity,
          notes: i.selectedAdditions ? `Additions: ${i.selectedAdditions.map(a => a.nameEn).join(', ')}` : ''
        })),
        totalAmount: finalTotal,
        paymentMethod,
        tipAmount: tip,
        notes
      };

      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!res.ok) throw new Error('Order failed');
      addToast(t('order_placed'), 'success');
      setCart([]);
      setIsCartOpen(false);
      setHasActiveOrder(true);
    } catch (error) {
      addToast('Failed to place order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestCheck = async () => {
    try {
      await fetch(`${API_URL}/api/orders/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId: tableId || 'Table 1' })
      });
      addToast('Check requested! Staff will be with you shortly.', 'success');
    } catch (err) {
      addToast('Failed to request check. Please call a waiter.', 'error');
    }
  };

  if (isLoading) return <LoadingState fullHeight />;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.title}>Retro <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Menu</span></div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {tableId && (
            <div className={styles.tableInfo}>
              {tableId.replace(/_/g, ' ')}
            </div>
          )}
          {mounted && (
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="focus-ring" style={{ padding: '8px', color: 'var(--muted)' }}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}
          <button onClick={toggleLanguage} className="focus-ring" style={{ padding: '8px', color: 'var(--muted)', fontWeight: 700, fontSize: '12px' }}>
            {language === 'en' ? 'AR' : 'EN'}
          </button>
        </div>
      </header>

      <div className="container">
        <DrinkQuiz onComplete={handleQuizComplete} />
      </div>

      <div className="container" style={{ marginTop: '32px' }}>
        <div className={styles.categoryList}>
          {categories.map((category) => {
            const isExpanded = expandedCategories.includes(category);
            const isHighlighted = quizHighlight === category;
            const catItems = menuItems.filter(i => i.category === category && !i.isAddition);

            return (
              <div key={category} id={`category-${category}`} className={`${styles.categoryCard} ${isHighlighted ? styles.categoryCardHighlight : ''}`}>
                <button 
                  onClick={() => toggleCategory(category)} 
                  className={styles.categoryHeader}
                >
                  <h2 className={styles.categoryTitle}>{category}</h2>
                  <div className={`${styles.categoryIcon} ${isExpanded ? styles.categoryIconExpanded : ''}`}>
                    <ChevronDown size={24} />
                  </div>
                </button>

                {isExpanded && (
                  <div className={styles.itemList}>
                    {catItems.map((item) => (
                      <div key={item.id} className={styles.menuItem}>
                        <img 
                          src={item.image || getItemImage(item.nameEn || item.name)} 
                          alt={item.name} 
                          className={styles.itemImage}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop';
                          }}
                        />
                        <div className={styles.itemContent}>
                          <div>
                            <h4 className={styles.itemName}>{item.name}</h4>
                            <p className={styles.itemDesc}>{item.description}</p>
                          </div>
                          <div className={styles.itemFooter}>
                            <span className={styles.itemPrice}>{item.price.toFixed(2)} EGP</span>
                            {item.available ? (
                              <button onClick={() => addToCart(item)} className={styles.addButton}>
                                {t('add')}
                              </button>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--danger)' }}>Out of stock</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {cart.length > 0 && !isCartOpen && (
        <button onClick={() => setIsCartOpen(true)} className={styles.cartButton}>
          <div className={styles.cartBadge}>{cart.reduce((s, i) => s + i.cartQuantity, 0)}</div>
          <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {t('view_cart')} • {cartTotal.toFixed(2)} EGP
          </span>
        </button>
      )}

      {hasActiveOrder && cart.length === 0 && !isCartOpen && (
        <div className={styles.requestCheckBar}>
          <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {t('active_order')}
          </span>
          <Button variant="ghost" size="sm" onClick={requestCheck} style={{ borderColor: 'var(--primary-foreground)', color: 'var(--primary-foreground)' }}>
            Request Check
          </Button>
        </div>
      )}

      {/* Cart Sheet */}
      <div className={`${styles.cartOverlay} ${isCartOpen ? styles.cartOverlayOpen : ''}`} onClick={() => setIsCartOpen(false)} />
      <div className={`${styles.cartSheet} ${isCartOpen ? styles.cartSheetOpen : ''}`}>
        <div className={styles.cartHeader}>
          <h2 className={styles.cartTitle}>{t('your_order')}</h2>
          <button onClick={() => setIsCartOpen(false)} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.cartContent}>
          {cart.length === 0 ? (
            <EmptyState title="Cart is empty" description="Add some items from the menu" />
          ) : (
            <>
              <div>
                {cart.map((item, idx) => (
                  <div key={idx} className={styles.cartItem}>
                    <div className={styles.cartItemDetails}>
                      <div className={styles.cartItemName}>{item.name}</div>
                      {item.selectedAdditions && item.selectedAdditions.map(a => (
                        <div key={a.id} style={{ fontSize: '12px', color: 'var(--muted)' }}>+ {a.name} ({a.price} EGP)</div>
                      ))}
                      <div className={styles.cartItemPrice}>
                        {((item.price + (item.selectedAdditions?.reduce((s, a) => s + a.price, 0) || 0)) * item.cartQuantity).toFixed(2)} EGP
                      </div>
                    </div>
                    <div className={styles.cartItemControls}>
                      <button onClick={() => updateQuantity(idx, -1)} className={styles.quantityBtn}>-</button>
                      <span style={{ fontSize: '14px', fontWeight: 600, width: '20px', textAlign: 'center' }}>{item.cartQuantity}</span>
                      <button onClick={() => updateQuantity(idx, 1)} className={styles.quantityBtn}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <FormInput label="Customer Name (Optional)" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                <Textarea label="Order Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Allergies, preferences..." rows={2} />
                <Select
                  label="Payment Method"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  options={[
                    { label: 'Cash / Pay at Counter', value: 'cash' },
                    { label: 'Instapay / Transfer', value: 'transfer' },
                  ]}
                />
              </div>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className={styles.cartFooter}>
            <div className={styles.cartTotalRow}>
              <span>Total</span>
              <span>{finalTotal.toFixed(2)} EGP</span>
            </div>
            <Button fullWidth onClick={submitOrder} loading={isSubmitting}>
              {t('confirm_order')}
            </Button>
          </div>
        )}
      </div>

      {/* Flavor Modal */}
      <div className={`${styles.modalOverlay} ${flavorModalItem ? styles.modalOverlayOpen : ''}`} onClick={() => setFlavorModalItem(null)}>
        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
          <h2 className="h2">Select Flavors</h2>
          <p className="body-text" style={{ marginBottom: '24px' }}>Choose your ice cream flavors for {flavorModalItem?.name}</p>
          <div style={{ display: 'grid', gap: '8px', marginBottom: '24px' }}>
            {ICE_CREAM_FLAVORS.map(f => (
              <button 
                key={f} 
                onClick={() => toggleFlavor(f)}
                style={{
                  padding: '12px',
                  border: `1px solid ${selectedFlavors.includes(f) ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: selectedFlavors.includes(f) ? 'var(--accent)' : 'transparent',
                  color: selectedFlavors.includes(f) ? 'var(--primary-foreground)' : 'var(--foreground)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Button variant="ghost" fullWidth onClick={() => setFlavorModalItem(null)}>Cancel</Button>
            <Button fullWidth onClick={addIceCreamToCart}>Confirm</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<LoadingState fullHeight />}>
      <MenuContent />
    </Suspense>
  );
}
