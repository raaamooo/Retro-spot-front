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
  kicker: { en: 'Specialty Coffee • Crafted Workspace • Art Gallery', ar: 'القهوة • العمل • الفن' },
  gazette: { en: 'The Gazette', ar: 'الأخبار والأحداث' },

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
  gazette_desc: { en: 'Artisan workshops, music listings, and seasonal coffee updates from our baristas.', ar: 'كن على اطلاع دائم بآخر المستجدات.' },

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
  space_table_booking: { en: 'Space or Table Booking', ar: 'حجز مساحة أو طاولة' },
  deposit: { en: 'Deposit', ar: 'مبلغ الحجز' },
  copy: { en: 'Copy', ar: 'نسخ' },
  copied: { en: 'Copied!', ar: 'تم النسخ!' },

  // New Booking Flow
  what_are_you_booking: { en: 'What are you booking?', ar: 'إيه اللي عايز تحجزه؟' },
  select_booking_type: { en: 'Choose between table or room booking.', ar: 'اختار بين حجز طاولة أو حجز غرفة.' },
  table_booking_desc: { en: 'Book one or more tables for your group', ar: 'احجز طاولة أو أكتر لمجموعتك' },
  room_booking_desc: { en: 'Book a private room for your event', ar: 'احجز غرفة خاصة لفعاليتك' },
  booking_details: { en: 'Booking Details', ar: 'تفاصيل الحجز' },
  tell_us_more: { en: 'Tell us about your event.', ar: 'قولنا أكتر عن فعاليتك.' },
  how_many_tables: { en: 'How many tables?', ar: 'كام طاولة؟' },
  how_many_people: { en: 'How many people?', ar: 'كام شخص؟' },
  select_your_tables: { en: 'Select your tables', ar: 'اختار الطاولات' },
  select_your_room: { en: 'Select your room', ar: 'اختار الغرفة' },
  table_for_4: { en: 'Table for 4', ar: 'طاولة لـ 4' },
  table_for_2: { en: 'Table for 2', ar: 'طاولة لـ 2' },
  room_for_7: { en: 'Room for 7', ar: 'غرفة لـ 7' },
  selected: { en: 'Selected', ar: 'تم الاختيار' },
  event_purpose: { en: 'Event Purpose', ar: 'الغرض من الحجز' },
  birthday_party: { en: 'Birthday / Party', ar: 'عيد ميلاد / حفلة 🎂' },
  work_meeting: { en: 'Work Meeting', ar: 'اجتماع شغل 💼' },
  study_session: { en: 'Study Session', ar: 'جلسة مذاكرة 📚' },
  hangout: { en: 'Hangout', ar: 'قعدة مع الصحاب ☕' },
  contact_and_date: { en: 'Contact & Date', ar: 'البيانات والميعاد' },
  your_info_and_timing: { en: 'Your info and preferred timing.', ar: 'بياناتك والوقت المفضل.' },
  contact_number: { en: 'Contact Number', ar: 'رقم التواصل' },
  notes_special_requests: { en: 'Notes / Special Requests', ar: 'ملاحظات / طلبات خاصة' },
  secure_your_booking: { en: 'Secure your booking.', ar: 'أكد حجزك.' },
  select_payment_method: { en: 'Please select a payment method above.', ar: 'اختار طريقة الدفع من فوق.' },
  or_transfer_to: { en: 'Or transfer to this number', ar: 'أو حوّل على الرقم ده' },
  upload_transaction: { en: 'Upload Transaction Screenshot', ar: 'ارفع صورة التحويل' },
  transfer_via_instapay: { en: 'Transfer via Instapay to the number/address below:', ar: 'حوّل عن طريق إنستاباي على الرقم أو الحساب ده:' },
  transfer_via_wallet: { en: 'Transfer via mobile wallet to the number below:', ar: 'حول عن طريق المحفظة الإلكترونية' },
  download_summary: { en: 'Download Summary', ar: 'حمّل الملخص' },
  back_to_home: { en: 'Back to Home', ar: 'الرئيسية' },
  time_slot_note: { en: 'Start time must be at least 30 minutes from now. Available slots are synced automatically.', ar: 'وقت البداية لازم يكون بعد 30 دقيقة على الأقل من الوقت الحالي. المواعيد المتاحة بتتحدث تلقائياً.' },

  // Arts Flow specific
  weekly_bidding: { en: 'Weekly Bidding', ar: 'المزاد الأسبوعي' },
  highest_bid: { en: 'Current Highest Bid', ar: 'أعلى مزايدة حالية' },
  artist_submission: { en: 'Artist Submission', ar: 'تقديم الفنان' },
  painting_name: { en: 'Painting Name', ar: 'اسم اللوحة' },
  artist_name: { en: 'Artist Name', ar: 'اسم الفنان' },
  bid_amount: { en: 'Your Bid Amount', ar: 'قيمة مزايدتك' },
  the_exhibition: { en: 'The Exhibition', ar: 'المعرض الفني والأعمال الأسبوعية' },
  midnight_jazz_canvas: { en: 'Midnight Jazz Canvas', ar: 'صورة اللوحة' },
  bidding_ends_in: { en: 'Ends in 3 Days', ar: 'تنتهي خلال ٣ أيام' },
  for_the_artists: { en: 'For the Artists', ar: 'هل أنت فنان؟ شارك إبداعك' },
  submit_request: { en: 'Submit Request', ar: 'قدم الطلب' },
  ends_in_days: { en: 'Ends in {days} Days', ar: 'تنتهي خلال {days} أيام' },

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
  coming_soon: { en: 'Coming Soon', ar: 'قريباً' },
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

  // Menu Customization
  customize_drink: { en: 'Customize Drink', ar: 'تخصيص المشروب' },
  sweetness_level: { en: 'Sweetness Level', ar: 'مستوى الحلاوة' },
  standard_sweetness: { en: 'Standard Sweetness', ar: 'حلاوة عادية' },
  half_sugar: { en: 'Half Sugar', ar: 'نصف سكر' },
  no_sugar: { en: 'No Sugar', ar: 'بدون سكر' },
  milk_preferences: { en: 'Milk Preferences', ar: 'تفضيلات الحليب' },
  no_milk: { en: 'No Milk', ar: 'بدون حليب' },
  full_cream: { en: 'Full Cream', ar: 'حليب كامل الدسم' },
  oat_milk: { en: 'Oat Milk (+15 EGP)', ar: 'حليب شوفان (+١٥ ج.م)' },
  almond_milk: { en: 'Almond Milk (+15 EGP)', ar: 'حليب لوز (+١٥ ج.م)' },
  compatible_additions: { en: 'Compatible Additions', ar: 'إضافات متوافقة' },
  add_to_order: { en: 'Add to Order', ar: 'أضف للطلب' },
  select_flavors: { en: 'Select Flavors', ar: 'اختر النكهات' },
  confirm_flavors: { en: 'Confirm Flavors', ar: 'تأكيد النكهات' },
  ice_cream_flavors: { en: 'Ice Cream Flavors', ar: 'نكهات الآيس كريم' },
  item_added: { en: 'Item added to cart', ar: 'تم إضافة المنتج للسلة' },
  order_placed: { en: 'Order placed successfully!', ar: 'تم تقديم الطلب بنجاح!' },
  confirm_order: { en: 'Confirm Order', ar: 'تأكيد الطلب' },

  // Cart & Checkout
  view_cart: { en: 'View Cart', ar: 'عرض السلة' },
  your_order: { en: 'Your Order', ar: 'طلبك' },
  add: { en: 'Add', ar: 'أضف' },
  dining_option: { en: 'Dining Option', ar: 'خيار التناول' },
  dine_in: { en: 'Dine In (Eat Here)', ar: 'تناول بالمكان' },
  takeaway_pickup: { en: 'Takeaway (Pickup)', ar: 'طلب خارجي (استلام)' },
  customer_name_takeaway: { en: 'Your Name (Required for Takeaway)', ar: 'اسمك (مطلوب للطلب الخارجي)' },
  customer_name_optional: { en: 'Customer Name (Optional)', ar: 'اسم العميل (اختياري)' },
  order_notes: { en: 'Order Notes', ar: 'ملاحظات الطلب' },
  add_tip: { en: 'Add Tip for Service', ar: 'إضافة بقشيش للخدمة' },
  no_tip: { en: 'No Tip', ar: 'بدون بقشيش' },
  custom_tip: { en: 'Custom Tip Amount (EGP)', ar: 'مبلغ بقشيش مخصص (ج.م)' },
  cart_empty: { en: 'Cart is empty', ar: 'السلة فارغة' },
  cart_empty_desc: { en: 'Add some items from the menu', ar: 'أضف بعض المنتجات من القائمة' },
  out_of_stock_label: { en: 'Out of stock', ar: 'غير متوفر' },
  active_order: { en: 'You have an active order', ar: 'لديك طلب نشط' },
  request_check: { en: 'Request Check', ar: 'اطلب الحساب' },
  check_requested: { en: 'Check requested! Staff will be with you shortly.', ar: 'تم طلب الحساب! سيأتيك أحد الموظفين قريباً.' },

  // About / Story
  about_us: { en: 'Our Story', ar: 'قصتنا' },
  about_desc: { en: 'We are a unique space combining a cozy retro cafe with a productive workspace and an inspiring art gallery. Experience the perfect blend of nostalgia and creativity.', ar: 'نحن مساحة فريدة تجمع بين مقهى دافئ بتصميم كلاسيكي، ومساحة عمل مثمرة، ومعرض فني ملهم. اختبر المزيج المثالي بين الحنين والإبداع.' },
  coffee: { en: 'Specialty Coffee', ar: 'قهوة مختصة' },
  coffee_desc: { en: 'Specialty beans, expertly roasted.', ar: 'حبوب قهوة مختصة، محمصة بعناية.' },
  music: { en: 'Music & Vibes', ar: 'موسيقى وأجواء' },
  music_desc: { en: 'Curated playlists and vinyl records.', ar: 'أجواء موسيقية هادئة للعمل.' },
  art_gallery: { en: 'Art Gallery', ar: 'معرض فني' },
  art_gallery_desc: { en: 'Local art gallery and creative space.', ar: 'معرض فني محلي ومتجدد.' },
  ready_to_experience: { en: 'Ready to experience Retro Spot?', ar: 'جاهز لتجربة ريترو سبوت؟' },

  // Empty / Error states  
  no_results: { en: 'No results found', ar: 'لم يتم العثور على نتائج' },

  // Newsletter
  newsletter_coming_soon: { en: 'Newsletter coming soon! Stay tuned.', ar: 'النشرة الإخبارية قريباً! ترقبوا.' },
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
