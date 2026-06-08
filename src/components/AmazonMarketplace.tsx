import React, { useState, useEffect } from 'react';
import { 
  Search, ShoppingCart, Tag, Star, ArrowUpRight, CheckCircle2, 
  MapPin, Phone, MessageSquare, Eye, ShoppingBag, Percent, 
  Truck, RotateCcw, ShieldCheck, Flame, Heart, Sparkles, Filter,
  X, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import { RaincoatOrder } from '../types';

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
}

interface AmazonMarketplaceProps {
  onOrderSuccess: (order: RaincoatOrder) => void;
}

export default function AmazonMarketplace({ onOrderSuccess }: AmazonMarketplaceProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cartCount, setCartCount] = useState(0);
  
  // Quick View Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Quick Order (Modal Checkout)
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerDistrict, setCustomerDistrict] = useState('ঢাকা');
  const [deliveryZone, setDeliveryZone] = useState<'inside' | 'sub' | 'outside'>('inside');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState(false);
  const [formError, setFormError] = useState('');
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const [activeBannerSlide, setActiveBannerSlide] = useState(0);

  const bannerSlides = [
    {
      badge: "Monsoon Flash Deals",
      title: "বর্ষার ধামাকা ২০% থেকে ৫০% সরাসরি ক্যাশ ডিসকাউন্ট!",
      description: "সারা বাংলাদেশে কুরিয়ার চার্জ সম্পূর্ণ ফ্রী। কোন অগ্রিম টাকা দেওয়া ছাড়াই সম্পূর্ণ প্রোডাক্ট হাতে পেয়ে চেক করে মূল্য পরিশোধ করুন! সেরা ওয়াটারপ্রুফ রেইন গিয়ারস।",
      bgClass: "from-slate-900 via-indigo-950 to-slate-900",
      badgeColor: "bg-orange-600/15 border-orange-500/20 text-orange-400",
      textColor: "text-white",
      primaryBtnText: "🛒 সম্পূর্ণ শপ ভিউ দেখুন",
      primaryBtnAction: () => {
        window.history.pushState(null, '', '/shop');
        window.dispatchEvent(new Event('popstate'));
      },
      secondaryBtnText: "🌧️ রেইনকোট অর্ডার করুন",
      secondaryBtnAction: () => {
        window.history.pushState(null, '', '/raincoat');
        window.dispatchEvent(new Event('popstate'));
      }
    },
    {
      badge: "জনপ্রিয় কালার (Navy Blue)",
      title: "প্রিমিয়াম ওয়াটারপ্রুফ নেভি ব্লু বাইক কভার - অফার মূল্য ৬০০/-",
      description: "ছাতা কাপড়ের তৈরি শতভাগ ওয়াটারপ্রুফ ও ডাস্টপ্রুফ নেভি ব্লু বাইক কভার। রোদ, বৃষ্টি ও ধুলোবালি প্রতিরোধে সিলভার হিট কোটিং যুক্ত দ্বিমুখী অনন্য সুরক্ষা।",
      bgClass: "from-blue-950 via-indigo-950 to-slate-900",
      badgeColor: "bg-cyan-500/15 border-cyan-400/20 text-cyan-300",
      textColor: "text-white",
      primaryBtnText: "🏍️ বাইক কভার অর্ডার করুন",
      primaryBtnAction: () => {
        window.history.pushState(null, '', '/bikecover');
        window.dispatchEvent(new Event('popstate'));
      },
      secondaryBtnText: "🛒 সম্পূর্ণ শপ ভিউ",
      secondaryBtnAction: () => {
        window.history.pushState(null, '', '/shop');
        window.dispatchEvent(new Event('popstate'));
      }
    },
    {
      badge: "শতভাগ প্রিমিয়াম (Jet Black)",
      title: "প্রিমিয়াম ওয়াটারপ্রুফ জেট ব্ল্যাক বাইক কভার - মাত্র ৬০০/- টাকা!",
      description: "অভিজাত ব্ল্যাক কালার, ডাস্টপ্রুফ এবং রোদের তাপ প্রতিরোধক সুউচ্চ ফিনিশিং কভার যা পিচ্ছিল কাদা ও ধুলোবালি প্রতিরোধে জ্যাকিং ইলাস্টিক বেল্ট সমৃদ্ধ।",
      bgClass: "from-neutral-900 via-stone-900 to-neutral-950",
      badgeColor: "bg-amber-500/15 border-amber-400/20 text-amber-300",
      textColor: "text-white",
      primaryBtnText: "🏍️ বাইক কভার অর্ডার করুন",
      primaryBtnAction: () => {
        window.history.pushState(null, '', '/bikecover');
        window.dispatchEvent(new Event('popstate'));
      },
      secondaryBtnText: "🛒 সম্পূর্ণ শপ ভিউ",
      secondaryBtnAction: () => {
        window.history.pushState(null, '', '/shop');
        window.dispatchEvent(new Event('popstate'));
      }
    }
  ];

  useEffect(() => {
    const sliderInterval = setInterval(() => {
      setActiveBannerSlide(prev => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(sliderInterval);
  }, [bannerSlides.length]);

  useEffect(() => {
    if (selectedProduct) {
      setActiveImage(selectedProduct.image);
    } else {
      setActiveImage(null);
    }
  }, [selectedProduct]);

  // Load products from raincoat_shop_products
  const loadProductsList = () => {
    const list = localStorage.getItem('raincoat_shop_products');
    if (list) {
      try {
        const parsed = JSON.parse(list);
        if (parsed && parsed.length >= 14) {
          setProducts(parsed);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    // If not present or stale (<14 products), define the complete defaults
    const fullDefaults = [
      {
        id: 'p-1',
        title: 'প্রিমিয়াম ওয়াটারপ্রুফ রেইনকোট জ্যাকেট ও প্যান্ট সেট (Navy Blue & Black)',
        description: 'ডাবল পার্ট প্রিমিয়াম ফ্যাব্রিক ও হিট সিলিং টেকনোলজি সহ বর্ষাকালের সেরা রেনকোট গিয়ার।',
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
        title: 'প্রিমিয়াম সেলফ-লকিং ওয়াটারপ্রুফ বাইক মোবাইল হোলডার',
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
        description: 'স্টাইলিশ ও অভিজাত নারীদের জন্য লং বেল্টেড ওয়াটারপ্রুফ ট্রেনচ কোট। আরামদায়ক ও ১০০% প্রিমিয়াম পলিয়েস্টার ফ্যাব্রিক।',
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
    localStorage.setItem('raincoat_shop_products', JSON.stringify(fullDefaults));
    setProducts(fullDefaults);
  };

  useEffect(() => {
    loadProductsList();
    
    // Sync cart count
    const updateStats = () => {
      const orders = localStorage.getItem('raincoat_orders') || '[]';
      try {
        const parsed = JSON.parse(orders);
        setCartCount(parsed.length);
      } catch (e) {}
    };
    updateStats();
    
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  // Filter products based on search term & category selection
  const filteredProducts = products.filter(product => {
    const matchSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCategory = selectedCategory === 'All' || product.category === selectedCategory;
    
    return matchSearch && matchCategory;
  });

  // Calculate promotional slashed prices (old prices) based on current prices plus ~30% - 40% markup
  const getOldPrice = (price: number) => {
    return Math.floor(price * 1.45 / 50) * 50; // Rounded to nearest 50
  };

  // Get categories dynamically
  const categoriesList = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const handleOpenQuickOrder = (product: Product) => {
    setCheckoutProduct(product);
    setSelectedSize(product.sizes[0] || 'Standard');
    setSelectedColor(product.colors[0] || 'Default');
    setFormError('');
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setFormError('অনুগ্রহ করে আপনার নাম, মোবাইল নাম্বার এবং সম্পূর্ণ ঠিকানা লিখুন!');
      return;
    }

    if (customerPhone.trim().length < 11) {
      setFormError('সঠিক ১১ ডিজিটের মোবাইল নাম্বার প্রদান করুন!');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      if (!checkoutProduct) return;

      const orderId = 'ord-marketplace-' + Math.floor(Math.random() * 1000000);
      
      const courierInside = Number(localStorage.getItem('raincoat_courier_inside')) || 80;
      const courierSub = Number(localStorage.getItem('raincoat_courier_sub')) || 100;
      const courierOutside = Number(localStorage.getItem('raincoat_courier_outside')) || 130;

      const hasCourierCharge = checkoutProduct.addDeliveryCharge !== false;
      const deliveryCharge = hasCourierCharge
        ? (deliveryZone === 'inside' ? courierInside : deliveryZone === 'sub' ? courierSub : courierOutside)
        : 0;

      const totalAmount = checkoutProduct.price + deliveryCharge;

      const newOrder: RaincoatOrder = {
        id: orderId,
        name: customerName.trim(),
        phone: customerPhone.trim(),
        village: customerAddress.trim(),
        district: deliveryZone === 'inside' ? 'ঢাকা' : deliveryZone === 'sub' ? 'সাব ঢাকা' : 'ঢাকার বাহিরে',
        size: selectedSize as any,
        color: selectedColor as any,
        weight: 70,
        heightFeet: 5,
        heightInches: 8,
        price: totalAmount,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      // Save to localStorage of raincoat orders
      const existingJson = localStorage.getItem('raincoat_orders') || '[]';
      const existingList = JSON.parse(existingJson);
      existingList.unshift(newOrder);
      localStorage.setItem('raincoat_orders', JSON.stringify(existingList));

      // Trigger standard order success callback (Google Sheets sync, etc)
      onOrderSuccess(newOrder);

      setOrderSuccessMsg(true);
      
      // Reset form fields
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      
      setTimeout(() => {
        setOrderSuccessMsg(false);
        setCheckoutProduct(null);
      }, 5000);
    } catch (err) {
      setFormError('অর্ডার সাবমিট করতে ত্রুটি হয়েছে। আবার চেষ্টা করুন!');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans pb-16 selection:bg-orange-600 selection:text-white relative">
      
      {/* 🚀 Amazon/Alibaba Promotional Banner Bar */}
      <div className="bg-amber-400 text-slate-950 text-center font-black py-2.5 px-4 text-xs sm:text-sm flex items-center justify-center gap-3">
        <span>🔥 বর্ষার স্পেশাল মেঘা সেল! ১০টির বেশি ক্যাটাগরির রেইনকোট জ্যাকেট, সু গার্ড ও ট্রাভেল অনুষঙ্গে বিশাল ছাড়!</span>
        <button 
          onClick={() => {
            window.history.pushState(null, '', '/raincoat');
            window.dispatchEvent(new Event('popstate'));
          }}
          className="bg-slate-950 text-white rounded px-2.5 py-1 text-[11px] hover:bg-slate-900 transition flex items-center gap-1 cursor-pointer font-extrabold"
        >
          রেইনকোট অর্ডার করুন লাইভ টেস্ট ⚡
        </button>
      </div>

      {/* 🛍️ Gorgeous Marketplace Nav Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-[100] shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Logo & Slogan */}
          <div className="flex items-center justify-between">
            <div 
              onClick={() => {
                window.history.pushState(null, '', '/');
                window.dispatchEvent(new Event('popstate'));
              }}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/10">
                <ShoppingBag className="h-5 w-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent flex items-center gap-1">
                  Bazarsodaie
                </h1>
              </div>
            </div>

            {/* Icons on mobile */}
            <div className="flex items-center gap-2.5 md:hidden">
              <button 
                onClick={() => {
                  window.history.pushState(null, '', '/track-order');
                  window.dispatchEvent(new Event('popstate'));
                }}
                className="p-1 px-2.5 bg-slate-800 text-slate-200 rounded-lg text-xs font-bold"
              >
                ট্র্যাকিং 🔍
              </button>
            </div>
          </div>

          {/* E-Commerce Search Input Bar */}
          <div className="flex-1 max-w-xl mx-auto w-full relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="বৃষ্টি নিরোধক রেইনকোট, সু কাভার বা ট্রাভেল ড্রাই ব্যাগ খুঁজুন..."
              className="w-full pl-4 pr-11 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl focus:bg-white focus:text-slate-900 focus:outline-none focus:border-orange-500 transition-all font-sans text-xs sm:text-sm text-slate-200 placeholder-slate-450"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="h-4 w-4 stroke-[2.5]" />
            </div>
          </div>

          {/* Quick Tools & Badges */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => {
                window.history.pushState(null, '', '/raincoat');
                window.dispatchEvent(new Event('popstate'));
              }}
              className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              🌧️ <span className="hover:underline">রেইনকোট স্পেশাল জোন</span>
            </button>
            
            <button 
              onClick={() => {
                window.history.pushState(null, '', '/track-order');
                window.dispatchEvent(new Event('popstate'));
              }}
              className="text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5"
            >
              🔍 অর্ডার ট্র্যাকিং
            </button>

            <span className="w-px h-5 bg-slate-800" />

            <button 
              onClick={() => {
                window.history.pushState(null, '', '/shop');
                window.dispatchEvent(new Event('popstate'));
              }}
              className="relative p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-100 font-extrabold rounded-xl transition flex items-center justify-center gap-2 px-3 text-xs"
            >
              <ShoppingCart className="h-4 w-4 text-orange-400" />
              <span>কার্ট ({cartCount})</span>
            </button>
          </div>

        </div>
      </header>

      {/* 🌟 Amazon-Style Carousel Banner / Hero Section */}
      <section className="max-w-7xl mx-auto px-4 mt-6">
        <div className="relative min-h-[300px] sm:min-h-[350px] w-full rounded-3xl overflow-hidden shadow-xl border border-slate-800">
          {bannerSlides.map((slide, idx) => {
            const isActive = idx === activeBannerSlide;
            return (
              <div
                key={idx}
                className={`absolute inset-0 bg-gradient-to-r ${slide.bgClass} p-8 sm:p-12 flex flex-col justify-center text-left transition-all duration-700 ease-in-out ${
                  isActive ? 'opacity-100 z-10 scale-100 pointer-events-auto' : 'opacity-0 z-0 scale-95 pointer-events-none'
                }`}
              >
                {/* Neon absolute decorative elements */}
                <div className="absolute right-0 top-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="max-w-xl relative z-10 space-y-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 border text-xs font-black rounded-full font-mono uppercase tracking-wider ${slide.badgeColor}`}>
                    <Percent className="h-3 w-3 animate-spin" /> {slide.badge}
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                    {slide.title}
                  </h2>
                  <p className="text-slate-200 font-medium text-xs sm:text-sm leading-relaxed max-w-lg">
                    {slide.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button 
                      onClick={slide.primaryBtnAction}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-orange-950/40 transform hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{slide.primaryBtnText}</span>
                      <ArrowUpRight className="h-4 w-4 shrink-0" />
                    </button>
                    
                    <button 
                      onClick={slide.secondaryBtnAction}
                      className="px-5 py-3 bg-slate-850 hover:bg-slate-800 text-slate-100 font-extrabold text-xs sm:text-sm rounded-xl border border-slate-700/80 transition cursor-pointer"
                    >
                      {slide.secondaryBtnText}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Navigation Dots on the bottom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {bannerSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveBannerSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  idx === activeBannerSlide ? 'bg-orange-500 w-6' : 'bg-white/45 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 🌟 Amazon Top Brand Indicators */}
      <section className="max-w-7xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Truck className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h4 className="text-xs sm:text-sm font-black text-slate-900">ডেলিভারি চার্জ আছে</h4>
              <p className="text-[10px] text-slate-500 font-medium">সারা বাংলাদেশে হোম ডেলিভারিতে কুরিয়ার</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h4 className="ক্যাশ অন ডেলিভারি text-xs sm:text-sm font-black text-slate-900">অগ্রিম পেমেন্ট নেই</h4>
              <p className="text-[10px] text-slate-500 font-medium">বুঝে পেয়ে মূল্য পরিশোধ</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h4 className="text-xs sm:text-sm font-black text-slate-900">সহজ রিটার্ন পলিসি</h4>
              <p className="text-[10px] text-slate-500 font-medium">৩ দিনের সহজ রিটার্ন</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 font-sans">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div className="text-left">
              <h4 className="text-xs sm:text-sm font-black text-slate-900">১০০% প্রিমিয়াম কোয়ালিটি</h4>
              <p className="text-[10px] text-slate-500 font-medium">হিট সিলড সেলাই প্রযুক্তি</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🏷️ Horizontal Category Filter Bar */}
      <section className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Filter className="h-5 w-5 text-orange-500 shrink-0" />
            ক্যাটাগরি অনুযায়ী ফিল্টার করুন
          </h3>
          <span className="text-xs text-slate-500 font-bold hidden sm:inline-block">সর্বমোট ১৩টি ওয়াটারপ্রুফ গিয়ার</span>
        </div>
        
        <div className="flex gap-2.5 overflow-x-auto py-3.5 scrollbar-none">
          {categoriesList.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs sm:text-xs font-black rounded-full shrink-0 transition-all border cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                  : 'bg-white text-slate-705 text-slate-700 border-slate-200/80 hover:border-slate-350'
              }`}
            >
              {cat === 'All' ? '⚡ সব প্রোডাক্ট' : cat}
            </button>
          ))}
        </div>
      </section>

      {/* 📦 Alibaba Style Grid displaying 13 dynamic items */}
      <main className="max-w-7xl mx-auto px-4 mt-4">
        {filteredProducts.length === 0 ? (
          <div className="bg-white border rounded-2xl p-16 text-center text-slate-500 max-w-lg mx-auto shadow-sm">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="font-extrabold text-sm text-slate-800">দুঃখিত! অনুসন্ধানকৃত কি-ওয়ার্ডের কোনো প্রোডাক্ট খুজে পাওয়া যায়নি।</p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
              className="mt-4 px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              রিসেট করুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const oldPrice = getOldPrice(product.price);
              const discountPct = Math.round(((oldPrice - product.price) / oldPrice) * 105);
              
              return (
                <div 
                  key={product.id}
                  className="bg-white border border-slate-200/85 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:border-orange-200 group flex flex-col justify-between transition-all duration-300 relative text-left"
                >
                  
                  {/* ABSOLUTE DISCOUNT BADGE */}
                  <span className="absolute top-3 left-3 bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs z-10 animate-bounce">
                    {discountPct}% OFF
                  </span>

                  {/* Rating or tag on card upper right */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-[10px] text-slate-800 font-extrabold px-1.5 py-0.5 rounded border border-slate-200 shadow-xs z-10 flex items-center gap-0.5 font-mono">
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                    4.9
                  </div>

                  {/* Product Image Area */}
                  <div className="bg-slate-50 cursor-pointer relative aspect-square overflow-hidden border-b border-slate-100" onClick={() => setSelectedProduct(product)}>
                    <img 
                      src={product.image} 
                      alt={product.title} 
                      onError={(e) => {
                        // Keep absolute safety
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600';
                      }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="px-3.5 py-1.8 bg-white/95 backdrop-blur-xs text-slate-900 font-black text-xs rounded-xl shadow-md flex items-center gap-1 scale-90 group-hover:scale-100 transition-all">
                        <Eye className="h-3.5 w-3.5" /> বিস্তারিত দেখুন
                      </button>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-4 flex-1 flex flex-col justify-between text-left">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full inline-block">
                        {product.category}
                      </span>
                      <h4 
                        onClick={() => setSelectedProduct(product)}
                        className="font-extrabold text-slate-900 text-xs sm:text-xs sm:leading-relaxed line-clamp-2 hover:text-orange-600 cursor-pointer transition-colors"
                      >
                        {product.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-4 space-y-3">
                      {/* Price Grid */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm sm:text-base font-black text-orange-600">৳{product.price}</span>
                        <span className="text-xs text-slate-400 font-bold line-through font-mono">৳{oldPrice}</span>
                        <span className="text-[9px] text-orange-650 font-extrabold font-sans">কুরিয়ার চার্জ প্রযোজ্য</span>
                      </div>

                      {/* Buy Action Triggers */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="flex-1 py-2 border border-slate-200 hover:border-slate-350 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[10px] sm:text-xs rounded-xl transition cursor-pointer"
                        >
                          বিস্তারিত
                        </button>
                        
                        <button
                          onClick={() => handleOpenQuickOrder(product)}
                          className="flex-1.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-[10px] sm:text-xs rounded-xl transition shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-1"
                        >
                          <ShoppingBag className="h-3 w-3 shrink-0" /> ক্যাশ অন ডেলিভারি
                        </button>
                      </div>

                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>
      
      {/* 🌟 Professional E-Commerce Footer */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-12 bg-linear-to-b from-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
            {/* Brand and Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-md">
                  <ShoppingBag className="h-4 w-4 text-slate-950 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-black bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                  Bazarsodaie
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                সেরা ওয়াটারপ্রুফ রেইন গিয়ারস, উইন্ডব্রেকার ও আউটডোর এক্সেসরিজ নিয়ে আপনার বিশ্বস্ত অনলাইন শপ। শতভাগ চেক করে ডেলিভারি ও ক্যাশ অন ডেলিভারি সুবিধা।
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-3 font-sans">
              <h4 className="text-xs font-bold uppercase text-white tracking-wider">দ্রুত লিংক</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button 
                    onClick={() => {
                      window.history.pushState(null, '', '/raincoat');
                      window.dispatchEvent(new Event('popstate'));
                    }} 
                    className="hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    🌧️ রেইনকোট কালেকশন
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      window.history.pushState(null, '', '/track-order');
                      window.dispatchEvent(new Event('popstate'));
                    }} 
                    className="hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    🔍 অর্ডারের অবস্থান ট্র্যাকিং
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      window.history.pushState(null, '', '/shop');
                      window.dispatchEvent(new Event('popstate'));
                    }} 
                    className="hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    🛒 শপিং কার্ট
                  </button>
                </li>
              </ul>
            </div>

            {/* Delivery Policy */}
            <div className="space-y-3 font-sans">
              <h4 className="text-xs font-bold uppercase text-white tracking-wider">ডেলিভারি পলিসি</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-1.5">
                  <span className="text-teal-400 shrink-0">✓</span>
                  <span><strong>ক্যাশ অন ডেলিভারি:</strong> কোনো অগ্রিম টাকা দিতে হবে না, পণ্য বুঝে পেয়ে মূল্য পরিশোধ করুন।</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-teal-400 shrink-0">✓</span>
                  <span><strong>চেক করার সুবিধা:</strong> ডেলিভারিম্যান সামনে রেখে পণ্য চেক করে নিতে পারবেন।</span>
                </li>
              </ul>
            </div>

            {/* Customer Support */}
            <div className="space-y-3 font-sans text-xs">
              <h4 className="text-xs font-bold uppercase text-white tracking-wider">ক্রেতা সেবা ও যোগাযোগ</h4>
              <p className="text-slate-400 leading-relaxed">
                যেকোনো জিজ্ঞাসা বা অর্ডারে সহায়তার জন্য সরাসরি যোগাযোগ করুন।
              </p>
              <div className="space-y-1 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-white font-bold select-all">
                  📞 +৮৮০ ১৬২৪৯ ৯৩৩৯৪৯
                </div>
                <div className="text-[10px] text-slate-500 font-medium">সকাল ১০টা - রাত ১০টা পর্যন্ত</div>
              </div>
            </div>
          </div>

          <hr className="border-slate-800 my-8" />

          {/* Bottom Footer bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} Bazarsodaie. All rights reserved.
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-800/45 text-slate-400 rounded border border-slate-800">সুরক্ষিত পেমেন্ট</span>
              <span className="px-2 py-0.5 bg-slate-800/45 text-slate-400 rounded border border-slate-800">ক্যাশ অন ডেলিভারি</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 💡 PRODUCT DETAILS QUICK VIEW MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-100 p-6 space-y-6 text-left">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-full transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Image */}
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden border bg-slate-50 aspect-square">
                  <img 
                    src={activeImage || selectedProduct.image} 
                    alt={selectedProduct.title} 
                    className="w-full h-full object-cover transition-all"
                  />
                </div>
                {selectedProduct.images && selectedProduct.images.length > 0 && (
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    <button 
                      onClick={() => setActiveImage(selectedProduct.image)}
                      type="button"
                      className={`border aspect-square rounded-lg overflow-hidden relative cursor-pointer transition ${(!activeImage || activeImage === selectedProduct.image) ? 'border-orange-500 scale-95 ring-2 ring-orange-400/20' : 'border-slate-200 hover:border-slate-350'}`}
                    >
                      <img src={selectedProduct.image} className="w-full h-full object-cover" />
                    </button>
                    {selectedProduct.images.map((imgUrl, i) => (
                      <button 
                        key={i}
                        onClick={() => setActiveImage(imgUrl)}
                        type="button"
                        className={`border aspect-square rounded-lg overflow-hidden relative cursor-pointer transition ${(activeImage === imgUrl) ? 'border-orange-500 scale-95 ring-2 ring-orange-400/20' : 'border-slate-200 hover:border-slate-350'}`}
                      >
                        <img src={imgUrl} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="space-y-4">
                <span className="text-[10px] font-black tracking-wider text-orange-600 bg-orange-50 border border-orange-200/50 px-2.5 py-1 rounded-full uppercase">
                  {selectedProduct.category}
                </span>

                <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">{selectedProduct.title}</h3>
                
                <p className="text-xs text-slate-500 leading-relaxed">{selectedProduct.description}</p>
                
                <div className="flex items-baseline gap-2 border-t border-b border-slate-100 py-3">
                  <span className="text-lg sm:text-xl font-black text-orange-600">৳{selectedProduct.price}</span>
                  <span className="text-xs text-slate-400 font-bold line-through font-mono">৳{getOldPrice(selectedProduct.price)}</span>
                  <span className="text-[10px] text-red-600 font-black bg-red-50 px-2 py-0.5 rounded">কুরিয়ার চার্জ প্রযোজ্য ৳৮০</span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <p>📏 <strong>উপলব্ধ সাইজ:</strong> {selectedProduct.sizes.join(', ')}</p>
                  <p>🎨 <strong>উপলব্ধ কালারস:</strong> {selectedProduct.colors.join(', ')}</p>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      handleOpenQuickOrder(selectedProduct);
                    }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-orange-500/10 cursor-pointer text-center"
                  >
                    🛒 সরাসরি অর্ডার দিন (অগ্রিম টাকা ছাড়া)
                  </button>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🛡️ FAST CASH-ON-DELIVERY QUICK ORDER FORM DRAWERS */}
      {checkoutProduct && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 relative border border-slate-100 text-left scale-98 sm:scale-100 duration-200">
            
            {/* Close Button */}
            <button 
              onClick={() => {
                if (!isSubmittingOrder) {
                  setCheckoutProduct(null);
                }
              }}
              className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-full transition cursor-pointer"
              disabled={isSubmittingOrder}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-black text-amber-600 text-xs sm:text-sm flex items-center gap-1.5">
                <span>⚡</span> দ্রুত ক্যাশ অন ডেলিভারি অর্ডার ফর্ম
              </h3>
              <p className="text-[10px] text-slate-500 font-medium font-sans mt-0.5">সবচেয়ে জনপ্রিয় ও নির্ভরযোগ্য বাংলাদেশী পেমেন্ট সুবিধা।</p>
            </div>

            {/* Success Animation State */}
            {orderSuccessMsg ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto scale-110 shadow-md">
                  <Check className="h-8 w-8 stroke-[3]" />
                </div>
                <h4 className="font-black text-slate-950 text-sm">আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!</h4>
                <p className="text-xs text-slate-700 leading-relaxed px-2">
                  আমাদের একজন কনফার্মেশন কর্মকর্তা খুব শীঘ্রই কল করে আপনার অর্ডারটি ভেরিফাই করবেন। সাথে থাকার জন্য ধন্যবাদ!
                </p>
                <span className="text-[10px] text-slate-400 font-mono block">Premium Commuter Gear Co.</span>
              </div>
            ) : (
              <form onSubmit={handleQuickSubmit} className="space-y-4">
                
                {/* Product micro preview inside form */}
                <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-3">
                  <img 
                    src={checkoutProduct.image} 
                    alt={checkoutProduct.title} 
                    className="w-11 h-11 object-cover rounded-lg border bg-white shrink-0" 
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="font-extrabold text-[11px] text-slate-800 truncate leading-snug">{checkoutProduct.title}</h5>
                    <p className="text-[11px] text-orange-600 font-black mt-0.5">৳{checkoutProduct.price} <span className="text-[10px] text-slate-500 font-bold ml-1.5">• কুরিয়ার চার্জ প্রযোজ্য</span></p>
                  </div>
                </div>

                {formError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-250 text-rose-700 text-[10px] sm:text-xs rounded-lg font-bold flex items-center gap-1.5 leading-snug">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    {formError}
                  </div>
                )}

                {/* Attributes Selectors (Size & Color) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 block font-black">সাইজ নির্বাচন করুন *</label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full px-2.5 py-1.8 bg-white border border-slate-250 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500 font-sans cursor-pointer"
                    >
                      {checkoutProduct.sizes.map(sz => (
                        <option key={sz} value={sz}>{sz}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 block font-black">কালার নির্বাচন করুন *</label>
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full px-2.5 py-1.8 bg-white border border-slate-250 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500 font-sans cursor-pointer"
                    >
                      {checkoutProduct.colors.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 block font-black">আপনার পূর্ণ নাম লিখুন *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="যেমনঃ রাসেল আহমেদ"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs focus:outline-none focus:border-orange-500 shadow-3xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 block font-black">আপনার সচল মোবাইল নাম্বারটি দিন *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="যেমনঃ 017XXXXXXXX"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs font-mono focus:outline-none focus:border-orange-500 shadow-3xs"
                  />
                </div>

                {/* সম্পূর্ণ শিপিং ঠিকানা */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 block font-black">সম্পূর্ণ শিপিং ঠিকানা *</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="যেমনঃ গ্রাম, থানা, পোস্ট, জেলা"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs focus:outline-none focus:border-orange-500 shadow-3xs"
                  />
                </div>

                {/* 🚚 Delivery Area / Courier Charge Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 block font-black uppercase tracking-wider">ডেলিভারি এলাকা নির্বাচন করুন * (Delivery Area)</label>
                  <div className="grid grid-cols-3 gap-1.5 font-sans">
                    {[
                      { key: 'inside', label: 'ঢাকা সিটি', charge: Number(localStorage.getItem('raincoat_courier_inside')) || 80 },
                      { key: 'sub', label: 'সাব ঢাকা', charge: Number(localStorage.getItem('raincoat_courier_sub')) || 100 },
                      { key: 'outside', label: 'ঢাকার বাহিরে', charge: Number(localStorage.getItem('raincoat_courier_outside')) || 130 }
                    ].map((zone) => {
                      const isActive = deliveryZone === zone.key;
                      const hasCourierCharge = checkoutProduct.addDeliveryCharge !== false;
                      return (
                        <button
                          key={zone.key}
                          type="button"
                          onClick={() => {
                            setDeliveryZone(zone.key as any);
                            setCustomerDistrict(zone.key === 'inside' ? 'ঢাকা' : zone.key === 'sub' ? 'সাব ঢাকা' : 'ঢাকার বাহিরে');
                          }}
                          className={`py-2 px-1 border rounded-lg text-[11px] font-bold text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                            isActive 
                              ? 'bg-orange-50 border-orange-500 text-orange-700 ring-2 ring-orange-200/40 font-black' 
                              : 'bg-white border-slate-250 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{zone.label}</span>
                          <span className="text-[9px] font-mono opacity-80">
                            {hasCourierCharge ? `৳${zone.charge}` : 'ফ্রি'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Summary Box */}
                <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl space-y-1 font-sans text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>প্রোডাক্টের মূল্য:</span>
                    <span className="font-mono">৳{checkoutProduct.price}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>কুরিয়ার চার্জ:</span>
                    <span className="text-slate-600 font-bold">
                      {checkoutProduct.addDeliveryCharge !== false ? `৳${deliveryZone === 'inside' ? (Number(localStorage.getItem('raincoat_courier_inside')) || 80) : deliveryZone === 'sub' ? (Number(localStorage.getItem('raincoat_courier_sub')) || 100) : (Number(localStorage.getItem('raincoat_courier_outside')) || 130)}` : '৳০ (ফ্রি)'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-orange-200/60 pt-1.5 font-black text-slate-900">
                    <span>সর্বমোট টাকা পরিশোধ:</span>
                    <span className="text-orange-600 font-mono text-sm">
                      ৳{checkoutProduct.price + (checkoutProduct.addDeliveryCharge !== false ? (deliveryZone === 'inside' ? (Number(localStorage.getItem('raincoat_courier_inside')) || 80) : deliveryZone === 'sub' ? (Number(localStorage.getItem('raincoat_courier_sub')) || 100) : (Number(localStorage.getItem('raincoat_courier_outside')) || 130)) : 0)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="w-full py-2.8 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-xs rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                >
                  {isSubmittingOrder ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)'
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
