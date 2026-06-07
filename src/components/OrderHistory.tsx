import React, { useState, useEffect } from 'react';
import { Package, MapPin, Calendar, Clock, RotateCcw, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Search, RefreshCw, ShoppingCart, HelpCircle } from 'lucide-react';
import { RaincoatOrder, Size, ProductColor } from '../types';
import { getOrdersFromFirestore } from '../lib/firebase';

export default function OrderHistory() {
  const [orders, setOrders] = useState<RaincoatOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<RaincoatOrder[]>([]);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled'>('All');
  const [importPhone, setImportPhone] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load orders that belong to this browser session
  const loadLocalOrders = () => {
    setIsLoading(true);
    try {
      const allOrdersJson = localStorage.getItem('raincoat_orders') || '[]';
      const allOrders: RaincoatOrder[] = JSON.parse(allOrdersJson);

      const myOrderIdsJson = localStorage.getItem('raincoat_my_order_ids') || '[]';
      const myOrderIds: string[] = JSON.parse(myOrderIdsJson);

      // Filter orders. If they have order IDs saved in this browser, show them.
      // Otherwise list any orders they have placed (we can also backfill if needed).
      let myOrders = allOrders.filter(order => myOrderIds.includes(order.id));

      // As a fallback / fallback experience, if myOrderIds is empty but there's only a single order or a few,
      // let's show all orders placed recently on this computer so they aren't greeted with an empty screen.
      if (myOrders.length === 0 && allOrders.length > 0) {
        myOrders = allOrders;
      }

      // Sort with newest first
      myOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(myOrders);
    } catch (err) {
      console.error('Error loading order history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLocalOrders();
  }, []);

  // Filter orders whenever activeFilter or orders change
  useEffect(() => {
    if (activeFilter === 'All') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(o => o.status === activeFilter));
    }
  }, [activeFilter, orders]);

  // Handle importing previous orders via phone number
  const handleImportByPhone = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = importPhone.replace(/\D/g, '').slice(-11);
    
    if (cleanPhone.length < 11) {
      setFeedbackMsg('⚠️ অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন।');
      return;
    }

    setIsLoading(true);
    // Directly fetch from Cloud Firestore database first so we get live data
    getOrdersFromFirestore().then((fbOrders) => {
      try {
        // Fallback or merge with local storage
        const allOrdersJson = localStorage.getItem('raincoat_orders') || '[]';
        const localOrders: RaincoatOrder[] = JSON.parse(allOrdersJson);
        
        // Merge them nicely
        const ordersMap = new Map<string, RaincoatOrder>();
        localOrders.forEach(o => ordersMap.set(o.id, o));
        fbOrders.forEach(o => ordersMap.set(o.id, o));
        const mergedOrders = Array.from(ordersMap.values());
        
        // Save merged back to raincoat_orders list
        localStorage.setItem('raincoat_orders', JSON.stringify(mergedOrders));

        const matched = mergedOrders.filter(order => {
          const cleanOrderPhone = order.phone.replace(/\D/g, '').slice(-11);
          return cleanOrderPhone === cleanPhone;
        });

        if (matched.length === 0) {
          setFeedbackMsg('❌ এই মোবাইল নাম্বার দিয়ে কোনো অর্ডার খুঁজে পাওয়া যায়নি!');
        } else {
          // Add matched order IDs to browser session raincoat_my_order_ids so they persist in history automatically
          const myOrderIdsJson = localStorage.getItem('raincoat_my_order_ids') || '[]';
          let myOrderIds: string[] = JSON.parse(myOrderIdsJson);
          
          matched.forEach(m => {
            if (!myOrderIds.includes(m.id)) {
              myOrderIds.push(m.id);
            }
          });
          
          localStorage.setItem('raincoat_my_order_ids', JSON.stringify(myOrderIds));
          
          // Re-load the merged list
          const combined = mergedOrders.filter(order => myOrderIds.includes(order.id));
          combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          setOrders(combined);
          setFeedbackMsg(`✅ সফলভাবে ${matched.length} টি অর্ডার হিস্টোরি তালিকায় যুক্ত করা হয়েছে!`);
          setImportPhone('');
        }
      } catch (err) {
        console.error("Error matching orders from database import:", err);
        setFeedbackMsg('❌ অর্ডার লোড করতে কোনো সমস্যা হয়েছে।');
      } finally {
        setIsLoading(false);
      }
    }).catch((err) => {
      console.error(err);
      setFeedbackMsg('❌ সার্ভার বা ডাটাবেজ কানেকশনে সমস্যা হয়েছে।');
      setIsLoading(false);
    });
  };

  const getStatusBadgeBengali = (status: string) => {
    switch (status) {
      case 'Pending':
        return { text: 'অপেক্ষমাণ (Pending)', classes: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'Shipped':
        return { text: 'কুরিয়ারে পাঠানো হয়েছে (Shipped)', classes: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'Delivered':
        return { text: 'ডেলিভারি সম্পন্ন (Delivered)', classes: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'Cancelled':
        return { text: 'অর্ডার বাতিল (Cancelled)', classes: 'bg-rose-50 text-rose-800 border-rose-200' };
      default:
        return { text: 'প্রক্রিয়াধীন', classes: 'bg-slate-50 text-slate-800 border-slate-200' };
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

  const toggleExpandOrder = (id: string) => {
    if (expandedOrderId === id) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(id);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden font-sans" id="order-history-tool">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[160%] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 space-y-2">
          <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase rounded-full tracking-wider border border-blue-500/30">
            গ্রাহক প্রোফাইল
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            📊 আপনার পূর্ববর্তী অর্ডার হিস্টোরি
          </h3>
          <p className="text-slate-300 text-xs leading-relaxed max-w-lg">
            এই ব্রাউজার বা মোবাইল ফোন থেকে অর্ডারকৃত রেইনকোট সমূহের তালিকা এবং বর্তমান শিপিং অগ্রগতি সহজে এক নজরে দেখে রাখুন।
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-8 space-y-6">
        
        {/* Import Form to pull previous orders */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
          <h4 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
            🔍 অন্য ফোন বা পূর্বে অর্ডার করা তথ্য খুজে পান না?
          </h4>
          <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
            আপনার মোবাইল রিচার্জ বা অর্ডার নম্বর হারিয়ে গেলে, আপনি পূর্বে ব্যবহৃত ১১ ডিজিটের মোবাইল নাম্বারটি দিয়ে সমস্ত অতীত পার্সেল এক ক্লিকে এখানে লোড করতে পারেন।
          </p>

          <form onSubmit={handleImportByPhone} className="flex flex-col sm:flex-row gap-2">
            <input
              type="tel"
              placeholder="যেমন: 01XXXXXXXXX"
              value={importPhone}
              onChange={(e) => setImportPhone(e.target.value)}
              className="flex-1 px-3.5 py-2 border border-slate-300 bg-white rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition cursor-pointer"
            >
              {isLoading ? (
                <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              তথ্য লোড করুন
            </button>
          </form>

          {feedbackMsg && (
            <p className="text-[11px] font-bold mt-2.5 text-blue-900 border border-blue-200/50 bg-blue-50/50 px-3 py-1.5 rounded-lg">
              {feedbackMsg}
            </p>
          )}
        </div>

        {/* Filter Tab System */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-3">
          {(['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled'] as const).map((filter) => {
            const isSelected = activeFilter === filter;
            let filterLabel = 'সকল অর্ডার্স';
            if (filter === 'Pending') filterLabel = 'প্রক্রিয়াধীন';
            if (filter === 'Shipped') filterLabel = 'শিপড্';
            if (filter === 'Delivered') filterLabel = 'ডেলিভারি সম্পূর্ণ';
            if (filter === 'Cancelled') filterLabel = 'বাতিল';

            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-950 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {filterLabel}
              </button>
            );
          })}
        </div>

        {/* Orders Listing View */}
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <ShoppingCart className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">তালিকা এখনও ফাকা!</h4>
            <p className="text-slate-500 text-[11px] mt-1.5 max-w-sm mx-auto leading-relaxed">
              আপনি এখনো কোনো রেইনকোট অর্ডার করেননি অথবা আপনার পূর্বে ট্র্যাক করা কোনো ইতিহাস নেই। প্রধান পাতায় গিয়ে আপনার প্রথম প্রিমিয়াম রেনকোট অর্ডার সম্পন্ন করুন।
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredOrders.map((order, idx) => {
              const isExpanded = expandedOrderId === order.id;
              const badge = getStatusBadgeBengali(order.status);

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-250 hover:shadow-md"
                >
                  {/* Card Main/Header Box */}
                  <div
                    onClick={() => toggleExpandOrder(order.id)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center text-sm shrink-0">
                        🛍️
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900">অর্ডার আইডি:</span>
                          <span className="bg-slate-900 text-white font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                            #{order.id.replace('ord-', '')}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          তারিখ: {getFormattedDate(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold border-1 ${badge.classes}`}>
                        {badge.text}
                      </span>
                      <button className="text-slate-400 p-1 hover:text-slate-700 hover:bg-slate-200 rounded-lg shrink-0">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Details */}
                  {isExpanded && (
                    <div className="border-t border-slate-150 p-5 bg-white space-y-4 text-xs animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Column 1: Product Specifications */}
                        <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2">
                          <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">পণ্য সংক্রান্ত তথ্য</h5>
                          <div className="space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-slate-550">আইটেম নাম:</span>
                              <strong className="text-slate-800">প্রিমিয়াম রেনকোট সেট (জ্যাকেট+প্যান্ট)</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-550">আকার (Size):</span>
                              <strong className="bg-white border px-1.5 py-0.2 rounded font-mono text-[10px]">{order.size}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-550">নির্বাচিত রং:</span>
                              <strong className="text-slate-800">{translateColor(order.color)}</strong>
                            </div>
                            <div className="flex justify-between border-t border-slate-200/60 pt-1.5">
                              <span className="text-slate-600 font-bold">পরিশোধিত মূল্য:</span>
                              <strong className="font-mono text-orange-600 font-black text-sm">{order.price} TK</strong>
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Shipping details */}
                        <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2">
                          <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">ডেলিভারি ঠিকানা ও গ্রাহক</h5>
                          <div className="space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-slate-550">ক্রেতার নাম:</span>
                              <strong className="text-slate-800">{order.name}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-550">মোবাইল নম্বর:</span>
                              <strong className="font-mono">{order.phone}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-550">ডেলিভারি ঠিকানা:</span>
                              <span className="text-slate-800 text-right max-w-[160px] truncate-3-lines font-semibold">
                                {order.village}
                                {order.policeStation && `, থানা: ${order.policeStation}`}
                                {order.district && `, জেলা: ${order.district}`}
                              </span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200/60 pt-1.5">
                              <span className="text-slate-550">পেমেন্ট মেথড:</span>
                              <strong className="text-emerald-700 font-bold text-[11px]">ক্যাশ অন ডেলিভারি (COD)</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timeline status bar stepper representation */}
                      <div className="pt-3 border-t border-slate-150">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2.5">
                          শিপিং মাইলফলক প্রগ্রেস ট্র্যাকিং:
                        </span>
                        
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span>বর্তমান কুরিয়ার ট্র্যাকিং স্ট্যাটাস:</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            order.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {getStatusBadgeBengali(order.status).text}
                          </span>
                        </div>
                        
                        {order.status === 'Pending' && (
                          <p className="mt-1.5 text-[10.5px] text-slate-500 leading-relaxed bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                            👌 ধন্যবাদ! আপনার অর্ডারটি আমরা গ্রহণ করেছি। খুব শীঘ্রই প্যাকেজিং কার্যক্রম শেষে আমাদের কুরিয়ার প্রতিনিধির মাধ্যমে এটি হ্যান্ডওভার করা হবে। কুরিয়ার তথ্য রেডি হওয়া মাত্র আপনি এখানে তা রিয়েল-টাইম দেখতে পাবেন।
                          </p>
                        )}
                        {order.status === 'Shipped' && (
                          <p className="mt-1.5 text-[10.5px] text-slate-500 leading-relaxed bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                            🚚 সুখবর! আপনার অর্ডারটি সুন্দরবন/পাঠাও কুরিয়ারে বুকিং সম্পন্ন করে পাঠিয়ে দেয়া হয়েছে। ২-৩ দিনের মধ্যে আপনার ঠিকানায় রেনকোট পৌঁছে যাবে। দয়া করে ফোনের কাছে অবস্থান করুন।
                          </p>
                        )}
                        {order.status === 'Delivered' && (
                          <p className="mt-1.5 text-[10.5px] text-slate-500 leading-relaxed bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                            🎉 অভিনন্দন! আপনার ডেলিভারিটি সফলভাবে সম্পন্ন হয়েছে এবং রেনকোট সেটটি আপনার নিকট হস্তান্তর করা হয়েছে। আমাদের পণ্য ব্যবহারে আপনার মন্তব্য ও যেকোনো ফিডব্যাক আমাদের সাপোর্ট নাম্বারে জানাতে পারেন।
                          </p>
                        )}
                        {order.status === 'Cancelled' && (
                          <p className="mt-1.5 text-[10.5px] text-slate-500 leading-relaxed bg-red-50/50 p-2 rounded-lg border border-red-150 text-red-800">
                            🚫 দুঃখিত, গ্রাহকের অনুরোধে অথবা কুরিয়ার চার্জ জটিলতায় এই অর্ডারটি বাতিল করা হয়েছে। আপনার কোনো জিজ্ঞাসা থাকলে যোগাযোগ করুন +8801624933949।
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 px-6 sm:px-8">
        <span>গ্রাহক সহায়তা: +8801624933949</span>
        <span>সহজে রিটার্ন ও এক্সচেঞ্জ পলিসি</span>
      </div>
    </div>
  );
}
