'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import { EVENTS } from '@/lib/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import { Sun, Moon, Image as ImageIcon, Copy, Check, UploadCloud, Heart, Clock, CheckCircle2 } from 'lucide-react';
import { Button, Card, FormInput, Textarea, UploadInput } from '@/components';
import { useToast } from '@/contexts/ToastContext';

import { API_URL } from '@/lib/constants';

type PaymentMethod = 'Card' | 'Instapay' | 'Mobile wallet';

export default function ArtsPage() {
  const { t, language, toggleLanguage, isRtl } = useLanguage();
  const { theme, setTheme } = useTheme();
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
      {/* --- TOP BAR --- */}
      <header className="sticky top-0 z-40 bg-surface-elevated/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="px-4 h-16 flex items-center justify-between max-w-4xl mx-auto">
          <span className="font-black text-xl text-primary tracking-tight">Retro Spot Arts</span>
          
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

      <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-16">
        
        {/* =========================================
            SECTION 1: WEEKLY BIDDING 
            ========================================= */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Heart className="text-primary" />
            <h2 className="text-3xl font-black">{t('weekly_bidding')}</h2>
          </div>

          <Card className="overflow-hidden border-border-subtle shadow-xl">
            <div className="grid md:grid-cols-2">
              <div className="bg-surface-elevated aspect-square md:aspect-auto flex flex-col items-center justify-center border-r border-border-subtle relative p-6">
                <ImageIcon size={64} className="text-muted-foreground/50 mb-4" />
                <span className="text-muted-foreground font-medium">Painting Placeholder</span>
                <div className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                  <Clock size={12} /> Ends in 3 Days
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{weeklyPainting.name}</h3>
                  <p className="text-primary font-medium mb-4">by {weeklyPainting.artist}</p>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {weeklyPainting.description}
                  </p>
                  
                  <div className="bg-surface p-4 rounded-xl border border-border mb-8">
                    <p className="text-sm text-muted-foreground font-medium mb-1">{t('highest_bid')}</p>
                    <p className="text-3xl font-black text-foreground">{currentHighestBid} EGP</p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {bidStep === 0 && (
                    <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Button size="lg" className="w-full" onClick={() => setBidStep(1)}>
                        {t('place_bid')}
                      </Button>
                    </motion.div>
                  )}

                  {bidStep === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="space-y-4">
                        <FormInput label="Name" value={bidForm.name} onChange={e => setBidForm({...bidForm, name: e.target.value})} />
                        <FormInput label="Phone / Email" value={bidForm.contact} onChange={e => setBidForm({...bidForm, contact: e.target.value})} />
                        <FormInput label={t('bid_amount')} type="number" min={currentHighestBid + 10} value={bidForm.amount} onChange={e => setBidForm({...bidForm, amount: e.target.value})} />
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" className="flex-1" onClick={() => setBidStep(0)}>Cancel</Button>
                          <Button className="flex-1" onClick={handleBidNext}>Next</Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {bidStep === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <p className="text-sm text-muted-foreground mb-4">Secure your bid using one of the methods below.</p>
                      <div className="flex bg-surface-elevated p-1 rounded-xl border border-border mb-4">
                        {(['Card', 'Instapay', 'Mobile wallet'] as PaymentMethod[]).map(method => (
                          <button
                            key={method}
                            onClick={() => setBidForm({ ...bidForm, paymentMethod: method })}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                              bidForm.paymentMethod === method ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {t(method.toLowerCase().replace(' ', '_'))}
                          </button>
                        ))}
                      </div>

                      <div className="mb-6">
                        {bidForm.paymentMethod === 'Card' && (
                          <div className="space-y-3 animate-in fade-in text-sm">
                            <FormInput label="Card Number" placeholder="0000 0000 0000 0000" />
                            <div className="grid grid-cols-2 gap-3">
                              <FormInput label="Expiry" placeholder="MM/YY" />
                              <FormInput label="CVV" placeholder="123" />
                            </div>
                          </div>
                        )}

                        {bidForm.paymentMethod === 'Instapay' && (
                          <div className="space-y-4 animate-in fade-in flex flex-col items-center">
                            <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center border-4 border-primary">
                              <span className="text-black font-bold text-center text-xs">QR Code<br/>@owner</span>
                            </div>
                            <div className="w-full flex items-center justify-center gap-2">
                              <code className="text-lg font-mono bg-surface-elevated px-3 py-1 rounded-lg">{config.instapayPhone}</code>
                              <button onClick={() => copyToClipboard(config.instapayPhone)} className="p-1.5 bg-secondary text-foreground rounded-lg">
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                              </button>
                            </div>
                            <UploadInput label="Upload Receipt" onFileSelect={(f) => setBidForm({...bidForm, transactionImage: f})} />
                          </div>
                        )}

                        {bidForm.paymentMethod === 'Mobile wallet' && (
                          <div className="space-y-4 animate-in fade-in">
                            <p className="text-center text-muted-foreground text-xs">Transfer via Vodafone/Orange/e& Cash</p>
                            <div className="w-full flex items-center justify-center gap-2">
                              <code className="text-lg font-mono bg-surface-elevated px-3 py-1 rounded-lg">{config.mobileWalletPhone}</code>
                              <button onClick={() => copyToClipboard(config.mobileWalletPhone)} className="p-1.5 bg-secondary text-foreground rounded-lg">
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                              </button>
                            </div>
                            <UploadInput label="Upload Receipt" onFileSelect={(f) => setBidForm({...bidForm, transactionImage: f})} />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setBidStep(1)} disabled={isSubmittingBid}>Back</Button>
                        <Button className="flex-1 bg-success hover:bg-success/90" onClick={submitBid} loading={isSubmittingBid} disabled={!bidForm.paymentMethod}>
                          Confirm Bid
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {bidStep === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                      <CheckCircle2 size={48} className="text-success mx-auto mb-4" />
                      <h4 className="text-xl font-bold mb-2">Bid Placed Successfully!</h4>
                      <p className="text-muted-foreground mb-6">You are currently the highest bidder.</p>
                      <Button variant="outline" className="w-full mb-2" onClick={generateBidPDF}>Download Receipt</Button>
                      <Button variant="ghost" className="w-full" onClick={() => setBidStep(0)}>Close</Button>
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
        <section className="pb-16">
          <div className="flex items-center gap-3 mb-6">
            <UploadCloud className="text-primary" />
            <h2 className="text-3xl font-black">{t('artist_submission')}</h2>
          </div>

          <Card className="p-6 md:p-8 border-border-subtle shadow-lg">
            {!artistSuccess ? (
              <div className="space-y-6">
                <p className="text-muted-foreground mb-6">
                  Are you a local artist? Submit your painting to be featured in our cafe and added to the weekly bidding queue.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormInput label={t('artist_name')} value={artistForm.name} onChange={e => setArtistForm({...artistForm, name: e.target.value})} />
                    <FormInput label="Contact (Phone/Email)" value={artistForm.contact} onChange={e => setArtistForm({...artistForm, contact: e.target.value})} />
                    <FormInput label={t('painting_name')} value={artistForm.paintingName} onChange={e => setArtistForm({...artistForm, paintingName: e.target.value})} />
                    <FormInput label={t('price')} type="number" placeholder="In EGP" value={artistForm.price} onChange={e => setArtistForm({...artistForm, price: e.target.value})} />
                  </div>
                  <div className="space-y-4 flex flex-col">
                    <Textarea label={t('description')} className="flex-1 min-h-[120px]" value={artistForm.description} onChange={e => setArtistForm({...artistForm, description: e.target.value})} />
                    <UploadInput label="Upload Painting Photo" onFileSelect={f => setArtistForm({...artistForm, photo: f})} />
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-6">
                  <Button size="lg" className="w-full md:w-auto md:px-12" onClick={submitArtistRequest} loading={isSubmittingArtist}>
                    {t('submit_art')}
                  </Button>
                </div>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <CheckCircle2 size={64} className="text-success mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-2">Submission Received!</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  Thank you for sharing your art with Retro Spot. Our team will review your submission and contact you soon.
                </p>
                <Button onClick={() => setArtistSuccess(false)}>Submit Another Art</Button>
              </motion.div>
            )}
          </Card>
        </section>

      </main>
    </div>
  );
}
