import React, { useState, useEffect } from 'react';
import { Package, MapPin, Calendar, Clock, RotateCcw, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Search, RefreshCw, ShoppingCart, HelpCircle, Shield, TrendingUp, Users, Printer } from 'lucide-react';
import { RaincoatOrder, Size, ProductColor } from '../types';
import { getOrdersFromFirestore } from '../lib/firebase';

export default function OrderHistory() {
  const [activeTab, setActiveTab] = useState<'my-orders' | 'all-database'>('my-orders');
  
  // States for "My Orders" tab
  const [orders, setOrders] = useState<RaincoatOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<RaincoatOrder[]>([]);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled'>('All');
  const [importPhone, setImportPhone] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // States for "Customer Order Database" tab
  const [allDbOrders, setAllDbOrders] = useState<RaincoatOrder[]>([]);
  const [filteredDbOrders, setFilteredDbOrders] = useState<RaincoatOrder[]>([]);
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [activeDbFilter, setActiveDbFilter] = useState<'All' | 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled'>('All');
  const [dbExpandedOrderId, setDbExpandedOrderId] = useState<string | null>(null);
  const [isDbLoading, setIsDbLoading] = useState(false);

  const handlePrintReceipt = (order: RaincoatOrder) => {
    let pSlug = 'raincoat';
    if (order.bikeModel) {
      pSlug = 'bikecover';
    } else {
      const savedSlug = localStorage.getItem('last_ordered_product_slug');
      if (savedSlug) {
        pSlug = savedSlug;
      }
    }
    try {
      window.localStorage.setItem('temp_receipt_' + order.id, JSON.stringify(order));
    } catch (_) {}
    const fullUrl = `${window.location.origin}${window.location.pathname}#/thankyou-${pSlug}?id=${order.id}`;
    window.open(fullUrl, '_blank');
  };

  // Load orders that belong to this browser session
  const loadLocalOrders = () => {
    setIsLoading(true);
    try {
      const allOrdersJson = localStorage.getItem('raincoat_orders') || '[]';
      const allOrders: RaincoatOrder[] = JSON.parse(allOrdersJson);

      const myOrderIdsJson = localStorage.getItem('raincoat_my_order_ids') || '[]';
      const myOrderIds: string[] = JSON.parse(myOrderIdsJson);

      let myOrders = allOrders.filter(order => myOrderIds.includes(order.id));

      if (myOrders.length === 0 && allOrders.length > 0) {
        myOrders = allOrders;
      }

      myOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(myOrders);
    } catch (err) {
      console.error('Error loading local order history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load ALL database orders from Firestore
  const loadAllDatabaseOrders = () => {
    setIsDbLoading(true);
    getOrdersFromFirestore()
      .then((fbOrders) => {
        // Sort newest first
        const sorted = [...fbOrders].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setAllDbOrders(sorted);
      })
      .catch((err) => {
        console.error('Error loading all database orders:', err);
      })
      .finally(() => {
        setIsDbLoading(false);
      });
  };

  useEffect(() => {
    loadLocalOrders();
  }, []);

  // Filter "My Orders" whenever activeFilter or orders change
  useEffect(() => {
    if (activeFilter === 'All') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(o => o.status === activeFilter));
    }
  }, [activeFilter, orders]);

  // Handle filtering/searching "Customer Order Database" orders dynamically
  useEffect(() => {
    let result = allDbOrders;

    // Filter by status tab
    if (activeDbFilter !== 'All') {
      result = result.filter(o => {
        if (activeDbFilter === 'Cancelled') {
          return o.status === 'Cancelled' || o.status === 'Canceled' || o.status === 'Canceled Fake Order';
        }
        return o.status === activeDbFilter;
      });
    }

    // Filter by search query
    if (dbSearchQuery.trim()) {
      const q = dbSearchQuery.toLowerCase();
      result = result.filter(o => {
        const orderId = (o.id || '').toLowerCase();
        const customerName = (o.name || '').toLowerCase();
        const customerPhone = o.phone || '';
        const district = (o.district || '').toLowerCase();
        const village = (o.village || '').toLowerCase();
        const size = (o.size || '').toLowerCase();
        const color = (o.color || '').toLowerCase();

        return (
          orderId.includes(q) ||
          customerName.includes(q) ||
          customerPhone.includes(q) ||
          district.includes(q) ||
          village.includes(q) ||
          size.includes(q) ||
          color.includes(q)
        );
      });
    }

    setFilteredDbOrders(result);
  }, [allDbOrders, activeDbFilter, dbSearchQuery]);

  // Handle importing previous orders via phone number
  const handleImportByPhone = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = importPhone.replace(/\D/g, '').slice(-11);
    
    if (cleanPhone.length < 11) {
      setFeedbackMsg('⚠️ অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন।');
      return;
    }

    setIsLoading(true);
    getOrdersFromFirestore().then((fbOrders) => {
      try {
        const allOrdersJson = localStorage.getItem('raincoat_orders') || '[]';
        const localOrders: RaincoatOrder[] = JSON.parse(allOrdersJson);
        
        const ordersMap = new Map<string, RaincoatOrder>();
        localOrders.forEach(o => ordersMap.set(o.id, o));
        fbOrders.forEach(o => ordersMap.set(o.id, o));
        const mergedOrders = Array.from(ordersMap.values());
        
        localStorage.setItem('raincoat_orders', JSON.stringify(mergedOrders));

        const matched = mergedOrders.filter(order => {
          const cleanOrderPhone = order.phone.replace(/\D/g, '').slice(-11);
          return cleanOrderPhone === cleanPhone;
        });

        if (matched.length === 0) {
          setFeedbackMsg('❌ এই মোবাইল নাম্বার দিয়ে কোনো অর্ডার খুঁজে পাওয়া যায়নি!');
        } else {
          const myOrderIdsJson = localStorage.getItem('raincoat_my_order_ids') || '[]';
          let myOrderIds: string[] = JSON.parse(myOrderIdsJson);
          
          matched.forEach(m => {
            if (!myOrderIds.includes(m.id)) {
              myOrderIds.push(m.id);
            }
          });
          
          localStorage.setItem('raincoat_my_order_ids', JSON.stringify(myOrderIds));
          
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
      case 'Canceled':
      case 'Canceled Fake Order':
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

  const toggleDbExpandOrder = (id: string) => {
    if (dbExpandedOrderId === id) {
      setDbExpandedOrderId(null);
    } else {
      setDbExpandedOrderId(id);
    }
  };

  // Mask middle-digits of phone number for database view customer privacy
  const maskPhone = (phoneStr: string) => {
    if (!phoneStr) return '';
    const clean = phoneStr.replace(/\s+/g, '');
    if (clean.length >= 11) {
      return `${clean.substring(0, 3)}****${clean.substring(7)}`;
    }
    return phoneStr;
  };

  // Calculate stats for the database counters
  const dbStats = {
    total: allDbOrders.length,
    pending: allDbOrders.filter(o => o.status === 'Pending').length,
    shipped: allDbOrders.filter(o => o.status === 'Shipped').length,
    delivered: allDbOrders.filter(o => o.status === 'Delivered').length,
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden font-sans" id="order-history-tool">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[160%] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 space-y-2">
          <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase rounded-full tracking-wider border border-blue-500/30">
            অর্ডার হিস্টোরি হাব
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            📊 গ্রাহক অর্ডার ডাটাবেস ও ট্র্যাকিং হিস্টোরি
          </h3>
          <p className="text-slate-300 text-xs leading-relaxed max-w-lg">
            আপনার নিজের অর্ডার চেক করুন অথবা ডেটাবেসে পূর্বের অর্ডার করা গ্রাহকদের সফল ট্র্যাক রেকর্ড এবং পার্সেল শিপিং আপডেট দেখুন।
          </p>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-slate-200 bg-slate-50/50">
        <button
          onClick={() => setActiveTab('my-orders')}
          className={`flex-1 py-3 text-xs sm:text-sm font-black transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === 'my-orders'
              ? 'border-blue-600 text-blue-900 bg-white font-bold'
              : 'border-transparent text-slate-550 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          🛍️ আমার পার্সেলসমূহ ({orders.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('all-database');
            loadAllDatabaseOrders();
          }}
          className={`flex-1 py-3 text-xs sm:text-sm font-black transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === 'all-database'
              ? 'border-blue-600 text-blue-900 bg-white font-bold'
              : 'border-transparent text-slate-550 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          🌐 অল কাস্টমার ডাটাবেজ ({allDbOrders.length > 0 ? allDbOrders.length : 'লাইভ'})
        </button>
      </div>

      <div className="p-5 sm:p-8 space-y-6">
        
        {/* ==================== TAB 1: MY LOCAL ORDERS ==================== */}
        {activeTab === 'my-orders' && (
          <div className="space-y-6">
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
                if (filter === 'Delivered') filterLabel = 'ডেলিভারি সম্পন্ন';
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
                {filteredOrders.map((order) => {
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

                        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold border ${badge.classes}`}>
                            {badge.text}
                          </span>
                          <button
                            onClick={() => handlePrintReceipt(order)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shrink-0 flex items-center gap-1 text-[10.5px] font-bold transition cursor-pointer"
                            title="রসিদ প্রিন্ট"
                          >
                            <Printer className="h-3.5 w-3.5 text-blue-600" />
                            <span>প্রিন্ট</span>
                          </button>
                          <button 
                            onClick={() => toggleExpandOrder(order.id)}
                            className="text-slate-400 p-1 hover:text-slate-700 hover:bg-slate-200 rounded-lg shrink-0"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Collapsible Details */}
                      {isExpanded && (
                        <div className="border-t border-slate-150 p-5 bg-white space-y-4 text-xs">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Column 1: Product Specifications */}
                            <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2">
                              <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">পণ্য সংক্রান্ত তথ্য</h5>
                              <div className="space-y-1.5">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">আইটেম নাম:</span>
                                  <strong className="text-slate-800">প্রিমিয়াম রেনকোট সেট (জ্যাকেট+প্যান্ট)</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">আকার (Size):</span>
                                  <strong className="bg-white border px-1.5 py-0.2 rounded font-mono text-[10px]">{order.size}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">নির্বাচিত রং:</span>
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
                                  <span className="text-slate-500">ক্রেতার নাম:</span>
                                  <strong className="text-slate-800">{order.name}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">মোবাইল নম্বর:</span>
                                  <strong className="font-mono">{order.phone}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">ডেলিভারি ঠিকানা:</span>
                                  <span className="text-slate-800 text-right max-w-[160px] truncate font-semibold">
                                    {order.village}
                                    {order.policeStation && `, থানা: ${order.policeStation}`}
                                    {order.district && `, জেলা: ${order.district}`}
                                  </span>
                                </div>
                                {order.orderNotes && (
                                  <div className="flex flex-col gap-1 border-t border-dashed border-slate-200 pt-1.5 mt-1">
                                    <span className="text-slate-550 font-bold block text-[10px]">বিশেষ ডেলিভারি নির্দেশ:</span>
                                    <span className="text-blue-800 bg-blue-50/50 p-1.5 rounded-lg border border-blue-100/40 font-medium text-[11px] leading-relaxed block text-left">
                                      📝 {order.orderNotes}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between border-t border-slate-200/60 pt-1.5">
                                  <span className="text-slate-555">পেমেন্ট মেথড:</span>
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
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${order.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-800'}`}>
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
                              <p className="mt-1.5 text-[10.5px] text-slate-450 leading-relaxed bg-red-50/50 p-2 rounded-lg border border-red-150 text-red-800">
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
        )}

        {/* ==================== TAB 2: EXHAUSTIVE CUSTOMER DATABASE GIGANTIC GRID ==================== */}
        {activeTab === 'all-database' && (
          <div className="space-y-6 animate-fade-in">
            {/* Live Data Summary Counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[9.5px] font-black text-slate-400 uppercase tracking-wider">সর্বমোট অর্ডার</span>
                  <strong className="text-base font-black text-slate-800 font-mono">{dbStats.total}টি</strong>
                </div>
              </div>

              <div className="bg-emerald-50/30 border border-emerald-250/35 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[9.5px] font-black text-emerald-650/80 uppercase tracking-wider">ডেলিভারড</span>
                  <strong className="text-base font-black text-emerald-800 font-mono">{dbStats.delivered}টি</strong>
                </div>
              </div>

              <div className="bg-blue-50/30 border border-blue-250/35 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[9.5px] font-black text-blue-650/80 uppercase tracking-wider">ট্রান্সিট / শিপড</span>
                  <strong className="text-base font-black text-blue-800 font-mono">{dbStats.shipped}টি</strong>
                </div>
              </div>

              <div className="bg-amber-50/30 border border-amber-250/35 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[9.5px] font-black text-amber-650/80 uppercase tracking-wider">অপেক্ষমাণ</span>
                  <strong className="text-base font-black text-amber-800 font-mono">{dbStats.pending}টি</strong>
                </div>
              </div>
            </div>

            {/* Live Filter Controls */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch justify-between">
              {/* Dynamic Interactive Lookup Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="নাম, ফোন, জেলা, অর্ডার আইডি বা সাইজ লিখে খুঁজুন..."
                  value={dbSearchQuery}
                  onChange={(e) => setDbSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                />
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                {(['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled'] as const).map((filter) => {
                  const isSelected = activeDbFilter === filter;
                  let filterLabel = 'সকল';
                  if (filter === 'Pending') filterLabel = 'অপেক্ষমাণ';
                  if (filter === 'Shipped') filterLabel = 'শিপড্';
                  if (filter === 'Delivered') filterLabel = 'ডেলিভারি';
                  if (filter === 'Cancelled') filterLabel = 'বাতিল';

                  return (
                    <button
                      key={filter}
                      onClick={() => setActiveDbFilter(filter)}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {filterLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Database Data Display */}
            {isDbLoading ? (
              <div className="py-16 text-center">
                <div className="animate-spin h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-semibold animate-pulse">ডাটাবেজ থেকে পূর্ববর্তী কাস্টমারদের অর্ডার রিমোটলি লোড হচ্ছে...</p>
              </div>
            ) : filteredDbOrders.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <AlertCircle className="h-9 w-9 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">কোনো তথ্য মিলছে না!</h4>
                <p className="text-slate-500 text-[11px] mt-1.5 max-w-sm mx-auto leading-relaxed">
                  আপনার অনুসন্ধানকৃত কীওয়ার্ড বা ফিল্টার অনুযায়ী ডাটাবেজে কোনো আগের কাস্টমার অর্ডার রেকর্ড পাওয়া যায়নি।
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Information Header */}
                <div className="flex items-center gap-1.5 text-[10.5px] font-black text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-3 leading-relaxed">
                  <Shield className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>নিরাপত্তা সুরক্ষা এলার্ট: কাস্টমারদের গোপনীয়তা রক্ষার্থে মোবাইল নাম্বারের মাঝের অংশ আংশিক ঢেকে রাখা হয়েছে।</span>
                </div>

                {/* Desktop Gorgeous Table View */}
                <div className="hidden md:block overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-55 border-b border-slate-200 text-slate-700 font-bold text-[10.5px] uppercase tracking-wider text-left">
                        <th className="p-3.5 text-center">আইডি</th>
                        <th className="p-3.5">গ্রাহক ও জেলা</th>
                        <th className="p-3.5">মোবাইল</th>
                        <th className="p-3.5">প্রোডাক্ট তথ্য</th>
                        <th className="p-3.5">তারিখ</th>
                        <th className="p-3.5">মূল্য</th>
                        <th className="p-3.5 text-center">স্ট্যাটাস</th>
                        <th className="p-3.5 text-right min-w-[140px]">পদক্ষেপ (Actions)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-slate-800">
                      {filteredDbOrders.map((order) => {
                        const isExpanded = dbExpandedOrderId === order.id;
                        const badge = getStatusBadgeBengali(order.status);
                        const maskedPhone = maskPhone(order.phone);

                        return (
                          <React.Fragment key={order.id}>
                            <tr
                              onClick={() => toggleDbExpandOrder(order.id)}
                              className={`hover:bg-slate-50 transition-colors duration-150 cursor-pointer ${
                                isExpanded ? 'bg-blue-50/20' : ''
                              }`}
                            >
                              <td className="p-3.5 text-center font-mono font-bold text-slate-900">
                                #{order.id.replace('ord-', '').substring(0, 7)}
                              </td>
                              <td className="p-3.5">
                                <div className="font-extrabold text-slate-900">{order.name}</div>
                                <div className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5 mt-0.5">
                                  <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                                  {order.district || 'ঢাকা'}
                                </div>
                              </td>
                              <td className="p-3.5 font-mono font-semibold text-slate-600">
                                {maskedPhone}
                              </td>
                              <td className="p-3.5">
                                <span className="font-bold text-slate-800 text-[11px]">
                                  {translateColor(order.color)}
                                </span>
                                <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                                  আকার: {order.size} / {order.heightFeet}&apos;{order.heightInches}&quot;
                                </div>
                              </td>
                              <td className="p-3.5 text-slate-500 whitespace-nowrap">
                                {getFormattedDate(order.createdAt)}
                              </td>
                              <td className="p-3.5 font-mono font-black text-slate-900 text-[12px] whitespace-nowrap">
                                {order.price} TK
                              </td>
                              <td className="p-3.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border ${badge.classes}`}>
                                  {badge.text.split(' ')[0]}
                                </span>
                              </td>
                              <td className="p-3.5 text-right text-slate-400" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-2.5">
                                  <button
                                    onClick={() => handlePrintReceipt(order)}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                    title="প্রিন্ট রশিদ"
                                  >
                                    <Printer className="h-3 w-3 text-blue-600" />
                                    <span>প্রিন্ট</span>
                                  </button>
                                  <button
                                    onClick={() => toggleDbExpandOrder(order.id)}
                                    className="text-slate-400 p-1 hover:text-slate-700 hover:bg-slate-205 hover:bg-slate-200 rounded-lg transition"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4 inline" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 inline" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            
                            {isExpanded && (
                              <tr className="bg-slate-50/50">
                                <td colSpan={8} className="p-5 border-t border-b border-slate-200">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
                                      <h5 className="font-black text-slate-700 flex items-center gap-1 uppercase tracking-wider text-[10px]">
                                        📦 আইটেমস ও গ্রাহক বডিওয়েট তথ্য
                                      </h5>
                                      <div className="divide-y divide-slate-100">
                                        <div className="py-1.5 flex justify-between">
                                          <span className="text-slate-500">কালার পছন্দ:</span>
                                          <span className="font-bold">{translateColor(order.color)}</span>
                                        </div>
                                        <div className="py-1.5 flex justify-between">
                                          <span className="text-slate-500">সাইজ মেজারমেন্ট:</span>
                                          <span className="font-bold">আকার {order.size} (Size)</span>
                                        </div>
                                        <div className="py-1.5 flex justify-between">
                                          <span className="text-slate-500">গ্রাহকের উচ্চতা:</span>
                                          <span className="font-bold">{order.heightFeet} ফুট {order.heightInches} ইঞ্চি</span>
                                        </div>
                                        <div className="py-1.5 flex justify-between">
                                          <span className="text-slate-500">গ্রাহকের ওজন:</span>
                                          <span className="font-bold">{order.weight} কেজি</span>
                                        </div>
                                        {order.bikeModel && (
                                          <div className="py-1.5 flex justify-between">
                                            <span className="text-slate-500">বাইকের মডেল:</span>
                                            <span className="font-bold font-mono">{order.bikeModel}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
                                      <h5 className="font-black text-slate-700 flex items-center gap-1 uppercase tracking-wider text-[10px]">
                                        🚚 শিপিং রুট ও বিশেষ নির্দেশনা
                                      </h5>
                                      <div className="divide-y divide-slate-100">
                                        <div className="py-1.5 flex justify-between">
                                          <span className="text-slate-500">গ্রাহকের নাম:</span>
                                          <span className="font-bold">{order.name}</span>
                                        </div>
                                        <div className="py-1.5 flex items-start justify-between gap-4">
                                          <span className="text-slate-500 whitespace-nowrap">ডেলিভারি গ্রাম/এলাকা:</span>
                                          <span className="font-bold text-right text-slate-800">{order.village}</span>
                                        </div>
                                        <div className="py-1.5 flex justify-between">
                                          <span className="text-slate-500">থানা ও জেলা:</span>
                                          <span className="font-bold">{order.policeStation || 'N/A'}, {order.district || 'N/A'}</span>
                                        </div>
                                        {order.orderNotes && (
                                          <div className="py-2 flex flex-col gap-1">
                                            <span className="text-[10px] text-slate-400 font-bold">কাস্টমার কমেন্ট/স্পেশাল নোট:</span>
                                            <p className="bg-slate-50 border border-slate-150 p-2 rounded-lg text-slate-650 leading-relaxed font-semibold">
                                              📝 {order.orderNotes}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Responsive List View */}
                <div className="md:hidden space-y-3">
                  {filteredDbOrders.map((order) => {
                    const isExpanded = dbExpandedOrderId === order.id;
                    const badge = getStatusBadgeBengali(order.status);
                    const maskedPhone = maskPhone(order.phone);

                    return (
                      <div
                        key={order.id}
                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
                      >
                        <div
                          onClick={() => toggleDbExpandOrder(order.id)}
                          className="p-4 flex flex-col gap-3 cursor-pointer bg-slate-50/20 active:bg-slate-50"
                        >
                          <div className="flex justify-between items-center">
                            <span className="bg-slate-900 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                              #{order.id.replace('ord-', '').substring(0, 7)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.classes}`}>
                              {badge.text.split(' ')[0]}
                            </span>
                          </div>

                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <strong className="text-xs text-slate-900 block">{order.name}</strong>
                              <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                                📍 {order.district || 'ঢাকা'} • 📱 {maskedPhone}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <strong className="text-xs text-slate-900 font-black font-mono block">
                                {order.price} TK
                              </strong>
                              <span className="text-[9px] text-slate-400 block mt-0.5">
                                {getFormattedDate(order.createdAt).split('ট')[0]}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2.5 border-t border-slate-200/60" onClick={(e) => e.stopPropagation()}>
                            <span>{translateColor(order.color)} (সাইজ {order.size})</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handlePrintReceipt(order)}
                                className="px-1.5 py-0.5 bg-white hover:bg-slate-105 text-slate-700 border border-slate-200 rounded font-bold flex items-center gap-0.5 cursor-pointer"
                                title="রসিদ প্রিন্ট"
                              >
                                <Printer className="h-2.5 w-2.5 text-blue-600" />
                                <span>প্রিন্ট</span>
                              </button>
                              <span 
                                onClick={() => toggleDbExpandOrder(order.id)}
                                className="text-blue-600 font-bold flex items-center gap-0.5 cursor-pointer"
                              >
                                {isExpanded ? 'বন্ধ করুন' : 'দেখুন'}
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Collapsed Mobile Detail Content */}
                        {isExpanded && (
                          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs space-y-3.5">
                            <div className="bg-white border border-slate-150 rounded-xl p-3 space-y-1.5">
                              <h5 className="font-bold text-[10.5px] text-slate-500 uppercase tracking-wider">রেনকোট তথ্য</h5>
                              <div className="flex justify-between">
                                <span className="text-slate-550">বাডি সাইজ:</span>
                                <strong className="font-mono">{order.size}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-550">উচ্চতা ও ওজন:</span>
                                <strong>{order.heightFeet}&apos;{order.heightInches}&quot; / {order.weight} Kg</strong>
                              </div>
                              {order.bikeModel && (
                                <div className="flex justify-between">
                                  <span className="text-slate-550">বাইকের ব্রান্ড:</span>
                                  <span className="font-bold font-mono">{order.bikeModel}</span>
                                </div>
                              )}
                            </div>

                            <div className="bg-white border border-slate-150 rounded-xl p-3 space-y-1.5">
                              <h5 className="font-bold text-[10.5px] text-slate-500 uppercase tracking-wider">ডেলিভারি এড্রেস</h5>
                              <div className="flex justify-between items-start">
                                <span className="text-slate-550 whitespace-nowrap">গ্রাম/এলাকা:</span>
                                <strong className="text-right font-medium">{order.village}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-550">থানা ও জেলা:</span>
                                <strong>{order.policeStation || 'N/A'}, {order.district || 'N/A'}</strong>
                              </div>
                              {order.orderNotes && (
                                <div className="pt-1.5 mt-1 border-t border-dashed flex flex-col gap-1">
                                  <span className="text-[10px] text-slate-400 font-bold">বিশেষ কমেন্ট:</span>
                                  <p className="bg-blue-50/30 border border-blue-150 text-blue-900 rounded p-1.5 leading-relaxed font-semibold">
                                    {order.orderNotes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
