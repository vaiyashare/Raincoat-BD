import React, { useState } from 'react';
import { Mail, Check, AlertCircle, Loader2 } from 'lucide-react';
import { addSubscriber } from '../lib/firebase';

export default function SubscriptionForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setStatus('error');
      setErrorMessage('অনুগ্রহ করে আপনার সঠিক ইমেইলটি লিখুন।');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setStatus('error');
      setErrorMessage('ইমেইল এড্রেসটির ফরম্যাট সঠিক নয়। যেমন: example@gmail.com');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      await addSubscriber(email.trim());
      setStatus('success');
      setEmail('');
    } catch (err: any) {
      console.error('Subscription error:', err);
      setStatus('error');
      setErrorMessage('দুঃখিত! কোথাও একটি সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    }
  };

  return (
    <section className="py-14 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-850 px-4 text-center relative overflow-hidden">
      {/* Decorative ambient spots */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-2xl relative z-10 space-y-6">
        <div className="inline-flex p-3 bg-orange-550/10 border border-orange-500/20 rounded-2xl text-orange-400 mb-2">
          <Mail className="h-6 w-6" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-white font-sans tracking-tight">
            সর্বশেষ অফার ও আপডেট পেতে সাবস্ক্রাইব করুন
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm font-sans max-w-md mx-auto leading-relaxed">
            কোনো স্প্যাম মেইল নয়! নতুন প্রিমিয়াম স্টক রিলিজ, ডিসকাউন্ট কুপন ও এক্সক্লুসিভ অফারের তথ্য সরাসরি ইমেইলে পেয়ে যান।
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-emerald-950/40 border border-emerald-900/60 p-6 rounded-2xl max-w-md mx-auto flex flex-col items-center gap-3 text-center animate-fadeIn">
            <div className="p-2 bg-emerald-500/15 rounded-full text-emerald-400">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-emerald-400 font-extrabold text-sm sm:text-base font-sans">
                ধন্যবাদ! সাবস্ক্রিপশন সফল হয়েছে।
              </h4>
              <p className="text-slate-350 text-xs mt-1 font-sans">
                আপনি সফলভাবে Monsoon Gear সাবস্ক্রাইবার তালিকায় যুক্ত হয়েছেন।
              </p>
            </div>
            <button
              onClick={() => setStatus('idle')}
              className="mt-2 text-xs text-slate-400 hover:text-white transition underline font-semibold font-sans"
            >
              অন্য ইমেইল সাবস্ক্রাইব করতে ক্লিক করুন
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 relative">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={email}
                  disabled={status === 'submitting'}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === 'error') setStatus('idle');
                  }}
                  placeholder="আপনার সঠিক ইমেইল লিখুন..."
                  className="w-full pl-4 pr-10 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500 font-sans tracking-wide transition-all disabled:opacity-50"
                  required
                />
                <div className="absolute inset-y-0 right-3 flex items-center text-slate-500 pointer-events-none">
                  <Mail className="h-4 w-4" />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg hover:shadow-orange-500/10 disabled:opacity-60 shrink-0 font-sans"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    প্রসেস হচ্ছে...
                  </>
                ) : (
                  'সাবস্ক্রাইব করুন'
                )}
              </button>
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-1.5 text-red-400 text-xs text-left px-1 justify-center font-sans">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
