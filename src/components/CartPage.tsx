import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Tag, 
  CreditCard, 
  Check, 
  RefreshCw, 
  AlertCircle
} from 'lucide-react';
import { 
  getCart, 
  saveCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart,
  CartItem 
} from '../lib/cart';
import { 
  getCouponsFromFirestore, 
  getAdvancedAddonsSettingsFromFirestore,
  addOrderToFirestore
} from '../lib/firebase';
import { Coupon, RaincoatOrder } from '../types';

interface CartPageProps {
  onOrderSuccess: (order: RaincoatOrder) => void;
}

export default function CartPage({ onOrderSuccess }: CartPageProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [addons, setAddons] = useState<any>(null);
  
  // Checkout Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('ঢাকা');
  const [village, setVillage] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  
  // Partial Payments
  const [partialPaymentSender, setPartialPaymentSender] = useState('');
  const [partialPaymentTxnId, setPartialPaymentTxnId] = useState('');
  
  // Coupons Validation state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // General state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load local cart items
    const handleCartChange = () => {
      setCartItems(getCart());
    };
    
    // Initial fetch
    handleCartChange();
    
    // Register sync event
    window.addEventListener('cart-updated', handleCartChange);
    
    // Fetch addons and coupon data
    const loadData = async () => {
      try {
        const [fbCoupons, fbAddons] = await Promise.all([
          getCouponsFromFirestore(),
          getAdvancedAddonsSettingsFromFirestore()
        ]);
        setCoupons(fbCoupons || []);
        setAddons(fbAddons);
      } catch (e) {
        console.warn("Failed to load backend configurations:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    return () => {
      window.removeEventListener('cart-updated', handleCartChange);
    };
  }, []);

  // Increase Quantity handler
  const handleIncreaseQty = (index: number) => {
    const item = cartItems[index];
    updateQuantity(index, item.quantity + 1);
  };

  // Decrease Quantity handler
  const handleDecreaseQty = (index: number) => {
    const item = cartItems[index];
    if (item.quantity > 1) {
      updateQuantity(index, item.quantity - 1);
    }
  };

  // Remove Item handler
  const handleRemove = (index: number) => {
    removeFromCart(index);
  };

  // Back to Shopping redirection
  const handleBackToHome = () => {
    window.history.pushState(null, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };

  // Coupon Application Check
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);

    const code = couponCodeInput.trim().toUpperCase();
    if (!code) {
      setCouponError('কুপন কোড প্রবেশ করুন');
      return;
    }

    setIsApplyingCoupon(true);
    
    // Search the coupon in coupons list
    const found = coupons.find(c => c.code === code);
    if (!found) {
      setCouponError('ভুল বা অবৈধ কুপন কোড! অনুগ্রহ করে সঠিক কোড দিন।');
      setIsApplyingCoupon(false);
      return;
    }

    // Check validity
    const createdTime = found.createdAt ? new Date(found.createdAt).getTime() : 0;
    const durationMs = (found.validityDays || 30) * 1000 * 60 * 60 * 24;
    const elapsedMs = Date.now() - createdTime;
    const isExpired = elapsedMs > durationMs;

    if (isExpired) {
      setCouponError('দুঃখিত, এই কুপন কোডটির মেয়াদ শেষ হয়ে গিয়েছে!');
      setIsApplyingCoupon(false);
      return;
    }

    // Apply coupon
    setActiveCoupon(found);
    setCouponSuccess(`সফলভাবে প্রয়োগ হয়েছে! '${found.code}' কোডের মাধ্যমে আপনি ছাড়ের সুবিধা পেয়েছেন।`);
    setCouponCodeInput('');
    setIsApplyingCoupon(false);
  };

  // Cart math calculations
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  
  // Delivery Fee calculation
  const hasDeliveryCharge = cartItems.some(item => item.product.addDeliveryCharge !== false);
  const courierInside = addons?.inside_dhaka_delivery_charge || 60;
  const courierOutside = addons?.outside_dhaka_delivery_charge || 120;
  const deliveryFee = hasDeliveryCharge 
    ? (district === 'ঢাকা' ? courierInside : courierOutside)
    : 0;

  // Coupon Discount
  let discountAmount = 0;
  if (activeCoupon) {
    if (activeCoupon.discountType === 'percentage') {
      discountAmount = Math.round(cartTotal * (activeCoupon.discountValue / 100));
    } else {
      discountAmount = Math.min(cartTotal, activeCoupon.discountValue);
    }
  }

  const grandTotal = Math.max(0, cartTotal - discountAmount) + deliveryFee;

  // Submit/Checkout handler
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cartItems.length === 0) {
      setErrorMessage("আপনার কার্টটি সম্পূর্ণ খালি। দয়া করে আগে পণ্য যুক্ত করুন।");
      return;
    }

    if (!name.trim()) {
      setErrorMessage("দয়া করে আপনার নাম লিখুন।");
      return;
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const phoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMessage("অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)।");
      return;
    }

    if (!village.trim()) {
      setErrorMessage("অনুগ্রহ করে সাকিন/পূর্ণাঙ্গ ঠিকানা দিন।");
      return;
    }

    // Block double submissions on same session/id
    setIsSubmitting(true);

    try {
      const orderId = 'ord-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);
      const firstProduct = cartItems[0]?.product;
      const details = cartItems.map(item => `${item.product.title} (সাইজ: ${item.size || 'N/A'}, কালার: ${item.color || 'N/A'}) - পরিমাণ: ${item.quantity}টি`).join(', ');

      const orderData: RaincoatOrder = {
        id: orderId,
        name: name.trim(),
        phone: cleanPhone,
        size: (cartItems[0]?.size || 'XL') as any,
        color: (cartItems[0]?.color === 'Black' ? 'Black' : 'Navy Blue') as any,
        district,
        village: village.trim(),
        price: grandTotal,
        status: 'Pending',
        weight: 65,
        heightFeet: 5,
        heightInches: 5,
        createdAt: new Date().toISOString(),
        orderNotes: orderNotes.trim(),
        fraudScore: 0,
        fraudStatus: 'Safe',
        fraudReason: 'কাস্টমার নিজে সফলভাবে প্লেস করেছেন।',
        partialPaymentSender: partialPaymentSender.trim() || undefined,
        partialPaymentTxnId: partialPaymentTxnId.trim() || undefined,
        // Include any legacy tracking properties
        paymentStatus: 'Pending',
        deliveryStatus: 'Pending',
        isCompleted: false,
        productSlug: firstProduct?.id || 'raincoat-premium',
        productTitle: firstProduct?.title || 'Premium Thermal Raincoat',
        itemsDetails: details,
      } as any;

      await addOrderToFirestore(orderData);
      
      // Call Success Hook (display receipt etc)
      onOrderSuccess(orderData);

      // Clean local Cart
      clearCart();

    } catch (err: any) {
      setErrorMessage("অর্ডার সম্পন্ন করতে সমস্যা হয়েছে: " + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-rose-500 selection:text-white pb-16">
      {/* Alert Top Bar */}
      <div className="bg-gradient-to-r from-orange-600 via-rose-500 to-blue-900 text-white text-xs sm:text-sm font-bold text-center py-2.5 px-4 shadow-sm flex items-center justify-center gap-1.5 relative z-40">
        <span>🌧️ যেকোনো সাইজের প্রিমিয়াম রেইনকোটে বর্ষা ধামাকা অফার শুরু! ডেলিভারি সম্পূর্ণ ফ্রি! 🌧️</span>
      </div>

      {/* Elegant minimalist heading */}
      <header className="bg-white border-b border-slate-200 py-4 px-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={handleBackToHome}
            className="flex items-center gap-1.5 text-slate-700 hover:text-slate-950 font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" /> কেনাকাটা চালিয়ে যান (Back to Shop)
          </button>
          
          <h1 className="text-sm font-black text-rose-600 tracking-wider font-sans select-none flex items-center gap-2">
            🛒 প্রফেশনাল শপিং কার্ট
          </h1>
        </div>
      </header>

      {isLoading ? (
        <div className="max-w-3xl mx-auto py-24 text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-rose-500" />
          <h3 className="text-sm font-bold text-slate-700">ডিজাইন ইন্টারফেস লোড হচ্ছে...</h3>
        </div>
      ) : cartItems.length === 0 ? (
        // Empty Cart Design
        <div className="max-w-md mx-auto text-center py-20 px-6 bg-white rounded-3xl border border-slate-200 shadow-md mt-12 space-y-5 animate-fadeIn">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-3xl">🛒</div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-black text-slate-800">আপনার শপিং কার্ট খালি আছে!</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              কার্টে কোনো পণ্য খুঁজে পাওয়া যায়নি। আমাদের আকর্ষণীয় প্রিমিয়াম পণ্যগুলো অর্ডার করতে কেনাকাটা করুন।
            </p>
          </div>
          <button 
            onClick={handleBackToHome}
            className="w-full py-3 bg-slate-900 hover:bg-rose-600 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
          >
            পণ্য পছন্দ করতে যান ➔
          </button>
        </div>
      ) : (
        // Real Dynamic Cart Page Layout
        <main className="max-w-6xl mx-auto px-4 mt-8 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left side items table */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                    <ShoppingBag className="h-4 w-4 text-rose-500" /> নির্বাচিত পণ্য তালিকা ({cartItems.length}টি পণ্য)
                  </h3>
                  <button 
                    onClick={() => {
                      if (confirm("আপনি কি নিশ্চিতভাবে কার্টের সকল পণ্য মুছে ফেলতে চান?")) {
                        clearCart();
                      }
                    }}
                    className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    সব ডিলিট করুন
                  </button>
                </div>

                {/* Items loop */}
                <div className="divide-y divide-slate-100">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex gap-4 py-4 first:pt-1 last:pb-1">
                      {/* Thumbnail */}
                      <div className="w-20 h-20 bg-slate-50 border border-slate-150 rounded-xl overflow-hidden flex-shrink-0 relative">
                        <img 
                          src={item.product.image} 
                          alt={item.product.title} 
                          className="w-full h-full object-cover" 
                        />
                      </div>

                      {/* Info & Config */}
                      <div className="flex-1 space-y-2 text-left">
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.product.title}</h4>
                        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                          {item.size && (
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold font-mono">সাইজ: {item.size}</span>
                          )}
                          {item.color && (
                            <span className="bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded-md font-bold font-mono">কালার: {item.color}</span>
                          )}
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono font-bold">মূল্য: {item.product.price} BDT</span>
                        </div>
                        
                        {/* Quantity Increment/Decrement and Remove */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                            <button 
                              type="button"
                              onClick={() => handleDecreaseQty(idx)}
                              className="p-1 hover:bg-white rounded-md text-slate-500 transition cursor-pointer disabled:opacity-20"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-black text-slate-800 font-mono select-none">{item.quantity}</span>
                            <button 
                              type="button"
                              onClick={() => handleIncreaseQty(idx)}
                              className="p-1 hover:bg-white rounded-md text-slate-500 transition cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <button 
                            type="button"
                            onClick={() => handleRemove(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition text-[10px] flex items-center gap-1 font-bold cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> পণ্য সরান
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupon Promocode entry box */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-left">
                <h4 className="text-xs font-black text-slate-800 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-rose-500" /> ছাড়ে প্রমো কোড / কুপন (Coupon Discount)
                </h4>
                <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">ছাড়ে সুবিধা পেতে কুপন কোড লিখে প্রয়োগ করুন (যেমন: MONSOON200, WINTER15)।</p>
                
                <form onSubmit={handleApplyCoupon} className="flex gap-2.5">
                  <input 
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    placeholder="কুপন কোড প্রবেশ করুন"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none uppercase font-mono"
                    disabled={isApplyingCoupon}
                  />
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-rose-600 text-white text-xs font-black rounded-xl transition cursor-pointer tracking-wider"
                    disabled={isApplyingCoupon}
                  >
                    {isApplyingCoupon ? 'সিঙ্ক হচ্ছে...' : 'প্রয়োগ করুন'}
                  </button>
                </form>

                {couponError && (
                  <div className="p-3 bg-red-50 text-red-650 border border-red-100 rounded-xl mt-3 text-xs flex items-center gap-2 font-bold animate-fadeIn">
                    <AlertCircle className="h-4 w-4" /> {couponError}
                  </div>
                )}
                
                {couponSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl mt-3 text-xs flex items-center gap-2 font-bold animate-fadeIn">
                    <Check className="h-4 w-4 text-emerald-600" /> {couponSuccess}
                  </div>
                )}
              </div>
            </div>

            {/* Right side form and totals */}
            <div className="lg:col-span-5 space-y-6">
              {/* Bills pricing list summary */}
              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl space-y-4 text-left relative overflow-hidden select-none">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/10 rounded-full blur-2xl pointer-events-none" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">মোট বিল হিসাব (Pricing Bill)</h3>
                
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>পণ্য মূল্য (Items Subtotal):</span>
                    <span className="font-mono font-bold text-white">{cartTotal} BDT</span>
                  </div>

                  {activeCoupon && (
                    <div className="flex justify-between items-center text-rose-400 font-bold bg-rose-500/10 p-2 rounded-xl border border-rose-500/10">
                      <span>কুপন ছাড় (-{activeCoupon.code}):</span>
                      <span className="font-mono">- {discountAmount} BDT</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-slate-300">
                    <span>ডেলিভারি চার্জ (Inside/Outside):</span>
                    <span className="font-mono font-bold text-white">
                      {deliveryFee > 0 ? `${deliveryFee} BDT` : 'ফ্রি (FREE)'}
                    </span>
                  </div>

                  <hr className="border-slate-800 my-2" />

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm font-black text-rose-400">সর্বমোট প্রদেয় মূল্য :</span>
                    <span className="text-lg font-black font-mono text-emerald-400">{grandTotal} BDT</span>
                  </div>
                </div>
              </div>

              {/* Checkout shipping details form */}
              <form onSubmit={handleCheckoutSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-4 text-left">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                    <CreditCard className="h-4 w-4 text-rose-500" /> ক্যাশ অন ডেলিভারি (Cash on Delivery)
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">অর্ডার নিশ্চিত করতে নিম্নোক্ত ডেলিভারি ফর্মটি সঠিক তথ্যে পূরণ করুন।</p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-750 text-xs rounded-xl font-bold animate-fadeIn">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wide">আপনার নাম (Full Name)</label>
                    <input 
                      type="text"
                      placeholder="যেমন: মোঃ সাকিব হাসান"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wide">মোবাইল নাম্বার (11 Digit Mobile)</label>
                    <input 
                      type="tel"
                      placeholder="১১ ডিজিটের সচল মোবাইল নাম্বার"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wide">ডেলিভারি এলাকা (Delivery Area)</label>
                    <select 
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl font-bold focus:outline-none"
                    >
                      <option value="ঢাকা">ঢাকার মধ্যে (ডেলিভারি চার্জ {courierInside} TK)</option>
                      <option value="ঢাকার বাহিরে">ঢাকার বাইরে (ডেলিভারি চার্জ {courierOutside} TK)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wide">পূর্ণাঙ্গ ঠিকানা (Full Address)</label>
                    <textarea 
                      rows={2.5}
                      placeholder="গ্রাম/বাজার/পাড়া, পোস্ট অফিস ও থানা"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wide">অর্ডার নোট / ডেলিভারি নির্দেশনা - ঐচ্ছিক</label>
                    <textarea 
                      rows={1.5}
                      placeholder="ল্যান্ডমার্ক বা বাড়ির পাশে কোনো মসজিদ বা স্কুল থাকলে লিখে দিতে পারেন।"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                    />
                  </div>

                  {/* Partial Payments dynamic loader */}
                  {addons?.partial_payment_enabled && (
                    <div className="p-3.5 bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-100 rounded-2xl space-y-3">
                      <div className="flex items-center gap-1.5 text-pink-850 font-black text-xs">
                        <span className="w-2 h-2 bg-pink-500 rounded-full animate-ping" />
                        <span>সহজ বুকিং নিশ্চিতকরণ (অগ্রিম {addons.partial_payment_amount}৳):</span>
                      </div>
                      <p className="text-[10px] text-slate-550 leading-relaxed">{addons.partial_payment_instructions}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {addons.partial_payment_bkash && (
                          <div className="p-2 bg-white border border-pink-100 rounded-xl">
                            <span className="text-[8px] text-pink-500 block font-bold">bKash (Send Money)</span>
                            <strong className="text-slate-800 font-mono text-[11px]">{addons.partial_payment_bkash}</strong>
                          </div>
                        )}
                        {addons.partial_payment_nagad && (
                          <div className="p-2 bg-white border border-orange-100 rounded-xl">
                            <span className="text-[8px] text-orange-500 block font-bold">Nagad (Send Money)</span>
                            <strong className="text-slate-800 font-mono text-[11px]">{addons.partial_payment_nagad}</strong>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200">
                        <div>
                          <label className="block text-[8.5px] font-black text-slate-500 mb-0.5 uppercase">সেন্ডিং নম্বর</label>
                          <input 
                            type="text" 
                            placeholder="01XXXXXXXXX"
                            value={partialPaymentSender}
                            onChange={(e) => setPartialPaymentSender(e.target.value)}
                            required
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold" 
                          />
                        </div>
                        <div>
                          <label className="block text-[8.5px] font-black text-slate-500 mb-0.5 uppercase">ট্রানজেকশন আইডি (TxnID)</label>
                          <input 
                            type="text" 
                            placeholder="যেমন: B8X4K2P"
                            value={partialPaymentTxnId}
                            onChange={(e) => setPartialPaymentTxnId(e.target.value)}
                            required
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold" 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-xl hover:shadow-rose-600/10 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                  {isSubmitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>🤝 অর্ডার কনফার্ম করুন (Confirm Order)</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
