import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  Code, 
  Key, 
  Save, 
  CheckCircle, 
  HelpCircle, 
  Settings, 
  Info, 
  Activity, 
  ShieldCheck, 
  Database, 
  RefreshCw, 
  Send, 
  Check, 
  Trash2, 
  AlertCircle,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  MessageSquare,
  Truck
} from 'lucide-react';
import { getIntegrationsSettingsFromFirestore, saveIntegrationsSettingsToFirestore } from '../../lib/firebase';
import { trackPixelEvent } from '../../lib/tracking';

interface AdvancedPixelsAdminProps {
  userRole: string; // 'Admin' | 'Editor' | 'ReadOnly'
}

type SubTabType = 'meta' | 'tiktok' | 'snippets' | 'whatsapp' | 'courier' | 'logs';

export default function AdvancedPixelsAdmin({ userRole }: AdvancedPixelsAdminProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('meta');
  
  // Facebook/Meta States
  const [pixelId, setPixelId] = useState('');
  const [pixelEnabled, setPixelEnabled] = useState(true);
  const [capiEnabled, setCapiEnabled] = useState(false);
  const [advancedMatching, setAdvancedMatching] = useState(true);
  const [capiToken, setCapiToken] = useState('');
  const [testEventEnabled, setTestEventEnabled] = useState(false);
  const [testEventCode, setTestEventCode] = useState('');
  const [fbTestEventCreatedAt, setFbTestEventCreatedAt] = useState<number | null>(null);

  // TikTok States
  const [tiktokPixelId, setTiktokPixelId] = useState('');
  const [tiktokPixelEnabled, setTiktokPixelEnabled] = useState(true);
  const [tiktokCapiEnabled, setTiktokCapiEnabled] = useState(false);
  const [tiktokAdvancedMatching, setTiktokAdvancedMatching] = useState(true);
  const [tiktokAccessToken, setTiktokAccessToken] = useState('');
  const [tiktokTestEventEnabled, setTiktokTestEventEnabled] = useState(false);
  const [tiktokTestEventCode, setTiktokTestEventCode] = useState('');
  const [tiktokTestEventCreatedAt, setTiktokTestEventCreatedAt] = useState<number | null>(null);

  // Other Pixels & Snippets
  const [gaId, setGaId] = useState('');
  const [headerSnippets, setHeaderSnippets] = useState('');
  const [footerSnippets, setFooterSnippets] = useState('');

  // Shipping & Courier Cargo Charges
  const [deliveryInside, setDeliveryInside] = useState(80);
  const [deliverySub, setDeliverySub] = useState(100);
  const [deliveryOutside, setDeliveryOutside] = useState(130);

  // Automated WhatsApp States
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappProvider, setWhatsappProvider] = useState<'ultramsg' | 'greenapi' | 'custom_webhook'>('ultramsg');
  const [whatsappInstanceId, setWhatsappInstanceId] = useState('');
  const [whatsappToken, setWhatsappToken] = useState('');
  const [whatsappMessageTemplate, setWhatsappMessageTemplate] = useState(`প্রিয় {customer_name},
আপনার রেইনকোটের অর্ডারটি সফলভাবে গৃহীত হয়েছে! 🎉

🛍️ অর্ডার বিবরণ:
- অর্ডার আইডি: #{order_id}
- সাইজ: {selected_size}
- কালার: {selected_color}
- পরিশোধযোগ্য সর্বমোট মূল্য: {order_price} TK (ক্যাশ অন ডেলিভারি, সম্পূর্ণ ফ্রি ডেলিভারি)
- ডেলিভারি ঠিকানা: {delivery_address}

পরবর্তী ১২ ঘণ্টার মধ্যে আমাদের কাস্টমার রিপ্রেজেন্টেটিভ আপনার মোবাইল নাম্বারে কল করে অর্ডারটি নিশ্চিত করবেন। অনুগ্রহ করে আপনার মোবাইল ফোনটি সচল রাখুন। ধন্যবাদ আমাদের সাথে থাকার জন্য! 😊`);

  // UI Flow States
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Diagnostic Logs
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [inspectingEventId, setInspectingEventId] = useState<string | null>(null);

  // Remaining hour displays for test codes
  const [fbHoursRemaining, setFbHoursRemaining] = useState<string>('');
  const [tiktokHoursRemaining, setTiktokHoursRemaining] = useState<string>('');

  // Ref to prevent initial auto-save firing before load completion
  const isLoadedRef = useRef(false);

  // Load configuration initially
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load initial local caches to ensure instant UI loading
        const localFbCreatedAt = localStorage.getItem('fb_test_event_code_created_at');
        if (localFbCreatedAt) setFbTestEventCreatedAt(Number(localFbCreatedAt));

        const localTiktokCreatedAt = localStorage.getItem('tiktok_test_event_code_created_at');
        if (localTiktokCreatedAt) setTiktokTestEventCreatedAt(Number(localTiktokCreatedAt));

        // Load local caches for WhatsApp and Delivery
        const localDeliveryInside = Number(localStorage.getItem('raincoat_courier_inside')) || 80;
        const localDeliverySub = Number(localStorage.getItem('raincoat_courier_sub')) || 100;
        const localDeliveryOutside = Number(localStorage.getItem('raincoat_courier_outside')) || 130;
        
        setDeliveryInside(localDeliveryInside);
        setDeliverySub(localDeliverySub);
        setDeliveryOutside(localDeliveryOutside);

        const localWhatsappEnabled = localStorage.getItem('raincoat_whatsapp_enabled') === 'true';
        const localWhatsappProvider = (localStorage.getItem('raincoat_whatsapp_provider') || 'ultramsg') as 'ultramsg' | 'greenapi' | 'custom_webhook';
        const localWhatsappInstanceId = localStorage.getItem('raincoat_whatsapp_instance_id') || '';
        const localWhatsappToken = localStorage.getItem('raincoat_whatsapp_token') || '';
        const localWhatsappTemplate = localStorage.getItem('raincoat_whatsapp_template') || '';

        setWhatsappEnabled(localWhatsappEnabled);
        setWhatsappProvider(localWhatsappProvider);
        setWhatsappInstanceId(localWhatsappInstanceId);
        setWhatsappToken(localWhatsappToken);
        if (localWhatsappTemplate) {
          setWhatsappMessageTemplate(localWhatsappTemplate);
        }

        // Fetch official cloud settings from Firestore
        const fbSettings = await getIntegrationsSettingsFromFirestore();
        if (fbSettings) {
          setPixelId(fbSettings.fb_pixel_id || '');
          setPixelEnabled(fbSettings.fb_pixel_enabled !== false);
          setCapiEnabled(fbSettings.fb_capi_enabled === true);
          setAdvancedMatching(fbSettings.fb_advanced_matching !== false);
          setCapiToken(fbSettings.fb_capi_token || '');
          setTestEventEnabled(fbSettings.fb_test_event_enabled === true);
          setTestEventCode(fbSettings.fb_test_event_code || '');
          if (fbSettings.fb_test_event_created_at) {
            const time = Number(fbSettings.fb_test_event_created_at);
            setFbTestEventCreatedAt(time);
            localStorage.setItem('fb_test_event_code_created_at', String(time));
          }

          setTiktokPixelId(fbSettings.tiktok_pixel_id || '');
          setTiktokPixelEnabled(fbSettings.tiktok_pixel_enabled !== false);
          setTiktokCapiEnabled(fbSettings.tiktok_capi_enabled === true);
          setTiktokAdvancedMatching(fbSettings.tiktok_advanced_matching !== false);
          setTiktokAccessToken(fbSettings.tiktok_access_token || '');
          setTiktokTestEventEnabled(fbSettings.tiktok_test_event_enabled === true);
          setTiktokTestEventCode(fbSettings.tiktok_test_event_code || '');
          if (fbSettings.tiktok_test_event_created_at) {
            const time = Number(fbSettings.tiktok_test_event_created_at);
            setTiktokTestEventCreatedAt(time);
            localStorage.setItem('tiktok_test_event_code_created_at', String(time));
          }

          setGaId(fbSettings.ga_track_id || '');
          setHeaderSnippets(fbSettings.raincoat_header_snippets || '');
          setFooterSnippets(fbSettings.raincoat_footer_snippets || '');

          setDeliveryInside(fbSettings.raincoat_courier_inside || 80);
          setDeliverySub(fbSettings.raincoat_courier_sub || 100);
          setDeliveryOutside(fbSettings.raincoat_courier_outside || 130);

          setWhatsappEnabled(fbSettings.whatsapp_enabled === true);
          setWhatsappProvider(fbSettings.whatsapp_provider || 'ultramsg');
          setWhatsappInstanceId(fbSettings.whatsapp_instance_id || '');
          setWhatsappToken(fbSettings.whatsapp_token || '');
          if (fbSettings.whatsapp_message_template) {
            setWhatsappMessageTemplate(fbSettings.whatsapp_message_template);
          }
          
          // Seed local values so that the tracking configuration modules read cleanly
          syncToLocalStorage(fbSettings);
        }
      } catch (err) {
        console.warn("Failed to retrieve integration settings in Advanced Pixels Manager:", err);
      } finally {
        isLoadedRef.current = true;
      }
    };

    loadSettings();

    // Check live diagnostic events log
    const handleEventsUpdate = () => {
      const win = window as any;
      if (win._pixel_events_log) {
        setLiveEvents([...win._pixel_events_log]);
      }
    };
    handleEventsUpdate();
    window.addEventListener('new_pixel_event_tracked', handleEventsUpdate);
    return () => {
      window.removeEventListener('new_pixel_event_tracked', handleEventsUpdate);
    };
  }, []);

  // Update Countdown checks for test code auto-expiry (24-hour self-deletion rules)
  useEffect(() => {
    const checkExpiration = () => {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      // Facebook code expiration monitor
      if (testEventEnabled && testEventCode && fbTestEventCreatedAt) {
        const diff = now - fbTestEventCreatedAt;
        if (diff >= oneDayMs) {
          setTestEventEnabled(false);
          setTestEventCode('');
          setFbTestEventCreatedAt(null);
          localStorage.removeItem('fb_test_event_code_created_at');
          triggerAutoSave({
            fb_test_event_enabled: false,
            fb_test_event_code: '',
            fb_test_event_created_at: ''
          });
          setFbHoursRemaining('');
        } else {
          const remainingMs = oneDayMs - diff;
          const hours = Math.floor(remainingMs / (3600 * 1000));
          const mins = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
          setFbHoursRemaining(`${hours} ঘণ্টা ${mins} মিনিট`);
        }
      } else {
        setFbHoursRemaining('');
      }

      // TikTok code expiration monitor
      if (tiktokTestEventEnabled && tiktokTestEventCode && tiktokTestEventCreatedAt) {
        const diff = now - tiktokTestEventCreatedAt;
        if (diff >= oneDayMs) {
          setTiktokTestEventEnabled(false);
          setTiktokTestEventCode('');
          setTiktokTestEventCreatedAt(null);
          localStorage.removeItem('tiktok_test_event_code_created_at');
          triggerAutoSave({
            tiktok_test_event_enabled: false,
            tiktok_test_event_code: '',
            tiktok_test_event_created_at: ''
          });
          setTiktokHoursRemaining('');
        } else {
          const remainingMs = oneDayMs - diff;
          const hours = Math.floor(remainingMs / (3600 * 1000));
          const mins = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
          setTiktokHoursRemaining(`${hours} ঘণ্টা ${mins} মিনিট`);
        }
      } else {
        setTiktokHoursRemaining('');
      }
    };

    checkExpiration();
    const timer = setInterval(checkExpiration, 10000); // Check every 10 seconds
    return () => clearInterval(timer);
  }, [testEventEnabled, testEventCode, fbTestEventCreatedAt, tiktokTestEventEnabled, tiktokTestEventCode, tiktokTestEventCreatedAt]);

  // Sync to localstorage so standard scripts read instantly
  const syncToLocalStorage = (data: any) => {
    try {
      if (data.fb_pixel_id !== undefined) localStorage.setItem('fb_pixel_id', String(data.fb_pixel_id).trim());
      if (data.fb_pixel_enabled !== undefined) localStorage.setItem('fb_pixel_enabled', data.fb_pixel_enabled ? 'true' : 'false');
      if (data.fb_capi_enabled !== undefined) localStorage.setItem('fb_capi_enabled', data.fb_capi_enabled ? 'true' : 'false');
      if (data.fb_advanced_matching !== undefined) localStorage.setItem('fb_advanced_matching', data.fb_advanced_matching ? 'true' : 'false');
      if (data.fb_capi_token !== undefined) localStorage.setItem('fb_capi_token', String(data.fb_capi_token).trim());
      if (data.fb_test_event_enabled !== undefined) localStorage.setItem('fb_test_event_enabled', data.fb_test_event_enabled ? 'true' : 'false');
      if (data.fb_test_event_code !== undefined) localStorage.setItem('fb_test_event_code', String(data.fb_test_event_code).trim());

      if (data.tiktok_pixel_id !== undefined) localStorage.setItem('tiktok_pixel_id', String(data.tiktok_pixel_id).trim());
      if (data.tiktok_pixel_enabled !== undefined) localStorage.setItem('tiktok_pixel_enabled', data.tiktok_pixel_enabled ? 'true' : 'false');
      if (data.tiktok_capi_enabled !== undefined) localStorage.setItem('tiktok_capi_enabled', data.tiktok_capi_enabled ? 'true' : 'false');
      if (data.tiktok_advanced_matching !== undefined) localStorage.setItem('tiktok_advanced_matching', data.tiktok_advanced_matching ? 'true' : 'false');
      if (data.tiktok_access_token !== undefined) localStorage.setItem('tiktok_access_token', String(data.tiktok_access_token).trim());
      if (data.tiktok_test_event_enabled !== undefined) localStorage.setItem('tiktok_test_event_enabled', data.tiktok_test_event_enabled ? 'true' : 'false');
      if (data.tiktok_test_event_code !== undefined) localStorage.setItem('tiktok_test_event_code', String(data.tiktok_test_event_code).trim());

      if (data.ga_track_id !== undefined) localStorage.setItem('ga_track_id', String(data.ga_track_id).trim());
      if (data.raincoat_header_snippets !== undefined) localStorage.setItem('raincoat_header_snippets', data.raincoat_header_snippets);
      if (data.raincoat_footer_snippets !== undefined) localStorage.setItem('raincoat_footer_snippets', data.raincoat_footer_snippets);

      if (data.raincoat_courier_inside !== undefined) localStorage.setItem('raincoat_courier_inside', String(data.raincoat_courier_inside));
      if (data.raincoat_courier_sub !== undefined) localStorage.setItem('raincoat_courier_sub', String(data.raincoat_courier_sub));
      if (data.raincoat_courier_outside !== undefined) localStorage.setItem('raincoat_courier_outside', String(data.raincoat_courier_outside));

      if (data.whatsapp_enabled !== undefined) localStorage.setItem('raincoat_whatsapp_enabled', data.whatsapp_enabled ? 'true' : 'false');
      if (data.whatsapp_provider !== undefined) localStorage.setItem('raincoat_whatsapp_provider', data.whatsapp_provider);
      if (data.whatsapp_instance_id !== undefined) localStorage.setItem('raincoat_whatsapp_instance_id', String(data.whatsapp_instance_id).trim());
      if (data.whatsapp_token !== undefined) localStorage.setItem('raincoat_whatsapp_token', String(data.whatsapp_token).trim());
      if (data.whatsapp_message_template !== undefined) localStorage.setItem('raincoat_whatsapp_template', data.whatsapp_message_template);
    } catch (_) {}
  };

  // General Auto-Save Core Router
  const triggerAutoSave = async (overrideFields?: Record<string, any>) => {
    if (!isLoadedRef.current) return;
    if (!autoSaveEnabled && !overrideFields) return;
    if (userRole !== 'Admin') return;

    setSaveStatus('saving');
    
    const payload = {
      fb_pixel_id: pixelId.trim(),
      fb_pixel_enabled: pixelEnabled,
      fb_capi_enabled: capiEnabled,
      fb_advanced_matching: advancedMatching,
      fb_capi_token: capiToken.trim(),
      fb_test_event_enabled: testEventEnabled,
      fb_test_event_code: testEventCode.trim(),
      fb_test_event_created_at: fbTestEventCreatedAt ? String(fbTestEventCreatedAt) : '',

      tiktok_pixel_id: tiktokPixelId.trim(),
      tiktok_pixel_enabled: tiktokPixelEnabled,
      tiktok_capi_enabled: tiktokCapiEnabled,
      tiktok_advanced_matching: tiktokAdvancedMatching,
      tiktok_access_token: tiktokAccessToken.trim(),
      tiktok_test_event_enabled: tiktokTestEventEnabled,
      tiktok_test_event_code: tiktokTestEventCode.trim(),
      tiktok_test_event_created_at: tiktokTestEventCreatedAt ? String(tiktokTestEventCreatedAt) : '',

      ga_track_id: gaId.trim(),
      raincoat_header_snippets: headerSnippets,
      raincoat_footer_snippets: footerSnippets,

      raincoat_courier_inside: Number(deliveryInside) || 0,
      raincoat_courier_sub: Number(deliverySub) || 0,
      raincoat_courier_outside: Number(deliveryOutside) || 0,

      whatsapp_enabled: whatsappEnabled,
      whatsapp_provider: whatsappProvider,
      whatsapp_instance_id: whatsappInstanceId.trim(),
      whatsapp_token: whatsappToken.trim(),
      whatsapp_message_template: whatsappMessageTemplate,
      ...overrideFields
    };

    // Apply locally instantly
    syncToLocalStorage(payload);

    try {
      await saveIntegrationsSettingsToFirestore(payload);
      setSaveStatus('saved');
      setLastSavedTime(new Date().toLocaleTimeString());
      setTimeout(() => setSaveStatus('idle'), 2000);
      
      // Dispatch live update signals
      window.dispatchEvent(new Event('raincoat_pixel_config_updated'));
    } catch (err) {
      console.error("Auto save failed:", err);
      setSaveStatus('failed');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  // Manual Trigger Action
  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    if (userRole !== 'Admin') {
      setMessage('দুঃখিত! ইন্টিগ্রেশন ও পিক্সেল সেটিংস পরিবর্তন করার ক্ষমতা শুধুমাত্র এডমিনের রয়েছে।');
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');

    const fbTime = (testEventEnabled && testEventCode && !fbTestEventCreatedAt) ? Date.now() : fbTestEventCreatedAt;
    const ttTime = (tiktokTestEventEnabled && tiktokTestEventCode && !tiktokTestEventCreatedAt) ? Date.now() : tiktokTestEventCreatedAt;

    if (fbTime) {
      setFbTestEventCreatedAt(fbTime);
      localStorage.setItem('fb_test_event_code_created_at', String(fbTime));
    }
    if (ttTime) {
      setTiktokTestEventCreatedAt(ttTime);
      localStorage.setItem('tiktok_test_event_code_created_at', String(ttTime));
    }

    const payload = {
      fb_pixel_id: pixelId.trim(),
      fb_pixel_enabled: pixelEnabled,
      fb_capi_enabled: capiEnabled,
      fb_advanced_matching: advancedMatching,
      fb_capi_token: capiToken.trim(),
      fb_test_event_enabled: testEventEnabled,
      fb_test_event_code: testEventCode.trim(),
      fb_test_event_created_at: fbTime ? String(fbTime) : '',

      tiktok_pixel_id: tiktokPixelId.trim(),
      tiktok_pixel_enabled: tiktokPixelEnabled,
      tiktok_capi_enabled: tiktokCapiEnabled,
      tiktok_advanced_matching: tiktokAdvancedMatching,
      tiktok_access_token: tiktokAccessToken.trim(),
      tiktok_test_event_enabled: tiktokTestEventEnabled,
      tiktok_test_event_code: tiktokTestEventCode.trim(),
      tiktok_test_event_created_at: ttTime ? String(ttTime) : '',

      ga_track_id: gaId.trim(),
      raincoat_header_snippets: headerSnippets,
      raincoat_footer_snippets: footerSnippets,

      raincoat_courier_inside: Number(deliveryInside) || 0,
      raincoat_courier_sub: Number(deliverySub) || 0,
      raincoat_courier_outside: Number(deliveryOutside) || 0,

      whatsapp_enabled: whatsappEnabled,
      whatsapp_provider: whatsappProvider,
      whatsapp_instance_id: whatsappInstanceId.trim(),
      whatsapp_token: whatsappToken.trim(),
      whatsapp_message_template: whatsappMessageTemplate
    };

    // Live update localStorage
    syncToLocalStorage(payload);

    try {
      await saveIntegrationsSettingsToFirestore(payload);
      setIsSuccess(true);
      setSaveStatus('saved');
      setLastSavedTime(new Date().toLocaleTimeString());
      setMessage('পিক্সেল, ট্র্যাকিং, হোয়াটসঅ্যাপ ও ডেলিভারি কনফিগারেশন ক্লাউডে সফলভাবে সেভ করা হয়েছে এবং অ্যাপে সক্রিয় হয়েছে!');
      window.dispatchEvent(new Event('raincoat_pixel_config_updated'));
    } catch (err) {
      console.warn("Storage syncing failed:", err);
      setIsSuccess(true); // Still true because saved to localstorage and fully functional!
      setMessage('সেটিংস নিরাপদে লোকালি সেভ হয়েছে এবং সক্রিয় আছে! (ক্লাউড সংযোগের জন্য অপেক্ষা করা হচ্ছে)');
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(''), 6000);
    }
  };

  // Trigger quick toggles with direct auto save
  const handleToggle = async (field: string, currentVal: boolean) => {
    if (userRole !== 'Admin') return;
    const newVal = !currentVal;

    const updates: Record<string, any> = {};
    
    if (field === 'fb_pixel_enabled') {
      setPixelEnabled(newVal);
      updates.fb_pixel_enabled = newVal;
    } else if (field === 'fb_capi_enabled') {
      setCapiEnabled(newVal);
      updates.fb_capi_enabled = newVal;
    } else if (field === 'fb_advanced_matching') {
      setAdvancedMatching(newVal);
      updates.fb_advanced_matching = newVal;
    } else if (field === 'fb_test_event_enabled') {
      setTestEventEnabled(newVal);
      updates.fb_test_event_enabled = newVal;
      if (newVal) {
        const t = Date.now();
        setFbTestEventCreatedAt(t);
        updates.fb_test_event_created_at = String(t);
        localStorage.setItem('fb_test_event_code_created_at', String(t));
      } else {
        setFbTestEventCreatedAt(null);
        updates.fb_test_event_created_at = '';
        localStorage.removeItem('fb_test_event_code_created_at');
      }
    } else if (field === 'tiktok_pixel_enabled') {
      setTiktokPixelEnabled(newVal);
      updates.tiktok_pixel_enabled = newVal;
    } else if (field === 'tiktok_capi_enabled') {
      setTiktokCapiEnabled(newVal);
      updates.tiktok_capi_enabled = newVal;
    } else if (field === 'tiktok_advanced_matching') {
      setTiktokAdvancedMatching(newVal);
      updates.tiktok_advanced_matching = newVal;
    } else if (field === 'tiktok_test_event_enabled') {
      setTiktokTestEventEnabled(newVal);
      updates.tiktok_test_event_enabled = newVal;
      if (newVal) {
        const t = Date.now();
        setTiktokTestEventCreatedAt(t);
        updates.tiktok_test_event_created_at = String(t);
        localStorage.setItem('tiktok_test_event_code_created_at', String(t));
      } else {
        setTiktokTestEventCreatedAt(null);
        updates.tiktok_test_event_created_at = '';
        localStorage.removeItem('tiktok_test_event_code_created_at');
      }
    } else if (field === 'whatsapp_enabled') {
      setWhatsappEnabled(newVal);
      updates.whatsapp_enabled = newVal;
    }

    setTimeout(() => {
      triggerAutoSave(updates);
    }, 100);
  };

  // Safe removal / clean field helper (auto-saves)
  const handleClearField = (field: string) => {
    if (userRole !== 'Admin') return;
    if (!confirm('আপনি কি এই ফিল্ডের তথ্য মুছে ফেলতে চান?')) return;

    const updates: Record<string, any> = {};
    if (field === 'meta') {
      setPixelId('');
      updates.fb_pixel_id = '';
    } else if (field === 'meta_token') {
      setCapiToken('');
      updates.fb_capi_token = '';
    } else if (field === 'tiktok') {
      setTiktokPixelId('');
      updates.tiktok_pixel_id = '';
    } else if (field === 'tiktok_token') {
      setTiktokAccessToken('');
      updates.tiktok_access_token = '';
    } else if (field === 'ga') {
      setGaId('');
      updates.ga_track_id = '';
    }

    setTimeout(() => {
      triggerAutoSave(updates);
    }, 100);
  };

  const handleSimulateEvent = (name: string) => {
    let payload = {};
    if (name === 'PageView') {
      payload = { title: 'Premium Raincoat Premium Store', currency: 'BDT' };
    } else if (name === 'InitiateCheckout') {
      payload = { value: 1450, currency: 'BDT', content_type: 'product_group', contents: [{ id: 'p-1', quantity: 1, name: 'Premium Raincoat' }] };
    } else if (name === 'Purchase') {
      payload = { value: 1455, currency: 'BDT', content_type: 'product_group', num_items: 1, contents: [{ id: 'p-1', quantity: 1, item_price: 1455, name: 'Premium Raincoat' }] };
    }
    trackPixelEvent(name, payload, {
      name: 'Test Customer',
      phone: '01712345678',
      email: 'customer@test.com',
      address: 'Dhaka, Bangladesh'
    });
  };

  const handleClearEventLogs = () => {
    const win = window as any;
    if (win._pixel_events_log) {
      win._pixel_events_log = [];
      setLiveEvents([]);
    }
  };

  return (
    <div id="advanced-pixel-manager-panel" className="space-y-6 font-sans text-xs sm:text-sm">
      
      {/* Upper Status Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
              <Sparkles className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
            </span>
            <h2 className="text-sm font-extrabold tracking-wide uppercase">অ্যাডভান্সড পিক্সেল ও ইন্টিগ্রেশন ম্যানেজার (WordPress Style)</h2>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            মেটা ফেসবুক পিক্সেল, টিকটক পিক্সেল, গুগল এনালাইটিক্স, হোয়াটসঅ্যাপ নোটিফিকেশন ও ডেলিভারি চার্জ এক প্যানেল থেকে পরিচালনা করুন। এটি পুরোপুরি অটো-সেভ সমর্থিত।
          </p>
        </div>

        {/* Save Toggle Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Auto Save State */}
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-755">
            <span className="text-[10px] font-bold text-slate-300">অটো-সেভ চালু</span>
            <button
              type="button"
              disabled={userRole !== 'Admin'}
              onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
              className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoSaveEnabled ? 'bg-indigo-500' : 'bg-slate-600'
              }`}
            >
              <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white transition duration-200 ${autoSaveEnabled ? 'translate-x-3.5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Saving Status Badge */}
          <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                <RefreshCw className="h-3 w-3 animate-spin" /> সংরক্ষিত হচ্ছে...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                <CheckCircle className="h-3 w-3" /> সংরক্ষিত
              </span>
            )}
            {saveStatus === 'failed' && (
              <span className="flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20 animate-bounce">
                <AlertCircle className="h-3 w-3" /> সেভ ব্যর্থ!
              </span>
            )}
            {saveStatus === 'idle' && lastSavedTime && (
              <span className="text-[9px] text-slate-500">শেষ সেভ: {lastSavedTime}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side Sub Tabs */}
        <div className="lg:col-span-3 card bg-white border border-slate-200 rounded-2xl p-4 space-y-2 text-left">
          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest px-2.5 block mb-1">ক্যাটাগরি সিলেক্ট করুন</span>
          
          <button
            type="button"
            onClick={() => setActiveSubTab('meta')}
            className={`w-full py-2.5 px-3 rounded-xl text-left font-bold transition-all text-xs flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'meta'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                : 'bg-transparent text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="inline-block bg-white text-blue-650 text-[9px] px-1 rounded font-bold font-mono border">fb</span>
            Facebook / Meta Pixel
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('tiktok')}
            className={`w-full py-2.5 px-3 rounded-xl text-left font-bold transition-all text-xs flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'tiktok'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/10'
                : 'bg-transparent text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="inline-block bg-slate-900 text-white text-[9px] px-1 rounded font-mono">tt</span>
            TikTok Pixel
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('snippets')}
            className={`w-full py-2.5 px-3 rounded-xl text-left font-bold transition-all text-xs flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'snippets'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/10'
                : 'bg-transparent text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-orange-500" />
            Custom Scripts & GA
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('whatsapp')}
            className={`w-full py-2.5 px-3 rounded-xl text-left font-bold transition-all text-xs flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                : 'bg-transparent text-slate-700 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
            হোয়াটসঅ্যাপ নোটিফিকেশন
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('courier')}
            className={`w-full py-2.5 px-3 rounded-xl text-left font-bold transition-all text-xs flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'courier'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/10'
                : 'bg-transparent text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Truck className="h-3.5 w-3.5 text-amber-500" />
            ডেলিভারি চার্জ কুরিয়ার
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('logs')}
            className={`w-full py-2.5 px-3 rounded-xl text-left font-bold transition-all text-xs flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'logs'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-transparent text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            লাইভ ট্র্যাকিং ডায়াগনস্টিকস
          </button>

          <div className="pt-4 border-t border-slate-100 text-slate-500 text-[10px] space-y-2 p-1 leading-relaxed">
            <div className="flex gap-1.5 items-start">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>আপনার সকল ডেটা সরাসরি ক্লাউডে সেভ থাকে এবং কখনো মুছে যায় না।</span>
            </div>
            <div className="flex gap-1.5 items-start text-indigo-500">
              <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>পিক্সেল টেস্ট কোড ২৪ ঘণ্টা পর স্বয়ংক্রিয়ভাবে মুছে দেওয়ার সুরক্ষাসূত্র চালু রয়েছে।</span>
            </div>
          </div>
        </div>

        {/* Right Side Settings View */}
        <div className="lg:col-span-9 space-y-6">
          
          {message && (
            <div className={`p-4 border rounded-xl font-bold text-xs flex items-center gap-2 text-left animate-fade-in ${
              isSuccess 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {isSuccess ? <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" /> : <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />}
              {message}
            </div>
          )}

          <form onSubmit={handleManualSave} className="space-y-6">
            
            {/* SUB-TAB 1: META FACEBOOK PIXEL */}
            {activeSubTab === 'meta' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 text-left">
                
                {/* Header Toggle */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-blue-650 text-sm flex items-center gap-1.5 uppercase">
                      🔵 Meta (Facebook) Pixel Manager
                    </h3>
                    <p className="text-[10px] text-slate-400">মেটা ব্রাউজার ট্র্যাকিং এবং সার্ভার সাইড কনভার্সন এপিআই (CAPI) একত্রে কনফিগার করুন।</p>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-slate-50 border px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-slate-500">মাস্টার স্ট্যাটাস:</span>
                    <button
                      type="button"
                      disabled={userRole !== 'Admin'}
                      onClick={() => handleToggle('fb_pixel_enabled', pixelEnabled)}
                      className="cursor-pointer focus:outline-none"
                    >
                      {pixelEnabled ? (
                        <ToggleRight className="h-7 w-7 text-blue-600 font-bold" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 text-slate-300" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Configurations parameters */}
                <div className="space-y-4">
                  
                  {/* Meta Pixel ID Form */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-extrabold text-slate-700 tracking-wide uppercase">Meta Pixel ID:</label>
                      <span className="text-[9px] text-slate-400 block font-normal">যেমন: ১৫ ডিজিটের আইডি</span>
                    </div>
                    <div className="md:col-span-3 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="যেমন: 1145959524284032"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-blue-500 font-bold"
                        value={pixelId}
                        onChange={(e) => {
                          setPixelId(e.target.value);
                          if (autoSaveEnabled) triggerAutoSave();
                        }}
                        onBlur={() => triggerAutoSave()}
                        disabled={userRole !== 'Admin'}
                      />
                      {pixelId && (
                        <button
                          type="button"
                          onClick={() => handleClearField('meta')}
                          className="px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Enable Advanced Matching */}
                  <div className="p-3 bg-blue-50/30 rounded-xl border border-blue-100/50 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 font-extrabold text-blue-900 text-xs uppercase">
                        🛡️ Enable Advanced Matching (উন্নত ম্যাচিং)
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        মেটা পিক্সেলের জন্য কাস্টমারের ফোন নম্বর, নাম, ইমেইল সিকিউর SHA-256 হ্যাশ সংস্করণে মেটার কাছে ব্রাউজারে ট্রিগার করুন।
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={userRole !== 'Admin'}
                      onClick={() => handleToggle('fb_advanced_matching', advancedMatching)}
                      className="cursor-pointer focus:outline-none"
                    >
                      {advancedMatching ? (
                        <ToggleRight className="h-6 w-6 text-blue-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-slate-300" />
                      )}
                    </button>
                  </div>

                  {/* Conversion API Toggle */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 font-extrabold text-slate-800 text-xs uppercase">
                          ⚡ Enable Conversion API (CAPI)
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          আইওএস এবং সাফারির ব্রাউজার অ্যাড-ব্লকার এড়াতে, অর্ডার করার সাথে সাথে সরাসরি সার্ভার থেকে পিক্সেল ইভেন্ট পোস্ট করা হবে।
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={userRole !== 'Admin'}
                        onClick={() => handleToggle('fb_capi_enabled', capiEnabled)}
                        className="cursor-pointer focus:outline-none"
                      >
                        {capiEnabled ? (
                          <ToggleRight className="h-6 w-6 text-blue-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-slate-300" />
                        )}
                      </button>
                    </div>

                    {capiEnabled && (
                      <div className="pt-2 border-t border-slate-200 space-y-1.5 animate-fade-in text-left">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Conversion API Token (কনভার্সন এপিআই টোকেন):</label>
                        <div className="flex gap-2.5">
                          <textarea 
                            rows={3}
                            placeholder="যেমন: EAAMY12ZCBQswBRQ..."
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[10px] text-slate-800 font-mono focus:outline-none focus:border-blue-500 leading-normal font-medium"
                            value={capiToken}
                            onChange={(e) => {
                              setCapiToken(e.target.value);
                            }}
                            onBlur={() => triggerAutoSave()}
                            disabled={userRole !== 'Admin'}
                          />
                          {capiToken && (
                            <button
                              type="button"
                              onClick={() => handleClearField('meta_token')}
                              className="px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition self-stretch flex items-center justify-center cursor-pointer"
                              title="টোকেন রিসেট"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enable or Disable Test Event Code */}
                  <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 font-extrabold text-amber-805 text-xs uppercase">
                          🔬 Enable meta Test Event Code
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          ফেসবুক ইভেন্ট ম্যানেজার "Test Events" ট্যাবে লাইভ রিয়েল টাইম ব্রাউজার ও এপিআই ট্র্যাকিং ভেরিফাই করতে সাহায্য করবে।
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={userRole !== 'Admin'}
                        onClick={() => handleToggle('fb_test_event_enabled', testEventEnabled)}
                        className="cursor-pointer focus:outline-none"
                      >
                        {testEventEnabled ? (
                          <ToggleRight className="h-6 w-6 text-amber-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-slate-300" />
                        )}
                      </button>
                    </div>

                    {testEventEnabled && (
                      <div className="pt-2 border-t border-amber-100 space-y-2 animate-fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Code (যেমন: TEST53493):</label>
                            <input 
                              type="text"
                              placeholder="যেমন: TEST53493"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-amber-500"
                              value={testEventCode}
                              onChange={(e) => {
                                setTestEventCode(e.target.value);
                                if (!fbTestEventCreatedAt) {
                                  setFbTestEventCreatedAt(Date.now());
                                }
                                if (autoSaveEnabled) triggerAutoSave();
                              }}
                              onBlur={() => triggerAutoSave()}
                              disabled={userRole !== 'Admin'}
                            />
                          </div>
                          
                          {/* 24-hours expiration info badge */}
                          {fbTestEventCreatedAt && (
                            <div className="bg-amber-100/60 p-2.5 rounded-xl border border-amber-200 text-amber-800 text-[10px] flex items-center gap-1.5 shrink-0">
                              <Clock className="h-4 w-4 text-amber-600" />
                              <div>
                                <span className="font-extrabold block text-left">২৪-ঘণ্টা অটো ডিলিট সক্রিয়:</span>
                                <span className="font-mono text-[9px] block text-left">{fbHoursRemaining || 'হিসাব করা হচ্ছে...'} অবশিষ্ট</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-amber-700 font-medium">
                          <strong>Note:</strong> এটি শুধুমাত্র লাইভ ইভেন্ট টেস্টিং এর ক্ষেত্রে ব্যবহার করবেন। টেস্টিং শেষে বন্ধ করার নির্দেশ রইল। ইভেন্টটি ২৪ ঘণ্টা পর সিস্টেম নিজে থেকেই সরিয়ে দেবে।
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* SUB-TAB 2: TIKTOK PIXEL */}
            {activeSubTab === 'tiktok' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 text-left">
                
                {/* Header Toggle */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-rose-550 text-sm flex items-center gap-1.5 uppercase">
                      🎵 TikTok Pixel & Conversions Manager
                    </h3>
                    <p className="text-[10px] text-slate-400">টিকটক অ্যাডভার্টাইজিং লাইভ ট্র্যাক করুন। পিক্সেল ম্যাচিং ও এপিআই কোড অটোমেটিক সংরক্ষণ হবে।</p>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-slate-50 border px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-slate-500">মাস্টার স্ট্যাটাস:</span>
                    <button
                      type="button"
                      disabled={userRole !== 'Admin'}
                      onClick={() => handleToggle('tiktok_pixel_enabled', tiktokPixelEnabled)}
                      className="cursor-pointer focus:outline-none"
                    >
                      {tiktokPixelEnabled ? (
                        <ToggleRight className="h-7 w-7 text-rose-600" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 text-slate-300" />
                      )}
                    </button>
                  </div>
                </div>

                {/* TikTok Beta Alert */}
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-800 text-[10px] flex gap-2 items-center">
                  <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                  <div>
                    <strong>TikTok Tag Integration Enhanced:</strong> TikTok Tag integration standard pixel, advanced client-side identity matching, and proxy-based server API are fully loaded.
                  </div>
                </div>

                {/* Configurations parameters */}
                <div className="space-y-4">
                  
                  {/* TikTok Pixel Code */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-extrabold text-slate-700 tracking-wide uppercase">TikTok Pixel ID:</label>
                      <span className="text-[9px] text-slate-400 block font-normal">যেমন: D4BGUOBC77...</span>
                    </div>
                    <div className="md:col-span-3 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="যেমন: D4BGUOBC77U50IDU7R7G"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-none focus:bg-white focus:border-rose-500"
                        value={tiktokPixelId}
                        onChange={(e) => {
                          setTiktokPixelId(e.target.value);
                          if (autoSaveEnabled) triggerAutoSave();
                        }}
                        onBlur={() => triggerAutoSave()}
                        disabled={userRole !== 'Admin'}
                      />
                      {tiktokPixelId && (
                        <button
                          type="button"
                          onClick={() => handleClearField('tiktok')}
                          className="px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Enable Advanced Matching */}
                  <div className="p-3 bg-rose-50/30 rounded-xl border border-rose-100/50 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 font-extrabold text-rose-900 text-xs uppercase">
                        🛡️ Enable TikTok Advanced Matching
                      </div>
                      <p className="text-[10px] text-slate-550 leading-normal">
                        গ্রাহকের ফোন নাম্বার ও ইমেইল টিকটক অ্যালগরিদমের কাছে সুরক্ষিত হ্যাশড ভার্সনে পাঠিয়ে অ্যাড নোটিফিকেশন বুস্ট করুন।
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={userRole !== 'Admin'}
                      onClick={() => handleToggle('tiktok_advanced_matching', tiktokAdvancedMatching)}
                      className="cursor-pointer focus:outline-none"
                    >
                      {tiktokAdvancedMatching ? (
                        <ToggleRight className="h-6 w-6 text-rose-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-slate-300" />
                      )}
                    </button>
                  </div>

                  {/* TikTok Conversion API Toggle */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 font-extrabold text-slate-800 text-xs uppercase">
                          ⚡ Enable TikTok Conversion API (CAPI)
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          সাফারি ব্রাউজারের থার্ডপার্টি কুঁকি রেস্ট্রিকশন এড়াতে অর্ডার প্লেসের সাথে সাথে ডায়রেক্ট টিকটক ডেটা এপিআইতে রেকর্ড ট্রিগার করুন।
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={userRole !== 'Admin'}
                        onClick={() => handleToggle('tiktok_capi_enabled', tiktokCapiEnabled)}
                        className="cursor-pointer focus:outline-none"
                      >
                        {tiktokCapiEnabled ? (
                          <ToggleRight className="h-6 w-6 text-rose-650" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-slate-300" />
                        )}
                      </button>
                    </div>

                    {tiktokCapiEnabled && (
                      <div className="pt-2 border-t border-slate-200 space-y-1.5 animate-fade-in text-left">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">TikTok Access Token:</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="যেমন: 16807aa7f71cfb25c5598e2459e3acc9487be9cc"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-rose-500 font-medium"
                            value={tiktokAccessToken}
                            onChange={(e) => {
                              setTiktokAccessToken(e.target.value);
                            }}
                            onBlur={() => triggerAutoSave()}
                            disabled={userRole !== 'Admin'}
                          />
                          {tiktokAccessToken && (
                            <button
                              type="button"
                              onClick={() => handleClearField('tiktok_token')}
                              className="px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition cursor-pointer flex items-center justify-center font-bold"
                              title="টোকেন রিসেট"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TikTok Test Event Code */}
                  <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 font-extrabold text-amber-800 text-xs uppercase">
                          🔬 Enable TikTok Test Event Code
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          টিকটক ইভেন্ট ম্যানেজারে "Test Events" সেকশনে লাইভ ট্র্যাকিং ইন্সট্যান্ট চেক করার টেস্ট কি সংযুক্ত কোড যোগ করুন।
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={userRole !== 'Admin'}
                        onClick={() => handleToggle('tiktok_test_event_enabled', tiktokTestEventEnabled)}
                        className="cursor-pointer focus:outline-none"
                      >
                        {tiktokTestEventEnabled ? (
                          <ToggleRight className="h-6 w-6 text-amber-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-slate-300" />
                        )}
                      </button>
                    </div>

                    {tiktokTestEventEnabled && (
                      <div className="pt-2 border-t border-amber-100 space-y-2 animate-fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">TikTok Test Code (যেমন: tt_test_code):</label>
                            <input 
                              type="text"
                              placeholder="যেমন: TEST_CO921820"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-amber-550"
                              value={tiktokTestEventCode}
                              onChange={(e) => {
                                setTiktokTestEventCode(e.target.value);
                                if (!tiktokTestEventCreatedAt) {
                                  setTiktokTestEventCreatedAt(Date.now());
                                }
                                if (autoSaveEnabled) triggerAutoSave();
                              }}
                              onBlur={() => triggerAutoSave()}
                              disabled={userRole !== 'Admin'}
                            />
                          </div>
                          
                          {tiktokTestEventCreatedAt && (
                            <div className="bg-amber-100/60 p-2.5 rounded-xl border border-amber-200 text-amber-800 text-[10px] flex items-center gap-1.5 shrink-0">
                              <Clock className="h-4 w-4 text-amber-600" />
                              <div>
                                <span className="font-extrabold block text-left">২৪-ঘণ্টা অটো রিমুভ ট্র্যাকার:</span>
                                <span className="font-mono text-[9px] block text-left">{tiktokHoursRemaining || 'হিসাব করা হচ্ছে...'} অবশিষ্ট</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* SUB-TAB 3: CUSTOM SCRIPTS & GOOGLE ANALYTICS */}
            {activeSubTab === 'snippets' && (
              <div className="space-y-6 text-left">
                
                {/* Google Analytics ID */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Globe className="h-4.5 w-4.5 text-indigo-500" />
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs uppercase">🌐 Google Analytics 4 (GA4) Global Tracking</h4>
                      <p className="text-[10px] text-slate-400">গুগল এনালাইটিক্স ট্র্যাকিং কোড বা মেজারমেন্ট আইডি সরাসরি প্লেস করুন।</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-extrabold text-slate-700 tracking-wide uppercase">Measurement ID:</label>
                      <span className="text-[9px] text-slate-400 block font-normal">যেমন: G-XXXXXXXXXX</span>
                    </div>
                    <div className="md:col-span-3 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="G-XXXXXX"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-none focus:bg-white focus:border-indigo-500"
                        value={gaId}
                        onChange={(e) => {
                          setGaId(e.target.value);
                          if (autoSaveEnabled) triggerAutoSave();
                        }}
                        onBlur={() => triggerAutoSave()}
                        disabled={userRole !== 'Admin'}
                      />
                      {gaId && (
                        <button
                          type="button"
                          onClick={() => handleClearField('ga')}
                          className="px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Custom Code Sniplets */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase">
                        <Code className="h-4 w-4 text-orange-500" /> Header Code Snippets (&lt;head&gt;)
                      </h4>
                      <p className="text-[10px] text-slate-400">ডোমেইন ওনারশিপ ট্যাগ, কাস্টম CSS বা মেটা ভেরিফিকেশন কোড।</p>
                    </div>
                    <span className="text-[9px] bg-slate-50 px-2 py-0.5 rounded text-slate-400 font-mono border font-extrabold shrink-0">Head শেষের আগে ইনজেক্ট হবে</span>
                  </div>

                  <textarea
                    rows={5}
                    placeholder="<!-- Insert Header Scripts, CSS stylesheets here -->"
                    className="w-full px-3 py-2 bg-slate-950 text-slate-150 border border-slate-800 rounded-xl text-xs font-mono focus:outline-none leading-relaxed"
                    value={headerSnippets}
                    onChange={(e) => {
                      setHeaderSnippets(e.target.value);
                    }}
                    onBlur={() => triggerAutoSave()}
                    disabled={userRole !== 'Admin'}
                  />
                </div>

                {/* Footer Custom Code Sniplets */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase">
                        <Code className="h-4 w-4 text-orange-500" /> Footer Code Snippets (&lt;/body&gt;)
                      </h4>
                      <p className="text-[10px] text-slate-400">কাস্টম চ্যাট উইজেট, লাইভ মেসেঞ্জার স্ক্রিপ্ট, অথবা যেকোনো বডি ট্র্যাকিং কোড।</p>
                    </div>
                    <span className="text-[9px] bg-slate-50 px-2 py-0.5 rounded text-slate-400 font-mono border font-extrabold shrink-0">Body শেষের আগে ইনজেক্ট হবে</span>
                  </div>

                  <textarea
                    rows={5}
                    placeholder="<!-- Insert Footer JavaScript scripts here -->"
                    className="w-full px-3 py-2 bg-slate-950 text-slate-150 border border-slate-800 rounded-xl text-xs font-mono focus:outline-none leading-relaxed"
                    value={footerSnippets}
                    onChange={(e) => {
                      setFooterSnippets(e.target.value);
                    }}
                    onBlur={() => triggerAutoSave()}
                    disabled={userRole !== 'Admin'}
                  />
                </div>

              </div>
            )}

            {/* SUB-TAB 4: WHATSAPP AUTOMATION TRIGER */}
            {activeSubTab === 'whatsapp' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 text-left font-sans">
                
                {/* Header Toggle */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-emerald-600 text-sm flex items-center gap-1.5 uppercase">
                      💬 হোয়াটসঅ্যাপ কাস্টমার অর্ডার নোটিফিকেশন
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">অর্ডার প্লেস করার পর স্বয়ংক্রিয়ভাবে কাস্টমারের হোয়াটসঅ্যাপ নম্বরে কনফার্মেশন পাঠানো সিস্টেম।</p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 bg-slate-50 border px-3 py-1.5 rounded-xl">
                    <span className="text-[9px] font-black uppercase text-slate-500">স্ট্যাটাস:</span>
                    <button
                      type="button"
                      disabled={userRole !== 'Admin'}
                      onClick={() => handleToggle('whatsapp_enabled', whatsappEnabled)}
                      className="cursor-pointer focus:outline-none"
                    >
                      {whatsappEnabled ? (
                        <ToggleRight className="h-7 w-7 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 text-slate-300" />
                      )}
                    </button>
                  </div>
                </div>

                {whatsappEnabled && (
                  <div className="space-y-4 animate-fade-in text-xs sm:text-sm">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Gateway Select */}
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-600 mb-1 uppercase">মেসেজিং গেটওয়ে প্রোভাইডার (GATEWAY PROVIDER)</label>
                        <select
                          disabled={userRole !== 'Admin'}
                          value={whatsappProvider}
                          onChange={(e) => {
                            setWhatsappProvider(e.target.value as any);
                            if (autoSaveEnabled) {
                              setTimeout(() => triggerAutoSave({ whatsapp_provider: e.target.value }), 100);
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-sans focus:outline-none focus:bg-white focus:border-emerald-500 font-bold"
                        >
                          <option value="ultramsg">UltraMsg API (সহজ ও উপযোগী)</option>
                          <option value="greenapi">Green API (দ্রুত ও সিকিউর)</option>
                          <option value="custom_webhook">Custom Webhook / Custom Gateway</option>
                        </select>
                      </div>

                      {/* Instance ID Input (UltraMsg or Green API) */}
                      {whatsappProvider !== 'custom_webhook' ? (
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-600 mb-1 uppercase">হোয়াটসঅ্যাপ ইনস্ট্যান্স আইডি (INSTANCE ID)</label>
                          <input
                            type="text"
                            disabled={userRole !== 'Admin'}
                            placeholder={whatsappProvider === 'ultramsg' ? "যেমন: instance12932" : "যেমন: 1101923412"}
                            value={whatsappInstanceId}
                            onChange={(e) => {
                              setWhatsappInstanceId(e.target.value);
                              if (autoSaveEnabled) triggerAutoSave();
                            }}
                            onBlur={() => triggerAutoSave()}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-emerald-500 font-bold"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center text-[10px] text-amber-700 bg-amber-50 border border-amber-100 p-2.5 rounded-xl font-medium leading-normal">
                          ⚠️ কাস্টম ওয়েব হুক ট্রিগার হলে আপনার দেয়া এন্ডপয়েন্ট লিংকে POST রিকোয়েস্ট মেথডে সরাসরি অর্ডারের ডাটা পাঠানো হবে।
                        </div>
                      )}
                    </div>

                    {/* API Key / Token Field */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">
                        {whatsappProvider === 'custom_webhook' ? 'পোস্ট ওয়েব হুক এন্ডপয়েন্ট লিংক (POST URL)' : 'এপিআই এক্সেস টোকেন (ACCESS TOKEN)'}
                      </label>
                      <input
                        type={whatsappProvider === 'custom_webhook' ? 'text' : 'password'}
                        disabled={userRole !== 'Admin'}
                        placeholder={whatsappProvider === 'custom_webhook' ? "যেমন: https://domain.com/api/webhook" : "যেমন: EAAGno4ZB... বা authorization_token"}
                        value={whatsappToken}
                        onChange={(e) => {
                          setWhatsappToken(e.target.value);
                          if (autoSaveEnabled) triggerAutoSave();
                        }}
                        onBlur={() => triggerAutoSave()}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-emerald-500 font-bold"
                      />
                    </div>

                    {/* WhatsApp Message Template Area */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase">হোয়াটসঅ্যাপ মেসেজ কনটেন্ট টেমপ্লেট:</label>
                        <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase">Dynamic placeholders</span>
                      </div>
                      <textarea
                        rows={7}
                        disabled={userRole !== 'Admin'}
                        value={whatsappMessageTemplate}
                        onChange={(e) => {
                          setWhatsappMessageTemplate(e.target.value);
                        }}
                        onBlur={() => triggerAutoSave()}
                        className="w-full px-3 py-2.5 bg-slate-950 text-slate-150 border border-slate-800 rounded-xl text-xs font-mono focus:outline-none leading-relaxed"
                      />

                      {/* Placeholders helper grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2.5">
                        {[
                          { tag: '{customer_name}', desc: 'গ্রাহকের সম্পূর্ণ নাম' },
                          { tag: '{order_id}', desc: 'সংক্ষিপ্ত অর্ডার আইডি' },
                          { tag: '{order_price}', desc: 'মোট পরিশোধযোগ্য টাকা' },
                          { tag: '{selected_size}', desc: 'সিলেক্টকৃত রেইনকোট সাইজ' },
                          { tag: '{selected_color}', desc: 'সিলেক্টকৃত কালার' },
                          { tag: '{delivery_address}', desc: 'ডেলিভারি ঠিকানা' }
                        ].map((item, id) => (
                          <div key={id} className="p-1.5 bg-slate-50 border border-slate-150 rounded-lg text-[9.5px] text-slate-505 flex flex-col justify-center leading-normal text-left">
                            <span className="font-mono font-black text-indigo-600">{item.tag}</span>
                            <span>{item.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 5: COURIER DELIVERY RATES SETUP */}
            {activeSubTab === 'courier' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 text-left">
                
                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Settings className="h-4 w-4 text-orange-600 animate-spin animate-duration-3000" />
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase text-orange-600">
                      🚚 কুরিয়ার ডেলিভারি চার্জ নির্ধারণ (Courier Configuration)
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">ঢাকা সিটি, সাব ঢাকা এলাকা এবং ঢাকার বাইরের অঞ্চলের জন্য পৃথকভাবে ডেলিভারি চার্জ নির্ধারণ করুন।</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Inside Dhaka */}
                  <div className="p-1 bg-slate-50/50 rounded-xl border">
                    <div className="p-2.5 space-y-1.5 bg-white rounded-lg">
                      <label className="block text-[10px] text-slate-600 font-black uppercase tracking-wide">ঢাকা সিটির মধ্যে:</label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-slate-400">৳</span>
                        <input 
                          type="number" 
                          value={deliveryInside}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setDeliveryInside(val);
                            if (autoSaveEnabled) triggerAutoSave({ raincoat_courier_inside: val });
                          }}
                          onBlur={() => triggerAutoSave()}
                          disabled={userRole !== 'Admin'}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 font-extrabold focus:outline-none focus:bg-white focus:border-orange-500"
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 block font-bold">Default: 80 BDT</span>
                    </div>
                  </div>

                  {/* Sub Dhaka */}
                  <div className="p-1 bg-slate-50/50 rounded-xl border">
                    <div className="p-2.5 space-y-1.5 bg-white rounded-lg">
                      <label className="block text-[10px] text-slate-600 font-black uppercase tracking-wide">সাব ঢাকা এলাকা:</label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-slate-400">৳</span>
                        <input 
                          type="number" 
                          value={deliverySub}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setDeliverySub(val);
                            if (autoSaveEnabled) triggerAutoSave({ raincoat_courier_sub: val });
                          }}
                          onBlur={() => triggerAutoSave()}
                          disabled={userRole !== 'Admin'}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 font-extrabold focus:outline-none focus:bg-white focus:border-orange-500"
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 block font-bold">Default: 100 BDT</span>
                    </div>
                  </div>

                  {/* Outside Dhaka */}
                  <div className="p-1 bg-slate-50/50 rounded-xl border">
                    <div className="p-2.5 space-y-1.5 bg-white rounded-lg">
                      <label className="block text-[10px] text-slate-600 font-black uppercase tracking-wide">ঢাকার বাইরে:</label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-slate-400">৳</span>
                        <input 
                          type="number" 
                          value={deliveryOutside}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setDeliveryOutside(val);
                            if (autoSaveEnabled) triggerAutoSave({ raincoat_courier_outside: val });
                          }}
                          onBlur={() => triggerAutoSave()}
                          disabled={userRole !== 'Admin'}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 font-extrabold focus:outline-none focus:bg-white focus:border-orange-500"
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 block font-bold">Default: 130 BDT</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[10px] text-amber-850 leading-relaxed font-semibold">
                  📌 কাস্টমার যখন অর্ডার ফর্মে তার জেলা বা লোকেশন এরিয়ো সিলেক্ট করবে, তখন সংশ্লিষ্ট ডেলিভারি চার্জটি অটোমেটিক বিলিং কার্টে যোগ হয়ে তার ইনভয়েসে রিয়েল টাইম শো করবে।
                </div>

              </div>
            )}

            {/* SUB-TAB 6: LIVE TRACKING EVENTS DIAGNOSTICS */}
            {activeSubTab === 'logs' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-5 text-left font-sans">
                
                {/* Diagnostics Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-3">
                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase">
                      <Activity className="h-4.5 w-4.5 text-emerald-500 animate-pulse" /> লাইভ ট্র্যাকিং ডায়াগনস্টিকস (Diagnostic Events Monitor)
                    </h3>
                    <p className="text-[10px] text-slate-400">মেটা ব্রাউজার ইভেন্ট, কনভার্সন এপিআই সার্ভার সিঙ্ক এবং টিকটক পিক্সেল রিয়েল টাইম লগ দেখুন।</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {liveEvents.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearEventLogs}
                        className="px-2.5 py-1.5 text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition uppercase tracking-wider shrink-0 cursor-pointer"
                      >
                        ক্লিয়ার লগ
                      </button>
                    )}
                  </div>
                </div>

                {/* Event Simulator Sandbox */}
                <div className="p-4 bg-indigo-50/20 border border-indigo-100 rounded-xl space-y-2.5">
                  <span className="text-[10px] font-black uppercase text-indigo-900 flex items-center gap-1">
                    🎯 Pixel Simulator Sandbox (ইভেন্ট টেস্ট কুঠুরি)
                  </span>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    লাইভ মেটা এবং টিকটক পিক্সেল ফায়ার করাতে এক ক্লিকে নিচের ডামি বাটন চাপুন। এটি সাথে সাথে ব্রাউজার কনসোল এবং ডায়াগনস্টিকসে রিফ্লেক্ট হবে।
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSimulateEvent('PageView')}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold shadow hover:bg-blue-700 transition cursor-pointer"
                    >
                      PageView ফায়ার করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateEvent('InitiateCheckout')}
                      className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-[10px] font-bold shadow hover:bg-amber-700 transition cursor-pointer"
                    >
                      InitiateCheckout ফায়ার করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateEvent('Purchase')}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold shadow hover:bg-emerald-700 transition cursor-pointer"
                    >
                      Complete Purchase ফায়ার করুন
                    </button>
                  </div>
                </div>

                {/* Event Logs List */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-widest">লাইভ ক্যাপচার্ড ইভেন্ট সমূহ ({liveEvents.length})</span>
                  
                  {liveEvents.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border space-y-1.5 rounded-xl border-dashed">
                      <RefreshCw className="h-6 w-6 text-slate-350 animate-spin mx-auto" />
                      <p className="text-xs font-bold text-slate-600 uppercase">কোনো লাইভ ইভেন্ট ফায়ার হয়নি!</p>
                      <p className="text-[10px] text-slate-400">উপরে সিমুলেটর দিয়ে বা কাস্টমার শপ পেজ ভিজিট করলে এখানে ট্র্যাকিং রেকর্ড সরাসরি ধরা পড়বে।</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                      {liveEvents.map((event, id) => (
                        <div key={id} className="p-3 bg-slate-900 border border-slate-800 text-white rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold flex-wrap gap-2">
                            <span className="p-1 px-2.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded font-bold uppercase font-mono tracking-wider">
                              {event.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{event.time}</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-1 border-t border-slate-800/80 pt-1.5">
                            {/* Browser Tag State */}
                            <div className="bg-slate-950 p-1.5 px-2 rounded-lg text-[10px] font-bold flex flex-col">
                              <span className="text-slate-400 text-[8px] uppercase font-black">Browser Tag:</span>
                              <span className="text-blue-400 flex items-center gap-1 font-mono">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" /> Tracked
                              </span>
                            </div>

                            {/* Meta CAPI State */}
                            <div className="bg-slate-950 p-1.5 px-2 rounded-lg text-[10px] font-bold flex flex-col">
                              <span className="text-slate-400 text-[8px] uppercase font-black">Meta CAPI Proxy:</span>
                              <span className={event.capiStatus === 'success' ? 'text-emerald-400' : 'text-slate-400'}>
                                {event.capiStatus === 'success' ? '📡 Sent Success' : '⌛ No Token'}
                              </span>
                            </div>

                            {/* TikTok State */}
                            <div className="bg-slate-950 p-1.5 px-2 rounded-lg text-[10px] font-bold flex flex-col col-span-2 sm:col-span-1">
                              <span className="text-slate-400 text-[8px] uppercase font-black">TikTok CAPI:</span>
                              <span className="text-rose-400 flex items-center gap-1 font-mono">
                                🎵 Multi-Channel
                              </span>
                            </div>
                          </div>

                          <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-400">
                            <span className="font-mono truncate">ID: {event.id}</span>
                            <button
                              type="button"
                              onClick={() => setInspectingEventId(inspectingEventId === event.id ? null : event.id)}
                              className="text-indigo-400 hover:text-indigo-300 font-extrabold uppercase transition cursor-pointer"
                            >
                              {inspectingEventId === event.id ? 'প্যারামিটার বন্ধ করুন' : 'প্যারামিটার দেখুন'}
                            </button>
                          </div>

                          {inspectingEventId === event.id && (
                            <div className="mt-2 bg-black text-[10.5px] font-mono p-2.5 rounded-lg border border-slate-800 space-y-2 leading-relaxed whitespace-pre-wrap max-h-[140px] overflow-y-auto">
                              <div className="text-amber-400 font-extrabold">Data Properties:</div>
                              <div className="text-slate-300 text-[10px]">{JSON.stringify(event.customData, null, 2)}</div>
                              {event.matchingData && Object.keys(event.matchingData).length > 0 && (
                                <div className="pt-1 border-t border-slate-850">
                                  <div className="text-indigo-400 font-extrabold">Hashed Matchings:</div>
                                  <div className="text-slate-400 text-[9.5px]">{JSON.stringify(event.matchingData, null, 2)}</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* General Save Manual Bar */}
            {userRole === "Admin" && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-extrabold tracking-wide text-slate-700 uppercase">💾 ম্যানুয়াল ড্রাফট সংরক্ষণ</span>
                  <p className="text-[10px] text-slate-400">ইন্সট্যান্ট ফায়ারবেস ক্লাউড ডেটাবেজ ও ব্রাউজার লোকাল মেমরিতে সেটিংস সেভ করতে রাইট বাটন চাপুন।</p>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 border border-slate-950 text-white rounded-xl font-bold hover:bg-black transition flex items-center justify-center gap-2 text-xs cursor-pointer shadow hover:shadow-md"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-white" /> সংরক্ষণ হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 text-emerald-400" /> সেটিংস সংরক্ষণ করুন
                    </>
                  )}
                </button>
              </div>
            )}

          </form>

        </div>

      </div>

    </div>
  );
}
