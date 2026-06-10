import React, { useState, useEffect } from 'react';
import { Globe, Code, Key, Save, CheckCircle, HelpCircle, ToggleLeft, ToggleRight, Settings, Info, Activity } from 'lucide-react';
import { getIntegrationsSettingsFromFirestore, saveIntegrationsSettingsToFirestore } from '../../lib/firebase';

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

  const [tiktokPixelId, setTiktokPixelId] = useState('');
  const [tiktokPixelEnabled, setTiktokPixelEnabled] = useState(true);

  const [deliveryInside, setDeliveryInside] = useState(80);
  const [deliverySub, setDeliverySub] = useState(100);
  const [deliveryOutside, setDeliveryOutside] = useState(130);

  // Automated WhatsApp states
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappProvider, setWhatsappProvider] = useState<'ultramsg' | 'greenapi' | 'custom_webhook'>('ultramsg');
  const [whatsappInstanceId, setWhatsappInstanceId] = useState('');
  const [whatsappToken, setWhatsappToken] = useState('');
  const [whatsappMessageTemplate, setWhatsappMessageTemplate] = useState(`প্রিয় {customer_name},
আপনার রেইনকোটের অর্ডারটি সফলভাবে গৃহীত হয়েছে! 🎉

🛍️ অর্ডার বিবরণ:
- অর্ডার আইডি: #{order_id}
- সাইজ: {selected_size}
- কালার: {selected_color}
- পরিশোধযোগ্য সর্বমোট মূল্য: {order_price} TK (ক্যাশ অন ডেলিভারি, সম্পূর্ণ ফ্রি ডেলিভারি)
- ডেলিভারি ঠিকানা: {delivery_address}

পরবর্তী ১২ ঘণ্টার মধ্যে আমাদের কাস্টমার রিপ্রেজেন্টেটিভ আপনার মোবাইল নাম্বারে কল করে অর্ডারটি নিশ্চিত করবেন। অনুগ্রহ করে আপনার মোবাইল ফোনটি সচল রাখুন। ধন্যবাদ আমাদের সাথে থাকার জন্য! 😊`);

  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // 1. Initial local setup from localStorage
    const localPixelId = localStorage.getItem('fb_pixel_id') || '';
    const localPixelEnabled = localStorage.getItem('fb_pixel_enabled') !== 'false';
    const localCapiEnabled = localStorage.getItem('fb_capi_enabled') === 'true';
    const localAdvancedMatching = localStorage.getItem('fb_advanced_matching') !== 'false';
    const localCapiToken = localStorage.getItem('fb_capi_token') || '';
    const localTestEventEnabled = localStorage.getItem('fb_test_event_enabled') === 'true';
    const localTestEventCode = localStorage.getItem('fb_test_event_code') || '';

    const localGaId = localStorage.getItem('ga_track_id') || '';
    const localHeaderSnippets = localStorage.getItem('raincoat_header_snippets') || '';
    const localFooterSnippets = localStorage.getItem('raincoat_footer_snippets') || '';

    const localTiktokPixelId = localStorage.getItem('tiktok_pixel_id') || '';
    const localTiktokPixelEnabled = localStorage.getItem('tiktok_pixel_enabled') !== 'false';

    const localDeliveryInside = Number(localStorage.getItem('raincoat_courier_inside')) || 80;
    const localDeliverySub = Number(localStorage.getItem('raincoat_courier_sub')) || 100;
    const localDeliveryOutside = Number(localStorage.getItem('raincoat_courier_outside')) || 130;

    // WhatsApp configs local setup
    const localWhatsappEnabled = localStorage.getItem('raincoat_whatsapp_enabled') === 'true';
    const localWhatsappProvider = (localStorage.getItem('raincoat_whatsapp_provider') || 'ultramsg') as 'ultramsg' | 'greenapi' | 'custom_webhook';
    const localWhatsappInstanceId = localStorage.getItem('raincoat_whatsapp_instance_id') || '';
    const localWhatsappToken = localStorage.getItem('raincoat_whatsapp_token') || '';
    const localWhatsappTemplate = localStorage.getItem('raincoat_whatsapp_template') || '';

    setPixelId(localPixelId);
    setPixelEnabled(localPixelEnabled);
    setCapiEnabled(localCapiEnabled);
    setAdvancedMatching(localAdvancedMatching);
    setCapiToken(localCapiToken);
    setTestEventEnabled(localTestEventEnabled);
    setTestEventCode(localTestEventCode);
    setGaId(localGaId);
    setHeaderSnippets(localHeaderSnippets);
    setFooterSnippets(localFooterSnippets);

    setTiktokPixelId(localTiktokPixelId);
    setTiktokPixelEnabled(localTiktokPixelEnabled);

    setDeliveryInside(localDeliveryInside);
    setDeliverySub(localDeliverySub);
    setDeliveryOutside(localDeliveryOutside);

    setWhatsappEnabled(localWhatsappEnabled);
    setWhatsappProvider(localWhatsappProvider);
    setWhatsappInstanceId(localWhatsappInstanceId);
    setWhatsappToken(localWhatsappToken);
    if (localWhatsappTemplate) {
      setWhatsappMessageTemplate(localWhatsappTemplate);
    }

    // 2. Load latest settings asynchronously from Firestore
    getIntegrationsSettingsFromFirestore().then((fbSettings) => {
      if (fbSettings) {
        setPixelId(fbSettings.fb_pixel_id || '');
        setPixelEnabled(fbSettings.fb_pixel_enabled !== false);
        setCapiEnabled(fbSettings.fb_capi_enabled === true);
        setAdvancedMatching(fbSettings.fb_advanced_matching !== false);
        setCapiToken(fbSettings.fb_capi_token || '');
        setTestEventEnabled(fbSettings.fb_test_event_enabled === true);
        setTestEventCode(fbSettings.fb_test_event_code || '');

        setGaId(fbSettings.ga_track_id || '');
        setHeaderSnippets(fbSettings.raincoat_header_snippets || '');
        setFooterSnippets(fbSettings.raincoat_footer_snippets || '');

        setTiktokPixelId(fbSettings.tiktok_pixel_id || '');
        setTiktokPixelEnabled(fbSettings.tiktok_pixel_enabled !== false);

        setDeliveryInside(fbSettings.raincoat_courier_inside || 80);
        setDeliverySub(fbSettings.raincoat_courier_sub || 100);
        setDeliveryOutside(fbSettings.raincoat_courier_outside || 130);

        // WhatsApp remote setup mapping
        setWhatsappEnabled(fbSettings.whatsapp_enabled === true);
        setWhatsappProvider(fbSettings.whatsapp_provider || 'ultramsg');
        setWhatsappInstanceId(fbSettings.whatsapp_instance_id || '');
        setWhatsappToken(fbSettings.whatsapp_token || '');
        if (fbSettings.whatsapp_message_template) {
          setWhatsappMessageTemplate(fbSettings.whatsapp_message_template);
        }

        // Sync local storage to keep matching state
        localStorage.setItem('fb_pixel_id', (fbSettings.fb_pixel_id || '').trim());
        localStorage.setItem('fb_pixel_enabled', fbSettings.fb_pixel_enabled !== false ? 'true' : 'false');
        localStorage.setItem('fb_capi_enabled', fbSettings.fb_capi_enabled === true ? 'true' : 'false');
        localStorage.setItem('fb_advanced_matching', fbSettings.fb_advanced_matching !== false ? 'true' : 'false');
        localStorage.setItem('fb_capi_token', (fbSettings.fb_capi_token || '').trim());
        localStorage.setItem('fb_test_event_enabled', fbSettings.fb_test_event_enabled === true ? 'true' : 'false');
        localStorage.setItem('fb_test_event_code', (fbSettings.fb_test_event_code || '').trim());

        localStorage.setItem('ga_track_id', (fbSettings.ga_track_id || '').trim());
        localStorage.setItem('raincoat_header_snippets', fbSettings.raincoat_header_snippets || '');
        localStorage.setItem('raincoat_footer_snippets', fbSettings.raincoat_footer_snippets || '');

        localStorage.setItem('tiktok_pixel_id', (fbSettings.tiktok_pixel_id || '').trim());
        localStorage.setItem('tiktok_pixel_enabled', fbSettings.tiktok_pixel_enabled !== false ? 'true' : 'false');

        localStorage.setItem('raincoat_courier_inside', String(fbSettings.raincoat_courier_inside || 80));
        localStorage.setItem('raincoat_courier_sub', String(fbSettings.raincoat_courier_sub || 100));
        localStorage.setItem('raincoat_courier_outside', String(fbSettings.raincoat_courier_outside || 130));

        localStorage.setItem('raincoat_whatsapp_enabled', fbSettings.whatsapp_enabled === true ? 'true' : 'false');
        localStorage.setItem('raincoat_whatsapp_provider', fbSettings.whatsapp_provider || 'ultramsg');
        localStorage.setItem('raincoat_whatsapp_instance_id', fbSettings.whatsapp_instance_id || '');
        localStorage.setItem('raincoat_whatsapp_token', fbSettings.whatsapp_token || '');
        localStorage.setItem('raincoat_whatsapp_template', fbSettings.whatsapp_message_template || '');
      }
    }).catch(err => {
      console.warn("Could not fetch remote integrations config on load:", err);
    });
  }, []);

  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    if (userRole !== 'Admin') {
      setMessage('দুঃখিত! ইন্টিগ্রেশন ও ট্র্যাকিং কোড সেটিংস পরিবর্তন করার ক্ষমতা শুধুমাত্র এডমিনের রয়েছে।');
      return;
    }

    // Save configurations locally first so UX remains lightning fast
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

    localStorage.setItem('tiktok_pixel_id', tiktokPixelId.trim());
    localStorage.setItem('tiktok_pixel_enabled', tiktokPixelEnabled ? 'true' : 'false');

    // Save Courier Cargo Charges locally
    localStorage.setItem('raincoat_courier_inside', String(deliveryInside));
    localStorage.setItem('raincoat_courier_sub', String(deliverySub));
    localStorage.setItem('raincoat_courier_outside', String(deliveryOutside));

    // Save WhatsApp details locally
    localStorage.setItem('raincoat_whatsapp_enabled', whatsappEnabled ? 'true' : 'false');
    localStorage.setItem('raincoat_whatsapp_provider', whatsappProvider);
    localStorage.setItem('raincoat_whatsapp_instance_id', whatsappInstanceId.trim());
    localStorage.setItem('raincoat_whatsapp_token', whatsappToken.trim());
    localStorage.setItem('raincoat_whatsapp_template', whatsappMessageTemplate);

    // Save configurations to Firestore asynchronously
    const payload = {
      fb_pixel_id: pixelId.trim(),
      fb_pixel_enabled: pixelEnabled,
      fb_capi_enabled: capiEnabled,
      fb_advanced_matching: advancedMatching,
      fb_capi_token: capiToken.trim(),
      fb_test_event_enabled: testEventEnabled,
      fb_test_event_code: testEventCode.trim(),
      ga_track_id: gaId.trim(),
      raincoat_header_snippets: headerSnippets,
      raincoat_footer_snippets: footerSnippets,
      tiktok_pixel_id: tiktokPixelId.trim(),
      tiktok_pixel_enabled: tiktokPixelEnabled,
      raincoat_courier_inside: deliveryInside,
      raincoat_courier_sub: deliverySub,
      raincoat_courier_outside: deliveryOutside,
      whatsapp_enabled: whatsappEnabled,
      whatsapp_provider: whatsappProvider,
      whatsapp_instance_id: whatsappInstanceId.trim(),
      whatsapp_token: whatsappToken.trim(),
      whatsapp_message_template: whatsappMessageTemplate
    };

    try {
      await saveIntegrationsSettingsToFirestore(payload);
      setIsSuccess(true);
      setMessage('মেটা পিক্সেল, টিকটক পিক্সেল, গ্লোবাল ট্র্যাকিং, হোয়াটসঅ্যাপ ও কুরিয়ার সেটিংস ফায়ারবেস ডেটাবেইজে সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (fbErr) {
      console.error("Firestore save integrations failed:", fbErr);
      setIsSuccess(true); // Still show success since it is saved locally and working!
      setMessage('আইডি ও উইজেট সেটিংস লোকালি সংরক্ষিত হয়েছে! (ফায়ারবেস কোটা বা সংযোগ জনিত কারণে ক্লাউডে সিঙ্ক করা যায়নি)');
    }

    // Dispatch update event so setup triggers live changes immediately
    window.dispatchEvent(new Event('raincoat_pixel_config_updated'));

    setTimeout(() => setMessage(''), 5000);
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

          {/* TIKTOK PIXEL */}
          <div className="lg:col-span-12 bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase text-rose-500">
                🎵 TikTok Pixel Integration
              </h4>
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${tiktokPixelEnabled ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-400'}`}>
                  {tiktokPixelEnabled ? 'Active' : 'Disabled'}
                </span>
                <button
                  type="button"
                  disabled={userRole !== 'Admin'}
                  onClick={() => setTiktokPixelEnabled(!tiktokPixelEnabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    tiktokPixelEnabled ? 'bg-rose-500' : 'bg-slate-200'
                  } ${userRole !== 'Admin' ? 'opacity-55 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      tiktokPixelEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">TIKTOK PIXEL ID</label>
                <input 
                  type="text" 
                  placeholder="যেমন: C68NPT3C77U8L9LJJ9UG"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-rose-500"
                  value={tiktokPixelId}
                  onChange={(e) => setTiktokPixelId(e.target.value)}
                  disabled={userRole !== 'Admin'}
                />
              </div>

              <div className="p-3 bg-slate-55 border border-slate-150 rounded-xl text-[9.5px] leading-relaxed text-slate-500 space-y-1">
                <span className="font-bold text-slate-700 block">💡 টিকটক ট্র্যাকিং তথ্য:</span>
                <p>১. টিকটক পিক্সেল পরিবর্তন করার পর "সংরক্ষণ করুন" বাটনে ক্লিক করুন।</p>
                <p>২. TikTok Pixel Helper ক্রোম এক্সটেনশন দিয়ে টেস্ট ট্র্যাকিং যাচাই করুন।</p>
                <p>৩. কাস্টমার অর্ডার সাবমিট করার সাথে সাথে টিকটকে <strong>CompletePayment</strong> ইভেন্টটি স্বয়ংক্রিয়ভাবে প্রেরিত হবে।</p>
              </div>
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

        {/* 💬 Automated WhatsApp Messaging Configuration Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-150">
            <div className="flex items-center gap-1.5">
              <span className="p-1 bg-emerald-100 text-emerald-700 rounded-md">💬</span>
              <div>
                <h4 className="font-extrabold text-slate-900 text-xs uppercase text-emerald-600">
                  💬 হোয়াটসঅ্যাপ অটোমেটিক কাস্টমার নোটিফিকেশন (WhatsApp Automation Trigger)
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">গ্রাহক অর্ডার প্লেস করার সাথে সাথে তার মোবাইল নম্বরে অটোমেটিক কনফার্মেশন মেসেজ চলে যাবে।</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${whatsappEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                {whatsappEnabled ? 'Active' : 'Disabled'}
              </span>
              <button
                type="button"
                disabled={userRole !== 'Admin'}
                onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  whatsappEnabled ? 'bg-emerald-600' : 'bg-slate-200'
                } ${userRole !== 'Admin' ? 'opacity-55 cursor-not-allowed' : ''}`}
                id="whatsapp-integration-toggle"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    whatsappEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {whatsappEnabled && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Provider Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">মেসেজিং গেটওয়ে প্রোভাইডার (GATEWAY PROVIDER)</label>
                  <select
                    disabled={userRole !== 'Admin'}
                    value={whatsappProvider}
                    onChange={(e) => setWhatsappProvider(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-sans focus:outline-none focus:bg-white focus:border-emerald-500 font-semibold"
                    id="whatsapp-provider-select"
                  >
                    <option value="ultramsg">UltraMsg API (উপযুক্ত ও সহজ)</option>
                    <option value="greenapi">Green API (দ্রুত ও সিকিউর)</option>
                    <option value="custom_webhook">Custom Webhook / Custom Gateway</option>
                  </select>
                </div>

                {/* Instance ID Field (Only shown for UltraMsg / GreenAPI) */}
                {whatsappProvider !== 'custom_webhook' ? (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">হোয়াটসঅ্যাপ ইনস্ট্যান্স আইডি (INSTANCE ID)</label>
                    <input
                      type="text"
                      disabled={userRole !== 'Admin'}
                      placeholder={whatsappProvider === 'ultramsg' ? "যেমন: instance12932" : "যেমন: 1101923412"}
                      value={whatsappInstanceId}
                      onChange={(e) => setWhatsappInstanceId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-emerald-500"
                      id="whatsapp-instance-id-input"
                    />
                  </div>
                ) : (
                  <div className="flex items-center text-[11px] text-amber-700 bg-amber-50 border border-amber-100 p-2.5 rounded-xl font-medium">
                    ⚠️ কাস্টম ওয়েব হুক অপশনটিতে সরাসরি আপনার জেনারেট করা API এন্ডপয়েন্টে অর্ডার অবজেক্ট পোস্ট রিকোয়েস্ট আকারে পাঠানো হবে।
                  </div>
                )}
              </div>

              {/* Token Field / Secret Token */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  {whatsappProvider === 'custom_webhook' ? 'পোস্ট ওয়েব হুক লিংক (POST URL)' : 'এপিআই অ্যাক্সেস টোকেন (ACCESS TOKEN)'}
                </label>
                <input
                  type={whatsappProvider === 'custom_webhook' ? 'text' : 'password'}
                  disabled={userRole !== 'Admin'}
                  placeholder={whatsappProvider === 'custom_webhook' ? "যেমন: https://yourdomain.com/api/whatsapp-webhook" : "যেমন: EAAGno4ZB... বা your_api_token"}
                  value={whatsappToken}
                  onChange={(e) => setWhatsappToken(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-emerald-500"
                  id="whatsapp-token-input"
                />
              </div>

              {/* Message Template Builder */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-slate-600">মেসেজ কনটেন্ট টেমপ্লেট (MESSAGE TEMPLATE)</label>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">বাংলা মেসেজ সাপোর্ট</span>
                </div>
                <textarea
                  rows={6}
                  disabled={userRole !== 'Admin'}
                  value={whatsappMessageTemplate}
                  onChange={(e) => setWhatsappMessageTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-150 border border-slate-805 rounded-xl text-xs font-mono focus:outline-none leading-relaxed"
                  id="whatsapp-message-template-textarea"
                />
                
                {/* Placeholders Instructions */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {[
                    { tag: '{customer_name}', desc: 'গ্রাহকের সম্পূর্ণ নাম' },
                    { tag: '{order_id}', desc: 'সংক্ষিপ্ত অর্ডার রেফারেন্স' },
                    { tag: '{order_price}', desc: 'সর্বমোট প্রদেয় টাকা' },
                    { tag: '{selected_size}', desc: 'নির্বাচিত রেনকোট সাইজ' },
                    { tag: '{selected_color}', desc: 'নির্বাচিত কালার' },
                    { tag: '{delivery_address}', desc: 'ডেলিভারি ঠিকানা' }
                  ].map((item, id) => (
                    <div key={id} className="p-1.5 bg-slate-50 border border-slate-150 rounded-lg text-[9px] text-slate-500 flex flex-col justify-center leading-normal">
                      <span className="font-mono font-black text-indigo-600">{item.tag}</span>
                      <span>{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
