'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Language = 'en' | 'ar';

/* ═══════════════════════════════════════════════════════════════
   Translation Dictionary
   ═══════════════════════════════════════════════════════════════ */
const translations: Record<string, { en: string; ar: string }> = {
  // Navigation
  home: { en: 'Home', ar: 'الرئيسية' },
  menu: { en: 'Menu', ar: 'القائمة' },
  booking: { en: 'Booking', ar: 'الحجز' },
  arts: { en: 'Arts', ar: 'الفنون' },
  admin: { en: 'Admin', ar: 'الإدارة' },

  // Homepage
  welcome: { en: 'Welcome to Retro Spot', ar: 'مرحبا بكم في ريترو سبوت' },
  subtitle: { en: 'Your cozy space for coffee, work, and art.', ar: 'مساحتك الدافئة للقهوة والعمل والفن.' },
  order_now: { en: 'Order Now', ar: 'اطلب الآن' },
  book_table: { en: 'Book a Table', ar: 'احجز طاولة' },

  // Menu
  add_to_cart: { en: 'Add to Cart', ar: 'أضف للسلة' },
  cart: { en: 'Cart', ar: 'السلة' },
  checkout: { en: 'Checkout', ar: 'إتمام الطلب' },
  submit_order: { en: 'Submit Order', ar: 'تأكيد الطلب' },
  your_name: { en: 'Your Name', ar: 'اسمك' },
  notes: { en: 'Notes', ar: 'ملاحظات' },
  payment_method: { en: 'Payment Method', ar: 'طريقة الدفع' },
  cash: { en: 'Cash', ar: 'نقدي' },
  visa: { en: 'Visa', ar: 'فيزا' },
  tip: { en: 'Tip', ar: 'بقشيش' },
  unavailable: { en: 'Unavailable', ar: 'غير متوفر' },
  search: { en: 'Search', ar: 'بحث' },
  all: { en: 'All', ar: 'الكل' },
  empty_cart: { en: 'Your cart is empty', ar: 'سلتك فارغة' },

  // Booking
  event_type: { en: 'Event Type', ar: 'نوع الفعالية' },
  people_count: { en: 'Number of People', ar: 'عدد الأشخاص' },
  date: { en: 'Date', ar: 'التاريخ' },
  start_time: { en: 'Start Time', ar: 'وقت البداية' },
  end_time: { en: 'End Time', ar: 'وقت النهاية' },
  total_price: { en: 'Total Price', ar: 'السعر الإجمالي' },
  confirm_booking: { en: 'Confirm Booking', ar: 'تأكيد الحجز' },

  // Arts
  submit_art: { en: 'Submit Artwork', ar: 'قدم عمل فني' },
  place_bid: { en: 'Place Bid', ar: 'قدم عرض' },
  artist: { en: 'Artist', ar: 'الفنان' },
  price: { en: 'Price', ar: 'السعر' },

  // Admin
  admin_dashboard: { en: 'Admin Dashboard', ar: 'لوحة التحكم' },
  barista: { en: 'Barista', ar: 'باريستا' },
  waiter: { en: 'Waiter', ar: 'ويتر' },
  cashier: { en: 'Cashier', ar: 'كاشير' },
  inventory: { en: 'Inventory', ar: 'المخزون' },
  manager: { en: 'Manager', ar: 'المدير' },
  organizer: { en: 'Organizer', ar: 'المنظم' },
  logout: { en: 'Logout', ar: 'تسجيل خروج' },
  login: { en: 'Login', ar: 'تسجيل دخول' },
  password: { en: 'Password', ar: 'كلمة المرور' },

  // Order status
  placed: { en: 'Placed', ar: 'تم الطلب' },
  preparing: { en: 'Preparing', ar: 'جاري التحضير' },
  ready: { en: 'Ready', ar: 'جاهز' },
  served: { en: 'Served', ar: 'تم التقديم' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  mark_ready: { en: 'Mark Ready', ar: 'تم التجهيز' },
  mark_served: { en: 'Mark Served', ar: 'تم التقديم' },
  mark_paid: { en: 'Mark Paid', ar: 'تم الدفع' },
  print_receipt: { en: 'Print Receipt', ar: 'طباعة الفاتورة' },

  // Inventory
  low_stock: { en: 'Low Stock', ar: 'مخزون منخفض' },
  in_stock: { en: 'In Stock', ar: 'متوفر' },
  adjust: { en: 'Adjust', ar: 'تعديل' },
  quantity: { en: 'Quantity', ar: 'الكمية' },
  unit: { en: 'Unit', ar: 'الوحدة' },

  // General
  save: { en: 'Save', ar: 'حفظ' },
  cancel: { en: 'Cancel', ar: 'إلغاء' },
  delete: { en: 'Delete', ar: 'حذف' },
  edit: { en: 'Edit', ar: 'تعديل' },
  close: { en: 'Close', ar: 'إغلاق' },
  confirm: { en: 'Confirm', ar: 'تأكيد' },
  loading: { en: 'Loading...', ar: 'جاري التحميل...' },
  no_data: { en: 'No data to display', ar: 'لا توجد بيانات' },
  error: { en: 'Something went wrong', ar: 'حدث خطأ ما' },
  retry: { en: 'Retry', ar: 'إعادة المحاولة' },
  total: { en: 'Total', ar: 'الإجمالي' },
  subtotal: { en: 'Subtotal', ar: 'المجموع الفرعي' },
  status: { en: 'Status', ar: 'الحالة' },
  actions: { en: 'Actions', ar: 'إجراءات' },
  name: { en: 'Name', ar: 'الاسم' },
  description: { en: 'Description', ar: 'الوصف' },
  download_pdf: { en: 'Download PDF', ar: 'تحميل PDF' },
  print: { en: 'Print', ar: 'طباعة' },
  call_waiter: { en: 'Call Waiter', ar: 'استدعاء الويتر' },
  no_pending_orders: { en: 'No pending orders', ar: 'لا توجد طلبات معلقة' },
  no_ready_orders: { en: 'No orders ready to serve', ar: 'لا توجد طلبات جاهزة للتقديم' },
  no_active_tables: { en: 'No active tables waiting for checkout', ar: 'لا توجد طاولات نشطة بانتظار الدفع' },
  generate_qr: { en: 'Generate QR Code', ar: 'إنشاء كود QR' },
  table_room: { en: 'Table / Room', ar: 'طاولة / غرفة' },
  order_for: { en: 'Order for', ar: 'طلب لـ' },
  serve_to: { en: 'Serve to', ar: 'تقديم إلى' },
  billing: { en: 'Billing', ar: 'الفاتورة' },
  awaiting_payment: { en: 'Awaiting Payment', ar: 'بانتظار الدفع' },
  total_due: { en: 'Total Due', ar: 'المبلغ المطلوب' },

  // News
  news: { en: 'News', ar: 'أخبار' },
  new_item: { en: 'New Item', ar: 'منتج جديد' },
  event: { en: 'Event', ar: 'فعالية' },
  discount: { en: 'Discount', ar: 'خصم' },
  announcement: { en: 'Announcement', ar: 'إعلان' },

  // Misc
  play_with_us: { en: 'Play With Us', ar: 'العب معنا' },
  upload: { en: 'Upload', ar: 'رفع' },
  browse_files: { en: 'Browse files', ar: 'تصفح الملفات' },
  or_drag: { en: 'or drag and drop', ar: 'أو اسحب وأفلت' },
  pending: { en: 'Pending', ar: 'معلق' },
  active: { en: 'Active', ar: 'نشط' },
  resolved: { en: 'Resolved', ar: 'تم الحل' },

  // Homepage specific
  latest_news: { en: 'Latest News', ar: 'آخر الأخبار' },
  no_news: { en: 'No news at the moment.', ar: 'لا توجد أخبار في الوقت الحالي.' },
  find_us: { en: 'Find Us', ar: 'موقعنا' },
  our_location: { en: 'Our Location', ar: 'موقعنا الجغرافي' },
  our_story: { en: 'Our Story', ar: 'قصتنا' },
  story_text: { en: 'We are a unique space combining a cozy retro cafe with a productive workspace and an inspiring art gallery. Experience the perfect blend of nostalgia and creativity.', ar: 'نحن مساحة فريدة تجمع بين مقهى دافئ بتصميم كلاسيكي، ومساحة عمل مثمرة، ومعرض فني ملهم. اختبر المزيج المثالي بين الحنين والإبداع.' },

  // Footer
  follow_us: { en: 'Follow Us', ar: 'تابعنا' },
  contact_info: { en: 'Contact Info', ar: 'معلومات التواصل' },
  opening_hours: { en: 'Opening Hours', ar: 'ساعات العمل' },
  address: { en: 'Address', ar: 'العنوان' },

  // Booking Flow specific
  birthday: { en: 'Birthday', ar: 'عيد ميلاد' },
  room_booking: { en: 'Room Booking', ar: 'حجز غرفة' },
  table_booking: { en: 'Table Booking', ar: 'حجز طاولة' },
  workspace_booking: { en: 'Workspace Booking', ar: 'حجز مساحة عمل' },
  custom_event: { en: 'Custom Event', ar: 'فعالية خاصة' },
  card: { en: 'Card', ar: 'بطاقة' },
  instapay: { en: 'Instapay', ar: 'إنستاباي' },
  mobile_wallet: { en: 'Mobile Wallet', ar: 'محفظة إلكترونية' },
  upload_screenshot: { en: 'Upload Screenshot', ar: 'رفع صورة التحويل' },
  phone_number: { en: 'Phone Number', ar: 'رقم الهاتف' },
  card_details: { en: 'Card Details', ar: 'تفاصيل البطاقة' },
  next: { en: 'Next', ar: 'التالي' },
  back: { en: 'Back', ar: 'رجوع' },
  submit_booking: { en: 'Submit Booking', ar: 'تأكيد الحجز' },
  booking_success: { en: 'Booking Confirmed!', ar: 'تم تأكيد الحجز!' },
  enjoy_event: { en: 'Thank you for choosing Retro, enjoy your', ar: 'شكراً لاختيارك ريترو، استمتع بـ' },
  copy: { en: 'Copy', ar: 'نسخ' },
  copied: { en: 'Copied!', ar: 'تم النسخ!' },

  // Arts Flow specific
  weekly_bidding: { en: 'Weekly Bidding', ar: 'المزاد الأسبوعي' },
  highest_bid: { en: 'Current Highest Bid', ar: 'أعلى مزايدة حالية' },
  artist_submission: { en: 'Artist Submission', ar: 'تقديم الفنان' },
  painting_name: { en: 'Painting Name', ar: 'اسم اللوحة' },
  artist_name: { en: 'Artist Name', ar: 'اسم الفنان' },
  bid_amount: { en: 'Your Bid Amount', ar: 'قيمة مزايدتك' },

  // Admin Flow specific
  new: { en: 'New', ar: 'جديد' },
  start_preparing: { en: 'Start Preparing', ar: 'ابدأ التحضير' },
  send_to_waiter: { en: 'Send to Waiter', ar: 'أرسل للويتر' },
  customer: { en: 'Customer', ar: 'العميل' },
  location: { en: 'Location', ar: 'المكان' },
  payment: { en: 'Payment', ar: 'الدفع' },
  ready_orders: { en: 'Ready to Serve', ar: 'جاهز للتقديم' },
  waiter_calls: { en: 'Active Calls', ar: 'نداءات نشطة' },
  mark_delivered: { en: 'Mark Delivered', ar: 'تم التوصيل' },
  mark_handled: { en: 'Dismiss Call', ar: 'إنهاء النداء' },
  call_from: { en: 'Call from', ar: 'نداء من' },
  empty_table: { en: 'Empty Table', ar: 'طاولة فارغة' },
  mark_done: { en: 'Mark Done', ar: 'إنهاء الحساب' },
  ingredients: { en: 'Ingredients', ar: 'المكونات' },
  categories: { en: 'Categories', ar: 'الأقسام' },
  menu_items: { en: 'Menu Items', ar: 'عناصر القائمة' },
  recipes: { en: 'Recipes', ar: 'الوصفات' },
  additions: { en: 'Additions', ar: 'الإضافات' },
  out_of_stock: { en: 'Out of Stock', ar: 'نفذت الكمية' },
  accounting: { en: 'Accounting', ar: 'الحسابات' },
  orders: { en: 'Orders', ar: 'الطلبات' },
  workers: { en: 'Workers', ar: 'العمال' },
  qr_generator: { en: 'QR Generator', ar: 'مولد رمز QR' },
  revenue: { en: 'Revenue', ar: 'الإيرادات' },
  tips: { en: 'Tips', ar: 'الإكراميات' },
  archive: { en: 'Archive', ar: 'أرشفة' },
  print_qr: { en: 'Print QR Code', ar: 'طباعة رمز QR' },
  bookings: { en: 'Bookings', ar: 'الحجوزات' },
  arts_bidding: { en: 'Arts Bidding', ar: 'مزادات الفنون' },
  artist_submissions: { en: 'Artist Submissions', ar: 'تقديمات الفنانين' },
  verify_payment: { en: 'Verify Payment', ar: 'تأكيد الدفع' },
  end_bid: { en: 'End Bid', ar: 'إنهاء المزاد' },
};

/* ═══════════════════════════════════════════════════════════════
   Context
   ═══════════════════════════════════════════════════════════════ */
interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('retro_lang') as Language | null;
    if (saved === 'en' || saved === 'ar') {
      setLanguageState(saved);
    }
    setHydrated(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('retro_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, []);

  // Sync dir/lang on initial hydration
  useEffect(() => {
    if (hydrated) {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [hydrated, language]);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  }, [language, setLanguage]);

  const t = useCallback(
    (key: string) => translations[key]?.[language] ?? key,
    [language]
  );

  const isRtl = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
