'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { EVENTS } from '@/lib/socket';
import { useSocketEvent } from '@/hooks/useSocket';
import {
  Calendar, Heart, CheckCircle2, XCircle, Clock, User,
  Users, FileText, CreditCard, Image as ImageIcon, DollarSign,
  Newspaper, Trash2, Plus
} from 'lucide-react';
import { Button, Card, FormInput, Textarea, Select } from '@/components';

import { API_URL } from '@/lib/constants';

// --- Types ---
interface Booking {
  id: string;
  eventType: string;
  date: string;
  startTime: string;
  endTime: string;
  name: string;
  peopleCount: number;
  notes: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  totalPrice: number;
  transactionScreenshotUrl?: string;
  createdAt: string;
}

interface Art {
  id: string;
  titleEn: string;
  titleAr: string;
  artistName: string;
  descriptionEn: string;
  price: number;
  status: string;
  createdAt: string;
  bids: ArtBid[];
}

interface ArtBid {
  id: string;
  bidderName: string;
  bidAmount: number;
  paymentMethod: string;
  bidderContact: string;
  transactionScreenshotUrl?: string;
  createdAt: string;
}

interface News {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  type: string;
  active: boolean;
  startDate?: string;
  endDate?: string;
}

export default function OrganizerPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'bookings' | 'arts' | 'news'>('bookings');

  // Data state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [arts, setArts] = useState<Art[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  // News form
  const [isAddingNews, setIsAddingNews] = useState(false);
  const [newsForm, setNewsForm] = useState({
    titleEn: '', titleAr: '', descriptionEn: '', descriptionAr: '', type: 'announcement', startDate: '', endDate: ''
  });

  // Screenshot Viewer Modal
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  // --- FETCH INITIAL DATA ---
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/bookings`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/api/arts`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/api/news`).then(r => r.json()).catch(() => []),
    ]).then(([bookingsData, artsData, newsData]) => {
      setBookings(bookingsData);
      setArts(artsData);
      setNews(newsData);
      setLoading(false);
    });
  }, []);

  // --- SOCKET LISTENERS ---
  useSocketEvent<Booking>(EVENTS.BOOKING_NEW, (booking) => {
    setBookings(prev => [booking, ...prev]);
  });

  useSocketEvent<Booking>(EVENTS.BOOKING_STATUS_UPDATED, (booking) => {
    setBookings(prev => prev.map(b => b.id === booking.id ? booking : b));
  });

  useSocketEvent<ArtBid & { art?: Art }>(EVENTS.BID_NEW, (bid) => {
    setArts(prev => prev.map(a => {
      if (a.id === bid.art?.id || (bid as any).artId === a.id) {
        return { ...a, bids: [bid, ...a.bids] };
      }
      return a;
    }));
  });

  useSocketEvent<Art>(EVENTS.ART_STATUS_UPDATED, (art) => {
    setArts(prev => prev.map(a => a.id === art.id ? { ...a, ...art } : a));
  });

  // --- ACTIONS ---
  const updateBookingStatus = async (bookingId: string, status: string, paymentStatus?: string) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status, paymentStatus: paymentStatus || b.paymentStatus } : b));
    try {
      await fetch(`${API_URL}/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, paymentStatus }),
      });
    } catch (err) {
      console.error('Failed to update booking', err);
    }
  };

  const updateArtStatus = async (artId: string, status: string) => {
    setArts(prev => prev.map(a => a.id === artId ? { ...a, status } : a));
    try {
      await fetch(`${API_URL}/api/arts/${artId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error('Failed to update art', err);
    }
  };

  const submitNews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsForm),
      });
      const data = await res.json();
      setNews([data, ...news]);
      setIsAddingNews(false);
      setNewsForm({ titleEn: '', titleAr: '', descriptionEn: '', descriptionAr: '', type: 'announcement', startDate: '', endDate: '' });
    } catch (err) {
      console.error('Failed to add news', err);
    }
  };

  const deleteNews = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/news/${id}`, { method: 'DELETE' });
      setNews(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete news', err);
    }
  };

  // --- HELPERS ---
  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/20 text-warning border-warning/50';
      case 'confirmed': return 'bg-success/20 text-success border-success/50';
      case 'cancelled': return 'bg-danger/20 text-danger border-danger/50';
      case 'completed': return 'bg-info/20 text-info border-info/50';
      default: return 'bg-surface text-muted border-border';
    }
  };

  const getArtStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/20 text-warning';
      case 'approved': return 'bg-success/20 text-success';
      case 'sold': return 'bg-primary/20 text-primary';
      case 'rejected': return 'bg-danger/20 text-danger';
      default: return 'bg-surface text-muted';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground text-lg font-medium animate-pulse">Loading...</div>
      </div>
    );
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const pendingArts = arts.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-6">

      {/* Tab Navigation */}
      <div className="flex bg-surface-elevated p-1 rounded-xl border border-border">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'bookings' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar size={18} />
          <span className="hidden sm:inline">Bookings</span>
          {pendingBookings > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'bookings' ? 'bg-white/20' : 'bg-warning/20 text-warning'
            }`}>
              {pendingBookings}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('arts')}
          className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'arts' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Heart size={18} />
          <span className="hidden sm:inline">Arts & Bids</span>
          {pendingArts > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'arts' ? 'bg-white/20' : 'bg-warning/20 text-warning'
            }`}>
              {pendingArts}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'news' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Newspaper size={18} />
          <span className="hidden sm:inline">News</span>
        </button>
      </div>

      {/* ═══════════ BOOKINGS TAB ═══════════ */}
      {activeTab === 'bookings' && (
        <div className="space-y-4 animate-in fade-in">
          <AnimatePresence>
            {bookings.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-xl font-bold">No bookings yet.</p>
              </div>
            ) : (
              bookings.map(booking => (
                <motion.div key={booking.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className={`overflow-hidden ${booking.status === 'pending' ? 'border-warning/50 shadow-lg' : ''}`}>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold">{booking.eventType}</h3>
                          <p className="text-sm text-muted-foreground font-medium mt-1">by {booking.name}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getBookingStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm"><Calendar size={16} className="text-muted-foreground" /><span>{booking.date}</span></div>
                        <div className="flex items-center gap-2 text-sm"><Clock size={16} className="text-muted-foreground" /><span>{booking.startTime} – {booking.endTime}</span></div>
                        <div className="flex items-center gap-2 text-sm"><Users size={16} className="text-muted-foreground" /><span>{booking.peopleCount} people</span></div>
                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard size={16} className="text-muted-foreground" />
                          <span>{booking.paymentMethod || 'N/A'}</span>
                          {booking.transactionScreenshotUrl && (
                            <button 
                              onClick={() => setScreenshotUrl(booking.transactionScreenshotUrl || null)}
                              className="ml-2 text-primary hover:text-primary-hover flex items-center gap-1"
                            >
                              <ImageIcon size={16} /> <span className="text-xs uppercase font-bold">View Receipt</span>
                            </button>
                          )}
                        </div>
                      </div>
                      {booking.notes && (
                        <div className="bg-surface-elevated rounded-lg p-3 mb-4 text-sm">
                          <span className="font-bold text-muted-foreground text-xs uppercase tracking-wider">Notes: </span>{booking.notes}
                        </div>
                      )}
                      {booking.status === 'pending' && (
                        <div className="flex gap-2 pt-2 border-t border-border">
                          <Button className="flex-1 bg-success hover:bg-success/90" onClick={() => updateBookingStatus(booking.id, 'confirmed', 'verified')}>
                            <CheckCircle2 size={18} /> Confirm
                          </Button>
                          <Button variant="outline" className="flex-1 text-danger border-danger/50 hover:bg-danger/10" onClick={() => updateBookingStatus(booking.id, 'cancelled')}>
                            <XCircle size={18} /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ═══════════ ARTS TAB ═══════════ */}
      {activeTab === 'arts' && (
        <div className="space-y-6 animate-in fade-in">
          <AnimatePresence>
            {arts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Heart size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-xl font-bold">No art submissions yet.</p>
              </div>
            ) : (
              arts.map(art => (
                <motion.div key={art.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className={`overflow-hidden ${art.status === 'pending' ? 'border-warning/50 shadow-lg' : ''}`}>
                    <div className="grid md:grid-cols-3">
                      <div className="p-6 md:col-span-2 border-r border-border">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold">{art.titleEn}</h3>
                            <p className="text-sm text-primary font-medium">by {art.artistName}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getArtStatusColor(art.status)}`}>
                            {art.status}
                          </span>
                        </div>
                        {art.descriptionEn && <p className="text-muted-foreground text-sm mb-4">{art.descriptionEn}</p>}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="bg-surface-elevated rounded-lg px-4 py-2">
                            <p className="text-xs text-muted-foreground font-bold uppercase">Base Price</p>
                            <p className="text-xl font-black">{art.price} EGP</p>
                          </div>
                          {art.bids.length > 0 && (
                            <div className="bg-primary/10 rounded-lg px-4 py-2">
                              <p className="text-xs text-primary font-bold uppercase">Highest Bid</p>
                              <p className="text-xl font-black text-primary">{art.bids[0].bidAmount} EGP</p>
                            </div>
                          )}
                        </div>
                        {art.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => updateArtStatus(art.id, 'approved')}><CheckCircle2 size={16} /> Approve</Button>
                            <Button size="sm" variant="outline" className="text-danger border-danger/50" onClick={() => updateArtStatus(art.id, 'rejected')}><XCircle size={16} /> Reject</Button>
                          </div>
                        )}
                        {art.status === 'approved' && art.bids.length > 0 && (
                          <Button size="sm" className="bg-primary" onClick={() => updateArtStatus(art.id, 'sold')}><DollarSign size={16} /> Mark as Sold</Button>
                        )}
                      </div>
                      <div className="p-4 bg-surface-elevated">
                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Bids ({art.bids.length})</h4>
                        {art.bids.length === 0 ? <p className="text-sm text-muted-foreground/50">No bids yet</p> : (
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {art.bids.map((bid, idx) => (
                              <div key={bid.id} className={`p-3 rounded-lg border ${idx === 0 ? 'bg-primary/5 border-primary/30' : 'bg-surface border-border'}`}>
                                <div className="flex justify-between items-center"><span className="font-bold text-sm">{bid.bidderName}</span><span className={`font-black ${idx === 0 ? 'text-primary' : ''}`}>{bid.bidAmount} EGP</span></div>
                                <div className="flex justify-between items-center mt-1">
                                  <p className="text-xs text-muted-foreground">{bid.bidderContact}</p>
                                  {bid.transactionScreenshotUrl && (
                                    <button 
                                      onClick={() => setScreenshotUrl(bid.transactionScreenshotUrl || null)}
                                      className="text-primary hover:text-primary-hover flex items-center gap-1"
                                    >
                                      <ImageIcon size={14} /> <span className="text-xs font-bold uppercase">Receipt</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ═══════════ NEWS TAB ═══════════ */}
      {activeTab === 'news' && (
        <div className="space-y-6 animate-in fade-in">
          
          {isAddingNews ? (
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Add News/Announcement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormInput label="Title (EN)" value={newsForm.titleEn} onChange={e => setNewsForm({...newsForm, titleEn: e.target.value})} />
                <FormInput label="Title (AR)" value={newsForm.titleAr} onChange={e => setNewsForm({...newsForm, titleAr: e.target.value})} />
                <Select 
                  label="Type"
                  value={newsForm.type}
                  onChange={e => setNewsForm({...newsForm, type: e.target.value})}
                  options={[
                    { value: 'announcement', label: 'Announcement' },
                    { value: 'event', label: 'Event' },
                    { value: 'new_item', label: 'New Menu Item' },
                    { value: 'discount', label: 'Discount/Offer' },
                  ]}
                />
                <div className="grid grid-cols-2 gap-2">
                  <FormInput label="Start Date (Optional)" type="date" value={newsForm.startDate} onChange={e => setNewsForm({...newsForm, startDate: e.target.value})} />
                  <FormInput label="End Date (Optional)" type="date" value={newsForm.endDate} onChange={e => setNewsForm({...newsForm, endDate: e.target.value})} />
                </div>
              </div>
              <div className="space-y-4 mb-6">
                <Textarea label="Description (EN)" value={newsForm.descriptionEn} onChange={e => setNewsForm({...newsForm, descriptionEn: e.target.value})} rows={3} />
                <Textarea label="Description (AR)" value={newsForm.descriptionAr} onChange={e => setNewsForm({...newsForm, descriptionAr: e.target.value})} rows={3} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsAddingNews(false)}>Cancel</Button>
                <Button onClick={submitNews} disabled={!newsForm.titleEn}>Save News</Button>
              </div>
            </Card>
          ) : (
            <Button onClick={() => setIsAddingNews(true)} className="w-full h-14 border-dashed" variant="outline">
              <Plus size={20} className="mr-2" /> Add New Announcement
            </Button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {news.map((item) => (
                <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Card className="p-5 h-full flex flex-col hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md">
                        {item.type}
                      </span>
                      <button onClick={() => deleteNews(item.id)} className="text-danger/70 hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <h3 className="font-bold text-lg mb-2">{item.titleEn}</h3>
                    <p className="text-sm text-muted-foreground flex-1 mb-4">{item.descriptionEn}</p>
                    {(item.startDate || item.endDate) && (
                      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 bg-surface-elevated w-fit px-2 py-1 rounded-md">
                        <Calendar size={12} />
                        {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'Now'} 
                        {item.endDate ? ` - ${new Date(item.endDate).toLocaleDateString()}` : ''}
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
              {news.length === 0 && !isAddingNews && (
                <div className="col-span-1 md:col-span-2 text-center py-12 text-muted-foreground">
                  <p>No news items found. Create one to inform your customers!</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Screenshot Modal */}
      <AnimatePresence>
        {screenshotUrl && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setScreenshotUrl(null)}
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface border border-border p-4 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Payment Receipt</h3>
                <button onClick={() => setScreenshotUrl(null)} className="p-1 rounded-md text-muted-foreground hover:text-foreground bg-surface-elevated">
                  <XCircle size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-black/5 rounded-xl border border-border-subtle p-2 flex items-center justify-center">
                <img src={screenshotUrl} alt="Payment Receipt" className="max-w-full max-h-full object-contain rounded-lg" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
