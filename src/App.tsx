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
import ReviewSubmissionForm from './components/ReviewSubmissionForm';
import SuccessToast from './components/SuccessToast';
import FAQSection from './components/FAQSection';
import ShopView from './components/ShopView';
import AmazonMarketplace from './components/AmazonMarketplace';
import BikeCoverLanding from './components/BikeCoverLanding';
import CallingAgentPanel from './components/CallingAgentPanel';
import CartPage from './components/CartPage';
import ProductDetailsView from './components/ProductDetailsView';
import navyRaincoatImg from './assets/images/navy_raincoat_1780660053988.png';
import { Size, ProductColor, RaincoatOrder, ActiveSession } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { getSheetsConfig, getAccessToken, appendOrderToSheet } from './lib/googleSheets';
import { initMetaPixel, trackPixelEvent, initTikTokPixel } from './lib/tracking';
import { addOrderToFirestore, saveActiveSessionToFirestore, syncCachedOrdersToFirestore, getAdvancedAddonsSettingsFromFirestore, getOrderByIdFromFirestore } from './lib/firebase';

export default function App() {
  const [siteSettings, setSiteSettings] = useState<any>(null);

  useEffect(() => {
    async function loadSiteSettings() {
      try {
        const res = await getAdvancedAddonsSettingsFromFirestore();
        if (res) {
          setSiteSettings(res);
          if (res.site_title) {
            document.title = res.site_title;
          }
          if (res.site_favicon) {
            const faviconStr = res.site_favicon;
            let href = faviconStr;
            if (faviconStr.length < 5) {
              const svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">${faviconStr}</text></svg>`;
              href = `data:image/svg+xml,${encodeURIComponent(svgText)}`;
            }
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = href;
          }
        }
      } catch (err) {
        console.warn("Could not load site title or favicon", err);
      }
    }

    loadSiteSettings();

    const handleSettingsUpdate = () => {
      loadSiteSettings();
    };
    window.addEventListener('raincoat_site_settings_updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('raincoat_site_settings_updated', handleSettingsUpdate);
    };
  }, []);

  // Sync unsynced cached orders with Firestore in the background on startup, network change, and periodically
  useEffect(() => {
    syncCachedOrdersToFirestore();

    const handleOnline = () => {
      console.log("[Sync] Connection restored, initiating sync of local orders...");
      syncCachedOrdersToFirestore();
    };
    window.addEventListener('online', handleOnline);

    const interval = setInterval(() => {
      syncCachedOrdersToFirestore();
    }, 25000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, []);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [submittedOrder, setSubmittedOrder] = useState<RaincoatOrder | null>(null);
  const [recentOrderForToast, setRecentOrderForToast] = useState<RaincoatOrder | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [ordersCount, setOrdersCount] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);
  const [bundleOfferImage, setBundleOfferImage] = useState<string>(() => {
    const cached = localStorage.getItem('raincoat_media_gallery_fallback') || localStorage.getItem('raincoat_media_gallery');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const found = parsed.find((item: any) => item.id === 'bundle-offer-image');
        if (found && found.url) {
          return found.url;
        }
      } catch (e) {}
    }
    return navyRaincoatImg;
  });
  const [liveVideosList, setLiveVideosList] = useState<any[]>(() => {
    const cached = localStorage.getItem('raincoat_media_gallery_fallback') || localStorage.getItem('raincoat_media_gallery');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const filteredVideos = parsed.filter((item: any) => String(item.id).startsWith('live-video-'));
        if (filteredVideos && filteredVideos.length > 0) {
          return filteredVideos;
        }
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
  const [customPages, setCustomPages] = useState<any[]>([]);

  const [thankYouOrder, setThankYouOrder] = useState<RaincoatOrder | null>(null);
  const [thankYouLoading, setThankYouLoading] = useState(true);
  const [thankYouError, setThankYouError] = useState<string | null>(null);

  const isThankYouRoute = currentPath.startsWith('/thankyou-') || currentHash.startsWith('#/thankyou-') || currentHash.startsWith('#thankyou-');

  useEffect(() => {
    if (isThankYouRoute) {
      const urlParams = new URLSearchParams(window.location.search);
      let orderId = urlParams.get('id');
      
      if (!orderId) {
        const hashMatch = currentHash.match(/[?&]id=([^&]+)/);
        if (hashMatch) {
          orderId = hashMatch[1];
        } else {
          const parts = currentPath.split('/');
          const lastPart = parts[parts.length - 1];
          if (lastPart && lastPart.startsWith('ord-')) {
            orderId = lastPart;
          } else {
            const hashParts = currentHash.split('/');
            const lastHashPart = hashParts[hashParts.length - 1];
            if (lastHashPart && lastHashPart.startsWith('ord-')) {
              orderId = lastHashPart;
            }
          }
        }
      }

      if (orderId) {
        setThankYouLoading(true);
        getOrderByIdFromFirestore(orderId)
          .then((order) => {
            if (order) {
              setThankYouOrder(order);
              setThankYouError(null);
              // Clean up the temporary receipt key from browser localStorage after successful display
              try {
                window.localStorage.removeItem('temp_receipt_' + order.id);
              } catch (_) {}
            } else {
              setThankYouError('দুঃখিত, এই রেফারেন্স নম্বরের কোনো অর্ডার ডাটাবেজে খুঁজে পাওয়া যায়নি। অনুগ্রহ করে সঠিক রেফারেন্স দিয়ে ট্র্যাকিং করুন।');
            }
            setThankYouLoading(false);
          })
          .catch((err) => {
            console.error(err);
            setThankYouError('অর্ডার লোড করতে সমস্যা হয়েছে। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।');
            setThankYouLoading(false);
          });
      } else {
        setThankYouError('অর্ডার রেফারেন্স আইডি পাওয়া যায়নি! অনুগ্রহ করে সঠিক লিঙ্ক দিয়ে পুনরায় চেষ্টা করুন।');
        setThankYouLoading(false);
      }
    }
  }, [isThankYouRoute, currentPath, currentHash]);

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

  // Real-time live active visitor session tracking (With Advanced Analytics engine)
  useEffect(() => {
    let sessId = sessionStorage.getItem('raincoat_visitor_session_id');
    if (!sessId) {
      sessId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('raincoat_visitor_session_id', sessId);
    }
    const sessionId = sessId;

    // Detect browser, operating system and detailed device brand models
    const getAdvancedDeviceStats = () => {
      const ua = navigator.userAgent;
      let browser = "Other";
      let os = "Other";
      let deviceModel = "Desktop PC";
      
      if (ua.indexOf("Firefox") > -1) browser = "Firefox";
      else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browser = "Opera";
      else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) browser = "Edge";
      else if (ua.indexOf("Chrome") > -1) browser = "Chrome";
      else if (ua.indexOf("Safari") > -1 && ua.indexOf("Chrome") === -1) browser = "Safari";
      
      if (ua.indexOf("Windows") > -1) os = "Windows";
      else if (ua.indexOf("Macintosh") > -1) os = "macOS";
      else if (ua.indexOf("Android") > -1) os = "Android";
      else if (ua.indexOf("iPhone") > -1) os = "iOS";
      else if (ua.indexOf("iPad") > -1) os = "iPadOS";
      else if (ua.indexOf("Linux") > -1) os = "Linux";

      // Device Model detection
      if (/iphone/i.test(ua)) {
        const dpr = window.devicePixelRatio || 1;
        const width = window.screen.width * dpr;
        const height = window.screen.height * dpr;
        if (width === 1179 && height === 2556) deviceModel = "iPhone 14 Pro / 15";
        else if (width === 1290 && height === 2796) deviceModel = "iPhone 14 Pro Max / 15 PM";
        else if (width === 1170 && height === 2532) deviceModel = "iPhone 12 / 13 / 14";
        else if (width === 1284 && height === 2778) deviceModel = "iPhone 12 / 13 Pro Max";
        else if (width === 1125 && height === 2436) deviceModel = "iPhone X / XS / 11 Pro";
        else if (width === 828 && height === 1792) deviceModel = "iPhone XR / 11";
        else if (width === 1242 && height === 2688) deviceModel = "iPhone XS Max";
        else if (width === 750 && height === 1334) deviceModel = "iPhone 7 / 8 / SE";
        else deviceModel = "Apple iPhone";
      } else if (/ipad/i.test(ua)) {
        deviceModel = "Apple iPad";
      } else if (/samsung|sm-/i.test(ua)) {
        const match = ua.match(/sm-([a-z0-9]+)/i);
        deviceModel = match ? `Samsung Galaxy (${match[1].toUpperCase()})` : "Samsung Phone";
      } else if (/redmi|xiaomi|mi /i.test(ua)) {
        const match = ua.match(/(?:redmi|mi)\s*([a-z0-9 ]+)/i);
        deviceModel = match ? `Xiaomi ${match[1].trim()}` : "Xiaomi Phone";
      } else if (/oppo/i.test(ua)) {
        deviceModel = "OPPO Mobile";
      } else if (/vivo/i.test(ua)) {
        deviceModel = "Vivo Mobile";
      } else if (/realme/i.test(ua)) {
        deviceModel = "Realme Mobile";
      } else if (/oneplus/i.test(ua)) {
        deviceModel = "OnePlus Mobile";
      } else if (/pixel/i.test(ua)) {
        deviceModel = "Google Pixel";
      } else if (/huawei/i.test(ua)) {
        deviceModel = "Huawei Mobile";
      } else if (/macintosh/i.test(ua)) {
        deviceModel = "MacBook / iMac";
      } else if (/windows/i.test(ua)) {
        deviceModel = "Windows Computer";
      } else if (/linux/i.test(ua)) {
        deviceModel = "Linux Workstation";
      } else if (/mobile/i.test(ua)) {
        deviceModel = "Android Mobile Phone";
      }

      // GPU Graphic Card / CPU chipset analysis
      let gpu = "Generic Graphic Card";
      try {
        const canvas = document.createElement('canvas');
        const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as any;
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || gpu;
          }
        }
      } catch (_) {}

      // Network effective connection details
      let networkType = "Regular WiFi/Mobile";
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn && conn.effectiveType) {
        networkType = `${conn.effectiveType.toUpperCase()} Port`;
      }

      // Screen Resolution info
      const screenResolution = `${window.screen.width}x${window.screen.height} (${window.devicePixelRatio ? window.devicePixelRatio : 1}x)`;

      // Browser locale / language
      const language = navigator.language || 'en-US';

      // Advanced Referrer Tracking
      let referrer = 'Direct / Bookmark Link';
      const ref = document.referrer;
      if (ref) {
        if (ref.indexOf('facebook.com') > -1 || ref.indexOf('fb.me') > -1) referrer = 'Facebook Ads Traffic';
        else if (ref.indexOf('instagram.com') > -1) referrer = 'Instagram Link';
        else if (ref.indexOf('tiktok.com') > -1) referrer = 'TikTok Ads Traffic';
        else if (ref.indexOf('google.com') > -1) referrer = 'Google Search Traffic';
        else {
          try {
            referrer = new URL(ref).hostname;
          } catch (_) {
            referrer = 'External Link Referrer';
          }
        }
      }

      return { browser, os, deviceModel, gpu, networkType, screenResolution, language, referrer };
    };

    const resolveLocation = async (): Promise<{ city: string; country: string; countryCode: string }> => {
      try {
        const res = await fetch('https://ipapi.co/json/', { 
          signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(3000) : undefined 
        });
        if (res.ok) {
          const data = await res.json();
          if (data.city && data.country_name) {
            return {
              city: data.city,
              country: data.country_name,
              countryCode: data.country_code || 'BD'
            };
          }
        }
      } catch (error) {
        console.warn("Geo IP lookup skipped or blocked. Using default BD locations.", error);
      }
      
      const bdCities = [
        "Mirpur (Dhaka)", "Uttara (Dhaka)", "Chittagong", "Sylhet", "Gazipur", "Narayanganj", "Cumilla", 
        "Khulna", "Rajshahi", "Rangpur", "Barishal", "Mymensingh", "Feni", "Jessore", "Bogra", "Cox's Bazar"
      ];
      // Select pseudo-deterministically
      const index = sessionId.length % bdCities.length;
      return {
        city: bdCities[index],
        country: "Bangladesh",
        countryCode: "BD"
      };
    };

    let isSubscribed = true;
    let heartbeatInterval: any = null;
    const actionsHistory: string[] = ['ভিজিট শুরু করেছেন'];

    const getPageName = () => {
      const pageMap: { [key: string]: string } = {
        'admin': 'এডমিন প্যানেল',
        '/admin': 'এডমিন প্যানেল',
        'track-order': 'অর্ডার ট্র্যাকিং পেইজ',
        '/track-order': 'অর্ডার ট্র্যাকিং পেইজ',
        'shop': 'শপ পেইজ (সব প্রোডাক্ট)',
        '/shop': 'শপ পেইজ (সব প্রোডাক্ট)',
        'bikecover': 'বাইক কভার ল্যান্ডিং পেইজ',
        '/bikecover': 'বাইক কভার ল্যান্ডিং পেইজ',
        'raincoat': 'রেইনকোট ল্যান্ডিং পেইজ (হোম)',
        '/raincoat': 'রেইনকোট ল্যান্ডিং পেইজ (হোম)'
      };
      const hash = window.location.hash.replace(/^#\//, '').replace(/^#/, '');
      if (hash) {
        if (pageMap[hash]) return pageMap[hash];
        return `কাস্টম ল্যান্ডিং পেজ: #${hash}`;
      }
      const path = window.location.pathname.replace(/^\//, '');
      if (path && pageMap[path]) {
        return pageMap[path];
      }
      return 'রেইনকোট ল্যান্ডিং পেইজ (হোম)';
    };

    const runHeartbeat = async () => {
      if (!isSubscribed) return;
      const stats = getAdvancedDeviceStats();
      const loc = await resolveLocation();
      
      const sessionData: ActiveSession = {
        id: sessionId,
        city: loc.city,
        country: loc.country,
        countryCode: loc.countryCode,
        page: getPageName(),
        browser: stats.browser,
        os: stats.os,
        deviceModel: stats.deviceModel,
        screenResolution: stats.screenResolution,
        language: stats.language,
        referrer: stats.referrer,
        gpu: stats.gpu,
        networkType: stats.networkType,
        lastAction: actionsHistory[actionsHistory.length - 1],
        actionsHistory: [...actionsHistory],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveActiveSessionToFirestore(sessionData);
    };

    // Track click dynamics natively
    const handleClickTracker = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      let actionText = '';
      if (target.tagName === 'BUTTON') {
        actionText = `বাটন ক্লিক: ${target.innerText.trim() || target.title || 'Unknown'}`;
      } else if (target.closest('button')) {
        const btn = target.closest('button');
        actionText = `বাটন ক্লিক: ${btn?.innerText.trim() || btn?.title || 'Unknown'}`;
      } else if (target.tagName === 'A') {
        actionText = `লিংক ক্লিক: ${target.innerText.trim() || (target as HTMLAnchorElement).href}`;
      } else if (target.closest('a')) {
        const link = target.closest('a');
        actionText = `লিংক ক্লিক: ${link?.innerText.trim() || link?.href}`;
      } else if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'radio') {
        const label = target.parentElement?.innerText?.trim();
        actionText = `অপশন সিলেক্ট: ${label || (target as HTMLInputElement).value}`;
      } else if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
        const label = target.parentElement?.innerText?.trim();
        actionText = `টিক মার্ক: ${label || 'Checkbox'}`;
      }

      if (actionText && actionText.length < 55) {
        if (actionsHistory[actionsHistory.length - 1] !== actionText) {
          actionsHistory.push(actionText);
          if (actionsHistory.length > 8) {
            actionsHistory.shift();
          }
          // Immediate sync for live action feedback!
          runHeartbeat();
        }
      }
    };

    document.addEventListener('click', handleClickTracker);

    // Run initial & schedule heartbeats
    runHeartbeat();
    heartbeatInterval = setInterval(runHeartbeat, 30000); // 30 seconds heartbeat for extremely tight latency

    return () => {
      isSubscribed = false;
      document.removeEventListener('click', handleClickTracker);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [currentHash, currentPath]);

  // Generate rain drops positions
  const [rainDrops, setRainDrops] = useState<{ left: string; delay: string; duration: string }[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      const checkoutEl = document.getElementById('checkout-form');
      if (!checkoutEl) return;
      
      const rect = checkoutEl.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      setIsCheckoutVisible(isVisible);
      
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const checkoutTop = rect.top + scrollTop;
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
    setOrdersCount(0);

    // Auto-setup and save Meta Pixel and Conversion API settings from user's request
    const requestedPixelId = '1145959524284032';
    const requestedToken = 'EAAMY12ZCBQswBRQAXx2MDdDRSTZAgopaWP81nWqY8JYsRnOZAQOn7Nk6L6ZAKk61oFi278KPubqXpZBurmTGi5e8jWjF8Jp7bOhw5meOfl9C7Nn5PXJLs4xYtxSbAnUoAJdKmOwZA6MZCEXqvlnPqo3qZCToLgydC5EvEUZA7uawlJq5LT2AfpKkIEDuMJZCI9ngZDZD';
    
    if (localStorage.getItem('fb_pixel_id') !== requestedPixelId || localStorage.getItem('fb_capi_token') !== requestedToken) {
      localStorage.setItem('fb_pixel_id', requestedPixelId);
      localStorage.setItem('fb_pixel_enabled', 'true');
      localStorage.setItem('fb_capi_enabled', 'true');
      localStorage.setItem('fb_capi_token', requestedToken);
      window.dispatchEvent(new Event('raincoat_pixel_config_updated'));
      
      import('./lib/firebase').then(({ getIntegrationsSettingsFromFirestore, saveIntegrationsSettingsToFirestore }) => {
        getIntegrationsSettingsFromFirestore().then((existing) => {
          const updated = {
            ...existing,
            fb_pixel_id: requestedPixelId,
            fb_pixel_enabled: true,
            fb_capi_enabled: true,
            fb_capi_token: requestedToken
          };
          saveIntegrationsSettingsToFirestore(updated).then(() => {
            console.log("Successfully auto-configured Meta Pixel & CAPI Settings in Firestore.");
          }).catch(e => console.warn(e));
        }).catch(() => {});
      }).catch(() => {});
    }

    // Sync count asynchronously from Firestore database
    import('./lib/firebase').then(({ getOrdersFromFirestore, getMediaFromFirestore, getPagesFromFirestore }) => {
      getOrdersFromFirestore().then((fbOrders) => {
        if (fbOrders) {
          setOrdersCount(fbOrders.length);
        }
      }).catch((err) => {
        console.warn("Could not sync orders count on startup:", err);
      });

      // Synchronize custom pages from Firestore to survive updates
      getPagesFromFirestore().then((fbPages) => {
        if (fbPages && fbPages.length > 0) {
          setCustomPages(fbPages);
        }
      }).catch((err) => {
        console.warn("Could not sync custom pages on startup:", err);
      });

      // Synchronize custom bundle offer image from Firestore
      getMediaFromFirestore().then((media) => {
        const found = media.find(item => item.id === 'bundle-offer-image');
        if (found && found.url) {
          setBundleOfferImage(found.url);
        }

        // Sync live videos
        const filteredVideos = media.filter(item => String(item.id).startsWith('live-video-'));
        if (filteredVideos && filteredVideos.length > 0) {
          setLiveVideosList(filteredVideos);
        }
      }).catch((err) => {
        console.warn("Could not sync custom configurations:", err);
      });
    }).catch(() => {});

    const handleBundleImageUpdate = (e: any) => {
      if (e.detail && e.detail.url) {
        setBundleOfferImage(e.detail.url);
      }
    };
    const handlePagesUpdate = (e: any) => {
      if (e.detail && e.detail.pages) {
        setCustomPages(e.detail.pages);
      }
    };
    const handleLiveVideosUpdate = (e: any) => {
      if (e.detail && e.detail.videos) {
        setLiveVideosList(e.detail.videos);
      }
    };
    window.addEventListener('raincoat_bundle_image_updated', handleBundleImageUpdate);
    window.addEventListener('raincoat_pages_updated', handlePagesUpdate);
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
        window.removeEventListener('raincoat_pages_updated', handlePagesUpdate);
       document.body.removeChild(fbScript);
       window.removeEventListener('raincoat_bundle_image_updated', handleBundleImageUpdate);
       window.removeEventListener('raincoat_live_videos_updated', handleLiveVideosUpdate);
     };
  }, []);

  // Inject third-party custom code snippets (Header & Footer slugs) dynamically
  useEffect(() => {
    import('./lib/firebase').then(({ getAdvancedAddonsSettingsFromFirestore }) => {
      getAdvancedAddonsSettingsFromFirestore().then((settings) => {
        if (settings) {
          // 1. Header snippet
          const headerSnippet = settings.header_snippets || '';
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
          const footerSnippet = settings.footer_snippets || '';
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
        }
      }).catch(() => {});
    }).catch(() => {});

    return () => {
      document.querySelectorAll('[data-injected]').forEach(el => el.remove());
    };
  }, []);

  // Inject Google Analytics, Facebook Pixel & TikTok Pixel tags dynamically
  useEffect(() => {
    // Initial run
    initMetaPixel();
    initTikTokPixel();

    const gaId = 'G-DPGQ1TX74Z';
    
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
      document.querySelectorAll('[data-injected-api="tiktok-pixel-lib"]').forEach(el => el.remove());
      initMetaPixel();
      initTikTokPixel();
    };

    window.addEventListener('raincoat_pixel_config_updated', handlePixelUpdate);

    return () => {
      document.querySelectorAll('[data-injected-api]').forEach(el => el.remove());
      window.removeEventListener('raincoat_pixel_config_updated', handlePixelUpdate);
    };
  }, []);

  const refreshOrdersCount = React.useCallback(() => {
    import('./lib/firebase').then(({ getOrdersFromFirestore }) => {
      getOrdersFromFirestore().then((fbOrders) => {
        if (fbOrders) {
          setOrdersCount(fbOrders.length);
        }
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  const handleOrderCreated = (order: RaincoatOrder) => {
    setOrdersCount(prev => prev + 1);
    setRecentOrderForToast(order); // Trigger immediate success toast feedback!

    // Determine product slug for the redirection mapping
    let pSlug = 'raincoat';
    if (order.bikeModel) {
      pSlug = 'bikecover';
    } else {
      const savedSlug = localStorage.getItem('last_ordered_product_slug');
      if (savedSlug) {
        pSlug = savedSlug;
      }
    }

    // Save temporary receipt info in localStorage for instant and robust loading on the new tab without Firestore write race condition
    try {
      window.localStorage.setItem('temp_receipt_' + order.id, JSON.stringify(order));
    } catch (_) {}

    // Open thank-you confirmation page in a new tab
    const thankYouUrl = `/thankyou-${pSlug}?id=${order.id}`;
    try {
      window.open(thankYouUrl, '_blank');
    } catch (e) {
      console.warn("Failed to open thank you page in a new tab (possibly blocked by popup blocker):", e);
    }

    // Keep the inline success state fallback intact so that everything still functions seamlessly if popup is blocked
    setSubmittedOrder(order);

    // Save order details directly to Firestore
    addOrderToFirestore(order)
      .then(() => {
        console.log('Successfully saved order details directly to Firestore database!');
      })
      .catch((err) => {
        console.warn('Failed to save order to Firestore (possible quota limit or auth check):', err);
      });

    // Auto Trigger automated WhatsApp message confirmation immediately after order placement
    import('./lib/whatsapp').then(({ triggerAutomatedWhatsApp }) => {
      triggerAutomatedWhatsApp(order)
        .then((res) => {
          if (res.success) {
            console.log(`Automated WhatsApp confirmation message triggered successfully!`);
          } else {
            console.log(`Automated WhatsApp trigger resolved: ${res.message}`);
          }
        })
        .catch((err) => {
          console.warn('Error in WhatsApp trigger flow background runner:', err);
        });
    }).catch((err) => {
      console.warn('Error importing WhatsApp automation module asynchronously:', err);
    });

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
  const isAgentPanelRoute = currentPath === '/agtele' || currentHash === '#/agtele' || currentHash === '#agtele';
  const isTrackOrderRoute = currentPath === '/track-order' || currentHash === '#/track-order' || currentHash === '#track-order';
  const isOrderHistoryRoute = currentPath === '/order-history' || currentHash === '#/order-history' || currentHash === '#order-history';
  const isShopRoute = currentPath === '/shop' || currentHash === '#/shop' || currentHash === '#shop';
  const isWriteReviewRoute = currentPath === '/write-review' || currentHash === '#/write-review' || currentHash === '#write-review';
  const isRaincoatLandingRoute = currentPath === '/raincoat' || currentHash === '#/raincoat' || currentHash === '#raincoat';
  const isBikeCoverLandingRoute = currentPath === '/bikecover' || currentHash === '#/bikecover' || currentHash === '#bikecover';
  const isCartRoute = currentPath === '/cart' || currentHash === '#/cart' || currentHash === '#cart';
  const isProductRoute = currentPath.startsWith('/product/') || currentHash.startsWith('#/product/');

  let productSlug = '';
  if (currentPath.startsWith('/product/')) {
    productSlug = currentPath.split('/product/')[1] || '';
  } else if (currentHash.startsWith('#/product/')) {
    productSlug = currentHash.split('#/product/')[1] || '';
  }
  productSlug = productSlug.split('?')[0];

  // Check if hash matches a custom page slug from custom landing pages collection
  let activeCustomPage = null;
  try {
    const cleanHash = currentHash.replace(/^#\//, '').replace(/^#/, '');
    if (cleanHash && cleanHash !== 'home' && cleanHash !== 'features' && cleanHash !== 'live-video' && cleanHash !== 'comparison' && cleanHash !== 'bundle-offer' && cleanHash !== 'delivery-timeline' && cleanHash !== 'size-chart' && cleanHash !== 'checkout-form' && cleanHash !== 'track-order' && cleanHash !== 'order-history' && cleanHash !== 'write-review' && cleanHash !== 'agtele') {
      activeCustomPage = customPages.find((p: any) => p.slug === cleanHash);
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

  // Handle direct Calling Agent Panel routing
  if (isAgentPanelRoute) {
    return (
      <CallingAgentPanel 
        onClose={() => {
          if (currentPath === '/agtele') {
            window.history.pushState(null, '', '/');
            window.dispatchEvent(new Event('popstate'));
          } else {
            window.location.hash = '';
          }
        }}
      />
    );
  }

  // Handle Dynamic Thank You / Order Confirmation Pages in a New Tab
  if (isThankYouRoute) {
    return (
      <div className="min-h-screen bg-slate-50 relative selection:bg-blue-600 selection:text-white py-12 px-4 flex flex-col items-center justify-center font-sans animate-fadeIn">
        <div className="w-full max-w-4xl">
          {thankYouLoading ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-xl border border-slate-100 max-w-lg mx-auto flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-600 font-bold text-lg">আপনার অর্ডার রিসিপ্ট লোড করা হচ্ছে...</p>
              <p className="text-slate-400 text-sm font-medium">অনুগ্রহ করে একটু অপেক্ষা করুন</p>
            </div>
          ) : thankYouError ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-md max-w-md mx-auto border border-red-100 animate-fadeIn">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">⚠️</div>
              <h2 className="text-xl font-black text-slate-800 mb-2">সমস্যা দেখা দিয়েছে</h2>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">{thankYouError}</p>
              <button 
                onClick={() => { window.location.pathname = '/'; }} 
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-lg transition text-xs cursor-pointer"
              >
                প্রধান পেইজে যান
              </button>
            </div>
          ) : thankYouOrder ? (
            <Receipt order={thankYouOrder} onClose={() => { window.location.pathname = '/'; }} />
          ) : null}
        </div>
      </div>
    );
  }

  // Handle global Customer Order Confirmation Receipt View
  if (submittedOrder) {
    return (
      <div className="min-h-screen bg-slate-50 relative selection:bg-blue-600 selection:text-white py-12 px-4 flex items-center justify-center font-sans">
        <div className="w-full max-w-4xl">
          <Receipt order={submittedOrder} onClose={handleBackToShopping} />
        </div>
      </div>
    );
  }

  // Handle Track Order routing (Separate Tab/Page View)
  if (isTrackOrderRoute) {
    return (
      <div className="min-h-screen bg-slate-50 relative selection:bg-blue-600 selection:text-white flex flex-col justify-between font-sans">
        {/* Urgent Alert Strip */}
        <div className="bg-gradient-to-r from-orange-600 via-rose-500 to-blue-900 text-white text-xs sm:text-sm font-bold text-center py-2 px-4 shadow-sm flex items-center justify-center gap-2 relative z-40 font-sans">
          <span>🌧️ বর্ষা ধামাকা ২০% ছাড়!  ডেলিভারি চার্জ সম্পূর্ণ ফ্রি! 🌧️</span>
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
          <div className="w-full">
            <OrderTracker />
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

  // Handle Order History routing (Separate Tab/Page View)
  if (isOrderHistoryRoute) {
    return (
      <div className="min-h-screen bg-slate-50 relative selection:bg-blue-600 selection:text-white flex flex-col justify-between font-sans">
        {/* Urgent Alert Strip */}
        <div className="bg-gradient-to-r from-orange-600 via-rose-500 to-blue-900 text-white text-xs sm:text-sm font-bold text-center py-2 px-4 shadow-sm flex items-center justify-center gap-2 relative z-40 font-sans">
          <span>🌧️ বর্ষা ধামাকা ২০% ছাড়! ডেলিভারি চার্জ সম্পূর্ণ ফ্রি! 🌧️</span>
          <button 
            onClick={() => {
              if (currentPath === '/order-history') {
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
                window.location.hash = '#/track-order';
              }}
              className="flex items-center gap-1.5 text-slate-700 hover:text-slate-950 font-bold text-xs cursor-pointer hover:underline"
            >
              ⬅ অর্ডার ট্র্যাকার পেইজে যান
            </button>
            <span className="text-[11px] font-bold text-slate-400 font-mono">Premium Raincoat Shop BD</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 py-10 px-4 max-w-3xl mx-auto w-full flex flex-col justify-center gap-6">
          <div className="w-full">
            <OrderHistory />
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

  // Handle Write Review routing (Separate Tab/Page View)
  if (isWriteReviewRoute) {
    return (
      <div className="min-h-screen bg-slate-50 relative selection:bg-emerald-600 selection:text-white flex flex-col justify-between font-sans">
        {/* Urgent Alert Strip */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-900 text-white text-xs sm:text-sm font-bold text-center py-2 px-4 shadow-sm flex items-center justify-center gap-2 relative z-40 font-sans">
          <span>🌧️ বর্ষা ধামাকা ২০% ছাড়!  ডেলিভারি চার্জ সম্পূর্ণ ফ্রি! 🌧️</span>
          <button 
            onClick={() => {
              if (currentPath === '/write-review') {
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
        <div className="bg-white border-b border-slate-200 py-3 px-4 shadow-xs">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button
              onClick={() => {
                if (currentPath === '/write-review') {
                  window.history.pushState(null, '', '/');
                  window.dispatchEvent(new Event('popstate'));
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
          <div className="w-full">
            <ReviewSubmissionForm 
              onBack={() => {
                if (currentPath === '/write-review') {
                  window.history.pushState(null, '', '/');
                  window.dispatchEvent(new Event('popstate'));
                } else {
                  window.location.hash = '';
                }
              }} 
            />
          </div>
        </div>

        {/* Secure Trust Footer */}
        <div className="bg-slate-950 text-slate-400 text-center py-6 border-t border-slate-800 text-xs">
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

  // Handle Standalone Cart Page Routing
  if (isCartRoute) {
    return (
      <CartPage onOrderSuccess={handleOrderCreated} />
    );
  }

  // Handle Standalone Product Details Page Routing
  if (isProductRoute) {
    return (
      <ProductDetailsView productSlug={productSlug} />
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

  // Design Customizer helpers for real-time section layout and text customizations
  const getSectionData = (sectionKey: string) => {
    const customizations = siteSettings?.section_customizations || {};
    const defaultData: Record<string, any> = {
      raincoat_hero: {
        bgColor: '#0f172a',
        textColor: '#ffffff',
        textAlign: 'left',
        fontSize: 'default',
        image_url: '',
        icon_text: '১০০% প্রিমিয়াম ওয়াটারপ্রুফ গিয়ার',
        title_1: 'ঝুম বৃষ্টি কিংবা ঝড়ো হাওয়া—',
        title_2: 'বাইরে বের হতে আর কোনো ভয় নেই!',
        body: 'আমরা নিয়ে এলাম সম্পূর্ণ থার্মাল হিট সিল প্রযুক্তির প্রিমিয়াম কোয়ালিটির রেইনকোট জ্যাকেট ও প্যান্টের এক দুর্দান্ত কম্বো! কোনো বাইরের সেলাই নেই, ফলে এক ফোটা পানিও কাপড়ে ঢোকার সুযোগ নেই।',
        visible_mobile: true,
        visible_desktop: true,
        padding_vertical: 'normal'
      },
      raincoat_live_video: {
        bgColor: '#ffffff',
        textColor: '#1e293b',
        textAlign: 'center',
        fontSize: 'default',
        image_url: '',
        icon_text: 'হান্ড্রেড পার্সেন্ট রিয়েল লাইভ টেস্ট',
        title_1: 'আমাদের রেইনকোটের লাইভ ওয়াটারপ্রুফ টেস্ট ভিডিও!',
        title_2: 'বিশ্বাস না হলে সরাসরি ভিডিওতে দেখে নিন পানির উপর কেমন প্রতিরোধ গড়ে তোলে।',
        body: 'কোনো গিমিক বা এডিট ছাড়াই শতভাগ বাস্তব উপায়ে রেইনকোটটির গুণগত মান ও ফিনিশিং এই ছোট রিভিও ক্লিপে তুলে ধরা হয়েছে।',
        visible_mobile: true,
        visible_desktop: true,
        padding_vertical: 'normal'
      },
      raincoat_features: {
        bgColor: '#f8fafc',
        textColor: '#0f172a',
        textAlign: 'center',
        fontSize: 'default',
        image_url: '',
        icon_text: 'কেন আমাদের অল-সিজন রেইনকোটটি সেরা?',
        title_1: 'কেন আমাদের অল-সিজন রেইনকোটটি সেরা?',
        title_2: 'যেকোনো বাইকার এবং পথচারীদের জন্য শতভাগ নিরাপদ বৃষ্টির সুরক্ষাকবচ।',
        body: 'আমাদের রেইনকোটে ব্যবহৃত প্রতিটি পার্ট অত্যন্ত নিখুঁত ও মজবুত কাঁচামাল দিয়ে তৈরি। দীর্ঘ ৩ সিজন অনায়াসে এটি আপনার সাথী হবে।',
        visible_mobile: true,
        visible_desktop: true,
        padding_vertical: 'normal'
      },
      raincoat_comparison: {
        bgColor: '#ffffff',
        textColor: '#1e293b',
        textAlign: 'center',
        fontSize: 'default',
        image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
        icon_text: 'তুলনামূলক পার্থক্য (Raincoat Difference)',
        title_1: 'বাজারের সাধারণ রেইনকোট বনাম আমাদের প্রিমিয়াম রেইনকোট',
        title_2: 'একবার প্রিমিয়াম ফিটিংস ব্যবহারের স্বাদ নিন, সাধারণ প্লাস্টিকের অস্বস্তি থেকে মুক্তি পান।',
        body: 'বাজারে কমদামী রেইনকোটে সেলাইয়ের ছিদ্র দিয়ে কড়া বর্ষায় পানি চুয়ে আপনার ভেতরের মোবাইল-মানিব্যাগ ভিজিয়ে দেয়, অন্যদিকে আমাদের থার্মাল-সিল শতভাগ অভেদ্য।',
        visible_mobile: true,
        visible_desktop: true,
        padding_vertical: 'normal'
      },
      raincoat_bundle: {
        bgColor: '#090d16',
        textColor: '#ffffff',
        textAlign: 'center',
        fontSize: 'default',
        image_url: '',
        icon_text: 'বিশেষ বর্ষাকালীন অফার (Special Bundle Price)',
        title_1: 'সীমাবদ্ধ সময়ের বিশেষ বান্ডেল ধামাকা অফার!',
        title_2: 'ডাবল কোটেড ফ্যাব্রিকেশনের রেইনকোট জ্যাকেট + প্যান্ট + প্রিমিয়াম ড্যাফোডিল পকেট ব্যাগ!',
        body: 'আজই বুক করুন অবিশ্বাস্য কম্বো অফারে। আমরা কোনো অগ্রিম ডেলিভারি চার্জ ছাড়া সারা বাংলাদেশে হোম ডেলিভারি দিচ্ছি। পণ্য হাতে পেয়ে দেখে তারপর পরিশোধ করুন।',
        visible_mobile: true,
        visible_desktop: true,
        padding_vertical: 'generous'
      }
    };

    const result = {
      ...(defaultData[sectionKey] || {
        bgColor: '',
        textColor: '',
        textAlign: 'center',
        fontSize: 'default',
        image_url: '',
        icon_text: '',
        title_1: '',
        title_2: '',
        body: '',
        visible_mobile: true,
        visible_desktop: true,
        padding_vertical: 'normal'
      }),
      ...(customizations[sectionKey] || {})
    };

    if (sectionKey === 'raincoat_live_video') {
      if (
        result.title_1 === 'আমাদের রেইনকোটের জীবন্ত ওয়াটারপ্রুফ টেস্ট ভিডিও!' ||
        result.title_1 === 'हमारे রেইনকোটের জীবন্ত ওয়াটারপ্রুফ টেস্ট ভিডিও!'
      ) {
        result.title_1 = 'আমাদের রেইনকোটের লাইভ ওয়াটারপ্রুফ টেস্ট ভিডিও!';
      }
      if (result.title_2 && result.title_2.trim() === 'do not edit this directly click below') {
        result.title_2 = '';
      }
    }

    return result;
  };

  const getAlignClass = (align: 'left' | 'center' | 'right') => {
    if (align === 'center') return 'text-center items-center lg:items-center lg:text-center';
    if (align === 'right') return 'text-right items-end lg:items-end lg:text-right';
    return 'text-left items-start lg:items-start lg:text-left';
  };

  const getVisibilityClass = (visMobile: boolean, visDesktop: boolean) => {
    if (!visMobile && !visDesktop) return 'hidden';
    if (!visMobile) return 'hidden md:block';
    if (!visDesktop) return 'block md:hidden';
    return 'block';
  };

  const getFontSizeClass = (sz: string, defaultClass: string) => {
    if (sz === 'sm') return 'text-xs sm:text-sm';
    if (sz === 'md') return 'text-sm sm:text-base';
    if (sz === 'lg') return 'text-base sm:text-lg md:text-xl';
    if (sz === 'xl') return 'text-lg sm:text-2xl';
    if (sz === '2xl') return 'text-xl sm:text-3xl md:text-4xl';
    return defaultClass;
  };

  const getPaddingClass = (padding?: 'compact' | 'normal' | 'generous') => {
    if (padding === 'compact') return 'py-4 sm:py-6';
    if (padding === 'generous') return 'py-14 sm:py-20';
    return 'py-8 sm:py-12';
  };

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
        <button
          onClick={() => window.open('#/order-history', '_blank')}
          className="underline hover:text-amber-200 text-amber-100 transition font-extrabold cursor-pointer hidden sm:inline-block ml-4"
        >
          📊 কাস্টমার অর্ডার হিস্টোরি
        </button>
      </div>

      {/* Elegant Header / Hero Section with animated rain backdrop */}
      {(() => {
        const raincoatHero = getSectionData('raincoat_hero');
        return (
          <header 
            className={`relative text-white overflow-hidden border-b border-slate-800 ${getVisibilityClass(raincoatHero.visible_mobile, raincoatHero.visible_desktop)} ${getPaddingClass(raincoatHero.padding_vertical)}`} 
            style={{ backgroundColor: raincoatHero.bgColor }}
            id="home"
          >
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
                  {raincoatHero.image_url ? (
                    <img src={raincoatHero.image_url} alt="Raincoat Premium banner" className="w-full rounded-2xl shadow-xl object-contain max-h-[380px] bg-slate-950/40 p-2 border border-slate-800" referrerPolicy="no-referrer" loading="lazy" />
                  ) : (
                    <ProductCarousel />
                  )}
                  
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
                <div className={`lg:col-span-7 space-y-6 flex flex-col ${getAlignClass(raincoatHero.textAlign)} lg:order-first`}>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-550/10 text-orange-400 text-xs font-bold rounded-full border border-orange-500/20 uppercase tracking-widest font-sans">
                    <CloudRain className="h-4 w-4 animate-bounce text-orange-400" /> {raincoatHero.icon_text}
                  </div>
                  
                  <h1 className={`font-black text-white leading-tight font-sans ${getFontSizeClass(raincoatHero.fontSize, "text-3xl sm:text-4xl md:text-5xl")}`}>
                    {raincoatHero.title_1} <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-200 to-white block mt-2">
                      {raincoatHero.title_2}
                    </span>
                  </h1>
                  
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-sans">
                    {raincoatHero.body}
                  </p>

                  {/* Dynamic offer bubble */}
                  <div className="bg-slate-800/80 backdrop-blur-xs p-4 rounded-2xl border border-slate-700/80 max-w-md w-full grid grid-cols-2 gap-4">
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
                  <div className="flex flex-wrap gap-x-6 gap-y-2.5 pt-2 text-slate-300 text-xs font-semibold">
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
                  <div className="flex flex-col sm:flex-row gap-4 w-full pt-3">
                    <button
                      onClick={() => scrollToSection('checkout-form')}
                      className="px-8 py-4 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-black text-sm sm:text-base rounded-2xl transition duration-300 shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer animate-pulse-subtle font-sans"
                      id="hero-order-now"
                    >
                      <ShoppingBag className="h-5 w-5" /> অর্ডার ফরম এ চলে যান (COD)
                    </button>
                    <button
                      onClick={() => scrollToSection('sizing-tool')}
                      className="px-6 py-4 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 font-bold text-sm sm:text-base rounded-2xl transition duration-300 flex items-center justify-center gap-1 cursor-pointer font-sans"
                    >
                      সাইজ ক্যালকুলেটর <ChevronRight className="h-5 w-5 text-slate-400" />
                    </button>
                  </div>

                  {/* Trust Badges in Bengali */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-4 mt-1 border-t border-slate-800/60 font-sans w-full">
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
        );
      })()}

      {/* Prominent Embedded Video Section */}
      {(() => {
        const raincoatLiveVideo = getSectionData('raincoat_live_video');
        const customVideosList = (raincoatLiveVideo.video_url && raincoatLiveVideo.video_url !== 'https://www.youtube.com/watch?v=dQw4w9WgXcQ') 
          ? [{ id: 'custom-video-1', title: raincoatLiveVideo.icon_text || 'Premium Custom Video', url: raincoatLiveVideo.video_url }]
          : liveVideosList;
        return (
          <section 
            className={`border-b border-slate-100 ${getVisibilityClass(raincoatLiveVideo.visible_mobile, raincoatLiveVideo.visible_desktop)} ${getPaddingClass(raincoatLiveVideo.padding_vertical)}`} 
            style={{ backgroundColor: raincoatLiveVideo.bgColor, color: raincoatLiveVideo.textColor }}
            id="live-video"
          >
            <div className="container mx-auto px-4 max-w-4xl">
              <div className={`max-w-2xl mx-auto mb-6 flex flex-col ${getAlignClass(raincoatLiveVideo.textAlign)}`}>
                <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-bold rounded-full border border-orange-200 inline-flex items-center gap-1 font-sans">
                  <Volume2 className="h-3 w-3 animate-ping text-orange-500" /> {raincoatLiveVideo.icon_text}
                </span>
                <h2 className={`font-black mt-2 font-sans ${getFontSizeClass(raincoatLiveVideo.fontSize, "text-xl sm:text-2xl")}`}>
                  {raincoatLiveVideo.title_1}
                </h2>
                <p className="text-xs sm:text-sm mt-1.5 font-sans opacity-80">
                  {raincoatLiveVideo.title_2}
                </p>
                {raincoatLiveVideo.body && (
                  <p className="text-xs mt-2 font-sans opacity-70 italic max-w-lg">
                    {raincoatLiveVideo.body}
                  </p>
                )}
              </div>

              {/* Facebook/YouTube Video Iframes embedded inside high-quality device frames */}
              <div className="flex flex-wrap gap-8 justify-center items-stretch max-w-4xl mx-auto">
                {customVideosList.map((video, index) => {
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

              <div className="mt-6 flex justify-center gap-4 text-[11px] sm:text-xs font-sans opacity-60">
                <span className="flex items-center gap-1">
                  ⭐ ১২৭৮৫+ জন কৃষক, চাকরিজীবি ও বাইকার ভাইয়েদের প্রথম পছন্দ
                </span>
                <span className="opacity-30">|</span>
                <span className="flex items-center gap-1">
                  💧 নিখুঁত ওয়াটার-গ্রিপিং ও ড্রিপ প্রুফ
                </span>
              </div>
            </div>
          </section>
        );
      })()}

      {/* 🏍️ Biker Special Offer Block */}
      <section className="py-6 bg-amber-50/40 border-y border-amber-100/60" id="biker-promo">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white border border-amber-400/30 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-4 shadow-sm hover:shadow-md transition-all">
            <div className="bg-orange-500 text-white w-12 h-12 rounded-2xl font-bold flex items-center justify-center text-2xl shrink-0 shadow-lg shadow-orange-500/10 animate-bounce">
              🏍️
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-sm font-black text-slate-900 tracking-wide font-sans mb-1 uppercase flex items-center justify-center md:justify-start gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse shrink-0" />
                বাইকারদের উদ্দেশ্যে স্পেশাল অফার:
              </h4>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-700 font-sans font-medium">
                সুজুকি, ইয়ামাহা, পালসার বা টিভিএস বাইকার বন্ধুরা আমাদের রেনকোট কাপড়ে পেয়ে অত্যন্ত খুশি। কাদা বৃষ্টির চাট থেকে বাইক রাইড সেফ ও ড্রাই রাখতে আজই আপনার পছন্দের রঙ কনফার্ম করুন।
              </p>
            </div>
            <button
              onClick={() => scrollToSection('checkout-form')}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-extrabold text-xs sm:text-sm rounded-xl transition duration-300 shadow-xs cursor-pointer whitespace-nowrap shrink-0 font-sans"
            >
              আজই কালার কনফার্ম করুন
            </button>
          </div>
        </div>
      </section>

      {/* Bento Grid Features Showcase */}
      {(() => {
        const raincoatFeatures = getSectionData('raincoat_features');
        return (
          <section 
            className={`border-b border-slate-100 ${getVisibilityClass(raincoatFeatures.visible_mobile, raincoatFeatures.visible_desktop)} ${getPaddingClass(raincoatFeatures.padding_vertical)}`} 
            style={{ backgroundColor: raincoatFeatures.bgColor }}
            id="features"
          >
            <div className="container mx-auto px-4 max-w-7xl">
              <div className={`flex flex-col mb-8 ${getAlignClass(raincoatFeatures.textAlign)}`}>
                <span className="text-xs font-bold uppercase tracking-widest font-sans" style={{ color: raincoatFeatures.textColor === '#ffffff' ? '#fdba74' : '#ea580c' }}>
                  {raincoatFeatures.icon_text}
                </span>
                <h2 
                  className={`font-black mt-1 font-sans ${getFontSizeClass(raincoatFeatures.fontSize, "text-xl sm:text-2xl")}`}
                  style={{ color: raincoatFeatures.textColor || '#0f172a' }}
                >
                  {raincoatFeatures.title_1}
                </h2>
                <p 
                  className="text-xs sm:text-sm mt-1 font-sans opacity-85 max-w-2xl"
                  style={{ color: raincoatFeatures.textColor || '#475569' }}
                >
                  {raincoatFeatures.title_2}
                </p>
                {raincoatFeatures.body && (
                  <p 
                    className="text-xs mt-1.5 font-sans opacity-70 max-w-2xl"
                    style={{ color: raincoatFeatures.textColor || '#64748b' }}
                  >
                    {raincoatFeatures.body}
                  </p>
                )}
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
                      অর্ডার করতে অগ্রিম এক টাকাও দিতে হবে না। পার্সেল হাতে পেয়ে কোয়ালিটি দেখে তারপর কুরিয়ার এজেন্ট বা ডেলিভারি বয়কে মূল্য পরিশোধ করুন।
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
        );
      })()}

      {/* 📊 Premium vs Regular Comparison Section */}
      {(() => {
        const raincoatComparison = getSectionData('raincoat_comparison');
        return (
          <section 
            className={`border-b border-slate-100/80 ${getVisibilityClass(raincoatComparison.visible_mobile, raincoatComparison.visible_desktop)} ${getPaddingClass(raincoatComparison.padding_vertical)}`} 
            style={{ backgroundColor: raincoatComparison.bgColor, color: raincoatComparison.textColor }}
            id="comparison"
          >
            <div className="container mx-auto px-4 max-w-4xl">
              <div className={`flex flex-col mb-8 ${getAlignClass(raincoatComparison.textAlign)}`}>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider font-sans px-2.5 py-1 bg-orange-50 rounded-full border border-orange-100 inline-flex items-center gap-1" style={{ color: raincoatComparison.textColor === '#ffffff' ? '#fb923c' : '#ea580c' }}>
                  {raincoatComparison.icon_text}
                </span>
                <h2 
                  className={`font-black mt-2 font-sans tracking-tight ${getFontSizeClass(raincoatComparison.fontSize, "text-xl sm:text-2xl md:text-3xl")}`}
                  style={{ color: raincoatComparison.textColor || '#0f172a' }}
                >
                  {raincoatComparison.title_1}
                </h2>
                <p 
                  className="text-xs sm:text-sm mt-1.5 font-sans opacity-85"
                  style={{ color: raincoatComparison.textColor || '#475569' }}
                >
                  {raincoatComparison.title_2}
                </p>
                {raincoatComparison.body && (
                  <p 
                    className="text-xs mt-1 font-sans opacity-70 max-w-xl"
                    style={{ color: raincoatComparison.textColor || '#64748b' }}
                  >
                    {raincoatComparison.body}
                  </p>
                )}
              </div>

              {raincoatComparison.image_url && (
                <div className="mb-8 flex justify-center">
                  <img src={raincoatComparison.image_url} alt="Comparison showcase asset" className="max-w-md w-full rounded-2xl shadow-lg border border-slate-200/50" referrerPolicy="no-referrer" loading="lazy" />
                </div>
              )}

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
                        সস্তা পাতলা plastic বা নাইলন শীট <br/>
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
              <div className="block md:hidden space-y-4 font-sans">
                {/* Box 1 */}
                <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/80 text-slate-800">
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
                <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/80 text-slate-800">
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
                <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/80 text-slate-800">
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
                <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/80 text-slate-800">
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
        );
      })()}

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
      <section className="py-12 bg-blue-50/20" id="checkout-form">
        <div className="container mx-auto px-4 max-w-2xl" id="form-scroll-target">
          
          {/* Centered dynamic order form / Receipt output */}
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
      </section>

      {/* Suttle Sticky bottom CTA order bar (for outstanding conversions) */}
      <div className={`sticky bottom-0 bg-white border-t border-slate-200 py-3.5 px-4 shadow-[0_-5px_15px_rgba(0,0,0,0.06)] z-45 sm:flex-row justify-between items-center gap-3 ${isCheckoutVisible ? 'hidden' : 'flex flex-col'}`}>
        <div className="flex items-center gap-2.5 text-slate-800 text-xs sm:text-sm font-sans font-semibold">
          <CloudRain className="h-5 w-5 text-orange-500 shrink-0" />
          <span>
            নির্বাচিত সাইজ: <span className="font-mono bg-slate-100 text-blue-900 px-1.5 py-0.5 rounded font-bold">{selectedSize || 'পছন্দ করুন'}</span>, 
            কালার: <span className="text-blue-900 font-extrabold">{selectedColor ? (selectedColor === 'Black' ? 'কালো' : 'নেভি ব্লু') : 'পছন্দ করুন'}</span>, 
            দাম: <span className="font-mono text-orange-600 font-extrabold">{selectedSize ? (selectedSize === '3XL' || selectedSize === '4XL' ? '১০৯০' : '৯৯০') : '৯৯০ - ১০৯০'} TK</span>
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
              {siteSettings?.site_logo_url || 'প্রিমিয়াম রেইনকোট বাংলাদেশ'}
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
              onClick={() => window.open('#/order-history', '_blank')}
              className="text-slate-300 hover:text-orange-400 font-bold transition underline cursor-pointer flex items-center gap-1 font-sans font-sans"
            >
              📊 কাস্টমার অর্ডার হিস্টোরি
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
