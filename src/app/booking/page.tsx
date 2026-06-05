'use client';

import React, { useState, useEffect, useMemo } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, Users, MapPin, CheckCircle2, Copy, Check, PartyPopper, Briefcase, BookOpen, Coffee, LayoutGrid, UserRound } from 'lucide-react';
import { Button, Card, FormInput, Textarea, UploadInput } from '@/components';
import { useToast } from '@/contexts/ToastContext';
import { API_URL } from '@/lib/constants';
import styles from './Booking.module.css';

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
  const { t, language, isRtl } = useLanguage();
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
      addToast(language === 'ar' ? 'الرجاء اختيار التاريخ والوقت بالكامل' : 'Please complete the date and time slots', 'warning');
      return false;
    }
    const start = new Date(`${formData.date}T${formData.startTime}`);
    const end = new Date(`${formData.date}T${formData.endTime}`);
    if (end.getTime() <= start.getTime()) {
      addToast(language === 'ar' ? 'وقت النهاية يجب أن يكون بعد وقت البداية' : 'End time must be after start time', 'warning');
      return false;
    }
    return true;
  };

  // --- SUBMIT ---
  const submitBooking = async () => {
    if (!formData.paymentMethod) {
      addToast(language === 'ar' ? 'اختار طريقة الدفع' : 'Please select a payment method', 'warning');
      return;
    }
    if (!formData.transactionImage) {
      addToast(language === 'ar' ? 'ارفع صورة التحويل للتأكيد' : 'Please upload transaction receipt', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('bookingType', formData.bookingType);
      data.append('eventPurpose', formData.eventPurpose);
      data.append('tableCount', String(formData.tableCount));
      data.append('peopleCount', String(formData.peopleCount));
      data.append('name', formData.name);
      data.append('contactNumber', formData.contactNumber);
      data.append('date', formData.date);
      data.append('startTime', formData.startTime);
      data.append('endTime', formData.endTime);
      data.append('notes', formData.notes);
      data.append('paymentMethod', formData.paymentMethod);
      data.append('totalPrice', String(calculatedPrices.total));
      data.append('depositPaid', String(calculatedPrices.deposit));
      data.append('tablesSelected', JSON.stringify(formData.bookingType === 'table' ? selectedTables : selectedRooms));

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

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      <main className="py-16">
        {/* Progress */}
        {step < 5 && (
          <div className={styles.progressContainer}>
            <div className={styles.progressLabelRow}>
              {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(i => (
                <div
                  key={i}
                  className={`${styles.stepLabel} ${step >= i ? styles.stepLabelActive : ''}`}
                >
                  {t('step') || 'Step'} {i}
                </div>
              ))}
            </div>
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>
        )}

        <>
          {/* ═══ STEP 1: TABLE or ROOM ═══ */}
          {step === 1 && (
            <div key="step-1" className={styles.stepWrapper}>
              <div className={styles.headerBlock}>
                <span className={styles.kicker}>
                  {isRtl ? 'حجز مساحة أو طاولة' : 'Reservations'}
                </span>
                <h1 className={styles.title}>{t('what_are_you_booking')}</h1>
                <p className={styles.subtitle}>{t('select_booking_type')}</p>
              </div>

              <div className={styles.bookingGrid}>
                {/* Table Booking */}
                <Card
                  interactive
                  onClick={() => { setFormData({ ...formData, bookingType: 'table' }); handleNext(); }}
                  className={styles.optionCard}
                >
                  <div className={styles.optionCardInner}>
                    <div className={styles.iconWrapper}>
                      <LayoutGrid size={28} />
                    </div>
                    <div>
                      <h3 className={styles.cardTitle}>{t('table_booking')}</h3>
                      <p className={styles.cardDesc}>{t('table_booking_desc')}</p>
                    </div>
                  </div>
                </Card>

                {/* Room Booking */}
                <Card
                  interactive
                  onClick={() => { setFormData({ ...formData, bookingType: 'room' }); handleNext(); }}
                  className={styles.optionCard}
                >
                  <div className={styles.optionCardInner}>
                    <div className={styles.iconWrapper}>
                      <MapPin size={28} />
                    </div>
                    <div>
                      <h3 className={styles.cardTitle}>{t('room_booking')}</h3>
                      <p className={styles.cardDesc}>{t('room_booking_desc')}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ═══ STEP 2: DETAILS (tables/people + purpose) ═══ */}
          {step === 2 && (
            <div key="step-2" className={styles.stepWrapper}>
              <div className={styles.headerBlock}>
                <span className={styles.kicker}>
                  {formData.bookingType === 'table' ? t('table_booking') : t('room_booking')}
                </span>
                <h1 className={styles.title}>{t('booking_details')}</h1>
                <p className={styles.subtitle}>{t('tell_us_more')}</p>
              </div>

              <Card padding="lg" className={styles.formCard}>
                {/* Table selection — only for table booking */}
                {formData.bookingType === 'table' && (
                  <div className={styles.formGroup}>
                    <label className="block text-xs uppercase tracking-widest font-bold text-accent mb-4">{t('select_your_tables')}</label>
                    <div className={styles.detailGrid}>
                      {TABLE_OPTIONS.map((tbl) => {
                        const isSelected = selectedTables.includes(tbl.id);
                        return (
                          <button
                            key={tbl.id}
                            type="button"
                            onClick={() => toggleTable(tbl.id)}
                            className={`${styles.selectionButton} ${isSelected ? styles.selectionButtonActive : ''}`}
                          >
                            {isSelected && (
                              <div className={styles.checkIndicator}>
                                <CheckCircle2 size={16} className="text-accent" />
                              </div>
                            )}
                            <div className={styles.circleIcon}>
                              <UserRound size={20} />
                            </div>
                            <span className={styles.buttonLabel}>
                              {t(tbl.label)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {selectedTables.length > 0 && (
                      <p className="mt-4 text-xs uppercase tracking-wider text-muted text-center font-bold">
                        {selectedTables.length} {selectedTables.length === 1 ? 'table' : 'tables'} · {formData.peopleCount} {language === 'ar' ? 'شخص' : 'people'}
                      </p>
                    )}
                  </div>
                )}

                {/* Room selection — only for room booking */}
                {formData.bookingType === 'room' && (
                  <div className={styles.formGroup}>
                    <label className="block text-xs uppercase tracking-widest font-bold text-accent mb-4">{t('select_your_room')}</label>
                    <div className={styles.detailGrid}>
                      {ROOM_OPTIONS.map((room) => {
                        const isSelected = selectedRooms.includes(room.id);
                        return (
                          <button
                            key={room.id}
                            type="button"
                            onClick={() => toggleRoom(room.id)}
                            className={`${styles.selectionButton} ${isSelected ? styles.selectionButtonActive : ''}`}
                          >
                            {isSelected && (
                              <div className={styles.checkIndicator}>
                                <CheckCircle2 size={16} className="text-accent" />
                              </div>
                            )}
                            <div className={styles.circleIcon}>
                              <Users size={20} />
                            </div>
                            <span className={styles.buttonLabel}>
                              {t(room.label)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {selectedRooms.length > 0 && (
                      <p className="mt-4 text-xs uppercase tracking-wider text-muted text-center font-bold">
                        {selectedRooms.length} {selectedRooms.length === 1 ? 'room' : 'rooms'} · {formData.peopleCount} {language === 'ar' ? 'شخص' : 'people'}
                      </p>
                    )}
                  </div>
                )}

                {/* Event Purpose */}
                <div className={`${styles.formGroup} ${styles.dividerTop}`}>
                  <label className="block text-xs uppercase tracking-widest font-bold text-accent mb-4">{t('event_purpose')}</label>
                  <div className={styles.purposeGrid}>
                    {EVENT_PURPOSES.map(purpose => {
                      const Icon = purpose.icon;
                      const selected = formData.eventPurpose === purpose.id;
                      return (
                        <button
                          key={purpose.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, eventPurpose: purpose.id })}
                          className={`${styles.purposeButton} ${selected ? styles.purposeButtonActive : ''}`}
                        >
                          <Icon size={20} className={selected ? 'text-accent' : 'text-muted'} />
                          <span className={styles.purposeLabel}>{t(purpose.translationKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>

              <div className={styles.controlsRow}>
                <Button variant="outline" onClick={handleBack} className={styles.flexButton}>{t('back')}</Button>
                <Button variant="filled" onClick={() => { if (validateStep2()) handleNext(); }} className={styles.flexButton}>{t('next')}</Button>
              </div>
            </div>
          )}

          {/* ═══ STEP 3: NAME, CONTACT, DATE ═══ */}
          {step === 3 && (
            <div key="step-3" className={styles.stepWrapper}>
              <div className={styles.headerBlock}>
                <span className={styles.kicker}>
                  {isRtl ? 'بيانات الحجز' : 'Details'}
                </span>
                <h1 className={styles.title}>{t('contact_and_date')}</h1>
                <p className={styles.subtitle}>{t('your_info_and_timing')}</p>
              </div>

              <Card padding="lg" className={styles.formCard}>
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

                <div className={styles.dividerTop} />

                <FormInput
                  label={t('date')}
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />

                <div className={styles.grid2}>
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

                <div className={styles.infoBox}>
                  <strong className={styles.infoBoxTitle}>{language === 'ar' ? 'ملاحظة:' : 'Note:'}</strong> {t('time_slot_note')}
                </div>

                <Textarea
                  label={t('notes_special_requests')}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={language === 'ar' ? 'مثلاً: محتاجين بروجكتور، أو حفلة مفاجأة!' : 'E.g., We need a projector, or it\'s a surprise party!'}
                  rows={3}
                />

                {calculatedPrices.total > 0 && (
                  <div className={styles.priceCard}>
                    <div>
                      <p className={styles.priceBlockTitle}>
                        {language === 'ar' ? 'التكلفة الإجمالية' : 'Estimated Total Cost'}
                      </p>
                      <p className={styles.priceValue}>
                        {calculatedPrices.total} <span className={styles.currency}>EGP</span>
                      </p>
                    </div>
                    <div>
                      <p className={styles.priceBlockTitle}>
                        {language === 'ar' ? 'المقدم المطلوب (50%)' : 'Required Deposit (50%)'}
                      </p>
                      <p className={styles.depositValue}>
                        {calculatedPrices.deposit} <span className={styles.depositCurrency}>EGP</span>
                      </p>
                    </div>
                  </div>
                )}
              </Card>

              <div className={styles.controlsRow}>
                <Button variant="outline" onClick={handleBack} className={styles.flexButton}>{t('back')}</Button>
                <Button variant="filled" onClick={() => { if (validateStep3()) handleNext(); }} className={styles.flexButton}>{t('next')}</Button>
              </div>
            </div>
          )}

          {/* ═══ STEP 4: PAYMENT ═══ */}
          {step === 4 && (
            <div key="step-4" className={styles.stepWrapper}>
              <div className={styles.headerBlock}>
                <span className={styles.kicker}>
                  {isRtl ? 'تأكيد الحجز والدفع' : 'Deposit'}
                </span>
                <h1 className={styles.title}>{t('payment')}</h1>
                <p className={styles.subtitle}>{t('secure_your_booking')}</p>
              </div>

              <div className={styles.paymentSwitcher}>
                {(['Instapay', 'Mobile wallet'] as PaymentMethod[]).map(method => (
                  <button
                    key={method}
                    onClick={() => setFormData({ ...formData, paymentMethod: method })}
                    className={`${styles.paymentTab} ${formData.paymentMethod === method ? styles.paymentTabActive : ''}`}
                  >
                    {t(method.toLowerCase().replace(' ', '_'))}
                  </button>
                ))}
              </div>

              <Card padding="lg" className={styles.formCard}>
                {calculatedPrices.deposit > 0 && (
                  <div className={styles.depositAlert}>
                    {language === 'ar' ? 'المبلغ المطلوب تحويله (المقدم):' : 'Deposit amount to transfer:'} {calculatedPrices.deposit} EGP
                  </div>
                )}
                
                {formData.paymentMethod === 'Instapay' && (
                  <div className={styles.formGroupLarge}>
                    <p className={styles.transferNotice}>
                      {t('transfer_via_instapay')}
                    </p>

                    <div className={styles.codePanel}>
                      <code className={styles.codeDisplay}>{config.instapayPhone}</code>
                      <button
                        onClick={() => copyToClipboard(config.instapayPhone)}
                        className={styles.copyButton}
                      >
                        {copied ? <Check size={18} className="text-accent" /> : <Copy size={18} />}
                      </button>
                    </div>

                    <div className={styles.dividerTop}>
                      <UploadInput
                        label={t('upload_transaction')}
                        onFileSelect={(file) => setFormData({ ...formData, transactionImage: file })}
                      />
                    </div>
                  </div>
                )}

                {formData.paymentMethod === 'Mobile wallet' && (
                  <div className={styles.formGroupLarge}>
                    <p className={styles.transferNotice}>
                      {t('transfer_via_wallet')}
                    </p>

                    <div className={styles.codePanel}>
                      <code className={styles.codeDisplay}>{config.mobileWalletPhone}</code>
                      <button
                        onClick={() => copyToClipboard(config.mobileWalletPhone)}
                        className={styles.copyButton}
                      >
                        {copied ? <Check size={18} className="text-accent" /> : <Copy size={18} />}
                      </button>
                    </div>

                    <div className={styles.dividerTop}>
                      <UploadInput
                        label={t('upload_transaction')}
                        onFileSelect={(file) => setFormData({ ...formData, transactionImage: file })}
                      />
                    </div>
                  </div>
                )}

                {!formData.paymentMethod && (
                  <div className={styles.emptyAlert}>
                    {t('select_payment_method')}
                  </div>
                )}
              </Card>

              <div className={styles.controlsRow}>
                <Button variant="outline" onClick={handleBack} className={styles.flexButton} disabled={isSubmitting}>{t('back')}</Button>
                <Button
                  variant="filled"
                  onClick={submitBooking}
                  className={styles.flexButton}
                  loading={isSubmitting}
                  disabled={!formData.paymentMethod}
                >
                  {t('confirm_booking')}
                </Button>
              </div>
            </div>
          )}

          {/* ═══ STEP 5: SUCCESS ═══ */}
          {step === 5 && (
            <div className={styles.successBlock}>
              <div className={styles.successIconCircle}>
                <CheckCircle2 size={40} />
              </div>
              
              <div>
                <h1 className={styles.title}>{t('booking_success')}</h1>
                <p className="text-xs text-muted uppercase tracking-widest mt-2">
                  {t('enjoy_event')} <span className="text-accent font-bold">{formData.bookingType === 'table' ? t('table_booking') : t('room_booking')}</span>!
                </p>
              </div>

              <div className={styles.btnGroup}>
                <Button
                  variant="filled"
                  size="lg"
                  className={styles.flexButton}
                  onClick={generatePDF}
                >
                  {t('download_summary')}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className={styles.flexButton}
                  onClick={() => window.location.href = '/'}
                >
                  {t('back_to_home')}
                </Button>
              </div>
            </div>
          )}
        </>
      </main>
    </div>
  );
}
