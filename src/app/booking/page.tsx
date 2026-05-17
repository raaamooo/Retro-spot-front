'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Sun, Moon, Calendar, Users, MapPin, CheckCircle2, Copy, Check, PartyPopper, Briefcase, BookOpen, Coffee, LayoutGrid, UserRound } from 'lucide-react';
import { Button, Card, FormInput, Textarea, UploadInput } from '@/components';
import { useToast } from '@/contexts/ToastContext';
import { API_URL } from '@/lib/constants';

// --- Types ---
type BookingType = 'table' | 'room';
type EventPurpose = 'birthday_party' | 'work_meeting' | 'study_session' | 'hangout';
type PaymentMethod = 'Instapay' | 'Mobile wallet';

interface BookingFormData {
  bookingType: BookingType | '';
  eventPurpose: EventPurpose | '';
  tableCount: number;
  peopleCount: number;
  name: string;
  contactNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
  paymentMethod: PaymentMethod | '';
  transactionImage: File | null;
}

const EVENT_PURPOSES: { id: EventPurpose; icon: any; translationKey: string }[] = [
  { id: 'birthday_party', icon: PartyPopper, translationKey: 'birthday_party' },
  { id: 'work_meeting', icon: Briefcase, translationKey: 'work_meeting' },
  { id: 'study_session', icon: BookOpen, translationKey: 'study_session' },
  { id: 'hangout', icon: Coffee, translationKey: 'hangout' },
];

const TOTAL_STEPS = 4;

export default function BookingPage() {
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();
  const [mounted, setMounted] = useState(false);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [config, setConfig] = useState({
    instapayPhone: '01012345678',
    mobileWalletPhone: '01012345678',
    paymentProvider: 'instapay',
    table4Price: 0,
    table2Price: 0,
    room7Price: 0,
  });

  const [formData, setFormData] = useState<BookingFormData>({
    bookingType: '',
    eventPurpose: '',
    tableCount: 1,
    peopleCount: 1,
    name: '',
    contactNumber: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
    paymentMethod: '',
    transactionImage: null,
  });

  const [copied, setCopied] = useState(false);

  // Table selection: 2 tables for 4, 4 tables for 2
  const TABLE_OPTIONS = [
    { id: 'T4-1', label: 'table_for_4', seats: 4 },
    { id: 'T4-2', label: 'table_for_4', seats: 4 },
    { id: 'T2-1', label: 'table_for_2', seats: 2 },
    { id: 'T2-2', label: 'table_for_2', seats: 2 },
    { id: 'T2-3', label: 'table_for_2', seats: 2 },
    { id: 'T2-4', label: 'table_for_2', seats: 2 },
  ];
  const [selectedTables, setSelectedTables] = useState<string[]>([]);

  // Room selection: 1 room for 7
  const ROOM_OPTIONS = [
    { id: 'R7-1', label: 'room_for_7', seats: 7 },
  ];
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    fetch(`${API_URL}/api/config`)
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => {});
  }, []);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const calculatedPrices = useMemo(() => {
    if (!formData.date || !formData.startTime || !formData.endTime) return { total: 0, deposit: 0 };
    const start = new Date(`${formData.date}T${formData.startTime}`);
    const end = new Date(`${formData.date}T${formData.endTime}`);
    const diffHours = Math.ceil((end.getTime() - start.getTime()) / 3600000);
    
    if (diffHours <= 0) return { total: 0, deposit: 0 };

    let hourlyRate = 0;
    if (formData.bookingType === 'table') {
      const t4Count = selectedTables.filter(t => t.startsWith('T4')).length;
      const t2Count = selectedTables.filter(t => t.startsWith('T2')).length;
      hourlyRate = (t4Count * (config.table4Price || 0)) + (t2Count * (config.table2Price || 0));
    } else if (formData.bookingType === 'room') {
      const r7Count = selectedRooms.filter(r => r.startsWith('R7')).length;
      hourlyRate = (r7Count * (config.room7Price || 0));
    }
    
    const total = Math.ceil(diffHours * hourlyRate);
    const deposit = Math.ceil(total / 2);
    return { total, deposit };
  }, [formData.date, formData.startTime, formData.endTime, formData.bookingType, selectedTables, selectedRooms, config]);

  // --- Validation ---
  const toggleTable = (id: string) => {
    setSelectedTables(prev => {
      const next = prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id];
      // Auto-calculate people count
      const totalPeople = next.reduce((sum, tid) => {
        const tbl = TABLE_OPTIONS.find(t => t.id === tid);
        return sum + (tbl?.seats || 0);
      }, 0);
      setFormData(fd => ({ ...fd, tableCount: next.length, peopleCount: totalPeople || 1 }));
      return next;
    });
  };

  const toggleRoom = (id: string) => {
    setSelectedRooms(prev => {
      const next = prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id];
      // Auto-calculate people count
      const totalPeople = next.reduce((sum, rid) => {
        const room = ROOM_OPTIONS.find(r => r.id === rid);
        return sum + (room?.seats || 0);
      }, 0);
      // For rooms we don't necessarily update tableCount, but keeping it 0 or 1 is fine.
      setFormData(fd => ({ ...fd, peopleCount: totalPeople || 1 }));
      return next;
    });
  };

  const validateStep2 = () => {
    if (formData.bookingType === 'table' && selectedTables.length === 0) {
      addToast(language === 'ar' ? 'اختار طاولة واحدة على الأقل' : 'Please select at least one table', 'warning');
      return false;
    }
    if (formData.bookingType === 'room' && selectedRooms.length === 0) {
      addToast(language === 'ar' ? 'اختار غرفة واحدة على الأقل' : 'Please select at least one room', 'warning');
      return false;
    }
    if (!formData.eventPurpose) {
      addToast(language === 'ar' ? 'اختار الغرض من الحجز' : 'Please select an event purpose', 'warning');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.name.trim()) {
      addToast(language === 'ar' ? 'اكتب اسمك' : 'Please enter your name', 'warning');
      return false;
    }
    if (!formData.contactNumber.trim()) {
      addToast(language === 'ar' ? 'اكتب رقم التواصل' : 'Please enter your contact number', 'warning');
      return false;
    }
    if (!formData.date || !formData.startTime || !formData.endTime) {
      addToast(language === 'ar' ? 'املأ كل حقول التاريخ والوقت' : 'Please fill all date and time fields', 'warning');
      return false;
    }
    const start = new Date(`${formData.date}T${formData.startTime}`);
    const end = new Date(`${formData.date}T${formData.endTime}`);
    const now = new Date();
    if (start < new Date(now.getTime() + 30 * 60000)) {
      addToast(language === 'ar' ? 'وقت البداية لازم يكون بعد 30 دقيقة على الأقل' : 'Start time must be at least 30 minutes from now', 'error');
      return false;
    }
    if (end <= start) {
      addToast(language === 'ar' ? 'وقت النهاية لازم يكون بعد وقت البداية' : 'End time must be after start time', 'error');
      return false;
    }
    return true;
  };

  const submitBooking = async () => {
    if (!formData.paymentMethod) {
      addToast(language === 'ar' ? 'اختار طريقة الدفع' : 'Please select a payment method', 'warning');
      return;
    }
    if (!formData.transactionImage) {
      addToast(language === 'ar' ? 'ارفع صورة التحويل' : 'Please upload the transaction screenshot', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const purposeLabel = t(formData.eventPurpose);
      const eventType = formData.bookingType === 'table'
        ? `Table booking – ${purposeLabel}`
        : `Room booking – ${purposeLabel}`;

      const data = new FormData();
      data.append('eventType', eventType);
      data.append('date', formData.date);
      data.append('startTime', formData.startTime);
      data.append('endTime', formData.endTime);
      data.append('name', formData.name);
      data.append('peopleCount', formData.peopleCount.toString());
      const noteParts = [];
      if (formData.bookingType === 'table') noteParts.push(`Tables: ${formData.tableCount}`);
      noteParts.push(`Contact: ${formData.contactNumber}`);
      if (formData.notes.trim()) noteParts.push(formData.notes);
      noteParts.push(`Deposit to pay: ${calculatedPrices.deposit} EGP`);
      data.append('notes', noteParts.join(' | '));
      data.append('paymentMethod', formData.paymentMethod);
      data.append('status', 'pending');
      data.append('paymentStatus', 'pending_verification');
      data.append('totalPrice', calculatedPrices.total.toString());
      if (formData.transactionImage) {
        data.append('screenshot', formData.transactionImage);
      }

      const res = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        body: data,
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit booking');
      }
      setStep(5);
    } catch (err: any) {
      addToast(err.message || 'Failed to submit booking', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generatePDF = () => {
    const purposeLabel = t(formData.eventPurpose);
    const content = `
      RETRO SPOT BOOKING SUMMARY
      --------------------------
      Type: ${formData.bookingType === 'table' ? t('table_booking') : t('room_booking')}
      Purpose: ${purposeLabel}
      Name: ${formData.name}
      Contact: ${formData.contactNumber}${formData.bookingType === 'table' ? `\n      Tables: ${formData.tableCount}` : ''}
      People: ${formData.peopleCount}
      Date: ${formData.date}
      Time: ${formData.startTime} to ${formData.endTime}
      Total Price: ${calculatedPrices.total} EGP
      Deposit Paid: ${calculatedPrices.deposit} EGP
      Payment Method: ${formData.paymentMethod}
      Status: Pending Verification

      Thank you for choosing Retro Spot!
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RetroSpot_Booking_${formData.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const anim = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 bg-surface-elevated/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="px-4 h-16 flex items-center justify-between max-w-3xl mx-auto">
          <Link href="/" className="block transition-transform hover:scale-105">
            <img src="/logo.jpeg" alt="Retro Spot" className="w-10 h-10 rounded-full object-cover border-2 border-border shadow-sm" />
          </Link>
          <div className="flex items-center gap-2">
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
      </header>

      {/* MAIN */}
      <main className="flex-1 flex flex-col items-center p-4 sm:p-8">
        <div className="w-full max-w-2xl">

          {/* Progress */}
          {step < 5 && (
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(i => (
                  <div key={i} className={`text-xs font-bold ${step >= i ? 'text-primary' : 'text-muted-foreground'}`}>
                    {t('step') || 'Step'} {i}
                  </div>
                ))}
              </div>
              <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                />
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ═══ STEP 1: TABLE or ROOM ═══ */}
            {step === 1 && (
              <motion.div key="step1" {...anim} className="space-y-6">
                <h1 className="text-3xl font-bold mb-2">{t('what_are_you_booking')}</h1>
                <p className="text-muted-foreground mb-8">{t('select_booking_type')}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Table Booking */}
                  <Card
                    hoverable
                    onClick={() => { setFormData({ ...formData, bookingType: 'table' }); handleNext(); }}
                    className="p-8 cursor-pointer border-2 transition-all border-border-subtle hover:border-primary hover:bg-primary/5 group"
                  >
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <LayoutGrid size={32} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{t('table_booking')}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{t('table_booking_desc')}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Room Booking */}
                  <Card
                    hoverable
                    onClick={() => { setFormData({ ...formData, bookingType: 'room' }); handleNext(); }}
                    className="p-8 cursor-pointer border-2 transition-all border-border-subtle hover:border-primary hover:bg-primary/5 group"
                  >
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <MapPin size={32} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{t('room_booking')}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{t('room_booking_desc')}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* ═══ STEP 2: DETAILS (tables/people + purpose) ═══ */}
            {step === 2 && (
              <motion.div key="step2" {...anim} className="space-y-6">
                <h1 className="text-3xl font-bold mb-2">{t('booking_details')}</h1>
                <p className="text-muted-foreground mb-8">{t('tell_us_more')}</p>

                <Card className="p-6 space-y-6">
                  {/* Table selection — only for table booking */}
                  {formData.bookingType === 'table' && (
                    <div>
                      <label className="block text-sm font-bold text-muted-foreground mb-3">{t('select_your_tables')}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {TABLE_OPTIONS.map((tbl) => {
                          const isSelected = selectedTables.includes(tbl.id);
                          return (
                            <button
                              key={tbl.id}
                              type="button"
                              onClick={() => toggleTable(tbl.id)}
                              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                                  : 'border-border-subtle hover:border-primary/40 hover:bg-surface-elevated'
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <CheckCircle2 size={16} className="text-primary" />
                                </div>
                              )}
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isSelected ? 'bg-primary/20' : 'bg-surface-elevated'
                              }`}>
                                <UserRound size={20} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                              </div>
                              <span className={`font-semibold text-sm ${
                                isSelected ? 'text-primary' : 'text-foreground'
                              }`}>
                                {t(tbl.label)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {selectedTables.length > 0 && (
                        <p className="mt-3 text-sm text-muted-foreground text-center">
                          {selectedTables.length} {selectedTables.length === 1 ? 'table' : 'tables'} · {formData.peopleCount} {language === 'ar' ? 'شخص' : 'people'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Room selection — only for room booking */}
                  {formData.bookingType === 'room' && (
                    <div>
                      <label className="block text-sm font-bold text-muted-foreground mb-3">{t('select_your_room')}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {ROOM_OPTIONS.map((room) => {
                          const isSelected = selectedRooms.includes(room.id);
                          return (
                            <button
                              key={room.id}
                              type="button"
                              onClick={() => toggleRoom(room.id)}
                              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                                  : 'border-border-subtle hover:border-primary/40 hover:bg-surface-elevated'
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <CheckCircle2 size={16} className="text-primary" />
                                </div>
                              )}
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isSelected ? 'bg-primary/20' : 'bg-surface-elevated'
                              }`}>
                                <Users size={20} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                              </div>
                              <span className={`font-semibold text-sm ${
                                isSelected ? 'text-primary' : 'text-foreground'
                              }`}>
                                {t(room.label)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {selectedRooms.length > 0 && (
                        <p className="mt-3 text-sm text-muted-foreground text-center">
                          {selectedRooms.length} {selectedRooms.length === 1 ? 'room' : 'rooms'} · {formData.peopleCount} {language === 'ar' ? 'شخص' : 'people'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Event Purpose */}
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-3">{t('event_purpose')}</label>
                    <div className="grid grid-cols-2 gap-3">
                      {EVENT_PURPOSES.map(purpose => {
                        const Icon = purpose.icon;
                        const selected = formData.eventPurpose === purpose.id;
                        return (
                          <button
                            key={purpose.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, eventPurpose: purpose.id })}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-start ${
                              selected
                                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                : 'border-border-subtle hover:border-primary/40 hover:bg-surface-elevated'
                            }`}
                          >
                            <Icon size={22} className={selected ? 'text-primary' : 'text-muted-foreground'} />
                            <span className="font-semibold text-sm">{t(purpose.translationKey)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </Card>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={handleBack} className="flex-1">{t('back')}</Button>
                  <Button onClick={() => { if (validateStep2()) handleNext(); }} className="flex-1">{t('next')}</Button>
                </div>
              </motion.div>
            )}

            {/* ═══ STEP 3: NAME, CONTACT, DATE ═══ */}
            {step === 3 && (
              <motion.div key="step3" {...anim} className="space-y-6">
                <h1 className="text-3xl font-bold mb-2">{t('contact_and_date')}</h1>
                <p className="text-muted-foreground mb-8">{t('your_info_and_timing')}</p>

                <Card className="p-6 space-y-6">
                  <FormInput
                    label={t('your_name')}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder={language === 'ar' ? 'محمد أحمد' : 'John Doe'}
                  />

                  <FormInput
                    label={t('contact_number')}
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    required
                    placeholder="01xxxxxxxxx"
                  />

                  <hr className="border-border" />

                  <FormInput
                    label={t('date')}
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label={t('start_time')}
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                    <FormInput
                      label={t('end_time')}
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  </div>

                  <div className="bg-info-bg/50 border border-info/20 text-info p-4 rounded-lg text-sm">
                    <strong>{language === 'ar' ? 'ملاحظة:' : 'Note:'}</strong> {t('time_slot_note')}
                  </div>

                  <Textarea
                    label={t('notes_special_requests')}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={language === 'ar' ? 'مثلاً: محتاجين بروجكتور، أو حفلة مفاجأة!' : 'E.g., We need a projector, or it\'s a surprise party!'}
                    rows={3}
                  />

                  {calculatedPrices.total > 0 && (
                    <div className="bg-surface-elevated border border-border p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-1">
                          {language === 'ar' ? 'التكلفة الإجمالية' : 'Estimated Cost'}
                        </p>
                        <p className="text-2xl font-black">{calculatedPrices.total} EGP</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-1">
                          {language === 'ar' ? 'المقدم المطلوب (50%)' : 'Required Deposit (50%)'}
                        </p>
                        <p className="text-xl font-bold text-primary">{calculatedPrices.deposit} EGP</p>
                      </div>
                    </div>
                  )}
                </Card>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={handleBack} className="flex-1">{t('back')}</Button>
                  <Button onClick={() => { if (validateStep3()) handleNext(); }} className="flex-1">{t('next')}</Button>
                </div>
              </motion.div>
            )}

            {/* ═══ STEP 4: PAYMENT ═══ */}
            {step === 4 && (
              <motion.div key="step4" {...anim} className="space-y-6">
                <h1 className="text-3xl font-bold mb-2">{t('payment')}</h1>
                <p className="text-muted-foreground mb-8">{t('secure_your_booking')}</p>

                <div className="flex bg-surface-elevated p-1 rounded-xl border border-border mb-6">
                  {(['Instapay', 'Mobile wallet'] as PaymentMethod[]).map(method => (
                    <button
                      key={method}
                      onClick={() => setFormData({ ...formData, paymentMethod: method })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        formData.paymentMethod === method
                          ? 'bg-primary text-white shadow-md'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t(method.toLowerCase().replace(' ', '_'))}
                    </button>
                  ))}
                </div>

                <Card className="p-6">
                  {calculatedPrices.deposit > 0 && (
                    <div className="w-full mb-6 text-center bg-primary/10 text-primary py-3 rounded-lg font-bold border border-primary/20">
                      {language === 'ar' ? 'المبلغ المطلوب تحويله (المقدم):' : 'Deposit amount to transfer:'} {calculatedPrices.deposit} EGP
                    </div>
                  )}
                  {formData.paymentMethod === 'Instapay' && (
                    <div className="space-y-6 animate-in fade-in">
                      <p className="text-center text-muted-foreground">
                        {t('transfer_via_instapay')}
                      </p>

                      <div className="w-full">
                        <div className="flex items-center justify-center gap-2">
                          <code className="text-xl font-mono bg-surface-elevated px-4 py-2 rounded-lg">{config.instapayPhone}</code>
                          <button
                            onClick={() => copyToClipboard(config.instapayPhone)}
                            className="p-2 bg-secondary text-foreground rounded-lg hover:bg-accent hover:text-white transition-colors"
                          >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                          </button>
                        </div>
                      </div>

                      <div className="w-full pt-4 border-t border-border">
                        <UploadInput
                          label={t('upload_transaction')}
                          onFileSelect={(file) => setFormData({ ...formData, transactionImage: file })}
                        />
                      </div>
                    </div>
                  )}

                  {formData.paymentMethod === 'Mobile wallet' && (
                    <div className="space-y-6 animate-in fade-in">
                      <p className="text-center text-muted-foreground">
                        {t('transfer_via_wallet')}
                      </p>

                      <div className="w-full">
                        <div className="flex items-center justify-center gap-2">
                          <code className="text-xl font-mono bg-surface-elevated px-4 py-2 rounded-lg">{config.mobileWalletPhone}</code>
                          <button
                            onClick={() => copyToClipboard(config.mobileWalletPhone)}
                            className="p-2 bg-secondary text-foreground rounded-lg hover:bg-accent hover:text-white transition-colors"
                          >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                          </button>
                        </div>
                      </div>

                      <div className="w-full pt-4 border-t border-border">
                        <UploadInput
                          label={t('upload_transaction')}
                          onFileSelect={(file) => setFormData({ ...formData, transactionImage: file })}
                        />
                      </div>
                    </div>
                  )}

                  {!formData.paymentMethod && (
                    <div className="text-center py-8 text-muted-foreground">
                      {t('select_payment_method')}
                    </div>
                  )}
                </Card>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={handleBack} className="flex-1" disabled={isSubmitting}>{t('back')}</Button>
                  <Button
                    onClick={submitBooking}
                    className="flex-1 bg-success hover:bg-success/90"
                    loading={isSubmitting}
                    disabled={!formData.paymentMethod}
                  >
                    {t('confirm_booking')}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ═══ STEP 5: SUCCESS ═══ */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} />
                </div>
                <h1 className="text-3xl font-black mb-4">{t('booking_success')}</h1>
                <p className="text-xl text-muted-foreground mb-12">
                  {t('enjoy_event')} <span className="text-primary font-bold">{formData.bookingType === 'table' ? t('table_booking') : t('room_booking')}</span>!
                </p>

                <div className="space-y-4 max-w-sm mx-auto">
                  <Button
                    size="lg"
                    className="w-full rounded-xl"
                    onClick={generatePDF}
                  >
                    {t('download_summary')}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-xl"
                    onClick={() => window.location.href = '/'}
                  >
                    {t('back_to_home')}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
