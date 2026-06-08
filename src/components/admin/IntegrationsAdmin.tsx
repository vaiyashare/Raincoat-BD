import React, { useState, useEffect } from 'react';
import { Globe, Code, Key, Save, CheckCircle, HelpCircle, ToggleLeft, ToggleRight, Settings, Info, Activity } from 'lucide-react';

interface IntegrationsAdminProps {
  userRole: string; // 'Admin' | 'Editor' | 'ReadOnly'
}

export default function IntegrationsAdmin({ userRole }: IntegrationsAdminProps) {
  // Config parameters
  const [pixelId, setPixelId] = useState('');
  const [pixelEnabled, setPixelEnabled] = useState(true);
  const [capiEnabled, setCapiEnabled] = useState(false);
  const [advancedMatching, setAdvancedMatching] = useState(true);
  const [capiToken, setCapiToken] = useState('');
  const [testEventEnabled, setTestEventEnabled] = useState(false);
  const [testEventCode, setTestEventCode] = useState('');

  const [gaId, setGaId] = useState('');
  const [headerSnippets, setHeaderSnippets] = useState('');
  const [footerSnippets, setFooterSnippets] = useState('');

  const [deliveryInside, setDeliveryInside] = useState(80);
  const [deliverySub, setDeliverySub] = useState(100);
  const [deliveryOutside, setDeliveryOutside] = useState(130);

  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setPixelId(localStorage.getItem('fb_pixel_id') || '');
    setPixelEnabled(localStorage.getItem('fb_pixel_enabled') !== 'false');
    setCapiEnabled(localStorage.getItem('fb_capi_enabled') === 'true');
    setAdvancedMatching(localStorage.getItem('fb_advanced_matching') !== 'false');
    setCapiToken(localStorage.getItem('fb_capi_token') || '');
    setTestEventEnabled(localStorage.getItem('fb_test_event_enabled') === 'true');
    setTestEventCode(localStorage.getItem('fb_test_event_code') || '');

    setGaId(localStorage.getItem('ga_track_id') || '');
    setHeaderSnippets(localStorage.getItem('raincoat_header_snippets') || '');
    setFooterSnippets(localStorage.getItem('raincoat_footer_snippets') || '');

    setDeliveryInside(Number(localStorage.getItem('raincoat_courier_inside')) || 80);
    setDeliverySub(Number(localStorage.getItem('raincoat_courier_sub')) || 100);
    setDeliveryOutside(Number(localStorage.getItem('raincoat_courier_outside')) || 130);
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
    localStorage.setItem('fb_pixel_enabled', pixelEnabled ? 'true' : 'false');
    localStorage.setItem('fb_capi_enabled', capiEnabled ? 'true' : 'false');
    localStorage.setItem('fb_advanced_matching', advancedMatching ? 'true' : 'false');
    localStorage.setItem('fb_capi_token', capiToken.trim());
    localStorage.setItem('fb_test_event_enabled', testEventEnabled ? 'true' : 'false');
    localStorage.setItem('fb_test_event_code', testEventCode.trim());

    localStorage.setItem('ga_track_id', gaId.trim());
    localStorage.setItem('raincoat_header_snippets', headerSnippets);
    localStorage.setItem('raincoat_footer_snippets', footerSnippets);

    // Save Courier Cargo Charges
    localStorage.setItem('raincoat_courier_inside', String(deliveryInside));
    localStorage.setItem('raincoat_courier_sub', String(deliverySub));
    localStorage.setItem('raincoat_courier_outside', String(deliveryOutside));

    // Dispatch update event so setup triggers live changes immediately
    window.dispatchEvent(new Event('raincoat_pixel_config_updated'));

    setIsSuccess(true);
    setMessage('ফেসবুক পিক্সেল ও কুরিয়ার ডেলিভারি চার্জ সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* FB PIXEL */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase text-indigo-600">
                🔵 Facebook Pixel Integration (PixelYourSite Style)
              </h4>
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${pixelEnabled ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                  {pixelEnabled ? 'Active' : 'Disabled'}
                </span>
                <button
                  type="button"
                  disabled={userRole !== 'Admin'}
                  onClick={() => setPixelEnabled(!pixelEnabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    pixelEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                  } ${userRole !== 'Admin' ? 'opacity-55 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      pixelEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Pixel ID */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">META PIXEL ID</label>
                <input 
                  type="text" 
                  placeholder="যেমন: 11029348271032"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-indigo-500"
                  value={pixelId}
                  onChange={(e) => setPixelId(e.target.value)}
                  disabled={userRole !== 'Admin'}
                />
              </div>

              {/* Advanced Matching */}
              <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/50 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 font-bold text-slate-800 text-[11px]">
                    🛡️ Enable Advanced Matching
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    কাস্টমারের নাম, ফোন নম্বর, ঠিকানা ও ইমেইল মেটার কাছে সুরক্ষিত হ্যাশ ফরমেটে পাঠিয়ে কনভার্সন ম্যাচিং আরও নিখুঁত করুন।
                  </p>
                </div>
                <button
                  type="button"
                  disabled={userRole !== 'Admin'}
                  onClick={() => setAdvancedMatching(!advancedMatching)}
                  className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    advancedMatching ? 'bg-indigo-600' : 'bg-slate-200'
                  } ${userRole !== 'Admin' ? 'opacity-55 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      advancedMatching ? 'translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Conversion API Toggle */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 font-bold text-slate-800 text-[11px] uppercase">
                      ⚡ Enable Conversion API (CAPI)
                    </div>
                    <p className="text-[9px] text-slate-400 leading-normal">
                      ব্রাউজার অ্যাড-ব্লকার এড়াতে ব্রাউজার সার্ভার ডুপ্লিকেট পিক্সেল কুয়েরি সরাসরি মেটার কাছে পাঠান।
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={userRole !== 'Admin'}
                    onClick={() => setCapiEnabled(!capiEnabled)}
                    className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      capiEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                    } ${userRole !== 'Admin' ? 'opacity-55 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        capiEnabled ? 'translate-x-3.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {capiEnabled && (
                  <div className="pt-2 animate-fade-in space-y-1.5">
                    <label className="block text-[9px] font-semibold text-slate-500 uppercase tracking-wide">CONVERSION API ACCESS TOKEN</label>
                    <textarea 
                      rows={2}
                      placeholder="যেমন: EAAGno4ZB... (মেটা বিজনেস ম্যানেজার থেকে জেনারেট করা টোকেন দিন)"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-800 font-mono focus:outline-none focus:border-indigo-500 leading-normal"
                      value={capiToken}
                      onChange={(e) => setCapiToken(e.target.value)}
                      disabled={userRole !== 'Admin'}
                    />
                  </div>
                )}
              </div>

              {/* Test Event Code Section */}
              <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 font-bold text-slate-800 text-[11px] uppercase">
                      🔬 Enable Test Event mode
                    </div>
                    <p className="text-[9px] text-slate-400 leading-normal">
                      ফেসবুক ইভেন্ট ম্যানেজার টেস্ট ইভেন্টস ট্যাবে লাইভ টেস্ট করার জন্য এই অপশনটি চালু করুন।
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={userRole !== 'Admin'}
                    onClick={() => setTestEventEnabled(!testEventEnabled)}
                    className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      testEventEnabled ? 'bg-amber-600' : 'bg-slate-200'
                    } ${userRole !== 'Admin' ? 'opacity-55 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        testEventEnabled ? 'translate-x-3.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {testEventEnabled && (
                  <div className="pt-2 animate-fade-in space-y-1">
                    <label className="block text-[9px] font-semibold text-slate-500 uppercase tracking-wide">TEST EVENT CODE</label>
                    <input 
                      type="text"
                      placeholder="যেমন: TEST39281 (ইভেন্ট ম্যানেজার পেজ থেকে কপি করুন)"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:border-amber-500"
                      value={testEventCode}
                      onChange={(e) => setTestEventCode(e.target.value)}
                      disabled={userRole !== 'Admin'}
                    />
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* GOOGLE ANALYTICS */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase text-emerald-600 pb-2 border-b border-slate-100">
              🟢 Google Analytics (Gtag)
            </h4>
            <p className="text-[10px] text-slate-400">আপনার গুগল এনালাইটিক্স অ্যাকাউন্টে লাইভ ট্রাফিক ডেটা ও পেজভিও ম্যাপ হবে।</p>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">MEASUREMENT ID / G-TRACK ID</label>
              <input 
                type="text" 
                placeholder="যেমন: G-XXXXXXX"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-emerald-500"
                value={gaId}
                onChange={(e) => setGaId(e.target.value)}
                disabled={userRole !== 'Admin'}
              />
            </div>
            
            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-[9.5px] leading-relaxed text-slate-500 space-y-1 text-left font-sans">
              <span className="font-bold text-slate-700 block">💡 পিক্সেল ট্র্যাকিং টিপস:</span>
              <p>১. পিক্সেল পরিবর্তন করার পর ব্রাউজার রিফ্রেশ দিয়ে চেক করতে পারেন।</p>
              <p>২. ফেইসবুক পিক্সেল হেল্পার এক্সটেনশন দিয়ে ইভেন্ট সঠিকভাবে ট্রিগার হচ্ছে কিনা চেক করুন।</p>
              <p>৩. কাস্টমার পেমেন্ট বা অর্ডার পেজ ভিজিট করলেই <strong>PageView</strong>, <strong>InitiateCheckout</strong> এবং <strong>Purchase</strong> ইভেন্ট ফায়ার করা হবে।</p>
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

        {/* 🚚 Courier Delivery Charges Configuration Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Settings className="h-4 w-4 text-orange-600" />
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs uppercase text-orange-600">
                🚚 কুরিয়ার ডেলিভারি চার্জ নির্ধারণ (Courier Delivery Charges Setup)
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">ঢাকা সিটি, সাব ঢাকা এলাকা এবং ঢাকার বাইরের অঞ্চলের জন্য ডেলিভারি চার্জ সেট করুন।</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-slate-600 font-black uppercase mb-1">ঢাকা সিটির মধ্যে</label>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-400">৳</span>
                <input 
                  type="number" 
                  value={deliveryInside}
                  onChange={(e) => setDeliveryInside(Number(e.target.value) || 0)}
                  disabled={userRole !== 'Admin'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 font-bold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-600 font-black uppercase mb-1">সাব ঢাকা এলাকা</label>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-400">৳</span>
                <input 
                  type="number" 
                  value={deliverySub}
                  onChange={(e) => setDeliverySub(Number(e.target.value) || 0)}
                  disabled={userRole !== 'Admin'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 font-bold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-600 font-black uppercase mb-1">ঢাকার বাহিরে</label>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-400">৳</span>
                <input 
                  type="number" 
                  value={deliveryOutside}
                  onChange={(e) => setDeliveryOutside(Number(e.target.value) || 0)}
                  disabled={userRole !== 'Admin'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submission button */}
        {userRole === 'Admin' && (
          <button
            type="submit"
            className="py-2.5 px-6 bg-indigo-650 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Save className="h-3.5 w-3.5 text-indigo-200" /> পিক্সেল ও ইন্টিগ্রেশন সেটিংস সংরক্ষণ করুন
          </button>
        )}

      </div>
    </form>
  );
}
