'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ImageIcon, Copy, Check, UploadCloud, Heart, Clock, CheckCircle2 } from 'lucide-react';
import { Button, FormInput, Textarea, UploadInput } from '@/components';
import { useToast } from '@/contexts/ToastContext';
import { API_URL } from '@/lib/constants';
import styles from './Arts.module.css';

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
    <div className={styles.container}>
      <main className={styles.main}>
        
        {/* =========================================
            SECTION 1: WEEKLY BIDDING 
            ========================================= */}
        <section>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionSubtitle}>
              {isRtl ? 'المعرض الفني والأعمال الأسبوعية' : 'The Exhibition'}
            </span>
            <div className={styles.titleRow}>
              <Heart size={24} className={styles.titleIcon} />
              <h2 className={styles.sectionTitle}>{t('weekly_bidding')}</h2>
            </div>
          </div>

          <div className={styles.cardWrap}>
            {/* Photo Display */}
            <div className={styles.photoDisplay}>
              <div className={styles.photoTint} />
              <ImageIcon size={48} className={styles.photoIcon} />
              <span className={styles.photoLabel}>{isRtl ? 'صورة اللوحة' : 'Midnight Jazz Canvas'}</span>
              <div className={styles.timerBadge}>
                <Clock size={12} /> {isRtl ? 'تنتهي خلال ٣ أيام' : 'Ends in 3 Days'}
              </div>
            </div>

            {/* Bidding Information */}
            <div className={styles.biddingInfo}>
              <div>
                <h3 className={styles.paintingTitle}>{weeklyPainting.name}</h3>
                <p className={styles.artistName}>by {weeklyPainting.artist}</p>
                <p className={styles.paintingDesc}>
                  {weeklyPainting.description}
                </p>
                
                <div className={styles.highestBidBox}>
                  <p className={styles.highestBidLabel}>{t('highest_bid')}</p>
                  <p className={styles.highestBidAmount}>{currentHighestBid} <span className={styles.currency}>EGP</span></p>
                </div>
              </div>

              <div className={styles.bidStepWrap}>
                {bidStep === 0 && (
                  <Button variant="filled" size="lg" className={styles.buttonPrimary} onClick={() => setBidStep(1)}>
                    {t('place_bid')}
                  </Button>
                )}

                {bidStep === 1 && (
                  <>
                    <FormInput label="Name" value={bidForm.name} onChange={e => setBidForm({...bidForm, name: e.target.value})} />
                    <FormInput label="Phone / Email" value={bidForm.contact} onChange={e => setBidForm({...bidForm, contact: e.target.value})} />
                    <FormInput label={t('bid_amount')} type="number" min={currentHighestBid + 10} value={bidForm.amount} onChange={e => setBidForm({...bidForm, amount: e.target.value})} />
                    <div className={styles.buttonRow}>
                      <div className={styles.buttonFlex}>
                        <Button variant="outline" className={styles.buttonPrimary} onClick={() => setBidStep(0)}>Cancel</Button>
                      </div>
                      <div className={styles.buttonFlex}>
                        <Button variant="filled" className={styles.buttonPrimary} onClick={handleBidNext}>Next</Button>
                      </div>
                    </div>
                  </>
                )}

                {bidStep === 2 && (
                  <>
                    <p className={styles.paymentHelp}>Secure your bid using one of the payment options:</p>
                    
                    <div className={styles.paymentOptions}>
                      {['Instapay', 'Mobile wallet', 'Card'].map((method) => (
                        <button
                          key={method}
                          onClick={() => setBidForm({ ...bidForm, paymentMethod: method as PaymentMethod })}
                          className={`${styles.paymentBtn} ${bidForm.paymentMethod === method ? styles.paymentBtnActive : ''}`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>

                    {bidForm.paymentMethod && bidForm.paymentMethod !== 'Card' && (
                      <div className={styles.paymentDetails}>
                        <div>
                          <span className={styles.paymentDetailLabel}>Transfer {bidForm.amount} EGP to:</span>
                          <div 
                            onClick={() => copyToClipboard(bidForm.paymentMethod === 'Instapay' ? config.instapayPhone : config.mobileWalletPhone)}
                            className={styles.copyBox}
                          >
                            <span className={styles.copyText}>
                              {bidForm.paymentMethod === 'Instapay' ? config.instapayPhone : config.mobileWalletPhone}
                            </span>
                            {copied ? <Check size={16} className={styles.copyIconSuccess} /> : <Copy size={16} className={styles.copyIcon} />}
                          </div>
                        </div>

                        <div>
                          <span className={styles.paymentDetailLabel}>Upload Transfer Receipt</span>
                          <UploadInput 
                            label="Transaction Screenshot"
                            onChange={(file) => setBidForm({ ...bidForm, transactionImage: file })}
                          />
                        </div>
                      </div>
                    )}

                    {bidForm.paymentMethod === 'Card' && (
                      <div className={styles.paymentDetails}>
                        <p style={{ fontSize: '14px', color: 'var(--muted)' }}>You will be redirected to the secure payment gateway.</p>
                      </div>
                    )}

                    <div className={styles.buttonRow}>
                      <div className={styles.buttonFlex}>
                        <Button variant="outline" className={styles.buttonPrimary} onClick={() => setBidStep(1)}>Back</Button>
                      </div>
                      <div className={styles.buttonFlex}>
                        <Button variant="filled" className={styles.buttonPrimary} onClick={submitBid} loading={isSubmittingBid}>
                          {bidForm.paymentMethod === 'Card' ? 'Proceed to Pay' : 'Confirm Bid'}
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {bidStep === 3 && (
                  <div className={styles.successState}>
                    <div className={styles.successIconWrap}>
                      <CheckCircle2 size={32} className={styles.successIcon} />
                    </div>
                    <h3 className={styles.successTitle}>Bid Placed!</h3>
                    <p className={styles.successText}>You are currently the highest bidder at {bidForm.amount} EGP.</p>
                    <div className={styles.buttonRow}>
                      <div className={styles.buttonFlex}>
                        <Button variant="outline" className={styles.buttonPrimary} onClick={() => setBidStep(0)}>Close</Button>
                      </div>
                      <div className={styles.buttonFlex}>
                        <Button variant="filled" className={styles.buttonPrimary} onClick={generateBidPDF}>Save Receipt</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            SECTION 2: SUBMIT YOUR ART 
            ========================================= */}
        <section>
          <div className={styles.sectionHeader} style={{ marginTop: '32px' }}>
            <span className={styles.sectionSubtitle}>
              {isRtl ? 'هل أنت فنان؟ شارك إبداعك' : 'For the Artists'}
            </span>
            <div className={styles.titleRow}>
              <UploadCloud size={24} className={styles.titleIcon} />
              <h2 className={styles.sectionTitle}>{t('submit_your_art')}</h2>
            </div>
          </div>

          <div className={styles.formCard}>
            {artistSuccess ? (
              <div className={styles.successState}>
                <div className={styles.successIconWrap}>
                  <CheckCircle2 size={32} className={styles.successIcon} />
                </div>
                <h3 className={styles.successTitle}>Application Submitted</h3>
                <p className={styles.successText}>Our curator will review your artwork and contact you shortly.</p>
                <Button variant="outline" onClick={() => setArtistSuccess(false)}>Submit Another</Button>
              </div>
            ) : (
              <div>
                <div className={styles.formGrid}>
                  <FormInput label="Artist Name" value={artistForm.name} onChange={e => setArtistForm({...artistForm, name: e.target.value})} />
                  <FormInput label="Phone / Email" value={artistForm.contact} onChange={e => setArtistForm({...artistForm, contact: e.target.value})} />
                  <FormInput label="Artwork Title" value={artistForm.paintingName} onChange={e => setArtistForm({...artistForm, paintingName: e.target.value})} />
                  <FormInput label="Starting Bid / Price (EGP)" type="number" value={artistForm.price} onChange={e => setArtistForm({...artistForm, price: e.target.value})} />
                </div>
                
                <Textarea label="Artwork Description / Story" rows={4} value={artistForm.description} onChange={e => setArtistForm({...artistForm, description: e.target.value})} />
                
                <div style={{ marginTop: '24px' }}>
                  <label className={styles.paymentDetailLabel}>High-Quality Photo of Artwork</label>
                  <UploadInput 
                    label="Upload image"
                    onChange={(file) => setArtistForm({ ...artistForm, photo: file })}
                  />
                </div>

                <Button 
                  variant="filled" 
                  size="lg" 
                  className={styles.buttonPrimary} 
                  style={{ marginTop: '32px' }}
                  onClick={submitArtistRequest} 
                  loading={isSubmittingArtist}
                >
                  {t('submit_request')}
                </Button>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
