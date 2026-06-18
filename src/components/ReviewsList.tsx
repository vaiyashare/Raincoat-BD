import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MessageSquare, 
  CheckCheck, 
  Sparkles, 
  Smartphone, 
  Award, 
  ThumbsUp, 
  Camera
} from 'lucide-react';
import { CUSTOMER_REVIEWS } from '../data';
import { CustomerReview } from '../types';
import { getCustomReviewsFromFirestore } from '../lib/firebase';

export default function ReviewsList() {
  const [activeReviewId, setActiveReviewId] = useState<string>('rev-1');
  const [filterRating, setFilterRating] = useState<'all' | '5'>('all');
  
  // Custom Firestore Reviews backing state
  const [customReviews, setCustomReviews] = useState<CustomerReview[]>(() => {
    const cached = localStorage.getItem('raincoat_custom_reviews_fallback');
    if (cached) {
      try {
        return JSON.parse(cached).filter((r: any) => r.verifiedPurchase);
      } catch (_) {}
    }
    return CUSTOMER_REVIEWS;
  });

  // Fetch approved custom reviews from Firestore on mount
  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await getCustomReviewsFromFirestore();
        if (res) {
          // Merge only approved reviews to client side visible array
          setCustomReviews(res.filter(r => r.verifiedPurchase));
        }
      } catch (err) {
        console.warn("Could not load custom client reviews:", err);
      }
    }
    loadReviews();
  }, []);

  // Merge custom + static reviews
  const allReviews = customReviews;

  const filteredReviews = allReviews.filter(r => {
    if (filterRating === '5') {
      return r.rating === 5;
    }
    return true;
  });

  const selectedReview = filteredReviews.find(r => r.id === activeReviewId) || filteredReviews[0] || CUSTOMER_REVIEWS[0];

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden" id="customer-reviews">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <MessageSquare className="h-48 w-48 text-cyan-200" />
      </div>

      <div className="relative mb-5 text-center max-w-2xl mx-auto">
        <span className="px-2.5 py-0.5 bg-orange-500/10 text-orange-400 text-[10px] sm:text-xs font-semibold rounded-full border border-orange-500/20 uppercase tracking-wider inline-flex items-center gap-1 font-sans">
          <Award className="h-3 w-3" /> শতভাগ কাস্টমার সন্তুষ্টি
        </span>
        <h3 className="text-lg sm:text-2xl font-extrabold text-white mt-1.5 font-sans">
          আমাদের গ্রাহকদের মনকাড়া অভিজ্ঞতা (WhatsApp Reviews)
        </h3>
        <p className="text-slate-400 text-[11px] sm:text-sm mt-1 sm:mt-2 font-sans">
          আমরা কোনো মিথ্যা প্রমোশন করি না। হাজারো খুশি গ্রাহকদের হোয়াটসঅ্যাপ চ্যাটের স্ক্রিনশটের বাস্তব রূপ নিচে দেওয়া হলো।
        </p>

        {/* Rating showcase */}
        <div className="flex flex-row items-center justify-center gap-3 mt-3 p-1.5 sm:p-2.5 bg-slate-800/50 rounded-xl max-w-xs sm:max-w-md mx-auto border border-slate-800 text-xs">
          <div className="flex text-amber-400 gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
            ))}
          </div>
          <span className="text-[11px] sm:text-sm font-semibold font-sans">
            ৫.০ রেটিং (১০০০+ ডেলিভারি সম্পূর্ণ)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
        {/* Toggle selectors left column */}
        <div className="lg:col-span-5 space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between px-1 mb-1">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest font-sans">
              গ্রাহক তালিকা:
            </p>
            <span className="text-[9px] text-slate-500 font-sans">
              ট্যাপ করে চ্যাট দেখুন
            </span>
          </div>

          {/* Bengali Ratings Toggle Filter Bar */}
          <div className="flex bg-slate-950/70 p-1 rounded-xl border border-slate-800/85 mb-3 gap-1">
            <button
              onClick={() => setFilterRating('all')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] sm:text-xs transition-all font-bold text-center flex items-center justify-center gap-1 cursor-pointer ${
                filterRating === 'all'
                  ? 'bg-blue-600 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
              }`}
            >
              সবগুলো রিভিউ ({allReviews.length})
            </button>
            <button
              onClick={() => setFilterRating('5')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] sm:text-xs transition-all font-bold text-center flex items-center justify-center gap-1 cursor-pointer ${
                filterRating === '5'
                  ? 'bg-amber-600 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
              }`}
            >
              <Star className="h-3 w-3 fill-current text-white inline-block -mt-0.5" />
              ৫-স্টার ({allReviews.filter(r => r.rating === 5).length})
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5 sm:gap-2 max-h-[300px] lg:max-h-[360px] overflow-y-auto pr-1">
            {filteredReviews.map((review) => {
              const isActive = review.id === selectedReview.id;
              // Safe initial characters extractor
              const initials = review.customerName ? review.customerName.charAt(0) : 'K';
              return (
                <button
                  key={review.id}
                  onClick={() => setActiveReviewId(review.id)}
                  className={`flex items-center gap-1.5 sm:gap-3 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-300 text-left border cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-blue-500/50 shadow-md shadow-blue-500/5'
                      : 'bg-slate-800/30 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                  id={`review-toggle-${review.id}`}
                >
                  {review.avatarUrl ? (
                    <img
                      src={review.avatarUrl}
                      alt={review.customerName}
                      className="w-7 h-7 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-700 shrink-0"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-slate-700 text-slate-350 flex items-center justify-center font-black text-xs shrink-0 font-mono">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs font-bold truncate font-sans text-slate-200">
                        {review.customerName}
                      </span>
                      <span className="text-[8px] text-slate-500 shrink-0 font-sans hidden sm:inline">
                        {review.reviewDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[9px] text-slate-400 truncate font-sans">
                        {review.phoneNumberMasked}
                      </p>
                      {/* Interactive star ratings indicator */}
                      <span className="flex text-amber-400 text-[8px] gap-0.5 font-sans">
                        {Array.from({ length: review.rating }).map((_, i) => (
                           <Star key={i} className="h-2 w-2 fill-current" />
                        ))}
                      </span>
                    </div>
                    {review.productPhoto && (
                      <span className="text-[8.5px] text-indigo-400 flex items-center gap-0.5 mt-0.5 font-sans shrink-0 block">
                        <Camera className="h-2 w-2" /> ফটো সংযুক্ত
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 sm:p-4 mt-3 sm:mt-6">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-sans mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> ওয়াটারপ্রুফ রানিং টেস্টেড
            </h4>
            <p className="text-[11px] text-slate-400 leading-normal font-sans">
              আমাদের সকল রেনকোট বাইকিং ও হেভি রেইন টেস্ট করার পর বাজারে আনা হয়। প্যান্টের কোমর ও জ্যাকেটের হাত সম্পূর্ণ ওয়াটারপ্রুফ ইলাস্টিক প্রযুক্তি দ্বারা সুরক্ষিত।
            </p>
          </div>
        </div>

        {/* Dynamic WhatsApp screen right column */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="w-full max-w-xs sm:max-w-md mx-auto bg-slate-950 border-2 sm:border-4 border-slate-700 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden h-[300px] sm:h-[480px] shrink-0 flex flex-col">
            {/* Speaker bar */}
            <div className="w-24 sm:w-32 h-3.5 sm:h-4.5 bg-slate-700 mx-auto rounded-b-2xl absolute top-0 left-1/2 -translate-x-1/2 z-35 flex items-center justify-center">
              <div className="w-8 sm:w-12 h-0.5 sm:h-1 bg-slate-800 rounded-full"></div>
            </div>

            {/* WA Header */}
            <div className="bg-[#075e54] p-1.5 pt-4 pb-1 sm:p-3 sm:pt-6 sm:pb-2.5 flex items-center justify-between text-white relative z-20 shadow-md">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="relative">
                  {selectedReview.avatarUrl ? (
                    <img
                      src={selectedReview.avatarUrl}
                      alt={selectedReview.customerName}
                      className="w-7 h-7 sm:w-10 sm:h-10 rounded-full object-cover border border-emerald-600 shrink-0"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                      {selectedReview.customerName ? selectedReview.customerName.charAt(0) : 'K'}
                    </div>
                  )}
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-400 border-2 border-[#075e54] rounded-full absolute bottom-0 right-0 animate-ping"></div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 border-2 border-[#075e54] rounded-full absolute bottom-0 right-0"></div>
                </div>
                <div>
                  <h4 className="text-[11px] sm:text-sm font-bold font-sans flex items-center gap-1">
                    {selectedReview.customerName} <span className="text-[8px] bg-emerald-600/60 px-1 py-0.2 sm:py-0.5 rounded font-sans text-emerald-200">ক্রেতা</span>
                  </h4>
                  <p className="text-[8px] sm:text-[9px] text-emerald-100 font-sans">অনলাইন বা চ্যাট রানিং</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-emerald-100">
                <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-80" />
                <span className="text-[8px] sm:text-[9px] bg-emerald-800 text-emerald-100 px-1.5 py-0.5 rounded font-mono">ভেরিফাইড</span>
              </div>
            </div>

            {/* WA Chat Body background */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 flex flex-col relative" style={{
              backgroundColor: '#efeae2',
              backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}>
              {/* Security notice */}
              <div className="mx-auto bg-amber-100/90 border border-amber-200 rounded-lg p-1.5 sm:p-2 max-w-[90%] sm:max-w-[85%] text-slate-800 text-[8px] sm:text-[10px] text-center shadow-sm relative z-10 font-sans leading-tight">
                🔒 এন্ড-টু-এন্ড এনক্রিপ্টেড। এই চ্যাটটি ব্যবসায়ী দ্বারা অনুমোদিত ও সত্য।
              </div>

              {selectedReview.messages.map((msg) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 shadow-sm text-[10px] sm:text-xs relative ${
                      isAdmin
                        ? 'bg-[#d9fdd3] text-slate-900 self-end rounded-tr-none'
                        : 'bg-white text-slate-900 self-start rounded-tl-none'
                    }`}
                  >
                    <p className="font-sans leading-snug break-words pr-4 whitespace-pre-line">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 text-[8px] sm:text-[9px] text-slate-400 mt-0.5 sm:mt-1 self-end">
                      <span className="font-sans shrink-0">{msg.time}</span>
                      {isAdmin && <CheckCheck className="h-2.5 w-2.5 text-sky-500 shrink-0" />}
                    </div>
                  </div>
                );
              })}

              {/* Real Photo Attachment within the Whatsapp Screen! Highly Interactive */}
              {selectedReview.productPhoto && (
                <div className="max-w-[80%] self-start bg-white p-1 rounded-xl shadow-md space-y-1">
                  <div className="relative rounded-lg overflow-hidden border border-slate-100 max-h-36 sm:max-h-48 bg-slate-900 flex items-center justify-center">
                    <img 
                      src={selectedReview.productPhoto} 
                      alt="Product review attach" 
                      className="object-cover max-h-32 sm:max-h-44 w-full" 
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-[8px] text-slate-400 px-1 block text-right">গ্রাহক প্রেরিত ছবি</span>
                </div>
              )}
            </div>

            {/* WA Footer */}
            <div className="bg-[#f0f2f5] p-1.5 sm:p-2 flex items-center gap-1.5 sm:gap-2 border-t border-slate-200">
              <div className="flex-1 bg-white rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 text-slate-400 text-[8px] sm:text-[10px] font-sans flex items-center justify-between border border-slate-200 shadow-sm">
                <span>মেসেজ টাইপ করুন...</span>
                <span>😊</span>
              </div>
              <div className="bg-[#00a884] text-white p-1 sm:p-1.5 rounded-full shadow-sm shrink-0">
                <ThumbsUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CLIENT FEEDBACK SUBMISSION BANNER LINK */}
      <div className="mt-8 pt-8 border-t border-slate-800 max-w-4xl mx-auto font-sans text-center space-y-3">
        <p className="text-xs text-slate-400 leading-normal">
          আপনি কি ইতিমধ্যে আমাদের রেনকোট ব্যবহার করছেন? আপনার জাদুকরী ফিডব্যাকের ছবি ও বিস্তারিত রিভিউ শেয়ার করতে এখানে কাস্টম পেইজে যান।
        </p>
        <button
          onClick={() => {
            window.history.pushState(null, '', '/write-review');
            window.dispatchEvent(new Event('popstate'));
          }}
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer transition shadow-lg inline-flex"
        >
          <Camera className="h-4 w-4" /> কাস্টমার রিভিউ ও ছবি সরাসরি আপলোড করুন
        </button>
      </div>
    </div>
  );
}
