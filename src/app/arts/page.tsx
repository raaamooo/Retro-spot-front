'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { ImageIcon, Copy, Check, UploadCloud, Heart, Clock, CheckCircle2 } from 'lucide-react';
import { Button, Card, FormInput, Textarea, UploadInput } from '@/components';
import { useToast } from '@/contexts/ToastContext';
import { API_URL } from '@/lib/constants';

type PaymentMethod = 'Card' | 'Instapay' | 'Mobile wallet';

export default function ArtsPage() {
  const { t, language, isRtl } = useLanguage();
  const { addToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState({
    instapayPhone: '01012345678',
    mobileWalletPhone: '01012345678',
    paymentProvider: 'instapay'
  });
  
  useEffect(() => {
    setMounted(true);
    fetch(`${API_URL}/api/config`)
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => {});
  }, []);

  const [bidForm, setBidForm] = useState({ name: '', contact: '', amount: '', paymentMethod: '' as PaymentMethod | '', transactionImage: null as File | null });
  const [artistForm, setArtistForm] = useState({ name: '', contact: '', paintingName: '', description: '', price: '', photo: null as File | null });
  const [weeklyPainting, setWeeklyPainting] = useState({ name: 'Midnight Jazz', artist: 'Amira F.', description: 'A vibrant abstract piece capturing the essence of our Friday jazz nights.' });
  const [currentHighestBid, setCurrentHighestBid] = useState(1500);
  const [bidStep, setBidStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [isSubmittingArtist, setIsSubmittingArtist] = useState(false);
  const [artistSuccess, setArtistSuccess] = useState(false);

  const handleBidNext = () => setBidStep(2);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- BID LOGIC ---
  const submitBid = async () => {
    if (!bidForm.paymentMethod) {
      addToast('Please select a payment method', 'warning');
      return;
    }
    if (bidForm.paymentMethod !== 'Card' && !bidForm.transactionImage) {
      addToast('Please upload the transaction screenshot', 'warning');
      return;
    }

    setIsSubmittingBid(true);
    try {
      const artId = 'weekly-art-id';
      const data = new FormData();
      data.append('bidderName', bidForm.name);
      data.append('bidderContact', bidForm.contact);
      data.append('bidAmount', bidForm.amount);
      data.append('paymentMethod', bidForm.paymentMethod);
      if (bidForm.transactionImage) {
        data.append('screenshot', bidForm.transactionImage);
      }

      const res = await fetch(`${API_URL}/api/arts/${artId}/bids`, {
        method: 'POST',
        body: data,
      });
      if (!res.ok) throw new Error('Bid failed');

      setCurrentHighestBid(Number(bidForm.amount));
      setBidStep(3);
    } catch (err) {
      addToast('Failed to place bid', 'error');
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const generateBidPDF = () => {
    addToast('Receipt downloaded successfully', 'success');
  };

  // --- ARTIST SUBMISSION LOGIC ---
  const submitArtistRequest = async () => {
    if (!artistForm.name || !artistForm.paintingName || !artistForm.photo || !artistForm.price) {
      addToast('Please fill required fields and upload photo', 'warning');
      return;
    }

    setIsSubmittingArtist(true);
    try {
      const data = new FormData();
      data.append('titleEn', artistForm.paintingName);
      data.append('titleAr', artistForm.paintingName);
      data.append('artistName', artistForm.name);
      data.append('descriptionEn', artistForm.description);
      data.append('price', artistForm.price);
      data.append('contactInfo', artistForm.contact);
      data.append('status', 'submitted');
      if (artistForm.photo) {
        data.append('photo', artistForm.photo);
      }

      const res = await fetch(`${API_URL}/api/arts`, {
        method: 'POST',
        body: data,
      });
      
      if (res.ok) {
        setArtistSuccess(true);
        setArtistForm({ name: '', contact: '', paintingName: '', description: '', price: '', photo: null });
      } else {
        throw new Error('Submit failed');
      }
    } catch (err) {
      addToast('Failed to submit request', 'error');
    } finally {
      setIsSubmittingArtist(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 px-4 sm:px-8 py-12 max-w-4xl mx-auto w-full space-y-20">
        
        {/* =========================================
            SECTION 1: WEEKLY BIDDING 
            ========================================= */}
        <section className="space-y-8">
          <div className="flex flex-col space-y-2 border-b border-border/20 pb-4">
            <span className="text-xs uppercase tracking-widest text-accent font-bold">
              {isRtl ? 'المعرض الفني والأعمال الأسبوعية' : 'The Exhibition'}
            </span>
            <div className="flex items-center gap-3">
              <Heart size={24} className="text-accent shrink-0" />
              <h2 className="text-4xl md:text-5xl font-display font-light text-foreground">{t('weekly_bidding')}</h2>
            </div>
          </div>

          <Card className="overflow-hidden border border-border bg-surface rounded-sm">
            <div className="grid md:grid-cols-12">
              {/* Photo Display with Amber Multiply blend tint */}
              <div className="md:col-span-5 bg-surface-elevated aspect-square md:aspect-auto flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border relative p-8">
                <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
                <ImageIcon size={48} className="text-accent/50 mb-3" />
                <span className="text-xs text-muted uppercase tracking-widest font-semibold">{isRtl ? 'صورة اللوحة' : 'Midnight Jazz Canvas'}</span>
                <div className="absolute top-4 left-4 bg-accent text-[#2C1A0E] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm flex items-center gap-1.5 shadow-sm">
                  <Clock size={12} /> {isRtl ? 'تنتهي خلال ٣ أيام' : 'Ends in 3 Days'}
                </div>
              </div>

              {/* Bidding Information */}
              <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-3xl font-display font-light text-foreground mb-1">{weeklyPainting.name}</h3>
                  <p className="text-sm font-semibold tracking-wider uppercase text-accent mb-6">by {weeklyPainting.artist}</p>
                  <p className="text-sm text-muted leading-relaxed mb-8">
                    {weeklyPainting.description}
                  </p>
                  
                  <div className="bg-surface-elevated p-6 rounded-sm border border-border mb-8">
                    <p className="text-xs text-muted uppercase tracking-widest font-bold mb-1.5">{t('highest_bid')}</p>
                    <p className="text-4xl font-display font-light text-foreground">{currentHighestBid} <span className="text-lg font-sans font-bold">EGP</span></p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {bidStep === 0 && (
                    <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Button variant="primary" size="lg" className="w-full uppercase tracking-widest text-xs font-bold h-12" onClick={() => setBidStep(1)}>
                        {t('place_bid')}
                      </Button>
                    </motion.div>
                  )}

                  {bidStep === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                      <FormInput label="Name" value={bidForm.name} onChange={e => setBidForm({...bidForm, name: e.target.value})} />
                      <FormInput label="Phone / Email" value={bidForm.contact} onChange={e => setBidForm({...bidForm, contact: e.target.value})} />
                      <FormInput label={t('bid_amount')} type="number" min={currentHighestBid + 10} value={bidForm.amount} onChange={e => setBidForm({...bidForm, amount: e.target.value})} />
                      <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1 uppercase tracking-widest text-xs font-bold h-11" onClick={() => setBidStep(0)}>Cancel</Button>
                        <Button variant="primary" className="flex-1 uppercase tracking-widest text-xs font-bold h-11" onClick={handleBidNext}>Next</Button>
                      </div>
                    </motion.div>
                  )}

                  {bidStep === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                      <p className="text-xs text-muted uppercase tracking-wider">Secure your bid using one of the payment options:</p>
                      
                      <div className="flex bg-surface-elevated p-1 rounded-sm border border-border">
                        {(['Card', 'Instapay', 'Mobile wallet'] as PaymentMethod[]).map(method => (
                          <button
                            key={method}
                            onClick={() => setBidForm({ ...bidForm, paymentMethod: method })}
                            className={`flex-1 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${
                              bidForm.paymentMethod === method ? 'bg-accent text-[#2C1A0E] shadow-sm' : 'text-muted hover:text-foreground'
                            }`}
                          >
                            {t(method.toLowerCase().replace(' ', '_'))}
                          </button>
                        ))}
                      </div>

                      <div>
                        {bidForm.paymentMethod === 'Card' && (
                          <div className="space-y-4 animate-in fade-in">
                            <FormInput label="Card Number" placeholder="0000 0000 0000 0000" />
                            <div className="grid grid-cols-2 gap-4">
                              <FormInput label="Expiry" placeholder="MM/YY" />
                              <FormInput label="CVV" placeholder="123" />
                            </div>
                          </div>
                        )}

                        {bidForm.paymentMethod === 'Instapay' && (
                          <div className="space-y-6 animate-in fade-in flex flex-col items-center">
                            <div className="w-32 h-32 bg-white rounded-sm flex flex-col items-center justify-center border border-border p-2">
                              <span className="text-black font-semibold text-center text-[10px] leading-tight uppercase tracking-wider">Instapay QR<br/>@retrospot</span>
                            </div>
                            <div className="w-full flex items-center justify-center gap-2">
                              <code className="text-base font-mono bg-surface-elevated px-3 py-1.5 border border-border rounded-sm">{config.instapayPhone}</code>
                              <button onClick={() => copyToClipboard(config.instapayPhone)} className="p-2 bg-surface hover:bg-surface-elevated border border-border text-foreground rounded-sm transition-colors">
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                              </button>
                            </div>
                            <UploadInput label="Upload Receipt" onFileSelect={(f) => setBidForm({...bidForm, transactionImage: f})} />
                          </div>
                        )}

                        {bidForm.paymentMethod === 'Mobile wallet' && (
                          <div className="space-y-6 animate-in fade-in">
                            <p className="text-center text-muted text-xs uppercase tracking-wider">Transfer via Vodafone/Orange/e& Cash</p>
                            <div className="w-full flex items-center justify-center gap-2">
                              <code className="text-base font-mono bg-surface-elevated px-3 py-1.5 border border-border rounded-sm">{config.mobileWalletPhone}</code>
                              <button onClick={() => copyToClipboard(config.mobileWalletPhone)} className="p-2 bg-surface hover:bg-surface-elevated border border-border text-foreground rounded-sm transition-colors">
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                              </button>
                            </div>
                            <UploadInput label="Upload Receipt" onFileSelect={(f) => setBidForm({...bidForm, transactionImage: f})} />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 uppercase tracking-widest text-xs font-bold h-11" onClick={() => setBidStep(1)} disabled={isSubmittingBid}>Back</Button>
                        <Button variant="primary" className="flex-1 uppercase tracking-widest text-xs font-bold h-11" onClick={submitBid} loading={isSubmittingBid} disabled={!bidForm.paymentMethod}>
                          Confirm Bid
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {bidStep === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-4">
                      <CheckCircle2 size={48} className="text-accent mx-auto" />
                      <div className="space-y-1">
                        <h4 className="text-2xl font-display font-light text-foreground">Bid Placed Successfully!</h4>
                        <p className="text-xs text-muted uppercase tracking-wider">You are currently the highest bidder.</p>
                      </div>
                      <div className="pt-4 space-y-2">
                        <Button variant="outline" className="w-full uppercase tracking-widest text-xs font-bold h-11" onClick={generateBidPDF}>Download Receipt</Button>
                        <Button variant="ghost" className="w-full uppercase tracking-widest text-xs font-bold h-11" onClick={() => setBidStep(0)}>Close</Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Card>
        </section>

        {/* =========================================
            SECTION 2: ARTIST SUBMISSION 
            ========================================= */}
        <section className="space-y-8 pb-12">
          <div className="flex flex-col space-y-2 border-b border-border/20 pb-4">
            <span className="text-xs uppercase tracking-widest text-accent font-bold">
              {isRtl ? 'المشاركة الفنية' : 'Call For Artists'}
            </span>
            <div className="flex items-center gap-3">
              <UploadCloud size={24} className="text-accent shrink-0" />
              <h2 className="text-4xl md:text-5xl font-display font-light text-foreground">{t('artist_submission')}</h2>
            </div>
          </div>

          <Card className="p-8 md:p-10 border border-border bg-surface rounded-sm">
            {!artistSuccess ? (
              <div className="space-y-8">
                <p className="text-sm text-muted leading-relaxed max-w-xl">
                  Are you a local artist? Submit your painting to be featured in our physical cafe gallery and added to the weekly bidding queue. We support local art.
                </p>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <FormInput label={t('artist_name')} value={artistForm.name} onChange={e => setArtistForm({...artistForm, name: e.target.value})} />
                    <FormInput label="Contact (Phone/Email)" value={artistForm.contact} onChange={e => setArtistForm({...artistForm, contact: e.target.value})} />
                    <FormInput label={t('painting_name')} value={artistForm.paintingName} onChange={e => setArtistForm({...artistForm, paintingName: e.target.value})} />
                    <FormInput label={t('price')} type="number" placeholder="In EGP" value={artistForm.price} onChange={e => setArtistForm({...artistForm, price: e.target.value})} />
                  </div>
                  
                  <div className="space-y-4 flex flex-col justify-between">
                    <Textarea label={t('description')} className="flex-grow min-h-[140px]" value={artistForm.description} onChange={e => setArtistForm({...artistForm, description: e.target.value})} />
                    <UploadInput label="Upload Painting Photo" onFileSelect={f => setArtistForm({...artistForm, photo: f})} />
                  </div>
                </div>

                <div className="pt-6 border-t border-border/20 flex justify-end">
                  <Button variant="primary" size="lg" className="w-full md:w-auto px-12 uppercase tracking-widest text-xs font-bold h-12" onClick={submitArtistRequest} loading={isSubmittingArtist}>
                    {t('submit_art')}
                  </Button>
                </div>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 space-y-6">
                <CheckCircle2 size={64} className="text-accent mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-3xl font-display font-light text-foreground">Submission Received!</h3>
                  <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
                    Thank you for sharing your art with Retro Spot. Our team will review your submission and contact you soon.
                  </p>
                </div>
                <div className="pt-4">
                  <Button variant="outline" className="uppercase tracking-widest text-xs font-bold px-8 h-11" onClick={() => setArtistSuccess(false)}>Submit Another Art</Button>
                </div>
              </motion.div>
            )}
          </Card>
        </section>

      </main>
    </div>
  );
}
