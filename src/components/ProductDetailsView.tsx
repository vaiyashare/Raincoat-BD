import React, { useState, useEffect } from 'react';
import { 
  getProductsFromFirestore, 
  getAdvancedAddonsSettingsFromFirestore,
  getCouponsFromFirestore 
} from '../lib/firebase';
import { addToCart } from '../lib/cart';
import { SIZE_RECOMMENDATIONS, DETAILED_SIZE_CHART, CUSTOMER_REVIEWS } from '../data';
import { Product } from '../types';
import { 
  Star, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  ShoppingCart, 
  ChevronLeft, 
  PhoneCall, 
  MessageCircle, 
  Award,
  RefreshCw
} from 'lucide-react';

interface ProductDetailsViewProps {
  productSlug: string;
}

export default function ProductDetailsView({ productSlug }: ProductDetailsViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [addons, setAddons] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Gallery slider
  const [activeImage, setActiveImage] = useState<string>('');

  // Selected config
  const [selectedSize, setSelectedSize] = useState('XL');
  const [selectedColor, setSelectedColor] = useState('Black');

  // Success notifications
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fbProducts, fbAddons] = await Promise.all([
          getProductsFromFirestore(),
          getAdvancedAddonsSettingsFromFirestore()
        ]);
        
        setProducts(fbProducts || []);
        setAddons(fbAddons);

        // Find match based on product title slug match
        const englishMap: Record<string, string> = {
          'premium-waterproof-raincoat': 'p-1',
          'premium-raincoat': 'p-1',
          'raincoat-jacket-pant': 'p-1',
          
          'heavy-duty-waterproof-motorcycle-shoe-cover': 'p-2',
          'shoe-guard': 'p-2',
          'shoe-cover': 'p-2',
          'motorcycle-shoe-cover': 'p-2',

          'double-part-windproof-umbrella': 'p-3',
          'premium-laptop-defense': 'p-3',
          'umbrella': 'p-3',

          'motorcycle-handlebar-waterproof-hand-gloves': 'p-4',
          'motorcycle-gloves': 'p-4',
          'gloves': 'p-4',

          'premium-self-locking-waterproof-bike-mobile-holder': 'p-5',
          'bike-mobile-holder': 'p-5',
          'mobile-holder': 'p-5',

          'backpack-waterproof-ultra-shield-rain-cover': 'p-6',
          'backpack-cover': 'p-6',
          'rain-shield': 'p-6',

          'sports-ultra-light-breathable-windbreaker-rain-jacket': 'p-7',
          'sports-rain-jacket': 'p-7',
          'windbreaker': 'p-7',

          'kids-funny-cartoon-waterproof-raincoat': 'p-8',
          'kids-raincoat': 'p-8',

          'ladies-classic-long-belt-raincoat-trail-coat': 'p-9',
          'ladies-raincoat': 'p-9',
          'ladies-long-coat': 'p-9',

          'outdoor-travelers-waterproof-dry-bag': 'p-10',
          'dry-bag': 'p-10',
          'travelers-bag': 'p-10',

          'night-safe-high-visibility-reflective-safety-rain-vest': 'p-11',
          'reflective-safety-vest': 'p-11',
          'safety-vest': 'p-11',
          'rain-vest': 'p-11',

          'heavy-heat-sealed-premium-rain-poncho': 'p-12',
          'premium-rain-poncho': 'p-12',
          'rain-poncho': 'p-12',
          'poncho': 'p-12',

          'silicon-elastic-anti-slip-rain-shoe-cover': 'p-13',
          'silicon-shoe-cover': 'p-13',

          '100-waterproof-dustproof-premium-bike-cover': 'p-14',
          'premium-bike-cover': 'p-14',
          'bike-cover': 'p-14'
        };

        const decodedSlug = decodeURIComponent(productSlug).toLowerCase().replace(/-/g, ' ');
        const slugKey = productSlug.toLowerCase().trim();
        
        let matched = null;
        if (englishMap[slugKey]) {
          matched = fbProducts.find(p => p.id === englishMap[slugKey]);
        }
        
        if (!matched) {
          const matchedBySlugMap = Object.entries(englishMap).find(([key, _]) => {
            return key.includes(slugKey) || slugKey.includes(key);
          });
          if (matchedBySlugMap) {
            matched = fbProducts.find(p => p.id === matchedBySlugMap[1]);
          }
        }

        if (!matched) {
          matched = fbProducts.find(p => {
            const matchTitle = p.title.toLowerCase().replace(/-/g, ' ');
            return matchTitle.includes(decodedSlug) || decodedSlug.includes(matchTitle);
          });
        }

        if (!matched) {
          matched = fbProducts[0];
        }

        if (matched) {
          setProduct(matched);
          setActiveImage(matched.image);
          if (matched.sizes && matched.sizes.length > 0) {
            setSelectedSize(matched.sizes[0]);
          }
          if (matched.colors && matched.colors.length > 0) {
            setSelectedColor(matched.colors[0]);
          }
        }
      } catch (err) {
        console.warn("Could not retrieve details for product", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [productSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-rose-600" />
        <h4 className="text-xs font-bold text-slate-700">প্রোডাক্ট ডাটা সিঙ্ক হচ্ছে...</h4>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 space-y-4">
        <span className="text-4xl">🔎</span>
        <h3 className="text-sm font-black text-slate-800">দুঃখিত, পণ্যটি খুঁজে পাওয়া যায়নি!</h3>
        <button 
          onClick={() => window.location.pathname = '/'}
          className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
        >
          হোম পেইজে যান
        </button>
      </div>
    );
  }

  // Action Add To Cart
  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, 1);
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 3500);
  };

  // Action Buy Now
  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedColor, 1);
    // Direct redirect to separate Cart page!
    window.history.pushState(null, '', '/cart');
    window.dispatchEvent(new Event('popstate'));
  };

  const handleBackToShop = () => {
    window.history.pushState(null, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-rose-500 selection:text-white pb-20">
      {/* Alert Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-rose-500 to-blue-900 text-white text-xs sm:text-sm font-bold text-center py-2.5 px-4 shadow-sm">
        <span>🌧️ বর্ষা ধামাকা ২৫% পর্যন্ত সীমিত সময়ের ছাড়! ডেলিভারি চার্জ সম্পূর্ণ ফ্রি! 🌧️</span>
      </div>

      {/* Header bar */}
      <header className="bg-white border-b border-slate-200 py-4 px-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={handleBackToShop}
            className="flex items-center gap-1.5 text-slate-700 hover:text-slate-950 font-bold text-xs transition cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" /> বাজারে ফিরে যান (Back to Shop)
          </button>
          
          <button 
            onClick={() => {
              window.history.pushState(null, '', '/cart');
              window.dispatchEvent(new Event('popstate'));
            }}
            className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition flex items-center gap-1.5 text-xs font-black cursor-pointer shadow-xs"
          >
            <ShoppingCart className="h-4 w-4" /> কার্ট পেইজ
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left side column: Product visual presentations */}
            <div className="md:col-span-6 space-y-4">
              <div className="rounded-2xl border border-slate-150 overflow-hidden bg-slate-50 aspect-square relative select-none">
                <img 
                  src={activeImage} 
                  alt={product.title} 
                  className="w-full h-full object-cover transition-all"
                />
                
                {/* Visual badge highlight */}
                <div className="absolute top-4 left-4 bg-rose-600 text-white text-[10px] uppercase font-black px-3 py-1 rounded-full shadow-md">
                  প্রিমিয়াম স্টক
                </div>
              </div>

              {/* Dynamic Slides thumb loop */}
              {product.images && product.images.length > 0 && (
                <div className="grid grid-cols-5 gap-2 select-none">
                  <button
                    onClick={() => setActiveImage(product.image)}
                    className={`border aspect-square rounded-xl overflow-hidden cursor-pointer transition ${activeImage === product.image ? 'border-rose-500 scale-95 ring-2 ring-rose-500/10' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <img src={product.image} className="w-full h-full object-cover" />
                  </button>
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(img)}
                      className={`border aspect-square rounded-xl overflow-hidden cursor-pointer transition ${activeImage === img ? 'border-rose-500 scale-95 ring-2 ring-rose-500/10' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <img src={img} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right side column: Product configuration metrics */}
            <div className="md:col-span-6 space-y-6 text-left">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-sans px-2 py-0.5 rounded-md font-black uppercase">
                    {product.category || 'REINCOAT'}
                  </span>
                  <div className="flex items-center text-amber-500 gap-0.5 text-xs font-bold font-sans">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span>৪.৯ (১২০+ রিভিউ)</span>
                  </div>
                </div>
                
                <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                  {product.title}
                </h2>
                
                <div className="flex items-baseline gap-2 pt-1.5">
                  <span className="text-xl font-black font-mono text-rose-600">{product.price} BDT</span>
                  <span className="text-xs text-slate-400 font-sans line-through">{Math.round(product.price * 1.25)} BDT</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-extrabold uppercase font-sans">20% OFF</span>
                </div>
              </div>

              {/* Verified Features list */}
              <div className="space-y-2 border-t border-b border-slate-100 py-4 font-sans text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>সম্পূর্ণ থার্মাল হিট সিলিং সিস্টেম, কোনো প্রকার লিক হওয়ার সুযোগ নেই।</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>১০০% ওয়াটারপ্রুফ জিপার এবং জ্যাকেট স্টাইল ডাবল প্রটেকশন।</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>কড সুতা অ্যাডজাস্টেবল হুডি টুপি যা চমৎকার ফিটিং দেয়।</span>
                </div>
              </div>

              {/* Sizes Customization Options */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-2.5">
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">উপযুক্ত সাইজ নির্বাচন করুন (Select Size)</label>
                  <div className="flex flex-wrap gap-2.5">
                    {product.sizes.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`px-4 py-2 text-xs font-black rounded-lg transition-all border shrink-0 cursor-pointer ${selectedSize === sz ? 'bg-slate-900 text-white border-slate-900 scale-95 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350'}`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors Customization Options */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-2.5">
                  <label className="block text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">কালার নির্বাচন করুন (Select Color)</label>
                  <div className="flex flex-wrap gap-2.5">
                    {product.colors.map((clr) => {
                      const labelBn = clr === 'Black' ? 'কালো (Premium Black)' : clr === 'Navy Blue' ? 'নেভি ব্লু (Classic Navy)' : clr;
                      return (
                        <button
                          key={clr}
                          type="button"
                          onClick={() => setSelectedColor(clr)}
                          className={`px-4 py-2 text-xs font-black rounded-lg transition-all border shrink-0 cursor-pointer ${selectedColor === clr ? 'bg-rose-600 text-white border-rose-600 scale-95 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350'}`}
                        >
                          {labelBn}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Main Call to Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md select-none"
                >
                  🤝 অর্ডার করুন (Buy Now)
                </button>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 select-none"
                >
                  <ShoppingCart className="h-4 w-4" /> কার্টে যুক্ত করুন (Add to Cart)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-left font-sans flex items-start gap-3.5">
            <Truck className="h-8 w-8 text-rose-500 shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-800">সারাদেশে ফ্রী ডেলিভারি</h4>
              <p className="text-[10px] text-slate-500">ঢাকা সহ বাংলাদেশের যেকোনো প্রান্তে সম্পূর্ণ ক্যাশ অন ডেলিভারি চার্জ একদম ফ্রি!</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-left font-sans flex items-start gap-3.5">
            <ShieldCheck className="h-8 w-8 text-rose-500 shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-800">১০০% কালার গ্যারান্টি</h4>
              <p className="text-[10px] text-slate-500">মানসম্মত এবং দীর্ঘস্থায়ী উপাদান সমূহ, কালার বিন্দুমাত্র নষ্ট হবে না।</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-left font-sans flex items-start gap-3.5">
            <Award className="h-8 w-8 text-rose-500 shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-800">হ্যান্ডলকিং জিল সিস্টেম</h4>
              <p className="text-[10px] text-slate-500">বিশেষ হাতাওয়ালা সিস্টেম যা নিশ্চিত করে বাতাস বা পানির কোনো অবৈধ প্রবেশ ঠেকাতে।</p>
            </div>
          </div>
        </div>

        {/* Detailed Description and Sizes Chart Panel */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 mt-8 text-left space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">📦 পণ্য বর্ণনা ও সাইজ গাইডলাইন (Highlights & Sizes Guide)</h3>
            <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
              {product.description || "এটি একটি উচ্চমানের প্রিমিয়াম রেইনকোট জ্যাকেট। এটি সম্পূর্ণ পলি-সিলিকন দিয়ে গঠিত এবং ভেতরে দ্বিমুখী মেমব্রেন থাকায় বাতাস বা জল প্রবেশে ১০০% বাধা দেয়। বাইকার ও সাধারণ জনগণের জন্য খুবই উপযোগী।"}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-800">📊 পরিমাপের চার্ট (Sizes Measurement Chart)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                    <th className="p-3">বিবরণ</th>
                    <th className="p-3">XL</th>
                    <th className="p-3">XXL</th>
                    <th className="p-3">3XL</th>
                    <th className="p-3">4XL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {DETAILED_SIZE_CHART.map((sc, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">{sc.parameter}</td>
                      <td className="p-3 font-mono text-slate-500">{sc.xl}</td>
                      <td className="p-3 font-mono text-slate-500">{sc.xxl}</td>
                      <td className="p-3 font-mono text-slate-500">{sc['3xl']}</td>
                      <td className="p-3 font-mono text-slate-500">{sc['4xl']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Real Customer Verification Reviews Panel */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 mt-8 text-left space-y-6">
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5 leading-none">
            ⭐ কাস্টমার রিভিউজ এবং স্ক্রিনশট (Customer Reviews)
          </h3>

          <div className="space-y-6 divide-y divide-slate-100">
            {CUSTOMER_REVIEWS.map((rev) => (
              <div key={rev.id} className="pt-5 first:pt-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-50 rounded-full overflow-hidden shrink-0 border border-slate-100">
                    <img src={rev.avatarUrl} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">{rev.customerName}</h5>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold font-mono">
                      <span>{rev.phoneNumberMasked}</span>
                      <span>•</span>
                      <span className="text-emerald-600">ভেরিফাইড ক্রেতা</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-3 font-sans text-xs">
                  {rev.messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'client' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`p-3 max-w-[85%] rounded-2xl ${msg.sender === 'client' ? 'bg-slate-100 text-slate-800' : 'bg-rose-50 text-rose-800'}`}>
                        <p className="leading-relaxed font-bold">{msg.text}</p>
                        <span className="text-[8.5px] text-slate-400 font-mono block text-right mt-1">{msg.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Floating dynamic success overlay notification toast */}
      {successToast && (
        <div className="fixed bottom-6 left-6 z-[100000] p-4 bg-slate-900 rounded-2xl shadow-2xl text-white border border-slate-800 flex items-center gap-3 max-w-sm animate-fadeIn">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-base">✓</div>
          <div className="text-left font-sans">
            <h5 className="text-xs font-black">সফলভাবে যোগ করা হয়েছে!</h5>
            <p className="text-[10px] text-slate-400">পণ্যটি আপনার শপিং কার্টে যুক্ত হয়েছে।</p>
          </div>
          <button
            onClick={() => {
              window.history.pushState(null, '', '/cart');
              window.dispatchEvent(new Event('popstate'));
            }}
            className="text-[10px] font-black text-rose-400 hover:underline shrink-0 pl-1 cursor-pointer"
          >
            কার্ট দেখুন ➔
          </button>
        </div>
      )}
    </div>
  );
}
