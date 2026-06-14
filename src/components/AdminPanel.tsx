import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye, ShieldAlert, Trash2, ClipboardCopy, FileSpreadsheet, Search, 
  RefreshCw, X, ShieldCheck, CheckSquare, Globe, Database, Sparkles, 
  Check, ExternalLink, HelpCircle, Flame, ChevronDown, ChevronUp,
  Lock, Key, LogOut, Settings, ListTodo, AlertOctagon, Layers, Users, Calendar, Phone,
  Edit, CheckCircle, Printer, Volume2, VolumeX
} from 'lucide-react';
import { RaincoatOrder, Size, ProductColor, IncompleteOrder } from '../types';
import { 
  getSheetsConfig, 
  saveSheetsConfig, 
  disconnectSheets, 
  getAccessToken, 
  initiateSheetsAuth, 
  createNewSpreadsheet, 
  syncAllOrdersToSheet 
} from '../lib/googleSheets';

import { 
  getOrdersFromFirestore, 
  getIncompleteOrdersFromFirestore, 
  deleteOrderFromFirestore, 
  deleteIncompleteOrderFromFirestore, 
  updateOrderInFirestore,
  addOrderToFirestore,
  sendFirebasePasswordReset,
  getAdvancedAddonsSettingsFromFirestore,
  db,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';

import { trackPixelEvent, trackTikTokEvent } from '../lib/tracking';
import { normalizeWhatsAppPhone } from '../lib/whatsapp';

import PagesAdmin from './admin/PagesAdmin';
import ProductsAdmin from './admin/ProductsAdmin';
import IntegrationsAdmin from './admin/IntegrationsAdmin';
import UsersAdmin from './admin/UsersAdmin';
import BlockingAdmin from './admin/BlockingAdmin';
import InventoryAdmin from './admin/InventoryAdmin';
import MediaAdmin from './admin/MediaAdmin';
import BannersAdmin from './admin/BannersAdmin';
import LiveVisitorsAdmin from './LiveVisitorsAdmin';
import FraudAdmin from './admin/FraudAdmin';
import AdvancedPluginsAdmin from './admin/AdvancedPluginsAdmin';
import CourierAdmin from './admin/CourierAdmin';
import ReviewsAdmin from './admin/ReviewsAdmin';
import DailyOrdersChart from './admin/DailyOrdersChart';
import CourierMonitorAdmin from './admin/CourierMonitorAdmin';
import SectionCustomizerAdmin from './admin/SectionCustomizerAdmin';

const getEnglishDistrictName = (order: any): string => {
  const districtValue = order.district ? order.district.trim() : '';
  const villageValue = order.village ? order.village.trim() : '';

  const strToSearch = `${districtValue} ${villageValue}`.toLowerCase();

  const districtsMap: { [key: string]: string } = {
    'dhaka': 'Dhaka',
    'munshiganj': 'Munshiganj',
    'munshigonj': 'Munshiganj',
    'narsingdi': 'Narsingdi',
    'narayanganj': 'Narayanganj',
    'narayangonj': 'Narayanganj',
    'manikganj': 'Manikganj',
    'manikgonj': 'Manikganj',
    'mymensingh': 'Mymensingh',
    'gazipur': 'Gazipur',
    'kishoreganj': 'Kishoreganj',
    'kishoregonj': 'Kishoreganj',
    'jamalpur': 'Jamalpur',
    'sherpur': 'Sherpur',
    'netrokona': 'Netrokona',
    'tangail': 'Tangail',
    'faridpur': 'Faridpur',
    'gopalganj': 'Gopalganj',
    'gopalgonj': 'Gopalganj',
    'shariatpur': 'Shariatpur',
    'madaripur': 'Madaripur',
    'rajbari': 'Rajbari',
    'chattogram': 'Chattogram',
    'chittagong': 'Chattogram',
    'cox': 'Cox’s Bazar',
    'cox’s': 'Cox’s Bazar',
    'cox\'s': 'Cox’s Bazar',
    'rangamati': 'Rangamati',
    'bandarban': 'Bandarban',
    'khagrachhari': 'Khagrachhari',
    'khagrachari': 'Khagrachhari',
    'feni': 'Feni',
    'brahmanbaria': 'Brahmanbaria',
    'chandpur': 'Chandpur',
    'rajshahi': 'Rajshahi',
    'natore': 'Natore',
    'naogaon': 'Naogaon',
    'chapainawabganj': 'Chapainawabganj',
    'chapai': 'Chapainawabganj',
    'bogura': 'Bogura',
    'bogra': 'Bogura',
    'pabna': 'Pabna',
    'sirajganj': 'Sirajganj',
    'sirajgonj': 'Sirajganj',
    'joypurhat': 'Joypurhat',
    'rangpur': 'Rangpur',
    'lalmonirhat': 'Lalmonirhat',
    'kurigram': 'Kurigram',
    'nilphamari': 'Nilphamari',
    'gaibandha': 'Gaibandha',
    'panchagarh': 'Panchagarh',
    'dinajpur': 'Dinajpur',
    'khulna': 'Khulna',
    'thakurgaon': 'Thakurgaon',
    'satkhira': 'Satkhira',
    'bagerhat': 'Bagerhat',
    'jashore': 'Jashore',
    'jessore': 'Jashore',
    'jhenaidah': 'Jhenaidah',
    'narail': 'Narail',
    'magura': 'Magura',
    'kushtia': 'Kushtia',
    'chuadanga': 'Chuadanga',
    'meherpur': 'Meherpur',
    'barishal': 'Barishal',
    'barisal': 'Barishal',
    'jhalokati': 'Jhalokati',
    'jhalokathi': 'Jhalokati',
    'pirojpur': 'Pirojpur',
    'patuakhali': 'Patuakhali',
    'barguna': 'Barguna',
    'bhola': 'Bhola',
    'sunamganj': 'Sunamganj',
    'sunamgonj': 'Sunamganj',
    'sylhet': 'Sylhet',
    'habiganj': 'Habiganj',
    'habigonj': 'Habiganj',
    'moulvibazar': 'Moulvibazar',
    'noakhali': 'Noakhali',
    'lakshmipur': 'Lakshmipur',
    'cumilla': 'Cumilla',
    'comilla': 'Cumilla'
  };

  for (const [key, val] of Object.entries(districtsMap)) {
    if (strToSearch.includes(key)) {
      return val;
    }
  }

  const bengaliDistrictsMap: { [key: string]: string } = {
    'ঢাকা': 'Dhaka',
    'মুन्সীগঞ্জ': 'Munshiganj',
    'মুন্সীগঞ্জ': 'Munshiganj',
    'মুন্সিগঞ্জ': 'Munshiganj',
    'নরসিংদী': 'Narsingdi',
    'নরসিংদি': 'Narsingdi',
    'নারায়ণগঞ্জ': 'Narayanganj',
    'নারায়ণগঞ্জ': 'Narayanganj',
    'মানিকগঞ্জ': 'Manikganj',
    'ময়মনসিংহ': 'Mymensingh',
    'ময়মনসিংহ': 'Mymensingh',
    'গাজীপুর': 'Gazipur',
    'কিশোরগঞ্জ': 'Kishoreganj',
    'জামালপুর': 'Jamalpur',
    'শেরপুর': 'Sherpur',
    'নেত্রকোণা': 'Netrokona',
    'নেত্রকোনা': 'Netrokona',
    'টাঙ্গাইল': 'Tangail',
    'ফরিদপুর': 'Faridpur',
    'গোপালগঞ্জ': 'Gopalganj',
    'শরীয়তপুর': 'Shariatpur',
    'শরীয়তপুর': 'Shariatpur',
    'মাদারীপুর': 'Madaripur',
    'রাজবাড়ি': 'Rajbari',
    'রাজবাড়ী': 'Rajbari',
    'রাজবাড়ী': 'Rajbari',
    'চট্টগ্রাম': 'Chattogram',
    'চট্রগ্রাম': 'Chattogram',
    'চিটাগাং': 'Chattogram',
    'কক্সবাজার': 'Cox’s Bazar',
    'কক্স বাজার': 'Cox’s Bazar',
    'রাঙামাটি': 'Rangamati',
    'রাঙ্গামাটি': 'Rangamati',
    'বান্দরবান': 'Bandarban',
    'খাগড়াছড়ি': 'Khagrachhari',
    'খাগড়াছড়ি': 'Khagrachhari',
    'ফেনী': 'Feni',
    'ব্রাহ্মণবাড়িয়া': 'Brahmanbaria',
    'ব্রাহ্মণবাড়িয়া': 'Brahmanbaria',
    'চাঁদপুর': 'Chandpur',
    'রাজশাহী': 'Rajshahi',
    'নাটোর': 'Natore',
    'নওগাঁ': 'Naogaon',
    'নওগা': 'Naogaon',
    'চাঁপাইনওয়াবগঞ্জ': 'Chapainawabganj',
    'চাঁপাইনবাবগঞ্জ': 'Chapainawabganj',
    'চাপাইনবাবগঞ্জ': 'Chapainawabganj',
    'বগুড়া': 'Bogura',
    'বগুড়া': 'Bogura',
    'পাবনা': 'Pabna',
    'সিরাজগঞ্জ': 'Sirajganj',
    'জয়পুরহাট': 'Joypurhat',
    'জয়পুরহাট': 'Joypurhat',
    'রংপুর': 'Rangpur',
    'লালমনিরহাট': 'Lalmonirhat',
    'কুড়িগ্রাম': 'Kurigram',
    'কুড়িগ্রাম': 'Kurigram',
    'নীলফামারী': 'Nilphamari',
    'গাইবান্ধা': 'Gaibandha',
    'পঞ্চগড়': 'Panchagarh',
    'পঞ্চগড়': 'Panchagarh',
    'দিনাজপুর': 'Dinajpur',
    'খুলনা': 'Khulna',
    'ঠাকুরগাঁও': 'Thakurgaon',
    'ঠাকুরগা': 'Thakurgaon',
    'সাতক্ষীরা': 'Satkhira',
    'বাগেরহাট': 'Bagerhat',
    'যশোর': 'Jashore',
    'ঝিনাইদহ': 'Jhenaidah',
    'নড়াইল': 'Narail',
    'নড়াইল': 'Narail',
    'মাগুরা': 'Magura',
    'কুষ্টিয়া': 'Kushtia',
    'কুষ্টিয়া': 'Kushtia',
    'চুয়াডাঙ্গা': 'Chuadanga',
    'চুয়াডাঙ্গা': 'Chuadanga',
    'মেহেরপুর': 'Meherpur',
    'বরিশাল': 'Barishal',
    'ঝালকাঠি': 'Jhalokati',
    'পিরোজপুর': 'Pirojpur',
    'পটুয়াখালী': 'Patuakhali',
    'পটুয়াখালী': 'Patuakhali',
    'বরগুনা': 'Barguna',
    'ভোলা': 'Bhola',
    'সুনামগঞ্জ': 'Sunamganj',
    'সিলেট': 'Sylhet',
    'হবিগঞ্জ': 'Habiganj',
    'মৌলভীবাজার': 'Moulvibazar',
    'নোয়াখালী': 'Noakhali',
    'নোয়াখালী': 'Noakhali',
    'লক্ষ্মীপুর': 'Lakshmipur',
    'লক্ষীপুর': 'Lakshmipur',
    'কুমিল্লা': 'Cumilla'
  };

  for (const [key, val] of Object.entries(bengaliDistrictsMap)) {
    if (strToSearch.includes(key)) {
      return val;
    }
  }

  return 'Other';
};

const ALL_64_DISTRICTS = [
  { en: "Bagerhat", bn: "বাগেরহাট" },
  { en: "Bandarban", bn: "বান্দরবান" },
  { en: "Barguna", bn: "বরগুনা" },
  { en: "Barishal", bn: "বরিশাল" },
  { en: "Bhola", bn: "ভোলা" },
  { en: "Bogura", bn: "বগুড়া" },
  { en: "Brahmanbaria", bn: "ব্রাহ্মণবাড়িয়া" },
  { en: "Chandpur", bn: "চাঁদপুর" },
  { en: "Chapainawabganj", bn: "চাঁপাইনওয়াবগঞ্জ" },
  { en: "Chattogram", bn: "চট্টগ্রাম" },
  { en: "Chuadanga", bn: "চুয়াডাঙ্গা" },
  { en: "Cox’s Bazar", bn: "কক্সবাজার" },
  { en: "Cumilla", bn: "কুমিল্লা" },
  { en: "Dhaka", bn: "ঢাকা" },
  { en: "Dinajpur", bn: "দিনাজপুর" },
  { en: "Faridpur", bn: "ফরিদপুর" },
  { en: "Feni", bn: "ফেনী" },
  { en: "Gaibandha", bn: "গাইবান্ধা" },
  { en: "Gazipur", bn: "গাজীপুর" },
  { en: "Gopalganj", bn: "গোপালগঞ্জ" },
  { en: "Habiganj", bn: "হবিগঞ্জ" },
  { en: "Jamalpur", bn: "জামালপুর" },
  { en: "Jashore", bn: "যশোর" },
  { en: "Jhalokati", bn: "ঝালকাঠি" },
  { en: "Jhenaidah", bn: "ঝিনাইদহ" },
  { en: "Joypurhat", bn: "জয়পুরহাট" },
  { en: "Khagrachhari", bn: "খাগড়াছড়ি" },
  { en: "Khulna", bn: "খুলনা" },
  { en: "Kishoreganj", bn: "কিশোরগঞ্জ" },
  { en: "Kurigram", bn: "কুড়িগ্রাম" },
  { en: "Kushtia", bn: "কুষ্টিয়া" },
  { en: "Lakshmipur", bn: "লক্ষ্মীপুর" },
  { en: "Lalmonirhat", bn: "লালমনিরহাট" },
  { en: "Madaripur", bn: "মাদারীপুর" },
  { en: "Magura", bn: "মাগুরা" },
  { en: "Manikganj", bn: "মানিকগঞ্জ" },
  { en: "Meherpur", bn: "মেহেরপুর" },
  { en: "Moulvibazar", bn: "মৌলভীবাজার" },
  { en: "Munshiganj", bn: "মুন্সীগঞ্জ" },
  { en: "Mymensingh", bn: "ময়মনসিংহ" },
  { en: "Naogaon", bn: "নওগাঁ" },
  { en: "Narail", bn: "নড়াইল" },
  { en: "Narayanganj", bn: "নারায়ণগঞ্জ" },
  { en: "Narsingdi", bn: "নরসিংদী" },
  { en: "Natore", bn: "নাটোর" },
  { en: "Netrokona", bn: "নেত্রকোণা" },
  { en: "Nilphamari", bn: "নীলফামারী" },
  { en: "Noakhali", bn: "নোয়াখালী" },
  { en: "Pabna", bn: "পাবনা" },
  { en: "Panchagarh", bn: "পঞ্চগড়" },
  { en: "Patuakhali", bn: "পটুয়াখালী" },
  { en: "Pirojpur", bn: "পিরোজপুর" },
  { en: "Rajbari", bn: "রাজবাড়ি" },
  { en: "Rajshahi", bn: "রাজশাহী" },
  { en: "Rangamati", bn: "রাঙামাটি" },
  { en: "Rangpur", bn: "রংপুর" },
  { en: "Satkhira", bn: "সাতক্ষীরা" },
  { en: "Shariatpur", bn: "শরীয়তপুর" },
  { en: "Sherpur", bn: "শেরপুর" },
  { en: "Sirajganj", bn: "সিরাজগঞ্জ" },
  { en: "Sunamganj", bn: "সুনামগঞ্জ" },
  { en: "Sylhet", bn: "সিলেট" },
  { en: "Tangail", bn: "টাঙ্গাইল" },
  { en: "Thakurgaon", bn: "ঠাকুরগাঁও" }
];

interface AdminPanelProps {
  onClose: () => void;
  onRefreshOrdersCount: () => void;
  onRefreshPages?: () => void;
  onRefreshProducts?: () => void;
}

export default function AdminPanel({ onClose, onRefreshOrdersCount, onRefreshPages, onRefreshProducts }: AdminPanelProps) {
  const [orders, setOrders] = useState<RaincoatOrder[]>([]);
  const [incompleteOrders, setIncompleteOrders] = useState<IncompleteOrder[]>([]);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [deletingIncompleteId, setDeletingIncompleteId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<RaincoatOrder | null>(null);
  const [activeTab, setActiveTab] = useState<'completed' | 'incomplete' | 'pages' | 'products' | 'banners' | 'inventory' | 'integrations' | 'users' | 'blocking' | 'media' | 'live-visitors' | 'fraud' | 'advanced_addons' | 'courier_hub' | 'reviews_hub' | 'courier_connections' | 'courier_monitor' | 'section_customizer'>('completed');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSize, setFilterSize] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterDistrict, setFilterDistrict] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [copiedMessage, setCopiedMessage] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showPrintLabelModal, setShowPrintLabelModal] = useState(false);
  const [isCreatingTestOrder, setIsCreatingTestOrder] = useState(false);
  
  // Steadfast Sync Status States
  const [courierSettings, setCourierSettings] = useState<any>(null);
  const [steadfastStatuses, setSteadfastStatuses] = useState<{[orderId: string]: { status: string; loading: boolean; error?: string }}>({});
  const [editingTrackingOrderId, setEditingTrackingOrderId] = useState<string | null>(null);
  const [tempTrackingId, setTempTrackingId] = useState<string>('');

  // Completed Orders Pagination States
  const [completedPage, setCompletedPage] = useState<number>(1);
  const [completedPageSize, setCompletedPageSize] = useState<number>(100);

  // Audio Alerts and Toast Notification States
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('admin_orders_sound') !== 'false';
  });
  const [alerts, setAlerts] = useState<Array<{ id: string; order: RaincoatOrder }>>([]);
  const triggeredAlertsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  const playNotificationAudioChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration - 0.05);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(start);
        osc.stop(start + duration);
      };

      const now = ctx.currentTime;
      playTone(523.25, now, 0.15); // C5
      playTone(659.25, now + 0.12, 0.45); // E5
    } catch (err) {
      console.warn("Failed to play notification sound:", err);
    }
  };

  const triggerNewOrderAlert = (order: RaincoatOrder) => {
    if (triggeredAlertsRef.current.has(order.id)) return;
    triggeredAlertsRef.current.add(order.id);

    if (soundEnabled) {
      playNotificationAudioChime();
    }

    const alertId = `${order.id}-${Date.now()}`;
    setAlerts(prev => [...prev, { id: alertId, order }]);

    // Auto close after 12 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    }, 12000);
  };

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem('admin_orders_sound', String(nextVal));
    if (nextVal) {
      playNotificationAudioChime();
    }
  };

  // Load courier settings on mount
  useEffect(() => {
    const loadCourierSettings = async () => {
      try {
        const saved = await getAdvancedAddonsSettingsFromFirestore();
        if (saved) {
          setCourierSettings(saved);
        }
      } catch (err) {
        console.error("Error loading courier settings:", err);
      }
    };
    loadCourierSettings();
  }, []);

  const fetchSteadfastStatus = async (orderId: string) => {
    const apiKey = courierSettings?.steadfast_api_key || 'jtoxickzs13bhwpmmyjk7k9lnxkslet2';
    const secretKey = courierSettings?.steadfast_secret || '9gsts1sioi6pwcaxn71sczml';

    setSteadfastStatuses(prev => ({
      ...prev,
      [orderId]: { status: prev[orderId]?.status || '', loading: true }
    }));

    try {
      // Find the order in the orders state to check if it has a trackingId
      const targetOrder = orders.find(o => o.id === orderId);
      const hasTrackingId = targetOrder?.trackingId;
      const type = hasTrackingId ? 'tracking' : 'invoice';
      const paramVal = hasTrackingId ? targetOrder.trackingId : orderId;

      const response = await fetch(`/api/steadfast/status/${type}/${paramVal}`, {
        headers: {
          'api-key': apiKey,
          'secret-key': secretKey
        }
      });
      const data = await response.json();
      if (data && data.status === 200) {
        setSteadfastStatuses(prev => ({
          ...prev,
          [orderId]: { status: data.delivery_status || 'unknown', loading: false }
        }));
      } else {
        // If query by tracking code fails, fallback to querying by invoice
        if (type === 'tracking') {
          const fbResponse = await fetch(`/api/steadfast/status/invoice/${orderId}`, {
            headers: {
              'api-key': apiKey,
              'secret-key': secretKey
            }
          });
          const fbData = await fbResponse.json();
          if (fbData && fbData.status === 200) {
            setSteadfastStatuses(prev => ({
              ...prev,
              [orderId]: { status: fbData.delivery_status || 'unknown', loading: false }
            }));
            return;
          }
        }

        setSteadfastStatuses(prev => ({
          ...prev,
          [orderId]: { status: 'not_found', loading: false, error: data.message || 'Status not 200' }
        }));
      }
    } catch (err: any) {
      console.error("Error fetching Steadfast status:", err);
      setSteadfastStatuses(prev => ({
        ...prev,
        [orderId]: { status: 'error', loading: false, error: err.message }
      }));
    }
  };

  const handleSaveManualTracking = async (orderId: string, trackingVal: string) => {
    if (!trackingVal.trim()) {
      alert("অনুগ্রহ করে সঠিক কুরিয়ার আইডি প্রদান করুন!");
      return;
    }
    try {
      const orderDocRef = doc(db, 'orders', orderId);
      await updateDoc(orderDocRef, {
        trackingId: trackingVal.trim(),
        courierName: courierSettings?.courier_provider === 'steadfast' ? 'Steadfast' : courierSettings?.courier_provider === 'pathao' ? 'Pathao' : 'RedX',
        status: 'Shipped'
      });
      setEditingTrackingOrderId(null);
      // fetch steadfast status immediately for this manual tracking id
      setTimeout(() => {
        fetchSteadfastStatus(orderId);
      }, 500);
      alert("কুরিয়ার ট্র্যাকিং আইডি সফলভাবে সংরক্ষণ করা হয়েছে!");
    } catch (err: any) {
      alert("ত্রুটি ঘটেছে: " + err.message);
    }
  };

  const getSteadfastStatusLabelAndStyle = (status: string) => {
    switch (status) {
      case 'pending': 
        return { text: 'অপেক্ষমাণ (Pending)', style: 'bg-amber-100 text-amber-800 border-amber-300 border font-bold' };
      case 'delivered_approval_pending':
        return { text: 'Delivered (Approval Pending)', style: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold' };
      case 'partial_delivered_approval_pending':
        return { text: 'Partial Shipped (Approval Pending)', style: 'bg-yellow-100 text-yellow-800 border border-yellow-300 font-bold' };
      case 'cancelled_approval_pending':
        return { text: 'Cancelled (Approval Pending)', style: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold' };
      case 'unknown_approval_pending':
        return { text: 'Unknown (Approval Pending)', style: 'bg-slate-100 text-slate-700 border border-slate-300' };
      case 'delivered':
        return { text: 'ডেলিভারড (Delivered)', style: 'bg-emerald-605 bg-emerald-600 text-white font-extrabold border border-emerald-700 shadow-xs' };
      case 'partial_delivered':
        return { text: 'আংশিক (Partial)', style: 'bg-teal-605 bg-teal-600 text-white font-extrabold border border-teal-700 shadow-xs' };
      case 'cancelled':
        return { text: 'বাতিলকৃত (Cancelled)', style: 'bg-rose-605 bg-rose-600 text-white font-extrabold border border-rose-700 shadow-xs' };
      case 'hold':
        return { text: 'হোল্ড (Hold)', style: 'bg-indigo-100 text-indigo-850 border border-indigo-250 font-bold' };
      case 'in_review':
        return { text: 'রিভিউাধীন (In Review)', style: 'bg-blue-100 text-blue-800 border border-blue-200 font-bold animate-pulse' };
      case 'not_found':
        return { text: 'বুকিং করা হয়নি (No Booking)', style: 'bg-slate-100 text-slate-500 border border-slate-200 font-medium hover:bg-slate-200' };
      case 'error':
        return { text: 'ত্রুটি (Error)', style: 'bg-red-50 text-red-650 border border-red-200 font-semibold' };
      case 'unknown':
      default:
        return { text: status ? `অজানা (${status})` : 'যাচাই করুন', style: 'bg-slate-100 text-slate-600 border border-slate-200 font-bold' };
    }
  };

  // Anti-fraud local/synced blacklist state
  const [blacklist, setBlacklist] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('raincoat_fraud_blacklist') || '[]');
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    // Silent background Firestore synchronization for current scam numbers
    const syncBlacklist = async () => {
      try {
        const { getDocs, collection } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        const querySnapshot = await getDocs(collection(db, 'blacklist'));
        const entries: any[] = [];
        querySnapshot.forEach((doc) => {
          entries.push(doc.data());
        });
        if (entries.length > 0) {
          setBlacklist(entries);
          localStorage.setItem('raincoat_fraud_blacklist', JSON.stringify(entries));
        }
      } catch (e) {}
    };
    syncBlacklist();
  }, [activeTab]);

  const getWhatsAppUrlCompleted = (order: RaincoatOrder) => {
    const formattedPhone = normalizeWhatsAppPhone(order.phone);
    const colorBn = order.color === 'Black' ? 'কালো (Premium Black)' : 'নেভি ব্লু (Classic Navy Blue)';
    const message = `প্রিয় ${order.name},
আপনার রেইনকোটের অর্ডারটি সফলভাবে গৃহীত হয়েছে! 🎉

🛍️ অর্ডার বিবরণ:
- অর্ডার আইডি: #${order.id.replace('ord-', '')}
- সাইজ: ${order.size}
- কালার: ${colorBn}
- পরিশোধযোগ্য সর্বমোট মূল্য: ${order.price} TK (ক্যাশ অন ডেলিভারি, সম্পূর্ণ ফ্রি ডেলিভারি)
- ঠিকানা: ${order.village || ''} ${order.policeStation ? ', থানা: ' + order.policeStation : ''} ${order.district ? ', জেলা: ' + order.district : ''}

পরবর্তী ১২ ঘণ্টার মধ্যে আমাদের প্রতিনিধি আপনার মোবাইল নাম্বারে কল করে অর্ডারটি নিশ্চিত করবেন। অনুগ্রহ করে মোবাইল ফোনটি সচল রাখুন। ধন্যবাদ! 😊`;
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
  };

  const getWhatsAppUrlDraft = (draft: IncompleteOrder) => {
    const formattedPhone = normalizeWhatsAppPhone(draft.phone || '');
    const colorBn = draft.color === 'Black' ? 'কালো (Premium Black)' : 'নেভি ব্লু (Classic Navy Blue)';
    const message = `প্রিয় ${draft.name || 'গ্রাহক'},
আপনার রেইনকোটের রূপরেখাটি ড্রাফট (ইনকমপ্লিট) হিসেবে আমাদের কাছে সংরক্ষিত রয়েছে। 🛍️

আমাদের ডাবল পার্ট প্রিমিয়াম ওয়াটারপ্রুফ রেইনকোটটি আপনার ঠিকানায় ক্যাশ অন ডেলিভারিতে সম্পূর্ণ ফ্রি ডেলিভারি পেতে আপনার ঠিকানা ও সাইজ কনফার্ম করুন।

- সাইজ: ${draft.size || 'XL'}
- কালার: ${colorBn}
- স্পেশাল অফার প্রাইজ: ${draft.price || 550} TK

আপনি যদি অর্ডারটি কনফার্ম করতে চান, অনুগ্রহ করে আমাদের জানান। ধন্যবাদ! 😊`;
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
  };

  const [checkingFraudOrders, setCheckingFraudOrders] = useState<Record<string, boolean>>({});

  const handleSingleOrderFraudCheck = async (orderId: string, phone: string, isCompletedCollection: boolean) => {
    if (!orderId || !phone) return;
    if (checkingFraudOrders[orderId]) return;
    
    setCheckingFraudOrders(prev => ({ ...prev, [orderId]: true }));
    try {
      let customApiKey = '';
      try {
        const cached = localStorage.getItem('raincoat_advanced_addons_fallback');
        if (cached) {
          const parsed = JSON.parse(cached);
          customApiKey = parsed.fraudshield_api_key;
        }
      } catch (_) {}
      
      const { performFraudCheck } = await import('../lib/fraudCheck');
      const result = await performFraudCheck(phone, undefined, customApiKey);

      const { doc, updateDoc } = await import('firebase/firestore');
      const collectionName = isCompletedCollection ? 'orders' : 'incomplete_orders';
      const orderRef = doc(db, collectionName, orderId);
      
      await updateDoc(orderRef, {
        fraudScore: result.score,
        fraudStatus: result.status,
        fraudReason: result.reason
      });

      if (isCompletedCollection) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, fraudScore: result.score, fraudStatus: result.status, fraudReason: result.reason } : o));
      } else {
        setIncompleteOrders(prev => prev.map(o => o.id === orderId ? { ...o, fraudScore: result.score, fraudStatus: result.status, fraudReason: result.reason } : o));
      }
    } catch (err) {
      console.error("Error executing single order fraud check:", err);
    } finally {
      setCheckingFraudOrders(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getPhoneRiskBadge = (phone: string | undefined, order?: any, isCompleted: boolean = true) => {
    if (!phone) return null;
    const clean = phone.replace(/[-\s+]/g, '');
    const isScanning = order && checkingFraudOrders[order.id];

    // Check if order has API-derived fraud characteristics stored
    if (order && order.fraudScore !== undefined) {
      const score = order.fraudScore;
      let scoreBadgeColor = 'bg-emerald-55 bg-emerald-50 text-emerald-700 border-emerald-250 border';
      if (score >= 75) {
        scoreBadgeColor = 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse border';
      } else if (score >= 45) {
        scoreBadgeColor = 'bg-amber-50 text-amber-705 text-amber-850 border-amber-300 border';
      } else if (score >= 20) {
        scoreBadgeColor = 'bg-indigo-50 text-indigo-705 text-indigo-700 border-indigo-200 border';
      }
      return (
        <span 
          className={`inline-flex flex-col items-start gap-1 p-2 rounded-xl text-[9px] font-sans font-extrabold leading-tight ${scoreBadgeColor}`}
          title={order.fraudReason || 'Verified via Fraud API'}
        >
          <span className="flex items-center gap-1">🛡️ এপিআই রিস্ক স্কোর: {score}%</span>
          <span className="text-[7.5px] font-normal text-slate-550 block break-all">{order.fraudReason || 'নিরাপদ কাস্টমার'}</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSingleOrderFraudCheck(order.id, phone, isCompleted);
            }}
            disabled={isScanning}
            className="text-[8px] text-indigo-600 hover:text-indigo-850 font-black underline cursor-pointer shrink-0 mt-0.5"
            title="লাইভ স্ক্যান রি-চেক করুন"
          >
            {isScanning ? 'স্ক্যান হচ্ছে...' : 'রি-চেক স্ক্যান ⚡'}
          </button>
        </span>
      );
    }
    
    const isBlacklisted = blacklist.some((b: any) => b.phone === clean);
    if (isBlacklisted) {
      return (
        <span className="inline-flex flex-col gap-1 items-start p-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <span className="text-[9px] font-black uppercase">🚨 ফ্রাড (Blocklisted)</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (order && order.id) handleSingleOrderFraudCheck(order.id, phone, isCompleted);
            }}
            disabled={isScanning}
            className="text-[8px] text-indigo-600 hover:text-indigo-850 font-black underline cursor-pointer"
          >
            {isScanning ? 'স্ক্যান হচ্ছে...' : '১-ক্লিক এপিআই চেক'}
          </button>
        </span>
      );
    }
    
    const isValidFormat = /^(?:\+88|88)?(01[3-9]\d{8})$/.test(clean);
    if (!isValidFormat) {
      return (
        <span className="inline-flex flex-col gap-1 items-start p-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-150">
          <span className="text-[9px] font-bold">⚠️ ভুয়া নাম্বার (Fake/Wrong Size)</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (order && order.id) handleSingleOrderFraudCheck(order.id, phone, isCompleted);
            }}
            disabled={isScanning}
            className="text-[8px] text-indigo-600 hover:text-indigo-850 font-black underline cursor-pointer"
          >
            {isScanning ? 'স্ক্যান হচ্ছে...' : '১-ক্লিক এপিআই চেক'}
          </button>
        </span>
      );
    }
    
    const count = orders.filter(o => o.phone.replace(/[-\s+]/g, '') === clean).length;
    if (count > 2) {
      return (
        <span className="inline-flex flex-col gap-1 items-start p-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
          <span className="text-[9px] font-bold">⚠️ বারবার অর্ডার ({count} বার)</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (order && order.id) handleSingleOrderFraudCheck(order.id, phone, isCompleted);
            }}
            disabled={isScanning}
            className="text-[8px] text-indigo-500 hover:text-indigo-700 font-extrabold underline cursor-pointer"
          >
            {isScanning ? 'স্ক্যান হচ্ছে...' : '১-ক্লিক এপিআই চেক'}
          </button>
        </span>
      );
    }
    
    return (
      <span className="inline-flex flex-col gap-1 items-start p-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
        <span className="text-[9px] font-bold">🛡️ আনচেকড (Safe Potential)</span>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (order && order.id) {
              handleSingleOrderFraudCheck(order.id, phone, isCompleted);
            }
          }}
          disabled={isScanning}
          className="text-[8.5px] text-indigo-600 hover:text-indigo-850 font-black underline cursor-pointer"
        >
          {isScanning ? (
            <span className="animate-pulse">স্ক্যান হচ্ছে...</span>
          ) : (
            <span>১-ক্লিক এপিআই চেক</span>
          )}
        </button>
      </span>
    );
  };

  // Custom multi-user support
  const [currentUser, setCurrentUser] = useState(() => {
    return sessionStorage.getItem('admin_user_name') || 'admin';
  });
  const [userRole, setUserRole] = useState<'Admin' | 'Editor' | 'ReadOnly'>(() => {
    return (sessionStorage.getItem('admin_user_role') as any) || 'Admin';
  });

  // Calculate dynamic fine-grained permissions for logged in user state
  const getUserPermissions = () => {
    const activeName = currentUser || sessionStorage.getItem('admin_user_name') || 'admin';
    if (activeName === 'admin' || userRole === 'Admin') {
      return { canEdit: true, canDelete: true };
    }
    try {
      const teamUsers = JSON.parse(localStorage.getItem('raincoat_team_users') || '[]');
      const matched = teamUsers.find((u: any) => u.username === activeName);
      if (matched) {
        return {
          canEdit: matched.canEdit !== false,
          canDelete: matched.canDelete === true
        };
      }
    } catch (e) {}
    return {
      canEdit: userRole !== 'ReadOnly',
      canDelete: userRole === 'Admin'
    };
  };

  const perms = getUserPermissions();

  // Admin access auth states
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('admin_logged_in') === 'true';
  });
  const [adminUsername, setAdminUsername] = useState(() => {
    const stored = localStorage.getItem('admin_username');
    if (!stored || stored === 'admin') {
      localStorage.setItem('admin_username', 'sobpabe');
      return 'sobpabe';
    }
    return stored;
  });
  const [adminPassword, setAdminPassword] = useState(() => {
    const stored = localStorage.getItem('admin_password');
    if (!stored || stored === '123456') {
      localStorage.setItem('admin_password', 'Ashik@@9');
      return 'Ashik@@9';
    }
    return stored;
  });
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Password changing and settings panel state
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showPwdChange, setShowPwdChange] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdChangeSuccess, setPwdChangeSuccess] = useState('');

  // Password reset via Firebase Auth states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('vaiyashare@gmail.com');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  // Google Sheets state handling
  const [showSheetsSection, setShowSheetsSection] = useState(false);
  const [sheetsConfig, setSheetsConfig] = useState(getSheetsConfig());
  const [clientId, setClientId] = useState(sheetsConfig.clientId);
  const [spreadsheetId, setSpreadsheetId] = useState(sheetsConfig.spreadsheetId);
  const [autoSync, setAutoSync] = useState(sheetsConfig.autoSync);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [sheetsFeedback, setSheetsFeedback] = useState<{ message: string; type: 'info' | 'success' | 'error' | null }>({ message: '', type: null });

  const loadIncompleteOrders = async () => {
    try {
      const fbIncompletes = await getIncompleteOrdersFromFirestore();
      const sorted = [...fbIncompletes].sort((a: any, b: any) => new Date(b.lastUpdatedAt || b.createdAt).getTime() - new Date(a.lastUpdatedAt || a.createdAt).getTime());
      setIncompleteOrders(sorted);
    } catch (e) {
      console.error("Failed to load incomplete orders from Firestore:", e);
    }
  };

  const handleCreateTestOrder = async () => {
    setIsCreatingTestOrder(true);
    try {
      const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      const now = new Date().toISOString();
      const mockOrder = {
        id: orderId,
        name: 'অভিষেক দেবনাথ',
        village: '১৬২, কাজীপুর রোড, শান্তিবাগ',
        policeStation: 'পল্টন',
        district: 'ঢাকা',
        phone: '01712345678',
        size: 'XL',
        color: 'Navy Blue',
        weight: 74,
        heightFeet: 5,
        heightInches: 8,
        price: 1650,
        status: 'Pending',
        isConfirmed: false,
        bikeModel: 'Yamaha FZS V3',
        createdAt: now,
        fraudScore: 8,
        fraudStatus: 'Safe',
        fraudReason: 'সিস্টেম টেস্ট অর্ডার',
        orderNotes: 'টেস্ট রেইনকোট অর্ডার (লাইভ ট্র্যাকিং চেক)',
        whatsappConsent: true,
        synced: true
      };
      await addOrderToFirestore(mockOrder as any);
      alert(`টেস্ট অর্ডার সফলভাবে তৈরি হয়েছে! ID: ${orderId}`);
    } catch (err: any) {
      alert(`টেস্ট অর্ডার তৈরি ব্যর্থ হয়েছে: ${err.message || err}`);
    } finally {
      setIsCreatingTestOrder(false);
    }
  };

  const loadOrders = async () => {
    onRefreshOrdersCount();

    // Fetch active e-commerce orders from Firestore database
    try {
      const fbOrders = await getOrdersFromFirestore();
      const sortedOrders = [...fbOrders].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      setOrders(sortedOrders);
      
      await loadIncompleteOrders();
      onRefreshOrdersCount();
    } catch (err) {
      console.warn("Could not connect database or read Firestore records:", err);
    }
  };

  useEffect(() => {
    loadOrders();
    // Pre-expand Google Sheets section if already integrated to show status
    const config = getSheetsConfig();
    if (config.connectedEmail || config.spreadsheetId) {
      setShowSheetsSection(true);
    }

    // Set up real-time listener for orders in Firestore
    const qOrders = query(collection(db, 'orders'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      // Check for actually added documents after initial load
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !isInitialLoadRef.current) {
          const newOrder = change.doc.data() as RaincoatOrder;
          triggerNewOrderAlert(newOrder);
        }
      });
      isInitialLoadRef.current = false;

      const fbOrders: RaincoatOrder[] = [];
      snapshot.forEach((doc) => {
        fbOrders.push(doc.data() as RaincoatOrder);
      });
      
      fbOrders.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      
      setOrders(fbOrders);
      onRefreshOrdersCount();
    }, (error) => {
      console.warn("Real-time orders sync error:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      } catch (_) {}
    });

    // Set up real-time listener for incomplete draft orders in Firestore
    const qIncompletes = query(collection(db, 'incompleteOrders'));
    const unsubscribeIncompletes = onSnapshot(qIncompletes, (snapshot) => {
      const fbIncompletes: IncompleteOrder[] = [];
      snapshot.forEach((doc) => {
        fbIncompletes.push(doc.data() as IncompleteOrder);
      });
      
      fbIncompletes.sort((a, b) => new Date(b.lastUpdatedAt || b.createdAt).getTime() - new Date(a.lastUpdatedAt || a.createdAt).getTime());
      
      setIncompleteOrders(fbIncompletes);
      onRefreshOrdersCount();
    }, (error) => {
      console.warn("Real-time incomplete orders sync error:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'incompleteOrders');
      } catch (_) {}
    });

    return () => {
      unsubscribeOrders();
      unsubscribeIncompletes();
    };
  }, [onRefreshOrdersCount]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const cleanUser = loginUser.trim().toLowerCase();
    const cleanPass = loginPass.trim();

    // 1. Force override & auto-repair localStorage if user enters the target credentials
    if (
      (cleanUser === 'sobpabe' && cleanPass === 'Ashik@@9') ||
      (cleanUser === 'ashik' && cleanPass === '123')
    ) {
      localStorage.setItem('admin_username', cleanUser);
      localStorage.setItem('admin_password', cleanPass);
      setAdminUsername(cleanUser);
      setAdminPassword(cleanPass);

      sessionStorage.setItem('admin_logged_in', 'true');
      sessionStorage.setItem('admin_user_name', cleanUser);
      sessionStorage.setItem('admin_user_role', 'Admin');
      setCurrentUser(cleanUser);
      setUserRole('Admin');
      setIsLoggedIn(true);
      return;
    }

    // 2. Check current active admin credentials (as initialized or customized)
    if (cleanUser === adminUsername.toLowerCase() && cleanPass === adminPassword) {
      sessionStorage.setItem('admin_logged_in', 'true');
      sessionStorage.setItem('admin_user_name', adminUsername);
      sessionStorage.setItem('admin_user_role', 'Admin');
      setCurrentUser(adminUsername);
      setUserRole('Admin');
      setIsLoggedIn(true);
      return;
    }

    // 3. Check team users list
    const teamUsersJson = localStorage.getItem('raincoat_team_users');
    if (teamUsersJson) {
      try {
        const teamUsers = JSON.parse(teamUsersJson);
        const matched = teamUsers.find((u: any) => u.username.toLowerCase() === cleanUser && u.passwordHash === cleanPass);
        if (matched) {
          sessionStorage.setItem('admin_logged_in', 'true');
          sessionStorage.setItem('admin_user_name', matched.username);
          sessionStorage.setItem('admin_user_role', matched.role);
          setCurrentUser(matched.username);
          setUserRole(matched.role);
          setIsLoggedIn(true);
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    setLoginError('ভুল ইউজারনেম অথবা পাসওয়ার্ড! আবার চেষ্টা করুন।');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_logged_in');
    sessionStorage.removeItem('admin_user_name');
    sessionStorage.removeItem('admin_user_role');
    setIsLoggedIn(false);
  };

  const handleForceResetAndAutoLogin = () => {
    // 1. Reset storage values instantly
    localStorage.setItem('admin_username', 'sobpabe');
    localStorage.setItem('admin_password', 'Ashik@@9');
    setAdminUsername('sobpabe');
    setAdminPassword('Ashik@@9');

    // Restore team users defaults
    const defaults = [
      { id: '1', username: 'sobpabe', passwordHash: 'Ashik@@9', role: 'Admin', canEdit: true, canDelete: true },
      { id: '2', username: 'editor', passwordHash: '123456', role: 'Editor', canEdit: true, canDelete: false },
      { id: '3', username: 'viewer', passwordHash: '123455', role: 'ReadOnly', canEdit: false, canDelete: false },
    ];
    localStorage.setItem('raincoat_team_users', JSON.stringify(defaults));

    // 2. Setup standard sessionStorage for login
    sessionStorage.setItem('admin_logged_in', 'true');
    sessionStorage.setItem('admin_user_name', 'sobpabe');
    sessionStorage.setItem('admin_user_role', 'Admin');

    // 3. Set React states
    setCurrentUser('sobpabe');
    setUserRole('Admin');
    setIsLoggedIn(true);
  };

  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdChangeSuccess('');
    if (!newUsername.trim() || !newPassword.trim()) {
      alert('ইউজারনেম বা পাসওয়ার্ড খালি হতে পারে না!');
      return;
    }
    localStorage.setItem('admin_username', newUsername.trim());
    localStorage.setItem('admin_password', newPassword.trim());
    setAdminUsername(newUsername.trim());
    setAdminPassword(newPassword.trim());
    setPwdChangeSuccess('সফলভাবে এডমিন লগিন তথ্য পরিবর্তন করা হয়েছে!');
    setNewUsername('');
    setNewPassword('');
    setTimeout(() => {
      setPwdChangeSuccess('');
      setShowPwdChange(false);
    }, 2000);
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetSuccess('');
    setResetError('');
    setIsSendingReset(true);

    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetError('অনুগ্রহ করে একটি সঠিক ইমেল এড্রেস লিখুন!');
      setIsSendingReset(false);
      return;
    }

    try {
      await sendFirebasePasswordReset(resetEmail.trim());
      setResetSuccess('পাসওয়ার্ড রিকভারি রিসেট লিংকটি সফলভাবে আপনার মেইলে পাঠানো হয়েছে। অনুগ্রহ করে স্প্যাম বা ইনবক্স ফোল্ডার চেক করুন!');
    } catch (err: any) {
      console.error(err);
      setResetError('পাসওয়ার্ড রিকভারি লিংক পাঠাতে ব্যর্থ হয়েছে! বিস্তারিত ত্রুটি: ' + (err.message || err));
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleConnectSheets = async () => {
    setSheetsFeedback({ message: '', type: null });
    if (!clientId.trim()) {
      setSheetsFeedback({ message: 'অনুগ্রহ করে প্রথমে আপনার গুগল ক্লাউড কনসোল থেকে প্রাপ্ত Client ID দিন।', type: 'error' });
      return;
    }
    setIsAuthorizing(true);
    setSheetsFeedback({ message: 'গুগল অ্যাকাউন্ট কানেক্ট করা হচ্ছে, অনুগ্রহ করে পপআপ উইন্ডোটি লক্ষ্য করুন...', type: 'info' });
    try {
      await initiateSheetsAuth(clientId);
      const updatedConfig = getSheetsConfig();
      setSheetsConfig(updatedConfig);
      setSheetsFeedback({ message: 'আপনার গুগল অ্যাকাউন্টটি সফলভাবে কানেক্ট হয়েছে!', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setSheetsFeedback({ message: err.message || 'গুগল অ্যাকাউন্ট কানেক্ট করা সম্ভব হয়নি। আবার চেষ্টা করুন।', type: 'error' });
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleCreateNewSheet = async () => {
    setSheetsFeedback({ message: '', type: null });
    const token = getAccessToken();
    if (!token) {
      setSheetsFeedback({ message: 'প্লিজ গুগল অ্যাকাউন্ট রি-অথরাইজ বা কানেক্ট করুন। সেশন টোকেন পাওয়া যায়নি।', type: 'error' });
      return;
    }
    setIsCreatingSheet(true);
    setSheetsFeedback({ message: 'আপনার গুগল ড্রাইভে নতুন স্প্রেডশিট ডেটাব্যাস তৈরি করছি। দয়া করে অপেক্ষা করুন...', type: 'info' });
    try {
      const newSpreadId = await createNewSpreadsheet(token, 'Monsoon Gear - রেইনকোট অর্ডার ডেটাবেস');
      setSpreadsheetId(newSpreadId);
      setSheetsConfig(getSheetsConfig());
      setSheetsFeedback({ message: 'দারুণ! রেইনকোট অর্ডারের জন্য নতুন গুগল স্প্রেডশিট সফলভাবে তৈরি হয়েছে।', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setSheetsFeedback({ message: err.message || 'নতুন গুগল শিট তৈরি করতে ব্যর্থ। ক্লায়েন্ট আইডি ও স্কোপস চেক করুন।', type: 'error' });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleSyncAllOrders = async () => {
    setSheetsFeedback({ message: '', type: null });
    const token = getAccessToken();
    if (!token) {
      setSheetsFeedback({ message: 'গুগল অ্যাকাউন্ট কানেক্টেড নেই বা অথরাইজেশন সেশন শেষ। পুনরায় কানেক্ট বাটনে চাপ দিন।', type: 'error' });
      return;
    }
    if (!spreadsheetId.trim()) {
      setSheetsFeedback({ message: 'সিঙ্ক করার জন্য গুগল স্প্রেডশিট আইডি প্রদান করুন বা বা পাশে থেকে অটো-ক্রিয়েট করুন।', type: 'error' });
      return;
    }
    setIsSyncing(true);
    setSheetsFeedback({ message: `মোট ${orders.length} টি অর্ডার ডেটা গুগল রেইনকোট শিটে সিঙ্ক হচ্ছে...`, type: 'info' });
    try {
      // Save manually defined spreadsheet ID before sync
      saveSheetsConfig({ spreadsheetId: spreadsheetId.trim() });
      const success = await syncAllOrdersToSheet(token, spreadsheetId.trim(), orders);
      if (success) {
        setSheetsConfig(getSheetsConfig());
        setSheetsFeedback({ message: 'অভিনন্দন! সবগুলো অর্ডারের ডেটা গুগল স্প্রেডশিটে সফলভাবে সিঙ্ক ও আপডেট করা হয়েছে।', type: 'success' });
      } else {
        setSheetsFeedback({ message: 'সিঙ্কিং ব্যর্থ হয়েছে। গুগল স্প্রেডশিট এডিটর লিংক এবং কলাম স্ট্যাটাস পরখ করুন।', type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      setSheetsFeedback({ message: err.message || 'সিঙ্কিং সেশনে ত্রুটি ঘটেছে।', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectSheets = () => {
    disconnectSheets();
    setSheetsConfig(getSheetsConfig());
    setClientId('');
    setSpreadsheetId('');
    setAutoSync(false);
    setSheetsFeedback({ message: 'গুগল শিট ইন্টিগ্রেশন সেশন সফলভাবে ডিসকানেক্ট করা হয়েছে।', type: 'info' });
  };

  const handleToggleAutoSync = (checked: boolean) => {
    setAutoSync(checked);
    saveSheetsConfig({ autoSync: checked });
    setSheetsConfig(getSheetsConfig());
  };

  const handleDelete = (id: string) => {
    if (!perms.canDelete) {
      alert('দুঃখিত, আপনার অ্যাকাউন্টে কোনো ডেটা মুছে ফেলার (Delete) অনুমতি দেওয়া হয়নি!');
      return;
    }
    const updated = orders.filter(o => o.id !== id);
    setOrders(updated);
    onRefreshOrdersCount();

    // Delete from Firestore
    deleteOrderFromFirestore(id).catch((err) => {
      console.warn("Failed to delete order from Cloud Firestore database:", err);
    });
    setDeletingOrderId(null);
  };

  const handleDeleteIncomplete = (id: string) => {
    if (!perms.canDelete) {
      alert('দুঃখিত, আপনার অ্যাকাউন্টে ড্রাফট ডেটা মুছে ফেলার (Delete) অনুমতি দেওয়া হয়নি!');
      return;
    }
    const updated = incompleteOrders.filter(o => o.id !== id);
    setIncompleteOrders(updated);

    // Delete from Firestore
    deleteIncompleteOrderFromFirestore(id).catch((err) => {
      console.warn("Failed to delete incomplete draft from Firestore database:", err);
    });
    setDeletingIncompleteId(null);
  };

  const handleClearAllIncomplete = () => {
    if (!perms.canDelete) {
      alert('দুঃখিত, আপনার অ্যাকাউন্টে সব ড্রাফট মুছে ফেলার (Delete) অনুমতি দেওয়া হয়নি!');
      return;
    }
    if (confirm('আপনি নিশ্চিতভাবে সকল ইনকমপ্লিট ড্রাফট মুছে ফেলতে চান?')) {
      // Delete each from Firestore
      incompleteOrders.forEach(o => {
        deleteIncompleteOrderFromFirestore(o.id).catch((err) => {
          console.warn(`Failed to delete incomplete draft ${o.id}:`, err);
        });
      });
      setIncompleteOrders([]);
    }
  };

  const handleChangeStatus = (id: string, newStatus: any) => {
    if (!perms.canEdit) {
      alert('দুঃখিত, আপনার অ্যাকাউন্টে স্ট্যাটাস এডিট বা পরিবর্তন (Edit) করার অনুমতি নেই!');
      return;
    }
    const updated = orders.map(o => {
      if (o.id === id) {
        return { ...o, status: newStatus };
      }
      return o;
    });
    setOrders(updated);

    // Update status in Firestore
    updateOrderInFirestore(id, { status: newStatus }).catch((err) => {
      console.warn("Failed to update status in Cloud Firestore database:", err);
    });

    // Send delivery status change data to Facebook, Google, and TikTok
    const targetOrder = updated.find(o => o.id === id);
    if (targetOrder) {
      const orderPrice = targetOrder.price || 0;
      
      // Google Analytics
      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'delivery_status_change', {
          value: orderPrice,
          currency: 'BDT',
          order_id: id,
          status: newStatus
        });
      }

      // Facebook Meta Pixel (Server + Browser proxy)
      trackPixelEvent('DeliveryStatusUpdate', {
        value: orderPrice,
        currency: 'BDT',
        content_name: 'Delivery Status Update',
        order_id: id,
        status: newStatus
      }, { name: targetOrder.name, phone: targetOrder.phone });

      // TikTok Pixel
      trackTikTokEvent('DeliveryStatusUpdate', {
        value: orderPrice,
        currency: 'BDT',
        content_name: 'Delivery Status Update',
        order_id: id,
        status: newStatus
      });
    }

    // Auto Google Sheets sync on update
    const token = getAccessToken();
    const sheetsCfg = getSheetsConfig();
    if (sheetsCfg.autoSync && sheetsCfg.spreadsheetId && token) {
      syncAllOrdersToSheet(token, sheetsCfg.spreadsheetId, updated).catch(err => {
        console.warn("Auto-sync update failed during status change:", err);
      });
    }
  };

  const handleToggleConfirmOrder = (id: string) => {
    if (!perms.canEdit) {
      alert('দুঃখিত, আপনার অ্যাকাউন্টে অর্ডার কনফার্মেশন এডিট বা পরিবর্তন (Edit) করার অনুমতি নেই!');
      return;
    }
    let nextConfirmedState = false;
    const updated = orders.map(o => {
      if (o.id === id) {
        nextConfirmedState = !o.isConfirmed;
        return { ...o, isConfirmed: nextConfirmedState };
      }
      return o;
    });
    setOrders(updated);

    // Update confirmation status in Firestore
    updateOrderInFirestore(id, { isConfirmed: nextConfirmedState }).catch((err) => {
      console.warn("Failed to update confirmation status in Cloud Firestore database:", err);
    });

    // Auto Google Sheets sync on confirmation change
    const token = getAccessToken();
    const sheetsCfg = getSheetsConfig();
    if (sheetsCfg.autoSync && sheetsCfg.spreadsheetId && token) {
      syncAllOrdersToSheet(token, sheetsCfg.spreadsheetId, updated).catch(err => {
        console.warn("Auto-sync update failed during confirmation toggle:", err);
      });
    }
  };

  const handleBulkUpdateStatus = (newStatus: any) => {
    if (!perms.canEdit) {
      alert('দুঃখিত, আপনার অ্যাকাউন্টে স্ট্যাটাস এডিট বা পরিবর্তন (Edit) করার অনুমতি নেই!');
      return;
    }
    if (selectedOrderIds.length === 0) return;
    
    const updated = orders.map(o => {
      if (selectedOrderIds.includes(o.id)) {
        return { ...o, status: newStatus };
      }
      return o;
    });
    setOrders(updated);

    // Update status in Firestore for each selected ID
    selectedOrderIds.forEach(id => {
      updateOrderInFirestore(id, { status: newStatus }).catch((err) => {
        console.warn(`Failed to update status in Cloud Firestore database for ${id}:`, err);
      });

      // Send delivery status change data to Facebook, Google, and TikTok
      const targetOrder = updated.find(o => o.id === id);
      if (targetOrder) {
        const orderPrice = targetOrder.price || 0;
        
        // Google Analytics
        if (typeof (window as any).gtag === 'function') {
          (window as any).gtag('event', 'delivery_status_change', {
            value: orderPrice,
            currency: 'BDT',
            order_id: id,
            status: newStatus
          });
        }

        // Facebook Meta Pixel (Server + Browser proxy)
        trackPixelEvent('DeliveryStatusUpdate', {
          value: orderPrice,
          currency: 'BDT',
          content_name: 'Delivery Status Update',
          order_id: id,
          status: newStatus
        }, { name: targetOrder.name, phone: targetOrder.phone });

        // TikTok Pixel
        trackTikTokEvent('DeliveryStatusUpdate', {
          value: orderPrice,
          currency: 'BDT',
          content_name: 'Delivery Status Update',
          order_id: id,
          status: newStatus
        });
      }
    });

    // Auto Google Sheets sync on update
    const sheetToken = getAccessToken();
    const sheetsSettings = getSheetsConfig();
    if (sheetsSettings.autoSync && sheetsSettings.spreadsheetId && sheetToken) {
      syncAllOrdersToSheet(sheetToken, sheetsSettings.spreadsheetId, updated).catch(err => {
        console.warn("Auto-sync update failed during bulk status change:", err);
      });
    }

    alert(`সফলভাবে ${selectedOrderIds.length} টি অর্ডারের ডেলিভারি স্থিতি '${newStatus}' এ পরিবর্তন করা হয়েছে।`);
    setSelectedOrderIds([]);
  };

  const handleBulkSetConfirmed = (confirmed: boolean) => {
    if (!perms.canEdit) {
      alert('দুঃখিত, আপনার অ্যাকাউন্টে অর্ডার কনফার্মেশন এডিট বা পরিবর্তন (Edit) করার অনুমতি নেই!');
      return;
    }
    if (selectedOrderIds.length === 0) return;

    const updated = orders.map(o => {
      if (selectedOrderIds.includes(o.id)) {
        return { ...o, isConfirmed: confirmed };
      }
      return o;
    });
    setOrders(updated);

    // Update confirmation status in Firestore for each selected ID
    selectedOrderIds.forEach(id => {
      updateOrderInFirestore(id, { isConfirmed: confirmed }).catch((err) => {
        console.warn(`Failed to update confirmation status in Cloud Firestore database for ${id}:`, err);
      });
    });

    // Auto Google Sheets sync on confirmation change
    const sheetToken = getAccessToken();
    const sheetsSettings = getSheetsConfig();
    if (sheetsSettings.autoSync && sheetsSettings.spreadsheetId && sheetToken) {
      syncAllOrdersToSheet(sheetToken, sheetsSettings.spreadsheetId, updated).catch(err => {
        console.warn("Auto-sync update failed during bulk confirmation toggle:", err);
      });
    }

    alert(`সফলভাবে ${selectedOrderIds.length} টি অর্ডার ${confirmed ? 'কনফার্ম' : 'কনফার্মেশন বাতিল'} করা হয়েছে।`);
    setSelectedOrderIds([]);
  };

  const handleBulkDelete = () => {
    if (!perms.canDelete) {
      alert('দুঃখিত, আপনার অ্যাকাউন্টে কোনো ডেটা মুছে ফেলার (Delete) অনুমতি দেওয়া হয়নি!');
      return;
    }
    if (selectedOrderIds.length === 0) return;

    if (!confirm(`আপনি কি নিশ্চিতভাবে নির্বাচিত ${selectedOrderIds.length} টি অর্ডার মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না!`)) {
      return;
    }

    const updated = orders.filter(o => !selectedOrderIds.includes(o.id));
    setOrders(updated);
    onRefreshOrdersCount();

    // Delete each from Firestore
    selectedOrderIds.forEach(id => {
      deleteOrderFromFirestore(id).catch((err) => {
        console.warn(`Failed to delete order ${id} from Cloud Firestore database:`, err);
      });
    });

    setSelectedOrderIds([]);
    alert(`সফলভাবে ${selectedOrderIds.length} টি অর্ডার মুছে ফেলা হয়েছে।`);
  };

  const handleStartEditOrder = (order: RaincoatOrder) => {
    if (!perms.canEdit) {
      alert('দুঃখিত, আপনার অ্যাকাউন্টে কাস্টমারের অর্ডার ডিটেইলস পরিবর্তন (Edit) করার অনুমতি নেই!');
      return;
    }
    setEditingOrder({ ...order });
  };

  const handleSaveEditOrder = async () => {
    if (!editingOrder) return;
    try {
      // 1. Update local state
      const updatedOrders = orders.map(o => o.id === editingOrder.id ? editingOrder : o);
      setOrders(updatedOrders);

      // 2. Update Firestore
      await updateOrderInFirestore(editingOrder.id, editingOrder);

      // Auto Google Sheets sync on edit
      const token = getAccessToken();
      const sheetsCfg = getSheetsConfig();
      if (sheetsCfg.autoSync && sheetsCfg.spreadsheetId && token) {
        syncAllOrdersToSheet(token, sheetsCfg.spreadsheetId, updatedOrders).catch(err => {
          console.warn("Auto-sync update failed during order edit:", err);
        });
      }

      setEditingOrder(null);
      setCopiedMessage('গ্রাহকের অর্ডার বিবরণী সফলভাবে সংশোধন করে ক্লাউড ডেটাবেজে সংরক্ষণ করা হয়েছে!');
      setTimeout(() => setCopiedMessage(''), 4000);
    } catch (err) {
      console.error(err);
      alert('তথ্য পরিবর্তন করা যায়নি। আবার চেষ্টা করুন।');
    }
  };

  const handleMoveDraftToCompleted = async (draft: IncompleteOrder) => {
    if (!perms.canEdit) {
      alert('দুঃখিত, আপনার অ্যাকাউন্টে ড্রাফট এডিট বা পরিবর্তন (Edit) করার অনুমতি নেই!');
      return;
    }
    if (!confirm('আপনি কি এই ইনকমপ্লিট ড্রাফটটি সফল অর্ডার হিসেবে যুক্ত করতে চান?')) return;

    const newOrderId = draft.id.startsWith('sess-') ? 'ord-' + Math.floor(Math.random() * 100000) : draft.id;
    const successOrder: RaincoatOrder = {
      id: newOrderId,
      name: draft.name || 'নামহীন গ্রাহক',
      village: draft.village || 'অজ্ঞাত এলাকা',
      policeStation: draft.orderNotes?.includes('থানা:') ? draft.orderNotes.split('থানা:')[1]?.split(',')[0]?.trim() : '',
      district: draft.orderNotes?.includes('জেলা:') ? draft.orderNotes.split('জেলা:')[1]?.split(',')[0]?.trim() : '',
      phone: draft.phone ? draft.phone.replace(/[^0-9]/g, '') : '01000000000',
      size: draft.size || 'XL',
      color: draft.color || 'Black',
      weight: draft.weight || 60,
      heightFeet: draft.heightFeet || 5,
      heightInches: draft.heightInches || 6,
      price: draft.price || 550,
      status: 'Pending',
      isConfirmed: true, // Auto confirm when manually transferred
      createdAt: new Date().toISOString(),
      orderNotes: draft.orderNotes ? draft.orderNotes.trim() + ' (Moved from drafts)' : 'Moved from drafts',
    };

    try {
      // 1. Add order to completed orders in DB
      await addOrderToFirestore(successOrder);

      // 2. Delete incomplete order from DB
      await deleteIncompleteOrderFromFirestore(draft.id);

      // 3. Update completed local state
      const updatedCompleted = [successOrder, ...orders];
      setOrders(updatedCompleted);

      // 4. Update incomplete local state
      const updatedIncompletes = incompleteOrders.filter(o => o.id !== draft.id);
      setIncompleteOrders(updatedIncompletes);

      onRefreshOrdersCount();

      // Auto Google Sheets sync on move
      const token = getAccessToken();
      const sheetsCfg = getSheetsConfig();
      if (sheetsCfg.autoSync && sheetsCfg.spreadsheetId && token) {
        syncAllOrdersToSheet(token, sheetsCfg.spreadsheetId, updatedCompleted).catch(err => {
          console.warn("Auto-sync update failed during order move:", err);
        });
      }

      setCopiedMessage('ড্রাফটটি সফল অর্ডারে মুভ করা সম্পন্ন হয়েছে!');
      setTimeout(() => setCopiedMessage(''), 4000);
    } catch (err) {
      console.error(err);
      alert('সফল অর্ডারে মুভ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  const handleCopyCSV = () => {
    if (filteredOrders.length === 0) {
      setCopiedMessage('কোনো অর্ডার নেই কপি করার মতো!');
      setTimeout(() => setCopiedMessage(''), 2000);
      return;
    }

    // CSV header translation
    let csvContent = "Order ID,Name,Phone,Address/Village,Size,Color,Weight(kg),Height,Price,ConfirmedStatus,DeliveryStatus,Date\n";
    filteredOrders.forEach(o => {
      const formattedDate = new Date(o.createdAt).toLocaleDateString();
      const row = `"${o.id}","${o.name}","${o.phone}","${o.village}","${o.size}","${o.color}",${o.weight},"${o.heightFeet}'${o.heightInches}\"",${o.price},"${o.isConfirmed ? 'Confirmed' : 'Unconfirmed'}","${o.status}","${formattedDate}"`;
      csvContent += row + "\n";
    });

    navigator.clipboard.writeText(csvContent).then(() => {
      setCopiedMessage('অর্ডার ডাটা CSV ফরম্যাটে ক্লিপবোর্ডে কপি হয়েছে!');
      setTimeout(() => setCopiedMessage(''), 2000);
    });
  };

  const handleDownloadCSV = () => {
    if (filteredOrders.length === 0) {
      setCopiedMessage('কোনো অর্ডার নেই ডাউনলোড করার মতো!');
      setTimeout(() => setCopiedMessage(''), 2000);
      return;
    }

    // Use BOM \uFEFF to preserve UTF-8 formatting for Excel
    let csvContent = "\uFEFFOrder ID,Name,Phone,Address/Village,Size,Color,Weight(kg),Height,Price,ConfirmedStatus,DeliveryStatus,Date\n";
    filteredOrders.forEach(o => {
      const formattedDate = new Date(o.createdAt).toLocaleDateString('bn-BD');
      const row = `"${o.id}","${o.name}","${o.phone}","${o.village}","${o.size}","${o.color}",${o.weight},"${o.heightFeet}'${o.heightInches}\"",${o.price},"${o.isConfirmed ? 'Confirmed' : 'Unconfirmed'}","${o.status}","${formattedDate}"`;
      csvContent += row + "\n";
    });

    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `orders_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setCopiedMessage('অর্ডার ডাটা CSV ফাইল হিসেবে সফলভাবে ডাউনলোড হয়েছে!');
      setTimeout(() => setCopiedMessage(''), 3000);
    } catch (err) {
      console.error('Error selling CSV download:', err);
      setCopiedMessage('ফাইল ডাউনলোড করতে সমস্যা হয়েছে!');
      setTimeout(() => setCopiedMessage(''), 2000);
    }
  };

  const handleBulkPrintLabels = () => {
    if (selectedOrderIds.length === 0) {
      alert('অনুগ্রহ করে অন্তত ১টি অর্ডার সিলেক্ট করুন!');
      return;
    }
    setShowPrintLabelModal(true);
  };

  const getProductNameFirstWord = (order: RaincoatOrder) => {
    // If order ID contains "bike", it's a bike cover, otherwise raincoat
    if (order.id.toLowerCase().includes('bike')) {
      return 'Bike';
    }
    return 'Raincoat';
  };

  // Convert Gregorian ISO to detailed Bengali Date & Time representation in real-time
  const formatBanglaDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      const banglaMonths = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
      ];

      const d = date.getDate();
      const m = date.getMonth();
      const y = date.getFullYear();
      let h = date.getHours();
      const min = date.getMinutes().toString().padStart(2, '0');
      
      const ampm = h >= 12 ? 'বিকাল/রাত' : 'সকাল/দুপুর';
      h = h % 12;
      h = h ? h : 12;

      const convert = (numStr: string | number) => {
        return numStr.toString().split('').map(char => {
          const idx = parseInt(char);
          return isNaN(idx) ? char : banglaDigits[idx];
        }).join('');
      };

      return `${convert(d)} ${banglaMonths[m]} ${convert(y)}, ${ampm} ${convert(h)}:${convert(min)} মিনিট`;
    } catch (e) {
      return isoString;
    }
  };

  const isDateInSelectedRange = (createdAtStr: string) => {
    if (dateFilter === 'all') return true;
    
    const createdAt = new Date(createdAtStr);
    if (isNaN(createdAt.getTime())) return false;
    
    const now = new Date();
    
    const getStartOfDay = (d: Date) => {
      const nd = new Date(d);
      nd.setHours(0, 0, 0, 0);
      return nd;
    };
    
    const getEndOfDay = (d: Date) => {
      const nd = new Date(d);
      nd.setHours(23, 59, 59, 999);
      return nd;
    };
    
    const todayStart = getStartOfDay(now);
    const todayEnd = getEndOfDay(now);

    switch (dateFilter) {
      case 'today':
        return createdAt >= todayStart && createdAt <= todayEnd;
      case 'yesterday': {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStart = getStartOfDay(yesterday);
        const yEnd = getEndOfDay(yesterday);
        return createdAt >= yStart && createdAt <= yEnd;
      }
      case 'last3': {
        const minDate = getStartOfDay(now);
        minDate.setDate(minDate.getDate() - 2);
        return createdAt >= minDate && createdAt <= todayEnd;
      }
      case 'last7': {
        const minDate = getStartOfDay(now);
        minDate.setDate(minDate.getDate() - 6);
        return createdAt >= minDate && createdAt <= todayEnd;
      }
      case 'last15': {
        const minDate = getStartOfDay(now);
        minDate.setDate(minDate.getDate() - 14);
        return createdAt >= minDate && createdAt <= todayEnd;
      }
      case 'last30': {
        const minDate = getStartOfDay(now);
        minDate.setDate(minDate.getDate() - 29);
        return createdAt >= minDate && createdAt <= todayEnd;
      }
      case 'thisMonth': {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        return createdAt >= firstDayOfMonth && createdAt <= todayEnd;
      }
      case 'lastMonth': {
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return createdAt >= firstDayOfLastMonth && createdAt <= lastDayOfLastMonth;
      }
      case 'last3Months': {
        const minDate = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
        return createdAt >= minDate && createdAt <= todayEnd;
      }
      case 'last6Months': {
        const minDate = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
        return createdAt >= minDate && createdAt <= todayEnd;
      }
      case 'thisYear': {
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        return createdAt >= firstDayOfYear && createdAt <= todayEnd;
      }
      case 'lastYear': {
        const firstDayOfLastYear = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
        const lastDayOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        return createdAt >= firstDayOfLastYear && createdAt <= lastDayOfLastYear;
      }
      case 'custom': {
        if (!customStartDate) return true;
        const start = getStartOfDay(new Date(customStartDate));
        const end = customEndDate ? getEndOfDay(new Date(customEndDate)) : getEndOfDay(new Date(customStartDate));
        return createdAt >= start && createdAt <= end;
      }
      default:
        return true;
    }
  };

  const filteredOrders = orders.filter(o => {
    if (!o) return false;
    const matchSearch = 
      (o.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.phone || '').includes(searchTerm) ||
      (o.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((o.village || '').toLowerCase().includes(searchTerm.toLowerCase()));
    const matchSize = filterSize === 'All' || o.size === filterSize;
    const matchStatus = filterStatus === 'All' || 
      (filterStatus === 'Canceled' 
        ? (o.status === 'Canceled' || o.status === 'Cancelled' || o.status === 'Canceled Fake Order')
        : o.status === filterStatus);
    const matchDistrict = filterDistrict === 'All' || getEnglishDistrictName(o) === filterDistrict;
    const matchDate = isDateInSelectedRange(o.createdAt);
    return matchSearch && matchSize && matchStatus && matchDistrict && matchDate;
  }).sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  // Automatically fetch Steadfast delivery status for top 15 visible orders
  useEffect(() => {
    if (filteredOrders.length > 0) {
      const topVisibleIds = filteredOrders.slice(0, 15).map(o => o.id);
      topVisibleIds.forEach(orderId => {
        if (!steadfastStatuses[orderId]) {
          fetchSteadfastStatus(orderId);
        }
      });
    }
  }, [filteredOrders.slice(0, 15).map(o => o.id).join(',')]);

  const filteredIncompleteOrders = incompleteOrders.filter(o => {
    if (!o) return false;
    const matchSearch = 
      (o.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.phone || '').includes(searchTerm) ||
      (o.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((o.village || '').toLowerCase().includes(searchTerm.toLowerCase()));
    const matchSize = filterSize === 'All' || o.size === filterSize;
    const matchDistrict = filterDistrict === 'All' || getEnglishDistrictName(o) === filterDistrict;
    const matchDate = isDateInSelectedRange(o.createdAt);
    return matchSearch && matchSize && matchDistrict && matchDate;
  }).sort((a, b) => {
    const timeA = (a.lastUpdatedAt || a.createdAt) ? new Date(a.lastUpdatedAt || a.createdAt).getTime() : 0;
    const timeB = (b.lastUpdatedAt || b.createdAt) ? new Date(b.lastUpdatedAt || b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.price, 0);
  const filteredRevenue = filteredOrders.reduce((sum, o) => sum + o.price, 0);
  const filteredConfirmedCount = filteredOrders.filter(o => o.isConfirmed).length;
  const filteredIncompleteCount = filteredIncompleteOrders.length;

  // Real-time Fraud Checking & Delivery Success Calculations
  const filteredDeliveredCount = filteredOrders.filter(o => o.status === 'Delivered').length;
  const filteredCancelledCount = filteredOrders.filter(o => o.status === 'Cancelled' || o.status === 'Canceled' || o.status === 'Canceled Fake Order').length;
  const filteredFinished = filteredDeliveredCount + filteredCancelledCount;
  const filteredSuccessRatio = filteredFinished > 0 ? Math.round((filteredDeliveredCount / filteredFinished) * 100) : 100;

  const filteredSafeCount = filteredOrders.filter(o => !o.fraudScore || o.fraudScore < 20).length;
  const filteredWarningCount = filteredOrders.filter(o => o.fraudScore !== undefined && o.fraudScore >= 20 && o.fraudScore < 45).length;
  const filteredHighRiskCount = filteredOrders.filter(o => o.fraudScore !== undefined && o.fraudScore >= 45 && o.fraudScore < 75).length;
  const filteredScammerCount = filteredOrders.filter(o => o.fraudScore !== undefined && o.fraudScore >= 75).length;

  const isStandAlone = window.location.pathname === '/admin' || window.location.hash === '#/admin' || window.location.hash === '#admin';

  // Completed Orders Pagination calculations
  const startIndex = (completedPage - 1) * completedPageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + completedPageSize);
  const totalCompletedPages = Math.ceil(filteredOrders.length / completedPageSize) || 1;

  // Auto-reset completed order page to 1 when filters or page size changes
  useEffect(() => {
    setCompletedPage(1);
  }, [searchTerm, filterSize, filterStatus, filterDistrict, dateFilter, customStartDate, customEndDate, completedPageSize]);

  // If NOT logged in, block and show elegant standalone admin credentials check
  if (!isLoggedIn) {
    return (
      <div className={isStandAlone ? "min-h-screen w-full bg-slate-950 flex justify-center items-center p-4 font-sans" : "fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-4 font-sans"}>
        <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200">
          
          <div className="bg-slate-900 text-white p-6 justify-between flex items-center">
            <div className="flex items-center gap-2.5">
              <Lock className="h-5 w-5 text-yellow-400 shrink-0" />
              <div>
                <h3 className="text-base font-bold font-sans">
                  {showForgotPassword ? "মেইল রিসেট লিংক" : "অ্যাডমিন প্রবেশপথ"}
                </h3>
                <p className="text-slate-400 text-[10px]">
                  {showForgotPassword ? "আপনার মেইলে রিসেট লিংক পাঠানো হবে" : "অর্ডার ড্যাশবোর্ডে প্রবেশ করতে লগইন করুন"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {showForgotPassword ? (
            <form onSubmit={handlePasswordResetSubmit} className="p-6 space-y-4 font-sans">
              {resetSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-205 text-emerald-800 text-xs rounded-xl font-bold flex items-start gap-1.5 leading-relaxed">
                  <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{resetSuccess}</span>
                </div>
              )}
              {resetError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold flex items-start gap-1.5 leading-relaxed">
                  <AlertOctagon className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{resetError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">রেজিস্টার্ড ইমেইল (Email Address)</label>
                <input
                  type="email"
                  placeholder="যেমন: vaiyashare@gmail.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-400 text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">ভুলে যাওয়া পাসওয়ার্ড পরিবর্তন করার লিংক এই মেইলে চলে যাবে।</p>
              </div>

              <button
                type="submit"
                disabled={isSendingReset}
                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-400 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5"
              >
                {isSendingReset ? (
                  <>رিসেট লিংক পাঠানো হচ্ছে...</>
                ) : (
                  <>চেঞ্জ পাসওয়ার্ড রিসেট লিংক পাঠান</>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSuccess('');
                  setResetError('');
                }}
                className="w-full text-center text-xs font-black text-indigo-600 hover:text-indigo-800 hover:underline pt-2 cursor-pointer block"
              >
                লগইন স্ক্রিনে ফিরে যান
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="p-6 space-y-4 font-sans">
              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold flex items-center gap-1.5">
                  <AlertOctagon className="h-4 w-4 text-rose-600 shrink-0" />
                  {loginError}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">অ্যাডমিন ইউজারনেম (Username)</label>
                <input
                  type="text"
                  placeholder="যেমন: admin"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-400 text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">অ্যাডমিন পাসওয়ার্ড (Password)</label>
                <input
                  type="password"
                  placeholder="••••••"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-400 text-slate-900 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-indigo-600 hover:text-indigo-800 hover:underline text-xs font-bold cursor-pointer transition"
                >
                  পাসওয়ার্ড ভুলে গেছেন? রিসেট লিংক পাঠান
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5"
              >
                <Key className="h-4 w-4" /> সুরক্ষিত ড্যাশবোর্ডে প্রবেশ করুন
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={isStandAlone ? "min-h-screen w-full bg-slate-100 flex flex-col font-sans" : "fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 font-sans"}>
      <div className={isStandAlone ? "bg-white w-full shadow-2xl min-h-screen flex flex-col" : "bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"}>
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 justify-between flex items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6 text-yellow-400 shrink-0 animate-pulse" />
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-sans">অর্ডার কিউ ও অ্যাডমিন ড্যাশবোর্ড (লগইন করা আছে)</h3>
              <p className="text-slate-400 text-[10px] sm:text-xs">গ্রাহকদের লাইভ অর্ডার বুকিং, ড্রাফট ও গুগল শিট লাইভ সিঙ্ক ইঞ্জিন</p>
            </div>
          </div>
          <div className="flex items-center gap-2 relative">
            {/* Audio Alert Toggle Button */}
            <button
              type="button"
              onClick={toggleSound}
              className={`px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 border font-bold text-xs ${
                soundEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
              title={soundEnabled ? "নতুন অর্ডার সাউন্ড চালু (Click to Mute)" : "নতুন অর্ডার সাউন্ড বন্ধ (Click to Unmute)"}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="h-4 w-4 text-emerald-200" />
                  <span className="hidden sm:inline">সাউন্ড অন</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4 text-slate-400" />
                  <span className="hidden sm:inline">সাউন্ড অফ</span>
                </>
              )}
            </button>

            {/* Gear Icon settings panel */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center border font-black ${
                  showSettingsDropdown
                    ? 'bg-orange-500 text-white border-orange-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                }`}
                title="সেটিংস ও লগআউট"
              >
                <Settings className={`h-4 w-4 ${showSettingsDropdown ? 'animate-spin' : ''}`} />
              </button>

              {/* Floating Settings Dropdown */}
              {showSettingsDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2.5 font-sans animate-in fade-in duration-105">
                  <div className="px-3.5 py-1.5 border-b border-slate-100 flex flex-col mb-1 text-left">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">রোল ও প্রোফাইল</span>
                    <span className="text-xs font-extrabold text-slate-800 truncate">{currentUser}</span>
                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 rounded border border-amber-100 px-1.5 py-0.5 mt-1.5 w-max">
                      🔑 {userRole === 'Admin' ? 'এডমিনিস্ট্রেটর' : userRole === 'Editor' ? 'এডিটর' : 'ভিজিটর (ReadOnly)'}
                    </span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowPwdChange(!showPwdChange);
                      setShowSettingsDropdown(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Lock className="h-3.5 w-3.5 text-slate-500" />
                    পাসওয়ার্ড পরিবর্তন
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setShowSettingsDropdown(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 font-extrabold text-xs flex items-center gap-2 transition border-t border-slate-100 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    লগআউট করুন
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer ml-1"
              id="close-admin-panel"
            >
              <X className="h-5.5 w-5.5" />
            </button>
          </div>
        </div>

        {/* Dynamic credential change panel */}
        {showPwdChange && (
          <div className="p-5 bg-yellow-50/70 border-b border-yellow-100 flex-none font-sans">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 mb-2.5">
              ⚙️ এডমিন ইউজারনেম ও পাসওয়ার্ড রি-কনফিগার (Change Credentials)
            </h4>
            <form onSubmit={handleUpdateCredentials} className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-end max-w-3xl">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">নতুন ইউজারনেম (New Username)</label>
                <input
                  type="text"
                  placeholder="যেমন: admin2"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">নতুন পাসওয়ার্ড (New Password)</label>
                <input
                  type="password"
                  placeholder="••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-3.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-black transition cursor-pointer shadow-sm"
                >
                  সংরক্ষণ করুন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPwdChange(false);
                    setNewUsername('');
                    setNewPassword('');
                  }}
                  className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </form>
            {pwdChangeSuccess && (
              <p className="text-xs font-black text-emerald-800 mt-2 bg-emerald-50 p-2 rounded-lg border border-emerald-100 inline-block">
                ✓ {pwdChangeSuccess}
              </p>
            )}
          </div>
        )}

        {/* Responsive Sidebar Layout Columns */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0 bg-slate-50">
          
          {/* VERTICAL COLUMN SIDEBAR */}
          <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-4 shrink-0 flex flex-col min-h-0 overflow-y-auto">
            <div className="hidden md:flex flex-col space-y-1 pb-4 mb-4 border-b border-slate-200">
              <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">প্যানেল মেনু ডিরেক্টরি</span>
              <span className="text-[11px] text-slate-500 font-medium">ফিচার ও কার্যতালিকা</span>
            </div>

            <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 gap-1.5 scrollbar-thin shrink-0">
              {/* 1. সফল অর্ডার */}
              <button
                type="button"
                onClick={() => setActiveTab('completed')}
                className={`py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-between gap-3 shrink-0 ${
                  activeTab === 'completed'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-extrabold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 shrink-0" />
                  <span>সফল অর্ডার</span>
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'completed' ? 'bg-indigo-900 text-indigo-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {orders.length}
                </span>
              </button>

              {/* 2. ড্রাফটস (ইনকমপ্লিট) */}
              <button
                type="button"
                onClick={() => setActiveTab('incomplete')}
                className={`py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center justify-between gap-3 shrink-0 ${
                  activeTab === 'incomplete'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/10 font-extrabold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4 shrink-0" />
                  <span>অর্ডার ড্রাফটস</span>
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'incomplete' ? 'bg-orange-850 bg-orange-900 text-orange-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {incompleteOrders.length}
                </span>
              </button>

              {/* 3. পেইজ মেকার */}
              <button
                type="button"
                onClick={() => setActiveTab('pages')}
                className={`py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === 'pages'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-extrabold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                📄 পেইজ মেকার
              </button>

              {/* 4. শপ প্রোডাক্টস */}
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === 'products'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-extrabold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                🛒 শপ প্রোডাক্টস
              </button>

              {/* 5. মিডিয়া স্লাইডার */}
              <button
                type="button"
                onClick={() => setActiveTab('media')}
                className={`py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === 'media'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-extrabold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                🖼️ মিডিয়া স্লাইডার
              </button>

              {/* 5b. হোম স্লাইডার ব্যানার */}
              <button
                type="button"
                onClick={() => setActiveTab('banners')}
                className={`py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === 'banners'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-extrabold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                🌅 হোম স্লাইডার ব্যানার
              </button>

              {/* 6. স্টক ইনভেন্টরি */}
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={`py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === 'inventory'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-extrabold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                📦 স্টক ইনভেন্টরি
              </button>

              {/* 7. পিক্সেল ইন্টিগ্রেশন */}
              <button
                type="button"
                onClick={() => setActiveTab('integrations')}
                className={`py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === 'integrations'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-extrabold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                🌐 পিক্সেল ইন্টিগ্রেশন
              </button>

              {/* 8. টিম ইউজারস */}
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === 'users'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-extrabold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                👥 টিম ইউজারস
              </button>

              {/* 9. স্প্যাম ডাইরেক্ট */}
              <button
                type="button"
                onClick={() => setActiveTab('blocking')}
                className={`py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === 'blocking'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-extrabold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                🛡️ স্প্যাম ডাইরেক্ট
              </button>

              {/* 9b. ফ্রাড চেক ট্র্যাকিং */}
              <button
                type="button"
                onClick={() => setActiveTab('fraud')}
                className={`py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 relative ${
                  activeTab === 'fraud'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/10 font-extrabold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <span className="flex h-1.5 w-1.5 rounded-full bg-orange-400 animate-ping absolute right-2.5 top-2.5" />
                🛡️ ফ্রাড ফিল্টারিং API
              </button>

              {/* 10. লাইভ ভিজিটরস */}
              <button
                type="button"
                onClick={() => setActiveTab('live-visitors')}
                className={`py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 relative ${
                  activeTab === 'live-visitors'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/10 font-extrabold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <span className="flex h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping absolute right-2.5 top-2.5" />
                🔴 লাইভ ভিজিটরস
              </button>

              {/* 11. অ্যাডভান্সড প্লাগইনস */}
              <button
                type="button"
                onClick={() => setActiveTab('advanced_addons')}
                className={`py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 relative ${
                  activeTab === 'advanced_addons'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10 font-extrabold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <span className="flex h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping absolute right-2.5 top-2.5" />
                🚀 অ্যাডভান্সড প্লাগইনস
              </button>

              {/* 11b. ডিজাইন ও সেকশন কাস্টমাইজার */}
              <button
                type="button"
                onClick={() => setActiveTab('section_customizer')}
                className={`py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 relative ${
                  activeTab === 'section_customizer'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-extrabold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse absolute right-2.5 top-2.5" />
                🎨 ভিজ্যুয়াল পেজ ও ডিজাইন কাস্টমাইজার
              </button>

              {/* 12. কুরিয়ার এপিআই ইন্টিগ্রেশন */}
              <button
                type="button"
                onClick={() => setActiveTab('courier_hub')}
                className={`py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 relative ${
                  activeTab === 'courier_hub' || activeTab === 'courier_connections'
                    ? 'bg-gradient-to-r from-blue-650 to-indigo-650 text-white shadow-md shadow-blue-650/10 font-extrabold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping absolute right-2.5 top-2.5" />
                🚚 কুরিয়ার বুকিং ও কুন্ডলী
              </button>

              {/* 12c. কুরিয়ার ও ট্র্যাক মনিটর */}
              <button
                type="button"
                onClick={() => setActiveTab('courier_monitor')}
                className={`py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 relative ${
                  activeTab === 'courier_monitor'
                    ? 'bg-indigo-700 text-white shadow-md shadow-indigo-700/10 font-extrabold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse absolute right-2.5 top-2.5" />
                📊 কুরিয়ার ও ট্র্যাক মনিটর
              </button>

              {/* 13. কাস্টমার রিভিউ হাব */}
              <button
                type="button"
                onClick={() => setActiveTab('reviews_hub')}
                className={`py-2.5 px-3 rounded-xl text-left text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 relative ${
                  activeTab === 'reviews_hub'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10 font-extrabold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping absolute right-2.5 top-2.5" />
                📸 কাস্টমার রিভিউজ
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN SCROLLABLE CONTENT AREA */}
          <div className="flex-1 p-6 space-y-5 overflow-y-auto min-h-0 bg-white">

          {(activeTab === 'completed' || activeTab === 'incomplete') ? (
            <>
              {/* Quick stats cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-100/90 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">মোট অর্ডার সংখ্যা</span>
                    <span className="text-2xl font-black text-slate-800 font-mono">{filteredOrders.length} টি</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold block mt-1 font-sans">সর্বমোট: {orders.length} টি</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100/90 rounded-2xl relational flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">কনফার্মড অর্ডার</span>
                    <span className="text-2xl font-black text-emerald-600 font-mono">{filteredConfirmedCount} টি</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold block mt-1 font-sans">সর্বমোট: {orders.filter(o => o.isConfirmed).length} টি</span>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-orange-600 font-bold uppercase block">ইনকমপ্লিট ড্রাফটস</span>
                    <span className="text-2xl font-black text-orange-700 font-mono">{filteredIncompleteCount} টি</span>
                  </div>
                  <span className="text-[10px] text-orange-400 font-bold block mt-1 font-sans">সর্বমোট: {incompleteOrders.length} টি</span>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-blue-500 font-bold uppercase block">মোট সম্ভাব্য বিক্রি</span>
                    <span className="text-2xl font-black text-blue-850 font-mono">{filteredRevenue} TK</span>
                  </div>
                  <span className="text-[10px] text-blue-400 font-bold block mt-1 font-sans">সর্বমোট: {totalRevenue} TK</span>
                </div>
              </div>

              {/* 📊 Daily Sales & Marketing Campaign Performance Chart */}
              <DailyOrdersChart orders={orders} incompleteOrders={incompleteOrders} />

              {/* Fraud and Delivery Success Intelligence Dashboard */}
              <div ref={undefined} className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-1.5 font-sans">
                      <ShieldAlert className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                      🛡️ কাস্টমার ফ্রড ডিটেকশন ও ডেলিভারি সাকসেস এনালাইজার
                    </h4>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                      গ্রাহকদের মোবাইল হিস্ট্রি, পূর্ববর্তী রিটার্ন ডাটাবেস ও ক্যান্সেলকৃত অর্ডারের রিয়েল-টাইম ইন্টেলিজেন্ট এনালাইসিস।
                    </p>
                  </div>
                  <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 font-mono text-[10px] font-bold text-indigo-300 shrink-0 flex items-center gap-1.5 leading-none">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE COURIER SECURE: ACTIVE
                  </div>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-sans">
                  {/* Metric 1 */}
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase block font-sans">মোট অর্ডার স্ক্যান</span>
                      <span className="text-lg font-black font-mono text-white">{filteredOrders.length} টি</span>
                    </div>
                    <span className="text-[8.5px] text-slate-500 block mt-1 truncate">সব ইউনিক নম্বর হিস্ট্রি চেকড</span>
                  </div>

                  {/* Metric 2 */}
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-emerald-400 font-extrabold uppercase block font-sans">সফল ডেলিভারি (Success)</span>
                      <span className="text-lg font-black font-mono text-emerald-400">{filteredDeliveredCount} টি</span>
                    </div>
                    <span className="text-[8.5px] text-slate-500 block mt-1 truncate">ডেলিভারড স্থিতি সম্পন্ন</span>
                  </div>

                  {/* Metric 3 */}
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-rose-400 font-extrabold uppercase block font-sans">অর্ডার বাতিল (Cancelled)</span>
                      <span className="text-lg font-black font-mono text-rose-400">{filteredCancelledCount} টি</span>
                    </div>
                    <span className="text-[8.5px] text-slate-500 block mt-1 truncate">গ্রাহক/অ্যাডমিন দ্বারা বাতিল</span>
                  </div>

                  {/* Metric 4 */}
                  <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-indigo-300 font-extrabold uppercase block font-sans">ডেলিভারি সাকসেস রেশিও</span>
                      <span className="text-lg font-black font-mono text-indigo-200">{filteredSuccessRatio}%</span>
                    </div>
                    <span className="text-[8.5px] text-indigo-400 block mt-1 truncate">
                      {filteredSuccessRatio >= 85 ? '🟢 চমৎকার কার্ব' : filteredSuccessRatio >= 65 ? '🟡 মাঝারি ঝুঁকি' : '🔴 উচ্চ ঝুঁকি'}
                    </span>
                  </div>
                </div>

                {/* Progress bar representing Success Deliveries vs Cancellations */}
                <div className="space-y-1.5 bg-white/5 p-3 rounded-xl border border-white/5 font-sans">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-350 font-bold flex items-center gap-1 font-sans">
                      📈 ওভারঅল রিয়েল-টাইম সাকসেস গ্রাফ (Delivery vs Cancel)
                    </span>
                    <span className="text-indigo-300 font-extrabold font-mono">{filteredSuccessRatio}% সফল ডেলিভারি</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ width: `${filteredSuccessRatio}%` }}
                    />
                    <div 
                      className="bg-rose-500 h-full transition-all duration-500" 
                      style={{ width: `${100 - filteredSuccessRatio}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] sm:text-[9px] text-slate-400 font-sans">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" /> সফল ডেলিভারি ({filteredDeliveredCount})</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full inline-block" /> ক্যানসেলকৃত / বাতিল ({filteredCancelledCount})</span>
                  </div>
                </div>

                {/* Fraud check statistics categorizations */}
                <div className="grid grid-cols-4 gap-2 text-center pt-1 font-sans">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                    <span className="text-[8px] text-emerald-400 font-bold uppercase block font-sans">নিরাপদ (Safe)</span>
                    <span className="text-xs font-mono font-black text-emerald-300 mt-0.5 block">{filteredSafeCount} টি</span>
                  </div>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2">
                    <span className="text-[8px] text-indigo-300 font-bold uppercase block font-sans">সতর্কতা (Warning)</span>
                    <span className="text-xs font-mono font-black text-indigo-300 mt-0.5 block">{filteredWarningCount} টি</span>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                    <span className="text-[8px] text-amber-500 text-amber-300 font-bold uppercase block font-sans">ঝুঁকিপূর্ণ (High Risk)</span>
                    <span className="text-xs font-mono font-black text-amber-300 mt-0.5 block">{filteredHighRiskCount} টি</span>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-2">
                    <span className="text-[8px] text-rose-300 font-bold uppercase block font-sans">স্প্যামার (Scammer)</span>
                    <span className="text-xs font-mono font-black text-rose-300 mt-0.5 block">{filteredScammerCount} টি</span>
                  </div>
                </div>
              </div>

          {/* Google Sheets Integration Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <button
              onClick={() => setShowSheetsSection(!showSheetsSection)}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 border-b border-slate-200/60 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-slate-800 font-sans flex items-center gap-2">
                    📊 গুগল শিট লাইভ সিঙ্ক ড্যাশবোর্ড (Google Sheets Sync)
                    {sheetsConfig.connectedEmail ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200 rounded-full">
                        কানেক্টেড (Connected)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200 rounded-full">
                        ডিসকানেক্টেড
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-sans">
                    রেইনকোট অর্ডারগুলোকে সরাসরি গুগল স্প্রেডশিটে সিঙ্ক করুন এবং সংরক্ষণ করুন।
                  </p>
                </div>
              </div>
              <div>
                {showSheetsSection ? (
                  <ChevronUp className="h-4.5 w-4.5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4.5 w-4.5 text-slate-400" />
                )}
              </div>
            </button>

            {showSheetsSection && (
              <div className="p-5 space-y-4 font-sans bg-white text-slate-700 border-t border-slate-100">
                {/* Connection status notification */}
                {sheetsFeedback.message && (
                  <div className={`p-3 rounded-xl text-xs font-bold ${
                    sheetsFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                    sheetsFeedback.type === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                    'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    {sheetsFeedback.message}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left Column: Config Panel */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        ১. গুগল ক্লায়েন্ট আইডি (Google Client ID)
                        <HelpCircle className="h-3 w-3 text-slate-400 font-bold" />
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 123456-abcdef.apps.googleusercontent.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        disabled={!!getAccessToken()}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        ২. গুগল স্প্রেডশিট আইডি (Spreadsheet ID)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="পেস করুন অথবা নিজে তৈরি করুন"
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                          value={spreadsheetId}
                          onChange={(e) => setSpreadsheetId(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={handleCreateNewSheet}
                          disabled={isCreatingSheet || !getAccessToken()}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> শিট তৈরি করুন
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Connection State Card & Sync Actions */}
                  <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-700 font-sans">ইন্টিগ্রেশন স্ট্যাটাস ও তথ্য</h5>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-500">গুগল অ্যাকাউন্ট:</span>
                          <span className="font-semibold text-slate-800">{sheetsConfig.connectedEmail || 'কানেক্টেড নেই'}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-500">স্প্রেডশিট আইডি:</span>
                          <span className="font-mono text-slate-600 truncate max-w-[150px]" title={sheetsConfig.spreadsheetId || ''}>
                            {sheetsConfig.spreadsheetId || 'খালি (নথিভুক্ত করতে হবে)'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-500">সর্বশেষ সিঙ্ক সময়:</span>
                          <span className="text-slate-600 font-mono text-[9px]">
                            {sheetsConfig.lastSyncTime ? new Date(sheetsConfig.lastSyncTime).toLocaleString('bn-BD') : 'সিঙ্ক করা হয়নি'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/50 space-y-3">
                      <div className="p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg text-[9px] text-yellow-800 space-y-1">
                        <span className="font-bold flex items-center gap-1"><HelpCircle className="h-3.5 w-3.5 text-amber-600" /> গুগল ক্লাউড কনসোল রিমাইন্ডার:</span>
                        <p>আপনার কনসোলে <strong>Authorized redirect URIs</strong> বক্সে নিচের লিংকটি হুবহু পেস্ট করুন:</p>
                        <div className="bg-white/85 p-1 rounded font-mono text-[8.5px] border border-yellow-300 flex items-center justify-between select-all">
                          <span>{window.location.origin}</span>
                          <button 
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.origin);
                              alert('লিংকটি ক্লিপবোর্ডে কপি করা হয়েছে!');
                            }} 
                            className="text-blue-600 font-bold hover:underline ml-1 cursor-pointer text-[8px]"
                          >
                            কপি
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {!getAccessToken() ? (
                          <button
                            type="button"
                            onClick={handleConnectSheets}
                            disabled={isAuthorizing}
                            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Globe className="h-3.5 w-3.5 animate-pulse" /> গুগল অ্যাকাউন্ট কানেক্ট করুন
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={handleSyncAllOrders}
                              disabled={isSyncing || !spreadsheetId}
                              className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> ডাটা শিটে আপডেট করুন
                            </button>
                            <button
                              type="button"
                              onClick={handleDisconnectSheets}
                              className="py-2 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer border border-rose-200"
                              title="ডিসকানেক্ট করুন"
                            >
                              রিসেট/লগআউট
                            </button>
                          </>
                        )}
                      </div>

                      {getAccessToken() && spreadsheetId && (
                        <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={autoSync}
                            onChange={(e) => handleToggleAutoSync(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                          />
                          <span className="text-[10px] font-bold text-slate-600 font-sans flex items-center gap-1">
                            🚀 নতুন অর্ডারে রিয়েল-টাইম লাইভ সিঙ্ক সক্রিয় করুন (Auto Append)
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filters shelf */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 border border-slate-200/65 p-4 rounded-xl">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="নাম, ফোন বা ঠিকানা দিয়ে খুজুন..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-sans"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Size filtering */}
              <select
                className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none"
                value={filterSize}
                onChange={(e) => setFilterSize(e.target.value)}
              >
                <option value="All">সকল সাইজ (All Sizes)</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
                <option value="3XL">3XL</option>
                <option value="4XL">4XL</option>
              </select>

              {/* Status filtering */}
              <select
                className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none font-sans"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">সকল স্থিতি (All Statuses)</option>
                <option value="Pending">🕒 অপেক্ষমান (Pending)</option>
                <option value="Shipped">🚚 পাঠানো হয়েছে (Shipped)</option>
                <option value="Delivered">✅ ডেলিভারড (Delivered)</option>
                <option value="Canceled">❌ বাতিল/ফেইক (Canceled/Fake)</option>
              </select>

              {/* District filtering */}
              <select
                className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none font-sans cursor-pointer"
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
              >
                <option value="All">সকল জেলা (All Districts)</option>
                {ALL_64_DISTRICTS.map((dist) => (
                  <option key={dist.en} value={dist.en}>
                    {dist.en} ({dist.bn})
                  </option>
                ))}
                <option value="Other">Other (অন্যান্য)</option>
              </select>

              {/* Date / Calendar Preset Selector */}
              <select
                className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none font-sans"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">📅 সবসময়ের (All Time)</option>
                <option value="today">📅 আজকের (Today)</option>
                <option value="yesterday">📅 গতকালকের (Yesterday)</option>
                <option value="last3">📅 লাস্ট ৩ দিনের (Last 3 Days)</option>
                <option value="last7">📅 লাস্ট ৭ দিনের (Last 7 Days)</option>
                <option value="last15">📅 লাস্ট ১৫ দিনের (Last 15 Days)</option>
                <option value="last30">📅 লাস্ট ৩০ দিনের (Last 30 Days)</option>
                <option value="thisMonth">📅 এই মাসের (This Month)</option>
                <option value="lastMonth">📅 গত মাসের (Last Month)</option>
                <option value="last3Months">📅 গত ৩ মাসের (Last 3 Months)</option>
                <option value="last6Months">📅 গত ৬ মাসের (Last 6 Months)</option>
                <option value="thisYear">📅 এই বছরের (This Year)</option>
                <option value="lastYear">📅 গত বছরের (Last Year)</option>
                <option value="custom">🗓️ কাস্টম কেলেন্ডার (Custom Range)</option>
              </select>

              {/* Custom Date Picker Inputs when Custom is Selected */}
              {dateFilter === 'custom' && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto font-sans">
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-50 to-white border border-indigo-155 p-1 rounded-lg shadow-sm">
                    <div className="flex items-center gap-1 pl-1.5 text-indigo-700">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span className="text-[10px] font-bold tracking-wider uppercase shrink-0">From:</span>
                    </div>
                    <input
                      type="date"
                      className="px-2 py-1 bg-transparent text-[11px] text-indigo-900 font-bold focus:outline-none outline-none cursor-pointer border-0 ring-0 focus:ring-0"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      title="শুরুর তারিখ"
                    />
                    <span className="text-indigo-400 text-[10px] font-bold px-1 select-none">To:</span>
                    <input
                      type="date"
                      className="px-2 py-1 bg-transparent text-[11px] text-indigo-900 font-bold focus:outline-none outline-none cursor-pointer border-0 ring-0 focus:ring-0"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      title="শেষের তারিখ"
                    />
                  </div>
                  
                  {/* Quick clear tool or errors */}
                  <div className="flex items-center gap-1.5">
                    {customStartDate && customEndDate && new Date(customStartDate) > new Date(customEndDate) && (
                      <span className="text-[10px] text-red-600 bg-red-50 border border-red-100 py-1 px-2 rounded-lg font-bold">
                        ⚠️ শুরুর তারিখ শেষের চেয়ে বড়!
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setCustomStartDate('');
                        setCustomEndDate('');
                        setDateFilter('all');
                      }}
                      className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-705 border border-slate-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      title="তারিখ ফিল্টার রিসেট করুন"
                    >
                      <X className="h-2.5 w-2.5" /> রিসেট
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Admin utilities */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto justify-end">
              <button
                disabled={isCreatingTestOrder}
                onClick={handleCreateTestOrder}
                className="p-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white rounded-lg transition flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer shadow-xs disabled:opacity-50"
                title="টেস্ট রেইনকোট অর্ডার ক্রিয়েট করুন"
              >
                <Sparkles className={`h-3.5 w-3.5 ${isCreatingTestOrder ? 'animate-spin' : ''}`} /> টেস্ট অর্ডার তৈরি করুন
              </button>
              <button
                onClick={loadOrders}
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> রিলোড ডাটা
              </button>
              
              {activeTab === 'completed' ? (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleBulkPrintLabels}
                    className="py-2 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition flex items-center justify-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
                    title="নির্বাচিত বায়ারদের জন্য স্টিকার লেবেল প্রিন্ট করুন (35mm x 35mm)"
                  >
                    <Printer className="h-3.5 w-3.5" /> লেবেল প্রিন্ট করুন
                  </button>
                  <button
                    onClick={handleCopyCSV}
                    className="py-2 px-3 bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg transition flex items-center justify-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
                    title="ক্লিপবোর্ডে কপি করুন"
                  >
                    <ClipboardCopy className="h-3.5 w-3.5" /> CSV কপি
                  </button>
                  <button
                    onClick={handleDownloadCSV}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center justify-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer animate-bounce-on-hover"
                    title="কম্পিউটারে এক্সেল স্প্রেডশিট ডাউনলোড করুন"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" /> CSV ডাউনলোড করুন
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleClearAllIncomplete}
                  disabled={incompleteOrders.length === 0}
                  className="py-2 px-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-lg transition flex items-center justify-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> সকল ড্রাফট মুছুন
                </button>
              )}
            </div>
          </div>

          {copiedMessage && (
            <div className="p-3 bg-emerald-500 text-white font-sans text-xs font-bold rounded-xl text-center shadow-xs">
              {copiedMessage}
            </div>
          )}

          {/* Selection control block */}
          {selectedOrderIds.length > 0 && activeTab === 'completed' && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between shadow-xs text-xs font-semibold animate-fade-in flex-wrap gap-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white">
                  {selectedOrderIds.length}
                </span>
                <span className="text-slate-700 font-sans">টি অর্ডার নির্বাচিত করা হয়েছে।</span>
                <button
                  onClick={() => setSelectedOrderIds([])}
                  className="text-indigo-600 hover:text-indigo-850 underline ml-2 text-[11px] cursor-pointer"
                >
                  সব সিলেকশন বাতিল করুন
                </button>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={handleBulkPrintLabels}
                  className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center justify-center gap-1.5 text-xs font-bold shadow-md cursor-pointer"
                >
                  <Printer className="h-4 w-4" /> বারকোড স্টিকার প্রিন্ট করুন (35mm x 35mm)
                </button>

                <span className="text-indigo-200 hidden md:inline">|</span>

                <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-indigo-100 shadow-2xs">
                  <span className="text-slate-500 font-sans text-[11px] font-semibold">বাল্ক অ্যাকশন (Bulk):</span>
                  <select
                    className="bg-transparent border-0 text-[11px] font-bold text-indigo-950 focus:ring-0 focus:outline-none cursor-pointer pr-8 font-sans"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      if (val === 'Confirmed') {
                        handleBulkSetConfirmed(true);
                      } else if (val === 'Unconfirmed') {
                        handleBulkSetConfirmed(false);
                      } else if (val === 'Delete') {
                        handleBulkDelete();
                      } else {
                        handleBulkUpdateStatus(val);
                      }
                      e.target.value = ''; // Reset select back to placeholder
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>অ্যাকশন নির্বাচন করুন...</option>
                    <optgroup label="কনফার্মেশন">
                      <option value="Confirmed">✅ অর্ডার কনফার্ম করুন (Set Confirmed)</option>
                      <option value="Unconfirmed">❌ কনফার্মেশন বাতিল (Set Unconfirmed)</option>
                    </optgroup>
                    <optgroup label="ডেলিভারি স্থিতি">
                      <option value="Pending">🕒 অপেক্ষমান সেট করুন (Set Pending)</option>
                      <option value="Shipped">🚚 পাঠানো হয়েছে সেট করুন (Set Shipped)</option>
                      <option value="Delivered">✅ ডেলিভারড সেট করুন (Set Delivered)</option>
                      <option value="Canceled">❌ বাতিল সেট করুন (Set Canceled)</option>
                    </optgroup>
                    <optgroup label="অন্যান্য">
                      <option value="Delete">🗑️ অর্ডার মুছে ফেলুন (Delete Selected)</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Orders log table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[1000px] min-h-[450px] shadow-sm bg-white">
            {activeTab === 'completed' ? (
              <table className="w-full text-xs text-left text-slate-500">
                <thead className="bg-slate-100 text-slate-700 uppercase font-mono text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-center min-w-[75px] font-sans">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="text-[9px] font-sans font-bold tracking-normal leading-none uppercase">Select</span>
                        <input 
                          type="checkbox"
                          className="rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer h-3.2 w-3.2"
                          checked={paginatedOrders.length > 0 && paginatedOrders.every(o => selectedOrderIds.includes(o.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newSelected = Array.from(new Set([...selectedOrderIds, ...paginatedOrders.map(o => o.id)]));
                              setSelectedOrderIds(newSelected);
                            } else {
                              const paginatedIds = paginatedOrders.map(o => o.id);
                              setSelectedOrderIds(selectedOrderIds.filter(id => !paginatedIds.includes(id)));
                            }
                          }}
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-2">গ্রাহক ও ফোন</th>
                    <th scope="col" className="px-4 py-2">ঠিকানা</th>
                    <th scope="col" className="px-3 py-2 text-center">সাইজ/কালার</th>
                    <th scope="col" className="px-3 py-2 text-center">ওজন ও উচ্চতা</th>
                    <th scope="col" className="px-3 py-2 text-right">মূল্য (Price)</th>
                    <th scope="col" className="px-4 py-2 text-center">অর্ডার কনফার্ম</th>
                    <th scope="col" className="px-4 py-2 text-center">ডেলিভারি স্থিতি</th>
                    <th scope="col" className="px-4 py-2 text-center">Steadfast সিঙ্ক</th>
                    <th scope="col" className="px-4 py-2 text-center">মুছে ফেলুন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-slate-400 text-xs font-sans">
                        কোনো কাস্টমার বা সাকসেসফুল অর্ডার ডাটাবেসে পাওয়া যায়নি!
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                        <td className="px-3 py-1.5 text-center">
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <input 
                              type="checkbox"
                              className="rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer h-3.2 w-3.2"
                              checked={selectedOrderIds.includes(order.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedOrderIds([...selectedOrderIds, order.id]);
                                } else {
                                  setSelectedOrderIds(selectedOrderIds.filter(id => id !== order.id));
                                }
                              }}
                            />
                            <span className="text-[9px] text-slate-400 font-sans font-medium leading-none select-none">Select</span>
                          </div>
                        </td>
                        <td className="px-4 py-1.5">
                          <div className="font-extrabold text-slate-900 leading-tight">{order.name}</div>
                          <div className="font-mono text-[10.5px] text-slate-600 mt-0.5 flex items-center gap-1 flex-wrap">
                            <span>{order.phone}</span>
                            <a
                              href={`tel:${order.phone}`}
                              className="inline-flex items-center justify-center p-0.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
                              title="সরাসরি কল করুন"
                            >
                              <Phone className="h-2.5 w-2.5" />
                            </a>
                            <a
                              href={getWhatsAppUrlCompleted(order)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center p-0.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-150 transition-all cursor-pointer hover:border-emerald-300"
                              title="WhatsApp এ নিশ্চিতকরণ মেসেজ পাঠান"
                            >
                              <svg className="h-2.5 w-2.5 fill-emerald-600" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.497-5.73-1.446L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 1.981 14.111.957 11.488.957c-5.43 0-9.85 4.37-9.854 9.799-.001 1.918.52 3.79 1.51 5.4l-.994 3.631 3.907-.98zm11.233-6.983c-.3-.149-1.764-.868-2.038-.967-.272-.098-.471-.148-.669.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.647.074-.3-.149-1.265-.465-2.41-1.483-.89-.792-1.49-1.77-1.665-2.07-.173-.296-.018-.456.13-.605.134-.133.3-.347.45-.52.149-.174.199-.297.298-.495.1-.2.05-.371-.025-.52-.075-.148-.669-1.611-.916-2.206-.24-.579-.487-.501-.669-.51l-.57-.01c-.197 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.764-.719 2.012-1.412.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m0 0" />
                              </svg>
                            </a>
                            {getPhoneRiskBadge(order.phone, order)}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5 flex flex-wrap gap-x-1.5 items-center">
                            <span>আইডি: #{order.id?.replace('ord-', '').slice(0, 8)}</span>
                            <span className="text-indigo-500 italic">{formatBanglaDate(order.createdAt)}</span>
                          </div>
                          
                          {/* কন্টেইনার এ কনসাইনমেন্ট/ট্র্যাকিং আইডি ম্যানুয়াল বা অটো প্রদর্শন ও এডিট অপশন */}
                          <div className="mt-1 text-[9.5px]">
                            {order.trackingId ? (
                              <div className="flex items-center gap-1.5 flex-wrap bg-blue-50/40 px-1 py-0.5 rounded border border-blue-100">
                                <span className="text-[8px] uppercase font-bold text-blue-750">কুরিয়ার কনসাইনমেন্ট:</span>
                                {editingTrackingOrderId === order.id ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      autoFocus
                                      value={tempTrackingId}
                                      onChange={(e) => setTempTrackingId(e.target.value)}
                                      placeholder="কনসাইনমেন্ট আইডি"
                                      className="px-1.5 py-0.5 text-[9px] border border-slate-300 rounded bg-white w-28 outline-none focus:border-indigo-500 font-mono"
                                    />
                                    <button
                                      onClick={() => handleSaveManualTracking(order.id, tempTrackingId)}
                                      className="p-0.5 bg-emerald-100 text-emerald-700 rounded border border-emerald-300 cursor-pointer"
                                    >
                                      <Check className="h-2.5 w-2.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingTrackingOrderId(null)}
                                      className="p-0.5 bg-slate-100 text-slate-600 rounded border border-slate-300 cursor-pointer"
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="font-mono text-[9px] font-black text-slate-800 bg-white border border-slate-200 px-1 py-0.2 rounded">
                                      📦 {order.trackingId}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setEditingTrackingOrderId(order.id);
                                        setTempTrackingId(order.trackingId || '');
                                      }}
                                      className="text-[8px] text-blue-600 hover:text-indigo-700 font-semibold hover:underline cursor-pointer"
                                    >
                                      সম্পাদনা
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                {editingTrackingOrderId === order.id ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      autoFocus
                                      value={tempTrackingId}
                                      onChange={(e) => setTempTrackingId(e.target.value)}
                                      placeholder="কনসাইনমেন্ট আইডি"
                                      className="px-1.5 py-0.5 text-[9px] border border-slate-300 rounded bg-white w-32 outline-none focus:border-indigo-500 font-mono"
                                    />
                                    <button
                                      onClick={() => handleSaveManualTracking(order.id, tempTrackingId)}
                                      className="p-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-250 cursor-pointer"
                                    >
                                      <Check className="h-2.5 w-2.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingTrackingOrderId(null)}
                                      className="p-0.5 bg-slate-50 text-slate-500 rounded border border-slate-200 cursor-pointer"
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingTrackingOrderId(order.id);
                                      setTempTrackingId('');
                                    }}
                                    className="text-[8.5px] text-indigo-600 hover:text-indigo-850 font-bold bg-indigo-50/50 hover:bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200/30 cursor-pointer inline-flex items-center gap-0.5"
                                  >
                                    + কুরিয়ার আইডি
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* কাস্টমার অর্ডার হিস্টোরি ও ডাবল অর্ডার চেকার */}
                          {(() => {
                            const currentCleanPhone = order.phone.replace(/\D/g, '').slice(-11);
                            if (!currentCleanPhone) return null;

                            // Filter all orders matching this customer phone
                            const customerHistory = orders.filter(o => o.phone.replace(/\D/g, '').slice(-11) === currentCleanPhone);
                            const totalPreviousCount = customerHistory.length;

                            // Parse current order creation time
                            const currentOrderTime = new Date(order.createdAt).getTime();

                            // Duplicate order check within three days (+ / - 3 days from this order)
                            const repeatOrdersIn3Days = customerHistory.filter(o => {
                              if (o.id === order.id) return false;
                              const otherOrderTime = new Date(o.createdAt).getTime();
                              const diffInMs = Math.abs(currentOrderTime - otherOrderTime);
                              return diffInMs <= (3 * 24 * 60 * 60 * 1000); // 3 days in milliseconds
                            });

                            const hasRepeatOrder = repeatOrdersIn3Days.length > 0;

                            return (
                              <div className="mt-1 space-y-1 border-t border-slate-100 pt-1 text-[9px]">
                                <div className="font-semibold flex items-center gap-1 text-slate-650 flex-wrap leading-none">
                                  <span>👤 বিগত অর্ডার:</span>
                                  <span className={`px-1 py-0.2 rounded-xs font-mono font-bold text-[9.5px] ${totalPreviousCount > 1 ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'text-slate-500'}`}>
                                    {totalPreviousCount} টি
                                  </span>
                                  {totalPreviousCount > 1 && (
                                    <span className="text-[8px] text-slate-450 block max-w-[170px] truncate" title={customerHistory.map(h => `${h.size}(${h.color === 'Black' ? 'কালো' : 'ব্লু'})`).join(', ')}>
                                      ({customerHistory.map(h => `${h.size}(${h.color === 'Black' ? 'কালো' : 'ব্লু'})`).join(', ')})
                                    </span>
                                  )}
                                </div>
                                {hasRepeatOrder && (
                                  <div className="flex items-center gap-1 p-0.5 bg-red-50 border border-red-150 text-red-700 rounded text-[8.5px] font-bold animate-pulse max-w-[180px]">
                                    <ShieldAlert className="h-2.5 w-2.5 text-red-600 shrink-0" />
                                    <span className="truncate">৩ দিনে ডাবল: #{repeatOrdersIn3Days[0].id.replace('ord-', '').slice(0, 5)}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-1.5 max-w-[180px]">
                          <div className="text-slate-800 block leading-tight font-medium">{order.village}</div>
                          <div className="text-[10px] text-slate-505 mt-0.5 flex flex-wrap gap-1 items-center">
                            {[order.policeStation, order.district].filter(Boolean).join(', ') ? (
                              <span>{[order.policeStation, order.district].filter(Boolean).join(', ')}</span>
                            ) : null}
                            <span className="bg-amber-100 text-amber-800 border border-amber-200 py-0.5 px-1.5 rounded-sm text-[9px] font-bold font-mono tracking-wide uppercase shrink-0">
                              📍 {getEnglishDistrictName(order)}
                            </span>
                          </div>
                          {order.orderNotes && (
                            <div className="mt-1 p-1 rounded bg-blue-50 border border-blue-100/50 text-[9.5px] text-blue-800 font-semibold leading-relaxed">
                              📝 <span className="text-slate-500 font-bold">নোট:</span> {order.orderNotes}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <span className="bg-indigo-50 border border-indigo-100/50 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded font-mono inline-block text-[9.5px]">
                            {order.size}
                          </span>
                          <span className="text-[8.5px] text-slate-500 mt-0.5 block">
                            ({order.color === 'Black' ? 'কালো' : 'নেভি ব্লু'})
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-center font-mono text-[9.5px] text-slate-600">
                          <div>{order.weight} kg</div>
                          <div className="text-slate-400">{order.heightFeet}’{order.heightInches}”</div>
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-900 text-[10px]">
                          {order.price} TK
                        </td>
                        
                        {/* Order confirmation checkbox panel */}
                        <td className="px-4 py-1.5 text-center">
                          <button
                            onClick={() => handleToggleConfirmOrder(order.id)}
                            className={`px-2 py-1 rounded-full text-[9px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                              order.isConfirmed
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-extrabold'
                                : 'bg-amber-500/5 text-amber-600 border-amber-500/20'
                            }`}
                          >
                            {order.isConfirmed ? (
                              <>
                                <ShieldCheck className="h-3 w-3 text-emerald-600 fill-emerald-600/10" />
                                কনফার্মড
                              </>
                            ) : (
                              <>
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping mr-0.5" />
                                কনফার্ম করুন
                              </>
                            )}
                          </button>
                        </td>

                        <td className="px-4 py-1.5 text-center">
                          <select
                            value={order.status}
                            onChange={(e) => handleChangeStatus(order.id, e.target.value as any)}
                            className={`px-1.5 py-0.5 text-[9.5px] rounded border font-bold focus:outline-none cursor-pointer ${
                              order.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              order.status === 'Shipped' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                              order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              order.status === 'Canceled' || order.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              order.status === 'Canceled Fake Order' ? 'bg-slate-100 text-slate-600 border-slate-300 line-through opacity-75' :
                              'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            <option value="Pending">অপেক্ষমাণ (Pending)</option>
                            <option value="Shipped">পথে রয়েছে (Shipped)</option>
                            <option value="Delivered">ডেলিভারড (Delivered)</option>
                            <option value="Canceled">অর্ডার বাতিল (Canceled)</option>
                            <option value="Canceled Fake Order">ফেক বাতিল (Canceled Fake Order)</option>
                          </select>
                        </td>
                        <td className="px-4 py-1.5 text-center min-w-[115px]">
                          {(() => {
                            const info = steadfastStatuses[order.id];
                            if (!info) {
                              return (
                                <button
                                  onClick={() => fetchSteadfastStatus(order.id)}
                                  className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-150 border border-slate-200 text-slate-600 rounded text-[8.5px] font-bold cursor-pointer inline-flex items-center gap-1 transition-all"
                                >
                                  <RefreshCw className="h-2 w-2" />
                                  চেক সিঙ্ক
                                </button>
                              );
                            }

                            if (info.loading) {
                              return (
                                <span className="inline-flex items-center gap-1 text-[8.5px] font-bold text-slate-500 animate-pulse bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded">
                                  <RefreshCw className="h-2 w-2 animate-spin" />
                                  লোডিং...
                                </span>
                              );
                            }

                            const { text, style } = getSteadfastStatusLabelAndStyle(info.status);
                            return (
                              <div className="flex flex-col items-center gap-1 justify-center">
                                <span className={`px-1.5 py-0.5 rounded-sm text-[8px] text-center font-bold tracking-tight shrink-0 inline-block leading-none ${style}`}>
                                  {text}
                                </span>
                                <button
                                  onClick={() => fetchSteadfastStatus(order.id)}
                                  className="text-[8px] text-slate-450 hover:text-indigo-600 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                                  title="পুনরায় যাচাই করুন"
                                >
                                  <RefreshCw className="h-2 w-2" />
                                  রিলোড
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-1.5 text-center min-w-[120px]">
                          {deletingOrderId === order.id ? (
                            <div className="flex items-center justify-center gap-1 animate-fadeIn">
                              <button
                                onClick={() => handleDelete(order.id)}
                                className="px-1.5 py-0.5 bg-red-650 hover:bg-red-750 text-white rounded text-[9px] font-bold shadow-xs transition-all"
                                title="মুছে ফেলা নিশ্চিত করুন"
                              >
                                কনফার্ম
                              </button>
                              <button
                                onClick={() => setDeletingOrderId(null)}
                                className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[9px] font-bold shadow-xs transition-all"
                                title="বাতিল করুন"
                              >
                                বাতিল
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleStartEditOrder(order)}
                                className="p-1 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-800 rounded transition-all cursor-pointer inline-flex items-center justify-center border border-indigo-100/50"
                                title="অর্ডার সংশোধন (Edit)"
                              >
                                <Edit className="h-3.2 w-3.2" />
                              </button>
                              <button
                                onClick={() => {
                                  if (!perms.canDelete) {
                                    alert('দুঃখিত, আপনার অ্যাকাউন্টে কোনো ডেটা মুছে ফেলার (Delete) অনুমতি দেওয়া হয়নি!');
                                    return;
                                  }
                                  setDeletingOrderId(order.id);
                                }}
                                className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded transition-all cursor-pointer inline-flex items-center justify-center border border-rose-100/50"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="h-3.2 w-3.2" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              // Incomplete parameters list
              <table className="w-full text-xs text-left text-slate-500">
                <thead className="bg-slate-100 text-slate-700 uppercase font-mono text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-4 py-3">টাইপ করা গ্রাহক ও ফোন</th>
                    <th scope="col" className="px-4 py-3">আংশিক টাইপকৃত ঠিকানা</th>
                    <th scope="col" className="px-3 py-3 text-center">সাইজ/কালার পছন্দ</th>
                    <th scope="col" className="px-3 py-3 text-center">পূরণের শতকরা মাত্রা</th>
                    <th scope="col" className="px-4 py-3 text-center">টাইপ করার সময় ও তারিখ</th>
                    <th scope="col" className="px-4 py-3 text-center">মুছে ফেলুন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredIncompleteOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs font-sans">
                        কোনো কাস্টমার ইনকমপ্লিট ড্রাফট ডেটা পাওয়া যায়নি! গ্রাহক ফর্মে টাইপ শুরু করলে এখানে রিয়েল-টাইম লাইভ দেখাবে।
                      </td>
                    </tr>
                  ) : (
                    filteredIncompleteOrders.map((draft) => (
                      <tr key={draft.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-extrabold text-slate-900">
                            {draft.name ? draft.name : <span className="text-slate-350 italic">নাম উল্লেখ করেনি</span>}
                          </div>
                          <div className="font-mono text-[11px] text-orange-650 mt-0.5 flex items-center gap-1.5 flex-wrap">
                            {draft.phone ? (
                              <>
                                <span>{draft.phone}</span>
                                <a
                                  href={`tel:${draft.phone}`}
                                  className="inline-flex items-center justify-center p-1 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 transition-all cursor-pointer"
                                  title="সরাসরি কল করুন"
                                >
                                  <Phone className="h-3 w-3" />
                                </a>
                                <a
                                  href={getWhatsAppUrlDraft(draft)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center p-1 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-150 transition-all cursor-pointer hover:border-emerald-300"
                                  title="WhatsApp এ ড্রাফট ফলোআপ ও মেসেজ পাঠান"
                                >
                                  <svg className="h-3 w-3 fill-emerald-600" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.497-5.73-1.446L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 1.981 14.111.957 11.488.957c-5.43 0-9.85 4.37-9.854 9.799-.001 1.918.52 3.79 1.51 5.4l-.994 3.631 3.907-.98zm11.233-6.983c-.3-.149-1.764-.868-2.038-.967-.272-.098-.471-.148-.669.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.647.074-.3-.149-1.265-.465-2.41-1.483-.89-.792-1.49-1.77-1.665-2.07-.173-.296-.018-.456.13-.605.134-.133.3-.347.45-.52.149-.174.199-.297.298-.495.1-.2.05-.371-.025-.52-.075-.148-.669-1.611-.916-2.206-.24-.579-.487-.501-.669-.51l-.57-.01c-.197 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.764-.719 2.012-1.412.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m0 0" />
                                  </svg>
                                </a>
                                {getPhoneRiskBadge(draft.phone, draft, false)}
                              </>
                            ) : (
                              <span className="text-slate-300 italic">নাম্বার দেয়নি</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 max-w-[180px]">
                          <div className="text-slate-700 block leading-tight font-medium">
                            {draft.village ? draft.village : <span className="text-slate-350 italic">ঠিকানা উল্লেখ করেনি</span>}
                          </div>
                          {draft.village && (
                            <div className="mt-1 flex flex-wrap gap-1 items-center">
                              <span className="bg-amber-100 text-amber-850 border border-amber-205 py-0.5 px-1.5 rounded-sm text-[9px] font-bold font-mono tracking-wide uppercase shrink-0">
                                📍 {getEnglishDistrictName(draft)}
                              </span>
                            </div>
                          )}
                          {draft.orderNotes && (
                            <div className="mt-1.5 p-1 rounded-lg bg-blue-50 border border-blue-100/50 text-[10px] text-blue-800 font-semibold leading-relaxed">
                              📝 <span className="text-slate-500 font-bold">নোট:</span> {draft.orderNotes}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="bg-slate-100 text-slate-700 font-extrabold px-1.5 py-0.5 rounded font-mono text-[10px]">
                            {draft.size}
                          </span>
                          <span className="text-[9px] text-slate-500 mt-1 block">
                            ({draft.color === 'Black' ? 'কালো' : 'নেভি ব্লু'})
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-extrabold text-[10px] text-slate-700 uppercase">
                              {Math.round(((draft.fieldsFilledCount || 0) / 3) * 100)}% কমপ্লিট
                            </span>
                            <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden border border-slate-200">
                              <div 
                                className="bg-orange-500 h-full rounded-full"
                                style={{ width: `${((draft.fieldsFilledCount || 0) / 3) * 105}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center text-orange-700 font-semibold font-sans text-[10px]">
                          {formatBanglaDate(draft.lastUpdatedAt || draft.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 text-center min-w-[200px]">
                          {deletingIncompleteId === draft.id ? (
                            <div className="flex items-center justify-center gap-1.5 animate-fadeIn">
                              <button
                                onClick={() => handleDeleteIncomplete(draft.id)}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold shadow-sm transition-all"
                                title="মুছে ফেলা নিশ্চিত করুন"
                              >
                                কনফার্ম করুন
                              </button>
                              <button
                                onClick={() => setDeletingIncompleteId(null)}
                                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold shadow-sm transition-all"
                                title="বাতিল করুন"
                              >
                                বাতিল
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleMoveDraftToCompleted(draft)}
                                className="px-2 py-1.5 bg-emerald-650 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer border border-emerald-500/10"
                                title="ড্রাফট থেকে সফল অর্ডারে মুভ করুন"
                              >
                                <CheckCircle className="h-3.5 w-3.5 text-white" />
                                সফল অর্ডারে মুভ করুন
                              </button>
                              <button
                                onClick={() => {
                                  if (!perms.canDelete) {
                                    alert('দুঃখিত, আপনার অ্যাকাউন্টে ড্রাফট ডেটা মুছে ফেলার (Delete) অনুমতি দেওয়া হয়নি!');
                                    return;
                                  }
                                  setDeletingIncompleteId(draft.id);
                                }}
                                className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center border border-rose-100/50"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Completed Orders Pagination controls */}
          {activeTab === 'completed' && (
            <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 font-sans shadow-2xs">
              <div className="flex items-center gap-2 flex-wrap text-center sm:text-left">
                <span>মোট সফল অর্ডার: <strong className="text-slate-900 font-extrabold">{filteredOrders.length}টি</strong></span>
                <span className="text-slate-300">|</span>
                <span>দেখা যাচ্ছে: <strong className="text-slate-900 font-bold">{filteredOrders.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + completedPageSize, filteredOrders.length)}টি</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={completedPage === 1}
                  onClick={() => setCompletedPage(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1.5 bg-white border border-slate-250 hover:bg-slate-50 disabled:bg-slate-100 disabled:opacity-50 text-slate-700 disabled:text-slate-400 font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1 select-none"
                >
                  ◀ পূর্ববর্তী
                </button>
                <div className="flex items-center gap-1">
                  <span className="font-mono bg-white border border-slate-250 px-2 py-1.5 rounded-lg text-slate-800 font-bold">
                    {completedPage}
                  </span>
                  <span className="text-slate-400 font-mono">/ {totalCompletedPages}</span>
                </div>
                <button
                  disabled={completedPage >= totalCompletedPages}
                  onClick={() => setCompletedPage(p => Math.min(totalCompletedPages, p + 1))}
                  className="px-2.5 py-1.5 bg-white border border-slate-250 hover:bg-slate-50 disabled:bg-slate-100 disabled:opacity-50 text-slate-700 disabled:text-slate-400 font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1 select-none"
                >
                  পরবর্তী ▶
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span>প্রতি পাতায়:</span>
                <select
                  value={completedPageSize}
                  onChange={(e) => setCompletedPageSize(Number(e.target.value))}
                  className="bg-white border border-slate-250 px-2 py-1 rounded-md text-xs font-bold text-slate-700 cursor-pointer outline-none focus:border-indigo-500"
                >
                  <option value={10}>১০ টা</option>
                  <option value={20}>২০ টা</option>
                  <option value={50}>৫০ টা</option>
                  <option value={100}>১০০ টা</option>
                  <option value={200}>২০০ টা</option>
                  <option value={500}>৫০০ টা</option>
                </select>
              </div>
            </div>
          )}
        </>
      ) : null}

      {activeTab === 'pages' && (
        <PagesAdmin 
          onRefreshPages={onRefreshPages || (() => {})} 
          userRole={perms.canEdit ? userRole : 'ReadOnly'}
        />
      )}

      {activeTab === 'products' && (
        <ProductsAdmin 
          onRefreshProducts={onRefreshProducts || (() => {})} 
          userRole={perms.canEdit ? userRole : 'ReadOnly'}
        />
      )}

      {activeTab === 'media' && (
        <MediaAdmin 
          userRole={perms.canEdit ? userRole : 'ReadOnly'}
        />
      )}

      {activeTab === 'banners' && (
        <BannersAdmin 
          userRole={perms.canEdit ? userRole : 'ReadOnly'}
        />
      )}

      {activeTab === 'inventory' && (
        <InventoryAdmin 
          userRole={perms.canEdit ? userRole : 'ReadOnly'}
        />
      )}

      {activeTab === 'integrations' && (
        <IntegrationsAdmin 
          userRole={perms.canEdit ? userRole : 'ReadOnly'}
        />
      )}

      {activeTab === 'users' && (
        <UsersAdmin 
          currentUser={currentUser}
          onRefreshUsers={() => {}}
          userRole={perms.canEdit ? userRole : 'ReadOnly'}
        />
      )}

      {activeTab === 'blocking' && (
        <BlockingAdmin 
          userRole={perms.canEdit ? userRole : 'ReadOnly'}
        />
      )}

      {activeTab === 'fraud' && (
        <FraudAdmin 
          userRole={perms.canEdit ? userRole : 'ReadOnly'}
        />
      )}

      {activeTab === 'live-visitors' && (
        <LiveVisitorsAdmin />
      )}

      {activeTab === 'advanced_addons' && (
        <AdvancedPluginsAdmin 
          userRole={perms.canEdit ? userRole : 'ReadOnly'}
          orders={orders}
          onRefreshOrders={loadOrders}
        />
      )}

      {(activeTab === 'courier_hub' || activeTab === 'courier_connections') && (
        <CourierAdmin 
          userRole={perms.canEdit ? userRole : 'ReadOnly'}
          orders={orders}
          onRefreshOrders={loadOrders}
        />
      )}

      {activeTab === 'courier_monitor' && (
        <CourierMonitorAdmin 
          orders={orders}
        />
      )}

      {activeTab === 'section_customizer' && (
        <SectionCustomizerAdmin 
          userRole={perms.canEdit ? userRole : 'ReadOnly'}
        />
      )}

      {activeTab === 'reviews_hub' && (
        <ReviewsAdmin 
          userRole={perms.canEdit ? userRole : 'ReadOnly'}
        />
      )}

          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-100 p-4 px-6 text-slate-600 text-[10px] sm:text-xs font-sans flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0 border-t border-slate-200">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            লাইভ ডেটা ক্লাউড মনিটরিং সচল আছে (Firebase Cloud Database)
          </span>
          <span className="flex items-center gap-1 text-slate-700 font-extrabold">
            <CheckSquare className="h-4 w-4 text-emerald-600" /> ১০০০+ সন্তুষ্ট গ্রাহকদের রিভিউ প্রসেসড
          </span>
        </div>

        {/* Edit Order Modal */}
        {editingOrder && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 leading-relaxed font-sans">
            <div className="bg-white rounded-3xl border border-slate-200 outline-none shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
              
              {/* Header */}
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-white text-md">অর্ডার সংশোধন / এডিটর প্যানেল</h3>
                  <p className="text-[10px] text-slate-300">অর্ডার আইডি: #{editingOrder.id}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                
                {/* Name & Phone */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-slate-700 text-xs font-bold block">কাস্টমারের নাম</label>
                    <input
                      type="text"
                      value={editingOrder.name || ''}
                      onChange={(e) => setEditingOrder({ ...editingOrder, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-700 text-xs font-bold block">মোবাইল নাম্বার</label>
                    <input
                      type="text"
                      value={editingOrder.phone || ''}
                      onChange={(e) => setEditingOrder({ ...editingOrder, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Size & Color */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-slate-700 text-xs font-bold block">সাইজ পছন্দ করুন</label>
                    <select
                      value={editingOrder.size || 'XL'}
                      onChange={(e) => setEditingOrder({ ...editingOrder, size: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="XL">XL (উচ্চতা: ৫’২” - ৫’৬”)</option>
                      <option value="XXL">XXL (উচ্চতা: ৫’৭” - ৫’১০”)</option>
                      <option value="3XL">3XL (উচ্চতা: ৫’১১” - ৬’১”)</option>
                      <option value="4XL">4XL (উচ্চতা: ৬’২”+)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-700 text-xs font-bold block">কালার পছন্দ করুন</label>
                    <select
                      value={editingOrder.color || 'Black'}
                      onChange={(e) => setEditingOrder({ ...editingOrder, color: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Black">কালো (Premium Black)</option>
                      <option value="Navy Blue">নেভি ব্লু (Premium Navy Blue)</option>
                    </select>
                  </div>
                </div>

                {/* Height & Weight */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-700 text-[11px] font-bold block">ওজন (কেজি)</label>
                    <input
                      type="number"
                      value={editingOrder.weight || 60}
                      onChange={(e) => setEditingOrder({ ...editingOrder, weight: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-700 text-[11px] font-bold block">উচ্চতা (ফুট)</label>
                    <input
                      type="number"
                      value={editingOrder.heightFeet || 5}
                      onChange={(e) => setEditingOrder({ ...editingOrder, heightFeet: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-700 text-[11px] font-bold block">উচ্চতা (ইঞ্চি)</label>
                    <input
                      type="number"
                      value={editingOrder.heightInches || 0}
                      onChange={(e) => setEditingOrder({ ...editingOrder, heightInches: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* District & PS */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-slate-700 text-xs font-bold block">থানা / উপজেলা</label>
                    <input
                      type="text"
                      value={editingOrder.policeStation || ''}
                      onChange={(e) => setEditingOrder({ ...editingOrder, policeStation: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-700 text-xs font-bold block">জেলা</label>
                    <input
                      type="text"
                      value={editingOrder.district || ''}
                      onChange={(e) => setEditingOrder({ ...editingOrder, district: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* Delivery Village / Full Address */}
                <div className="space-y-1">
                  <label className="text-slate-700 text-xs font-bold block">গ্রাম / রোড / মহল্লা (পূর্ণাঙ্গ ঠিকানা)</label>
                  <input
                    type="text"
                    value={editingOrder.village || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, village: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Price & Notes */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-slate-700 text-xs font-bold block">অর্ডার মূল্য (TK)</label>
                    <input
                      type="number"
                      value={editingOrder.price || 0}
                      onChange={(e) => setEditingOrder({ ...editingOrder, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-700 text-xs font-bold block">ডেলিভারি কোম্পানি</label>
                    <input
                      type="text"
                      value={editingOrder.courierName || ''}
                      onChange={(e) => setEditingOrder({ ...editingOrder, courierName: e.target.value })}
                      placeholder="যেমন: Pathao, Steadfast, RedX"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 text-xs font-bold block">অর্ডারের বিশেষ নোট</label>
                  <textarea
                    value={editingOrder.orderNotes || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, orderNotes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs h-16 resize-none focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

              </div>

              {/* Form Footer */}
              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditOrder}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer flex items-center gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  সংরক্ষণ করুন (Save Changes)
                </button>
              </div>

            </div>
          </div>
        )}

      {/* 35mm x 35mm Thermal Label Print Preview Modal */}
      {showPrintLabelModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-55 leading-relaxed font-sans overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleIn flex flex-col my-8">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-indigo-400 shrink-0 animate-pulse" />
                <div>
                  <h2 className="font-extrabold text-white text-sm">থার্মাল লেবেল প্রিন্ট প্রাকদর্শন (35mm x 35mm Label Preview)</h2>
                  <p className="text-[10px] text-slate-300">{orders.filter(o => selectedOrderIds.includes(o.id)).length} টি বায়ারের লেবেল প্রিন্ট করার জন্য নির্ধারিত করা হয়েছে</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowPrintLabelModal(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Instructions / Tips */}
            <div className="bg-amber-50 border-b border-amber-100 p-4 shrink-0 text-amber-900 text-[11px] font-sans">
              <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-950">
                <span>💡 থার্মাল প্রিন্টিং টিপস (Thermal Printer settings):</span>
              </div>
              <ul className="list-disc pl-4.5 space-y-0.5 font-medium">
                <li>প্রিন্ট উইন্ডো লোড হলে <strong>Paper Size: 35mm x 35mm</strong> অথবা <strong>১.৩৮" x ১.৩৮"</strong> কাস্টম সাইজ দিন।</li>
                <li><strong>Margins: None / Minimum (কোন মার্জিন ছাড়া)</strong> সিলেক্ট করুন।</li>
                <li><strong>Scale: Fit to Page (অথবা ১০০%)</strong> নিশ্চিত করুন যাতে লেবেলের লেখাগুলি কেটে না যায়।</li>
              </ul>
            </div>

            {/* Body Preview Area */}
            <div className="p-6 bg-slate-50 overflow-y-auto max-h-[50vh] flex flex-wrap gap-4 items-center justify-center">
              {orders
                .filter((o) => selectedOrderIds.includes(o.id))
                .map((order) => (
                  <div key={order.id} className="transition shadow-sm hover:shadow-md bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[9px] font-sans font-bold text-slate-400 text-center mb-1 bg-slate-100 py-0.5 rounded">প্রাকদর্শন (Sticker Preview)</div>
                    
                    {/* Visual 35mm x 35mm Box */}
                    <div style={{
                      position: 'relative',
                      width: '35mm',
                      height: '35mm',
                      minWidth: '35mm',
                      minHeight: '35mm',
                      maxWidth: '35mm',
                      maxHeight: '35mm',
                      padding: '2mm',
                      boxSizing: 'border-box',
                      border: '1.2px dashed #64748b',
                      borderRadius: '4px',
                      background: '#fff',
                      color: '#000',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      fontFamily: 'Arial, sans-serif',
                      lineHeight: '1.1',
                    }}>
                      {/* Top bar: Product name first word and Size badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #000', paddingBottom: '1px', width: '100%' }}>
                        <span style={{ fontSize: '9.5px', fontWeight: '900', textTransform: 'uppercase', color: '#000' }}>
                          {getProductNameFirstWord(order)}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: '950', background: '#e2e8f0', padding: '0 4.5px', borderRadius: '3px' }}>
                          {order.size}
                        </span>
                      </div>

                      {/* Content: Customer name & phone number */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', margin: '1px 0', width: '100%', textAlign: 'left' }}>
                        <div style={{ fontSize: '9px', fontWeight: '900', color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {order.name}
                        </div>
                        <div style={{ fontSize: '10.5px', fontWeight: '950', fontFamily: 'monospace', color: '#000' }}>
                          {order.phone}
                        </div>
                      </div>

                      {/* Color decoration, Price, custom values */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', fontSize: '7.5px', fontWeight: '800', width: '100%', margin: '1px 0' }}>
                        <span style={{ border: '0.5px solid #000', padding: '0.2px 2px', borderRadius: '2px', background: '#fff' }}>
                          {order.color === 'Black' ? 'কালো' : 'ব্লু'}
                        </span>
                        <span style={{ border: '0.5px solid #000', padding: '0.2px 2px', borderRadius: '2px', background: '#fff' }}>
                          {order.price}৳
                        </span>
                        <span style={{ border: '0.5px solid #000', padding: '0.2px 2px', borderRadius: '2px', background: '#fff' }}>
                          {order.weight}kg / {order.heightFeet}′{order.heightInches}″
                        </span>
                      </div>

                      {/* Bottom Footer: Address, District and order id */}
                      <div style={{ borderTop: '0.7px solid #000', paddingTop: '1.5px', width: '100%', textAlign: 'left' }}>
                        <div style={{ fontSize: '7.5px', fontWeight: '800', color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {order.village}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5px', fontWeight: '700', color: '#333', marginTop: '1.2px', textTransform: 'uppercase' }}>
                          <span style={{ fontWeight: '950', color: '#111' }}>{order.district || 'Other'}</span>
                          <span style={{ fontSize: '6px' }}>#{order.id.replace('ord-', '').slice(0, 7)}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="bg-slate-100 px-6 py-4 flex justify-between gap-2 border-t border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setShowPrintLabelModal(false)}
                className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                প্রিভিউ বন্ধ করুন (Close Preview)
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPrintLabelModal(false);
                  setTimeout(() => {
                    window.print();
                  }, 300);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                এখনই প্রিন্ট করুন (Print Labels Now)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 35mm x 35mm Thermal Label Print Element */}
      {selectedOrderIds.length > 0 && (
        <div id="print-area-wrapper" className="hidden print:block">
          <style dangerouslySetInnerHTML={{ __html: `
            /* Hide absolute everything else during print */
            @media print {
              body {
                visibility: hidden !important;
                background: white !important;
              }
              #print-area-wrapper, #print-area-wrapper * {
                visibility: visible !important;
              }
              #print-area-wrapper {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 35mm !important;
                height: auto !important;
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              @page {
                size: 35mm 35mm !important;
                margin: 0 !important;
              }
              .print-label-item {
                width: 35.0mm !important;
                height: 35.0mm !important;
                max-width: 35.0mm !important;
                max-height: 35.0mm !important;
                padding: 2.0mm !important;
                box-sizing: border-box !important;
                page-break-after: always !important;
                break-after: page !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                align-items: flex-start !important;
                text-align: left !important;
                font-family: Arial, sans-serif !important;
                background: white !important;
                color: black !important;
                border: 1px dashed #000 !important;
                border-radius: 4px !important;
                page-break-inside: avoid !important;
                margin: 0 !important;
                overflow: hidden !important;
                line-height: 1.1 !important;
              }
            }
          `}} />
          {orders
            .filter((o) => selectedOrderIds.includes(o.id))
            .map((order) => (
              <div key={order.id} className="print-label-item">
                {/* Header: Product first word & Size */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #000', paddingBottom: '1px', width: '100%', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '9.5px', fontWeight: '900', textTransform: 'uppercase', color: '#000' }}>
                    {getProductNameFirstWord(order)}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: '950', background: '#e2e8f0', padding: '0 4.5px', borderRadius: '3px' }}>
                    {order.size}
                  </span>
                </div>

                {/* Body: Customer Name & Phone Number */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', margin: '1px 0', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: '9px', fontWeight: '900', color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {order.name}
                  </div>
                  <div style={{ fontSize: '10.5px', fontWeight: '950', fontFamily: 'monospace', color: '#000' }}>
                    {order.phone}
                  </div>
                </div>

                {/* Details Section: Color, Price, Weight/Height */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', fontSize: '7.5px', fontWeight: '800', width: '100%', margin: '1px 0', boxSizing: 'border-box' }}>
                  <span style={{ border: '0.5px solid #000', padding: '0.2px 2px', borderRadius: '2px', background: '#fff' }}>
                    {order.color === 'Black' ? 'কালো' : 'ব্লু'}
                  </span>
                  <span style={{ border: '0.5px solid #000', padding: '0.2px 2px', borderRadius: '2px', background: '#fff' }}>
                    {order.price}৳
                  </span>
                  <span style={{ border: '0.5px solid #000', padding: '0.2px 2px', borderRadius: '2px', background: '#fff' }}>
                    {order.weight}kg / {order.heightFeet}′{order.heightInches}″
                  </span>
                </div>

                {/* Footer: Order Details (Village & District) */}
                <div style={{ borderTop: '0.7px solid #000', paddingTop: '1.5px', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: '7.5px', fontWeight: '800', color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {order.village}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6.5px', fontWeight: '700', color: '#333', marginTop: '1.2px', textTransform: 'uppercase' }}>
                    <span style={{ fontWeight: '950', color: '#111' }}>{order.district || 'Other'}</span>
                    <span style={{ fontSize: '6px' }}>#{order.id.replace('ord-', '').slice(0, 7)}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Floating Real-time New Order alerts toasts container - beautifully compact, easily closable */}
      {alerts.length > 0 && (
        <div className="fixed right-3 bottom-3 md:right-5 md:bottom-5 z-[9999] flex flex-col gap-2 max-w-[315px] w-[calc(100%-1.5rem)] font-sans pointer-events-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-slate-900 border border-amber-500/40 text-white p-3 rounded-xl shadow-2xl flex flex-col gap-2 relative animate-in slide-in-from-bottom duration-300 ring-1 ring-amber-500/10"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] text-amber-400 font-extrabold tracking-wider uppercase animate-pulse">
                  <Flame className="h-3.5 w-3.5 text-orange-500 shrink-0 fill-orange-500" />
                  নতুন অর্ডার এসেছে!
                </span>
                <button
                  type="button"
                  onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                  className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition flex items-center justify-center cursor-pointer"
                  style={{ minWidth: '38px', minHeight: '38px' }}
                  title="বন্ধ করুন (Close)"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Order Info */}
              <div className="bg-slate-950/85 p-2 rounded-lg border border-slate-800/80 space-y-1">
                <div className="flex justify-between items-start gap-1.5">
                  <div className="font-bold text-xs truncate max-w-[170px] text-slate-100">👤 {alert.order.name}</div>
                  <div className="text-[9.5px] bg-indigo-950/60 border border-indigo-900 text-indigo-300 px-1.5 py-0.5 rounded font-black shrink-0">
                    ৳{alert.order.price}
                  </div>
                </div>
                <div className="text-[10px] font-bold font-mono text-emerald-400">📞 {alert.order.phone}</div>
                <div className="text-[9.5px] text-slate-400 truncate">📍 {alert.order.district} {alert.order.policeStation ? `| ${alert.order.policeStation}` : ''}</div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                  className="px-2.5 py-1 text-slate-400 hover:text-slate-200 text-[10px] font-bold hover:underline transition"
                >
                  কেটে দিন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm(alert.order.id);
                    setAlerts(prev => prev.filter(a => a.id !== alert.id));
                  }}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[10.5px] font-black cursor-pointer transition shadow-sm"
                >
                  অর্ডারটি দেখুন
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      </div>
    </div>
  );
}
