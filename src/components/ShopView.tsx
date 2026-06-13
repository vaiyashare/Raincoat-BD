import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, CheckCircle, Smartphone, MapPin, Sparkles, Check, CreditCard,
  Trash2, Plus, Minus, ShieldCheck, Heart, Star, Phone, MessageSquare
} from 'lucide-react';
import { RaincoatOrder } from '../types';
import { 
  getProductsFromFirestore, 
  addOrderToFirestore, 
  getAdvancedAddonsSettingsFromFirestore,
  AdvancedAddonsSettings
} from '../lib/firebase';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  sizes: string[];
  colors: string[];
  images?: string[];
  addDeliveryCharge?: boolean;
}

interface ShopViewProps {
  onOrderSuccess: (order: RaincoatOrder) => void;
}

export default function ShopView({ onOrderSuccess }: ShopViewProps) {
  // Load products dynamically
  const [products, setProducts] = useState<Product[]>(() => {
    const fullDefaults = [
      {
        id: 'p-1',
        title: 'প্রিমিয়াম ওয়াটারপ্রুফ রেইনকোট জ্যাকেট ও প্যান্ট সেট (Navy Blue & Black)',
        description: 'ডাবল পার্ট প্রিমিয়াম ফ্যাব্রিক ও হিট সিলিং টেকনোলজি সহ বর্ষাকালের সেরা সুরক্ষী রেনকোট গিয়ার।',
        price: 990,
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
        category: 'রেইনকোট',
        sizes: ['XL', 'XXL', '3XL', '4XL'],
        colors: ['Black', 'Navy Blue']
      },
      {
        id: 'p-2',
        title: 'হেভি ডিউটি ওয়াটারপ্রুফ মোটরসাইকেল সু কাভার (Shoe Guard)',
        description: 'বর্ষায় বাইক ট্রাভেলে আপনার জুতো কাঁদা জল থেকে শতভাগ শুকনো রাখতে জুতো প্রোটেক্টর শু কাভার।',
        price: 490,
        image: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?auto=format&fit=crop&q=80&w=600',
        category: 'বাইকিং গিয়ার',
        sizes: ['M', 'L', 'XL'],
        colors: ['Black']
      },
      {
        id: 'p-3',
        title: 'ডাবল পার্ট উইন্ডপ্রুফ আমব্রেলা ছাতা (Premium Laptop Defense)',
        description: 'ভারী ঝড়ে উল্টে যাবে না এমন বিশেষ উইন্ড কন্ডাক্টর ও ইউভি কোটিং সমৃদ্ধ ছাতা।',
        price: 680,
        image: 'https://images.unsplash.com/photo-1510200378107-1601ee036683?auto=format&fit=crop&q=80&w=600',
        category: 'অনুষঙ্গ',
        sizes: ['Universal'],
        colors: ['Black', 'Blue']
      },
      {
        id: 'p-4',
        title: 'মোটরসাইকেল হ্যান্ডেলবার ওয়াটারপ্রুফ হ্যান্ড গ্লাভস',
        description: 'বর্ষায় আর কনকনে ঠান্ডায় বাইক চালানোর জন্য শতভাগ ওয়াটারপ্রুফ ও আরামদায়ক হ্যান্ডগ্লাভস সেট। গরম ও শুষ্ক গ্রিপ।',
        price: 350,
        image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&q=80&w=600',
        category: 'বাইকিং গিয়ার',
        sizes: ['M', 'L'],
        colors: ['Black', 'Red']
      },
      {
        id: 'p-5',
        title: 'প্রিমিয়াম সেলফ-লকিং ওয়াটারপ্রুফ বাইক মোবাইল হোল্ডার',
        description: 'যেকোনো সাইকেল বা মোটরসাইকেল হ্যান্ডেলে সহজে ফিট করা যায়। সম্পূর্ণ ওয়াটারপ্রুফ কভার সহ টাচ স্ক্রিন সাপোর্টেড।',
        price: 590,
        image: 'https://images.unsplash.com/photo-1584438784894-089d6a128f3e?auto=format&fit=crop&q=80&w=600',
        category: 'বাইকিং গিয়ার',
        sizes: ['L', 'XL'],
        colors: ['Midnight Black']
      },
      {
        id: 'p-6',
        title: 'ব্যাকপ্যাক ওয়াটারপ্রুফ আল্ট্রা-শিল্ড রেইন কাভার',
        description: '৩৫ থেকে ৪৫ লিটার সাইজের যেকোনো স্কুল, college বা ট্রাভেল ব্যাগ সম্পূর্ণ পানি ও ধুলোবালি থেকে সুরক্ষিত রাখার কাভার।',
        price: 190,
        image: 'https://images.unsplash.com/photo-1622560480654-d96214fdc887?auto=format&fit=crop&q=80&w=600',
        category: 'অনুষঙ্গ',
        sizes: ['Standard'],
        colors: ['Neon Yellow', 'Black']
      },
      {
        id: 'p-7',
        title: 'স্পোর্টস আল্ট্রা-লাইট ব্রিদাবল উইন্ডব্রেকার রেইন জ্যাকেট',
        description: 'রানিং, সাইক্লিং এবং ট্র্যাকিংয়ের জন্য হালকা ও আরামদায়ক রেইনপ্রুফ জ্যাকেট। সহজেই ভাজ করে পকেটে রাখা যায়।',
        price: 790,
        image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&q=80&w=600',
        category: 'রেইনকোট',
        sizes: ['M', 'L', 'XL', 'XXL'],
        colors: ['Lime Green', 'Navy Blue', 'Silver Gray']
      },
      {
        id: 'p-8',
        title: 'কিডস ফানি কার্টুন ওয়াটারপ্রুফ রেইনকোট (স্কুল ব্যাগ স্পেস সহ)',
        description: 'ছোট সোনামণিদের সহজে স্কুলে যাতায়াত করতে আকর্ষণীয় কার্টুন ডিজাইন সম্পন্ন রেইনকোট যা খুব দ্রুত শুকিয়ে যায়।',
        price: 450,
        image: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&q=80&w=600',
        category: 'রেইনকোট',
        sizes: ['S', 'M', 'L'],
        colors: ['Pink Rose', 'Sky Blue', 'Yellow Duck']
      },
      {
        id: 'p-9',
        title: 'লেডিস ক্লাসিক লং বেল্ট রেনকোট ট্রেইল কোট',
        description: 'স্টাইলিশ ও অভিজাত নারীদের জন্য লং বেল্টেড ওয়াটারপ্রুফ ট্রেনচ কোট। আরামদায়ক ও ১০০% প্রিমিয়াম পলিয়েস্টার ফ্যাব্রিক।',
        price: 1190,
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600',
        category: 'রেইনকোট',
        sizes: ['M', 'L', 'XL'],
        colors: ['Beige', 'Black', 'Wine Red']
      },
      {
        id: 'p-10',
        title: 'আউটডোর ট্রাভেলার্স ওয়াটারপ্রুফ ড্রাই ব্যাগ (২০ লিটার)',
        description: 'নদী পারাপার, ট্র্যাকিং বা ক্যাম্পিংয়ে ক্যামেরা, মোবাইল ও কাপড় সম্পূর্ণ ওয়াটার টাইট ও ভাসমান রাখতে হেভি ডিউটি ড্রাই ব্যাগ।',
        price: 550,
        image: 'https://images.unsplash.com/photo-1611002214172-792c1f90b59a?auto=format&fit=crop&q=80&w=600',
        category: 'অনুষঙ্গ',
        sizes: ['20 Liters'],
        colors: ['Orange Orange', 'Black Shield']
      },
      {
        id: 'p-11',
        title: 'নাইট-সেফ হাই-ভিজিবিলিটি রিফ্লেক্টভ সেফটি রেইন ভেস্ট',
        description: 'ঝড়ো বৃষ্টির রাতে বাইকিং বা সড়ক মেরামতে অনন্য সুরক্ষী রিফ্লেক্টিভ স্ট্রিপ সমৃদ্ধ ওয়াটারপ্রুফ ভেস্ট জ্যাকেট।',
        price: 280,
        image: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&q=80&w=600',
        category: 'বাইকিং গিয়ার',
        sizes: ['L', 'XL'],
        colors: ['Neon Green']
      },
      {
        id: 'p-12',
        title: 'হেভি হিট-সিলড প্রিমিয়াম রেন পনচো (হুড যুক্ত)',
        description: 'সহজে গায়ে জড়িয়ে নেয়ার উপযোগী আল্ট্রা-সুপিরিয়র ফিতা যুক্ত পনচো। ১০০% ওয়াটার ব্লক ফ্যাব্রিক যা সহজে ফাটে না।',
        price: 690,
        image: 'https://images.unsplash.com/photo-1601924638867-3a6de6b7a500?auto=format&fit=crop&q=80&w=600',
        category: 'রেইনকোট',
        sizes: ['Universal Free Size'],
        colors: ['Hunter Green', 'Royal Blue']
      },
      {
        id: 'p-13',
        title: 'সিলিকন ইলাস্টিক অ্যান্টি-স্লিপ রেইন শু কাভার (পকেট সাইজ)',
        description: 'পকেটে রাখা মতো পাতলা কিন্তু অত্যন্ত মজবুত ও ১০০% ওয়াটারপ্রুফ ইলাস্টিক সিলিকন সু গার্ড। রাস্তায় পিচ্ছিল কাদা রোধক গ্রিপ।',
        price: 190,
        image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=600',
        category: 'অনুষঙ্গ',
        sizes: ['S', 'M', 'L'],
        colors: ['Sky Blue', 'Transparent Clear', 'Coal Black']
      },
      {
        id: 'p-14',
        title: '১০০% ওয়াটারপ্রুফ ও ডাস্টপ্রুফ প্রিমিয়াম বাইক কভার (Premium Bike Cover)',
        description: '৩০০০ মিলি ওজনের ছাতা কাপড়ের তৈরি শতভাগ ওয়াটারপ্রুফ ও ডাস্টপ্রুফ বাইক কভার। রোদ, বৃষ্টি ও ধুলোবালি প্রতিরোধক সিলভার হিট প্রুফ কোটিং এবং চাকার দুই পাশে ইলাস্টিক জ্যাকিং বেল্ট সহ সম্পূর্ণ স্ট্যান্ডার্ড সাইজ।',
        price: 600,
        image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=600',
        category: 'বাইকিং গিয়ার',
        sizes: ['XL'],
        colors: ['Navy Blue', 'Black'],
        addDeliveryCharge: false
      }
    ];

    const list = localStorage.getItem('raincoat_shop_products');
    if (list) {
      try {
        const parsed = JSON.parse(list);
        if (parsed && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    
    // Save to local storage for persistence across admin views
    localStorage.setItem('raincoat_shop_products', JSON.stringify(fullDefaults));
    return fullDefaults;
  });

  // Keep products dynamically in sync with Firestore
  useEffect(() => {
    const syncProductsWithFirestore = async () => {
      try {
        const fbProducts = await getProductsFromFirestore();
        if (fbProducts && fbProducts.length > 0) {
          setProducts(fbProducts as any);
        }
      } catch (err) {
        console.warn("Could not load products from Firestore on ShopView load, using local cache.", err);
      }
    };
    syncProductsWithFirestore();
  }, []);

  // State for shopping cart
  const [cart, setCart] = useState<{ product: Product; quantity: number; size: string; color: string }[]>([]);

  // Checkout form details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('ঢাকা');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successOrder, setSuccessOrder] = useState<RaincoatOrder | null>(null);

  // Advanced plugins and tracking states
  const [addons, setAddons] = useState<AdvancedAddonsSettings | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [partialPaymentSender, setPartialPaymentSender] = useState('');
  const [partialPaymentTxnId, setPartialPaymentTxnId] = useState('');
  const [couponDiscountPercent, setCouponDiscountPercent] = useState(0);
  const [couponCodeApplied, setCouponCodeApplied] = useState('');
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    async function loadAddons() {
      try {
        const res = await getAdvancedAddonsSettingsFromFirestore();
        if (res) {
          setAddons(res);
          // Auto-trigger Pixel InitiateCheckout if configured
          if (res.pixel_ids && res.track_initiate_checkout) {
            console.log(`[Facebook Pixel Event] Initiating Checkout for multi-pixels: ${res.pixel_ids}`);
          }
        }
      } catch (err) {
        console.warn("Could not load advanced addons settings on ShopView mount", err);
      }
    }
    loadAddons();
  }, []);

  // Detect exit intent (when mouse moves out of viewport near the top)
  useEffect(() => {
    if (!addons || !addons.exit_intent_enabled) return;
    
    // Track if already dismissed/closed/used so it only appears once per session
    const hasSeenExitCoupon = sessionStorage.getItem('raincoat_seen_exit_coupon');
    if (hasSeenExitCoupon) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 20 && cart.length > 0) { 
        setShowExitModal(true);
        sessionStorage.setItem('raincoat_seen_exit_coupon', 'true');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [addons, cart.length]);

  const addToCart = (product: Product, size: string, color: string) => {
    // Check if duplicate item with same config in cart
    const existingIndex = cart.findIndex(
      item => item.product.id === product.id && item.size === size && item.color === color
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { product, quantity: 1, size, color }]);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...cart];
    updated[index].quantity += delta;
    if (updated[index].quantity <= 0) {
      updated.splice(index, 1);
    }
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  
  // Read custom charges
  const courierInside = Number(localStorage.getItem('raincoat_courier_inside')) || 80;
  const courierOutside = Number(localStorage.getItem('raincoat_courier_outside')) || 130;
  const hasDeliveryCharge = cart.some(item => item.product.addDeliveryCharge !== false);

  const deliveryFee = hasDeliveryCharge ? (district === 'ঢাকা' ? courierInside : courierOutside) : 0;
  const discountAmount = Math.round(cartTotal * (couponDiscountPercent / 100));
  const grandTotal = Math.max(0, cartTotal - discountAmount) + deliveryFee;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (cart.length === 0) {
      setErrorMessage('অনুগ্রহ করে কড়া করে অন্তত একটি পণ্য কার্টে যোগ করুন!');
      return;
    }
    if (!name.trim()) return setErrorMessage('আপনার নাম লিখুন অনুগ্রহ করে।');
    if (!village.trim()) return setErrorMessage('আপনার সাকিন, থানা ও সঠিক ঠিকানা লিখুন!');
    
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

    // 2-hour ANTI-SPAM BLOCKING verification
    const isAntiSpamEnabled = localStorage.getItem('raincoat_antispam_enabled') !== 'false';
    if (isAntiSpamEnabled) {
      const existingOrdersJson = localStorage.getItem('raincoat_orders') || '[]';
      try {
        const existingOrders = JSON.parse(existingOrdersJson);
        const lastOrderTime = localStorage.getItem('raincoat_last_placed_timestamp');
        
        // Check session local time limit (2 hours = 7200000 ms)
        if (lastOrderTime) {
          const timeDiff = Date.now() - parseInt(lastOrderTime, 10);
          if (timeDiff < 2 * 60 * 60 * 1000) {
            const minutesLeft = Math.ceil((2 * 60 * 60 * 1000 - timeDiff) / 60000);
            return setErrorMessage(`দুঃখিত, ডুপ্লিকেট রোধে ২ ঘণ্টার মধ্যে পুনরায় অর্ডার করা যাবে না! অনুগ্রহ করে আরও ${minutesLeft} মিনিট অপেক্ষা করুন।`);
          }
        }

        // Check if there is an order from same number in list in past 2 hours
        const lastMatchingOrder = existingOrders.find((o: any) => o.phone === cleanPhone);
        if (lastMatchingOrder) {
          const lastTime = new Date(lastMatchingOrder.createdAt).getTime();
          const timeDiff = Date.now() - lastTime;
          if (timeDiff < 2 * 60 * 60 * 1000) {
            const minutesLeft = Math.ceil((2 * 60 * 60 * 1000 - timeDiff) / 60000);
            return setErrorMessage(`এই নাম্বারে (${cleanPhone}) ইতিমধ্যে একটি অর্ডার সফলভাবে নিবন্ধিত হয়েছে! ডুপ্লিকেট রোধে ২ ঘণ্টার মধ্যে আবার অর্ডার করা যাবে না। অনুগ্রহ করে ${minutesLeft} মিনিট অপেক্ষা করুন।`);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (addons?.partial_payment_enabled) {
      if (!partialPaymentSender.trim() || !partialPaymentTxnId.trim()) {
        setErrorMessage('অনুগ্রহ করে আমাদের কুরিয়ার ভেরিফিকেশন সম্পন্ন করতে আপনার বিকাশ/নগদ নম্বর এবং ট্রানজেকশন আইডি দিন!');
        return;
      }
    }

    setIsSubmitting(true);

    setTimeout(async () => {
      // Build order description
      const details = cart.map(item => `${item.product.title} (সাইজ: ${item.size || 'N/A'}, কালার: ${item.color || 'N/A'}) - কক: ${item.quantity}টি`).join(', ');
      
      const newOrder: RaincoatOrder = {
        id: 'ord-shop-' + Math.floor(Math.random() * 100000),
        name,
        village: `${village}, জেলা: ${district}`,
        phone: cleanPhone,
        size: cart[0]?.size as any || 'XL',
        color: (cart[0]?.color === 'Black' ? 'Black' : 'Navy Blue') as any,
        weight: 65,
        heightFeet: 5,
        heightInches: 6,
        price: grandTotal,
        status: 'Pending',
        isConfirmed: false,
        createdAt: new Date().toISOString(),
        orderNotes: orderNotes.trim(),
        partialPaymentSender: partialPaymentSender.trim(),
        partialPaymentTxnId: partialPaymentTxnId.trim(),
        partialPaymentAmount: addons?.partial_payment_enabled ? (addons.partial_payment_amount || 0) : 0,
        synced: false
      };

      try {
        // Direct cloud persistence
        await addOrderToFirestore(newOrder);
        newOrder.synced = true;
      } catch (err) {
        console.warn("Direct addOrderToFirestore failed, fallback using localStorage syncing:", err);
      }

      // Save to raincoat_orders list
      const existingOrdersJson = localStorage.getItem('raincoat_orders') || '[]';
      const existingOrders = JSON.parse(existingOrdersJson);
      existingOrders.unshift(newOrder);
      localStorage.setItem('raincoat_orders', JSON.stringify(existingOrders));

      // Mark timestamp for duplicate submission blocker
      localStorage.setItem('raincoat_last_placed_timestamp', Date.now().toString());

      // Fire analytics conversion trackers
      if (addons?.pixel_ids && addons?.track_purchase) {
        console.log(`[Facebook Pixel Event] Fired Purchase event on ${addons.pixel_ids} with Value: ${grandTotal} BDT`);
      }

      setIsSubmitting(false);
      setSuccessOrder(newOrder);
      setCart([]);
      onOrderSuccess(newOrder);
    }, 1200);
  };

  return (
    <div className="py-12 bg-slate-50 font-sans">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Banner with shop options */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="px-3.5 py-1 bg-amber-50 text-amber-700 text-xs font-black rounded-full border border-amber-200 inline-flex items-center gap-1">
            <ShoppingBag className="h-3.5 w-3.5" /> ১০০% খাঁটি বর্ষাকালীন কালেকশন শপ
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-3">
            আমাদের মাল্টি-প্রোডাক্ট প্রিমিয়াম গিয়ার্স
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            স্বল্প মূল্যে ঝড়-বাদলে বাইক চালানো ও বাইরে নিরাপদে চলাফেরার অন্যতম এক্সক্লুসিভ কালেকশন। পণ্য হাতে পেয়ে পেমেন্ট করুন।
          </p>
        </div>

        {successOrder ? (
          <div className="max-w-xl mx-auto bg-white border border-emerald-250 p-8 rounded-3xl text-center shadow-lg space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-black text-emerald-800">অর্ডার সফলভাবে সম্পন্ন হয়েছে!</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              আপনার অডার আইডি: <strong className="font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">{successOrder.id}</strong>. 
              আমাদের কাস্টমার রিপ্রেজেন্টেটিভ খুব শীঘ্রই আপনাকে কল করে অর্ডারটি কনফার্ম করবেন। Monsoon Gear এর সাথে থাকার জন্য ধন্যবাদ!
            </p>
            <button
              onClick={() => setSuccessOrder(null)}
              className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition cursor-pointer"
            >
              আরও শপিং করুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Products grid */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.map(product => {
                // Initialize selection states for each product
                const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'Universal');
                const [selectedColor, setSelectedColor] = useState(product.colors[0] || 'Black');

                return (
                  <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-slate-205 shadow-sm transform hover:scale-[1.01] transition duration-200 flex flex-col justify-between">
                    <div>
                      {/* Image header */}
                      <div className="h-48 overflow-hidden relative bg-slate-200">
                        <img 
                          src={product.image} 
                          alt={product.title} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <span className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                          {product.category}
                        </span>
                      </div>

                      {/* Info body */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-1.5 text-amber-500 text-xs">
                          <div className="flex gap-0.5">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          </div>
                          <span className="text-slate-500 font-bold">(৫.০ রিভিউ)</span>
                        </div>

                        <h3 className="text-base font-black text-slate-900 line-clamp-2 leading-snug">
                          {product.title}
                        </h3>

                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                          {product.description}
                        </p>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-lg font-black text-orange-600 font-mono">
                            {product.price} TK
                          </span>
                        </div>

                        {/* Dropdowns for configuration options */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {product.sizes.length > 0 && product.sizes[0] !== 'Universal' && (
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">সাইজ পছন্দ করুন</span>
                              <select 
                                value={selectedSize}
                                onChange={(e) => setSelectedSize(e.target.value)}
                                className="w-full bg-slate-55 border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 focus:outline-none"
                              >
                                {product.sizes.map(size => <option key={size} value={size}>{size}</option>)}
                              </select>
                            </div>
                          )}
                          {product.colors.length > 0 && product.colors[0] !== 'Universal' && (
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">কালার পছন্দ করুন</span>
                              <select 
                                value={selectedColor}
                                onChange={(e) => setSelectedColor(e.target.value)}
                                className="w-full bg-slate-55 border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 focus:outline-none"
                              >
                                {product.colors.map(color => <option key={color} value={color}>{color === 'Black' ? 'কালো (Black)' : color === 'Blue' ? 'নীল (Blue)' : 'নেভি ব্লু (Navy Blue)'}</option>)}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Add to cart action button */}
                    <div className="p-5 pt-0">
                      <button
                        onClick={() => addToCart(product, selectedSize, selectedColor)}
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> পণ্যটি কার্টে যোগ করুন
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Shopping cart sidebar and Order validation checkout */}
            <div className="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-5">
              <h3 className="text-base font-black text-slate-950 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                🛒 আপনার কার্ট তালিকা ({cart.length} টি আইটেম)
              </h3>

              {cart.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="text-slate-300 font-bold text-3xl">🛍️</div>
                  <p className="text-xs text-slate-400">আপনার কার্ট ও থলে বর্তমানে খালি রয়েছে। বা দিক থেকে ক্লিক করে বুকিং করুন।</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                  {cart.map((item, index) => (
                    <div key={index} className="flex gap-3 justify-between items-start bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <h4 className="font-extrabold text-slate-900 truncate" title={item.product.title}>
                          {item.product.title}
                        </h4>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {item.size && item.size !== 'Universal' && `সাইজ: ${item.size}`} 
                          {item.color && item.color !== 'Universal' && ` | কালার: ${item.color === 'Black' ? 'কালো' : 'নেভি ব্লু'}`}
                        </div>
                        <div className="font-extrabold text-slate-800 mt-1 font-mono">
                          {item.product.price} TK × {item.quantity}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                          <button 
                            type="button" 
                            onClick={() => updateQuantity(index, -1)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-mono font-bold text-[11px] px-1">{item.quantity}</span>
                          <button 
                            type="button" 
                            onClick={() => updateQuantity(index, 1)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(index)}
                          className="hover:text-rose-600 text-slate-400 p-0.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Order checkout form triggers on active items inside the cart list */}
              {cart.length > 0 && (
                <form onSubmit={handleCheckout} className="space-y-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">📬 ক্যাশ ডাউন ক্যাশ অন ডেলিভারি ফর্ম</h4>
                  
                  {errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
                      {errorMessage}
                    </div>
                  )}

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">আপনার নাম (Full Name)</label>
                      <input 
                        type="text"
                        placeholder="যেমন: মোঃ সাকিব হাসান"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">মোবাইল নাম্বার (11 Digit Mobile)</label>
                      <input 
                        type="tel"
                        placeholder="১১ ডিজিটের সচল মোবাইল নাম্বার"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">ডেলিভারি জেলা</label>
                      <select 
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                      >
                        <option value="ঢাকা">ঢাকার ভিতরে (ডেলিভারি চার্জ ৳{courierInside} টাকা)</option>
                        <option value="ঢাকার বাহিরে">ঢাকার বাইরে (ডেলিভারি চার্জ ৳{courierOutside} টাকা)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">পূর্ণাঙ্গ সাকিন/ঠিকানা (Address Details)</label>
                      <textarea 
                        rows={2.5}
                        placeholder="গ্রাম/বাজার/পাড়া, পোস্ট অফিস ও সংশ্লিষ্ট থানা"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">অর্ডার নোট / ডেলিভারি নির্দেশনা (যেমন: ল্যান্ডমার্ক বা প্রিয় সময় - Optional)</label>
                      <textarea 
                        rows={1.5}
                        placeholder="যেমন: বাড়ির পাশে বায়তুল মামুর মসজিদ, বা বিকাল ৪ টার পর ডেলিভারি দিন।"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                      />
                    </div>

                    {addons?.partial_payment_enabled && (
                      <div className="p-3.5 bg-gradient-to-r from-pink-50 to-orange-50/50 border border-pink-150 rounded-2xl space-y-3 font-sans">
                        <div className="flex items-center gap-1.5 text-pink-850 font-extrabold text-xs">
                          <Check className="h-4 w-4 text-pink-600 bg-pink-100 rounded-full p-0.5" />
                          <span>সহজ বুকিং নিশ্চিতকরণ (অগ্রিম {addons.partial_payment_amount}৳):</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-normal">{addons.partial_payment_instructions}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                          {addons.partial_payment_bkash && (
                            <div className="p-2 bg-white border border-pink-100 rounded-xl">
                              <span className="text-[8.5px] text-pink-600 block font-bold">bKash (Send Money)</span>
                              <strong className="text-slate-800 font-mono text-[11.5px]">{addons.partial_payment_bkash}</strong>
                            </div>
                          )}
                          {addons.partial_payment_nagad && (
                            <div className="p-2 bg-white border border-orange-100 rounded-xl">
                              <span className="text-[8.5px] text-orange-600 block font-bold">Nagad (Send Money)</span>
                              <strong className="text-slate-800 font-mono text-[11.5px]">{addons.partial_payment_nagad}</strong>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/50">
                          <div>
                            <label className="block text-[9px] font-black text-slate-550 mb-0.5 uppercase">আপনার সেন্ডিং নম্বর</label>
                            <input 
                              type="text" 
                              placeholder="01XXXXXXXXX"
                              value={partialPaymentSender}
                              onChange={(e) => setPartialPaymentSender(e.target.value)}
                              required
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-205 rounded-xl text-xs" 
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-slate-550 mb-0.5 uppercase">ট্রানজেকশন আইডি (TxnID)</label>
                            <input 
                              type="text" 
                              placeholder="যেমন: A9B4F83X"
                              value={partialPaymentTxnId}
                              onChange={(e) => setPartialPaymentTxnId(e.target.value)}
                              required
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-205 rounded-xl text-xs uppercase font-mono" 
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary bill calculations for products cart */}
                  <div className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1.5 text-xs text-slate-650">
                    <div className="flex justify-between">
                      <span>আইটেম মোট দাম:</span>
                      <span className="font-mono font-bold text-slate-800">{cartTotal} TK</span>
                    </div>
                    <div className="flex justify-between">
                      <span>কুরিয়ার চার্জ ({district === 'ঢাকা' ? 'ঢাকা সিটি' : 'ঢাকার বাহিরে'}):</span>
                      <span className="font-mono font-bold text-slate-800">+{deliveryFee} TK</span>
                    </div>
                    {couponDiscountPercent > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>বিশেষ কুপন ডিসকাউন্ট ({couponCodeApplied}):</span>
                        <span className="font-mono">-{discountAmount} TK</span>
                      </div>
                    )}

                    {/* Trust Badge - 3 Seasons Guarantee */}
                    <div className="my-1.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5">
                      <div className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-extrabold border border-emerald-200">
                        <ShieldCheck className="h-5 w-5" />
                        <span className="absolute text-[7px] font-black font-sans text-emerald-800 mt-0.5">3S</span>
                      </div>
                      <div className="text-left leading-normal">
                        <div className="text-[10px] font-black text-emerald-950 font-sans">🛡️ ৩ সিজন অনায়াসে ব্যবহারের নিশ্চয়তা</div>
                        <div className="text-[9px] text-emerald-800 font-sans">৩ সিজন ব্যবহার করতে পারবেন অনায়াসে যদি সঠিকভাবে ব্যবহার করেন।</div>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-200 flex justify-between font-extrabold text-slate-950 text-[13px]">
                      <span>সর্বমোট প্রদেয় বিল:</span>
                      <span className="font-mono text-orange-600">{grandTotal} TK</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <ShieldCheck className="h-4 w-4" /> 
                    {isSubmitting ? 'প্রসেসিং হচ্ছে...' : `${grandTotal} TK মূল্যে অর্ডার বুক করুন`}
                  </button>

                  <p className="text-center text-[10px] text-slate-400 font-sans leading-relaxed">
                    ✓ কোনো অগ্রিম টাকা লাগবে না। পণ্য হাতে পেয়ে চেক করে দেখে কুরিয়ারকে টাকা পে করবেন।
                  </p>
                </form>
              )}
            </div>

          </div>
        )}

        {showExitModal && addons && addons.exit_intent_enabled && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in font-sans">
            <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 md:p-8 max-w-md w-full text-center relative shadow-2xl space-y-5 animate-scale-up">
              <button 
                type="button"
                onClick={() => setShowExitModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition duration-150 text-base font-bold w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
              
              <div className="w-14 h-14 bg-amber-500/10 text-amber-400 mx-auto rounded-full flex items-center justify-center text-3xl">
                💥
              </div>

              <div className="space-y-2">
                <h3 className="text-lg md:text-xl font-black text-amber-400 leading-tight">
                  {addons.exit_intent_title}
                </h3>
                <p className="text-xs text-slate-350 leading-relaxed font-sans">
                  {addons.exit_intent_subtitle}
                </p>
              </div>

              <div className="p-4 bg-red-950/30 border border-dashed border-red-500/30 rounded-2xl flex items-center justify-between">
                <div className="text-left font-sans">
                  <span className="text-[10px] text-slate-400 block font-bold">কোপন কোড:</span>
                  <strong className="text-base text-yellow-400 tracking-wider font-mono">{addons.exit_intent_coupon}</strong>
                </div>
                <div className="bg-orange-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl uppercase tracking-wider font-sans">
                  {addons.exit_intent_discount}% ডিসকাউন্ট
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCouponDiscountPercent(addons.exit_intent_discount);
                  setCouponCodeApplied(addons.exit_intent_coupon);
                  setShowExitModal(false);
                }}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-xs rounded-xl transition duration-150 shadow-lg cursor-pointer font-sans"
              >
                ডিসকাউন্ট ও কুপন সক্রিয় করুন
              </button>
              
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="text-[10px] text-slate-500 hover:text-slate-400 block mx-auto underline mt-1 font-sans"
              >
                না, আমি পুরো দামেই কিনতে চাই
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
