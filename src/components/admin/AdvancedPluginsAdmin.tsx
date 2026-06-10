import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Bell, 
  Sparkles, 
  Code, 
  Check, 
  Settings, 
  Database, 
  RefreshCw, 
  ArrowRight,
  ShieldAlert,
  Send,
  HelpCircle,
  Globe
} from 'lucide-react';
import { 
  getAdvancedAddonsSettingsFromFirestore, 
  saveAdvancedAddonsSettingsToFirestore 
} from '../../lib/firebase';
import { AdvancedAddonsSettings, RaincoatOrder } from '../../types';

interface AdvancedPluginsAdminProps {
  userRole?: string;
  orders?: RaincoatOrder[];
  onRefreshOrders?: () => void;
}

export default function AdvancedPluginsAdmin({ userRole, orders = [], onRefreshOrders }: AdvancedPluginsAdminProps) {
  const [activeSubTab, setActiveSubTab] = useState<'payment' | 'sms' | 'exit-popup' | 'analytics' | 'site-identity'>('payment');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Advanced plugins state backing
  const [settings, setSettings] = useState<AdvancedAddonsSettings>({
    courier_enabled: true,
    courier_provider: 'steadfast',
    steadfast_api_key: 'stdf_api_live_48201948x920a1',
    steadfast_secret: 'stdf_sec_93019',
    pathao_client_id: 'pth_cli_839210',
    pathao_client_secret: 'pth_sec_48201948',
    pathao_store_id: '10932',
    redx_api_key: 'redx_api_live_8391029',
    courier_log: [
      { id: 'log-1', orderId: 'ORD-5489', courier: 'Steadfast', status: 'Delivered', trackingId: 'STDF-849201-BD', createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
      { id: 'log-2', orderId: 'ORD-5490', courier: 'Steadfast', status: 'Shipped', trackingId: 'STDF-950218-BD', createdAt: new Date(Date.now() - 3600000 * 12).toISOString() }
    ],

    partial_payment_enabled: true,
    partial_payment_amount: 150,
    partial_payment_bkash: '01750547890',
    partial_payment_nagad: '01823060612',
    partial_payment_rocket: '01937570123',
    partial_payment_instructions: 'ক্যাশ অন ডেলিভারিতে ফেক অর্ডার এড়াতে এবং হোম ডেলিভারি নিশ্চিতে দয়া করে আমাদের বিকাশ বা নগদ পার্সোনাল নম্বরে ১৫০ টাকা সেন্ড মানি করুন এবং নিচের বক্সে ট্রানজেকশন আইডি ও নম্বরটি লিখুন। বাকি টাকা রেনকোট পাওয়ার পর ডেলিভারি ম্যানকে দিবেন।',

    sms_enabled: true,
    sms_provider: 'greenweb',
    sms_api_key: 'gw_api_key_830192',
    sms_username: 'shapon_raincoats',
    sms_sender_id: 'SHAPON_COIC',
    sms_template_order: 'প্রিয় {name}, আপনার রেনকোট শপ অর্ডার {order_id} সফলভাবে গৃহীত হয়েছে! বাকি টাকা ক্যাশ অন ডেলিভারি। হেল্পলাইন: ০১৭XXXXXXXX',
    sms_template_shipping: 'প্রিয় {name}, আপনার অর্ডার {order_id} স্টিডফাস্ট কুরিয়ারে বুকিং করা হয়েছে। ট্র্যাকিং ID: {tracking_id}। লিংক: https://steadfast.com.bd/t/{tracking_id}',
    sms_log: [
      { id: 'sms-1', orderId: 'ORD-5489', phone: '01750547890', message: 'প্রিয় এম.ডি শফিকুল, আপনার রেনকোট শপ অর্ডার ORD-5489 সফলভাবে গৃহীত হয়েছে!', status: 'Sent', createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
      { id: 'sms-2', orderId: 'ORD-5490', phone: '01723060612', message: 'প্রিয় রাজীব দে, আপনার অর্ডার ORD-5490 স্টিডফাস্ট কুরিয়ারে বুকিং করা হয়েছে। ট্র্যাকিং ID: STDF-950218-BD', status: 'Sent', createdAt: new Date(Date.now() - 3600000 * 12).toISOString() }
    ],

    exit_intent_enabled: true,
    exit_intent_delay: 5,
    exit_intent_discount: 10,
    exit_intent_coupon: 'RAIN10',
    exit_intent_title: '💥 একটু দাঁড়ান! রেইনকোটে ১০% স্পেশাল ছাড়!',
    exit_intent_subtitle: 'আপনি কি অর্ডার না করেই চলে যাচ্ছেন? শুধুমাত্র আগামী ৫ মিনিটের জন্য অর্ডার করলে পাচ্ছেন অতিরিক্ত ১০% ফ্ল্যাট ডিসকাউন্ট!',

    pixel_ids: '839201948201',
    gtm_ids: 'GTM-NW8201',
    track_lead: true,
    track_purchase: true,
    track_initiate_checkout: true
  });

  const [simulateSMSPhone, setSimulateSMSPhone] = useState('');
  const [simulateSMSMsg, setSimulateSMSMsg] = useState('প্রিয় গ্রাহক, রেইনকোট শপ থেকে অফার রানিং!');

  // Fetch settings on mount
  useEffect(() => {
    async function loadData() {
      const saved = await getAdvancedAddonsSettingsFromFirestore();
      if (saved) {
        setSettings(prev => ({
          ...prev,
          ...saved,
          courier_log: saved.courier_log || prev.courier_log,
          sms_log: saved.sms_log || prev.sms_log
        }));
      }
    }
    loadData();
  }, []);

  // Sync / save configurations helper
  const handleSaveSettings = async (updates: Partial<AdvancedAddonsSettings>) => {
    setIsSaving(true);
    setSuccessMsg('');
    try {
      const merged = { ...settings, ...updates };
      setSettings(merged);
      await saveAdvancedAddonsSettingsToFirestore(merged);
      setSuccessMsg('কনফিগারেশন সফলভাবে সেভ করা হয়েছে!');
      window.dispatchEvent(new Event('raincoat_site_settings_updated'));
      setTimeout(() => setSuccessMsg(''), 4050);
    } catch (err) {
      alert('কনফিগারেশন সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimulateSMS = () => {
    if (!simulateSMSPhone) {
      alert('অনুগ্রহ করে গ্রাহকের ফোন নম্বরটি লিখুন।');
      return;
    }
    const newLog = {
      id: `sms-${Date.now()}`,
      orderId: 'SIMULATED',
      phone: simulateSMSPhone,
      message: simulateSMSMsg,
      status: 'Sent',
      createdAt: new Date().toISOString()
    };
    const updated = [newLog, ...(settings.sms_log || [])];
    handleSaveSettings({ sms_log: updated });
    alert('সিমুলেটেড ড্যামি এসএমএস সফলভাবে গ্রাহকের নম্বরে প্রেরণ করা হয়েছে!');
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Overview and description */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Settings className="h-6 w-6 text-indigo-500" />
            অ্যাডভান্সড প্লাগইনস কনফিগারেশন
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            আংশিক অগ্রিম পেমেন্ট মেকানিজম, স্বয়ংক্রিয় এসএমএস গেটওয়ে, ফেসবুক পিক্সেল এবং এক্সিট ডিসকাউন্ট অফার কন্ট্রোল করুন।
          </p>
        </div>
      </div>

      {/* Upper overview stats custom cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl border border-indigo-500/20 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-300">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h5 className="text-[10px] text-indigo-300 font-bold uppercase">অগ্রিম ক্যাশ-অন পেমেন্ট</h5>
            <p className="text-xl font-black font-mono">{settings.partial_payment_enabled ? 'সক্রিয় আছে (Active)' : 'বন্ধ আছে (Inactive)'}</p>
            <span className="text-[9px] text-indigo-200">বুকিংমানি: <span className="uppercase text-emerald-400 font-bold">{settings.partial_payment_amount}৳</span></span>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-rose-900 to-rose-950 text-white rounded-2xl border border-rose-500/20 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-300">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h5 className="text-[10px] text-rose-300 font-bold uppercase">স্বয়ংক্রিয় এসএমএস এলার্টস</h5>
            <p className="text-xl font-black font-mono">{(settings.sms_log || []).length} টি প্রেরিত বার্তা</p>
            <span className="text-[9px] text-rose-200">গেটওয়ে: <span className="uppercase text-emerald-400 font-bold">{settings.sms_provider}</span></span>
          </div>
        </div>
      </div>

      {/* Internal Sidebar layout */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        {/* Left Sub Tabs Navigation */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 space-y-1 shrink-0 flex flex-row md:flex-col overflow-x-auto gap-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('payment')}
            className={`w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 shrink-0 ${
              activeSubTab === 'payment'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            <CreditCard className="h-4 w-4 shrink-0" />
            <span>১. আংশিক অগ্রিম পেমেন্ট</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('sms')}
            className={`w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 shrink-0 ${
              activeSubTab === 'sms'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            <Bell className="h-4 w-4 shrink-0" />
            <span>২. এসএমএস নোটিফিকেশন</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('exit-popup')}
            className={`w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 shrink-0 ${
              activeSubTab === 'exit-popup'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>৩. এক্সিট ডিসকাউন্ট পপ-আপ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('analytics')}
            className={`w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 shrink-0 ${
              activeSubTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            <Code className="h-4 w-4 shrink-0" />
            <span>৪. পিক্সেল ও ট্র্যাকিং এপিআই</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('site-identity')}
            className={`w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 shrink-0 ${
              activeSubTab === 'site-identity'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            <Globe className="h-4 w-4 shrink-0" />
            <span>৫. সাইট পরিচিতি ও থিম</span>
          </button>
        </div>

        {/* Right sub tab body */}
        <div className="flex-1 p-6 relative bg-white">
          
          {successMsg && (
            <div className="p-3.5 mb-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-bounce">
              <Check className="h-4 w-4 text-emerald-650" />
              {successMsg}
            </div>
          )}

          {/* SECTION 1: PARTIAL ADVANCE PAYMENTS */}
          {activeSubTab === 'payment' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  ১. আংশিক অগ্রিম পেমেন্ট কনফিগারেশন (bKash / Nagad / Rocket Partial Payment)
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  ফেক অর্ডার ও রিটার্ন চার্জ এড়াতে কাস্টমার অর্ডার প্লেস করার পূর্বে নির্দিষ্ট বুকিংমানি অগ্রিম পরিশোধ করবে।
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">অগ্রিম পেমেন্ট সিস্টেম চালু করুন</span>
                  <button 
                    onClick={() => handleSaveSettings({ partial_payment_enabled: !settings.partial_payment_enabled })}
                    className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 cursor-pointer ${settings.partial_payment_enabled ? 'bg-indigo-600 flex justify-end' : 'bg-slate-300 flex justify-start'}`}
                  >
                    <span className="w-4.5 h-4.5 bg-white rounded-full block shadow-md" />
                  </button>
                </div>

                {settings.partial_payment_enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-dashed border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">অগ্রিম বুকিং টাকার পরিমাণ (BDT)</label>
                      <input 
                        type="number" 
                        value={settings.partial_payment_amount}
                        onChange={(e) => handleSaveSettings({ partial_payment_amount: parseInt(e.target.value) || 0 })}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">বিকাশ পার্সোনাল নম্বর (bKash Mobile)</label>
                      <input 
                        type="text" 
                        value={settings.partial_payment_bkash}
                        onChange={(e) => setSettings({ ...settings, partial_payment_bkash: e.target.value })}
                        onBlur={(e) => handleSaveSettings({ partial_payment_bkash: e.target.value })}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">নগদ পার্সোনাল নম্বর (Nagad Mobile)</label>
                      <input 
                        type="text" 
                        value={settings.partial_payment_nagad}
                        onChange={(e) => setSettings({ ...settings, partial_payment_nagad: e.target.value })}
                        onBlur={(e) => handleSaveSettings({ partial_payment_nagad: e.target.value })}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">রকেট পার্সোনাল নম্বর (Rocket Mobile)</label>
                      <input 
                        type="text" 
                        value={settings.partial_payment_rocket}
                        onChange={(e) => setSettings({ ...settings, partial_payment_rocket: e.target.value })}
                        onBlur={(e) => handleSaveSettings({ partial_payment_rocket: e.target.value })}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">অগ্রিম পেমেন্ট নির্দেশনা (কাস্টমারকে কি বার্তা পাঠাবেন)</label>
                      <textarea 
                        rows={3}
                        value={settings.partial_payment_instructions}
                        onChange={(e) => setSettings({ ...settings, partial_payment_instructions: e.target.value })}
                        onBlur={(e) => handleSaveSettings({ partial_payment_instructions: e.target.value })}
                        className="w-full text-xs p-3 bg-white border border-slate-200 rounded-lg focus:outline-none leading-relaxed"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: SMS CONFIGURATIONS */}
          {activeSubTab === 'sms' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Bell className="h-4 w-4 text-rose-500" />
                  ২. স্বয়ংক্রিয় এসএমএস এলার্ট গেটওয়ে (Greenweb API SMS)
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  কাস্টমার অর্ডার করার পর অথবা কুরিয়ার শিফটমেন্ট বুকিং এর ট্র্যাকিং আইডি সহ অটোমেটিক মোবাইল এসএমএস বার্তা পাঠান।
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">এসএমএস গেটওয়ে একটিভেট করুন</span>
                  <button 
                    onClick={() => handleSaveSettings({ sms_enabled: !settings.sms_enabled })}
                    className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 cursor-pointer ${settings.sms_enabled ? 'bg-rose-600 flex justify-end' : 'bg-slate-350 flex justify-start'}`}
                  >
                    <span className="w-4.5 h-4.5 bg-white rounded-full block shadow-md" />
                  </button>
                </div>

                {settings.sms_enabled && (
                  <div className="space-y-4 pt-4 border-t border-dashed border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">এসএমএস প্রোভাইডার</label>
                        <select 
                          value={settings.sms_provider}
                          onChange={(e) => handleSaveSettings({ sms_provider: e.target.value })}
                          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                        >
                          <option value="greenweb">Greenweb SMS (বাংলাদেশি পপুলার গেটওয়ে)</option>
                          <option value="bulksmsbd">BulkSMSBD.com (অপশনাল)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Greenweb SMS API Key</label>
                        <input 
                          type="text" 
                          value={settings.sms_api_key}
                          onChange={(e) => setSettings({ ...settings, sms_api_key: e.target.value })}
                          onBlur={(e) => handleSaveSettings({ sms_api_key: e.target.value })}
                          className="w-full text-xs font-mono p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">নতুন অর্ডার এলার্টিং ম্যাসেজ টেমপ্লেট</label>
                        <textarea 
                          rows={3}
                          value={settings.sms_template_order}
                          onChange={(e) => setSettings({ ...settings, sms_template_order: e.target.value })}
                          onBlur={(e) => handleSaveSettings({ sms_template_order: e.target.value })}
                          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400">ডায়নামিক ট্যাগ: ২ বা ৩ জায়গায় <code className="font-mono text-blue-600 font-bold">{'{name}'}</code> বা <code className="font-mono text-blue-600 font-bold">{'{order_id}'}</code> ব্যবহার করুন।</span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">কুরিয়ার ট্র্যাকিং ম্যাসেজ টেমপ্লেট</label>
                        <textarea 
                          rows={3}
                          value={settings.sms_template_shipping}
                          onChange={(e) => setSettings({ ...settings, sms_template_shipping: e.target.value })}
                          onBlur={(e) => handleSaveSettings({ sms_template_shipping: e.target.value })}
                          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400">ডায়নামিক ট্যাগ: <code className="font-mono text-blue-600 font-bold">{'{tracking_id}'}</code>, <code className="font-mono text-blue-600 font-bold">{'{order_id}'}</code> ব্যবহার করুন।</span>
                      </div>
                    </div>

                    {/* Developer local mock dynamic SMS sandbox tester */}
                    <div className="p-4 bg-indigo-50/10 border border-indigo-100 rounded-xl space-y-2.5">
                      <span className="text-xs font-black text-indigo-900 block flex items-center gap-1">
                        🚀 গেটওয়ে রিয়েলটাইম ড্যামি এসএমএস সিমুলেটর
                      </span>
                      <div className="flex flex-col sm:flex-row gap-2.5 items-end">
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 font-extrabold mb-1">গ্রাহকের টেস্ট ফোন নম্বর</label>
                          <input 
                            type="text" 
                            placeholder="যেমন: 0175054XXXX"
                            value={simulateSMSPhone}
                            onChange={(e) => setSimulateSMSPhone(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 font-extrabold mb-1">এসএমএস বার্তা</label>
                          <input 
                            type="text" 
                            value={simulateSMSMsg}
                            onChange={(e) => setSimulateSMSMsg(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={handleSimulateSMS}
                          className="px-4 py-2 bg-indigo-800 hover:bg-indigo-900 text-white rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Send className="h-3.5 w-3.5" /> টেস্ট পাঠান
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 3: EXIT INTENT POPUP */}
          {activeSubTab === 'exit-popup' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  ৩. কাস্টমার এক্সিট ডিসকাউন্ট অফার পপ-আপ (Exit-Intent Promo Code Popup)
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  ক্রেতা অর্ডার ফর্ম পূরণ না করে চলে যেতে ধরলে বা মাউস উইন্ডোর বাইরে নিয়ে গেলে আকর্ষণীয় ডিসকাউন্ট কুপন পপ-আপ দেখান।
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">এক্সিট অফার পপ-আপ চালু করুন</span>
                  <button 
                    type="button"
                    onClick={() => handleSaveSettings({ exit_intent_enabled: !settings.exit_intent_enabled })}
                    className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 cursor-pointer ${settings.exit_intent_enabled ? 'bg-indigo-600 flex justify-end' : 'bg-slate-300 flex justify-start'}`}
                  >
                    <span className="w-4.5 h-4.5 bg-white rounded-full block shadow-md" />
                  </button>
                </div>

                {settings.exit_intent_enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-dashed border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">১০% ফ্ল্যাট ডিসকাউন্ট কুপন কোড</label>
                      <input 
                        type="text" 
                        value={settings.exit_intent_coupon}
                        onChange={(e) => setSettings({ ...settings, exit_intent_coupon: e.target.value })}
                        onBlur={(e) => handleSaveSettings({ exit_intent_coupon: e.target.value })}
                        className="w-full text-xs font-mono p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">অটোমেটিক ডিসকাউন্টের শতকরা হার (%)</label>
                      <input 
                        type="number" 
                        value={settings.exit_intent_discount}
                        onChange={(e) => handleSaveSettings({ exit_intent_discount: parseInt(e.target.value) || 0 })}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">পপ-আপ মূল আকর্ষনীয় হেডার টাইটেল</label>
                      <input 
                        type="text" 
                        value={settings.exit_intent_title}
                        onChange={(e) => setSettings({ ...settings, exit_intent_title: e.target.value })}
                        onBlur={(e) => handleSaveSettings({ exit_intent_title: e.target.value })}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none placeholder-slate-400"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">পপ-আপ সাবটাইটেল বর্ণনা</label>
                      <textarea 
                        rows={2}
                        value={settings.exit_intent_subtitle}
                        onChange={(e) => setSettings({ ...settings, exit_intent_subtitle: e.target.value })}
                        onBlur={(e) => handleSaveSettings({ exit_intent_subtitle: e.target.value })}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 4: PIXELS & GTM */}
          {activeSubTab === 'analytics' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Code className="h-4 w-4 text-cyan-600" />
                  ৪. ফেসবুক পিক্সেল ও গুগল ট্যাগ ম্যানেজার (Facebook Pixel & GTM Setup)
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  বিজ্ঞাপন অপ্টিমাইজেশন ও কাস্টমার ইভেন্ট কনভার্শন ট্র্যাক করতে ফেসবুক পিক্সেল বা গুগল ট্যাগ ট্র্যাকিং স্ক্রিপ্ট যুক্ত করুন।
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ফেসবুক পিক্সেল আইডি সমূহ (কমা দিয়ে একাধিক)</label>
                    <input 
                      type="text" 
                      value={settings.pixel_ids}
                      onChange={(e) => setSettings({ ...settings, pixel_ids: e.target.value })}
                      onBlur={(e) => handleSaveSettings({ pixel_ids: e.target.value })}
                      placeholder="যেমন: ID-1, ID-2"
                      className="w-full text-xs font-mono p-2.5 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">গুগল ট্যাগ ম্যানেজার আইডি (GTM ID)</label>
                    <input 
                      type="text" 
                      value={settings.gtm_ids}
                      onChange={(e) => setSettings({ ...settings, gtm_ids: e.target.value })}
                      onBlur={(e) => handleSaveSettings({ gtm_ids: e.target.value })}
                      placeholder="যেমন: GTM-NW8201"
                      className="w-full text-xs font-mono p-2.5 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-t border-dashed border-slate-200 pt-3">
                  <span className="text-[11px] font-bold text-slate-600 block">সক্রিয় বিজ্ঞাপন ইভেন্ট ট্র্যাকিং সমুহ:</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <label className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Initiate Checkout</span>
                        <span className="text-[9px] text-slate-400">অর্ডার ফর্ম স্ক্রোল বা ভিউতে</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.track_initiate_checkout} 
                        onChange={(e) => handleSaveSettings({ track_initiate_checkout: e.target.checked })}
                        className="rounded text-blue-600 h-4 w-4" 
                      />
                    </label>

                    <label className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Lead Conversion</span>
                        <span className="text-[9px] text-slate-400">খসড়া ড্রাফট জমা হলে</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.track_lead} 
                        onChange={(e) => handleSaveSettings({ track_lead: e.target.checked })}
                        className="rounded text-blue-600 h-4 w-4" 
                      />
                    </label>

                    <label className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer col-span-1 sm:col-span-2 lg:col-span-1">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Purchase completed</span>
                        <span className="text-[9px] text-slate-400">চূড়ান্ত অর্ডার সম্পন্ন হলে</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.track_purchase} 
                        onChange={(e) => handleSaveSettings({ track_purchase: e.target.checked })}
                        className="rounded text-blue-600 h-4 w-4" 
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: SITE IDENTITY & DETAILS */}
          {activeSubTab === 'site-identity' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-emerald-600" />
                  ৫. সাইট পরিচিতি, ফেভিকন ও ব্র্যান্ড লোগো (Site Identity & Favicon Branding)
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  আপনার অনলাইন স্টোরের টাইটেল, ব্রাউজারের ফেভিকন এবং লোগো টেক্সট অথবা ইমেজ কাস্টমাইজ করুন।
                </p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  {/* Site Title Input */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      সাইট টাইটেল (Site Browser Tab Title)
                    </label>
                    <input 
                      type="text" 
                      value={settings.site_title || ''}
                      placeholder="যেমন: Premium Raincoat Shop BD | সর্বসেরা ওয়াটারপ্রুফ রেনকোট"
                      onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                      onBlur={(e) => handleSaveSettings({ site_title: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      গ্রাহকদের ব্রাউজারে ট্যাব টাইটেল এবং গুগল সার্চ ইঞ্জিনে এটি প্রদর্শিত হবে।
                    </span>
                  </div>

                  {/* Site Favicon Icon */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ব্রাউজার ফেভিকন আইকন (Emoji অথবা Image URL)
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={settings.site_favicon || ''}
                        placeholder="যেমন: 🌧️ বা https://example.com/logo.png"
                        onChange={(e) => setSettings({ ...settings, site_favicon: e.target.value })}
                        onBlur={(e) => handleSaveSettings({ site_favicon: e.target.value })}
                        className="flex-1 text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                      <div className="w-10 h-10 shrink-0 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-lg select-none">
                        {settings.site_favicon && settings.site_favicon.length < 5 ? settings.site_favicon : '☔'}
                      </div>
                    </div>
                    
                    {/* Quick Emojis Selection */}
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] text-slate-400 font-bold shrink-0">জনপ্রিয় ইমোজি:</span>
                      {['🌧️', '🧥', '🏍️', '🌂', '🛒', '📦', '🎁', '⚡'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setSettings({ ...settings, site_favicon: emoji });
                            handleSaveSettings({ site_favicon: emoji });
                          }}
                          className="w-6 h-6 rounded-md bg-white border border-slate-200 text-xs hover:border-blue-500 transition cursor-pointer flex items-center justify-center"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">
                      ইমোজি দিলে তা স্বয়ংক্রিয়ভাবে SVG বানিয়ে ব্রাউজারে ফেভিকন আইকন হিসেবে ড্র করা হবে!
                    </span>
                  </div>

                  {/* Site Logo (Image URL or Title) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ব্র্যান্ড লোগো লেখা (Site Header Logo text)
                    </label>
                    <input 
                      type="text" 
                      value={settings.site_logo_url || ''}
                      placeholder="যেমন: Premium Raincoat Shop BD"
                      onChange={(e) => setSettings({ ...settings, site_logo_url: e.target.value })}
                      onBlur={(e) => handleSaveSettings({ site_logo_url: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      স্টোরের হেডার এবং ফুটার অংশে এই মূল ব্র্যান্ডিং শব্দটি প্রদর্শিত হবে।
                    </span>
                  </div>

                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
