'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { EVENTS } from '@/lib/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import { Sun, Moon, Trash2, X, ShoppingBag, Plus, Minus, Sparkles } from 'lucide-react';
import { Button, Card, FormInput, Textarea, Select, EmptyState, LoadingState, BottomSheet, SkeletonLoader } from '@/components';
import { useToast } from '@/contexts/ToastContext';

import { API_URL } from '@/lib/constants';
import { getItemImage } from '@/lib/itemImages';
import { isCoffeeCat, supportsMilk, supportsSweetness, getCategoryDescription, throttleRAF } from '@/lib/menuUtils';
import DrinkQuiz from '@/components/ui/DrinkQuiz';
import styles from './Menu.module.css';

/* All menu data now comes exclusively from the database via GET /api/menu.
   No hardcoded items — prices, availability, and names are managed in the admin panel. */

// --- Types ---
type MenuItem = {
  id: string;
  name: string;
  nameEn?: string;
  nameAr?: string;
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
  const [coffeeTypeTab, setCoffeeTypeTab] = useState<'hot' | 'iced'>('hot');

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

  // New per-category customization states (cocktails / milkshakes)
  const [modalSize, setModalSize] = useState('regular');
  const [modalIceLevel, setModalIceLevel] = useState('normal');
  const [modalSweetnessPct, setModalSweetnessPct] = useState(50);
  const [modalMilkBase, setModalMilkBase] = useState('whole');
  const [modalThickness, setModalThickness] = useState('medium');
  const [modalToppings, setModalToppings] = useState<string[]>([]);
  const [modalExtraShots, setModalExtraShots] = useState<string[]>([]);
  const [modalTemperature, setModalTemperature] = useState('frozen');
  const [modalSpecialInstructions, setModalSpecialInstructions] = useState('');

  // Flavor modal states for Ice Cream
  const [flavorModalItem, setFlavorModalItem] = useState<MenuItem | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);

  /* ═══════════════════════════════════════════════════════════════
     PER-CATEGORY CUSTOMIZATION CONFIGS
     ═══════════════════════════════════════════════════════════════ */
  const getItemCustomizationType = (item: MenuItem): 'cocktail' | 'milkshake' | 'generic' | null => {
    const cat = item.category.toLowerCase();
    if (cat.includes('cocktail') || cat.includes('كوكتيل')) return 'cocktail';
    if (cat.includes('milkshake') || cat.includes('ميلك شيك')) return 'milkshake';
    return 'generic';
  };



  const resetCustomizationDefaults = () => {
    setModalSize('regular');
    setModalIceLevel('normal');
    setModalSweetnessPct(50);
    setModalMilkBase('whole');
    setModalThickness('medium');
    setModalToppings([]);
    setModalExtraShots([]);
    setModalTemperature('frozen');
    setModalSpecialInstructions('');
    setModalQuantity(1);
    setModalSelectedAdditions([]);
    setSweetness('standard');
    setMilk('none');
  };

  useEffect(() => {
    setMounted(true);
    const table = searchParams.get('locationId') || searchParams.get('location');
    if (table) {
      setHasTableQR(true);
    }

    const abortController = new AbortController();
    const { signal } = abortController;

    fetch(`${API_URL}/api/locations`, { signal })
      .then(res => res.json())
      .then(data => {
        const takeawayLoc = data.find((l: any) => l.name.toLowerCase() === 'takeaway' || l.type === 'takeaway');
        if (takeawayLoc) {
          setTakeawayLocationId(takeawayLoc.id);
        }

        let foundLoc = null;
        if (table) {
          const normalizedTable = table.replace(/\s+/g, '').toLowerCase();
          foundLoc = data.find((l: any) => 
            l.id === table || 
            l.name.replace(/\s+/g, '').toLowerCase() === normalizedTable
          );
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
      .catch(err => {
        if (err.name !== 'AbortError') console.error('Location fetch error:', err);
      });

    fetch(`${API_URL}/api/menu`, { signal })
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
        if (err.name !== 'AbortError') {
          console.error('Menu load error:', err);
          setIsLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
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

  // Skip active-order polling for takeaway — the shared locationId would return
  // stale orders from other customers, and the banner is hidden for takeaway anyway.
  useEffect(() => {
    if (tableId && orderType !== 'takeaway') {
      checkActiveOrder(tableId);
      const interval = setInterval(() => checkActiveOrder(tableId), 10000);
      return () => clearInterval(interval);
    }
  }, [tableId, orderType]);

  useSocketEvent(EVENTS.ORDER_STATUS_UPDATED, (data: any) => {
    if (orderType !== 'takeaway' && data.locationId === tableId) checkActiveOrder(tableId);
  });

  useSocketEvent<any>(EVENTS.MENU_AVAILABILITY, (items) => {
    if (Array.isArray(items)) {
      setMenuItems(prev => prev.map(item => {
        const match = items.find(i => i.id === item.id);
        return match ? { ...item, available: match.available } : item;
      }));
    }
  });

  useSocketEvent<{ menuItemId: string }>(EVENTS.MENU_ITEM_UNAVAILABLE, ({ menuItemId }) => {
    setMenuItems(prev => prev.map(item =>
      item.id === menuItemId ? { ...item, available: false } : item
    ));
  });

  useSocketEvent<{ menuItemId: string }>(EVENTS.MENU_ITEM_AVAILABLE, ({ menuItemId }) => {
    setMenuItems(prev => prev.map(item =>
      item.id === menuItemId ? { ...item, available: true } : item
    ));
  });

  // Memoize derived data to prevent infinite useEffect loops (M5 fix)
  const categories = useMemo(
    () => Array.from(new Set(menuItems.filter(i => !i.isAddition).map(i => i.category))),
    [menuItems]
  );
  const additions = useMemo(() => menuItems.filter(i => i.isAddition), [menuItems]);

  const ICE_CREAM_FLAVORS = useMemo(() => 
    additions.filter(a => a.tags?.includes('ice_cream_flavor')).map(a => a.name), 
  [additions]);

  const COCKTAIL_ADDONS = useMemo(() => 
    additions.filter(a => a.tags?.includes('cocktail_addon')).map(a => ({ label: a.name, value: a.nameEn?.toLowerCase().replace(/\s+/g, '_') || a.id, price: a.price })), 
  [additions]);

  const MILKSHAKE_TOPPINGS = useMemo(() => 
    additions.filter(a => a.tags?.includes('milkshake_topping')).map(a => ({ label: a.name, value: a.nameEn?.toLowerCase().replace(/\s+/g, '_') || a.id, price: a.price })), 
  [additions]);

  const MILKSHAKE_EXTRA_SHOTS = useMemo(() => 
    additions.filter(a => a.tags?.includes('milkshake_extra_shot')).map(a => ({ label: a.name, value: a.nameEn?.toLowerCase().replace(/\s+/g, '_') || a.id, price: a.price })), 
  [additions]);

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

    const custType = getItemCustomizationType(item);

    // Cocktails & Milkshakes always open the customization modal
    if (custType === 'cocktail' || custType === 'milkshake') {
      resetCustomizationDefaults();
      setCustomizingItem(item);
      return;
    }

    // Generic items: check for additions / milk / sweetness support
    const itemAdditions = getAdditionsForItem(item);
    const itemCategory = item.category.toLowerCase();
    const itemTags = item.tags || [];
    const hasMilk = supportsMilk(itemCategory, itemTags);
    const hasSweetness = supportsSweetness(itemCategory);

    if (itemAdditions.length > 0 || hasMilk || hasSweetness) {
      resetCustomizationDefaults();
      setCustomizingItem(item);
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
    const custType = getItemCustomizationType(customizingItem);
    const details: string[] = [];
    let extraPrice = 0;

    if (custType === 'cocktail') {
      // Size
      if (modalSize === 'large') { details.push('Large'); extraPrice += 15; }
      else { details.push('Regular'); }
      // Ice
      if (modalIceLevel !== 'normal') details.push(modalIceLevel === 'none' ? 'No Ice' : modalIceLevel === 'light' ? 'Light Ice' : 'Extra Ice');
      // Sweetness
      if (modalSweetnessPct !== 50) details.push(`${modalSweetnessPct}% Sweet`);
      // Add-ons
      COCKTAIL_ADDONS.forEach(a => {
        if (modalToppings.includes(a.value)) { details.push(a.label); extraPrice += a.price; }
      });
      // Special instructions
      if (modalSpecialInstructions.trim()) details.push(`Note: ${modalSpecialInstructions.trim()}`);

    } else if (custType === 'milkshake') {
      // Size
      if (modalSize === 'large') { details.push('Large'); extraPrice += 20; }
      else if (modalSize === 'xl') { details.push('XL'); extraPrice += 35; }
      else { details.push('Regular'); }
      // Milk base
      if (modalMilkBase === 'oat') { details.push('Oat Milk'); extraPrice += 10; }
      else if (modalMilkBase === 'almond') { details.push('Almond Milk'); extraPrice += 10; }
      else if (modalMilkBase === 'no_milk') { details.push('Sorbet Style'); }
      // Thickness
      if (modalThickness !== 'medium') details.push(`${modalThickness.charAt(0).toUpperCase() + modalThickness.slice(1)} Thickness`);
      // Toppings
      MILKSHAKE_TOPPINGS.forEach(t => {
        if (modalToppings.includes(t.value)) { details.push(t.label); extraPrice += t.price; }
      });
      // Extra shots
      MILKSHAKE_EXTRA_SHOTS.forEach(s => {
        if (modalExtraShots.includes(s.value)) { details.push(s.label); extraPrice += s.price; }
      });
      // Temperature
      if (modalTemperature === 'chilled') details.push('Chilled');
      // Special instructions
      if (modalSpecialInstructions.trim()) details.push(`Note: ${modalSpecialInstructions.trim()}`);

    } else {
      // Generic items (coffee, tea, etc.) — existing logic
      if (sweetness !== 'standard') {
        details.push(sweetness === 'half' ? 'Half Sweet' : 'Unsweetened');
      }
      if (milk !== 'none') {
        details.push(`${milk.charAt(0).toUpperCase() + milk.slice(1)} Milk`);
        if (milk === 'oat' || milk === 'almond') extraPrice += 15;
      }
      if (modalSelectedAdditions.length > 0) {
        details.push(modalSelectedAdditions.map(a => a.name).join(', '));
        extraPrice += modalSelectedAdditions.reduce((s, a) => s + a.price, 0);
      }
    }

    const customizationKey = details.join(' • ');
    const finalItem: CartItem = {
      ...customizingItem,
      price: customizingItem.price + extraPrice,
      cartQuantity: modalQuantity,
      selectedAdditions: custType === 'generic' ? modalSelectedAdditions : undefined,
      customizations: details.length > 0 ? customizationKey : undefined,
      description: details.length > 0 ? `${customizingItem.description} (${customizationKey})` : customizingItem.description
    };

    // Different customizations = different line items
    setCart(prev => {
      const exists = prev.find(i =>
        i.id === finalItem.id &&
        i.customizations === finalItem.customizations
      );
      if (exists) {
        return prev.map(i => (i.id === finalItem.id && i.customizations === finalItem.customizations)
          ? { ...i, cartQuantity: i.cartQuantity + finalItem.cartQuantity }
          : i
        );
      }
      return [...prev, finalItem];
    });

    setCustomizingItem(null);
    addToast('✅ Added to your order!', 'success');
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

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className="container" style={{ marginTop: '100px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            <SkeletonLoader variant="card" count={6} />
          </div>
        </div>
      </div>
    );
  }

  const customizingItemAdditions = customizingItem ? getAdditionsForItem(customizingItem) : [];
  const custType = customizingItem ? getItemCustomizationType(customizingItem) : null;

  // Real-time price calculation for the customization modal
  const customizingItemSubtotal = (() => {
    if (!customizingItem) return 0;
    let extra = 0;
    if (custType === 'cocktail') {
      if (modalSize === 'large') extra += 15;
      COCKTAIL_ADDONS.forEach(a => { if (modalToppings.includes(a.value)) extra += a.price; });
    } else if (custType === 'milkshake') {
      if (modalSize === 'large') extra += 20;
      if (modalSize === 'xl') extra += 35;
      if (modalMilkBase === 'oat' || modalMilkBase === 'almond') extra += 10;
      MILKSHAKE_TOPPINGS.forEach(t => { if (modalToppings.includes(t.value)) extra += t.price; });
      MILKSHAKE_EXTRA_SHOTS.forEach(s => { if (modalExtraShots.includes(s.value)) extra += s.price; });
    } else {
      if (milk === 'oat' || milk === 'almond') extra += 15;
      extra += modalSelectedAdditions.reduce((s, a) => s + a.price, 0);
    }
    return (customizingItem.price + extra) * modalQuantity;
  })();

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

            const isCoffee = category.toLowerCase() === 'coffee' || category === 'قهوة';
            const isSweetCorner = category.toLowerCase().includes('sweet') || category.toLowerCase().includes('corner') || category === 'ركن الحلويات';

            // Sorting helper: price asc, name asc, coming_soon at the bottom
            const sortItems = (items: MenuItem[]) => {
              return [...items].sort((a, b) => {
                const aComing = a.tags?.includes('coming_soon');
                const bComing = b.tags?.includes('coming_soon');

                if (aComing && !bComing) return 1;
                if (!aComing && bComing) return -1;

                if (a.price !== b.price) {
                  return a.price - b.price;
                }
                return (a.nameEn || a.name || '').localeCompare(b.nameEn || b.name || '');
              });
            };

            // Sweet Corner sub-label helper
            const getSweetSubLabel = (nameEn: string, nameAr: string) => {
              const lowerEn = (nameEn || '').toLowerCase();
              const lowerAr = (nameAr || '').toLowerCase();
              if (lowerEn.includes('ice cream') || lowerAr.includes('ايس كريم')) return 'Ice Cream';
              if (lowerEn.includes('waffle') || lowerAr.includes('وافل')) return 'Waffles';
              if (lowerEn.includes('yogurt') || lowerAr.includes('زبادي')) return 'Yogurt';
              return 'Other';
            };

            // Active category items based on filters (Hot/Iced tabs for Coffee)
            const activeFilteredItems = isCoffee
              ? catItems.filter(i => {
                  const isHot = i.tags?.includes('hot');
                  const isIced = i.tags?.includes('iced');
                  if (coffeeTypeTab === 'hot') {
                    return isHot || (!isHot && !isIced);
                  } else {
                    return isIced;
                  }
                })
              : catItems;

            const sortedItems = sortItems(activeFilteredItems);

            const renderItemCard = (item: MenuItem) => {
              const isComingSoon = item.tags?.includes('coming_soon');
              return (
                <Card
                  key={item.id}
                  interactive={!isComingSoon}
                  padding="md"
                  className={`${styles.menuItem} ${isComingSoon ? styles.comingSoonItem : ''}`}
                  onClick={() => {
                    if (isComingSoon) return;
                    handleAddClick(item);
                  }}
                >
                  <div className={styles.itemImageWrap} style={{ position: 'relative' }}>
                    <Image
                      src={item.image || getItemImage(item.nameEn || item.name) || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop'}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                      className={styles.itemImage}
                    />
                    {isComingSoon && (
                      <div className={styles.comingSoonOverlay}>
                        <span>{language === 'ar' ? 'قريباً' : 'Coming Soon'}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.itemContent}>
                    <div>
                      <h4 className={styles.itemName}>{item.name}</h4>
                      <p className={styles.itemDesc}>{item.description}</p>
                      {item.tags && item.tags.filter(t => t !== 'coming_soon').length > 0 && (
                        <div className={styles.itemTags}>
                          {item.tags.filter(t => t !== 'coming_soon').map(t => (
                            <span key={t} className={styles.tag}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={styles.itemFooter}>
                      <span className={styles.itemPrice}>{Math.round(item.price)} EGP</span>
                      {isComingSoon ? (
                        <span className={styles.comingSoonText}>{language === 'ar' ? 'قريباً' : 'Coming Soon'}</span>
                      ) : item.available ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddClick(item);
                          }}
                        >
                          {t('add')}
                        </Button>
                      ) : (
                        <span className={styles.outOfStockBadge}>{t('out_of_stock')}</span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            };

            return (
              <section
                key={category}
                id={`category-${category}`}
                className={`${styles.categorySection} ${isHighlighted ? styles.categoryCardHighlight : ''}`}
              >
                <div className={styles.categoryHeader}>
                  <h2 className={styles.categoryTitle}>
                    {category}
                    <span className={styles.categoryCountBadge}>{catItems.length}</span>
                  </h2>
                  <p className={styles.categoryDesc}>
                    {getCategoryDescription(category)}
                  </p>

                  {/* Hot / Iced tab switcher for Coffee */}
                  {isCoffee && (
                    <div className={styles.coffeeTabs}>
                      <button
                        type="button"
                        className={`${styles.coffeeTab} ${coffeeTypeTab === 'hot' ? styles.coffeeTabActive : ''}`}
                        onClick={() => setCoffeeTypeTab('hot')}
                      >
                        {language === 'ar' ? 'ساخن' : 'Hot'}
                      </button>
                      <button
                        type="button"
                        className={`${styles.coffeeTab} ${coffeeTypeTab === 'iced' ? styles.coffeeTabActive : ''}`}
                        onClick={() => setCoffeeTypeTab('iced')}
                      >
                        {language === 'ar' ? 'بارد' : 'Iced'}
                      </button>
                    </div>
                  )}
                </div>

                {isSweetCorner ? (
                  <div className={styles.sweetCornerContainer}>
                    {[
                      { key: 'Ice Cream', labelEn: 'Ice Cream', labelAr: 'آيس كريم' },
                      { key: 'Waffles', labelEn: 'Waffles', labelAr: 'وافل' },
                      { key: 'Yogurt', labelEn: 'Yogurt', labelAr: 'زبادي' }
                    ].map((group) => {
                      const groupItems = sortItems(catItems.filter(i => getSweetSubLabel(i.nameEn || '', i.nameAr || '') === group.key));
                      if (groupItems.length === 0) return null;
                      return (
                        <div key={group.key} className={styles.sweetGroup}>
                          <h3 className={styles.sweetGroupTitle}>
                            {language === 'ar' ? group.labelAr : group.labelEn}
                          </h3>
                          <div className={styles.gridList}>
                            {groupItems.map(item => renderItemCard(item))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.gridList}>
                    {sortedItems.map(item => renderItemCard(item))}
                  </div>
                )}
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
            {t('request_check')}
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
                      <div className={styles.cartItemName}>{item.cartQuantity}x {item.name}</div>
                      {item.customizations && (
                        <div className={styles.cartItemOption}>{item.customizations}</div>
                      )}
                      {item.selectedAdditions && item.selectedAdditions.map(a => (
                        <div key={a.id} className={styles.cartItemOption}>
                          + {a.name} ({a.price.toFixed(2)} EGP)
                        </div>
                      ))}
                      <div className={styles.cartItemPrice}>
                        {(item.price * item.cartQuantity).toFixed(2)} EGP
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
            <Button className="w-full" onClick={submitOrder} loading={isSubmitting}>
              {t('confirm_order')}
            </Button>
          </div>
        )}
      </div>

      {/* ═══ Category-Aware Customization Modal / Bottom Drawer ═══ */}
      <BottomSheet
        isOpen={!!customizingItem}
        onClose={() => setCustomizingItem(null)}
        title="Customize"
      >
        {customizingItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Product Info Summary */}
            <div className={styles.modalItemHeader}>
              <div className={styles.modalItemImageWrap} style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden' }}>
                <Image
                  src={customizingItem.image || getItemImage(customizingItem.nameEn || customizingItem.name) || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop'}
                  alt={customizingItem.name}
                  fill
                  sizes="80px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div>
                <h3 className={styles.modalItemTitle}>{customizingItem.name}</h3>
                <p className={styles.modalItemDesc}>{customizingItem.description}</p>
                <p className={styles.modalItemPrice}>{customizingItem.price.toFixed(2)} EGP</p>
              </div>
            </div>

              {/* ──── COCKTAIL OPTIONS ──── */}
              {custType === 'cocktail' && (
                <>
                  {/* Size */}
                  <div className={styles.optionGroup}>
                    <span className={styles.optionLabel}>Size</span>
                    <div className={styles.optionGrid}>
                      {[
                        { label: 'Regular', value: 'regular', extra: '' },
                        { label: 'Large', value: 'large', extra: '+15 EGP' },
                      ].map(opt => (
                        <button key={opt.value} onClick={() => setModalSize(opt.value)}
                          className={`${styles.customizationPill} ${modalSize === opt.value ? styles.customizationPillActive : ''}`}>
                          <span>{opt.label}</span>
                          {opt.extra && <span className={styles.additionPrice}>{opt.extra}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Ice Level */}
                  <div className={styles.optionGroup}>
                    <span className={styles.optionLabel}>Ice Level</span>
                    <div className={styles.optionGrid}>
                      {[
                        { label: 'No Ice', value: 'none' },
                        { label: 'Light Ice', value: 'light' },
                        { label: 'Normal Ice', value: 'normal' },
                        { label: 'Extra Ice', value: 'extra' },
                      ].map(opt => (
                        <button key={opt.value} onClick={() => setModalIceLevel(opt.value)}
                          className={`${styles.customizationPill} ${modalIceLevel === opt.value ? styles.customizationPillActive : ''}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Sweetness % */}
                  <div className={styles.optionGroup}>
                    <span className={styles.optionLabel}>Sweetness Level</span>
                    <div className={styles.optionGrid}>
                      {[0, 25, 50, 75, 100].map(pct => (
                        <button key={pct} onClick={() => setModalSweetnessPct(pct)}
                          className={`${styles.customizationPill} ${modalSweetnessPct === pct ? styles.customizationPillActive : ''}`}>
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Add-ons */}
                  <div className={styles.optionGroup}>
                    <span className={styles.optionLabel}>Add-ons <span className={styles.optionLabelSub}>(+10 EGP each)</span></span>
                    <div className={styles.optionGrid}>
                      {COCKTAIL_ADDONS.map(addon => {
                        const selected = modalToppings.includes(addon.value);
                        return (
                          <button key={addon.value} onClick={() => setModalToppings(prev => selected ? prev.filter(v => v !== addon.value) : [...prev, addon.value])}
                            className={`${styles.customizationPill} ${selected ? styles.customizationPillActive : ''}`}>
                            <span>{addon.label}</span>
                            <span className={styles.additionPrice}>+{addon.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Special Instructions */}
                  <div className={styles.optionGroup}>
                    <span className={styles.optionLabel}>Special Instructions</span>
                    <div className={styles.specialInstructionsWrap}>
                      <textarea
                        className={styles.specialInstructionsInput}
                        value={modalSpecialInstructions}
                        onChange={e => setModalSpecialInstructions(e.target.value.slice(0, 100))}
                        placeholder="Any special requests?"
                        maxLength={100}
                        rows={2}
                      />
                      <span className={styles.charCounter}>{modalSpecialInstructions.length}/100</span>
                    </div>
                  </div>
                </>
              )}

              {/* ──── MILKSHAKE OPTIONS ──── */}
              {custType === 'milkshake' && (
                <>
                  {/* Size */}
                  <div className={styles.optionGroup}>
                    <span className={styles.optionLabel}>Size</span>
                    <div className={styles.optionGrid}>
                      {[
                        { label: 'Regular', value: 'regular', extra: '' },
                        { label: 'Large', value: 'large', extra: '+20 EGP' },
                        { label: 'XL', value: 'xl', extra: '+35 EGP' },
                      ].map(opt => (
                        <button key={opt.value} onClick={() => setModalSize(opt.value)}
                          className={`${styles.customizationPill} ${modalSize === opt.value ? styles.customizationPillActive : ''}`}>
                          <span>{opt.label}</span>
                          {opt.extra && <span className={styles.additionPrice}>{opt.extra}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Milk Base */}
                  <div className={styles.optionGroup}>
                    <span className={styles.optionLabel}>Milk Base</span>
                    <div className={styles.optionGrid}>
                      {[
                        { label: 'Whole Milk', value: 'whole', extra: '' },
                        { label: 'Oat Milk', value: 'oat', extra: '+10 EGP' },
                        { label: 'Almond Milk', value: 'almond', extra: '+10 EGP' },
                        { label: 'No Milk (Sorbet)', value: 'no_milk', extra: '' },
                      ].map(opt => (
                        <button key={opt.value} onClick={() => setModalMilkBase(opt.value)}
                          className={`${styles.customizationPill} ${modalMilkBase === opt.value ? styles.customizationPillActive : ''}`}>
                          <span>{opt.label}</span>
                          {opt.extra && <span className={styles.additionPrice}>{opt.extra}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Thickness */}
                  <div className={styles.optionGroup}>
                    <span className={styles.optionLabel}>Thickness</span>
                    <div className={styles.optionGrid}>
                      {['thin', 'medium', 'thick', 'extra thick'].map(val => (
                        <button key={val} onClick={() => setModalThickness(val)}
                          className={`${styles.customizationPill} ${modalThickness === val ? styles.customizationPillActive : ''}`}>
                          {val.charAt(0).toUpperCase() + val.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Toppings */}
                  <div className={styles.optionGroup}>
                    <span className={styles.optionLabel}>Toppings <span className={styles.optionLabelSub}>(+10 EGP each)</span></span>
                    <div className={styles.optionGrid}>
                      {MILKSHAKE_TOPPINGS.map(topping => {
                        const selected = modalToppings.includes(topping.value);
                        return (
                          <button key={topping.value} onClick={() => setModalToppings(prev => selected ? prev.filter(v => v !== topping.value) : [...prev, topping.value])}
                            className={`${styles.customizationPill} ${selected ? styles.customizationPillActive : ''}`}>
                            <span>{topping.label}</span>
                            <span className={styles.additionPrice}>+{topping.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Extra Shots */}
                  <div className={styles.optionGroup}>
                    <span className={styles.optionLabel}>Extra Shots <span className={styles.optionLabelSub}>(+15 EGP each)</span></span>
                    <div className={styles.optionGrid}>
                      {MILKSHAKE_EXTRA_SHOTS.map(shot => {
                        const selected = modalExtraShots.includes(shot.value);
                        return (
                          <button key={shot.value} onClick={() => setModalExtraShots(prev => selected ? prev.filter(v => v !== shot.value) : [...prev, shot.value])}
                            className={`${styles.customizationPill} ${selected ? styles.customizationPillActive : ''}`}>
                            <span>{shot.label}</span>
                            <span className={styles.additionPrice}>+{shot.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Temperature */}
                  <div className={styles.optionGroup}>
                    <span className={styles.optionLabel}>Temperature</span>
                    <div className={styles.optionGrid}>
                      {[
                        { label: 'Frozen', value: 'frozen' },
                        { label: 'Chilled', value: 'chilled' },
                      ].map(opt => (
                        <button key={opt.value} onClick={() => setModalTemperature(opt.value)}
                          className={`${styles.customizationPill} ${modalTemperature === opt.value ? styles.customizationPillActive : ''}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Special Instructions */}
                  <div className={styles.optionGroup}>
                    <span className={styles.optionLabel}>Special Instructions</span>
                    <div className={styles.specialInstructionsWrap}>
                      <textarea
                        className={styles.specialInstructionsInput}
                        value={modalSpecialInstructions}
                        onChange={e => setModalSpecialInstructions(e.target.value.slice(0, 100))}
                        placeholder="Any special requests?"
                        maxLength={100}
                        rows={2}
                      />
                      <span className={styles.charCounter}>{modalSpecialInstructions.length}/100</span>
                    </div>
                  </div>
                </>
              )}

              {/* ──── GENERIC ITEM OPTIONS (Coffee, Tea, etc.) ──── */}
              {custType === 'generic' && (
                <>
                  {(() => {
                    const cat = customizingItem.category.toLowerCase();
                    const tags = customizingItem.tags || [];
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
                                <button key={opt.value} onClick={() => setSweetness(opt.value as any)}
                                  className={`${styles.customizationPill} ${sweetness === opt.value ? styles.customizationPillActive : ''}`}>
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
                                <button key={opt.value} onClick={() => setMilk(opt.value as any)}
                                  className={`${styles.customizationPill} ${milk === opt.value ? styles.customizationPillActive : ''}`}>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  {customizingItemAdditions.length > 0 && (
                    <div className={styles.optionGroup}>
                      <span className={styles.optionLabel}>Compatible Additions</span>
                      <div className={styles.optionGrid}>
                        {customizingItemAdditions.map((add) => {
                          const isSelected = modalSelectedAdditions.some(a => a.id === add.id);
                          return (
                            <button key={add.id} onClick={() => toggleModalAddition(add)}
                              className={`${styles.customizationPill} ${isSelected ? styles.customizationPillActive : ''}`}>
                              <span>{add.name}</span>
                              <span className={styles.additionPrice}>+{add.price.toFixed(0)} EGP</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ──── Quantity Selector (all categories) ──── */}
              <div className={`${styles.optionGroup} ${styles.modalQuantityGroup}`}>
                <span className={`${styles.optionLabel} ${styles.modalQuantityLabel}`}>Quantity</span>
                <div className={styles.modalQuantityContainer}>
                  <button onClick={() => setModalQuantity(q => Math.max(1, q - 1))} className={styles.quantityBtn} aria-label="Decrease quantity">
                    <Minus size={14} />
                  </button>
                  <span className={styles.modalQuantityValue}>{modalQuantity}</span>
                  <button onClick={() => setModalQuantity(q => q + 1)} className={styles.quantityBtn} aria-label="Increase quantity">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

            {/* Sticky footer with live price */}
            <div className={styles.modalFooter} style={{ margin: '0 -20px -32px', borderTop: '1px solid var(--border-subtle)', padding: '16px 20px', backgroundColor: 'var(--surface)' }}>
              <div className={styles.modalPriceLine}>
                <span>{modalQuantity}x {customizingItem.name}</span>
                <span className={styles.modalLivePrice}>{customizingItemSubtotal.toFixed(2)} EGP</span>
              </div>
              <Button className="w-full" onClick={confirmCustomization}>
                Add to Order — {customizingItemSubtotal.toFixed(2)} EGP
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Premium Refactored Ice Cream Flavor Modal */}
      <BottomSheet
        isOpen={!!flavorModalItem}
        onClose={() => setFlavorModalItem(null)}
        title="Select Flavors"
      >
        {flavorModalItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className={styles.modalItemHeader}>
              <div className={styles.modalItemImageWrap} style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden' }}>
                <Image
                  src={flavorModalItem.image || getItemImage(flavorModalItem.nameEn || flavorModalItem.name) || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop'}
                  alt={flavorModalItem.name}
                  fill
                  sizes="80px"
                  style={{ objectFit: 'cover' }}
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

            <div className={styles.modalFooter} style={{ margin: '0 -20px -32px', borderTop: '1px solid var(--border-subtle)', padding: '16px 20px', backgroundColor: 'var(--surface)', display: 'flex', gap: '12px', flexDirection: 'row' }}>
              <Button variant="ghost" className="w-full" onClick={() => setFlavorModalItem(null)}>
                Cancel
              </Button>
              <Button className="w-full" onClick={addIceCreamToCart}>
                Confirm Flavors
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
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
