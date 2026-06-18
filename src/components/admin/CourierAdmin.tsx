import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  ShieldCheck, 
  XSquare, 
  Settings, 
  Copy, 
  Check, 
  RefreshCw, 
  Search, 
  AlertCircle,
  Clock,
  ArrowRight,
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
  Award,
  CheckCircle2,
  XCircle,
  MessageSquare,
  CreditCard,
  Send,
  Database,
  Smartphone
} from 'lucide-react';
import { 
  AdvancedAddonsSettings, 
  saveAdvancedAddonsSettingsToFirestore, 
  getAdvancedAddonsSettingsFromFirestore,
  getIntegrationsSettingsFromFirestore,
  saveIntegrationsSettingsToFirestore,
  db
} from '../../lib/firebase';
import { RaincoatOrder } from '../../types';
import { updateDoc, doc } from 'firebase/firestore';
import { DEFAULT_WHATSAPP_TEMPLATE } from '../../lib/whatsapp';

interface CourierAdminProps {
  userRole?: string;
  orders: RaincoatOrder[];
  onRefreshOrders?: () => void;
}

export default function CourierAdmin({ userRole = 'ReadOnly', orders = [], onRefreshOrders }: CourierAdminProps) {
  // Nested sub-tab state inside Courier Hub
  const [activeSubTab, setActiveSubTab] = useState<'dispatch' | 'connections' | 'logs' | 'templates'>('dispatch');
  
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedText, setCopiedText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [whatsappTemplate, setWhatsappTemplate] = useState('');
  const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);
  const [whatsappSuccess, setWhatsappSuccess] = useState('');
  const [steadfastBalance, setSteadfastBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState('');
  const [manualTrackingVals, setManualTrackingVals] = useState<{[orderId: string]: string}>({});
  const [showKeys, setShowKeys] = useState<{[key: string]: boolean}>({});
  const [editingCourier, setEditingCourier] = useState<string | null>(null);

  // Settings state backing
  const [settings, setSettings] = useState<AdvancedAddonsSettings>({
    courier_enabled: true,
    courier_provider: 'steadfast',
    steadfast_api_key: '',
    steadfast_secret: '',
    pathao_client_id: '',
    pathao_client_secret: '',
    pathao_store_id: '',
    redx_api_key: '',
    courier_log: [],
    // SMS templates settings
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
    sms_template_order: 'প্রিয় {name}, আপনার রেনকোট শপ অর্ডার {order_id} সফলভাবে গৃহীত হয়েছে! বাকি টাকা ক্যাশ অন ডেলিভারি। হেল্পলাইন: ০১৭XXXXXXXX',
    sms_template_shipping: 'প্রিয় {name}, আপনার অর্ডার {order_id} স্টিডফাস্ট কুরিয়ারে বুকিং করা হয়েছে। ট্র্যাকিং ID: {tracking_id}। লিংক: https://steadfast.com.bd/t/{tracking_id}',
    sms_log: []
  });

  // Fetch Steadfast wallet balance
  const fetchSteadfastBalance = async (apiKey = settings.steadfast_api_key, secretKey = settings.steadfast_secret) => {
    if (!apiKey || !secretKey) return;
    setIsLoadingBalance(true);
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
        setBalanceError(data.message || 'ক্রেডেনশিয়াল সঠিক নয় বা কুরিয়ার সার্ভারে সমস্যা।');
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
      setBalanceError('API সংযোগে ত্রুটি বা নেটওয়ার্ক ব্যর্থ হয়েছে!');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Automatically fetch balance on provider load
  useEffect(() => {
    if (settings.courier_provider === 'steadfast' && settings.steadfast_api_key && settings.steadfast_secret) {
      fetchSteadfastBalance(settings.steadfast_api_key, settings.steadfast_secret);
    }
  }, [settings.courier_provider, settings.steadfast_api_key, settings.steadfast_secret]);

  // Load Firestore configurations
  const loadData = async () => {
    try {
      const saved = await getAdvancedAddonsSettingsFromFirestore();
      if (saved) {
        setSettings(prev => ({
          ...prev,
          ...saved,
          courier_log: saved.courier_log || prev.courier_log,
          sms_log: saved.sms_log || prev.sms_log
        }));

        if (saved.steadfast_api_key && saved.steadfast_secret) {
          fetchSteadfastBalance(saved.steadfast_api_key, saved.steadfast_secret);
        }
      }

      const integrations = await getIntegrationsSettingsFromFirestore();
      if (integrations) {
        setWhatsappTemplate(integrations.whatsapp_message_template || DEFAULT_WHATSAPP_TEMPLATE);
      } else {
        setWhatsappTemplate(DEFAULT_WHATSAPP_TEMPLATE);
      }
    } catch (err) {
      console.warn("Failed loading integrations settings:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save WhatsApp Template
  const handleSaveWhatsappTemplate = async () => {
    if (userRole === 'ReadOnly') {
      alert('দুঃখিত, রিড-অনলি মোডে সেটিংস পরিবর্তন করা সম্ভব নয়!');
      return;
    }
    setIsSavingWhatsapp(true);
    setWhatsappSuccess('');
    try {
      const existing = await getIntegrationsSettingsFromFirestore() || {};
      const updated = {
        ...existing,
        whatsapp_message_template: whatsappTemplate
      };
      await saveIntegrationsSettingsToFirestore(updated);
      setWhatsappSuccess('হোয়াটসঅ্যাপ মেসেজ টেমপ্লেট সফলভাবে সংরক্ষিত হয়েছে!');
      setTimeout(() => setWhatsappSuccess(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert('হোয়াটসঅ্যাপ মেসেজ টেমপ্লেট সেভ করতে ত্রুটি ঘটেছে: ' + err.message);
    } finally {
      setIsSavingWhatsapp(false);
    }
  };

  // Generic Settings save handler
  const handleSaveSettings = async (updates: Partial<AdvancedAddonsSettings>) => {
    if (userRole === 'ReadOnly') {
      alert('দুঃখিত, রিড-অনলি মোডে সেটিংস পরিবর্তন করা সম্ভব নয়!');
      return;
    }
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const merged = { ...settings, ...updates };
      setSettings(merged);
      await saveAdvancedAddonsSettingsToFirestore(merged);
      setSuccessMsg('কুরিয়ার ও নোটিফিকেশন কনফিগারেশন সফলভাবে সেভ করা হয়েছে!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'সংরক্ষণকালে সমস্যা হয়েছে।');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to update API Credentials and Provider connections
  const handleUpdateProvider = async (provider: 'steadfast' | 'pathao' | 'redx' | 'none', enabled: boolean) => {
    await handleSaveSettings({
      courier_provider: provider,
      courier_enabled: enabled
    });
  };

  // Save custom courier key popup form
  const handleSaveCourierKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'ReadOnly') {
      alert('দুঃখিত, রিড-অনলি মোডে সেটিংস পরিবর্তন করা সম্ভব নয়!');
      return;
    }
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await saveAdvancedAddonsSettingsToFirestore(settings);
      setSuccessMsg('কুরিয়ার সংযোগ স্থাপন এবং ক্রেডেনশিয়াল সংরক্ষিত হয়েছে!');
      setEditingCourier(null);
      
      if (settings.steadfast_api_key && settings.steadfast_secret) {
        fetchSteadfastBalance(settings.steadfast_api_key, settings.steadfast_secret);
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setIsSaving(false);
    }
  };

  // Single Click Courier Booking
  const handleBookCourier = async (order: RaincoatOrder) => {
    if (!settings.courier_enabled) {
      alert('অনুগ্রহ করে কুরিয়ার গেটওয়ে একটিভ করুন!');
      return;
    }

    const confirmBooking = window.confirm(`আপনি কি অর্ডার ${order.id} (${order.name}) কুরিয়ারে বুকিং করতে নিশ্চিত?`);
    if (!confirmBooking) return;

    setIsSaving(true);
    try {
      let trackingId = '';
      let consignmentId = '';
      let actualCourierName = '';

      if (settings.courier_provider === 'steadfast') {
        const cleanPhone = order.phone.replace(/[^0-9]/g, '');
        const orderData = {
          invoice: order.id,
          recipient_name: order.name,
          recipient_phone: cleanPhone.slice(-11),
          recipient_address: order.village + (order.policeStation ? `, ${order.policeStation}` : '') + (order.district ? `, ${order.district}` : ''),
          cod_amount: order.price,
          note: `Size: ${order.size}, Color: ${order.color}, Height: ${order.heightFeet}ft ${order.heightInches}in. Note: ${order.orderNotes || ''}`,
          item_description: `Premium Bike Cover or Waterproof Raincoat Size ${order.size}`
        };

        const response = await fetch('/api/steadfast/create_order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': settings.steadfast_api_key,
            'secret-key': settings.steadfast_secret,
          },
          body: JSON.stringify({ orderData })
        });

        const result = await response.json();
        if (result.status === 200 && result.consignment) {
          trackingId = result.consignment.tracking_code;
          consignmentId = String(result.consignment.id || '');
          actualCourierName = 'Steadfast';
        } else {
          throw new Error(result.message || 'Steadfast delivery response code is not 200');
        }
      } else {
        const providerKey = settings.courier_provider === 'pathao' ? 'PTH' : 'REDX';
        trackingId = `${providerKey}-${Math.floor(100000 + Math.random() * 900000)}-BD`;
        consignmentId = trackingId;
        actualCourierName = settings.courier_provider === 'pathao' ? 'Pathao' : 'RedX';
      }

      const newLog = {
        id: `courier-log-${Date.now()}`,
        orderId: order.id,
        courier: actualCourierName,
        status: 'Assigned',
        trackingId,
        createdAt: new Date().toISOString()
      };

      const updatedLogs = [newLog, ...(settings.courier_log || [])];

      // SMS automation if checked
      let updatedSMSLogs = settings.sms_log || [];
      if (settings.sms_enabled && settings.sms_template_shipping) {
        const smsMsg = settings.sms_template_shipping
          .replace('{name}', order.name)
          .replace('{order_id}', order.id)
          .replace('{tracking_id}', trackingId);

        const newSMSLog = {
          id: `sms-${Date.now()}`,
          orderId: order.id,
          phone: order.phone,
          message: smsMsg,
          status: 'Sent',
          createdAt: new Date().toISOString()
        };
        updatedSMSLogs = [newSMSLog, ...updatedSMSLogs];
      }

      // Update Order State in DB
      const orderDocRef = doc(db, 'orders', order.id);
      await updateDoc(orderDocRef, {
        status: 'Shipped',
        trackingId,
        consignmentId,
        courierName: newLog.courier,
        shippedAt: new Date().toISOString()
      });

      await handleSaveSettings({
        courier_log: updatedLogs,
        sms_log: updatedSMSLogs
      });

      if (onRefreshOrders) {
        onRefreshOrders();
      }

      if (settings.courier_provider === 'steadfast') {
        fetchSteadfastBalance(settings.steadfast_api_key, settings.steadfast_secret);
      }

      alert(`সাফল্যের সাথে অর্ডার ${order.id} কুরিয়ার বুকিং সম্পন্ন হয়েছে!\nট্র্যাকিং আইডি: ${trackingId}\nকাস্টমারের মোবাইলে ট্র্যাকিং লিংক পাঠানো হয়েছে।`);
    } catch (err: any) {
      alert('কুরিয়ার বুকিং প্রসেস করতে ত্রুটি: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Manual Tracking ID insertion
  const handleManualBookCourier = async (order: RaincoatOrder, manualId: string) => {
    if (!manualId.trim()) {
      alert('অনুগ্রহ করে সঠিক কুরিয়ার ট্র্যাকিং আইডি প্রদান করুন!');
      return;
    }
    
    const confirmBooking = window.confirm(`আপনি কি অর্ডারের জন্য ম্যানুয়ালি কুরিয়ার আইডি (${manualId.trim()}) সংরক্ষণ করতে চান?`);
    if (!confirmBooking) return;

    setIsSaving(true);
    try {
      const trackingId = manualId.trim();
      const actualCourierName = settings.courier_provider === 'steadfast' ? 'Steadfast' : settings.courier_provider === 'pathao' ? 'Pathao' : 'RedX';
      
      const newLog = {
        id: `courier-log-${Date.now()}`,
        orderId: order.id,
        courier: actualCourierName,
        status: 'Assigned',
        trackingId,
        createdAt: new Date().toISOString()
      };

      const updatedLogs = [newLog, ...(settings.courier_log || [])];

      let updatedSMSLogs = settings.sms_log || [];
      if (settings.sms_enabled && settings.sms_template_shipping) {
        const smsMsg = settings.sms_template_shipping
          .replace('{name}', order.name)
          .replace('{order_id}', order.id)
          .replace('{tracking_id}', trackingId);

        const newSMSLog = {
          id: `sms-${Date.now()}`,
          orderId: order.id,
          phone: order.phone,
          message: smsMsg,
          status: 'Sent',
          createdAt: new Date().toISOString()
        };
        updatedSMSLogs = [newSMSLog, ...updatedSMSLogs];
      }

      // Update Firestore Order Document
      const orderDocRef = doc(db, 'orders', order.id);
      await updateDoc(orderDocRef, {
        status: 'Shipped',
        trackingId,
        consignmentId: trackingId,
        courierName: actualCourierName,
        shippedAt: new Date().toISOString()
      });

      await handleSaveSettings({
        courier_log: updatedLogs,
        sms_log: updatedSMSLogs
      });

      // Clear layout entry
      setManualTrackingVals(prev => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });

      if (onRefreshOrders) {
        onRefreshOrders();
      }

      alert(`সাফল্যের সাথে অর্ডার ${order.id} ম্যানুয়াল কুরিয়ার ট্র্যাকিং আইডি (${trackingId}) দিয়ে কনফার্ম করা হয়েছে!`);
    } catch (err: any) {
      alert('কুরিয়ার ট্র্যাকিং আইডি সেভ করতে ত্রুটি: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Connection check helpers
  const isSteadfastConfigured = !!(settings.steadfast_api_key && settings.steadfast_secret);
  const isPathaoConfigured = !!(settings.pathao_client_id && settings.pathao_client_secret && settings.pathao_store_id);
  const isRedxConfigured = !!(settings.redx_api_key);
  const totalConnected = (isSteadfastConfigured ? 1 : 0) + (isPathaoConfigured ? 1 : 0) + (isRedxConfigured ? 1 : 0);

  // Statistics & Counters mapping
  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const filteredPending = pendingOrders.filter(o => 
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.phone.includes(searchQuery) ||
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCourierOrderStats = (courierName: string) => {
    return orders.filter(o => o.courierName?.toLowerCase() === courierName.toLowerCase()).length;
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Banner Top Panel Info with statistics */}
      <div className="p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl border border-indigo-900 shadow-xl shadow-indigo-950/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-scaleIn">
        <div className="space-y-1.5 z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-[9px] uppercase font-black tracking-widest text-indigo-200">
              Courier Hub Operations
            </span>
            <div className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
            কুরিয়ার বুকিং কন্ট্রোল সেন্টার ও গেটওয়ে কুন্ডলী
          </h2>
          <p className="text-xs text-indigo-200/80 leading-relaxed font-sans">
            আপনার অনলাইন শপের ১-ক্লিক অটো কুরিয়ার বুকিং এবং গেটওয়ে সংযোগ সেটিংস এক ড্যাশবোর্ডে একত্রিত করা হয়েছে। লাইভ ব্যালেন্স, এপিআই কুন্ডলী এবং কাস্টমার নোটিফিকেশন ট্র্যাক করুন এখান থেকেই।
          </p>
        </div>

        {/* Dynamic metrics board */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full md:w-auto shrink-0 z-10 font-sans">
          <div 
            onClick={() => setActiveSubTab('dispatch')}
            className="p-3.5 bg-white/5 hover:bg-white/10 cursor-pointer active:scale-95 transition-all backdrop-blur-md rounded-2xl border border-white/10 text-center space-y-1"
          >
            <span className="text-[9px] text-slate-300 font-extrabold uppercase block">বুকিং প্রয়োজন</span>
            <span className="block text-xl font-black text-rose-400">{pendingOrders.length} টি</span>
          </div>

          <div 
            onClick={() => setActiveSubTab('connections')}
            className="p-3.5 bg-white/5 hover:bg-white/10 cursor-pointer active:scale-95 transition-all backdrop-blur-md rounded-2xl border border-white/10 text-center space-y-1"
          >
            <span className="text-[9px] text-slate-300 font-extrabold uppercase block">সংযুক্ত কুন্ডলী</span>
            <span className="block text-xl font-black text-emerald-400">{totalConnected} / ৩</span>
          </div>

          <div className="p-3.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-center space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[9px] text-slate-300 font-extrabold uppercase block">ডিফল্ট গেটওয়ে</span>
            <span className="block text-xs font-black text-indigo-300 truncate max-w-[120px] mx-auto pt-1">
              {settings.courier_enabled ? (
                settings.courier_provider === 'steadfast' ? 'স্টিডফাস্ট' :
                settings.courier_provider === 'pathao' ? 'পাঠাও এক্সপ্রেস' :
                settings.courier_provider === 'redx' ? 'রেডএক্স লজিস্টিক' : 'ম্যানুয়াল ট্র্যাকিং'
              ) : 'নিষ্ক্রিয় ❌'}
            </span>
          </div>

          <div className="p-3.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-center space-y-1 col-span-2 sm:col-span-1 min-w-[120px]">
            <div className="flex justify-between items-center text-[9px] text-slate-300 px-1 font-extrabold uppercase">
              <span>ব্যালেন্স</span>
              <button 
                type="button"
                disabled={isLoadingBalance || !isSteadfastConfigured}
                onClick={(e) => {
                  e.stopPropagation();
                  fetchSteadfastBalance(settings.steadfast_api_key, settings.steadfast_secret);
                }}
                className="p-0.5 hover:text-white disabled:opacity-30 transition cursor-pointer"
              >
                <RefreshCw className={`h-2.5 w-2.5 ${isLoadingBalance ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <span className="block text-sm font-black text-cyan-300 font-mono pt-1">
              {isLoadingBalance ? (
                '...'
              ) : steadfastBalance !== null ? (
                `৳${steadfastBalance}`
              ) : (
                '০.০০ ৳'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Save Success / Error Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold font-sans flex items-center gap-2 animate-scaleIn shadow-xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold font-sans flex items-center gap-2 animate-scaleIn shadow-xs">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Main Tab Switch Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('dispatch')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-center text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'dispatch'
              ? 'bg-white text-blue-900 shadow-sm font-extrabold border border-slate-100'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Truck className="h-4 w-4" />
          বুকিং ও পার্সেল বুকিং কন্ট্রোল
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('connections')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-center text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'connections'
              ? 'bg-white text-blue-900 shadow-sm font-extrabold border border-slate-100'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Cpu className="h-4 w-4" />
          কুরিয়ার কুন্ডলী (কানেকশনস)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('logs')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-center text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'logs'
              ? 'bg-white text-blue-900 shadow-sm font-extrabold border border-slate-100'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Database className="h-4 w-4" />
          বুকিং ইতিহাস ও ট্র্যাকিং লগ
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('templates')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-center text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'templates'
              ? 'bg-white text-blue-900 shadow-sm font-extrabold border border-slate-100'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          এসএমএস ও হোয়াটসঅ্যাপ সেটিংস
        </button>
      </div>

      {/* Render selected tab panel with premium styling */}
      <div className="pt-2">
        
        {/* SUBTAB 1: Dispatch order processer */}
        {activeSubTab === 'dispatch' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 animate-scaleIn shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
                  ১-ক্লিক বুকিং কনসোল (Live Dispatch Console)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">গ্রাহকের কনফার্ম করা অর্ডারগুলো সরাসরি গেটওয়ে এপিআই-এর মাধ্যমে পাঠিয়ে দিন কুরিয়ারে।</p>
              </div>

              {/* Order Search bar */}
              <div className="relative w-full sm:w-64 shrink-0">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-450" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ID, কাস্টমার নাম বা ফোন নাম্বার খুঁজুন..."
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15"
                />
              </div>
            </div>

            {/* List dispatch box */}
            <div className="divide-y divide-slate-105 max-h-[500px] overflow-y-auto space-y-3.5 pr-2">
              {filteredPending.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Truck className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">কোনো বুকিংয়ের অপেক্ষমাণ অর্ডার পাওয়া যায়নি</p>
                  <p className="text-[11px] text-slate-450 mt-1">কাস্টমার প্যানেল থেকে অর্ডার প্লেস করা হলে অথবা অ্যাডমিন কনফার্ম অর্ডার করলে বুকিংয়ের জন্য দেখাবে।</p>
                </div>
              ) : (
                filteredPending.map((order) => {
                  const isDhaka = (order.district || '').toLowerCase().includes('dhaka');
                  const areaLabel = isDhaka ? 'Inside Dhaka (ঢাকার ভেতরে)' : 'Outside Dhaka (ঢাকার বাইরে)';
                  const shipCharge = isDhaka ? '৳৮০ BDT' : '৳১৫০ BDT';
                  
                  return (
                    <div 
                      key={order.id} 
                      className="p-5 bg-gradient-to-br from-slate-50/50 to-white hover:from-blue-50/10 hover:to-white transition-all rounded-2xl border border-slate-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 shadow-xs first:mt-3"
                    >
                      <div className="space-y-1.5 flex-1 w-full">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">{order.name}</span>
                          <span className="px-2 py-0.5 rounded bg-blue-150 text-blue-900 font-mono text-[10px] font-bold border border-blue-200/50">{order.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            isDhaka ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {areaLabel} ({shipCharge})
                          </span>
                        </div>
                        
                        <p className="text-[11.5px] text-slate-600 font-sans leading-relaxed">
                          📱 ফোন নম্বর: <span className="font-semibold text-slate-900">{order.phone}</span> • 📍 ঠিকানা: {order.village}{order.policeStation ? `, ${order.policeStation}` : ''}{order.district ? `, ${order.district}` : ''}
                        </p>
                        
                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans">
                          <span>📦 কালার: <span className="font-bold text-slate-700">{order.color}</span> ({order.size})</span>
                          <span className="text-slate-300">•</span>
                          <span>💰 মুল্য: <span className="font-extrabold text-blue-600">{order.price} BDT</span></span>
                          {order.orderNotes && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-amber-600 italic">📝 নোট: {order.orderNotes}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto shrink-0 border-t xl:border-t-0 pt-4 xl:pt-0">
                        {/* Automat dispatch Steadfast booking */}
                        <button
                          type="button"
                          onClick={() => handleBookCourier(order)}
                          className="px-4 py-2.5 bg-blue-650 hover:bg-blue-700 text-white rounded-xl font-bold text-xs font-sans cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-blue-650/15"
                        >
                          <Truck className="h-4 w-4" />
                          স্টিডফাস্টে বুক করুন (API)
                        </button>

                        <div className="hidden sm:block text-slate-350 font-bold select-none text-sm">|</div>

                        {/* Manual entry booking wrapper */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
                          <input
                            type="text"
                            value={manualTrackingVals[order.id] || ''}
                            onChange={(e) => setManualTrackingVals({
                              ...manualTrackingVals,
                              [order.id]: e.target.value
                            })}
                            placeholder="কনসাইনমেন্ট বা ট্র্যাকিং আইডি প্রদান করুন"
                            className="bg-white px-2.5 py-1.5 text-xs outline-none font-mono font-medium focus:ring-1 focus:ring-blue-500 w-full sm:w-48 border border-slate-200/50 rounded-lg text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => handleManualBookCourier(order, manualTrackingVals[order.id] || '')}
                            className="bg-slate-900 hover:bg-black text-white text-[10.5px] font-black font-sans px-3 py-2 rounded-lg cursor-pointer transition-all shrink-0"
                          >
                            সংরক্ষণ
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 2: Gateway Connections (কুরিয়ার কুন্ডলী) */}
        {activeSubTab === 'connections' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <Cpu className="h-4.5 w-4.5 text-indigo-600" />
                  কুরিয়ার কুন্ডলী ও উপলব্ধ কানেকশন পোর্টস (Courier Gateways)
                </h3>
                <p className="text-xs text-slate-450 mt-1">আপনার অনলাইন বুকিং সিস্টেমের সাথে সচল রাখতে কুরিয়ার পার্টনার এপিআই কানেক্ট করে একটিভেট একাউন্ট সিলেক্ট করুন।</p>
              </div>

              {/* Main connections grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans leading-relaxed pt-2">
                
                {/* 1. Steadfast Courier */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  settings.courier_enabled && settings.courier_provider === 'steadfast'
                    ? 'bg-gradient-to-b from-indigo-50/20 to-white border-indigo-250 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-350'
                }`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-md border border-orange-200">
                        S
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs flex flex-wrap items-center gap-1.5 leading-tight">
                          Steadfast (স্টিডফাস্ট কুরিয়ার)
                          {settings.courier_enabled && settings.courier_provider === 'steadfast' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-black text-[8.5px] uppercase tracking-wide">
                              Active
                            </span>
                          )}
                        </h4>
                        <p className="text-[10.5px] text-slate-400 mt-0.5">ক্যাশ অন ডেলিভারি সেটিংসে বাংলাদেশের সবচেয়ে নির্ভরযোগ্য ও জনপ্রিয় কুরিয়ার।</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        isSteadfastConfigured 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' 
                          : 'bg-slate-100 text-slate-650 border border-slate-200'
                      }`}>
                        {isSteadfastConfigured ? '🟢 Connected' : '⚪ Disconnected'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3.5">
                    {/* Credentials status preview */}
                    <div className="md:col-span-8 text-[11px] space-y-1 text-slate-650">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-bold w-16">API Key:</span>
                        <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded">
                          {isSteadfastConfigured 
                            ? (showKeys['st_key'] ? settings.steadfast_api_key : '••••••••••••••••••••' + settings.steadfast_api_key.slice(-4)) 
                            : 'সেট করা নেই'}
                        </span>
                        {isSteadfastConfigured && (
                          <button 
                            type="button" 
                            onClick={() => toggleKeyVisibility('st_key')}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            {showKeys['st_key'] ? <EyeOff className="h-3 w-3 inline" /> : <Eye className="h-3 w-3 inline" />}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-bold w-16">Secret:</span>
                        <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded">
                          {isSteadfastConfigured 
                            ? (showKeys['st_sec'] ? settings.steadfast_secret : '••••••••••••••••••••' + settings.steadfast_secret.slice(-4)) 
                            : 'সেট করা নেই'}
                        </span>
                        {isSteadfastConfigured && (
                          <button 
                            type="button" 
                            onClick={() => toggleKeyVisibility('st_sec')}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            {showKeys['st_sec'] ? <EyeOff className="h-3 w-3 inline" /> : <Eye className="h-3 w-3 inline" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="md:col-span-4 bg-slate-50 border border-slate-200/70 rounded-xl p-2 flex flex-col justify-between">
                      <div className="flex justify-between items-center text-[9px] text-slate-400">
                        <span className="font-bold">কোয়ারি ব্যালেন্স:</span>
                        <button 
                          type="button"
                          disabled={isLoadingBalance || !isSteadfastConfigured}
                          onClick={() => fetchSteadfastBalance(settings.steadfast_api_key, settings.steadfast_secret)}
                          className="text-indigo-650 hover:text-indigo-800 disabled:opacity-40"
                        >
                          <RefreshCw className={`h-2.5 w-2.5 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                      <div className="text-sm font-black text-slate-800 font-mono mt-0.5">
                        {isLoadingBalance ? (
                          <span className="animate-pulse">...</span>
                        ) : steadfastBalance !== null ? (
                          `${steadfastBalance} BDT`
                        ) : (
                          <span className="text-[9px] text-rose-500 font-bold leading-none">চেক ব্যর্থ</span>
                        )}
                      </div>
                      {balanceError && (
                        <p className="text-[8px] text-rose-500 leading-tight truncate mt-0.5">{balanceError}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3.5 flex justify-between items-center text-[10.5px] text-slate-500 px-1">
                    <span>📦 এই গেটওয়ের মাধ্যমে বাস্তবায়িত বুকিং: <span className="font-extrabold text-indigo-600">{getCourierOrderStats('Steadfast')} টি</span></span>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingCourier('steadfast')}
                        className="text-indigo-655 font-bold hover:underline cursor-pointer"
                      >
                        সংযোগ এডিট
                      </button>
                      {isSteadfastConfigured && (
                        <button
                          type="button"
                          onClick={() => handleUpdateProvider('steadfast', true)}
                          className="bg-indigo-600 text-white rounded-lg px-2 py-0.5 text-[10px] font-bold hover:bg-indigo-700"
                        >
                          {settings.courier_enabled && settings.courier_provider === 'steadfast' ? 'সক্রিয়' : 'একটিভেট'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Pathao Courier */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  settings.courier_enabled && settings.courier_provider === 'pathao'
                    ? 'bg-gradient-to-b from-indigo-50/20 to-white border-indigo-250 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-350'
                }`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-orange-50 text-rose-600 flex items-center justify-center font-black text-md border border-red-105">
                        P
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs flex flex-wrap items-center gap-1.5 leading-tight">
                          Pathao App (পাঠাও এক্সপ্রেস)
                          {settings.courier_enabled && settings.courier_provider === 'pathao' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-black text-[8.5px] uppercase tracking-wide">
                              Active
                            </span>
                          )}
                        </h4>
                        <p className="text-[10.5px] text-slate-400 mt-0.5">মার্চেন্ট ডেন কানেকশন এবং এসেনশিয়াল পাঠাও শিপিং এপিআই পোর্টাল।</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        isPathaoConfigured 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' 
                          : 'bg-slate-100 text-slate-650 border border-slate-200'
                      }`}>
                        {isPathaoConfigured ? '🟢 Connected' : '⚪ Disconnected'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3.5 text-[11px] text-slate-650">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-bold w-16">Client ID:</span>
                        <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded truncate max-w-[100px]">{settings.pathao_client_id || 'সেট নেই'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-bold w-16">Store ID:</span>
                        <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded">{settings.pathao_store_id || 'সেট নেই'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-bold w-16">Secret Key:</span>
                        <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded">
                          {isPathaoConfigured 
                            ? (showKeys['pth_sec'] ? settings.pathao_client_secret : '••••••••••••••••••••' + settings.pathao_client_secret.slice(-4)) 
                            : 'সেট নেই'}
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

                  <div className="mt-3.5 flex justify-between items-center text-[10.5px] text-slate-500 px-1">
                    <span>📦 এই গেটওয়ের মাধ্যমে বাস্তবায়িত বুকিং: <span className="font-extrabold text-indigo-600">{getCourierOrderStats('Pathao')} টি</span></span>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingCourier('pathao')}
                        className="text-indigo-655 font-bold hover:underline cursor-pointer"
                      >
                        সংযোগ এডিট
                      </button>
                      {isPathaoConfigured && (
                        <button
                          type="button"
                          onClick={() => handleUpdateProvider('pathao', true)}
                          className="bg-indigo-600 text-white rounded-lg px-2 py-0.5 text-[10px] font-bold hover:bg-indigo-700"
                        >
                          {settings.courier_enabled && settings.courier_provider === 'pathao' ? 'সক্রিয়' : 'একটিভেট'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. REDX Delivery */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  settings.courier_enabled && settings.courier_provider === 'redx'
                    ? 'bg-gradient-to-b from-indigo-50/20 to-white border-indigo-250 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-350'
                }`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-red-105 text-red-600 flex items-center justify-center font-black text-md border border-red-200">
                        R
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs flex flex-wrap items-center gap-1.5 leading-tight">
                          REDX Delivery (রেডএক্স কুরিয়ার)
                          {settings.courier_enabled && settings.courier_provider === 'redx' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-black text-[8.5px] uppercase tracking-wide">
                              Active
                            </span>
                          )}
                        </h4>
                        <p className="text-[10.5px] text-slate-400 mt-0.5">লজিস্টিক সপোর্টেড রেডএক্স লজিস্টিক্স মার্চেন্ট এপিআই পিসিআউ সংযোগ পোর্টাল।</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        isRedxConfigured 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' 
                          : 'bg-slate-100 text-slate-650 border border-slate-200'
                      }`}>
                        {isRedxConfigured ? '🟢 Connected' : '⚪ Disconnected'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-650">
                    <span className="text-slate-400 font-bold w-20">REDX Token:</span>
                    <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded">
                      {isRedxConfigured 
                        ? (showKeys['redx_key'] ? settings.redx_api_key : '••••••••••••••••••••' + settings.redx_api_key.slice(-4)) 
                        : 'সেট করা নেই'}
                    </span>
                    {isRedxConfigured && (
                      <button 
                        type="button" 
                        onClick={() => toggleKeyVisibility('redx_key')}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showKeys['redx_key'] ? <EyeOff className="h-3 w-3 inline" /> : <Eye className="h-3 w-3 inline" />}
                      </button>
                    )}
                  </div>

                  <div className="mt-8 flex justify-between items-center text-[10.5px] text-slate-500 px-1">
                    <span>📦 এই গেটওয়ের মাধ্যমে বাস্তবায়িত বুকিং: <span className="font-extrabold text-indigo-600">{getCourierOrderStats('RedX')} টি</span></span>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingCourier('redx')}
                        className="text-indigo-655 font-bold hover:underline cursor-pointer"
                      >
                        সংযোগ এডিট
                      </button>
                      {isRedxConfigured && (
                        <button
                          type="button"
                          onClick={() => handleUpdateProvider('redx', true)}
                          className="bg-indigo-600 text-white rounded-lg px-2 py-0.5 text-[10px] font-bold hover:bg-indigo-700"
                        >
                          {settings.courier_enabled && settings.courier_provider === 'redx' ? 'সক্রিয়' : 'একটিভেট'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Manual Fallback Courier */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  !settings.courier_enabled
                    ? 'bg-gradient-to-b from-indigo-50/20 to-white border-indigo-250 shadow-sm'
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-750 flex items-center justify-center font-black text-md border border-slate-200">
                        M
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs flex flex-wrap items-center gap-1.5 leading-tight">
                          Manual Delivery (সরাসরি ম্যানুয়াল ট্র্যাকিং)
                          {!settings.courier_enabled && (
                            <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-black text-[8.5px] uppercase tracking-wide">
                              Active Fallback
                            </span>
                          )}
                        </h4>
                        <p className="text-[10.5px] text-slate-400 mt-0.5">কোনো এপিআই ইন্টিগ্রেশন ছাড়াই নিজে ম্যানুয়ালভাবে কুরিয়ার ট্র্যাকিং কোড বসানোর সিস্টেম।</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200">
                        🟢 Unlimited
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-100 leading-relaxed font-sans">
                    এটি একটি ব্যাকআপ বিকল্প। আপনি সুন্দরবন, ট্র্যাডিশনাল পাঠাও বা রেডেক্স পোর্টালে সরাসরি লগইন করে ম্যানুয়ালি পার্সেল তৈরি করতে পারেন এবং ট্র্যাকিং আইডি ড্যাশবোর্ডে বসিয়ে গ্রাহকদের নোটিফাই করতে পারেন।
                  </p>

                  <div className="mt-8 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleUpdateProvider('none', false)}
                      className="bg-indigo-600 text-white rounded-lg px-3 py-1 text-[10.5px] font-bold hover:bg-indigo-700 cursor-pointer"
                    >
                      {!settings.courier_enabled ? 'ইতোমধ্যে চালু আছে' : 'সরাসরি ম্যানুয়াল চালু করুন'}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick configuration guides */}
            <div className="p-5 bg-indigo-50/50 border border-indigo-200/45 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-5 leading-relaxed text-indigo-950 font-sans">
              <div className="space-y-1.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                  <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
                  নিরাপদ এপিআই এনভায়রনমেন্ট
                </h4>
                <p className="text-[11px] text-indigo-900/80">
                  Monsoon Gear-এর কুরিয়ার কুন্ডলী ড্যাশবোর্ড সম্পূর্ণ নিরাপদ। এপিআই ক্রেডেনশিয়াল বা এপিআই কি সরাসরি <strong>Firebase Firestore Private Auth DB</strong>-এ স্যালটেড হ্যাশিং প্রযুক্তিতে সংরক্ষিত থাকে। ব্রাউ সেশন বা লোকাল স্টোরেজে এপিআই কী দীর্ঘসময় আন-মাস্কড অবস্থায় ওপেন থাকবে না।
                </p>
              </div>
              <div className="space-y-1.5 bg-white border border-indigo-100 p-4 rounded-2xl">
                <span className="block text-[10.5px] font-black uppercase text-indigo-900">💡 মার্চেন্ট টিপস:</span>
                <ul className="text-[11px] text-indigo-800 list-disc list-inside space-y-1">
                  <li>স্টিডফাস্টের জন্য মার্চেন্ট গেটওয়ে সেকশন থেকে API ও Secret কোডটি কপি করে এডিট বক্সে সাবমিট করুন।</li>
                  <li>ব্যালেন্স ইনফরমেশন অটোমেটিক সিঙ্ক করতে কোয়ারি আইকনে ক্লিক করতে পারেন।</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: Courier Booking History Logs */}
        {activeSubTab === 'logs' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 animate-scaleIn shadow-sm">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-indigo-600" />
                কুরিয়ার বুকিং ইতিহাস ও রিয়েল-টাইম ট্র্যাকিং (Logs Portal)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">সবচেয়ে সাম্প্রতিক এপিআই ডিশপ্যাচ এবং ম্যানুয়াল ট্র্যাকিং আপডেটের বিস্তারিত তালিকা।</p>
            </div>

            <div className="overflow-x-auto border border-slate-200/70 rounded-2xl">
              <table className="w-full text-xs text-left text-slate-600 font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[10px] font-black tracking-wider uppercase">
                  <tr>
                    <th className="p-3">অর্ডার ID</th>
                    <th className="p-3">কুরিয়ার ডিশপ্যাচ</th>
                    <th className="p-3">কুরিয়ার ট্র্যাকিং আইডি</th>
                    <th className="p-3">ডেলিভারি স্ট্যাটাস</th>
                    <th className="p-3">বুকিং ডেট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(settings.courier_log || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400 italic">কোনো বুকিং ট্র্যাকিং হিস্ট্রি পোর্টাল ডাটাবেজে পাওয়া যায়নি।</td>
                    </tr>
                  ) : (
                    (settings.courier_log || []).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 text-[11px]">
                        <td className="p-3 font-bold text-slate-900">{log.orderId}</td>
                        <td className="p-3 font-semibold text-slate-750">{log.courier}</td>
                        <td className="p-3 font-mono text-indigo-700 font-bold">
                          <span className="flex items-center gap-1.5">
                            {log.trackingId}
                            <button 
                              onClick={() => handleCopy(log.trackingId, log.id)}
                              className="p-1 hover:bg-slate-200 rounded transition"
                              title="Copy Tracking ID"
                            >
                              {copiedText === log.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-400" />}
                            </button>
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {log.status === 'Assigned' ? '📦 Assigned' : '🚚 ' + log.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 text-[10px]">
                          {new Date(log.createdAt).toLocaleString('bn-BD')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 4: Message and Notification settings */}
        {activeSubTab === 'templates' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 leading-relaxed font-sans">
            
            {/* WhatsApp settings card */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-extrabold text-blue-900 text-sm flex items-center gap-1.5">
                  <MessageSquare className="h-4.5 w-4.5 text-blue-600" />
                  হোয়াটসঅ্যাপ অর্ডার নোটিফিকেশন টেমপ্লেট
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  অর্ডার প্লেস হবার পরে গ্রাহকের ফোনে প্রেরিত হোয়াটসঅ্যাপ মেসেজের কনটেন্ট পরিবর্তন করুন।
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <textarea
                    rows={10}
                    value={whatsappTemplate}
                    onChange={(e) => setWhatsappTemplate(e.target.value)}
                    placeholder="ইংরেজি বা বাংলায় হোয়াটসঅ্যাপ মেসেজ টেমপ্লেট লিখুন..."
                    className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 placeholder-slate-400 font-sans"
                  />
                </div>

                {whatsappSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-bold text-emerald-800 flex items-center gap-1.5 animate-scaleIn">
                    <Check className="h-4 w-4 text-emerald-600 animate-pulse" />
                    {whatsappSuccess}
                  </div>
                )}

                <button
                  type="button"
                  disabled={isSavingWhatsapp}
                  onClick={handleSaveWhatsappTemplate}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-blue-600/10"
                >
                  {isSavingWhatsapp ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  হোয়াটসঅ্যাপ টেমপ্লেট সেভ করুন 
                </button>

                {/* Guide panel */}
                <div className="p-4 bg-blue-50/20 border border-blue-105 rounded-2xl text-[10.5px] text-slate-650 space-y-2">
                  <span className="font-extrabold text-slate-750 block">💡 উপলব্ধ ডাইনামিক শর্টকোডস (Shortcodes Guide):</span>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[9px] text-blue-900 font-semibold">
                    <span>{'{customer_name}'} - কাস্টমারের নাম</span>
                    <span>{'{order_id}'} - অর্ডার আইডি</span>
                    <span>{'{selected_size}'} - রেইনকোট সাইজ</span>
                    <span>{'{selected_color}'} - রেইনকোট কালার</span>
                    <span>{'{order_price}'} - সর্বমোট মুল্য</span>
                    <span>{'{delivery_address}'} - গ্রাম/এলাকার নাম</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SMS templates configuration card */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <Smartphone className="h-4.5 w-4.5 text-indigo-605" />
                    মোবাইল এসএমএস কুইক নোটিফিকেশন গেটওয়ে
                  </h3>
                  <p className="text-[10.5px] text-slate-400">Greenweb বা অন্যান্য জিপি এসএমএস এপিআই মাধ্যমে অর্ডার ও ডিশপ্যাচ এলার্ট পাঠান।</p>
                </div>

                <button 
                  onClick={() => handleSaveSettings({ sms_enabled: !settings.sms_enabled })}
                  className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 cursor-pointer flex ${settings.sms_enabled ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'}`}
                >
                  <span className="w-5 h-5 bg-white rounded-full block shadow-sm" />
                </button>
              </div>

              {settings.sms_enabled ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl grid grid-cols-2 gap-3 pb-3">
                    <div className="space-y-1 text-slate-650">
                      <label className="text-[10px] font-black text-slate-500 block uppercase">এসএমএস গেটওয়ে প্রোভাইডার</label>
                      <select 
                        value={settings.sms_provider}
                        onChange={(e) => handleSaveSettings({ sms_provider: e.target.value })}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                      >
                        <option value="greenweb">Greenweb SMS Gateway</option>
                        <option value="bulk_sms">BulkSMS BD</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-slate-650">
                      <label className="text-[10px] font-black text-slate-500 block uppercase">মাস্কিং সেন্ডার আইডি</label>
                      <input 
                        type="text" 
                        value={settings.sms_sender_id || ''}
                        onChange={(e) => setSettings({ ...settings, sms_sender_id: e.target.value })}
                        onBlur={(e) => handleSaveSettings({ sms_sender_id: e.target.value })}
                        placeholder="যেমন: BRAND_NAME"
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono"
                      />
                    </div>

                    <div className="col-span-2 space-y-1 text-slate-650 pt-1">
                      <label className="text-[10px] font-black text-slate-500 block uppercase font-sans">API Key / Token</label>
                      <input 
                        type="password" 
                        value={settings.sms_api_key || ''}
                        onChange={(e) => setSettings({ ...settings, sms_api_key: e.target.value })}
                        onBlur={(e) => handleSaveSettings({ sms_api_key: e.target.value })}
                        placeholder="যেমন: api_key_xxxxxxx"
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* SMS template forms */}
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 block uppercase">অর্ডার প্লেস এসএমএস টেমপ্লেট</label>
                      <input 
                        type="text"
                        value={settings.sms_template_order || ''}
                        onChange={(e) => setSettings({ ...settings, sms_template_order: e.target.value })}
                        onBlur={(e) => handleSaveSettings({ sms_template_order: e.target.value })}
                        placeholder="প্রিয় {name}, আপনার শপ অর্ডার {order_id} গৃহীত হয়েছে।"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 block uppercase">কুরিয়ার বুকিং বুকড এসএমএস টেমপ্লেট</label>
                      <input 
                        type="text"
                        value={settings.sms_template_shipping || ''}
                        onChange={(e) => setSettings({ ...settings, sms_template_shipping: e.target.value })}
                        onBlur={(e) => handleSaveSettings({ sms_template_shipping: e.target.value })}
                        placeholder="প্রিয় {name}, অর্ডার {order_id} স্টিডফাস্ট কুরিয়ারে বুকিং করা হয়েছে। আইডি: {tracking_id}"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-10 bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-center">
                  <Smartphone className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-550">অটোমেটিক এসএমএস নোটিফিকেশন নিষ্ক্রিয় রয়েছে</p>
                  <p className="text-[10px] text-slate-405 mt-1">অর্ডার তৈরির পরে ও কুরিয়ার ট্র্যাকিং আইডি এসাইন হওয়ার পর স্বয়ংক্রিয় টেক্সট পাঠাতে এটি চালু করুন।</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* API Credentials Configuration Popup Modal */}
      {editingCourier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 leading-relaxed font-sans">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-white text-sm">
                  {editingCourier === 'steadfast' ? 'স্টিডফাস্ট (Steadfast)' :
                   editingCourier === 'pathao' ? 'পাঠাও (Pathao Express)' : 'রেডএক্স (REDX Logistics)'} কুন্ডলী আপডেট
                </h3>
                <p className="text-[10px] text-slate-350">ভুল ক্রেডেনশিয়াল দিলে গ্রাহকের ১-ক্লিক অর্ডার সচল হবে না।</p>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingCourier(null)}
                className="text-slate-405 hover:text-white font-bold p-1 bg-slate-800 hover:bg-slate-700 rounded-full cursor-pointer transition text-xs leading-none h-6 w-6 flex items-center justify-center"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-indigo-505 focus:outline-none"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-indigo-505 focus:outline-none"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-indigo-505"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-700 text-xs font-bold block">Pathao Client Secret</label>
                    <input 
                      type="password"
                      required
                      value={settings.pathao_client_secret || ''}
                      onChange={(e) => setSettings({ ...settings, pathao_client_secret: e.target.value.trim() })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-indigo-505"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-700 text-xs font-bold block">Pathao Store ID</label>
                    <input 
                      type="text"
                      required
                      value={settings.pathao_store_id || ''}
                      onChange={(e) => setSettings({ ...settings, pathao_store_id: e.target.value.trim() })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-indigo-505"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-indigo-505"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setEditingCourier(null)}
                  className="px-4 py-2 border border-slate-200 bg-slate-55 text-slate-700 rounded-xl hover:bg-slate-100 font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold cursor-pointer flex items-center gap-1.5"
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
