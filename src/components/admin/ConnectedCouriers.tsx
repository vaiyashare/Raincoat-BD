import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  ShieldCheck, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Cpu, 
  HelpCircle, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Save,
  Lock,
  Eye,
  EyeOff,
  Activity,
  Award
} from 'lucide-react';
import { 
  AdvancedAddonsSettings, 
  saveAdvancedAddonsSettingsToFirestore, 
  getAdvancedAddonsSettingsFromFirestore 
} from '../../lib/firebase';
import { RaincoatOrder } from '../../types';

interface ConnectedCouriersProps {
  userRole?: string;
  orders: RaincoatOrder[];
}

export default function ConnectedCouriers({ userRole = 'ReadOnly', orders = [] }: ConnectedCouriersProps) {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  
  // Api visibility / toggles
  const [showKeys, setShowKeys] = useState<{[key: string]: boolean}>({});
  const [editingCourier, setEditingCourier] = useState<string | null>(null);

  // Steadfast Balance
  const [steadfastBalance, setSteadfastBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState('');

  // Settings state
  const [settings, setSettings] = useState<AdvancedAddonsSettings>({
    courier_enabled: true,
    courier_provider: 'steadfast',
    steadfast_api_key: '',
    steadfast_secret: '',
    pathao_client_id: '',
    pathao_client_secret: '',
    pathao_store_id: '',
    redx_api_key: '',
    partial_payment_enabled: true,
    partial_payment_amount: 150,
    partial_payment_bkash: '',
    partial_payment_nagad: '',
    partial_payment_rocket: '',
    partial_payment_instructions: '',
    sms_enabled: false,
    sms_provider: 'greenweb',
    sms_api_key: '',
    sms_username: '',
    sms_sender_id: '',
    sms_template_order: '',
    sms_template_shipping: '',
    courier_log: [],
    sms_log: []
  });

  // Load configuration
  const loadSettingsFromCloud = async () => {
    setLoading(true);
    try {
      const data = await getAdvancedAddonsSettingsFromFirestore();
      if (data) {
        setSettings(prev => ({
          ...prev,
          ...data
        }));
        
        // Auto fetch steadfast balance if credentials exist
        if (data.steadfast_api_key && data.steadfast_secret) {
          fetchSteadfastBalance(data.steadfast_api_key, data.steadfast_secret);
        }
      }
    } catch (err: any) {
      console.error("Error loaded settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsFromCloud();
  }, []);

  const fetchSteadfastBalance = async (apiKey: string, secretKey: string) => {
    if (!apiKey || !secretKey) return;
    setBalanceLoading(true);
    setBalanceError('');
    try {
      const response = await fetch('/api/steadfast/get_balance', {
        headers: {
          'api-key': apiKey,
          'secret-key': secretKey,
        }
      });
      const data = await response.json();
      if (data && data.status === 200) {
        setSteadfastBalance(data.current_balance);
      } else {
        setSteadfastBalance(null);
        setBalanceError(data.message || 'ক্রেডেনশিয়াল সঠিক নয় বা সংযোগ পাওয়া যায়নি।');
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
      setBalanceError('API কল ব্যর্থ হয়েছে! অনুগ্রহ করে নেটওয়ার্ক চেক করুন।');
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleUpdateProvider = async (provider: 'steadfast' | 'pathao' | 'redx' | 'none', enabled: boolean) => {
    if (userRole === 'ReadOnly') {
      alert('দুঃখিত, রিড-অনলি মোডে সেটিংস পরিবর্তন করা সম্ভব নয়!');
      return;
    }
    
    setIsSaving(true);
    setSaveSuccess('');
    setSaveError('');
    try {
      const updated = {
        ...settings,
        courier_provider: provider,
        courier_enabled: enabled
      };
      setSettings(updated);
      await saveAdvancedAddonsSettingsToFirestore(updated);
      setSaveSuccess('কুরিয়ার গেটওয়ে সফলভাবে পরিবর্তন করা হয়েছে!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'সেটিংস সেভ করতে ব্যর্থ হয়েছে।');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCourierKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'ReadOnly') {
      alert('দুঃখিত, রিড-অনলি মোডে সেটিংস পরিবর্তন করা সম্ভব নয়!');
      return;
    }

    setIsSaving(true);
    setSaveSuccess('');
    setSaveError('');
    try {
      await saveAdvancedAddonsSettingsToFirestore(settings);
      setSaveSuccess('কুরিয়ার সংযোগ স্থাপন এবং ক্রেডেনশিয়াল সংরক্ষিত হয়েছে!');
      setEditingCourier(null);
      
      // Recheck steadfast balance if changed
      if (settings.steadfast_api_key && settings.steadfast_secret) {
        fetchSteadfastBalance(settings.steadfast_api_key, settings.steadfast_secret);
      }

      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper count orders
  const getCourierOrderStats = (courierName: string) => {
    const list = orders || [];
    return list.filter(o => {
      if (!o.courierName) return false;
      return o.courierName.toLowerCase() === courierName.toLowerCase();
    }).length;
  };

  // Check connection state of each gateway
  const isSteadfastConfigured = !!(settings.steadfast_api_key && settings.steadfast_secret);
  const isPathaoConfigured = !!(settings.pathao_client_id && settings.pathao_client_secret && settings.pathao_store_id);
  const isRedxConfigured = !!(settings.redx_api_key);

  const totalConnected = (isSteadfastConfigured ? 1 : 0) + (isPathaoConfigured ? 1 : 0) + (isRedxConfigured ? 1 : 0);

  if (loading) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-3xl animate-pulse">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-600">কুরিয়ার সংযোগ কনফিগারেশন প্যানেল লোড হচ্ছে...</p>
        <p className="text-[11px] text-slate-400 mt-1">দয়া করে স্পার্ক বা ডেটাবেজ রেসপন্সের জন্য অপেক্ষা করুন</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-scaleIn">
      {/* Upper Banner Block */}
      <div className="p-6 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl border border-indigo-950 shadow-lg shadow-indigo-950/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[10px] uppercase font-black tracking-widest text-indigo-200">
              Courier Hub Integrations
            </span>
            <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
            সংযুক্ত কুরিয়ার গেটওয়ে ও লাইভ কানেকশন মনিটর
          </h2>
          <p className="text-xs text-indigo-200/90 leading-relaxed font-sans">
            আপনার অনলাইন শপের রিয়েল-টাইম পার্সেল বুকিং কার্যক্রম গতিশীল করতে কুরিয়ার গেটওয়েগুলোর সংযোগ কন্ট্রোল করুন। আপনার ক্রেডেনশিয়াল এবং কুরিয়ার স্ট্যাটাস সরাসরি এখান থেকে পর্যবেক্ষণ করা যাবে।
          </p>
        </div>

        {/* Global Action Stats Info */}
        <div className="grid grid-cols-2 gap-3.5 w-full md:w-auto shrink-0 z-10 font-sans">
          <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-center space-y-1">
            <span className="text-[10px] text-slate-300 font-extrabold uppercase">সংযুক্ত গেটওয়ে</span>
            <span className="block text-2xl font-black text-emerald-400">{totalConnected} / ৩</span>
          </div>
          <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-center space-y-1">
            <span className="text-[10px] text-slate-300 font-extrabold uppercase">অ্যাক্টিভ গেটওয়ে</span>
            <span className="block text-sm font-black text-indigo-300 truncate max-w-[120px]">
              {settings.courier_enabled ? (
                settings.courier_provider === 'steadfast' ? 'স্টিডফাস্ট' :
                settings.courier_provider === 'pathao' ? 'পাঠাও কুরিয়ার' :
                settings.courier_provider === 'redx' ? 'রেডএক্স' : 'ম্যানুয়াল ট্র্যাকিং'
              ) : 'কোনোটিই নয় ❌'}
            </span>
          </div>
        </div>
      </div>

      {/* Save Success/Error Feedback Messages */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold font-sans flex items-center gap-2 animate-scaleIn">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          {saveSuccess}
        </div>
      )}
      {saveError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold font-sans flex items-center gap-2 animate-scaleIn">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          {saveError}
        </div>
      )}

      {/* Main Grid: Courier Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 leading-relaxed">
        {/* Left Side: Services lists */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-indigo-600" /> উপলব্ধ কুরিয়ার সার্ভিসেস কন্ট্রোল লিস্ট
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 font-sans">
            
            {/* 1. Steadfast Courier */}
            <div className={`p-5 rounded-2xl border transition-all ${
              settings.courier_enabled && settings.courier_provider === 'steadfast'
                ? 'bg-gradient-to-b from-indigo-50/50 to-white border-indigo-250 shadow-sm shadow-indigo-100'
                : 'bg-white border-slate-200 hover:border-slate-350'
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-extrabold text-sm border border-orange-200">
                    S
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      Steadfast Courier (স্টিডফাস্ট কুরিয়ার)
                      {settings.courier_enabled && settings.courier_provider === 'steadfast' && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-black text-[9px] uppercase tracking-wide">
                          Active Gateway
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-400">বাংলাদেশের অন্যতম সবচেয়ে জনপ্রিয় ও দ্রুততম ক্যাশ অন ডেলিভারি কুরিয়ার সার্ভিস।</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Status Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    isSteadfastConfigured 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {isSteadfastConfigured ? '🟢 Connected' : '⚪ Disconnected'}
                  </span>

                  {/* Toggle Mode */}
                  {isSteadfastConfigured && (
                    <button
                      type="button"
                      onClick={() => handleUpdateProvider('steadfast', true)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[10px] cursor-pointer transition ${
                        settings.courier_enabled && settings.courier_provider === 'steadfast'
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {settings.courier_enabled && settings.courier_provider === 'steadfast' ? 'এক্টিভ' : 'একটিভেট করুন'}
                    </button>
                  )}
                </div>
              </div>

              {/* Courier info and balance area */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Credentials Preview */}
                <div className="md:col-span-8 text-[11px] space-y-1.5 text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-24">API Key:</span>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                      {isSteadfastConfigured 
                        ? (showKeys['st_key'] ? settings.steadfast_api_key : '••••••••••••••••••••' + settings.steadfast_api_key.slice(-4)) 
                        : 'সেট করা নেই'}
                    </span>
                    {isSteadfastConfigured && (
                      <button 
                        type="button" 
                        onClick={() => toggleKeyVisibility('st_key')}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer text-[10px]"
                      >
                        {showKeys['st_key'] ? <EyeOff className="h-3 w-3 inline" /> : <Eye className="h-3 w-3 inline" />}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-24">Secret Key:</span>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                      {isSteadfastConfigured 
                        ? (showKeys['st_sec'] ? settings.steadfast_secret : '••••••••••••••••••••' + settings.steadfast_secret.slice(-4)) 
                        : 'সেট করা নেই'}
                    </span>
                    {isSteadfastConfigured && (
                      <button 
                        type="button" 
                        onClick={() => toggleKeyVisibility('st_sec')}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer text-[10px]"
                      >
                        {showKeys['st_sec'] ? <EyeOff className="h-3 w-3 inline" /> : <Eye className="h-3 w-3 inline" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Balance stats */}
                <div className="md:col-span-4 bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-bold">লাইভ অ্যাকাউন্ট ব্যালেন্স:</span>
                    <button 
                      type="button"
                      disabled={balanceLoading || !isSteadfastConfigured}
                      onClick={() => fetchSteadfastBalance(settings.steadfast_api_key, settings.steadfast_secret)}
                      className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-50 transition cursor-pointer"
                    >
                      <RefreshCw className={`h-3 w-3 ${balanceLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    {balanceLoading ? (
                      <span className="text-[10px] text-slate-500 font-medium animate-pulse">লোড হচ্ছে...</span>
                    ) : steadfastBalance !== null ? (
                      <span className="text-md font-black text-slate-800 font-sans">{steadfastBalance} <span className="text-[10px] text-slate-500">TK</span></span>
                    ) : (
                      <span className="text-[10px] text-rose-500 font-medium">ব্যালেন্স পাওয়া যায়নি</span>
                    )}
                  </div>
                  {balanceError && (
                    <span className="text-[8px] text-rose-500 leading-tight block mt-1 truncate">{balanceError}</span>
                  )}
                </div>
              </div>

              {/* Order dispatched counter */}
              <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 font-medium bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-1.5">
                <span>📦 এই গেটওয়ের মাধ্যমে বাস্তবায়িত বুকিং: <span className="font-extrabold text-blue-600">{getCourierOrderStats('Steadfast')} টি পার্সেল</span></span>
                <button
                  type="button"
                  onClick={() => setEditingCourier('steadfast')}
                  className="text-indigo-600 font-bold hover:underline hover:text-indigo-800 cursor-pointer"
                >
                  ক্রেডেনশিয়াল এডিট করুন
                </button>
              </div>
            </div>

            {/* 2. Pathao Courier */}
            <div className={`p-5 rounded-2xl border transition-all ${
              settings.courier_enabled && settings.courier_provider === 'pathao'
                ? 'bg-gradient-to-b from-indigo-50/50 to-white border-indigo-250 shadow-sm shadow-indigo-100'
                : 'bg-white border-slate-200 hover:border-slate-350'
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center text-rose-600 font-extrabold text-sm border border-red-100">
                    P
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      Pathao Delivery (পাঠাও কুরিয়ার)
                      {settings.courier_enabled && settings.courier_provider === 'pathao' && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-black text-[9px] uppercase tracking-wide">
                          Active Gateway
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-400">পাঠাও মার্চেন্ট প্যানেলের সাথে ইন্টিগ্রেশন করে সরাসরি পার্সেল বুক করার গেটওয়ে।</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    isPathaoConfigured 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {isPathaoConfigured ? '🟢 Connected' : '⚪ Disconnected'}
                  </span>

                  {isPathaoConfigured && (
                    <button
                      type="button"
                      onClick={() => handleUpdateProvider('pathao', true)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[10px] cursor-pointer transition ${
                        settings.courier_enabled && settings.courier_provider === 'pathao'
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {settings.courier_enabled && settings.courier_provider === 'pathao' ? 'এক্টিভ' : 'একটিভেট করুন'}
                    </button>
                  )}
                </div>
              </div>

              {/* Credentials Preview */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-slate-600">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-24">Client ID:</span>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{settings.pathao_client_id || 'সেট করা নেই'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-24">Store ID:</span>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{settings.pathao_store_id || 'সেট করা নেই'}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold w-24">Client Secret:</span>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                      {isPathaoConfigured 
                        ? (showKeys['pth_sec'] ? settings.pathao_client_secret : '••••••••••••••••••••' + settings.pathao_client_secret.slice(-4)) 
                        : 'সেট করা নেই'}
                    </span>
                    {isPathaoConfigured && (
                      <button 
                        type="button" 
                        onClick={() => toggleKeyVisibility('pth_sec')}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer text-[10px]"
                      >
                        {showKeys['pth_sec'] ? <EyeOff className="h-3 w-3 inline" /> : <Eye className="h-3 w-3 inline" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Counter stats */}
              <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 font-medium bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-1.5">
                <span>📦 এই গেটওয়ের মাধ্যমে বাস্তবায়িত বুকিং: <span className="font-extrabold text-indigo-600">{getCourierOrderStats('Pathao')} টি পার্সেল</span></span>
                <button
                  type="button"
                  onClick={() => setEditingCourier('pathao')}
                  className="text-indigo-600 font-bold hover:underline hover:text-indigo-800 cursor-pointer"
                >
                  ক্রেডেনশিয়াল এডিট করুন
                </button>
              </div>
            </div>

            {/* 3. REDX Delivery */}
            <div className={`p-5 rounded-2xl border transition-all ${
              settings.courier_enabled && settings.courier_provider === 'redx'
                ? 'bg-gradient-to-b from-indigo-50/50 to-white border-indigo-250 shadow-sm shadow-indigo-100'
                : 'bg-white border-slate-200 hover:border-slate-350'
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center text-red-650 font-extrabold text-sm border border-red-200">
                    R
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      REDX Courier (রেডএক্স ডেলিভারি)
                      {settings.courier_enabled && settings.courier_provider === 'redx' && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-black text-[9px] uppercase tracking-wide">
                          Active Gateway
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-400">REDX লজিস্টিক ল্যাবরেটরি দ্বারা পরিচালিত সর্বস্তরের মার্চেন্ট বুকিং মডিউল।</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    isRedxConfigured 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {isRedxConfigured ? '🟢 Connected' : '⚪ Disconnected'}
                  </span>

                  {isRedxConfigured && (
                    <button
                      type="button"
                      onClick={() => handleUpdateProvider('redx', true)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[10px] cursor-pointer transition ${
                        settings.courier_enabled && settings.courier_provider === 'redx'
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {settings.courier_enabled && settings.courier_provider === 'redx' ? 'এক্টিভ' : 'একটিভেট করুন'}
                    </button>
                  )}
                </div>
              </div>

              {/* Credentials Preview */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-600">
                <span className="text-slate-400 font-bold w-24">REDX API Key:</span>
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                  {isRedxConfigured 
                    ? (showKeys['redx_key'] ? settings.redx_api_key : '••••••••••••••••••••' + settings.redx_api_key.slice(-4)) 
                    : 'সেট করা নেই'}
                </span>
                {isRedxConfigured && (
                  <button 
                    type="button" 
                    onClick={() => toggleKeyVisibility('redx_key')}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer text-[10px]"
                  >
                    {showKeys['redx_key'] ? <EyeOff className="h-3 w-3 inline" /> : <Eye className="h-3 w-3 inline" />}
                  </button>
                )}
              </div>

              {/* Counter stats */}
              <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 font-medium bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-1.5">
                <span>📦 এই গেটওয়ের মাধ্যমে বাস্তবায়িত বুকিং: <span className="font-extrabold text-indigo-600">{getCourierOrderStats('RedX')} টি পার্সেল</span></span>
                <button
                  type="button"
                  onClick={() => setEditingCourier('redx')}
                  className="text-indigo-600 font-bold hover:underline hover:text-indigo-800 cursor-pointer"
                >
                  ক্রেডেনশিয়াল এডিট করুন
                </button>
              </div>
            </div>

            {/* 4. Manual / Other courier */}
            <div className={`p-5 rounded-2xl border transition-all ${
              !settings.courier_enabled
                ? 'bg-gradient-to-b from-indigo-50/50 to-white border-indigo-250 shadow-sm shadow-indigo-100'
                : 'bg-white border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-extrabold text-sm border border-indigo-200">
                    M
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      Manual Tracking (ম্যানুয়াল ট্র্যাকিং / নো লুপ)
                      {!settings.courier_enabled && (
                        <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-black text-[9px] uppercase tracking-wide">
                          Active Fallback
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-400">কোনো এপিআই ইন্টিগ্রেশন ছাড়াই নিজে ম্যানুয়ালভাবে যেকোনো কুরিয়ারের ট্র্যাকিং আইডি বসানোর সিস্টেম।</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                    🟢 Available
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateProvider('none', false)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-[10px] cursor-pointer transition ${
                      !settings.courier_enabled
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {!settings.courier_enabled ? 'এক্টিভ' : 'সরাসরি ম্যানুয়াল চালু'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Connections guide, setup, log monitor, and the popup editing mod */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 bg-slate-50 border border-slate-250/70 rounded-2xl space-y-4">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
              নিরাপদ এপিআই এনভায়রনমেন্ট
            </h4>
            <p className="text-[11px] text-slate-600 font-sans leading-relaxed">
              Monsoon Gear-এর কুরিয়ার সংযোগ প্যানেল অত্যন্ত নিরাপদ। আপনার সেভকৃত ক্রেডেনশিয়াল বা এপিআই কি সরাসরি <strong>Firebase Firestore Database (Private Auth Domain)</strong>-এ সুরক্ষিত থাকে। কোনো ব্রাউজার সেশন বা লোকাল স্টোরেজে এপিআই কী দীর্ঘসময় আন-মাস্কড অবস্থায় ওপেন থাকে না।
            </p>
            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl space-y-1.5">
              <span className="block text-[10px] font-black uppercase text-indigo-800">💡 প্রো-টিপস:</span>
              <ul className="text-[11px] text-indigo-700 list-disc list-inside space-y-1">
                <li>স্টিডফাস্টের জন্য মার্চেন্ট পোর্টাল থেকে API Key ও Secret সংগ্রহ করুন।</li>
                <li>নিখুঁত অটোমেটিক ড্যাশবোর্ডের জন্য "স্টিডফাস্ট ব্যালেন্স রিফ্রেশ" বাটন ব্যবহার করতে পারেন।</li>
              </ul>
            </div>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4 font-sans">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1">
              <Activity className="h-4 w-4 text-emerald-500" />
              কুরিয়ার ট্রানজেকশন সংক্ষেপ
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">মোট ডেলিভারির উদ্দেশ্যে পাঠানো ট্র্যাকিং:</span>
                <span className="font-extrabold text-slate-800">{orders.filter(o => o.trackingId).length} টি</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">স্টিডফাস্টে মোট পার্সেল:</span>
                <span className="font-extrabold text-slate-800">{getCourierOrderStats('Steadfast')} টি</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">পাঠাও লাইভে মোট পার্সেল:</span>
                <span className="font-extrabold text-slate-800">{getCourierOrderStats('Pathao')} টি</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">REDX লাইভে মোট পার্সেল:</span>
                <span className="font-extrabold text-slate-800">{getCourierOrderStats('RedX')} টি</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Modal / Edit Box */}
      {editingCourier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 leading-relaxed font-sans">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-white text-sm">
                  {editingCourier === 'steadfast' ? 'স্টিডফাস্ট (Steadfast)' :
                   editingCourier === 'pathao' ? 'পাঠাও (Pathao)' : 'রেডএক্স (REDX)'} ক্রেডেনশিয়াল আপডেট
                </h3>
                <p className="text-[10px] text-slate-300">ভুল ক্রেডেনশিয়াল দিলে পার্সেল বুকিং সচল হবে না।</p>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingCourier(null)}
                className="text-slate-400 hover:text-white font-bold p-1 bg-slate-800 hover:bg-slate-700 rounded-full cursor-pointer transition text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCourierKeys} className="p-6 space-y-4">
              {editingCourier === 'steadfast' && (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-700 text-xs font-bold block">Steadfast API Key</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. stdf_api_xxxxxxx"
                      value={settings.steadfast_api_key || ''}
                      onChange={(e) => setSettings({ ...settings, steadfast_api_key: e.target.value.trim() })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-700 text-xs font-bold block">Steadfast Secret Key</label>
                    <input 
                      type="password"
                      required
                      placeholder="••••••••••••••••"
                      value={settings.steadfast_secret || ''}
                      onChange={(e) => setSettings({ ...settings, steadfast_secret: e.target.value.trim() })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {editingCourier === 'pathao' && (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-700 text-xs font-bold block">Pathao Client ID</label>
                    <input 
                      type="text"
                      required
                      value={settings.pathao_client_id || ''}
                      onChange={(e) => setSettings({ ...settings, pathao_client_id: e.target.value.trim() })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-700 text-xs font-bold block">Pathao Client Secret</label>
                    <input 
                      type="password"
                      required
                      value={settings.pathao_client_secret || ''}
                      onChange={(e) => setSettings({ ...settings, pathao_client_secret: e.target.value.trim() })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-700 text-xs font-bold block">Pathao Store ID</label>
                    <input 
                      type="text"
                      required
                      value={settings.pathao_store_id || ''}
                      onChange={(e) => setSettings({ ...settings, pathao_store_id: e.target.value.trim() })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}

              {editingCourier === 'redx' && (
                <div className="space-y-1">
                  <label className="text-slate-700 text-xs font-bold block">REDX API Key</label>
                  <input 
                    type="text"
                    required
                    value={settings.redx_api_key || ''}
                    onChange={(e) => setSettings({ ...settings, redx_api_key: e.target.value.trim() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setEditingCourier(null)}
                  className="px-4 py-2 border border-slate-200 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold cursor-pointer flex items-center gap-1"
                >
                  <Save className="h-4 w-4" /> সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
