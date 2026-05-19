'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EVENTS } from '@/lib/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import { Sun, Moon, Trash2, X, ShoppingBag, Plus, Minus, Sparkles } from 'lucide-react';
import { Button, FormInput, Textarea, Select, EmptyState, LoadingState } from '@/components';
import { useToast } from '@/contexts/ToastContext';

import { API_URL } from '@/lib/constants';
import { getItemImage } from '@/lib/itemImages';
import { isCoffeeCat, supportsMilk, supportsSweetness, getCategoryDescription, throttleRAF } from '@/lib/menuUtils';
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
  customizations?: string;
};

function MenuContent() {
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableId, setTableId] = useState<string>('');
  const [tableName, setTableName] = useState<string>('');
  const [takeawayLocationId, setTakeawayLocationId] = useState<string>('');
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [hasTableQR, setHasTableQR] = useState<boolean>(false);
  
  const [quizHighlight, setQuizHighlight] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tip, setTip] = useState(0);
  const [tipType, setTipType] = useState<'percent' | 'custom'>('percent');
  const [tipPct, setTipPct] = useState<number>(0);
  const [customTipVal, setCustomTipVal] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);

  // Customization modal states
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalSelectedAdditions, setModalSelectedAdditions] = useState<MenuItem[]>([]);
  const [sweetness, setSweetness] = useState<'standard' | 'half' | 'none'>('standard');
  const [milk, setMilk] = useState<'none' | 'full' | 'oat' | 'almond'>('none');

  // Flavor modal states for Ice Cream
  const [flavorModalItem, setFlavorModalItem] = useState<MenuItem | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const ICE_CREAM_FLAVORS = ['Vanilla', 'Chocolate', 'Mango', 'Strawberry'];

  useEffect(() => {
    setMounted(true);
    const table = searchParams.get('locationId');
    if (table) {
      setHasTableQR(true);
    }
    
    fetch(`${API_URL}/api/locations`)
      .then(res => res.json())
      .then(data => {
        const takeawayLoc = data.find((l: any) => l.name.toLowerCase() === 'takeaway' || l.type === 'takeaway');
        if (takeawayLoc) {
          setTakeawayLocationId(takeawayLoc.id);
        }

        let foundLoc = null;
        if (table) {
          foundLoc = data.find((l: any) => l.id === table);
        }
        
        if (foundLoc) {
          setTableId(foundLoc.id);
          setTableName(foundLoc.name);
          setOrderType('dine_in');
        } else if (data.length > 0) {
          const defaultLoc = takeawayLoc || data.find((l: any) => l.name === 'Table 1') || data[0];
          setTableId(defaultLoc.id);
          setTableName(defaultLoc.name);
          setOrderType('takeaway');
        }
      })
      .catch(console.error);

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
          tags: d.tags ? (typeof d.tags === 'string' ? d.tags.split(',') : d.tags) : [],
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

  // Memoize derived data to prevent infinite useEffect loops (M5 fix)
  const categories = useMemo(
    () => Array.from(new Set(menuItems.filter(i => !i.isAddition).map(i => i.category))),
    [menuItems]
  );
  const additions = useMemo(() => menuItems.filter(i => i.isAddition), [menuItems]);

  // Set default active category once loaded
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  // Scrollspy observer logic
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      let currentActive = activeCategory;
      
      for (const cat of categories) {
        const el = document.getElementById(`category-${cat}`);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            currentActive = cat;
            break;
          }
        }
      }
      if (currentActive && currentActive !== activeCategory) {
        setActiveCategory(currentActive);
        const pillEl = document.getElementById(`pill-${currentActive}`);
        if (pillEl && pillEl.parentElement) {
          const container = pillEl.parentElement;
          const scrollLeft = pillEl.offsetLeft - (container.clientWidth / 2) + (pillEl.clientWidth / 2);
          container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
      }
    };

    // Throttle scroll handler with RAF to prevent jank (H6 fix)
    const throttledScroll = throttleRAF(handleScroll);
    window.addEventListener('scroll', throttledScroll);
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [categories, activeCategory]);

  const handleQuizComplete = (recommendedCategory: string) => {
    const localizedCatName = recommendedCategory;
    const isCatExist = categories.find(c => c.toLowerCase() === localizedCatName.toLowerCase());
    if (isCatExist) {
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

  // Trigger customization or add directly to cart
  const handleAddClick = (item: MenuItem) => {
    if (isIceCream(item)) {
      setFlavorModalItem(item);
      setSelectedFlavors([]);
      return;
    }
    
    const itemAdditions = getAdditionsForItem(item);
    const itemCategory = item.category.toLowerCase();
    const itemTags = item.tags || [];

    // Use shared helpers from menuUtils (H4 fix — was duplicated 3x)
    const hasMilk = supportsMilk(itemCategory, itemTags);
    const hasSweetness = supportsSweetness(itemCategory);

    if (itemAdditions.length > 0 || hasMilk || hasSweetness) {
      setCustomizingItem(item);
      setModalQuantity(1);
      setModalSelectedAdditions([]);
      setSweetness('standard');
      setMilk('none');
    } else {
      setCart(prev => {
        const exists = prev.find(i => i.id === item.id && (!i.selectedAdditions || i.selectedAdditions.length === 0));
        if (exists) {
          return prev.map(i => (i.id === item.id && (!i.selectedAdditions || i.selectedAdditions.length === 0))
            ? { ...i, cartQuantity: i.cartQuantity + 1 }
            : i
          );
        }
        return [...prev, { ...item, cartQuantity: 1 }];
      });
      addToast(t('item_added'), 'success');
    }
  };

  const toggleModalAddition = (add: MenuItem) => {
    setModalSelectedAdditions(prev => 
      prev.some(a => a.id === add.id) 
        ? prev.filter(a => a.id !== add.id) 
        : [...prev, add]
    );
  };

  const confirmCustomization = () => {
    if (!customizingItem) return;
    
    const details: string[] = [];
    if (sweetness !== 'standard') {
      details.push(sweetness === 'half' ? 'Half Sweet' : 'Unsweetened');
    }
    
    let extraMilkPrice = 0;
    if (milk !== 'none') {
      details.push(`${milk.toUpperCase()} Milk`);
      if (milk === 'oat' || milk === 'almond') {
        extraMilkPrice = 15;
      }
    }
    
    if (modalSelectedAdditions.length > 0) {
      details.push(modalSelectedAdditions.map(a => a.name).join(', '));
    }
    
    const finalItem: CartItem = {
      ...customizingItem,
      price: customizingItem.price + extraMilkPrice,
      cartQuantity: modalQuantity,
      selectedAdditions: modalSelectedAdditions,
      customizations: details.length > 0 ? details.join(' • ') : undefined,
      description: details.length > 0 ? `${customizingItem.description} (${details.join(' • ')})` : customizingItem.description
    };
    
    setCart(prev => {
      const exists = prev.find(i => 
        i.id === finalItem.id && 
        JSON.stringify(i.selectedAdditions?.map(a => a.id)) === JSON.stringify(finalItem.selectedAdditions?.map(a => a.id)) &&
        i.description === finalItem.description
      );
      if (exists) {
        return prev.map(i => (i.id === finalItem.id && 
          JSON.stringify(i.selectedAdditions?.map(a => a.id)) === JSON.stringify(finalItem.selectedAdditions?.map(a => a.id)) &&
          i.description === finalItem.description)
            ? { ...i, cartQuantity: i.cartQuantity + finalItem.cartQuantity } 
            : i
        );
      }
      return [...prev, finalItem];
    });
    
    setCustomizingItem(null);
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
      customizations: flavorsDesc,
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

  const handleTipPctSelect = (pct: number) => {
    setTipType('percent');
    setTipPct(pct);
    const calculatedTip = Math.round(cartTotal * (pct / 100));
    setTip(calculatedTip);
  };

  const handleCustomTipChange = (val: string) => {
    setTipType('custom');
    setTipPct(0);
    setCustomTipVal(val);
    const parsed = parseFloat(val) || 0;
    setTip(parsed);
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !tableId) return;

    const isTakeaway = orderType === 'takeaway';
    if (isTakeaway && !customerName.trim()) {
      addToast('Please enter your name so we can identify your takeaway order!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        type: isTakeaway ? 'takeaway' : 'dine_in',
        orderType: isTakeaway ? 'takeaway' : 'dine_in',
        locationId: isTakeaway && takeawayLocationId ? takeawayLocationId : tableId,
        customerName: customerName || 'Guest',
        items: cart.map(i => {
          let customNotes = i.customizations || '';
          if (!customNotes && i.selectedAdditions && i.selectedAdditions.length > 0) {
            customNotes = i.selectedAdditions.map(a => a.nameEn || a.name).join(', ');
          }

          return {
            menuItemId: i.id,
            quantity: i.cartQuantity,
            additions: customNotes || null,
            itemPriceAtTime: i.price + (i.selectedAdditions?.reduce((s, a) => s + a.price, 0) || 0),
            notes: null
          };
        }),
        subtotal: cartTotal,
        total: finalTotal,
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
      setTip(0);
      setTipPct(0);
      setCustomTipVal('');
    } catch (error) {
      addToast('Failed to place order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestCheck = async () => {
    if (!tableId) return;
    try {
      await fetch(`${API_URL}/api/waitercalls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId: tableId, type: 'check' })
      });
      addToast('Check requested! Staff will be with you shortly.', 'success');
    } catch (err) {
      addToast('Failed to request check. Please call a waiter.', 'error');
    }
  };

  if (isLoading) return <LoadingState fullHeight />;

  const customizingItemAdditions = customizingItem ? getAdditionsForItem(customizingItem) : [];
  const customizingItemSubtotal = customizingItem 
    ? (customizingItem.price + (milk === 'oat' || milk === 'almond' ? 15 : 0) + modalSelectedAdditions.reduce((sum, a) => sum + a.price, 0)) * modalQuantity 
    : 0;

  return (
    <div className={styles.page}>
      {/* Premium Header */}
      <header className={styles.header}>
        <div className={styles.title}>
          Retro <span className={styles.retroMenuSpan}>Menu</span>
        </div>
        <div className={styles.headerActions}>
          {tableId && (
            <div className={styles.tableInfo}>
              {orderType === 'takeaway' ? 'Takeaway' : (tableName || 'Loading...')}
            </div>
          )}
          {mounted && (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
              className={`focus-ring ${styles.headerBtn}`}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}
          <button 
            onClick={toggleLanguage} 
            className={`focus-ring ${styles.headerBtn} ${styles.headerBtnBold}`}
          >
            {language === 'en' ? 'AR' : 'EN'}
          </button>
        </div>
      </header>

      {/* Sticky Category Scroll Navigation Bar */}
      {categories.length > 0 && (
        <nav className={styles.categoryNav}>
          <div className={styles.categoryNavScroll}>
            {categories.map(category => (
              <button
                key={category}
                type="button"
                id={`pill-${category}`}
                className={`${styles.categoryPill} ${activeCategory === category ? styles.categoryPillActive : ''}`}
                onClick={() => {
                  const el = document.getElementById(`category-${category}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Sequential Categories Layout */}
      <div className="container" style={{ marginTop: '24px' }}>
        <div className={styles.categoryList}>
          {categories.map((category) => {
            const isHighlighted = quizHighlight === category;
            const catItems = menuItems.filter(i => i.category === category && !i.isAddition);

            return (
              <section 
                key={category} 
                id={`category-${category}`} 
                className={`${styles.categorySection} ${isHighlighted ? styles.categoryCardHighlight : ''}`}
              >
                <div className={styles.categoryHeader}>
                  <h2 className={styles.categoryTitle}>{category}</h2>
                  <p className={styles.categoryDesc}>
                    {getCategoryDescription(category)}
                  </p>
                </div>

                <div className={styles.gridList}>
                  {catItems.map((item) => (
                    <div 
                      key={item.id} 
                      className={styles.menuItem}
                      onClick={() => handleAddClick(item)}
                    >
                      <div className={styles.itemImageWrap}>
                        <img 
                          src={item.image || getItemImage(item.nameEn || item.name) || ''} 
                          alt={item.name} 
                          className={styles.itemImage}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop';
                          }}
                        />
                      </div>
                      <div className={styles.itemContent}>
                        <div>
                          <h4 className={styles.itemName}>{item.name}</h4>
                          <p className={styles.itemDesc}>{item.description}</p>
                          {item.tags && item.tags.length > 0 && (
                            <div className={styles.itemTags}>
                              {item.tags.map(t => (
                                <span key={t} className={styles.tag}>{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className={styles.itemFooter}>
                          <span className={styles.itemPrice}>{item.price.toFixed(2)} EGP</span>
                          {item.available ? (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddClick(item);
                              }} 
                              className={styles.addButton}
                            >
                              {t('add')}
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--danger)' }}>Out of stock</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className="container" style={{ marginTop: '48px', marginBottom: '64px' }}>
        <DrinkQuiz onSelectCategory={handleQuizComplete} />
      </div>

      {/* Floating Action Cart Button */}
      {cart.length > 0 && !isCartOpen && (
        <button onClick={() => setIsCartOpen(true)} className={styles.cartButton} aria-label="Open cart">
          <div className={styles.cartBadge} aria-label={`${cart.reduce((s, i) => s + i.cartQuantity, 0)} items in cart`}>{cart.reduce((s, i) => s + i.cartQuantity, 0)}</div>
          <span style={{ fontWeight: 700, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {t('view_cart')} • {cartTotal.toFixed(2)} EGP
          </span>
        </button>
      )}

      {/* Staff Check request alert */}
      {hasActiveOrder && cart.length === 0 && !isCartOpen && orderType !== 'takeaway' && (
        <div className={styles.requestCheckBar}>
          <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {t('active_order')}
          </span>
          <Button variant="ghost" size="sm" onClick={requestCheck} style={{ borderColor: 'var(--primary-foreground)', color: 'var(--primary-foreground)' }}>
            Request Check
          </Button>
        </div>
      )}

      {/* Dual Layout Cart Sheet Drawer */}
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
                        <div key={a.id} className={styles.cartItemOption}>
                          + {a.name} ({a.price.toFixed(2)} EGP)
                        </div>
                      ))}
                      <div className={styles.cartItemPrice}>
                        {((item.price + (item.selectedAdditions?.reduce((s, a) => s + a.price, 0) || 0)) * item.cartQuantity).toFixed(2)} EGP
                      </div>
                    </div>
                    <div className={styles.cartItemControls}>
                      <button onClick={() => updateQuantity(idx, -1)} className={styles.quantityBtn}>-</button>
                      <span className={styles.cartItemQty}>{item.cartQuantity}</span>
                      <button onClick={() => updateQuantity(idx, 1)} className={styles.quantityBtn}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Details */}
              <div className={styles.cartItemsList}>
                <Select
                  label="Dining Option"
                  value={orderType}
                  onChange={e => setOrderType(e.target.value as 'dine_in' | 'takeaway')}
                  options={
                    hasTableQR
                      ? [
                          { label: 'Dine In (Eat Here)', value: 'dine_in' },
                          { label: 'Takeaway (Pickup)', value: 'takeaway' }
                        ]
                      : [
                          { label: 'Takeaway (Pickup)', value: 'takeaway' }
                        ]
                  }
                />
                <FormInput 
                  label={orderType === 'takeaway' ? "Your Name (Required for Takeaway)" : "Customer Name (Optional)"} 
                  value={customerName} 
                  onChange={e => setCustomerName(e.target.value)} 
                />
                <Textarea 
                  label="Order Notes" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="Allergies, customization details..." 
                  rows={2} 
                />
                <Select
                  label="Payment Method"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  options={[
                    { label: 'Cash / Pay at Counter', value: 'cash' },
                    { label: 'Instapay / Mobile Wallet', value: 'transfer' },
                  ]}
                />

                {/* Quick Tips Section */}
                <div className={styles.tipSection}>
                  <label className={styles.optionLabel}>Add Tip for Service</label>
                  <div className={styles.tipGrid}>
                    {[0, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleTipPctSelect(pct)}
                        className={`${styles.tipBtn} ${tipType === 'percent' && tipPct === pct ? styles.tipBtnActive : ''}`}
                      >
                        {pct === 0 ? 'No Tip' : `${pct}%`}
                      </button>
                    ))}
                  </div>
                  <div className={styles.cartNotesWrap}>
                    <FormInput
                      placeholder="Custom Tip Amount (EGP)"
                      value={customTipVal}
                      onChange={(e) => handleCustomTipChange(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className={styles.cartFooter}>
            <div className={styles.cartTotalRow}>
              <span>Subtotal</span>
              <span>{cartTotal.toFixed(2)} EGP</span>
            </div>
            {tip > 0 && (
              <div className={`${styles.cartTotalRow} ${styles.cartTotalRowMuted}`}>
                <span>Tip</span>
                <span>{tip.toFixed(2)} EGP</span>
              </div>
            )}
            <div className={`${styles.cartTotalRow} ${styles.cartGrandTotalRow}`}>
              <span>Total</span>
              <span>{finalTotal.toFixed(2)} EGP</span>
            </div>
            <Button fullWidth onClick={submitOrder} loading={isSubmitting}>
              {t('confirm_order')}
            </Button>
          </div>
        )}
      </div>

      {/* Brand New Customization / Additions Modal */}
      <div 
        className={`${styles.modalOverlay} ${customizingItem ? styles.modalOverlayOpen : ''}`} 
        onClick={() => setCustomizingItem(null)}
      >
        {customizingItem && (
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.cartTitle}>Customize Drink</h2>
              <button onClick={() => setCustomizingItem(null)} className={styles.closeButton}>
                <X size={24} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Product Info Summary */}
              <div className={styles.modalItemHeader}>
                <div className={styles.modalItemImageWrap}>
                  <img 
                    src={customizingItem.image || getItemImage(customizingItem.nameEn || customizingItem.name) || ''} 
                    alt={customizingItem.name} 
                    className={styles.itemImage}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop';
                    }}
                  />
                </div>
                <div>
                  <h3 className={styles.modalItemTitle}>
                    {customizingItem.name}
                  </h3>
                  <p className={styles.modalItemDesc}>
                    {customizingItem.price.toFixed(2)} EGP
                  </p>
                </div>
              </div>

              {/* Custom Preferences */}
              {(() => {
                const cat = customizingItem.category.toLowerCase();
                const tags = customizingItem.tags || [];
                // Use shared helpers from menuUtils (H4 fix — 3rd dedup)
                const showMilk = supportsMilk(cat, tags);
                const showSweetness = supportsSweetness(cat);

                return (
                  <>
                    {showSweetness && (
                      <div className={styles.optionGroup}>
                        <span className={styles.optionLabel}>Sweetness Level</span>
                        <div className={styles.optionGrid}>
                          {[
                            { label: 'Standard Sweetness', value: 'standard' },
                            { label: 'Half Sugar', value: 'half' },
                            { label: 'No Sugar', value: 'none' }
                          ].map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setSweetness(opt.value as any)}
                              className={`${styles.customizationPill} ${sweetness === opt.value ? styles.customizationPillActive : ''}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {showMilk && (
                      <div className={styles.optionGroup}>
                        <span className={styles.optionLabel}>Milk Preferences</span>
                        <div className={styles.optionGrid}>
                          {[
                            { label: 'No Milk', value: 'none' },
                            { label: 'Full Cream', value: 'full' },
                            { label: 'Oat Milk (+15 EGP)', value: 'oat' },
                            { label: 'Almond Milk (+15 EGP)', value: 'almond' }
                          ].map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setMilk(opt.value as any)}
                              className={`${styles.customizationPill} ${milk === opt.value ? styles.customizationPillActive : ''}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Compatible Extra Additions */}
              {customizingItemAdditions.length > 0 && (
                <div className={styles.optionGroup}>
                  <span className={styles.optionLabel}>Compatible Additions</span>
                  <div className={styles.optionGrid}>
                    {customizingItemAdditions.map((add) => {
                      const isSelected = modalSelectedAdditions.some(a => a.id === add.id);
                      return (
                        <button
                          key={add.id}
                          onClick={() => toggleModalAddition(add)}
                          className={`${styles.customizationPill} ${isSelected ? styles.customizationPillActive : ''}`}
                        >
                          <span>{add.name}</span>
                          <span className={styles.additionPrice}>+{add.price.toFixed(0)} EGP</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Product Quantity Incrementor */}
              <div className={`${styles.optionGroup} ${styles.modalQuantityGroup}`}>
                <span className={`${styles.optionLabel} ${styles.modalQuantityLabel}`}>Quantity</span>
                <div className={styles.modalQuantityContainer}>
                  <button 
                    onClick={() => setModalQuantity(q => Math.max(1, q - 1))} 
                    className={styles.quantityBtn}
                  >
                    <Minus size={14} />
                  </button>
                  <span className={styles.modalQuantityValue}>
                    {modalQuantity}
                  </span>
                  <button 
                    onClick={() => setModalQuantity(q => q + 1)} 
                    className={styles.quantityBtn}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button variant="ghost" fullWidth onClick={() => setCustomizingItem(null)}>
                Cancel
              </Button>
              <Button fullWidth onClick={confirmCustomization}>
                Add to Order ({customizingItemSubtotal.toFixed(2)} EGP)
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Premium Refactored Ice Cream Flavor Modal */}
      <div 
        className={`${styles.modalOverlay} ${flavorModalItem ? styles.modalOverlayOpen : ''}`} 
        onClick={() => setFlavorModalItem(null)}
      >
        {flavorModalItem && (
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.cartTitle}>Select Flavors</h2>
              <button onClick={() => setFlavorModalItem(null)} className={styles.closeButton}>
                <X size={24} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalItemHeader}>
                <div className={styles.modalItemImageWrap}>
                  <img 
                    src={flavorModalItem.image || getItemImage(flavorModalItem.nameEn || flavorModalItem.name) || ''} 
                    alt={flavorModalItem.name} 
                    className={styles.itemImage}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop';
                    }}
                  />
                </div>
                <div>
                  <h3 className={styles.modalItemTitle}>
                    {flavorModalItem.name}
                  </h3>
                  <p className={styles.modalItemDesc}>
                    Choose your ice cream scoop options below.
                  </p>
                </div>
              </div>

              <div className={`${styles.optionGroup} ${styles.cartNotesWrap}`}>
                <span className={styles.optionLabel}>Ice Cream Flavors</span>
                <div className={styles.optionGrid}>
                  {ICE_CREAM_FLAVORS.map(f => {
                    const isSelected = selectedFlavors.includes(f);
                    return (
                      <button 
                        key={f} 
                        onClick={() => toggleFlavor(f)}
                        className={`${styles.customizationPill} ${isSelected ? styles.customizationPillActive : ''}`}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button variant="ghost" fullWidth onClick={() => setFlavorModalItem(null)}>
                Cancel
              </Button>
              <Button fullWidth onClick={addIceCreamToCart}>
                Confirm Flavors
              </Button>
            </div>
          </div>
        )}
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
