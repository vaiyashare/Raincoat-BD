import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Trash2, 
  CheckCircle, 
  Eye, 
  Search, 
  Camera, 
  Award, 
  Plus, 
  MessageSquare,
  ThumbsUp,
  X,
  FileImage,
  Upload
} from 'lucide-react';
import { 
  getCustomReviewsFromFirestore, 
  deleteReviewFromFirestore, 
  saveReviewToFirestore 
} from '../../lib/firebase';
import { CustomerReview } from '../../types';
import { compressImage } from '../../lib/imageCompressor';

interface ReviewsAdminProps {
  userRole?: string;
}

export default function ReviewsAdmin({ userRole }: ReviewsAdminProps) {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<'all' | '5' | '4' | 'pending' | 'photos'>('all');
  
  // Custom manual review generator modal/form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newPhotoBase64, setNewPhotoBase64] = useState('');
  const [newAvatarBase64, setNewAvatarBase64] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lightbox preview state
  const [activePhotoPreview, setActivePhotoPreview] = useState<string | null>(null);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const fbReviews = await getCustomReviewsFromFirestore();
      setReviews(fbReviews || []);
    } catch (err) {
      console.warn('Failed to load reviews in Admin Panel:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই রিভিউটি স্থায়ীভাবে মুছে ফেলতে চান? এটি পুনরায় ফিরিয়ে আনা যাবে না।')) return;
    try {
      await deleteReviewFromFirestore(id);
      setReviews(prev => prev.filter(r => r.id !== id));
      alert('রিভিউ সফলভাবে ডিলিট করা হয়েছে!');
    } catch (err) {
      alert('রিভিউ ডিলিট করতে সমস্যা হয়েছে।');
    }
  };

  const handleToggleApprove = async (review: CustomerReview) => {
    try {
      const updated: CustomerReview = {
        ...review,
        verifiedPurchase: !review.verifiedPurchase
      };
      await saveReviewToFirestore(updated);
      setReviews(prev => prev.map(r => r.id === review.id ? updated : r));
      alert(updated.verifiedPurchase ? 'রিভিউটি অনুমোদন দেওয়া হয়েছে!' : 'রিভিউ অনুমোদন বাতিল করা হয়েছে!');
    } catch (err) {
      alert('রিভিউ আপডেট ব্যর্থ হয়েছে।');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'product' | 'avatar') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === 'string') {
        try {
          const compressed = await compressImage(reader.result, 800, 0.55);
          if (target === 'product') {
            setNewPhotoBase64(compressed);
          } else {
            setNewAvatarBase64(compressed);
          }
        } catch (err) {
          if (target === 'product') {
            setNewPhotoBase64(reader.result);
          } else {
            setNewAvatarBase64(reader.result);
          }
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newComment) {
      alert('নাম এবং মন্তব্য বাধ্যতামূলক!');
      return;
    }

    setIsSubmitting(true);
    try {
      const newReview: CustomerReview = {
        id: `rev-gen-${Date.now()}`,
        customerName: newCustomerName,
        phoneNumberMasked: newPhone || '01x-xxxx-xxxx',
        rating: newRating,
        title: 'অসাধারণ প্রিমিয়াম কোয়ালিটি রেনকোট!',
        messages: [
          {
            id: 'm-1',
            sender: 'client',
            text: newComment,
            time: 'আজ'
          }
        ],
        badge: '৫/৫ স্টার রেটিং',
        avatarUrl: newAvatarBase64 || undefined,
        productPhoto: newPhotoBase64 || undefined,
        verifiedPurchase: true, // Default verified when generated from manual panel
        helpfulCount: Math.floor(Math.random() * 8)
      };

      await saveReviewToFirestore(newReview);
      setReviews(prev => [newReview, ...prev]);
      
      // Reset form & close
      setNewCustomerName('');
      setNewPhone('');
      setNewRating(5);
      setNewComment('');
      setNewPhotoBase64('');
      setNewAvatarBase64('');
      setShowAddModal(false);
      alert('নতুন কাস্টমার রিভিউ সফলভাবে এডমিন থেকে যোগ করা হয়েছে!');
    } catch (err) {
      alert('রিভিউ যোগ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Searching and filtering
  const filteredReviews = reviews.filter(rev => {
    const matchesSearch = 
      rev.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rev.messages.some(m => m.text.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (filterRating === '5') return rev.rating === 5;
    if (filterRating === '4') return rev.rating === 4;
    if (filterRating === 'pending') return !rev.verifiedPurchase;
    if (filterRating === 'photos') return !!rev.productPhoto;

    return true;
  });

  const totalRatingSum = reviews.reduce((acc, current) => acc + current.rating, 0);
  const averageRating = reviews.length > 0 ? (totalRatingSum / reviews.length).toFixed(1) : '5.0';
  const approvedCount = reviews.filter(r => r.verifiedPurchase).length;
  const pendingCount = reviews.filter(r => !r.verifiedPurchase).length;
  const photoCount = reviews.filter(r => r.productPhoto).length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Upper Statistics and Description Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Award className="h-6 w-6 text-orange-500" />
            কাস্টমার রিভিউ হাব (Customer Reviews Hub)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            গ্রাহকদের পাঠানো প্রোডাক্টের প্রশংসাপত্র, স্টার রেটিং এবং পরিধান করা লাইভ ছবিগুলো দেখুন, অনুমোদন দিন অথবা ডিলিট করুন।
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow"
        >
          <Plus className="h-4 w-4" />
          ম্যানুয়াল রিভিউ তৈরি করুন
        </button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase block">মোট কাস্টমার রিভিউ</span>
            <span className="text-2xl font-black text-slate-800 font-mono">{reviews.length} টি</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">ল্যান্ডিং পেইজে রানিং</span>
        </div>

        <div className="p-4 bg-emerald-50/50 border border-emerald-100/90 rounded-2xl flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-emerald-800 font-bold uppercase block">অনুমোদিত রিভিউ (Approved)</span>
            <span className="text-2xl font-black text-emerald-700 font-mono">{approvedCount} টি</span>
          </div>
          <span className="text-[10px] text-emerald-600 block mt-1">জনসমক্ষে দৃশ্যমান</span>
        </div>

        <div className="p-4 bg-orange-50/40 border border-orange-100/90 rounded-2xl flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-orange-800 font-bold uppercase block">পেন্ডিং এপ্রুভাল (Unapproved)</span>
            <span className="text-2xl font-black text-orange-700 font-mono text-orange-650">{pendingCount} টি</span>
          </div>
          <span className="text-[10px] text-orange-500 block mt-1">রিভিউ প্যানেল এডিটর</span>
        </div>

        <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-2xl flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-blue-800 font-bold uppercase block">রিভিউ রেটিং এভারেজ</span>
            <span className="text-2xl font-black text-blue-750 font-mono">{averageRating} ★</span>
          </div>
          <span className="text-[10px] text-blue-500 block mt-1">ফটো রিভিউ সংখ্যা: {photoCount} টি</span>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-white p-4 border border-slate-200/80 rounded-2xl">
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setFilterRating('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${filterRating === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            সব রিভিউ ({reviews.length})
          </button>
          <button
            onClick={() => setFilterRating('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${filterRating === 'pending' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            অপেক্ষমাণ ({pendingCount})
          </button>
          <button
            onClick={() => setFilterRating('photos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${filterRating === 'photos' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            ছবি যুক্ত ({photoCount})
          </button>
          <button
            onClick={() => setFilterRating('5')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${filterRating === '5' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            ৫ স্টার (5★)
          </button>
        </div>

        <div className="relative w-full md:w-64 search-box">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ক্রেতার নাম বা রিভিউ টেক্সট খুঁজুন..."
            className="w-full text-xs pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Main Reviews Layout Area */}
      {isLoading ? (
        <div className="text-center py-16 bg-white border border-slate-200/60 rounded-2xl">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">রিভিউ ডেটাবেজ লোড হচ্ছে, দয়া করে অপেক্ষা করুন...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-16 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-center text-slate-400 italic text-xs">
          কোনো কাস্টমার রিভিউ পাওয়া যায়নি।
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredReviews.map((review) => (
            <div 
              key={review.id} 
              className={`p-4 border rounded-2xl bg-white shadow-sm flex flex-col justify-between gap-3 relative transition-all ${review.verifiedPurchase ? 'border-slate-200' : 'border-amber-300 ring-2 ring-amber-300/10'}`}
            >
              <div>
                {/* Reviewer Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    {review.avatarUrl ? (
                      <img 
                        src={review.avatarUrl} 
                        alt={review.customerName} 
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" 
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                        {review.customerName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <strong className="text-xs text-slate-800 block">{review.customerName}</strong>
                      <span className="text-[10px] text-slate-500 font-mono block">{review.phoneNumberMasked}</span>
                    </div>
                  </div>

                  <span className="text-amber-500 flex gap-0.5 mt-1 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`} 
                      />
                    ))}
                  </span>
                </div>

                {/* Review messages */}
                <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 leading-normal space-y-2">
                  {review.messages.map((m) => (
                    <div key={m.id}>
                      <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">{m.sender === 'client' ? 'গ্রাহক' : 'অ্যাডমিন'}:</span>
                      <p className="mt-0.5">{m.text}</p>
                    </div>
                  ))}
                </div>

                {/* Uploaded photo attached */}
                {review.productPhoto && (
                  <div className="mt-3 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                      <Camera className="h-3 w-3 text-indigo-500" />
                      গ্রাহকের আপলোডকৃত ছবি:
                    </span>
                    <div 
                      onClick={() => setActivePhotoPreview(review.productPhoto || null)}
                      className="group relative cursor-zoom-in rounded-xl overflow-hidden border border-slate-200 bg-black/5 flex items-center justify-center aspect-video max-h-36 md:max-h-44 w-full"
                    >
                      <img 
                        src={review.productPhoto} 
                        alt="customer real product photo attachment" 
                        className="object-contain max-h-full w-full transition-transform duration-300 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-2.5">
                <span className="text-[9px] text-slate-400 font-bold block">
                  ❤️ {review.helpfulCount || 0} টি সাহায্যকারী
                </span>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-all cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>

                  <button
                    onClick={() => handleToggleApprove(review)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      review.verifiedPurchase 
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    }`}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {review.verifiedPurchase ? 'অনুমোদিত' : 'অনুমোদন দিন'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Review Addition Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-400" />
                <h3 className="text-sm font-black text-white">ম্যানুয়াল প্রোমোশনাল রিভিউ যোগ করুন</h3>
              </div>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setNewPhotoBase64('');
                  setNewAvatarBase64('');
                }}
                className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">গ্রাহকের নাম *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="যেমন: আরিয়ান হোসাইন"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">ফোন নম্বর (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="যেমন: ০১৭**-***৮১২"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">রিভিউ রেটিং স্টার</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className="p-1 text-amber-500 focus:outline-none cursor-pointer"
                    >
                      <Star className={`h-6 w-6 ${star <= newRating ? 'fill-current' : 'text-slate-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">রিভিউ কমেন্ট বার্তা *</label>
                <textarea
                  required
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="যেমন: ওয়াটারপ্রুফিং কাপড় চমৎকার! ভারী বৃষ্টিতেও এক ফোঁটা পানি ঢোকেনি।"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none leading-relaxed"
                />
              </div>

              {/* Photos upload generators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">প্রোডাক্ট রিয়েল ছবি (ঐচ্ছিক)</label>
                  <label className="p-3 border border-dashed border-slate-250 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-all">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, 'product')}
                      className="hidden" 
                    />
                    <Camera className="h-5 w-5 text-indigo-500 mb-1" />
                    <span className="text-[10px] font-semibold text-slate-500">ছবি আপলোড করুন</span>
                  </label>
                  
                  {newPhotoBase64 && (
                    <div className="relative rounded-lg overflow-hidden border border-slate-350 bg-black/5 flex items-center justify-center p-1 max-h-24">
                      <img src={newPhotoBase64} alt="Pre-upload" className="max-h-20 object-contain rounded" />
                      <button 
                        type="button"
                        onClick={() => setNewPhotoBase64('')}
                        className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">গ্রাহকের প্রোফাইল ছবি (ঐচ্ছিক)</label>
                  <label className="p-3 border border-dashed border-slate-250 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-all">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, 'avatar')}
                      className="hidden" 
                    />
                    <Upload className="h-5 w-5 text-cyan-600 mb-1" />
                    <span className="text-[10px] font-semibold text-slate-500">অবতার আপলোড</span>
                  </label>
                  
                  {newAvatarBase64 && (
                    <div className="relative rounded-lg overflow-hidden border border-slate-350 bg-black/5 flex items-center justify-center p-1 max-h-24">
                      <img src={newAvatarBase64} alt="Pre-upload Avatar" className="max-h-16 object-contain rounded-full" />
                      <button 
                        type="button"
                        onClick={() => setNewAvatarBase64('')}
                        className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewPhotoBase64('');
                    setNewAvatarBase64('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer transition-colors text-slate-600"
                >
                  বাতিল করুন
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow flex items-center gap-1"
                >
                  {isSubmitting ? 'সেভ হচ্ছে...' : 'রিভিউ পাবলিশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox Lightviewer Modal Preview */}
      {activePhotoPreview && (
        <div 
          onClick={() => setActivePhotoPreview(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button 
            onClick={() => setActivePhotoPreview(null)}
            className="absolute top-4 right-4 p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition"
          >
            <X className="h-6 w-6" />
          </button>
          
          <img 
            src={activePhotoPreview} 
            alt="Customer attachment preview full scale screen" 
            className="max-w-full max-h-[90vh] object-contain rounded" 
          />
        </div>
      )}

    </div>
  );
}
