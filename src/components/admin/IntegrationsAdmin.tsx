import React, { useState, useEffect } from 'react';
import { Globe, Code, Key, Save, CheckCircle, HelpCircle } from 'lucide-react';

interface IntegrationsAdminProps {
  userRole: string; // 'Admin' | 'Editor' | 'ReadOnly'
}

export default function IntegrationsAdmin({ userRole }: IntegrationsAdminProps) {
  // Config parameters
  const [pixelId, setPixelId] = useState('');
  const [gaId, setGaId] = useState('');
  const [headerSnippets, setHeaderSnippets] = useState('');
  const [footerSnippets, setFooterSnippets] = useState('');

  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setPixelId(localStorage.getItem('fb_pixel_id') || '');
    setGaId(localStorage.getItem('ga_track_id') || '');
    setHeaderSnippets(localStorage.getItem('raincoat_header_snippets') || '');
    setFooterSnippets(localStorage.getItem('raincoat_footer_snippets') || '');
  }, []);

  const handleSaveConfigs = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    if (userRole !== 'Admin') {
      setMessage('দুঃখিত! পিক্সেল ও ট্র্যাকিং কোড ইন্টিগ্রেশন পরিবর্তন করার ক্ষমতা শুধুমাত্র মূল এডমিনের (Admin) রয়েছে।');
      return;
    }

    // Save configurations
    localStorage.setItem('fb_pixel_id', pixelId.trim());
    localStorage.setItem('ga_track_id', gaId.trim());
    localStorage.setItem('raincoat_header_snippets', headerSnippets);
    localStorage.setItem('raincoat_footer_snippets', footerSnippets);

    setIsSuccess(true);
    setMessage('সকল ট্র্যাকিং পিক্সেল ও কোড মেটা সাকসেসফুলি সেভ হয়েছে এবং সাইটে লাইভ রান করছে!');

    setTimeout(() => setMessage(''), 4000);
  };

  return (
    <form onSubmit={handleSaveConfigs} className="space-y-6 font-sans text-xs sm:text-sm">
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
        
        {/* Title */}
        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200">
          <Globe className="h-4.5 w-4.5 text-indigo-600" />
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">থার্ডপার্টি পিক্সেল ও ট্র্যাকিং ইন্টিগ্রেশন (Facebook, Google & Snippets)</h3>
            <p className="text-[10px] text-slate-400 font-medium">ফেসবুক পিক্সেল, গুগল এনালাইটিক্স বা যেকোনো থার্ডপার্টি লিঙ্কিং কোড হেডার ও ফুটারে ইনজেক্ট করুন।</p>
          </div>
        </div>

        {message && (
          <div className={`p-3.5 border rounded-xl font-bold text-xs ${
            isSuccess 
              ? 'bg-emerald-50 border-emerald-250 text-emerald-800' 
              : 'bg-rose-50 border-rose-250 text-rose-800'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* FB PIXEL */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
            <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase text-indigo-600">
              🔵 Facebook Pixel Integration
            </h4>
            <p className="text-[10px] text-slate-400">এটির মাধ্যমে কাস্টমারের ইভেন্ট ট্র্যাকিং ও কনভার্সন অপ্টিমাইজেশন করা যাবে।</p>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">FACEBOOK PIXEL ID</label>
              <input 
                type="text" 
                placeholder="যেমন: 11029348271032"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:bg-white"
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                disabled={userRole !== 'Admin'}
              />
            </div>
          </div>

          {/* GOOGLE ANALYTICS */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
            <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase text-emerald-600">
              🟢 Google Analytics (Gtag)
            </h4>
            <p className="text-[10px] text-slate-400">আপনার গুগল এনালাইটিক্স অ্যাকাউন্টে লাইভ ট্রাফিক ডেটা ও পেজভিও ম্যাপ হবে।</p>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">MEASUREMENT ID / G-TRACK ID</label>
              <input 
                type="text" 
                placeholder="যেমন: G-XXXXXXX"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:bg-white"
                value={gaId}
                onChange={(e) => setGaId(e.target.value)}
                disabled={userRole !== 'Admin'}
              />
            </div>
          </div>

        </div>

        {/* Dynamic header / footer injection codes */}
        <div className="space-y-4">
          
          {/* Header Snippet Code area */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase">
                <Code className="h-4 w-4 text-orange-500" /> Header Code Snippets (&lt;head&gt;)
              </h4>
              <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-400 font-mono border">হেড শেষ হওয়ার আগে যুক্ত হবে</span>
            </div>
            <p className="text-[10px] text-slate-400">যেকোনো থার্ডপার্টি ভেরিফিকেশন মেটা কোড, ডোমেইন ওনারশিপ ট্যাগ, অথবা কাস্টম CSS এখানে প্রবেশ করান।</p>
            <textarea
              rows={4}
              placeholder="<!-- Insert Header Scripts / Tracking Tags, CSS here -->&#10;<style>&#10;  /* Custom design rules */&#10;</style>"
              className="w-full px-3 py-2 bg-slate-950 text-slate-200 border border-slate-805 rounded-xl text-xs font-mono focus:outline-none"
              value={headerSnippets}
              onChange={(e) => setHeaderSnippets(e.target.value)}
              disabled={userRole !== 'Admin'}
            />
          </div>

          {/* Footer Snippet Code area */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase">
                <Code className="h-4 w-4 text-orange-500" /> Footer Code Snippets (&lt;/body&gt;)
              </h4>
              <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-400 font-mono border">বডি শেষ হওয়ার আগে যুক্ত হবে</span>
            </div>
            <p className="text-[10px] text-slate-400">আউটসাইড চ্যাটবাটন স্ক্রিপ্টস, ফেসবুক কাস্টমার উইজেট বা জাভাস্ক্রিপ্ট ট্যাগ এখানে নিরাপদভাবে লোড করুন।</p>
            <textarea
              rows={4}
              placeholder="<!-- Insert Footer Scripts or JavaScript snippets here -->&#10;<script>&#10;  console.log('App successfully executed tracking code');&#10;</script>"
              className="w-full px-3 py-2 bg-slate-950 text-slate-200 border border-slate-805 rounded-xl text-xs font-mono focus:outline-none"
              value={footerSnippets}
              onChange={(e) => setFooterSnippets(e.target.value)}
              disabled={userRole !== 'Admin'}
            />
          </div>

        </div>

        {/* Submission button */}
        {userRole === 'Admin' && (
          <button
            type="submit"
            className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Save className="h-3.5 w-3.5 text-indigo-400" /> ইন্টিগ্রেশন সেটিংস সংরক্ষণ করুন
          </button>
        )}

      </div>
    </form>
  );
}
