import React, { useState, useEffect } from 'react';
import { 
  Eye, ShieldAlert, Trash2, ClipboardCopy, FileSpreadsheet, Search, 
  RefreshCw, X, ShieldCheck, CheckSquare, Globe, Database, Sparkles, 
  Check, ExternalLink, HelpCircle, Flame, ChevronDown, ChevronUp,
  Lock, Key, LogOut, Settings, ListTodo, AlertOctagon, Layers, Users, Calendar
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
  sendFirebasePasswordReset
} from '../lib/firebase';

import PagesAdmin from './admin/PagesAdmin';
import ProductsAdmin from './admin/ProductsAdmin';
import IntegrationsAdmin from './admin/IntegrationsAdmin';
import UsersAdmin from './admin/UsersAdmin';
import BlockingAdmin from './admin/BlockingAdmin';
import InventoryAdmin from './admin/InventoryAdmin';
import MediaAdmin from './admin/MediaAdmin';

interface AdminPanelProps {
  onClose: () => void;
  onRefreshOrdersCount: () => void;
  onRefreshPages?: () => void;
  onRefreshProducts?: () => void;
}

export default function AdminPanel({ onClose, onRefreshOrdersCount, onRefreshPages, onRefreshProducts }: AdminPanelProps) {
  const [orders, setOrders] = useState<RaincoatOrder[]>([]);
  const [incompleteOrders, setIncompleteOrders] = useState<IncompleteOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'completed' | 'incomplete' | 'pages' | 'products' | 'inventory' | 'integrations' | 'users' | 'blocking' | 'media'>('completed');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSize, setFilterSize] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [copiedMessage, setCopiedMessage] = useState('');
  
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

  const loadIncompleteOrders = () => {
    const incompleteJson = localStorage.getItem('raincoat_incomplete_orders') || '[]';
    try {
      const parsed = JSON.parse(incompleteJson);
      // Sort newest first
      parsed.sort((a: any, b: any) => new Date(b.lastUpdatedAt || b.createdAt).getTime() - new Date(a.lastUpdatedAt || a.createdAt).getTime());
      setIncompleteOrders(parsed);
    } catch (e) {
      console.error(e);
    }
  };

  const loadOrders = async () => {
    // Stage 1: Load immediately from local offline cache
    const listJson = localStorage.getItem('raincoat_orders') || '[]';
    setOrders(JSON.parse(listJson));
    loadIncompleteOrders();
    onRefreshOrdersCount();

    // Stage 2: Fetch active e-commerce orders from Firestore database
    try {
      const fbOrders = await getOrdersFromFirestore();
      if (fbOrders && fbOrders.length > 0) {
        setOrders(fbOrders);
        localStorage.setItem('raincoat_orders', JSON.stringify(fbOrders));
      }
      
      const fbIncompletes = await getIncompleteOrdersFromFirestore();
      if (fbIncompletes && fbIncompletes.length > 0) {
        setIncompleteOrders(fbIncompletes);
        localStorage.setItem('raincoat_incomplete_orders', JSON.stringify(fbIncompletes));
      }
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
  }, []);

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
    if (confirm('আপনি কি নিশ্চিতভাবেই এই অর্ডারটি মুছে ফেলতে চান?')) {
      const updated = orders.filter(o => o.id !== id);
      localStorage.setItem('raincoat_orders', JSON.stringify(updated));
      setOrders(updated);
      onRefreshOrdersCount();

      // Delete from Firestore
      deleteOrderFromFirestore(id).catch((err) => {
        console.warn("Failed to delete order from Cloud Firestore database:", err);
      });
    }
  };

  const handleDeleteIncomplete = (id: string) => {
    if (!perms.canDelete) {
      alert('দুঃখিত, আপনার অ্যাকাউন্টে ড্রাফট ডেটা মুছে ফেলার (Delete) অনুমতি দেওয়া হয়নি!');
      return;
    }
    if (confirm('আপনি কি নিশ্চিতভাবেই এই ইনকমপ্লিট ড্রাফটি মুছে ফেলতে চান?')) {
      const updated = incompleteOrders.filter(o => o.id !== id);
      localStorage.setItem('raincoat_incomplete_orders', JSON.stringify(updated));
      setIncompleteOrders(updated);

      // Delete from Firestore
      deleteIncompleteOrderFromFirestore(id).catch((err) => {
        console.warn("Failed to delete incomplete draft from Firestore database:", err);
      });
    }
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
      localStorage.setItem('raincoat_incomplete_orders', '[]');
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
    localStorage.setItem('raincoat_orders', JSON.stringify(updated));
    setOrders(updated);

    // Update status in Firestore
    updateOrderInFirestore(id, { status: newStatus }).catch((err) => {
      console.warn("Failed to update status in Cloud Firestore database:", err);
    });

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
    localStorage.setItem('raincoat_orders', JSON.stringify(updated));
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
    const matchSearch = 
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.phone.includes(searchTerm) ||
      (o.village && o.village.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchSize = filterSize === 'All' || o.size === filterSize;
    const matchDate = isDateInSelectedRange(o.createdAt);
    return matchSearch && matchSize && matchDate;
  });

  const filteredIncompleteOrders = incompleteOrders.filter(o => {
    const matchSearch = 
      (o.name && o.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.phone && o.phone.includes(searchTerm)) ||
      (o.village && o.village.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchSize = filterSize === 'All' || o.size === filterSize;
    const matchDate = isDateInSelectedRange(o.createdAt);
    return matchSearch && matchSize && matchDate;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.price, 0);
  const filteredRevenue = filteredOrders.reduce((sum, o) => sum + o.price, 0);
  const filteredConfirmedCount = filteredOrders.filter(o => o.isConfirmed).length;
  const filteredIncompleteCount = filteredIncompleteOrders.length;

  const isStandAlone = window.location.pathname === '/admin' || window.location.hash === '#/admin' || window.location.hash === '#admin';

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

              {/* Status filtering */}
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
                <div className="flex items-center gap-1.5 w-full sm:w-auto font-sans bg-white border border-slate-250 p-1 rounded-lg">
                  <input
                    type="date"
                    className="px-2 py-1 bg-transparent text-[11px] text-slate-600 focus:outline-none outline-none"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    title="শুরুর তারিখ"
                  />
                  <span className="text-slate-400 text-[10px] font-bold">হতে</span>
                  <input
                    type="date"
                    className="px-2 py-1 bg-transparent text-[11px] text-slate-600 focus:outline-none outline-none"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    title="শেষের তারিখ"
                  />
                </div>
              )}
            </div>

            {/* Admin utilities */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto justify-end">
              <button
                onClick={loadOrders}
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> রিলোড ডাটা
              </button>
              
              {activeTab === 'completed' ? (
                <div className="flex gap-2 shrink-0">
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

          {/* Orders log table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[450px]">
            {activeTab === 'completed' ? (
              <table className="w-full text-xs text-left text-slate-500">
                <thead className="bg-slate-100 text-slate-700 uppercase font-mono text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-4 py-3">গ্রাহক ও ফোন</th>
                    <th scope="col" className="px-4 py-3">ঠিকানা</th>
                    <th scope="col" className="px-3 py-3 text-center">সাইজ/কালার</th>
                    <th scope="col" className="px-3 py-3 text-center">ওজন ও উচ্চতা</th>
                    <th scope="col" className="px-3 py-3 text-right">মূল্য (Price)</th>
                    <th scope="col" className="px-4 py-3 text-center">অর্ডার কনফার্ম</th>
                    <th scope="col" className="px-4 py-3 text-center">ডেলিভারি স্থিতি</th>
                    <th scope="col" className="px-4 py-3 text-center">মুছে ফেলুন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-xs font-sans">
                        কোনো কাস্টমার বা সাকসেসফুল অর্ডার ডাটাবেসে পাওয়া যায়নি!
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-extrabold text-slate-900">{order.name}</div>
                          <div className="font-mono text-[10px] text-slate-500 mt-0.5">{order.phone}</div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">অর্ডার আইডি: {order.id}</div>
                          <div className="text-[9px] text-indigo-500 mt-0.5 italic">{formatBanglaDate(order.createdAt)}</div>
                        </td>
                        <td className="px-4 py-3.5 max-w-[180px]">
                          <div className="text-slate-800 block leading-tight font-medium">{order.village}</div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            {[order.policeStation, order.district].filter(Boolean).join(', ') || <span className="text-slate-400 italic">ঠিকানা</span>}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded font-mono block w-fit mx-auto text-[10px]">
                            {order.size}
                          </span>
                          <span className="text-[9px] text-slate-500 mt-1 block">
                            ({order.color === 'Black' ? 'কালো' : 'নেভি ব্লু'})
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center font-mono text-[10px] text-slate-600">
                          <div>{order.weight} kg</div>
                          <div className="text-slate-400">{order.heightFeet}’{order.heightInches}”</div>
                        </td>
                        <td className="px-3 py-3.5 text-right font-mono font-bold text-slate-900">
                          {order.price} TK
                        </td>
                        
                        {/* Order confirmation checkbox panel */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => handleToggleConfirmOrder(order.id)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                              order.isConfirmed
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                : 'bg-amber-500/5 text-amber-600 border-amber-500/20'
                            }`}
                          >
                            {order.isConfirmed ? (
                              <>
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600/10" />
                                কনফার্মড
                              </>
                            ) : (
                              <>
                                <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping mr-0.5" />
                                কনফার্ম করুন
                              </>
                            )}
                          </button>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <select
                            value={order.status}
                            onChange={(e) => handleChangeStatus(order.id, e.target.value as any)}
                            className={`px-2 py-1 text-[10px] rounded-lg border font-bold focus:outline-none ${
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
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg hover:text-rose-700 transition cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
                          <div className="font-mono text-[11px] text-orange-650 mt-0.5">
                            {draft.phone ? draft.phone : <span className="text-slate-300 italic">নাম্বার দেয়নি</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 max-w-[180px]">
                          <div className="text-slate-700 block leading-tight">
                            {draft.village ? draft.village : <span className="text-slate-350 italic">ঠিকানা উল্লেখ করেনি</span>}
                          </div>
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
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => handleDeleteIncomplete(draft.id)}
                            className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg hover:text-rose-700 transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
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

          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-100 p-4 px-6 text-slate-600 text-[10px] sm:text-xs font-sans flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0 border-t border-slate-200">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            লাইভ ডেটা মনিটরিং অ্যাক্টিভ আছে (Local Storage Engine)
          </span>
          <span className="flex items-center gap-1 text-slate-700 font-extrabold">
            <CheckSquare className="h-4 w-4 text-emerald-600" /> ১০০০+ সন্তুষ্ট গ্রাহকদের রিভিউ প্রসেসড
          </span>
        </div>

      </div>
    </div>
  );
}
