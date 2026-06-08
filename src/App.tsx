import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, CloudRain, Star, ShoppingBag, ShieldCheck, Phone, CheckCircle2, 
  MapPin, Clock, ArrowDown, ChevronRight, HelpCircle, Heart, Settings, 
  Smartphone, Award, Flame, ThumbsUp, Volume2, Info, MessageCircle,
  Droplets, Bike, Truck, Shield, Sparkles
} from 'lucide-react';
import SizingChart from './components/SizingChart';
import ReviewsList from './components/ReviewsList';
import OrderForm from './components/OrderForm';
import Receipt from './components/Receipt';
import AdminPanel from './components/AdminPanel';
import ProductCarousel from './components/ProductCarousel';
import LivePurchaseNotification from './components/LivePurchaseNotification';
import PromoCountdown from './components/PromoCountdown';
import PageRenderer from './components/PageRenderer';
import OrderTracker from './components/OrderTracker';
import OrderHistory from './components/OrderHistory';
import SuccessToast from './components/SuccessToast';
import FAQSection from './components/FAQSection';
import ShopView from './components/ShopView';
import AmazonMarketplace from './components/AmazonMarketplace';
import BikeCoverLanding from './components/BikeCoverLanding';
import navyRaincoatImg from './assets/images/navy_raincoat_1780660053988.png';
import { Size, ProductColor, RaincoatOrder } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { getSheetsConfig, getAccessToken, appendOrderToSheet } from './lib/googleSheets';
import { initMetaPixel, trackPixelEvent } from './lib/tracking';

export default function App() {
  const [selectedSize, setSelectedSize] = useState<Size>('XXL');
  const [selectedColor, setSelectedColor] = useState<ProductColor>('Navy Blue');
  const [submittedOrder, setSubmittedOrder] = useState<RaincoatOrder | null>(null);
  const [recentOrderForToast, setRecentOrderForToast] = useState<RaincoatOrder | null>(null);
  const [activeTrackingTab, setActiveTrackingTab] = useState<'track' | 'history'>('track');
  const [showAdmin, setShowAdmin] = useState(false);
  const [ordersCount, setOrdersCount] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [bundleOfferImage, setBundleOfferImage] = useState<string>(() => {
    return localStorage.getItem('raincoat_bundle_offer_image') || navyRaincoatImg;
  });
  const [liveVideosList, setLiveVideosList] = useState<any[]>(() => {
    const cached = localStorage.getItem('raincoat_live_videos');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      {
        id: 'live-video-default-1',
        url: 'https://www.facebook.com/reel/1471402964313008/',
        title: 'লাইভ ওয়াটার রেসিস্ট্যান্স টেস্ট',
      },
      {
        id: 'live-video-default-2',
        url: 'https://www.facebook.com/reel/2183474582444791/',
        title: 'হিট সিলিং ও রেইনপ্রুফ ডেমো',
      }
    ];
  });
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleNavigationChange = () => {
      setCurrentHash(window.location.hash);
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('hashchange', handleNavigationChange);
    window.addEventListener('popstate', handleNavigationChange);
    return () => {
      window.removeEventListener('hashchange', handleNavigationChange);
      window.removeEventListener('popstate', handleNavigationChange);
    };
  }, []);

  // Generate rain drops positions
  const [rainDrops, setRainDrops] = useState<{ left: string; delay: string; duration: string }[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      const checkoutEl = document.getElementById('checkout-form');
      if (!checkoutEl) return;
      
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const checkoutTop = checkoutEl.getBoundingClientRect().top + scrollTop;
      const viewportHeight = window.innerHeight;
      
      const maxScroll = checkoutTop - viewportHeight;
      if (maxScroll <= 0) {
        setScrollProgress(100);
      } else {
        const progress = Math.min(Math.max((scrollTop / maxScroll) * 100, 0), 100);
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Generate rain particles configurations
    const drops = Array.from({ length: 35 }).map(() => ({
      left: Math.random() * 100 + '%',
      delay: Math.random() * 2 + 's',
      duration: 1 + Math.random() * 1.5 + 's'
    }));
    setRainDrops(drops);

    // Initial load and sync orders count
    const listJson = localStorage.getItem('raincoat_orders') || '[]';
    setOrdersCount(JSON.parse(listJson).length);

    // Sync count asynchronously from Firestore database
    import('./lib/firebase').then(({ getOrdersFromFirestore, getMediaFromFirestore }) => {
      getOrdersFromFirestore().then((fbOrders) => {
        if (fbOrders && fbOrders.length > 0) {
          localStorage.setItem('raincoat_orders', JSON.stringify(fbOrders));
          setOrdersCount(fbOrders.length);
        }
      }).catch((err) => {
        console.warn("Could not sync orders count on startup:", err);
      });

      // Synchronize custom bundle offer image from Firestore
      getMediaFromFirestore().then((media) => {
        const found = media.find(item => item.id === 'bundle-offer-image');
        if (found && found.url) {
          localStorage.setItem('raincoat_bundle_offer_image', found.url);
          setBundleOfferImage(found.url);
        }

        // Sync live videos
        const filteredVideos = media.filter(item => String(item.id).startsWith('live-video-'));
        if (filteredVideos && filteredVideos.length > 0) {
          localStorage.setItem('raincoat_live_videos', JSON.stringify(filteredVideos));
          setLiveVideosList(filteredVideos);
        }
      }).catch((err) => {
        console.warn("Could not sync custom configurations:", err);
      });
    }).catch(() => {});

    const handleBundleImageUpdate = () => {
      setBundleOfferImage(localStorage.getItem('raincoat_bundle_offer_image') || navyRaincoatImg);
    };
    const handleLiveVideosUpdate = () => {
      const cached = localStorage.getItem('raincoat_live_videos');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            setLiveVideosList(parsed);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('raincoat_bundle_image_updated', handleBundleImageUpdate);
    window.addEventListener('raincoat_live_videos_updated', handleLiveVideosUpdate);

    // Dynamically inject Facebook SDK script
    const fbScript = document.createElement('script');
    fbScript.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0";
    fbScript.async = true;
    fbScript.defer = true;
    fbScript.crossOrigin = "anonymous";
    document.body.appendChild(fbScript);

    fbScript.onload = () => {
      if ((window as any).FB) {
        (window as any).FB.XFBML.parse();
      }
    };

     return () => {
       document.body.removeChild(fbScript);
       window.removeEventListener('raincoat_bundle_image_updated', handleBundleImageUpdate);
       window.removeEventListener('raincoat_live_videos_updated', handleLiveVideosUpdate);
     };
  }, []);

  // Inject third-party custom code snippets (Header & Footer slugs) dynamically
  useEffect(() => {
    // 1. Header snippet
    const headerSnippet = localStorage.getItem('raincoat_header_snippets');
    if (headerSnippet) {
      const doc = new DOMParser().parseFromString(headerSnippet, 'text/html');
      const nodes = Array.from(doc.head.childNodes).concat(Array.from(doc.body.childNodes));
      
      nodes.forEach((node: any) => {
        if (node.tagName === 'STYLE') {
          const style = document.createElement('style');
          style.innerHTML = node.innerHTML;
          style.setAttribute('data-injected', 'header-snippet');
          document.head.appendChild(style);
        } else if (node.tagName === 'SCRIPT') {
          const script = document.createElement('script');
          script.innerHTML = node.innerHTML;
          if (node.src) script.src = node.src;
          script.setAttribute('data-injected', 'header-snippet');
          document.head.appendChild(script);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const meta = node.cloneNode(true);
          meta.setAttribute('data-injected', 'header-snippet');
          document.head.appendChild(meta);
        }
      });
    }

    // 2. Footer snippet
    const footerSnippet = localStorage.getItem('raincoat_footer_snippets');
    if (footerSnippet) {
      const doc = new DOMParser().parseFromString(footerSnippet, 'text/html');
      const nodes = Array.from(doc.head.childNodes).concat(Array.from(doc.body.childNodes));
      
      nodes.forEach((node: any) => {
        if (node.tagName === 'SCRIPT') {
          const script = document.createElement('script');
          script.innerHTML = node.innerHTML;
          if (node.src) script.src = node.src;
          script.setAttribute('data-injected', 'footer-snippet');
          document.body.appendChild(script);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const elm = node.cloneNode(true);
          elm.setAttribute('data-injected', 'footer-snippet');
          document.body.appendChild(elm);
        }
      });
    }

    return () => {
      document.querySelectorAll('[data-injected]').forEach(el => el.remove());
    };
  }, []);

  // Inject Google Analytics & Facebook Pixel tags dynamically
  useEffect(() => {
    // Initial run
    initMetaPixel();

    const gaId = localStorage.getItem('ga_track_id');
    if (gaId) {
      const scriptTag = document.createElement('script');
      scriptTag.async = true;
      scriptTag.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      scriptTag.setAttribute('data-injected-api', 'ga-analytics-script');
      document.head.appendChild(scriptTag);

      const scriptConfig = document.createElement('script');
      scriptConfig.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `;
      scriptConfig.setAttribute('data-injected-api', 'ga-analytics-config');
      document.head.appendChild(scriptConfig);
    }

    // Hot config updater (PixelYourSite style real-time reload)
    const handlePixelUpdate = () => {
      document.querySelectorAll('[data-injected-api="fb-pixel-lib"]').forEach(el => el.remove());
      initMetaPixel();
    };

    window.addEventListener('raincoat_pixel_config_updated', handlePixelUpdate);

    return () => {
      document.querySelectorAll('[data-injected-api]').forEach(el => el.remove());
      window.removeEventListener('raincoat_pixel_config_updated', handlePixelUpdate);
    };
  }, []);

  const refreshOrdersCount = () => {
    const listJson = localStorage.getItem('raincoat_orders') || '[]';
    setOrdersCount(JSON.parse(listJson).length);
  };

  const handleOrderCreated = (order: RaincoatOrder) => {
    setSubmittedOrder(order);
    refreshOrdersCount();
    setRecentOrderForToast(order); // Trigger immediate success toast feedback!

    // Auto Google Sheets sync if enabled and authenticated
    const sheetsCfg = getSheetsConfig();
    const token = getAccessToken();
    if (sheetsCfg.autoSync && sheetsCfg.spreadsheetId && token) {
      appendOrderToSheet(token, sheetsCfg.spreadsheetId, order)
        .then(success => {
          if (success) {
            console.log('Successfully appended newly placed order directly to Google Sheets!');
          } else {
            console.warn('Failed to auto append placed order to Google Sheets. Check Spreadsheet ID/permissions.');
          }
        })
        .catch(err => {
          console.error('Error during auto-sync of order to Google Sheets:', err);
        });
    }

    // Smooth scroll back to order review
    const element = document.getElementById('checkout-form');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBackToShopping = () => {
    setSubmittedOrder(null);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getEmbedVideoUrl = (rawUrl: string): string => {
    if (!rawUrl) return '';
    
    // YouTube Support
    if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be')) {
      let videoId = '';
      if (rawUrl.includes('v=')) {
        const parts = rawUrl.split('v=')[1];
        videoId = parts ? parts.split('&')[0] : '';
      } else if (rawUrl.includes('youtu.be/')) {
        const parts = rawUrl.split('youtu.be/')[1];
        videoId = parts ? parts.split('?')[0] : '';
      } else if (rawUrl.includes('youtube.com/shorts/')) {
        const parts = rawUrl.split('youtube.com/shorts/')[1];
        videoId = parts ? parts.split('?')[0] : '';
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : rawUrl;
    }
    
    // Facebook Support
    if (rawUrl.includes('facebook.com') || rawUrl.includes('fb.watch')) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(rawUrl)}&show_text=false&width=500`;
    }
    
    // If it's already an embed link
    return rawUrl;
  };

  // Routing calculations
  const isAdminRoute = currentPath === '/admin' || currentHash === '#/admin' || currentHash === '#admin';
  const isTrackOrderRoute = currentPath === '/track-order' || currentHash === '#/track-order' || currentHash === '#track-order';
  const isShopRoute = currentPath === '/shop' || currentHash === '#/shop' || currentHash === '#shop';
  const isRaincoatLandingRoute = currentPath === '/raincoat' || currentHash === '#/raincoat' || currentHash === '#raincoat';
  const isBikeCoverLandingRoute = currentPath === '/bikecover' || currentHash === '#/bikecover' || currentHash === '#bikecover';

  // Check if hash matches a custom page slug from custom landing pages collection
  const pagesJson = localStorage.getItem('raincoat_pages') || '[]';
  let activeCustomPage = null;
  try {
    const pages = JSON.parse(pagesJson);
    const cleanHash = currentHash.replace(/^#\//, '').replace(/^#/, '');
    if (cleanHash && cleanHash !== 'home' && cleanHash !== 'features' && cleanHash !== 'live-video' && cleanHash !== 'comparison' && cleanHash !== 'bundle-offer' && cleanHash !== 'delivery-timeline' && cleanHash !== 'size-chart' && cleanHash !== 'checkout-form' && cleanHash !== 'track-order') {
      activeCustomPage = pages.find((p: any) => p.slug === cleanHash);
    }
  } catch (e) {
    console.error(e);
  }

  // Handle direct Admin routing
  if (isAdminRoute) {
    return (
      <AdminPanel 
        onClose={() => {
          if (currentPath === '/admin') {
            window.history.pushState(null, '', '/');
            window.dispatchEvent(new Event('popstate'));
          } else {
            window.location.hash = '';
          }
        }} 
        onRefreshOrdersCount={refreshOrdersCount}
      />
    );
  }

  // Handle Track Order routing (Separate Tab/Page View)
  if (isTrackOrderRoute) {
    return (
      <div className="min-h-screen bg-slate-50 relative selection:bg-blue-600 selection:text-white flex flex-col justify-between font-sans">
        {/* Urgent Alert Strip */}
        <div className="bg-gradient-to-r from-orange-600 via-rose-500 to-blue-900 text-white text-xs sm:text-sm font-bold text-center py-2 px-4 shadow-sm flex items-center justify-center gap-2 relative z-40 font-sans">
          <span>🌧️ বর্ষা ধামাকা ২০% ছাড়! ডেলিভারি চার্জ সম্পূর্ণ ফ্রি! 🌧️</span>
          <button 
            onClick={() => {
              if (currentPath === '/track-order') {
                window.location.pathname = '/';
              } else {
                window.location.hash = '';
              }
            }} 
            className="underline text-amber-250 hover:text-white transition font-black ml-4 cursor-pointer"
          >
            প্রধান পেইজে যান
          </button>
        </div>

        {/* Back navigation bar */}
        <div className="bg-white border-b border-slate-200 py-3 px-4 shadow-xs">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button
              onClick={() => {
                if (currentPath === '/track-order') {
                  window.location.pathname = '/';
                } else {
                  window.location.hash = '';
                }
              }}
              className="flex items-center gap-1.5 text-slate-700 hover:text-slate-950 font-bold text-xs cursor-pointer hover:underline"
            >
              ⬅ প্রধান পেইজে ফেরত যান
            </button>
            <span className="text-[11px] font-bold text-slate-400 font-mono">Premium Raincoat Shop BD</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 py-10 px-4 max-w-3xl mx-auto w-full flex flex-col justify-center gap-6">
          {/* Segmented active Tab Selection switcher */}
          <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-300 w-full sm:max-w-md mx-auto">
            <button
              onClick={() => setActiveTrackingTab('track')}
              className={`flex-1 py-2.5 text-xs sm:text-xs font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTrackingTab === 'track'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-250'
              }`}
            >
              🔍 অর্ডারটি ট্র্যাক করুন
            </button>
            <button
              onClick={() => setActiveTrackingTab('history')}
              className={`flex-1 py-2.5 text-xs sm:text-xs font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTrackingTab === 'history'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-250'
              }`}
            >
              📊 আমার অর্ডার হিস্টোরি
            </button>
          </div>

          <div className="w-full">
            {activeTrackingTab === 'track' ? <OrderTracker /> : <OrderHistory />}
          </div>
        </div>

        {/* Secure Trust Footer */}
        <div className="bg-slate-900 text-slate-400 text-center py-6 border-t border-slate-800 text-xs">
          <p>© {new Date().getFullYear()} Premium Raincoat BD. সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="text-[10px] text-slate-550 mt-1">সবচেয়ে নির্ভরযোগ্য কাস্টমার কুরিয়ার ট্র্যাকিং</p>
        </div>
      </div>
    );
  }

  // Handle Shop routing (Separate Tab/Page View)
  if (isShopRoute) {
    return (
      <div className="min-h-screen bg-slate-50 relative selection:bg-blue-600 selection:text-white flex flex-col justify-between font-sans">
        {/* Urgent Alert Strip */}
        <div className="bg-gradient-to-r from-orange-600 via-rose-500 to-blue-900 text-white text-xs sm:text-sm font-bold text-center py-2 px-4 shadow-sm flex items-center justify-center gap-2 relative z-40 font-sans">
          <span>🌧️ বর্ষা ধামাকা ২০% ছাড়!  ডেলিভারি চার্জ সম্পূর্ণ ফ্রি! 🌧️</span>
          <button 
            onClick={() => {
              if (currentPath === '/shop') {
                window.history.pushState(null, '', '/');
                window.dispatchEvent(new Event('popstate'));
              } else {
                window.location.hash = '';
              }
            }} 
            className="underline text-amber-250 hover:text-white transition font-black ml-4 cursor-pointer"
          >
            প্রধান পেইজে যান
          </button>
        </div>

        {/* Back navigation bar */}
        <div className="bg-white border-b border-slate-200 py-3.5 px-4 shadow-xs">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button
              onClick={() => {
                if (currentPath === '/shop') {
                  window.history.pushState(null, '', '/');
                  window.dispatchEvent(new Event('popstate'));
                } else {
                  window.location.hash = '';
                }
              }}
              className="flex items-center gap-1.5 text-slate-700 hover:text-slate-950 font-bold text-xs sm:text-sm cursor-pointer hover:underline"
            >
              ⬅ প্রধান পেইজে ফেরত যান
            </button>
            <span className="text-[11px] font-bold text-slate-400 font-mono">Premium Raincoat Shop BD</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 max-w-7xl mx-auto w-full">
          <ShopView onOrderSuccess={handleOrderCreated} />
        </div>

        {/* Secure Trust Footer */}
        <div className="bg-slate-900 text-slate-400 text-center py-6 border-t border-slate-800 text-xs">
          <p>© {new Date().getFullYear()} Premium Raincoat BD. সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="text-[10px] text-slate-550 mt-1">সবচেয়ে নির্ভরযোগ্য কাস্টমার কুরিয়ার ট্র্যাকিং</p>
        </div>
      </div>
    );
  }

  // Handle custom Pages routing
  if (activeCustomPage) {
    return (
      <div className="min-h-screen bg-slate-50 relative selection:bg-blue-600 selection:text-white">
        {/* Urgent Alert Strip */}
        <div className="bg-gradient-to-r from-orange-600 via-rose-500 to-blue-900 text-white text-xs sm:text-sm font-bold text-center py-2 px-4 shadow-sm flex items-center justify-center gap-2 relative z-40 font-sans">
          <span>🌧️ বর্ষা ধামাকা ২০% ছাড়! ডেলিভারি চার্জ সম্পূর্ণ ফ্রি! 🌧️</span>
          <button 
            onClick={() => window.location.hash = ''} 
            className="underline text-amber-250 hover:text-white transition font-black ml-4 cursor-pointer"
          >
            প্রধান পেইজে যান
          </button>
        </div>
        
        <PageRenderer 
          page={activeCustomPage} 
          onOrderSuccess={handleOrderCreated} 
        />
        
        {/* Floating Call & WhatsApp Buttons */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none font-sans">
          <a
            href="https://wa.me/8801624933949"
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto flex items-center justify-center bg-emerald-500 text-white w-10 h-10 rounded-full shadow-[0_3px_10px_rgba(16,185,129,0.3)] hover:scale-110 transition-transform"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
          <a
            href="tel:+8801624933949"
            className="pointer-events-auto flex items-center justify-center bg-blue-600 text-white w-10 h-10 rounded-full shadow-[0_3px_10px_rgba(37,99,235,0.3)] hover:scale-110 transition-transform"
          >
            <Phone className="h-4.5 w-4.5 animate-pulse" />
          </a>
        </div>
      </div>
    );
  }

  // Handle Bike Cover Landing Route
  if (isBikeCoverLandingRoute) {
    return (
      <div className="min-h-screen bg-slate-950 relative selection:bg-orange-600 selection:text-white flex flex-col justify-between font-sans">
        <BikeCoverLanding onOrderSuccess={handleOrderCreated} />
        
        {/* Real-time floating purchase notification toast and success feedback */}
        <LivePurchaseNotification />
        {recentOrderForToast && (
          <SuccessToast 
            order={recentOrderForToast} 
            onClose={() => setRecentOrderForToast(null)} 
          />
        )}
      </div>
    );
  }

  // Handle Home Route (Alibaba / Amazon marketplace design)
  const isHomeRoute = currentPath === '/' || currentPath === '' || currentHash === '' || currentHash === '#/' || currentHash === '#home';
  if (isHomeRoute && !isRaincoatLandingRoute) {
    return (
      <div className="min-h-screen bg-slate-50 relative selection:bg-orange-600 selection:text-white flex flex-col justify-between font-sans">
        <AmazonMarketplace onOrderSuccess={handleOrderCreated} />
        
        {/* Real-time floating purchase notification toast and success feedback */}
        <LivePurchaseNotification />
        {recentOrderForToast && (
          <SuccessToast 
            order={recentOrderForToast} 
            onClose={() => setRecentOrderForToast(null)} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">
      
      {/* Top Thin Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-[4px] bg-slate-800/10 z-[100000] pointer-events-none">
        <div 
          className="h-full bg-gradient-to-r from-orange-500 via-[#00e3cd] to-rose-500 transition-all duration-100 ease-out shadow-xs"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* FB Root Element for official Facebook SDK */}
      <div id="fb-root"></div>

      {/* Top Urgent Alert Strip */}
      <div className="bg-gradient-to-r from-orange-600 via-rose-500 to-blue-900 text-white text-xs sm:text-sm font-bold text-center py-2 px-4 shadow-sm flex items-center justify-center gap-2 relative z-40 font-sans">
        <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] sm:text-xs animate-pulse text-amber-200">অফার এলার্ট!</span>
        <span>🌧️ বর্ষা ধামাকা ২০% ছাড়! ডেলিভারি চার্জ সহ সারা বাংলাদেশে ক্যাশ অন ডেলিভারি (COD)! 🌧️</span>
        <button
          onClick={() => scrollToSection('checkout-form')}
          className="underline hover:text-orange-200 transition font-extrabold cursor-pointer hidden sm:inline-block ml-4"
        >
          অর্ডার করুন এখন
        </button>
        <button
          onClick={() => window.open('#/track-order', '_blank')}
          className="underline hover:text-cyan-200 text-cyan-100 transition font-extrabold cursor-pointer hidden sm:inline-block ml-4"
        >
          🔍 অর্ডার ট্র্যাক করুন
        </button>
      </div>

      {/* Elegant Header / Hero Section with animated rain backdrop */}
      <header className="relative bg-slate-900 text-white overflow-hidden py-10 sm:py-16 border-b border-slate-800" id="home">
        {/* Animated Simulated Raindrops */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          {rainDrops.map((drop, idx) => (
            <div
              key={idx}
              className="rain-drop"
              style={{
                left: drop.left,
                animationDelay: drop.delay,
                animationDuration: drop.duration,
              }}
            />
          ))}
        </div>

        {/* Ambient Dark Mesh Blue glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-600/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* High-fidelity interactive Product Carousel showing real product images & features */}
            <div className="lg:col-span-5 relative w-full flex flex-col items-center justify-center mt-6 lg:mt-0 order-first lg:order-last animate-fade-in space-y-4">
              <ProductCarousel />
              
              {/* 3 Seasons Durability Guarantee trust badge card */}
              <div className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-slate-900/60 p-4 border border-slate-700/50 rounded-2xl flex items-center gap-4 shadow-xl text-left">
                <div className="relative shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400">
                  <ShieldCheck className="h-7 w-7" />
                  <span className="absolute text-[8px] font-black font-sans text-orange-400 mt-1">3S</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-extrabold text-orange-400 font-sans flex items-center gap-1">
                    🛡️ ৩ সিজন ব্যবহার করতে পারবেন অনায়াসে!
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-300 leading-relaxed font-sans">
                    ৩ সিজন ব্যবহার পারবেন অনায়েশে যদি সঠিক ভাবে ব্যবহার করেন। আমাদের রেইনকোটের উন্নত ফ্যাব্রিকেশন এবং থার্মাল পিইউ সীমিং সিলিং দীর্ঘস্থায়িত্বের শতভাগ নিশ্চয়তা দেয়।
                  </p>
                </div>
              </div>
            </div>

            {/* Hero text content block */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left lg:order-first">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-550/10 text-orange-400 text-xs font-bold rounded-full border border-orange-500/20 uppercase tracking-widest font-sans">
                <CloudRain className="h-4 w-4 animate-bounce text-orange-400" /> ১০০% প্রিমিয়াম ওয়াটারপ্রুফ গিয়ার
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight font-sans">
                ঝুম বৃষ্টি কিংবা ঝড়ো হাওয়া— <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-200 to-white block mt-2">
                  বাইরে বের হতে আর কোনো ভয় নেই!
                </span>
              </h1>
              
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0 font-sans">
                আমরা নিয়ে এলাম সম্পূর্ণ থার্মাল হিট সিল প্রযুক্তির প্রিমিয়াম কোয়ালিটির রেইনকোট জ্যাকেট ও প্যান্টের এক দুর্দান্ত কম্বো! কোনো বাইরের সেলাই নেই, ফলে এক ফোটা পানিও কাপড়ে ঢোকার সুযোগ নেই।
              </p>

              {/* Dynamic offer bubble */}
              <div className="bg-slate-800/80 backdrop-blur-xs p-4 rounded-2xl border border-slate-700/80 max-w-md mx-auto lg:mx-0 grid grid-cols-2 gap-4">
                <div className="text-center border-r border-slate-700 font-sans">
                  <span className="text-[10px] text-slate-400 block pb-1">XL & XXL সাইজ</span>
                  <span className="text-2xl font-black text-orange-400 font-mono">৯৯০/- TK</span>
                </div>
                <div className="text-center font-sans">
                  <span className="text-[10px] text-slate-400 block pb-1">3XL & 4XL সাইজ</span>
                  <span className="text-2xl font-black text-orange-400 font-mono">১০৯০/- TK</span>
                </div>
              </div>

              {/* Badges checklist */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2.5 pt-2 text-slate-300 text-xs font-semibold">
                <div className="flex items-center gap-1.5 font-sans">
                  <CheckCircle2 className="h-4.5 w-4.5 text-orange-400" /> হিট সিল প্রযুক্তি
                </div>
                <div className="flex items-center gap-1.5 font-sans">
                  <CheckCircle2 className="h-4.5 w-4.5 text-orange-400" /> হাতের কব্জি রাবার গ্রিপ
                </div>
                <div className="flex items-center gap-1.5 font-sans">
                  <CheckCircle2 className="h-4.5 w-4.5 text-orange-400" /> ৩ বছর ব্যবহার করতে পারবেন অনায়েশে
                </div>
              </div>

              {/* CTA buttons flow */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-3">
                <button
                  onClick={() => scrollToSection('checkout-form')}
                  className="px-8 py-4 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-black text-sm sm:text-base rounded-2xl transition duration-300 shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer animate-pulse-subtle"
                  id="hero-order-now"
                >
                  <ShoppingBag className="h-5 w-5" /> অর্ডার ফরম এ চলে যান (COD)
                </button>
                <button
                  onClick={() => scrollToSection('sizing-tool')}
                  className="px-6 py-4 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 font-bold text-sm sm:text-base rounded-2xl transition duration-300 flex items-center justify-center gap-1 cursor-pointer"
                >
                  সাইজ ক্যালকুলেটর <ChevronRight className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              {/* Trust Badges in Bengali */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-4 mt-1 border-t border-slate-800/60 font-sans">
                <div className="flex items-center gap-1.5 bg-slate-800/35 px-2.5 py-1.5 rounded-full border border-slate-850">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[10px] sm:text-xs text-slate-300 font-medium">১০০% নিরাপদ পেমেন্ট</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-800/35 px-2.5 py-1.5 rounded-full border border-slate-850">
                  <Award className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="text-[10px] sm:text-xs text-slate-300 font-medium">কোয়ালিটি চেকড প্রোডাক্ট</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-800/35 px-2.5 py-1.5 rounded-full border border-slate-850">
                  <Phone className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="text-[10px] sm:text-xs text-slate-300 font-medium">২৪/৭ দ্রুত কাস্টমার সাপোর্ট</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Prominent Embedded Video Section */}
      <section className="py-8 bg-white border-b border-slate-100" id="live-video">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="max-w-2xl mx-auto mb-6">
            <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-bold rounded-full border border-orange-200 inline-flex items-center gap-1 font-sans">
              <Volume2 className="h-3 w-3 animate-ping text-orange-500" /> হান্ড্রেড পার্সেন্ট রিয়েল লাইভ টেস্ট
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-sans">
              রেইনকোটটির কার্যকারিতা লাইভ ভিডিওতে দেখুন! 🔥
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-sans">
              এইটা কোনো সাধারণ প্লাস্টিক রেইনকোট নয়! বৃষ্টিতে কীভাবে শতভাগ পানি প্রতিরোধ করে তা সরাসরি দেখে নিন
            </p>
          </div>

          {/* Facebook/YouTube Video Iframes embedded inside high-quality device frames */}
          <div className="flex flex-wrap gap-8 justify-center items-stretch max-w-4xl mx-auto">
            {liveVideosList.map((video, index) => {
              const embedUrl = getEmbedVideoUrl(video.url);
              return (
                <div key={video.id || index} className="flex flex-col items-center">
                  <div className="relative w-[280px] sm:w-[300px] bg-slate-950 border-[6px] border-slate-800 rounded-3xl shadow-2xl aspect-[9/16] overflow-hidden">
                    {embedUrl ? (
                      <iframe 
                        src={embedUrl}
                        width="100%" 
                        height="100%" 
                        style={{ border: 'none', overflow: 'hidden' }} 
                        scrolling="no" 
                        frameBorder="0" 
                        allowFullScreen={true}
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                        title={video.title || `Premium Raincoat Live performance demo ${index + 1}`}
                        className="absolute inset-0"
                        id={`fb-iframe-iframe-${video.id || index}`}
                      />
                    ) : (
                      <div className="text-xs text-slate-500 flex items-center justify-center h-full font-sans">লিংক ভুল প্রবেশ করা হয়েছে</div>
                    )}
                  </div>
                  {video.title && (
                    <span className="mt-3 text-xs sm:text-sm font-extrabold text-slate-800 bg-slate-100 border border-slate-200 shadow-sm px-3 py-1 rounded-full font-sans">
                      📱 {video.title}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex justify-center gap-4 text-[11px] sm:text-xs font-sans text-slate-500">
            <span className="flex items-center gap-1">
              ⭐ ১২৭৮৫+ জন কৃষক, চাকরিজীবি ও বাইকার ভাইয়েদের প্রথম পছন্দ
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              💧 নিখুঁত ওয়াটার-গ্রিপিং ও ড্রিপ প্রুফ
            </span>
          </div>
        </div>
      </section>

      {/* Bento Grid Features Showcase */}
      <section className="py-10 bg-slate-50 border-b border-slate-100" id="features">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest font-sans">কেন আমাদের রেইনকোট সেরা?</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-sans">
              শতভাগ সুরক্ষার জন্য প্রিমিয়াম ডিজাইন ও কোয়ালিটি ফিচার
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-sans">
              আলাদা জ্যকেট ও প্যান্টের এক চমত্কার সেলাই বিহীন কম্বিনেশন, যা কাদা বালি ও ঝড়ের ঝাপটা থেকে বাঁচাবে সম্পূর্ণ সুরক্ষিতভাবে।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 font-sans">
            {/* feature 1 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-lg transition-all duration-300 animate-fade-in flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 shrink-0">
                    <Droplets className="h-5 w-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-950 font-sans">১০০% ওয়াটারপ্রুফ ফেব্রিক্স</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  উন্নত মানের হাই-ডেন্সিটি ফেব্রিক্স দিয়ে নিখুঁত ফিনিশিং করা। টানা ভারী বৃষ্টির পিনপ্রিক ড্রপ ও কাদা জল নিষ্কাশন করতে ১০০% সমর্থ্য।
                </p>
              </div>
            </div>

            {/* feature 2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                    <Flame className="h-5 w-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-950 font-sans">থার্মাল হিট সিল প্রযুক্তি</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  কোনো সুই বা সুতোর ছিদ্র নেই! কাপড়ের জোড়গুলোতে থার্মাল হিট সিল ব্যবহার করার ফলে এর ভেতর দিয়ে এক ফোটা পানি বা ঝড়ো বাতাস ঢোকার কোনো সুযোগই নেই।
                </p>
              </div>
            </div>

            {/* feature 3 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-950 font-sans">হাতের কব্জিতে রাবার গ্রিপ</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  কব্জিতে প্রিমিয়াম ফিনিশড রাবার দেওয়া রয়েছে। মোটরসাইকেল ড্রাইভ বা সাইক্লিং করার সময় হাত বেয়ে বাতাস ও জল কাপড়ের ভেতর প্রবেশ করতে পারে না।
                </p>
              </div>
            </div>

            {/* feature 4 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                    <Bike className="h-5 w-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-950 font-sans">বাইকার ও সাইক্লিস্টদের পরম গিয়ার</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  TVS, Suzuki, Yamaha, Pulsar বা Bajaj ইত্যাদি বাইক নিয়ে যারা হাইওয়েতে নিয়মিত যাতায়াত করেন, তাদের বর্ষাকালের একমাত্র নিখুঁত ভরসা আমাদের এই প্রিমিয়াম রেনকোট।
                </p>
              </div>
            </div>

            {/* feature 5 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                    <Truck className="h-5 w-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-950 font-sans">অগ্রিম টাকা ছাড়াই ডেলিভারি</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  বিশ্বাসযোগ্যতায় আমরা বিশ্বাসী! অর্ডার করতে অগ্রিম এক টাকাও দিতে হবে না। পার্সেল হাতে পেয়ে কোয়ালিটি দেখে তারপর কুরিয়ার এজেন্ট বা ডেলিভারি বয়কে মূল্য পরিশোধ করুন।
                </p>
              </div>
            </div>

            {/* feature 6 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
                    <Shield className="h-5 w-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-950 font-sans">৩ বছর ব্যবহার করতে পারবেন অনায়েশে</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  হালকা এবং সহজে বহনযোগ্য হওয়ার সাথে এই রেনকোটটি অত্যন্ত টেকসই। একটানা ৩ বছর অনায়াসে ব্যবহার করতে পারবেন, রঙ বা ইলাস্টিসিটি নষ্ট হবে না।
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 📊 Premium vs Regular Comparison Section */}
      <section className="py-12 bg-white border-b border-slate-100/80" id="comparison">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-[10px] sm:text-xs font-black text-orange-600 uppercase tracking-wider font-sans px-2.5 py-1 bg-orange-50 rounded-full border border-orange-100 inline-flex items-center gap-1">
              📊 তুলনামূলক পার্থক্য
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mt-2 font-sans tracking-tight">
              প্রিমিয়াম বনাম সাধারণ রেইনকোট
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-sans">
              সেলাইবিহীন থার্মাল-সিলড ও প্রিমিয়াম হাই-ডেন্সিটি ফেব্রিক্সের অবিশ্বাস্য কার্যকারিতা নিজের চোখেই দেখে নিন
            </p>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/80 shadow-md">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-slate-950 text-white font-sans text-xs sm:text-sm leading-normal">
                  <th className="py-4 px-6 text-slate-200 font-bold">তুলনীয় বৈশিষ্ট্য</th>
                  <th className="py-4 px-6 bg-emerald-950/60 text-emerald-300 font-bold border-x border-slate-900 text-center">
                    <span className="flex items-center justify-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-emerald-400" /> আমাদের প্রিমিয়াম রেনকোট
                    </span>
                  </th>
                  <th className="py-4 px-6 text-slate-400 font-bold text-center">সাধারণ বাজারী রেনকোট</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 text-xs sm:text-sm font-sans font-medium">
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition duration-150">
                  <td className="py-4 px-6 font-semibold text-slate-900">রেইনকোটের ওজন</td>
                  <td className="py-4 px-6 bg-emerald-500/5 text-emerald-700 font-bold border-x border-slate-100 text-center">
                    ৮০০ গ্রাম থেকে ১০০০ গ্রাম <br/>
                    <span className="text-[10px] font-normal text-emerald-600">(ভারী ও শতভাগ খাটি ওয়াটারপ্রুফ ডাস্ট প্রুফ হাই-ডেন্সিটি ফেব্রিক্স)</span>
                  </td>
                  <td className="py-4 px-6 text-slate-500 text-center">
                    ২০০ গ্রাম থেকে ৩০০ গ্রাম <br/>
                    <span className="text-[10px] font-normal text-rose-500">(খুবই পাতলা ও সামান্য বাতাসেই ছিঁড়ে যায়)</span>
                  </td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition duration-150">
                  <td className="py-4 px-6 font-semibold text-slate-900">সেলাই ও জয়েন্টিং</td>
                  <td className="py-4 px-6 bg-emerald-500/5 text-emerald-700 font-bold border-x border-slate-100 text-center">
                    ১০০% থার্মাল হিট সিল করা <br/>
                    <span className="text-[10px] font-normal text-emerald-600">(কোন সুই বা সুতোর ছিদ্র নেই)</span>
                  </td>
                  <td className="py-4 px-6 text-slate-500 text-center">
                    সাধারণ সুতোর সেলাই <br/>
                    <span className="text-[10px] font-normal text-rose-500">(সেলাইয়ের ফাঁক দিয়ে সহজেই পানি প্রবেশ করে)</span>
                  </td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition duration-150">
                  <td className="py-4 px-6 font-semibold text-slate-900">ফ্যাব্রিক কোয়ালিটি</td>
                  <td className="py-4 px-6 bg-emerald-500/5 text-emerald-700 font-bold border-x border-slate-100 text-center">
                    প্রিমিয়াম ডাবল-লেয়ার পিভিসি ফেব্রিক্স <br/>
                    <span className="text-[10px] font-normal text-emerald-600">(১০০% ওয়াটারপ্রুফ ও ঝড়ো বাতাস রোধী)</span>
                  </td>
                  <td className="py-4 px-6 text-slate-500 text-center">
                    সস্তা পাতলা প্লাস্টিক বা নাইলন শীট <br/>
                    <span className="text-[10px] font-normal text-rose-500">(খুব দ্রুত ভিজে যায় ও পানি চুষে ফেলে)</span>
                  </td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition duration-150">
                  <td className="py-4 px-6 font-semibold text-slate-900">স্থায়িত্ব ও লাইফটাইম</td>
                  <td className="py-4 px-6 bg-emerald-500/5 text-emerald-700 font-bold border-x border-slate-100 text-center">
                    অনায়াসে ৩ বছরের বেশি <br/>
                    <span className="text-[10px] font-normal text-emerald-600">(রঙ বা গ্লেজ নষ্ট হয় না ও ফাটে না)</span>
                  </td>
                  <td className="py-4 px-6 text-slate-500 text-center">
                    ১ থেকে ২ মাস সর্বোচ্চ <br/>
                    <span className="text-[10px] font-normal text-rose-500">(কয়েকবার মৃদু বৃষ্টিতেই ব্যবহারের অনুপযোগী হয়ে যায়)</span>
                  </td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition duration-150">
                  <td className="py-4 px-6 font-semibold text-slate-900">কব্জির সুরক্ষাকার গ্রিপ</td>
                  <td className="py-4 px-6 bg-emerald-500/5 text-emerald-700 font-bold border-x border-slate-100 text-center">
                    উন্নত ইলাস্টিক রাবার গ্রিপ <br/>
                    <span className="text-[10px] font-normal text-emerald-600">(হাত বেয়ে বাতাস বা বৃষ্টির পানি ঢোকা অসম্ভব)</span>
                  </td>
                  <td className="py-4 px-6 text-slate-500 text-center">
                    কোন গ্রিপ নেই বা সাধারণ রাবার <br/>
                    <span className="text-[10px] font-normal text-rose-500">(একটু গতিতে বাইক চালালেই পানি ভেতরে প্রবেশ করে)</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition duration-150">
                  <td className="py-4 px-6 font-semibold text-slate-900">হুডি ও ফেস প্রোটেকশন</td>
                  <td className="py-4 px-6 bg-emerald-500/5 text-emerald-700 font-bold border-x border-slate-100 text-center">
                    অ্যাডজাস্টেবল লকসহ ফুল ডাবল হুডি <br/>
                    <span className="text-[10px] font-normal text-emerald-600">(ঝড়ের মধ্যেও চোখ ও মুখ সম্পূর্ণ নিরাপদ থাকে)</span>
                  </td>
                  <td className="py-4 px-6 text-slate-500 text-center">
                    সহজে ঝুলে যাওয়া নড়বড়ে টুপি <br/>
                    <span className="text-[10px] font-normal text-rose-500">(বাতাস ও বৃষ্টির তীব্র বেগ সামলাতে পারে না)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Card-Based View */}
          <div className="block md:hidden space-y-4">
            {/* Box 1 */}
            <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/80 font-sans">
              <h4 className="font-extrabold text-slate-950 text-sm border-b border-slate-200 pb-2 mb-3 flex items-center gap-1.5">
                ⚖️ রেনকোটের মোট ওজন
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-950">
                  <span className="block font-bold text-emerald-800 text-[11px] uppercase tracking-wide">আমাদের প্রিমিয়াম:</span>
                  <p className="font-medium mt-1 leading-relaxed">৮০০ গ্রাম থেকে ১০০০ গ্রাম (ভারী, অত্যন্ত মজবুত ও প্রিমিয়াম হাই-ডেন্সিটি ফেব্রিক্স)</p>
                </div>
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-slate-500">
                  <span className="block font-bold text-slate-700 text-[11px] uppercase tracking-wide">সাধারণ রেনকোট:</span>
                  <p className="font-medium mt-1 leading-relaxed">২০০ গ্রাম থেকে ৩০০ গ্রাম (খুবই পাতলা কাগজ বা পলিথিনের মত, সামান্য বাতাস বা টানেই ছিঁড়ে যায়)</p>
                </div>
              </div>
            </div>

            {/* Box 2 */}
            <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/80 font-sans">
              <h4 className="font-extrabold text-slate-950 text-sm border-b border-slate-200 pb-2 mb-3 flex items-center gap-1.5">
                🔥 সেলাই ও জোড়াসমুহ
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-950">
                  <span className="block font-bold text-emerald-800 text-[11px] uppercase tracking-wide">আমাদের প্রিমিয়াম:</span>
                  <p className="font-medium mt-1 leading-relaxed">১০০% থার্মাল হিট সিল করা (কোন সুই বা সুতোর সেলাইয়ের ছিদ্র নেই)</p>
                </div>
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-slate-500">
                  <span className="block font-bold text-slate-700 text-[11px] uppercase tracking-wide">সাধারণ রেনকোট:</span>
                  <p className="font-medium mt-1 leading-relaxed">সাধারণ সুতোর সেলাই (সেলাইয়ের ছোট ছিদ্রগুলো দিয়ে পানি চুইয়ে ভেতরে ঢোকে)</p>
                </div>
              </div>
            </div>

            {/* Box 3 */}
            <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/80 font-sans">
              <h4 className="font-extrabold text-slate-950 text-sm border-b border-slate-200 pb-2 mb-3 flex items-center gap-1.5">
                🧥 কাপড় ও দীর্ঘস্থায়িত্ব
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-950">
                  <span className="block font-bold text-emerald-800 text-[11px] uppercase tracking-wide">আমাদের প্রিমিয়াম:</span>
                  <p className="font-medium mt-1 leading-relaxed">ডাবল-লেয়ার পিভিসি ফেব্রিক্স যা অনায়াসে ৩ বছর বা তার বেশি নিখুঁতভাবে স্থায়ী হয়</p>
                </div>
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-slate-500">
                  <span className="block font-bold text-slate-700 text-[11px] uppercase tracking-wide">সাধারণ রেনকোট:</span>
                  <p className="font-medium mt-1 leading-relaxed">সস্তা পাতলা সাধারণ নাইলন যা মাত্র ১ থেকে ২ মাস টেকসই হয়</p>
                </div>
              </div>
            </div>

            {/* Box 4 */}
            <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/80 font-sans">
              <h4 className="font-extrabold text-slate-950 text-sm border-b border-slate-200 pb-2 mb-3 flex items-center gap-1.5">
                🔒 কব্জির সুরক্ষাকার রাবার গ্রিপ ও হুডি
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-950">
                  <span className="block font-bold text-emerald-800 text-[11px] uppercase tracking-wide">আমাদের প্রিমিয়াম:</span>
                  <p className="font-medium mt-1 leading-relaxed">শক্ত ইলাস্টিক সিল লক কব্জি গ্রিপ ও লক সিস্টেম ক্যাপ দ্বারা মুখ ঢাকা থাকে</p>
                </div>
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-slate-500">
                  <span className="block font-bold text-slate-700 text-[11px] uppercase tracking-wide">সাধারণ রেনকোট:</span>
                  <p className="font-medium mt-1 leading-relaxed">কোন গ্রিপ থাকে না ও অত্যন্ত সাধারণ ঢিলেঢালা টুপি বাতাসে উড়ে যায়</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 🎁 "আজকের অফারে যা পাচ্ছেন" Special Offer Section */}
      <section className="py-10 bg-slate-950 text-white border-b border-slate-900 relative" id="bundle-offer">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Left Column: Offers Info */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/25 font-sans">
                <span>🎁 Offer Stack</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight font-sans">
                আজকের অফারে যা পাচ্ছেন
              </h2>

              {/* Urgency countdown timer */}
              <PromoCountdown />
              
              <div className="space-y-2 font-sans">
                {/* Item 1 */}
                <div className="bg-[#05131b] border border-cyan-950 hover:border-cyan-800 hover:bg-[#071924] transition-all rounded-xl py-2.5 px-4 flex items-center gap-3">
                  <span className="text-lg shrink-0">🧥</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-100">১০০% প্রিমিয়াম ওয়াটারপ্রুফ জ্যাকেট</span>
                </div>
                {/* Item 2 */}
                <div className="bg-[#05131b] border border-cyan-950 hover:border-cyan-800 hover:bg-[#071924] transition-all rounded-xl py-2.5 px-4 flex items-center gap-3">
                  <span className="text-lg shrink-0">👖</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-100">১০০% ওয়াটারপ্রুফ আরামদায়ক প্যান্ট</span>
                </div>
                {/* Item 3 */}
                <div className="bg-[#05131b] border border-cyan-950 hover:border-cyan-800 hover:bg-[#071924] transition-all rounded-xl py-2.5 px-4 flex items-center gap-3">
                  <span className="text-lg shrink-0">🎒</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-100">আকর্ষণীয় ফ্রি স্টোরেজ ও ট্রাভেল ব্যাগ</span>
                </div>
                {/* Item 4 */}
                <div className="bg-[#05131b] border border-cyan-950 hover:border-cyan-800 hover:bg-[#071924] transition-all rounded-xl py-2.5 px-4 flex items-center gap-3">
                  <span className="text-lg shrink-0">🚚</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-100">সারা বাংলাদেশে হোম ডেলিভারি হবে</span>
                </div>
                {/* Item 5 */}
                <div className="bg-[#05131b] border border-cyan-950 hover:border-cyan-800 hover:bg-[#071924] transition-all rounded-xl py-2.5 px-4 flex items-center gap-3">
                  <span className="text-lg shrink-0">💵</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-100">প্রোডাক্ট হাতে পেয়ে মূল্য পরিশোধ (ক্যাশ অন ডেলিভারি)</span>
                </div>
                {/* Item 6 */}
                <div className="bg-[#05131b] border border-cyan-950 hover:border-cyan-800 hover:bg-[#071924] transition-all rounded-xl py-2.5 px-4 flex items-center gap-3">
                  <span className="text-lg shrink-0">🔄</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-100">যেকোনো সাইজ এক্সচেঞ্জ ও পরিবর্তনের সহজ সুযোগ</span>
                </div>
              </div>
              
              {/* Green Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => scrollToSection('checkout-form')}
                  className="w-full px-6 py-3.5 bg-[#00e3cd] hover:bg-[#00cbb7] active:scale-98 text-slate-950 font-black text-sm rounded-xl transition duration-300 shadow-lg shadow-[#00e3cd]/10 flex items-center justify-center gap-2 cursor-pointer font-sans"
                >
                  🎁 Free Bag সহ এখনই অর্ডার করুন
                </button>
              </div>
            </div>
            
            {/* Right Column: Visual raincoats rendering */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm bg-white rounded-[2rem] p-6 flex items-center justify-center border border-slate-100 shadow-2xl relative overflow-hidden group aspect-square">
                {/* Soft gradient aura behind raincoat in white card */}
                <div className="absolute inset-x-0 bottom-0 h-40 bg-radial from-slate-100 to-transparent pointer-events-none" />
                <img
                  src={bundleOfferImage}
                  alt="Premium Raincoat Complete Bundle"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="w-full h-auto max-h-[300px] object-contain transition duration-500 transform group-hover:scale-[1.03] relative z-10"
                />
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* 🚚 Delivery Timeline Section as requested by the user */}
      <section className="py-8 bg-gradient-to-b from-white to-slate-50/60 border-b border-slate-100" id="delivery-timeline">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          
          {/* Delivery Timeline Pill Badge */}
          <div className="mx-auto inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white text-[11px] font-bold rounded-full border border-slate-850 shadow-md font-sans mb-3.5">
            <span className="text-[#ffb703]">🚚</span>
            <span className="text-white text-[10px] uppercase font-bold tracking-wider">Delivery Timeline</span>
          </div>
          
          {/* Main Heading heading */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 font-sans tracking-tight mb-6">
            কতদিনে ডেলিভারি পাবেন?
          </h2>
          
          {/* Three columns grid of high-conversion cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Card 1: Dhaka */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col items-center justify-center">
              <span className="text-sm font-extrabold text-slate-950 font-sans flex items-center gap-1.5">
                <span className="text-rose-500">📍</span> ঢাকা
              </span>
              <span className="text-xs text-slate-500 mt-1 font-sans font-medium">
                ১-২ দিনের মধ্যে ডেলিভারি
              </span>
            </div>
            
            {/* Card 2: Other Districts */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col items-center justify-center">
              <span className="text-sm font-extrabold text-slate-950 font-sans flex items-center gap-1.5">
                <span className="text-amber-600">📦</span> অন্যান্য জেলা
              </span>
              <span className="text-xs text-slate-500 mt-1 font-sans font-medium">
                ২-৩ দিনের মধ্যে ডেলিভারি
              </span>
            </div>
            
            {/* Card 3: COD */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col items-center justify-center">
              <span className="text-sm font-extrabold text-slate-950 font-sans flex items-center gap-1.5">
                <span className="text-emerald-600">💵</span> COD
              </span>
              <span className="text-xs text-slate-500 mt-1 font-sans font-medium">
                পণ্য হাতে পেয়ে টাকা দিবেন।
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* Sizing Chart Tool Section */}
      <section className="py-10 bg-white" id="size-chart">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Info and size tips left side */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200 uppercase tracking-widest font-sans">
                সাইজ গাইডলাইন
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight font-sans">
                সাইজ নিয়ে আর কোনো কনফিউশন নেই!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">
                আমাদের প্রতিটি কোট স্ট্যান্ডার্ড ফিটিং মাপ অনুযায়ী সেলাই করা। তবুও সাইজের কোনো সংশয় কাটাতে ডানের ক্যালকুলেটরে আপনার ওজন এবং উচ্চতা সিলেক্ট করুন, সেরা মাপটি অটোমেটিক নির্বাচন হয়ে যাবে।
              </p>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider font-sans">
                  💡 সাধারণ কিছু সাইজ টিপস
                </h4>
                <ul className="space-y-3 text-slate-600 text-xs font-sans">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 bg-blue-105 text-blue-900 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">১</span>
                    <span>সাধারণত আপনি যে সাইজের শার্ট বা প্যান্ট পরিধান করেন রেনকোটে তার একই বা পরবর্তী বড় সাইজটি নেওয়া বুদ্ধিমানের কাজ।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 bg-blue-105 text-blue-900 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">২</span>
                    <span>ডাবল পার্টের কাপড়ে বুক বা পেট খুব বেশি ভারী মনে হলে সাইজ চার্ট দেখে এক ধাপ বড় সাইজ নির্বাচন করুন।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 bg-blue-105 text-blue-900 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">৩</span>
                    <span>সরাসরি চ্যাটে আমাদের সাথে কথা বলতে আপনার উচ্চতা ও ওজন ইনবক্সে মেসেজ করুন, আমরা সঠিক সাইজ গাইড করব।</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Interactive Sizing Component right side */}
            <div className="lg:col-span-8">
              <SizingChart onSelectSize={setSelectedSize} selectedSize={selectedSize} />
            </div>

          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-10 bg-slate-950 text-white" id="reviews">
        <div className="container mx-auto px-4 max-w-7xl">
          <ReviewsList />
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Order Placement and Form flow section */}
      <section className="py-10 bg-blue-50/20" id="checkout-form">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start" id="form-scroll-target">
            
            {/* Purchase assurances block left side */}
            <div className="lg:col-span-5 space-y-6">
              <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-bold rounded-full uppercase tracking-wider font-sans inline-block border border-orange-200">
                ১০০% ক্যাশ অন কুরিয়ার (COD)
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight font-sans">
                অত্যন্ত সহজে অর্ডার করুন কোনো অগ্রিম টাকা পরিশোধ ছাড়াই!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">
                ডেলিভারি বুক করতে বা রেইনকোটটি পেতে কোনো বিকাশ পার্সোনাল বা অফলাইন অ্যাকাউন্ট চার্য পাঠাতে হবে না। আমরা ১০০% নিরাপদ কুরিয়ার প্রকোষ্ঠে বিশ্বাসী।
              </p>

              {/* Step guidance milestones */}
              <div className="relative border-l border-blue-200 pl-6 ml-3 space-y-6 text-slate-700">
                <div className="relative">
                  <span className="absolute -left-10 top-0.5 w-7 h-7 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shadow-md">১</span>
                  <h4 className="font-bold text-slate-900 text-sm font-sans">ফরম ফিলাপ করুন</h4>
                  <p className="text-slate-500 text-xs mt-1 font-sans">আপনার নাম, মোবাইল নাম্বার এবং ডেলিভারি জেলার নাম সঠিকভাবে লিখুন।</p>
                </div>
                <div className="relative">
                  <span className="absolute -left-10 top-0.5 w-7 h-7 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shadow-md">২</span>
                  <h4 className="font-bold text-slate-900 text-sm font-sans">কনফার্মেশন কল রিসিভ করুন</h4>
                  <p className="text-slate-500 text-xs mt-1 font-sans">আমাদের কুরিয়ার অ্যাসোসিয়েট কল করে মাত্র ১ মিনিটে আপনার অর্ডারের সাইজ ও কালার পুনর্নিরীক্ষণ করবেন।</p>
                </div>
                <div className="relative">
                  <span className="absolute -left-10 top-0.5 w-7 h-7 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shadow-md">৩</span>
                  <h4 className="font-bold text-slate-900 text-sm font-sans">ডেলিভারি ম্যানকে চেক করে পে করুন</h4>
                  <p className="text-slate-500 text-xs mt-1 font-sans">পার্সেল হাতে পাওয়ার পর রেইনকোট খুলে কোয়ালিটি পরখ করবেন, সব ঠিকঠাক থাকলে নগদ টাকা ক্যাশ পেমেন্ট করে চলে আসবেন!</p>
                </div>
              </div>

              {/* Bikers support quote */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-xs">
                <div className="bg-orange-500 text-white p-2.5 rounded-xl font-bold animate-pulse text-lg">
                  🏍️
                </div>
                <p className="text-xs leading-relaxed text-slate-500 font-sans">
                  <strong>বাইকারদের উদ্দেশ্যে স্পেশাল অফার:</strong> সুজুকি, ইয়ামাহা, পালসার বা টিভিএস বাইকার বন্ধুরা আমাদের রেনকোট কাপড়ে পেয়ে অত্যন্ত খুশি। কাদা বৃষ্টির চাট থেকে বাইক রাইড সেফ ও ড্রাই রাখতে আজই আপনার পছন্দের রঙ কনফার্ম করুন।
                </p>
              </div>
            </div>

            {/* Dynamic order form / Receipt output column */}
            <div className="lg:col-span-7">
              {submittedOrder ? (
                <Receipt order={submittedOrder} onClose={handleBackToShopping} />
              ) : (
                <OrderForm
                  initialSize={selectedSize}
                  selectedColor={selectedColor}
                  onChangeSize={setSelectedSize}
                  onChangeColor={setSelectedColor}
                  onOrderSuccess={handleOrderCreated}
                />
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Suttle Sticky bottom CTA order bar (for outstanding conversions) */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 py-3.5 px-4 shadow-[0_-5px_15px_rgba(0,0,0,0.06)] z-45 flex flex-col sm:flex-row justify-between items-center gap-3 block">
        <div className="flex items-center gap-2.5 text-slate-800 text-xs sm:text-sm font-sans font-semibold">
          <CloudRain className="h-5 w-5 text-orange-500 shrink-0" />
          <span>
            নির্বাচিত সাইজ: <span className="font-mono bg-slate-100 text-blue-900 px-1.5 py-0.5 rounded font-bold">{selectedSize}</span>, 
            কালার: <span className="text-blue-900 font-extrabold">{selectedColor === 'Black' ? 'কালো' : 'নেভি ব্লু'}</span>, 
            দাম: <span className="font-mono text-orange-600 font-extrabold">{selectedSize === '3XL' || selectedSize === '4XL' ? '১০৯০' : '৯৯০'} TK</span>
          </span>
        </div>
        <button
          onClick={() => scrollToSection('checkout-form')}
          className="w-full sm:w-auto px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm rounded-xl transition duration-300 shadow-md cursor-pointer flex items-center justify-center gap-1.5 font-sans"
          id="sticky-order-cta"
        >
          <ShoppingBag className="h-4 w-4" /> দ্রুত অর্ডার করুন (অগ্রিম টাকা ছাড়া)
        </button>
      </div>

      {/* Trust-building Footer and Admin shortcuts */}
      <footer className="bg-slate-900 text-white py-12 px-4 border-t border-slate-800 text-center relative z-25">
        <div className="container mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🌧️</span>
            <span className="text-lg font-black font-sans bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-white">
              প্রিমিয়াম রেইনকোট বাংলাদেশ
            </span>
          </div>

          <p className="text-slate-400 text-xs max-w-xl mx-auto font-sans leading-relaxed">
            আমরা স্থানীয় বাইকার ও সাধারণ যাতায়াতকারীদের জন্য সর্বোচ্চ প্রিমিয়াম ওয়াটারপ্রুফ গিয়ার সরবরাহ করি। আমাদের হিট সিল টেকনোলজি ও কব্জি রাবার গ্রিপ ১০০% লিক সেফ। কোনো প্রিপেইড চার্জ ছাড়া পণ্য বুঝে পেয়ে মূল্য পরিশোধ করুন।
          </p>

          <div className="py-2">
            <button
              type="button"
              onClick={() => {
                window.history.pushState(null, '', '/shop');
                window.dispatchEvent(new Event('popstate'));
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/40 hover:shadow-emerald-500/10 active:scale-[0.98] transition-all cursor-pointer font-sans"
            >
              <ShoppingBag className="h-4 w-4" /> আরো প্রোডাক্ট দেখুন (আমাদের শপ)
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] sm:text-xs text-slate-500 font-mono">
            <span>© {new Date().getFullYear()} Raincoat BD. All rights reserved.</span>
            <span>•</span>
            <span>হিট সিল ইলাস্টিক জ্যাকেট ও প্যান্ট</span>
            <span>•</span>
            <button
              onClick={() => window.open('#/track-order', '_blank')}
              className="text-slate-300 hover:text-orange-400 font-bold transition underline cursor-pointer flex items-center gap-1 font-sans"
            >
              🔍 অর্ডার ট্র্যাক করুন
            </button>
            <span className="text-slate-400 select-none">•</span>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-slate-300 hover:text-orange-400 font-bold transition underline cursor-pointer flex items-center gap-1 font-sans"
            >
              ❓ সাধারণ জিজ্ঞাসা (FAQ)
            </button>
            <span className="text-slate-900 select-none">•</span>
            <button
              onClick={() => {
                window.history.pushState(null, '', '/admin');
                window.dispatchEvent(new Event('popstate'));
              }}
              className="text-slate-900 select-none hover:text-slate-900 transition-none cursor-default flex items-center gap-1 font-sans"
              id="admin-dashboard-toggle-footer"
            >
              <Settings className="h-3 w-3 text-slate-900" /> অ্যাডমিন প্যানেল ({ordersCount} অর্ডার)
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Call & WhatsApp Buttons */}
      <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {/* WhatsApp Button */}
        <a
          href="https://wa.me/8801624933949"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white w-10 h-10 rounded-full shadow-[0_3px_10px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_15px_rgba(16,185,129,0.45)] transition-all duration-350 transform hover:scale-110"
          title="হোয়াটসঅ্যাপ মেসেজ"
        >
          <MessageCircle className="h-5 w-5" />
        </a>

        {/* Call Button */}
        <a
          href="tel:+8801624933949"
          className="pointer-events-auto flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 rounded-full shadow-[0_3px_10px_rgba(37,99,235,0.3)] hover:shadow-[0_4px_15px_rgba(37,99,235,0.45)] transition-all duration-350 transform hover:scale-110"
          title="সরাসরি কল করুন"
        >
          <Phone className="h-4.5 w-4.5 animate-pulse" />
        </a>
      </div>

      {/* Real-time floating purchase notification toast */}
      <LivePurchaseNotification />

      {/* Immediate order success feedback toast */}
      <SuccessToast order={recentOrderForToast} onClose={() => setRecentOrderForToast(null)} />

    </div>
  );
}
