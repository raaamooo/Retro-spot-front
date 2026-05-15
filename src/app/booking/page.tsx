'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import { EVENTS } from '@/lib/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import { Sun, Moon, Calendar, Users, MapPin, CheckCircle2, ChevronRight, ChevronLeft, CreditCard, Smartphone, Copy, Check } from 'lucide-react';
import { Button, Card, FormInput, Textarea, Select, UploadInput } from '@/components';
import { useToast } from '@/contexts/ToastContext';

import { API_URL } from '@/lib/constants';

// --- Types ---
type EventType = 'Birthday' | 'Room booking' | 'Table booking' | 'Workspace booking' | 'Custom event';
type PaymentMethod = 'Card' | 'Instapay' | 'Mobile wallet';

interface BookingFormData {
  eventType: EventType | '';
  date: string;
  startTime: string;
  endTime: string;
  name: string;
  peopleCount: number;
  notes: string;
  paymentMethod: PaymentMethod | '';
  transactionImage: File | null;
}

const EVENT_TYPES: { id: EventType; icon: any; translationKey: string }[] = [
  { id: 'Birthday', icon: Calendar, translationKey: 'birthday' },
  { id: 'Room booking', icon: MapPin, translationKey: 'room_booking' },
  { id: 'Table booking', icon: MapPin, translationKey: 'table_booking' },
  { id: 'Workspace booking', icon: Users, translationKey: 'workspace_booking' },
  { id: 'Custom event', icon: Calendar, translationKey: 'custom_event' },
];

export default function BookingPage() {
  const { t, language, toggleLanguage, isRtl } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // Wizard state
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [config, setConfig] = useState({
    instapayPhone: '01012345678',
    mobileWalletPhone: '01012345678',
    paymentProvider: 'instapay'
  });
  
  // Form state
  const [formData, setFormData] = useState<BookingFormData>({
    eventType: '',
    date: '',
    startTime: '',
    endTime: '',
    name: '',
    peopleCount: 1,
    notes: '',
    paymentMethod: '',
    transactionImage: null,
  });

  // UI state
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

  // --- Validation Logic ---
  const validateStep2 = () => {
    if (!formData.date || !formData.startTime || !formData.endTime) {
      addToast('Please fill all date and time fields', 'warning');
      return false;
    }
    const start = new Date(`${formData.date}T${formData.startTime}`);
    const end = new Date(`${formData.date}T${formData.endTime}`);
    const now = new Date();
    
    if (start < new Date(now.getTime() + 30 * 60000)) {
      addToast('Start time must be at least 30 minutes from now', 'error');
      return false;
    }
    if (end <= start) {
      addToast('End time must be after start time', 'error');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.name.trim()) {
      addToast('Please enter your name', 'warning');
      return false;
    }
    if (formData.peopleCount < 1) {
      addToast('Number of people must be at least 1', 'warning');
      return false;
    }
    return true;
  };

  const submitBooking = async () => {
    if (!formData.paymentMethod) {
      addToast('Please select a payment method', 'warning');
      return;
    }
    if (formData.paymentMethod !== 'Card' && !formData.transactionImage) {
      addToast('Please upload the transaction screenshot', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('eventType', formData.eventType);
      data.append('date', formData.date);
      data.append('startTime', formData.startTime);
      data.append('endTime', formData.endTime);
      data.append('name', formData.name);
      data.append('peopleCount', formData.peopleCount.toString());
      data.append('notes', formData.notes);
      data.append('paymentMethod', formData.paymentMethod);
      data.append('status', 'pending');
      data.append('paymentStatus', formData.paymentMethod === 'Card' ? 'pending' : 'pending_verification');
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

      setStep(5); // Success step
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
    // We generate a simple text blob representation as a fallback 
    // since we cannot rely on external PDF libraries in this environment.
    const content = `
      RETRO SPOT BOOKING SUMMARY
      --------------------------
      Event: ${formData.eventType}
      Name: ${formData.name}
      People: ${formData.peopleCount}
      Date: ${formData.date}
      Time: ${formData.startTime} to ${formData.endTime}
      Payment Method: ${formData.paymentMethod}
      Status: Confirmed / Pending Verification
      
      Thank you for choosing Retro Spot!
    `;
    const blob = new Blob([content], { type: 'text/plain' }); // Using txt for simplicity
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RetroSpot_Booking_${formData.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* --- TOP BAR --- */}
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

      {/* --- MAIN WIZARD --- */}
      <main className="flex-1 flex flex-col items-center p-4 sm:p-8">
        <div className="w-full max-w-2xl">
          
          {/* Progress Bar */}
          {step < 5 && (
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`text-xs font-bold ${step >= i ? 'text-primary' : 'text-muted-foreground'}`}>
                    Step {i}
                  </div>
                ))}
              </div>
              <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: EVENT TYPE */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h1 className="text-3xl font-bold mb-2">What are you booking?</h1>
                <p className="text-muted-foreground mb-8">Select the type of event or space you need.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {EVENT_TYPES.map(type => {
                    const Icon = type.icon;
                    return (
                      <Card
                        key={type.id}
                        hoverable
                        onClick={() => {
                          setFormData({ ...formData, eventType: type.id });
                          handleNext();
                        }}
                        className={`p-6 cursor-pointer border-2 transition-all ${
                          formData.eventType === type.id ? 'border-primary bg-primary/5' : 'border-border-subtle'
                        }`}
                      >
                        <Icon size={32} className={`mb-4 ${formData.eventType === type.id ? 'text-primary' : 'text-muted-foreground'}`} />
                        <h3 className="font-bold text-lg">{t(type.translationKey)}</h3>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2: DATE & TIME */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h1 className="text-3xl font-bold mb-2">When do you need it?</h1>
                <p className="text-muted-foreground mb-8">Choose your date and duration.</p>
                
                <Card className="p-6 space-y-6">
                  <FormInput
                    label="Date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="Start Time"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                    <FormInput
                      label="End Time"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="bg-info-bg/50 border border-info/20 text-info p-4 rounded-lg text-sm">
                    <strong>Note:</strong> Start time must be at least 30 minutes from now. Available slots are synced with our backend automatically.
                  </div>
                </Card>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                  <Button onClick={() => { if(validateStep2()) handleNext(); }} className="flex-1">Next</Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: EVENT DATA */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h1 className="text-3xl font-bold mb-2">Details</h1>
                <p className="text-muted-foreground mb-8">Tell us more about your booking.</p>
                
                <Card className="p-6 space-y-6">
                  <FormInput
                    label="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="John Doe"
                  />
                  
                  <FormInput
                    label="Number of people attending"
                    type="number"
                    value={formData.peopleCount.toString()}
                    onChange={(e) => setFormData({ ...formData, peopleCount: parseInt(e.target.value) || 1 })}
                    required
                    min={1}
                  />

                  <Textarea
                    label="Notes / Special Requests"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="E.g., We need a projector, or it's a surprise party!"
                    rows={4}
                  />
                </Card>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                  <Button onClick={() => { if(validateStep3()) handleNext(); }} className="flex-1">Next</Button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: PAYMENT */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h1 className="text-3xl font-bold mb-2">Payment</h1>
                <p className="text-muted-foreground mb-8">Secure your booking.</p>
                
                <div className="flex bg-surface-elevated p-1 rounded-xl border border-border mb-6">
                  {(['Card', 'Instapay', 'Mobile wallet'] as PaymentMethod[]).map(method => (
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
                  {formData.paymentMethod === 'Card' && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="bg-warning/10 text-warning p-3 rounded-lg text-sm mb-4">
                        <strong>Demo Mode:</strong> This is a placeholder for a real payment gateway (like Stripe or Paymob). Do not enter real card details.
                      </div>
                      <FormInput label="Card Number" placeholder="0000 0000 0000 0000" />
                      <div className="grid grid-cols-2 gap-4">
                        <FormInput label="Expiry Date" placeholder="MM/YY" />
                        <FormInput label="CVV" placeholder="123" />
                      </div>
                    </div>
                  )}

                  {formData.paymentMethod === 'Instapay' && (
                    <div className="space-y-6 animate-in fade-in flex flex-col items-center">
                      {/* TODO: Add QR code image here. Example: <img src="/instapay-qr.png" /> */}
                      <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center border-4 border-primary">
                        <span className="text-black font-bold text-center p-4">QR Code Placeholder<br/><br/>@owner_username</span>
                      </div>
                      
                      <div className="w-full">
                        <label className="block text-sm font-bold text-muted-foreground mb-2 text-center">Or transfer to this number</label>
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
                          label="Upload Transaction Screenshot" 
                          onFileSelect={(file) => setFormData({ ...formData, transactionImage: file })} 
                        />
                      </div>
                    </div>
                  )}

                  {formData.paymentMethod === 'Mobile wallet' && (
                    <div className="space-y-6 animate-in fade-in">
                      <p className="text-center text-muted-foreground">
                        Transfer via Vodafone Cash, Orange Cash, or e& Cash to the number below:
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
                          label="Upload Transaction Screenshot" 
                          onFileSelect={(file) => setFormData({ ...formData, transactionImage: file })} 
                        />
                      </div>
                    </div>
                  )}

                  {!formData.paymentMethod && (
                    <div className="text-center py-8 text-muted-foreground">
                      Please select a payment method above.
                    </div>
                  )}
                </Card>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={handleBack} className="flex-1" disabled={isSubmitting}>Back</Button>
                  <Button 
                    onClick={submitBooking} 
                    className="flex-1 bg-success hover:bg-success/90" 
                    loading={isSubmitting}
                    disabled={!formData.paymentMethod}
                  >
                    Confirm Booking
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: SUCCESS */}
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
                  {t('enjoy_event')} <span className="text-primary font-bold">{formData.eventType}</span>!
                </p>

                <div className="space-y-4 max-w-sm mx-auto">
                  <Button 
                    size="lg" 
                    className="w-full rounded-xl"
                    onClick={generatePDF}
                  >
                    Download Summary
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full rounded-xl"
                    onClick={() => window.location.href = '/'}
                  >
                    Back to Home
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
