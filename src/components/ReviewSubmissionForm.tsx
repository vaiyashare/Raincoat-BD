import React, { useState } from 'react';
import { 
  Star, 
  Camera, 
  Upload, 
  CheckCircle, 
  ThumbsUp, 
  ArrowLeft,
  Smartphone,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { CustomerReview } from '../types';
import { saveReviewToFirestore } from '../lib/firebase';

interface ReviewSubmissionFormProps {
  onBack: () => void;
}

export default function ReviewSubmissionForm({ onBack }: ReviewSubmissionFormProps) {
  const [writerName, setWriterName] = useState('');
  const [writerPhone, setWriterPhone] = useState('');
  const [writerRating, setWriterRating] = useState(5);
  const [writerText, setWriterText] = useState('');
  const [writerPhotoBase64, setWriterPhotoBase64] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Convert uploaded image file to Base64 String
  const handlePhotoUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("দুঃখিত, ২ মেগাবাইটের চেয়ে ছোট সাইজের ছবি আপলোড করুন!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setWriterPhotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');

    if (!writerName.trim()) return setFormError('দয়া করে আপনার নাম লিখুন!');
    if (!writerPhone.trim()) return setFormError('আপনার সচল মোবাইল নম্বর লিখুন!');
    if (!writerText.trim()) return setFormError('আপনার রিভিউ মন্তব্যটি টাইপ করুন!');

    setIsSubmittingReview(true);

    try {
      const maskedPhone = writerPhone.length >= 11 
        ? `${writerPhone.slice(0, 4)}XXXXX${writerPhone.slice(-2)}` 
        : writerPhone;

      const newReview: CustomerReview = {
        id: `rev-client-${Date.now()}`,
        customerName: writerName,
        phoneNumberMasked: maskedPhone,
        avatarUrl: '', // generated dynamically inside dashboard based on first initials
        reviewDate: 'আজকে',
        rating: writerRating,
        messages: [
          { id: 'm-1', sender: 'client', text: writerText, time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) },
          { id: 'm-2', sender: 'admin', text: 'অসংখ্য ধন্যবাদ আপনাদের সুন্দর পজিটিভ ফিডব্যাকের জন্য! গুণগত মান সুনিশ্চিত করাই আমাদের প্রধাণ উদ্দেশ্য।', time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) }
        ],
        productPhoto: writerPhotoBase64 || undefined,
        verifiedPurchase: false // starts false, moderator reviews and approves in Advanced Plugins panel!
      };

      await saveReviewToFirestore(newReview);

      setFormSuccess('ধন্যবাদ! আপনার ফটো রিভিউটি এডমিন মডারেশনের জন্য সফলভাবে জমা হয়েছে। রিভিউটি রিভিউ তালিকায় শীঘ্রই দৃশ্যমান হবে!');
      
      // Clear inputs
      setWriterName('');
      setWriterPhone('');
      setWriterText('');
      setWriterPhotoBase64('');
      setWriterRating(5);
    } catch (err: any) {
      setFormError('দুঃখিত, রিভিউটি সেভ করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-2xl relative overflow-hidden font-sans text-slate-800">
      {/* Decorative WhatsApp styling/icon background */}
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <MessageSquare className="h-48 w-48 text-emerald-600" />
      </div>

      <div className="relative mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-bold text-xs cursor-pointer mb-2 group transition"
          >
            <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition duration-200" /> কাস্টমার রিভিউ ও প্রোডাক্ট ছবি
          </button>
          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold rounded-full border border-emerald-100 uppercase tracking-wider inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> সিকিউর মডারেশন
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">
            আপনার নির্ভরযোগ্য কাস্টমার রিভিউ ও রিয়েল ছবি দিন
          </h3>
          <p className="text-slate-500 text-[11px] sm:text-xs mt-1">
            আপনার অভিজ্ঞতা আমাদের অন্যান্য গ্রাহকদের ক্রয়ের সিদ্ধান্ত নিতে অত্যন্ত সাহায্য করবে।
          </p>
        </div>
      </div>

      {formSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-3 mb-6 animate-fade-in shadow-xs">
          <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
          <div>
            <p>{formSuccess}</p>
          </div>
        </div>
      )}

      {formError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-bold flex items-center gap-2 mb-6 shadow-xs">
          <span>⚠️ {formError}</span>
        </div>
      )}

      <form onSubmit={handleReviewSubmit} className="space-y-6 max-w-3xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-[11px] text-slate-600 font-bold uppercase mb-1.5">আপনার শুভ নাম (Full Name)</label>
            <input 
              type="text" 
              placeholder="যেমন: শামীম রেজা"
              value={writerName}
              onChange={(e) => setWriterName(e.target.value)}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 focus:bg-white transition" 
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-600 font-bold uppercase mb-1.5">মোবাইল নম্বর (ডেলিভারি ট্র্যাকিং এর জন্য)</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-400">
                <Smartphone className="h-4 w-4" />
              </span>
              <input 
                type="tel" 
                placeholder="017XXXXXXXX"
                value={writerPhone}
                onChange={(e) => setWriterPhone(e.target.value)}
                className="w-full text-xs p-3 pl-9 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 focus:bg-white transition" 
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">নিরাপত্তার স্বার্থে আপনার নম্বরের মাঝের অংশ গোপন রাখা হবে (যেমন: 017XXXXX49)</span>
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-slate-600 font-bold uppercase mb-1.5">রেটিং স্টার নির্ধারণ করুন</label>
          <div className="flex gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-3 w-max">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                type="button"
                key={num}
                onClick={() => setWriterRating(num)}
                className="p-1 hover:scale-115 active:scale-95 transition duration-150 cursor-pointer"
              >
                <Star className={`h-6 w-6 transition ${num <= writerRating ? 'fill-current text-amber-500 font-bold scale-105' : 'text-slate-300'}`} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-slate-600 font-bold uppercase mb-1.5">আপনার মহামূল্যবান মন্তব্য (চ্যাট স্টাইল মন্তব্য)</label>
          <textarea 
            rows={4}
            placeholder="রেনকোটের কাপড় লীক প্রুফিং, জিপার কোয়ালিটি বা সাইজ ফিটিং কেমন লেগেছে তা একটু বর্ণনা করুন..."
            value={writerText}
            onChange={(e) => setWriterText(e.target.value)}
            className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 leading-normal focus:bg-white transition" 
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-600 font-bold uppercase mb-1.5">ব্যবহার করা অবস্থার বাস্তব ছবি সংযুক্তি (রিয়েল প্রোডাক্ট ছবি, সর্বোচ্চ ২ মেগাবাইট)</label>
          <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50 flex flex-col items-center justify-center min-h-[120px] hover:bg-slate-50 transition">
            {writerPhotoBase64 ? (
              <div className="flex flex-col items-center gap-3 text-xs text-slate-800">
                <div className="relative rounded-lg overflow-hidden border border-slate-200 max-h-32 max-w-xs bg-slate-100 p-1">
                  <img 
                    src={writerPhotoBase64} 
                    alt="Uploaded preview" 
                    className="object-cover max-h-28 rounded-md" 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="font-bold text-emerald-600">ছবিটি সফলভাবে যুক্ত হয়েছে!</span>
                  <button type="button" onClick={() => setWriterPhotoBase64('')} className="text-xs text-rose-500 font-bold underline cursor-pointer ml-1">মুছে ফেলুন</button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-2.5 w-full h-full">
                <Upload className="h-7 w-7 text-slate-400 animate-pulse" />
                <span className="text-xs text-slate-500 font-semibold">আপনার রেনকোটের ছবি বাছাই করুন (মোবাইল থেকে সরাসরি ছবি তুলুন বা আপলোড করুন)</span>
                <span className="text-[10px] text-slate-400">সমর্থিত ফরম্যাট: PNG, JPG, JPEG (সর্বোচ্চ ২ মেগাবাইট)</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUploadChange}
                  className="hidden" 
                />
              </label>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="text-[11px] text-slate-400 leading-tight">
            🛡️ আপনার রিভিউটি সফলভাবে সাবমিট করার পরে তা এডমিন মডারেশন দ্বারা অনুমোদিত হলেই সাইটে চ্যাট স্ক্রিনশট হিসেবে লাইভ প্রদর্শন করা হবে।
          </div>
          <button
            type="submit"
            disabled={isSubmittingReview}
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shrink-0 w-full sm:w-auto"
          >
            <ThumbsUp className="h-4.5 w-4.5" />
            {isSubmittingReview ? 'সাবমিট হচ্ছে...' : 'হোয়াটসঅ্যাপ রিভিউ সাবমিট করুন'}
          </button>
        </div>
      </form>
    </div>
  );
}
