import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, BadgePercent, CheckCircle, Flame, MapPin, Phone, User, ShieldCheck, Scale, Ruler } from 'lucide-react';
import { motion } from 'motion/react';
import { Size, ProductColor, RaincoatOrder, InventoryItem } from '../types';
import { 
  addOrderToFirestore, 
  addIncompleteOrderToFirestore, 
  deleteIncompleteOrderFromFirestore,
  getInventoryFromFirestore,
  decrementInventoryItemInFirestore
} from '../lib/firebase';

interface OrderFormProps {
  initialSize: Size;
  selectedColor: ProductColor;
  onChangeSize: (size: Size) => void;
  onChangeColor: (color: ProductColor) => void;
  onOrderSuccess: (order: RaincoatOrder) => void;
}

const DISTRICT_LIST = [
  'ঢাকা (Dhaka)',
  'চট্টগ্রাম (Chittagong)',
  'সিলেট (Sylhet)',
  'খুলনা (Khulna)',
  'রাজশাহী (Rajshahi)',
  'বরিশাল (Barisal)',
  'রংপুর (Rangpur)',
  'ময়মনসিংহ (Mymensingh)',
  'কুমিল্লা (Comilla)',
  'গাজীপুর (Gazipur)',
  'নারায়ণগঞ্জ (Narayanganj)',
  'বগুড়া (Bogura)',
  'যশোর (Jessore)',
  'ফেনী (Feni)',
  'নোয়াখালী (Noakhali)'
];

export default function OrderForm({
  initialSize,
  selectedColor,
  onChangeSize,
  onChangeColor,
  onOrderSuccess,
}: OrderFormProps) {
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [phone, setPhone] = useState('');
  const [weight, setWeight] = useState<number>(65);
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInches, setHeightInches] = useState<number>(6);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Load Inventory state for stock-aware validation
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);

  useEffect(() => {
    getInventoryFromFirestore().then((items) => {
      if (items && items.length > 0) {
        setInventoryList(items);
      } else {
        const local = localStorage.getItem('raincoat_inventory');
        if (local) setInventoryList(JSON.parse(local));
      }
    }).catch(() => {
      const local = localStorage.getItem('raincoat_inventory');
      if (local) setInventoryList(JSON.parse(local));
    });
  }, []);

  // States to track recent duplicates (placed within past 2 hours)
  const [hasRecentOrder, setHasRecentOrder] = useState(false);
  const [recentOrderId, setRecentOrderId] = useState('');

  const normalizePhone = (p: string) => {
    const clean = p.replace(/\D/g, '');
    return clean.slice(-11);
  };

  // Real-time check for duplicate orders with same mobile number in last 2 hours
  useEffect(() => {
    const cleanInput = normalizePhone(phone);
    if (cleanInput.length < 11) {
      setHasRecentOrder(false);
      return;
    }

    try {
      const existingOrdersJson = localStorage.getItem('raincoat_orders') || '[]';
      const existingOrders: RaincoatOrder[] = JSON.parse(existingOrdersJson);
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

      const recentDuplicate = existingOrders.find(order => {
        const cleanOrderPhone = normalizePhone(order.phone);
        const isSamePhone = cleanOrderPhone === cleanInput;
        const isWithinTwoHours = new Date(order.createdAt).getTime() > twoHoursAgo;
        return isSamePhone && isWithinTwoHours;
      });

      if (recentDuplicate) {
        setHasRecentOrder(true);
        setRecentOrderId(recentDuplicate.id);
      } else {
        setHasRecentOrder(false);
      }
    } catch (err) {
      console.error('Error checking recent orders:', err);
      setHasRecentOrder(false);
    }
  }, [phone]);

  // Dynamic price calculation
  const getPrice = (sz: Size) => {
    return (sz === '3XL' || sz === '4XL') ? 1090 : 990;
  };
  
  const price = getPrice(initialSize);

  // Session ID for tracking partial draft/incomplete order
  const [sessionId] = useState(() => 'draft-' + Math.floor(100000 + Math.random() * 900000));

  // Save draft details when any field changes
  useEffect(() => {
    if (!name.trim() && !phone.trim() && !village.trim()) {
      return;
    }

    let fieldsFilledCount = 0;
    if (name.trim()) fieldsFilledCount++;
    if (phone.trim()) fieldsFilledCount++;
    if (village.trim()) fieldsFilledCount++;

    const draftOrder = {
      id: sessionId,
      name,
      phone,
      village,
      size: initialSize,
      color: selectedColor,
      weight,
      heightFeet,
      heightInches,
      price,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      fieldsFilledCount
    };

    const incompleteJson = localStorage.getItem('raincoat_incomplete_orders') || '[]';
    let incompleteOrders = JSON.parse(incompleteJson);
    
    const index = incompleteOrders.findIndex((o: any) => o.id === sessionId);
    if (index > -1) {
      // Retain original createdAt
      draftOrder.createdAt = incompleteOrders[index].createdAt;
      incompleteOrders[index] = draftOrder;
    } else {
      incompleteOrders.unshift(draftOrder);
    }

    localStorage.setItem('raincoat_incomplete_orders', JSON.stringify(incompleteOrders));

    // Upload draft changes synchronously to Firestore database
    addIncompleteOrderToFirestore(draftOrder).catch((err) => {
      console.warn("Failed to sync incomplete draft to Cloud Firestore:", err);
    });
  }, [name, phone, village, initialSize, selectedColor, weight, heightFeet, heightInches, price, sessionId]);

  // Sync size when weight changes roughly
  useEffect(() => {
    let computedSize: Size = 'XL';
    if (weight <= 60) {
      computedSize = 'XL';
    } else if (weight <= 80) {
      computedSize = 'XXL';
    } else if (weight <= 95) {
      computedSize = '3XL';
    } else {
      computedSize = '4XL';
    }
    onChangeSize(computedSize);
  }, [weight]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Strict validation
    if (!name.trim()) return setErrorMessage('অনুগ্রহ করে আপনার নাম লিখুন।');
    if (!village.trim()) return setErrorMessage('অনুগ্রহ করে আপনার গ্রাম/বাজার/পাড়া ও সঠিক ঠিকানা লিখুন।');
    
    // Bangladesh mobile number pattern: 11 digits starting with 01
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone.startsWith('01') || cleanPhone.length !== 11) {
      return setErrorMessage('অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)।');
    }

    // Stock inventory check
    const variantId = `${selectedColor}-${initialSize}`;
    const matchedStock = inventoryList.find(item => item.id === variantId);
    if (matchedStock && matchedStock.quantity <= 0) {
      return setErrorMessage(`দুঃখিত! ${selectedColor === 'Black' ? 'কালো' : 'নেভি ব্লু'} কালারের ${initialSize} সাইজের আমাদের স্টক শেষ হয়ে গিয়েছে। অনুগ্রহ করে অন্য কালার বা সাইজ পছন্দ করুন।`);
    }

    setIsSubmitting(true);

    // Save final order to database
    // We do not block the 1 second UI transition, we trigger firestore operations with handlers
    const newId = 'ord-' + Math.floor(Math.random() * 100000);
    const newOrder: RaincoatOrder = {
      id: newId,
      name,
      village,
      phone: cleanPhone,
      size: initialSize,
      color: selectedColor,
      weight,
      heightFeet,
      heightInches,
      price,
      status: 'Pending',
      isConfirmed: false, // Default unconfirmed status until authorized from panel
      createdAt: new Date().toISOString(),
    };

    // Save of final order, delete of incomplete draft, and decrement of stock
    Promise.all([
      addOrderToFirestore(newOrder),
      deleteIncompleteOrderFromFirestore(sessionId),
      decrementInventoryItemInFirestore(selectedColor, initialSize)
    ]).then(() => {
      console.log("Successfully connected order to database Firestore and decremented stock!");
    }).catch((err) => {
      console.error("Firebase connection error during submission:", err);
    });

    setTimeout(() => {
      // Save to localStorage for store owner demo retrieval / local storage fallback
      const existingOrdersJson = localStorage.getItem('raincoat_orders') || '[]';
      const existingOrders = JSON.parse(existingOrdersJson);
      existingOrders.unshift(newOrder);
      localStorage.setItem('raincoat_orders', JSON.stringify(existingOrders));

      // Save order ID to my past order IDs for local history mapping
      try {
        const myOrderIdsJson = localStorage.getItem('raincoat_my_order_ids') || '[]';
        const myOrderIds = JSON.parse(myOrderIdsJson);
        if (!myOrderIds.includes(newOrder.id)) {
          myOrderIds.push(newOrder.id);
        }
        localStorage.setItem('raincoat_my_order_ids', JSON.stringify(myOrderIds));
      } catch (err) {
        console.error('Error saving order ID to history:', err);
      }

      // Clear the temporary draft from incomplete orders because it is now verified & complete
      const incompleteJson = localStorage.getItem('raincoat_incomplete_orders') || '[]';
      let incompleteOrders = JSON.parse(incompleteJson);
      incompleteOrders = incompleteOrders.filter((o: any) => o.id !== sessionId);
      localStorage.setItem('raincoat_incomplete_orders', JSON.stringify(incompleteOrders));

      setIsSubmitting(false);
      onOrderSuccess(newOrder);

      // Reset form fields
      setName('');
      setVillage('');
      setPhone('');
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-3xl shadow-2xl border border-slate-250 overflow-hidden"
      id="order-form-container"
    >
      {/* Header */}
      <div className="bg-blue-900 p-6 text-white relative border-b border-blue-950">
        <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider font-sans shadow-md animate-pulse">
          <Flame className="h-3.5 w-3.5" /> অফার সীমিত সময়ের জন্য
        </div>
        <h3 className="text-xl sm:text-2xl font-black font-sans leading-tight mt-1 flex items-center gap-2">
          📝 ডেলিভারি অর্ডার কনফার্ম করুন
        </h3>
        <p className="text-xs text-slate-205 mt-1 font-sans">
          কোনো অগ্রিম পেমেন্ট নেই! পণ্য হাতে পেয়ে, দেখে ও ট্রাই করে মূল্য পরিশোধ করবেন।
        </p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/10 backdrop-blur-xs p-2 rounded-lg flex items-center gap-2">
            <Truck className="h-5 w-5 text-orange-400 shrink-0" />
            <div className="text-[10px] sm:text-xs">
              <span className="font-sans font-bold block">সারাদেশে হোম ডেলিভারি</span>
              <span className="font-sans text-orange-200">ডেলিভারি চার্জ সহ দাম</span>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-2 rounded-lg flex items-center gap-2">
            <BadgePercent className="h-5 w-5 text-orange-400 shrink-0" />
            <div className="text-[10px] sm:text-xs">
              <span className="font-sans font-bold block">কনফার্মেশন পেমেন্ট</span>
              <span className="font-sans text-orange-200">হাতে পেয়ে দেখে পেমেন্ট</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-sans font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Name Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 font-sans" htmlFor="full-name">
            ১. আপনার সম্পূর্ণ নাম (Full Name) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="h-4.5 w-4.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              id="full-name"
              placeholder="যেমন: এম.ডি শফিকুল"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800 transition-all font-sans"
              required
            />
          </div>
        </div>

        {/* Details Address Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 font-sans" htmlFor="address-detail">
            ২. গ্রাম / বাজার / পাড়া / এলাকার নাম ও সঠিক ঠিকানা <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="h-4.5 w-4.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              id="address-detail"
              placeholder="যেমন: কলেজ রোড, পূর্ব পাড়া, হাউজ নং ৪৭"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800 transition-all font-sans"
              required
            />
          </div>
        </div>

        {/* Mobile number */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 font-sans" htmlFor="phone-number">
            ৩. মোবাইল নাম্বার (১১ ডিজিট) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="h-4.5 w-4.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="tel"
              id="phone-number"
              placeholder="যেমন: 01712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800 transition-all font-sans font-mono"
              required
            />
          </div>
          {hasRecentOrder && (
            <div className="mt-2 p-3 bg-amber-55 text-amber-950 border border-amber-300 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2 shadow-xs animate-pulse">
              <span className="text-base">⚠️</span>
              <div>
                <strong>স্মার্ট সতর্কতা:</strong> এই মোবাইল নম্বর দিয়ে গত ২ ঘণ্টার মধ্যে ইতিমধ্যে একটি অর্ডার দেওয়া হয়েছে! (অর্ডার আইডি: <span className="font-mono bg-white/70 px-1.5 py-0.2 rounded text-slate-900 font-extrabold">#{recentOrderId.replace('ord-', '')}</span>)
                <p className="text-[10px] text-amber-800 mt-1">ভুলবশত বা দ্বিতীয়বার ডুপ্লিকেট অর্ডার সাবমিট করা এড়াতে তথ্য চেক করে নিন।</p>
              </div>
            </div>
          )}
        </div>

        {/* Physical Measurements: Weight & Height */}
        <div className="bg-blue-50/20 border border-blue-100 p-4 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold text-slate-850 font-sans flex items-center gap-1.5">
            <span className="p-1 bg-blue-100 text-blue-700 rounded-md font-bold font-mono">৪</span>
            আপনার ওজন ও উচ্চতা (সঠিক সাইজ নিশ্চিত করতে) <span className="text-red-500">*</span>
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Weight Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5 font-sans flex items-center gap-1" htmlFor="form-weight">
                <Scale className="h-3.5 w-3.5 text-blue-600" /> ওজন (Weight)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="form-weight"
                  min="45"
                  max="150"
                  value={weight}
                  onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800 font-sans font-mono font-bold"
                  required
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">কেজি (kg)</span>
              </div>
            </div>

            {/* Height Input (Feet & Inches) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-650 mb-1.5 font-sans flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5 text-blue-600" /> উচ্চতা (Height)
              </label>
              <div className="flex gap-2">
                <select
                  value={heightFeet}
                  onChange={(e) => setHeightFeet(parseInt(e.target.value))}
                  className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 font-sans font-medium"
                  id="form-height-feet"
                >
                  {[5, 6].map((ft) => (
                    <option key={ft} value={ft}>{ft} ফুট (Feet)</option>
                  ))}
                </select>
                <select
                  value={heightInches}
                  onChange={(e) => setHeightInches(parseInt(e.target.value))}
                  className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 font-sans font-medium"
                  id="form-height-inches"
                >
                  {Array.from({ length: 12 }).map((_, inch) => (
                    <option key={inch} value={inch}>{inch} ইঞ্চি (Inches)</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <p className="text-[10px] text-slate-500 italic leading-relaxed">
            * আপনার ওজন অনুযায়ী নিচের ৬ নম্বর ধাপে সঠিক রেইনকোট সাইজটি স্বয়ংক্রিয়ভাবে পরিবর্তিত হবে।
          </p>
        </div>

        {/* Color Choice */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 font-sans">
            ৫. রেইনকোটের আকর্ষণীয় রং নির্বাচন করুন (২টি কালার):
          </label>
          <div className="flex gap-3">
            {[
              { name: 'Black', label: 'কালো (Black)', activeBg: 'bg-slate-900 text-white border-slate-900', colorDot: 'bg-black' },
              { name: 'Navy Blue', label: 'নেভি ব্লু (Navy Blue)', activeBg: 'bg-blue-900 text-white border-blue-900', colorDot: 'bg-blue-800' }
            ].map((col) => {
              const isSelected = selectedColor === col.name;
              const hasQty = inventoryList.find(i => i.id === `${col.name}-${initialSize}`)?.quantity ?? 50;
              const isOut = hasQty <= 0;
              return (
                <button
                  key={col.name}
                  type="button"
                  onClick={() => onChangeColor(col.name as ProductColor)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isOut ? 'opacity-55 border-dashed hover:bg-slate-50' : ''
                  } ${
                    isSelected ? col.activeBg + ' shadow-md scale-102 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  id={`color-pills-${col.name.replace(' ', '-')}`}
                >
                  <span className={`w-3 h-3 rounded-full ${col.colorDot} border border-white/20`} />
                  <span className="font-sans">
                    {col.label} {isOut && <span className="text-[9px] text-rose-500 font-bold block sm:inline sm:ml-1">(স্টক শেষ)</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Size Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 font-sans">
            ৬. আপনার পছন্দসই রেইনকোট সাইজ (Size Chart):
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['XL', 'XXL', '3XL', '4XL'] as Size[]).map((sz) => {
              const isSelected = initialSize === sz;
              const hasQty = inventoryList.find(i => i.id === `${selectedColor}-${sz}`)?.quantity ?? 50;
              const isOut = hasQty <= 0;
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => onChangeSize(sz)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isOut ? 'opacity-60 border-dashed bg-rose-50/20' : ''
                  } ${
                    isSelected
                      ? 'bg-blue-700 text-white border-blue-800 shadow-md scale-105 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  id={`size-pills-${sz}`}
                >
                  <span className="block text-xs sm:text-sm font-mono font-bold">
                    {sz} {isOut && <span className="text-[8px] text-rose-600 block leading-none font-bold font-sans">(শেষ)</span>}
                  </span>
                  {!isOut && (
                    <span className="block text-[8px] sm:text-[9px] opacity-80 mt-0.5 font-sans">
                      {getPrice(sz)} Tk
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic checkout price calculator */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-xs font-sans text-slate-600">
            <span>১০০% প্রিমিয়াম রেনকোট সেট (১ টি)</span>
            <span className="font-mono">{price} TK</span>
          </div>
          <div className="flex justify-between items-center text-xs font-sans text-slate-600">
            <span>সারা দেশে ডেলিভারি চার্জ</span>
            <span className="text-emerald-600 font-extrabold font-sans text-[11px]">৳ ০/- (মূল্যের সাথেই অন্তর্ভুক্ত)</span>
          </div>
          <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/50 p-2.5 rounded-lg font-sans leading-relaxed">
            ⚠️ <strong>রিটার্ন পলিসি:</strong> পছন্দ না হলে অথবা রিটার্ন করতে চাইলে শুধুমাত্র কুরিয়ার চার্জ <strong>১০০ টাকা</strong> দিয়ে রিটার্ন করতে হবে।
          </div>
          <div className="h-px bg-slate-200" />
          <div className="flex justify-between items-center font-sans font-extrabold text-blue-950">
            <span className="text-sm">সর্বমোট পরিশোধযোগ্য মূল্য:</span>
            <span className="text-lg font-mono text-blue-800">{price} TK</span>
          </div>
        </div>

        {/* Order submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3.5 px-6 rounded-2xl text-white font-extrabold text-base transition-all duration-300 shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
            isSubmitting
              ? 'bg-slate-400 cursor-not-allowed shadow-none'
              : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/10 hover:shadow-orange-500/30'
          }`}
          id="confirm-order-submit"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2 font-sans">
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              অর্ডারটি কনফার্ম করা হচ্ছে...
            </span>
          ) : (
            <span className="flex items-center gap-2 font-sans text-white text-lg font-extrabold drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
              <ShoppingBag className="h-5.5 w-5.5" /> অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)
            </span>
          )}
        </button>

        <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1 font-sans">
          <ShieldCheck className="h-3.5 w-3.5 text-slate-400" /> আপনার শেয়ার করা তথ্য নিরাপদ ও সংরক্ষিত রাখা হবে।
        </p>
      </form>
    </motion.div>
  );
}
