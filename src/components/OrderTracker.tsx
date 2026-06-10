import React, { useState, useEffect } from 'react';
import { Search, Package, MapPin, Calendar, CreditCard, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { RaincoatOrder, Size, ProductColor } from '../types';
import { getOrdersFromFirestore, updateOrderInFirestore } from '../lib/firebase';

export default function OrderTracker() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [foundOrders, setFoundOrders] = useState<RaincoatOrder[]>([]);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('ভুল সাইজ ডিক্লেয়ার করেছি');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const normalizePhone = (p: string) => {
    // Keep only digits and slice last 11 characters to support flexible leading prefixes
    const clean = p.replace(/\D/g, '');
    return clean.slice(-11);
  };

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    setSearched(true);

    if (!phoneNumber.trim()) {
      setFoundOrders([]);
      return;
    }

    const cleanInput = normalizePhone(phoneNumber);
    if (!cleanInput) {
      setFoundOrders([]);
      return;
    }

    setIsLoading(true);

    try {
      // 1. Fetch live orders from Firestore (which has fallback cache inside getOrdersFromFirestore)
      const allOrders = await getOrdersFromFirestore();

      // 2. Load custom user orders list from client-side localStorage raincoat_orders (placed in caller session)
      const localJson = localStorage.getItem('raincoat_orders') || '[]';
      let localOrders: RaincoatOrder[] = [];
      try {
        localOrders = JSON.parse(localJson);
      } catch (err) {
        console.warn("Could not parse local raincoat_orders array:", err);
      }

      // Merge both sets to guarantee that even if a guest places an order offline, it shows up
      const orderMap = new Map<string, RaincoatOrder>();
      localOrders.forEach(o => {
        if (o && o.id) orderMap.set(o.id, o);
      });
      allOrders.forEach(o => {
        if (o && o.id) orderMap.set(o.id, o);
      });

      const combinedList = Array.from(orderMap.values());

      // Filter by normalized telephone number match
      const matched = combinedList.filter(order => {
        const cleanOrderPhone = normalizePhone(order.phone || '');
        return cleanOrderPhone === cleanInput;
      });

      // Sort with newest orders first
      matched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setFoundOrders(matched);
    } catch (err) {
      console.error('Error tracking order from combined datasets:', err);
      // Absolute direct fallback purely using localstorage array
      try {
        const localJson = localStorage.getItem('raincoat_orders') || '[]';
        const localOrders: RaincoatOrder[] = JSON.parse(localJson);
        const matched = localOrders.filter(order => normalizePhone(order.phone || '') === cleanInput);
        matched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setFoundOrders(matched);
      } catch (e) {
        setFoundOrders([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically refresh tracking details if user enters a number and status updates
  const handleCancelOrder = async (orderId: string) => {
    if (!orderId) return;

    setIsSubmittingCancel(true);
    try {
      const reasonText = `গ্রাহক কর্তৃক ডিরেক্ট বাতিল: ${cancelReason}`;

      // 1. Update status to 'Cancelled' in Firestore
      try {
        await updateOrderInFirestore(orderId, { 
          status: 'Cancelled',
          fraudReason: reasonText
        });
      } catch (err) {
        console.warn("Could not update order status in Firestore (quota exceeded or offline?), modifying locally:", err);
      }

      // 2. Proactively update local storage caches so they match the cancelled status
      const localCaches = ['raincoat_orders', 'raincoat_orders_fallback'];
      localCaches.forEach((key) => {
        try {
          const listJson = localStorage.getItem(key) || '[]';
          const list: RaincoatOrder[] = JSON.parse(listJson);
          const updated = list.map(o => {
            if (o.id === orderId) {
              return { 
                ...o, 
                status: 'Cancelled' as const,
                fraudReason: reasonText
              };
            }
            return o;
          });
          localStorage.setItem(key, JSON.stringify(updated));
        } catch (_) {}
      });

      setCancellingOrderId(null);
      // Re-trigger order lookup to refresh visual state immediately
      await handleTrack();
    } catch (err) {
      console.error("Order cancel failed:", err);
      alert('অর্ডার বাতিল করতে সমস্যা হয়েছে। অনুগ্রহ করে আমাদের হেল্পলাইন নাম্বারে যোগাযোগ করুন।');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const getStatusTextBengali = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'অর্ডার প্রক্রিয়াধীন (Pending)';
      case 'Canceled':
      case 'Cancelled':
        return 'অর্ডার বাতিল (Cancelled)';
      case 'Shipped':
        return 'কুরিয়ারে পাঠানো হয়েছে (Shipped)';
      case 'Delivered':
        return 'ডেলিভারি সম্পন্ন (Delivered)';
      case 'Canceled Fake Order':
        return 'ফেক অর্ডার বাতিল (Canceled Fake Order)';
      default:
        return status;
    }
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-850 border-amber-200';
      case 'Shipped':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Cancelled':
      case 'Canceled':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Canceled Fake Order':
        return 'bg-slate-100 text-slate-500 border-slate-300 line-through opacity-75';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  const getFormattedDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  const translateColor = (color: ProductColor) => {
    return color === 'Black' ? 'কালো (Premium Black)' : 'নেভি ব্লু (Classic Navy)';
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden font-sans" id="order-tracking-tool">
      {/* Decorative top strip */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[150%] bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 space-y-2">
          <span className="px-2.5 py-1 bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase rounded-full tracking-wider border border-orange-500/30">
            স্ট্যাটাস চেক
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white">আপনার অর্ডারটি ট্র্যাক করুন</h3>
          <p className="text-slate-350 text-xs leading-relaxed max-w-lg">
            অর্ডারের সময় যে মোবাইল নাম্বারটি ব্যবহার করেছিলেন, সেটি দিয়ে মুহূর্তেই আপনার পার্সেলের সর্বশেষ অগ্রগতি ও কুরিয়ার ট্র্যাকিং স্ট্যাটাস জেনে নিন।
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Tracker Search Form */}
        <form onSubmit={handleTrack} className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">আবেদনকারীর মোবাইল নাম্বার (১১ ডিজিট)</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                📞
              </span>
              <input
                type="tel"
                placeholder="যেমন: 017XXXXXXXX"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-black text-xs sm:text-sm rounded-2xl transition duration-300 shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> লোড হচ্ছে...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" /> অর্ডার খোঁজেন
                </>
              )}
            </button>
          </div>
        </form>

        {/* Results Area */}
        {searched && !isLoading && (
          <div className="pt-4 border-t border-slate-150 animate-fade-in">
            {foundOrders.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">দুঃখিত, কোনো অর্ডার খুঁজে পাওয়া যায়নি!</h4>
                <p className="text-slate-500 text-[11px] mt-1.5 max-w-md mx-auto leading-relaxed">
                  মোবাইল নাম্বারটি সঠিকভাবে লিখন নিশ্চিত করুন (যেমন: <span className="font-semibold text-orange-600 font-mono">01624933949</span>)। যদি সবেমাত্র অর্ডার করে থাকেন, কন্টেন্ট ড্যাশবোর্ডে তালিকাভুক্ত হতে কয়েক মিনিট সময় লাগতে পারে।
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-[11px] text-slate-550 font-bold">
                  মোট <span className="text-orange-600 font-black font-mono text-xs">{foundOrders.length} টি</span> অর্ডার পাওয়া গিয়েছে:
                </p>

                {foundOrders.map((order) => {
                  const isPending = order.status === 'Pending';
                  const isShipped = order.status === 'Shipped';
                  const isDelivered = order.status === 'Delivered';
                  const isCancelled = order.status === 'Cancelled' || order.status === 'Canceled' || order.status === 'Canceled Fake Order';

                  // Stepper configurations
                  const stepConfirmed = true;
                  const stepProcessing = !isPending && !isCancelled;
                  const stepShipped = (isShipped || isDelivered) && !isCancelled;
                  const stepDelivered = isDelivered && !isCancelled;

                  return (
                    <div
                      key={order.id}
                      className="bg-slate-50 rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5 transition-shadow hover:shadow-md"
                    >
                      {/* Top Order Title & Status Badge */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">অর্ডার আইডি:</span>
                            <span className="bg-slate-900 text-white font-mono text-[11px] font-black px-2 py-0.5 rounded-lg">
                              #{order.id.startsWith('ord-') ? order.id.replace('ord-', '') : order.id}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            তারিখ: {getFormattedDate(order.createdAt)}
                          </span>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColorClass(order.status)}`}>
                          {getStatusTextBengali(order.status)}
                        </span>
                      </div>

                      {/* Content summary grid info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Package className="h-4 w-4 text-slate-450 shrink-0" />
                            <span>
                              <strong>পণ্যের বিবরণ:</strong> প্রিমিয়াম রেনকোট সেট (জ্যাকেট + প্যান্ট)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-700">
                            <span className="w-4 h-4 rounded bg-slate-200 text-center flex items-center justify-center font-bold text-[9px] text-slate-600 shrink-0">📏</span>
                            <span>
                              সাইজ: <span className="font-bold bg-white border border-slate-300 px-1 py-0.2 rounded text-slate-900 font-mono text-[10px]">{order.size}</span>
                              &nbsp;&nbsp;|&nbsp;&nbsp; 
                              রঙ: <span className="font-extrabold text-blue-900">{translateColor(order.color)}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-700">
                            <CreditCard className="h-4 w-4 text-slate-450 shrink-0" />
                            <span>
                              <strong>সর্বমোট মূল্য:</strong> <span className="font-mono font-black text-orange-600 text-sm">{order.price} TK</span>
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 text-slate-700">
                            <MapPin className="h-4 w-4 text-slate-450 shrink-0" />
                            <span>
                              <strong>ডেলিভারি ঠিকানা:</strong> {order.village}, {order.policeStation || ''}, {order.district || ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-700">
                            <span className="w-4 h-4 rounded bg-slate-200 text-center flex items-center justify-center font-bold text-[9px] text-slate-600 shrink-0">📞</span>
                            <span>
                              <strong>মোবাইল:</strong> <span className="font-mono">{order.phone}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-700">
                            <span className="w-4 h-4 rounded bg-slate-200 text-center flex items-center justify-center font-bold text-[9px] text-slate-600 shrink-0">👤</span>
                            <span>
                              <strong>গ্রাহক:</strong> {order.name}
                            </span>
                          </div>
                          {order.orderNotes && (
                            <div className="flex items-start gap-2 text-slate-700">
                              <span className="w-4 h-4 rounded bg-blue-100 text-blue-750 text-center flex items-center justify-center font-bold text-[9px] shrink-0">📝</span>
                              <span>
                                <strong>ডেলিভারি নোট:</strong> <span className="text-blue-800 bg-blue-50/70 border border-blue-150/40 px-2 py-0.5 rounded-lg text-[11px] font-semibold">{order.orderNotes}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Graphic Stepper of shipment progress */}
                      {!isCancelled ? (
                        <div className="pt-4 border-t border-slate-200">
                          <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4">
                            অর্ডারের শিপিং প্রগ্রেস বার:
                          </span>
                          
                          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-2">
                            {/* Line connecting the steps (desktop only) */}
                            <div className="hidden md:block absolute top-[15px] left-[5%] right-[5%] h-1 bg-slate-200 z-0">
                              <div 
                                className="h-full bg-orange-500 transition-all duration-500" 
                                style={{ width: stepDelivered ? '100%' : stepShipped ? '66%' : stepProcessing ? '33%' : '0%' }}
                              />
                            </div>

                            {/* Step 1: Confirmed */}
                            <div className="flex md:flex-col items-center md:text-center gap-3 md:gap-1.5 z-10 flex-1">
                              <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black shrink-0 ${
                                stepConfirmed ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-slate-400 border-slate-200'
                              }`}>
                                {stepConfirmed ? <Check className="h-4 w-4" /> : '১'}
                              </div>
                              <div className="text-left md:text-center mt-0.5">
                                <span className="block text-xs font-extrabold text-slate-800">অর্ডার রিসিভড</span>
                                <span className="block text-[9px] text-slate-500">অর্ডার পেন্ডিং অবস্থায় আছে</span>
                              </div>
                            </div>

                            {/* Step 2: Processing */}
                            <div className="flex md:flex-col items-center md:text-center gap-3 md:gap-1.5 z-10 flex-1">
                              <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black shrink-0 ${
                                stepProcessing ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-slate-400 border-slate-200'
                              }`}>
                                {stepProcessing ? <Check className="h-4 w-4" /> : '২'}
                              </div>
                              <div className="text-left md:text-center mt-0.5">
                                <span className="block text-xs font-extrabold text-slate-800">প্যাকিং ও প্রসেসিং</span>
                                <span className="block text-[9px] text-slate-500">গুণগত মান নির্ধারণ ও প্যাকেট সম্পন্ন</span>
                              </div>
                            </div>

                            {/* Step 3: Shipped */}
                            <div className="flex md:flex-col items-center md:text-center gap-3 md:gap-1.5 z-10 flex-1">
                              <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black shrink-0 ${
                                stepShipped ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-slate-400 border-slate-200'
                              }`}>
                                {stepShipped ? <Check className="h-4 w-4" /> : '৩'}
                              </div>
                              <div className="text-left md:text-center mt-0.5">
                                <span className="block text-xs font-extrabold text-slate-800">কুরিয়ারে হস্তান্তর</span>
                                <span className="block text-[9px] text-slate-500">পাঠাও/সুন্দরবন কুরিয়ারে ট্রানজিটে আছে</span>
                              </div>
                            </div>

                            {/* Step 4: Delivered */}
                            <div className="flex md:flex-col items-center md:text-center gap-3 md:gap-1.5 z-10 flex-1">
                              <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black shrink-0 ${
                                stepDelivered ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-slate-400 border-slate-200'
                              }`}>
                                {stepDelivered ? <Check className="h-4 w-4" /> : '৪'}
                              </div>
                              <div className="text-left md:text-center mt-0.5">
                                <span className="block text-xs font-extrabold text-slate-800">ডেলিভারি সম্পন্ন</span>
                                <span className="block text-[9px] text-slate-500">পণ্য বুঝে পেয়ে সফলভাবে পেমেন্ট গ্রহণ</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-rose-50 border border-rose-250 rounded-2xl text-xs text-rose-800 font-medium">
                          🚫 {order.fraudReason ? `বাতিলের কারণ: ${order.fraudReason}` : 'এই অর্ডারটি সফলভাবে বাতিল বা রিফান্ড করা হয়েছে। যেকোনো তথ্যের জন্য আমাদের কাস্টমার সার্ভিসের সাথে যোগাযোগ করতে পারেন।'}
                        </div>
                      )}

                      {/* Interactive Customer Cancel Order Request Portal */}
                      {isPending && !isCancelled && (
                        <div className="pt-4 border-t border-slate-200/80 flex flex-col gap-3">
                          {cancellingOrderId === order.id ? (
                            <div className="bg-rose-50/70 border border-rose-150 rounded-2xl p-4 space-y-3.5 animate-in slide-in-from-top-3 duration-200">
                              <div className="space-y-1">
                                <h5 className="text-rose-900 font-extrabold text-xs">অর্ডারটি কেন বাতিল করতে চাচ্ছেন?</h5>
                                <p className="text-[10px] text-slate-500 font-medium">সঠিক কারণটি জানালে আমাদের কাস্টমার সার্ভিস উন্নত করতে সহজ হবে:</p>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {[
                                  'ভুল সাইজ ডিক্লেয়ার করেছি',
                                  'অন্য কোনো রঙ লাগবে',
                                  'ভুলবশত বা ডাবল অর্ডার ছিল',
                                  'অন্য শপ থেকে অর্ডার করেছি',
                                  'ডেলিভারি চার্জ বা বাজেট সমস্যা'
                                ].map((reason) => (
                                  <label key={reason} className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition font-medium text-slate-700">
                                    <input 
                                      type="radio" 
                                      name={`cancel-reason-${order.id}`}
                                      checked={cancelReason === reason} 
                                      onChange={() => setCancelReason(reason)} 
                                      className="text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
                                    />
                                    <span>{reason}</span>
                                  </label>
                                ))}
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setCancellingOrderId(null)}
                                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-[11px] rounded-xl transition cursor-pointer"
                                  disabled={isSubmittingCancel}
                                >
                                  না, ফিরে যান
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="px-4 py-2 bg-rose-650 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-[11px] rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
                                  disabled={isSubmittingCancel}
                                >
                                  {isSubmittingCancel ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> বাতিল করা হচ্ছে...
                                    </>
                                  ) : (
                                    'বাতিলের অনুরোধ নিশ্চিত করুন'
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-100 p-3 rounded-2xl border border-slate-200 gap-2">
                              <span className="text-[10px] text-slate-600 font-bold">অর্ডার সংক্রান্ত কোনো ভুল সংশোধনের জন্য এটি কি বাতিল করতে চান?</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setCancelReason('ভুল সাইজ ডিক্লেয়ার করেছি');
                                  setCancellingOrderId(order.id);
                                }}
                                className="px-3.5 py-1.5 bg-rose-100/80 hover:bg-rose-100 text-rose-650 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-black transition cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                ❌ অর্ডার বাতিল করুন
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {searched && isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-550 border-t border-slate-150">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin mb-3" />
            <p className="text-xs font-bold animate-pulse">আপনার মোবাইল নাম্বারের অর্ডার বিবরণী খোঁজা হচ্ছে...</p>
          </div>
        )}
      </div>

      <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 px-6 sm:px-8">
        <span>হেল্পলাইন: +8801624933949</span>
        <span>২৪ ঘণ্টা একটিভ ট্র্যাকিং সিস্টেম</span>
      </div>
    </div>
  );
}
