import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, BadgePercent, CheckCircle, Flame, MapPin, Phone, User, ShieldCheck, Scale, Ruler, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { Size, ProductColor, RaincoatOrder, InventoryItem } from '../types';
import { 
  addOrderToFirestore, 
  addIncompleteOrderToFirestore, 
  deleteIncompleteOrderFromFirestore,
  getInventoryFromFirestore,
  decrementInventoryItemInFirestore,
  getOrdersFromFirestore
} from '../lib/firebase';
import { trackPixelEvent } from '../lib/tracking';

interface OrderFormProps {
  initialSize: Size | null;
  selectedColor: ProductColor | null;
  onChangeSize: (size: Size) => void;
  onChangeColor: (color: ProductColor) => void;
  onOrderSuccess: (order: RaincoatOrder) => void;
}

const DISTRICT_LIST = [
  'বাগেরহাট (Bagerhat)',
  'বান্দরবান (Bandarban)',
  'বরগুনা (Barguna)',
  'বরিশাল (Barishal)',
  'ভোলা (Bhola)',
  'বগুড়া (Bogura)',
  'ব্রাহ্মণবাড়িয়া (Brahmanbaria)',
  'চাঁদপুর (Chandpur)',
  'চাঁপাইনওয়াবগঞ্জ (Chapainawabganj)',
  'চট্টগ্রাম (Chattogram)',
  'চুয়াডাঙ্গা (Chuadanga)',
  'কক্সবাজার (Cox’s Bazar)',
  'কুমিল্লা (Cumilla)',
  'ঢাকা (Dhaka)',
  'দিনাজপুর (Dinajpur)',
  'ফরিদপুর (Faridpur)',
  'ফেনী (Feni)',
  'গাইবান্ধা (Gaibandha)',
  'গাজীপুর (Gazipur)',
  'গোপালগঞ্জ (Gopalganj)',
  'হবিগঞ্জ (Habiganj)',
  'জামালপুর (Jamalpur)',
  'যশোর (Jashore)',
  'ঝালকাঠি (Jhalokati)',
  'ঝিনাইদহ (Jhenaidah)',
  'জয়পুরহাট (Joypurhat)',
  'খাগড়াছড়ি (Khagrachhari)',
  'খুলনা (Khulna)',
  'কিশোরগঞ্জ (Kishoreganj)',
  'কুড়িগ্রাম (Kurigram)',
  'কুষ্টিয়া (Kushtia)',
  'লক্ষ্মীপুর (Lakshmipur)',
  'লালমনিরহাট (Lalmonirhat)',
  'মাদারীপুর (Madaripur)',
  'মাগুরা (Magura)',
  'মানিকগঞ্জ (Manikganj)',
  'মেহেরপুর (Meherpur)',
  'মৌলভীবাজার (Moulvibazar)',
  'মুন্সীগঞ্জ (Munshiganj)',
  'ময়মনসিংহ (Mymensingh)',
  'নওগাঁ (Naogaon)',
  'নড়াইল (Narail)',
  'নারায়ণগঞ্জ (Narayanganj)',
  'নরসিংদী (Narsingdi)',
  'নাটোর (Natore)',
  'নেত্রকোণা (Netrokona)',
  'নীলফামারী (Nilphamari)',
  'নোয়াখালী (Noakhali)',
  'পাবনা (Pabna)',
  'পঞ্চগড় (Panchagarh)',
  'পটুয়াখালী (Patuakhali)',
  'পিরোজপুর (Pirojpur)',
  'রাজবাড়ি (Rajbari)',
  'রাজশাহী (Rajshahi)',
  'রাঙামাটি (Rangamati)',
  'রংপুর (Rangpur)',
  'সাতক্ষীরা (Satkhira)',
  'শরীয়তপুর (Shariatpur)',
  'শেরপুর (Sherpur)',
  'সিরাজগঞ্জ (Sirajganj)',
  'সুনামগঞ্জ (Sunamganj)',
  'সিলেট (Sylhet)',
  'টাঙ্গাইল (Tangail)',
  'ঠাকুরগাঁও (Thakurgaon)'
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
  const [orderNotes, setOrderNotes] = useState('');
  const [weight, setWeight] = useState<number>(65);
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInches, setHeightInches] = useState<number>(6);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [whatsappConsent, setWhatsappConsent] = useState(true);

  // Load Inventory state for stock-aware validation
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);

  useEffect(() => {
    getInventoryFromFirestore().then((items) => {
      if (items && items.length > 0) {
        setInventoryList(items);
      }
    }).catch((err) => {
      console.warn("Failed to load inventory from Firestore:", err);
    });
  }, []);

  // States to track recent duplicates (placed within past 2 hours)
  const [hasRecentOrder, setHasRecentOrder] = useState(false);
  const [recentOrderId, setRecentOrderId] = useState('');

  const normalizePhone = (p: string) => {
    const clean = p.replace(/\D/g, '');
    return clean.slice(-11);
  };

  // Real-time check for duplicate orders with same mobile number in last 2 hours (direct Firestore lookup)
  useEffect(() => {
    const cleanInput = normalizePhone(phone);
    if (cleanInput.length < 11) {
      setHasRecentOrder(false);
      return;
    }

    getOrdersFromFirestore().then((existingOrders) => {
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
    }).catch((err) => {
      console.warn("Failed to verify duplicate status against Firestore:", err);
      setHasRecentOrder(false);
    });
  }, [phone]);

  // Dynamic price calculation
  const getPrice = (sz: Size | null) => {
    if (!sz) return 990;
    return (sz === '3XL' || sz === '4XL') ? 1090 : 990;
  };
  
  const price = getPrice(initialSize);

  // Trigger PixelYourSite-like InitiateCheckout event on form mount
  useEffect(() => {
    trackPixelEvent('InitiateCheckout', {
      value: price,
      currency: 'BDT',
      content_name: 'Premium Raincoat Selection',
      content_category: 'Raincoats',
    });
  }, []);

  // Session ID for tracking partial draft/incomplete order
  const [sessionId] = useState(() => 'draft-' + Math.floor(100000 + Math.random() * 900000));

  // Save draft details when any field changes
  useEffect(() => {
    if (!name.trim() && !phone.trim() && !village.trim() && !orderNotes.trim()) {
      return;
    }

    let fieldsFilledCount = 0;
    if (name.trim()) fieldsFilledCount++;
    if (phone.trim()) fieldsFilledCount++;
    if (village.trim()) fieldsFilledCount++;
    if (orderNotes.trim()) fieldsFilledCount++;

    const draftOrder = {
      id: sessionId,
      name,
      phone,
      village,
      size: (initialSize || 'XXL') as Size,
      color: (selectedColor || 'Navy Blue') as ProductColor,
      weight,
      heightFeet,
      heightInches,
      price,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      fieldsFilledCount,
      orderNotes: orderNotes.trim() || undefined,
      whatsappConsent,
    };

    // Upload draft changes synchronously to Firestore database
    addIncompleteOrderToFirestore(draftOrder).catch((err) => {
      console.warn("Failed to sync incomplete draft to Cloud Firestore:", err);
    });
  }, [name, phone, village, initialSize, selectedColor, weight, heightFeet, heightInches, price, sessionId, orderNotes, whatsappConsent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Strict validation
    if (!name.trim()) return setErrorMessage('অনুগ্রহ করে আপনার নাম লিখুন।');
    if (!village.trim()) return setErrorMessage('অনুগ্রহ করে আপনার গ্রাম/বাজার/পাড়া ও সঠিক ঠিকানা লিখুন।');
    
    // Bangladesh mobile number pattern: 11 digits starting with 01
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('88')) {
      cleanPhone = cleanPhone.substring(2);
    }
    if (!cleanPhone.startsWith('01')) {
      if (cleanPhone.startsWith('1') && cleanPhone.length === 10) {
        cleanPhone = '0' + cleanPhone;
      }
    }
    if (!cleanPhone.startsWith('01') || cleanPhone.length !== 11) {
      return setErrorMessage('অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)।');
    }

    if (!selectedColor) {
      return setErrorMessage('অনুগ্রহ করে রেইনকোটের কালার পছন্দ করুন।');
    }

    if (!initialSize) {
      return setErrorMessage('অনুগ্রহ করে রেইনকোটের সাইজ পছন্দ করুন।');
    }

    // Stock inventory check
    const variantId = `${selectedColor}-${initialSize}`;
    const matchedStock = inventoryList.find(item => item.id === variantId);
    if (matchedStock && matchedStock.quantity <= 0) {
      return setErrorMessage(`দুঃখিত! ${selectedColor === 'Black' ? 'কালো' : 'নেভি ব্লু'} কালারের ${initialSize} সাইজের আমাদের স্টক শেষ হয়ে গিয়েছে। অনুগ্রহ করে অন্য কালার বা সাইজ পছন্দ করুন।`);
    }

    setIsSubmitting(true);

    // Save final order to database
    const newId = 'ord-' + Math.floor(Math.random() * 100000);
    const newOrder: RaincoatOrder = {
      id: newId,
      name,
      village,
      phone: cleanPhone,
      size: initialSize!,
      color: selectedColor!,
      weight,
      heightFeet,
      heightInches,
      price,
      status: 'Pending',
      isConfirmed: false, // Default unconfirmed status until authorized from panel
      createdAt: new Date().toISOString(),
      orderNotes: orderNotes.trim() || undefined,
      whatsappConsent,
      synced: false,
    };

    // Save of final order, delete of incomplete draft, and decrement of stock in Firebase Cloud
    try {
      await Promise.all([
        addOrderToFirestore(newOrder),
        deleteIncompleteOrderFromFirestore(sessionId),
        decrementInventoryItemInFirestore(selectedColor!, initialSize!)
      ]);
      console.log("Successfully connected order to database Firestore and decremented stock!");
      newOrder.synced = true;
    } catch (err) {
      console.error("Firebase connection error during submission:", err);
    }

    // Dispatch Facebook Pixel / Conversion API Purchase Event with real purchase data & Advanced User Matching
    trackPixelEvent('Purchase', {
      value: newOrder.price,
      currency: 'BDT',
      content_name: `Premium Raincoat (${newOrder.color} - ${newOrder.size})`,
      content_category: 'Raincoats',
      content_ids: [newOrder.id],
      num_items: 1,
    }, {
      name: newOrder.name,
      phone: newOrder.phone,
      address: `${newOrder.village}, Bangladesh`,
    });

    setIsSubmitting(false);
    onOrderSuccess(newOrder);

    // Reset form fields
    setName('');
    setVillage('');
    setPhone('');
    setOrderNotes('');
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
      <div className="bg-blue-900 p-4 text-white relative border-b border-blue-950 flex justify-between items-center">
        <h3 className="text-sm font-bold font-sans flex items-center gap-2">
          অর্ডার ফর্ম
        </h3>
        <div className="bg-orange-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider font-sans shadow-md">
          <Flame className="h-3.5 w-3.5" /> অফার সীমিত সময়ের জন্য
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
          
          <p className="text-[10px] text-blue-800 bg-blue-50/50 p-2 rounded-lg font-semibold leading-relaxed">
            📍 আপনার ওজনের জন্য উপযুক্ত রেইনকোট সাইজ হচ্ছে: <strong className="font-mono text-xs">{(() => {
              if (weight <= 60) return 'XL';
              if (weight <= 80) return 'XXL';
              if (weight <= 95) return '3XL';
              return '4XL';
            })()}</strong>। অনুগ্রহ করে নিচে ৬ নম্বর ধাপে ক্লিক করে সাইজটি ম্যানুয়ালি সিলেক্ট করুন।
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
              const hasQty = initialSize ? (inventoryList.find(i => i.id === `${col.name}-${initialSize}`)?.quantity ?? 50) : 50;
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
              const hasQty = selectedColor ? (inventoryList.find(i => i.id === `${selectedColor}-${sz}`)?.quantity ?? 50) : 50;
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

        {/* Order Notes (Optional Delivery Instructions) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 font-sans" htmlFor="order-notes">
            ৭. বিশেষ ডেলিভারি নির্দেশনাবলী (ঐচ্ছিক - যেমন: ল্যান্ডমার্ক বা পছন্দের সময়)
          </label>
          <div className="relative">
            <FileText className="h-4.5 w-4.5 text-slate-400 absolute left-3 top-3" />
            <textarea
              id="order-notes"
              placeholder="যেমন: ৩য় তলার ফ্ল্যাট-বি, ৫টার পর ডেলিভারি দিন, অথবা কোনো বিশিষ্ট ল্যান্ডমার্ক।"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              rows={2}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800 transition-all font-sans resize-none"
            />
          </div>
        </div>

        {/* WhatsApp consent checkbox */}
        <div className="bg-emerald-50/45 border border-emerald-100 rounded-xl p-3 flex items-start gap-2.5">
          <input
            type="checkbox"
            id="whatsapp-consent"
            checked={whatsappConsent}
            onChange={(e) => setWhatsappConsent(e.target.checked)}
            className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 bg-white border-slate-300 h-4 w-4 cursor-pointer"
          />
          <label htmlFor="whatsapp-consent" className="text-[11px] sm:text-xs text-slate-700 font-bold cursor-pointer font-sans leading-normal">
            হোয়াটসঅ্যাপে আমার অর্ডারের আপডেট পাঠান (Send me status updates via WhatsApp)
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">আমরা আপনার পার্সেলে বুকিং বিবরণ, ট্র্যাকিং আইডি ও অর্ডার আপডেট হোয়াটসঅ্যাপে লাইভ পাঠাব।</span>
          </label>
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
