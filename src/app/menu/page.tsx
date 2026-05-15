'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import { useSearchParams } from 'next/navigation';
import { EVENTS } from '@/lib/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import { Sun, Moon, MapPin, Bell, ChevronLeft, ArrowRight, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { Button, Card, Tabs, ScrollReveal, FormInput, Textarea, Select, EmptyState, LoadingState } from '@/components';
import { useToast } from '@/contexts/ToastContext';

import { API_URL } from '@/lib/constants';
import { getItemImage } from '@/lib/itemImages';
import DrinkQuiz from '@/components/ui/DrinkQuiz';


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

// --- Internal Menu Component ---

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
  
  // Tabs
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [quizHighlight, setQuizHighlight] = useState<string>(''); // category deep-linked from quiz
  
  // Cart form state
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tip, setTip] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const table = searchParams.get('locationId');
    if (table) setTableId(table);

    // Fetch menu
    fetch(`${API_URL}/api/menu`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch menu');
        return res.json();
      })
      .then((data: any[]) => {
        // Flatten nested categories from backend into a flat list of items
        const allItems: MenuItem[] = data.flatMap((cat: any) => 
          cat.items.map((item: any) => ({
            ...item,
            name: language === 'ar' ? item.nameAr : item.nameEn,
            nameEn: item.nameEn, // always keep English for image lookup
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
        
        // Find first category that isn't Additions
        const categoryNames = [...new Set(enrichedData.filter((i: any) => !i.isAddition).map((i: any) => i.category))];

        // ── Quiz deep-link: auto-jump to the quiz-recommended category ──
        const quizCategory = searchParams.get('quiz_category');
        if (quizCategory) {
          // Try exact match first, then fuzzy (category starts-with)
          const matched = categoryNames.find(
            c => (c as string).toLowerCase() === quizCategory.toLowerCase()
          ) || categoryNames.find(
            c => (c as string).toLowerCase().startsWith(quizCategory.toLowerCase().split(' ')[0])
          );
          if (matched) {
            setActiveCategory(matched as string);
            setQuizHighlight(matched as string);
            // Scroll the category tab row into view smoothly
            setTimeout(() => {
              const el = document.getElementById(`cat-tab-${(matched as string).replace(/\s+/g, '-')}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }, 400);
            // Remove highlight after 3.5 s
            setTimeout(() => setQuizHighlight(''), 3500);
          } else if (categoryNames.length > 0) {
            setActiveCategory(categoryNames[0] as string);
          }
        } else if (categoryNames.length > 0) {
          setActiveCategory(categoryNames[0] as string);
        }
        
        setIsLoading(false);
      })
      .catch(() => {
        // Mock data for development if backend fails — uses real menu items for image preview
        const mockData: MenuItem[] = [
          // Frappe
          { id: '1', name: 'Frappe Vanilla', nameEn: 'Frappe Vanilla', description: 'Creamy vanilla frozen coffee', price: 110, image: null, category: 'Frappe', available: true },
          { id: '2', name: 'Frappe Caramel', nameEn: 'Frappe Caramel', description: 'Sweet caramel blended coffee', price: 110, image: null, category: 'Frappe', available: true },
          { id: '3', name: 'Frappe Mocha', nameEn: 'Frappe Mocha', description: 'Rich mocha blended coffee', price: 115, image: null, category: 'Frappe', available: true },
          { id: '4', name: 'Frappe Nutella', nameEn: 'Frappe Nutella', description: 'Hazelnut chocolate frozen coffee', price: 120, image: null, category: 'Frappe', available: true },
          { id: '5', name: 'Frappe Lotus', nameEn: 'Frappe Lotus', description: 'Lotus biscoff blended coffee', price: 120, image: null, category: 'Frappe', available: true },
          { id: '6', name: 'Frappe Pistachio', nameEn: 'Frappe Pistachio', description: 'Pistachio cream frozen coffee', price: 120, image: null, category: 'Frappe', available: true },
          { id: '7', name: 'Frappuccino Classic', nameEn: 'Frappuccino Classic', description: 'Classic coffee frappuccino', price: 110, image: null, category: 'Frappe', available: true },
          { id: '8', name: 'Frappuccino Flavor', nameEn: 'Frappuccino Flavor', description: 'Flavored frappuccino — ask for options', price: 120, image: null, category: 'Frappe', available: true },
          // Smoothies
          { id: '9', name: 'Kiwi Smoothie', nameEn: 'Kiwi Smoothie', description: 'Fresh kiwi blended smoothie', price: 100, image: null, category: 'Smoothie', available: true },
          { id: '10', name: 'Mango Smoothie', nameEn: 'Mango Smoothie', description: 'Tropical mango smoothie', price: 90, image: null, category: 'Smoothie', available: true },
          { id: '11', name: 'Strawberry Smoothie', nameEn: 'Strawberry Smoothie', description: 'Fresh strawberry blend', price: 90, image: null, category: 'Smoothie', available: true },
          { id: '12', name: 'Blue Lemon Smoothie', nameEn: 'Blue Lemon Smoothie', description: 'Refreshing blue lemon blend', price: 90, image: null, category: 'Smoothie', available: true },
          { id: '13', name: 'Watermelon Smoothie', nameEn: 'Watermelon Smoothie', description: 'Fresh watermelon blend', price: 90, image: null, category: 'Smoothie', available: true },
          { id: '14', name: 'Passion Fruit Smoothie', nameEn: 'Passion Fruit Smoothie', description: 'Exotic passion fruit blend', price: 105, image: null, category: 'Smoothie', available: true },
          // Tea
          { id: '15', name: 'Tea', nameEn: 'Tea', description: 'Classic hot tea', price: 30, image: null, category: 'Tea & Herbs', available: true },
          { id: '16', name: 'Karak Tea', nameEn: 'Karak Tea', description: 'Spiced milk tea', price: 60, image: null, category: 'Tea & Herbs', available: true },
          { id: '17', name: 'Green Tea', nameEn: 'Green Tea', description: 'Fresh green tea', price: 40, image: null, category: 'Tea & Herbs', available: true },
          { id: '18', name: 'Mint Tea', nameEn: 'Mint Tea', description: 'Refreshing mint tea', price: 40, image: null, category: 'Tea & Herbs', available: true },
          // Fresh Juice
          { id: '19', name: 'Mango Juice', nameEn: 'Mango Juice', description: 'Fresh squeezed mango', price: 95, image: null, category: 'Fresh Juice', available: true },
          { id: '20', name: 'Strawberry Juice', nameEn: 'Strawberry Juice', description: 'Fresh squeezed strawberry', price: 95, image: null, category: 'Fresh Juice', available: true },
          { id: '21', name: 'Orange Juice', nameEn: 'Orange Juice', description: 'Fresh squeezed orange', price: 95, image: null, category: 'Fresh Juice', available: true },
          { id: '22', name: 'Pomegranate Juice', nameEn: 'Pomegranate Juice', description: 'Fresh pomegranate juice', price: 85, image: null, category: 'Fresh Juice', available: true },
          { id: '23', name: 'Avocado Juice', nameEn: 'Avocado Juice', description: 'Creamy avocado blend', price: 120, image: null, category: 'Fresh Juice', available: true },
          // Waffles
          { id: '24', name: 'Nutella Waffle', nameEn: 'Nutella Waffle', description: 'Belgian waffle with Nutella', price: 85, image: null, category: 'Waffle Corner', available: true },
          { id: '25', name: 'Lotus Waffle', nameEn: 'Lotus Waffle', description: 'Belgian waffle with Lotus spread', price: 100, image: null, category: 'Waffle Corner', available: true },
          { id: '26', name: 'Pistachio Waffle', nameEn: 'Pistachio Waffle', description: 'Belgian waffle with pistachio cream', price: 100, image: null, category: 'Waffle Corner', available: true },
          // Yogurt
          { id: '27', name: 'Honey Yogurt', nameEn: 'Honey Yogurt', description: 'Greek yogurt with honey', price: 80, image: null, category: 'Yogurt Corner', available: true },
          { id: '28', name: 'Flavor Yogurt', nameEn: 'Flavor Yogurt', description: 'Flavored yogurt cup', price: 95, image: null, category: 'Yogurt Corner', available: true },
          // Ice Cream
          { id: '29', name: 'Ice Cream 2 Scoop', nameEn: 'Ice Cream 2 Scoop', description: 'Two scoops of premium ice cream', price: 50, image: null, category: 'Ice Cream', available: true },
          { id: '30', name: 'Ice Cream 3 Scoop', nameEn: 'Ice Cream 3 Scoop', description: 'Three scoops of premium ice cream', price: 75, image: null, category: 'Ice Cream', available: true },
        ];
        setMenuItems(mockData);
        // Quiz deep-link in fallback/mock mode
        const quizCategory = searchParams.get('quiz_category');
        if (quizCategory) {
          const matched = mockData.find(
            m => m.category.toLowerCase() === quizCategory.toLowerCase()
          )?.category || 'Frappe';
          setActiveCategory(matched);
          setQuizHighlight(matched);
          setTimeout(() => {
            const el = document.getElementById(`cat-tab-${matched.replace(/\s+/g, '-')}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }, 400);
          setTimeout(() => setQuizHighlight(''), 3500);
        } else {
          setActiveCategory('Frappe');
        }
        setIsLoading(false);

      });
  }, [searchParams, language]);

  // Listen for menu availability updates from inventory changes
  useSocketEvent<{id: string; available: boolean}[]>(EVENTS.MENU_AVAILABILITY, (items) => {
    setMenuItems(prev => prev.map(item => {
      const update = items.find(u => u.id === item.id);
      return update ? { ...item, available: update.available } : item;
    }));
  });

  // --- Actions ---
  const handleCallWaiter = async () => {
    if (!tableId) {
      addToast('Please scan a valid QR code first', 'error');
      return;
    }
    try {
      await fetch(`${API_URL}/api/waitercalls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId: tableId }),
      });
      addToast('Waiter has been called', 'success');
    } catch (err) {
      addToast('Failed to call waiter', 'error');
    }
  };

  const addToCart = (item: MenuItem, additions: MenuItem[] = []) => {
    if (!item.available) return;
    setCart((prev) => {
      const existingIndex = prev.findIndex((c) => 
        c.id === item.id && JSON.stringify(c.selectedAdditions) === JSON.stringify(additions)
      );
      if (existingIndex >= 0) {
        const newCart = [...prev];
        newCart[existingIndex].cartQuantity += 1;
        return newCart;
      }
      return [...prev, { ...item, cartQuantity: 1, selectedAdditions: additions }];
    });
    addToast(`${item.name} added to order`, 'success');
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const newCart = [...prev];
      const newQ = newCart[index].cartQuantity + delta;
      if (newQ > 0) newCart[index].cartQuantity = newQ;
      else newCart.splice(index, 1);
      return newCart;
    });
  };

  const submitOrder = async () => {
    if (cart.length === 0) return addToast('Your cart is empty', 'error');
    if (!tableId) return addToast('Please scan a valid QR code', 'error');
    if (!customerName.trim()) return addToast('Please enter your name', 'error');

    setIsSubmitting(true);
    
    // Flatten additions into order items if backend requires it, or pass as structured
    const items = cart.flatMap(c => {
      const base = { menuItemId: c.id, quantity: c.cartQuantity };
      const adds = (c.selectedAdditions || []).map(a => ({ menuItemId: a.id, quantity: c.cartQuantity }));
      return [base, ...adds];
    });

    const orderData = {
      tableOrRoomId: tableId,
      customerName,
      notes,
      paymentMethod: paymentMethod.toUpperCase(),
      items,
      tipAmount: tip
    };

    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: tableId,
          customerName,
          notes,
          paymentMethod: paymentMethod.toUpperCase(),
          items: items.map(i => ({ ...i, itemPriceAtTime: menuItems.find(m => m.id === i.menuItemId)?.price || 0 })),
          tipAmount: tip,
          subtotal,
          total,
        }),
      });
      if (!res.ok) throw new Error('Order failed');
      
      addToast('Order placed successfully! We are preparing it now.', 'success');
      setCart([]);
      setNotes('');
      setIsCartOpen(false);
      setTip(0);
    } catch (err) {
      addToast('Failed to place order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Computed ---
  const categories = [...new Set(menuItems.filter(i => !i.isAddition).map(i => i.category))];
  const additions = menuItems.filter(i => i.isAddition);
  const currentItems = menuItems.filter(i => i.category === activeCategory && !i.isAddition);

  const subtotal = cart.reduce((acc, item) => {
    const addsPrice = (item.selectedAdditions || []).reduce((sum, a) => sum + a.price, 0);
    return acc + (item.price + addsPrice) * item.cartQuantity;
  }, 0);
  const total = subtotal + tip;

  if (isLoading) return <LoadingState message={t('loading')} />;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* --- TOP BAR --- */}
      <header className="sticky top-0 z-40 bg-surface-elevated/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-black text-xl text-primary tracking-tight">Retro Spot</span>
            <div className="hidden sm:flex items-center ml-2 px-3 py-1 rounded-full bg-surface border border-border text-xs font-medium text-muted-foreground gap-1.5">
              <MapPin size={12} className="text-primary" />
              {tableId ? tableId : 'Guest'}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCallWaiter}
              className="px-3 py-1.5 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors text-sm font-bold flex items-center gap-1.5"
            >
              <Bell size={14} />
              <span className="hidden sm:inline">{t('call_waiter')}</span>
            </button>

            {mounted && (
              <>
                <button
                  onClick={toggleLanguage}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border-subtle text-xs font-bold text-muted hover:text-foreground transition-colors"
                >
                  {language === 'en' ? 'AR' : 'EN'}
                </button>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border-subtle text-muted hover:text-foreground transition-colors"
                >
                  {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                </button>
              </>
            )}
          </div>
        </div>
        {/* Mobile Location Badge (shown below header if screen too small for top) */}
        <div className="sm:hidden px-4 py-2 bg-surface flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground border-b border-border">
          <MapPin size={12} className="text-primary" />
          Location: {tableId ? tableId : 'Guest (Scan QR Code)'}
        </div>
      </header>

      {/* --- CONTENT --- */}
      <div className="px-4 py-4">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">

            {/* ── Quiz ── */}
            <div className="mb-8">
              <DrinkQuiz
                onSelectCategory={(cat) => {
                  setActiveCategory(cat);
                  setQuizHighlight(cat);
                  setTimeout(() => setQuizHighlight(''), 3500);
                }}
              />
            </div>

            {/* Category horizontal scroll */}
            <div id="menu-category-tabs" className="flex overflow-x-auto pb-4 gap-2 scrollbar-hide -mx-4 px-4 sticky top-[65px] z-30 bg-background/95 backdrop-blur">
              {categories.map(cat => {
                const isActive = activeCategory === cat;
                const isHighlighted = quizHighlight === cat;
                return (
                  <button
                    key={cat}
                    id={`cat-tab-${cat.replace(/\s+/g, '-')}`}
                    onClick={() => { setActiveCategory(cat); setQuizHighlight(''); }}
                    className={`relative whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 border ${
                      isActive
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-surface border-border text-muted-foreground hover:bg-surface-elevated'
                    } ${isHighlighted ? 'shadow-[0_0_0_3px_hsl(var(--color-accent)/0.5)] animate-pulse' : ''}`}
                  >
                    {isHighlighted && (
                      <span className="absolute -top-1.5 -right-1 text-[10px] bg-accent text-white font-black px-1.5 py-0.5 rounded-full leading-tight shadow-sm">
                        ✦ Pick
                      </span>
                    )}
                    {cat}
                  </button>
                );
              })}
              <button
                id="cat-tab-Additions"
                onClick={() => { setActiveCategory('Additions'); setQuizHighlight(''); }}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
                  activeCategory === 'Additions' 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-surface border-border text-muted-foreground hover:bg-surface-elevated'
                }`}
              >
                Additions
              </button>
            </div>

            {/* Grid */}
            {activeCategory !== 'Additions' ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-2">
                {currentItems.map((item, idx) => (
                  <ScrollReveal key={item.id} delay={idx * 0.05} direction="up" distance={20}>
                    <Card className={`h-full flex flex-col overflow-hidden border group ${!item.available ? 'opacity-60 border-border' : 'border-border-subtle shadow-sm hover:border-primary/30'}`}>

                      {/* Item Image */}
                      {(() => {
                        const imgSrc = getItemImage(item.nameEn || item.name, item.image);
                        return (
                          <div className="aspect-square bg-surface-elevated border-b border-border-subtle relative overflow-hidden">
                            {imgSrc ? (
                              <img
                                src={imgSrc}
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  // Fallback to gradient placeholder if image fails
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.style.background = 'linear-gradient(135deg, hsl(var(--color-primary)/0.15), hsl(var(--color-accent)/0.15))';
                                    parent.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%"><span style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;opacity:0.4">${item.name.slice(0,2).toUpperCase()}</span></div>`;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                                <span className="text-2xl font-black text-primary/30 uppercase">
                                  {item.name.slice(0, 2)}
                                </span>
                              </div>
                            )}
                            {!item.available && (
                              <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-[2px]">
                                <span className="bg-background text-foreground px-3 py-1 rounded-full text-xs font-bold shadow-md">Sold Out</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="p-3 flex flex-col flex-1">
                        <h3 className="font-bold text-sm sm:text-base leading-tight mb-1">{item.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{item.description}</p>
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border-subtle">
                          <span className="font-bold text-primary">{item.price} EGP</span>
                          <button
                            disabled={!item.available}
                            onClick={() => addToCart(item)}
                            className="w-8 h-8 rounded-full bg-surface-elevated hover:bg-primary hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
                            aria-label="Add to order"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              /* Additions View */
              <div className="space-y-4 mt-2">
                <div className="bg-primary/10 text-primary p-4 rounded-xl text-sm font-medium border border-primary/20">
                  Select an addition below, then choose which item from your cart to add it to, or add it as a standalone extra.
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {additions.map((item, idx) => (
                    <ScrollReveal key={item.id} delay={idx * 0.05}>
                      <Card className={`p-4 flex flex-col h-full ${!item.available ? 'opacity-60' : ''}`}>
                        <h3 className="font-bold text-sm mb-1">{item.name}</h3>
                        <p className="text-xs text-muted-foreground mb-3 flex-1">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">{item.price} EGP</span>
                          <button
                            disabled={!item.available}
                            onClick={() => addToCart(item)}
                            className="px-3 py-1.5 rounded-lg bg-surface-elevated text-xs font-bold hover:bg-primary hover:text-white transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </Card>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            )}
          </div>
      </div>

      {/* --- CART BOTTOM SHEET --- */}
      <AnimatePresence>
        {(cart.length > 0 || isCartOpen) && (
          <>
            {isCartOpen && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
                onClick={() => setIsCartOpen(false)}
              />
            )}
            
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: isCartOpen ? 0 : "calc(100% - 80px)" }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-50 rounded-t-3xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Mini Cart Bar (when collapsed) */}
              <div 
                className="h-[80px] px-6 flex items-center justify-between cursor-pointer hover:bg-surface-elevated transition-colors"
                onClick={() => setIsCartOpen(!isCartOpen)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-primary/30">
                    {cart.reduce((sum, item) => sum + item.cartQuantity, 0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Your Order</p>
                    <p className="font-black text-xl">{total.toFixed(2)} EGP</p>
                  </div>
                </div>
                <Button variant="outline" className="pointer-events-none">
                  {isCartOpen ? 'Close' : 'View Order'}
                </Button>
              </div>

              {/* Full Cart View */}
              <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 hide-scrollbar">
                <div className="space-y-4 mb-8">
                  {cart.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex items-start gap-4 p-4 bg-surface-elevated rounded-2xl border border-border">
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-foreground">{item.name}</h4>
                          <span className="font-bold">{item.price * item.cartQuantity} EGP</span>
                        </div>
                        {item.selectedAdditions && item.selectedAdditions.length > 0 && (
                          <div className="text-xs text-muted-foreground mb-3 flex flex-wrap gap-1">
                            {item.selectedAdditions.map((a, i) => (
                              <span key={i} className="bg-background px-2 py-0.5 rounded-md border border-border-subtle">
                                + {a.name} ({a.price})
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center bg-background rounded-lg border border-border">
                            <button onClick={() => updateQuantity(index, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-surface-elevated text-muted-foreground rounded-l-lg">-</button>
                            <span className="w-8 text-center font-bold text-sm">{item.cartQuantity}</span>
                            <button onClick={() => updateQuantity(index, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-surface-elevated text-muted-foreground rounded-r-lg">+</button>
                          </div>
                          <button onClick={() => removeFromCart(index)} className="p-2 text-danger/70 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-5">
                  <FormInput 
                    label="Your Name (Required for delivery)" 
                    value={customerName} 
                    onChange={e => setCustomerName(e.target.value)} 
                    placeholder="Enter your name"
                  />
                  <Textarea 
                    label="Order Notes (Optional)" 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    placeholder="E.g., Extra sugar, lactose intolerant..."
                    rows={2}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-muted-foreground mb-2">Payment</label>
                      <Select 
                        value={paymentMethod} 
                        onChange={e => setPaymentMethod(e.target.value)}
                        options={[
                          { value: 'cash', label: 'Cash' },
                          { value: 'visa', label: 'Visa (Card)' }
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-muted-foreground mb-2">Add Tip</label>
                      <Select 
                        value={tip.toString()} 
                        onChange={e => setTip(Number(e.target.value))}
                        options={[
                          { value: '0', label: 'No Tip' },
                          { value: '5', label: '5 EGP' },
                          { value: '10', label: '10 EGP' },
                          { value: '20', label: '20 EGP' },
                          { value: '30', label: '30 EGP' },
                          { value: '50', label: '50 EGP' }
                        ]}
                      />
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 mt-2 space-y-2">
                    <div className="flex justify-between text-muted-foreground text-sm">
                      <span>Subtotal</span>
                      <span>{subtotal.toFixed(2)} EGP</span>
                    </div>
                    {tip > 0 && (
                      <div className="flex justify-between text-muted-foreground text-sm">
                        <span>Tip</span>
                        <span>{tip.toFixed(2)} EGP</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-xl pt-2">
                      <span>Total</span>
                      <span className="text-primary">{total.toFixed(2)} EGP</span>
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/20"
                    onClick={submitOrder}
                    disabled={isSubmitting || !customerName.trim()}
                    loading={isSubmitting}
                  >
                    {isSubmitting ? 'Sending Order...' : 'Submit Order'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

// Ensure the page works with useSearchParams by wrapping in Suspense
export default function MenuPageWrapper() {
  return (
    <Suspense fallback={<LoadingState message="Loading menu..." />}>
      <MenuContent />
    </Suspense>
  );
}
