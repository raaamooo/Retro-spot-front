'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import { Sun, Moon, Calendar, Users, MapPin, CheckCircle2, Copy, Check, PartyPopper, Briefcase, BookOpen, Coffee, LayoutGrid } from 'lucide-react';
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

  useEffect(() => {
    setMounted(true);
    fetch(`${API_URL}/api/config`)
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => {});
  }, []);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  // --- Validation ---
  const validateStep2 = () => {
    if (formData.peopleCount < 1) {
      addToast(language === 'ar' ? 'عدد الأشخاص لازم يكون 1 على الأقل' : 'Number of people must be at least 1', 'warning');
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
      data.append('notes', noteParts.join(' | '));
      data.append('paymentMethod', formData.paymentMethod);
      data.append('status', 'pending');
      data.append('paymentStatus', 'pending_verification');
      data.append('totalPrice', '0');
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
          <span className="font-black text-xl text-primary tracking-tight">Retro Spot</span>
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
                  {/* Table count — only for table booking */}
                  {formData.bookingType === 'table' && (
                    <FormInput
                      label={t('how_many_tables')}
                      type="number"
                      value={formData.tableCount.toString()}
                      onChange={(e) => setFormData({ ...formData, tableCount: Math.min(6, Math.max(1, parseInt(e.target.value) || 1)) })}
                      required
                      min={1}
                      max={6}
                    />
                  )}

                  <FormInput
                    label={t('how_many_people')}
                    type="number"
                    value={formData.peopleCount.toString()}
                    onChange={(e) => setFormData({ ...formData, peopleCount: Math.max(1, parseInt(e.target.value) || 1) })}
                    required
                    min={1}
                  />

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
                  {formData.paymentMethod === 'Instapay' && (
                    <div className="space-y-6 animate-in fade-in flex flex-col items-center">
                      <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center border-4 border-primary">
                        <span className="text-black font-bold text-center p-4">QR Code Placeholder<br /><br />@owner_username</span>
                      </div>

                      <div className="w-full">
                        <label className="block text-sm font-bold text-muted-foreground mb-2 text-center">{t('or_transfer_to')}</label>
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
