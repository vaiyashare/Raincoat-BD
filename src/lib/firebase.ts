import { initializeApp } from 'firebase/app';
import { 
  getAuth,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  collection, 
  getDocFromServer,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { RaincoatOrder, IncompleteOrder, InventoryItem, ProductColor, Size, MediaItem, ActiveSession, Product, HomepageBannerSlide, HomepageBannerSettings, CustomPage, CustomerReview, AdvancedAddonsSettings } from '../types';
export type { AdvancedAddonsSettings };
import { performFraudCheck } from './fraudCheck';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore Database with instance ID and force long polling to bypass iframe socket blocks
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, dbId);

// Basic connection validation
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client appears to be offline. Verify network connection.");
    }
  }
}
testConnection();

// Mandatory Error Handling schemas from Skill specification
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Circuit breaker state to protect against Firestore Quota Exceeded limits
let isQuotaTripped = false;
try {
  // Clear any historical blockages immediately so client resumes real-time operations
  localStorage.removeItem('firestore_quota_tripped');
  localStorage.removeItem('firestore_quota_tripped_persistent');
  localStorage.removeItem('firestore_quota_tripped_time');
  sessionStorage.removeItem('firestore_quota_tripped');
} catch (_) {}

function tripQuotaCircuitBreaker(error: any) {
  if (!error) return;
  const errMsg = error instanceof Error ? error.message : String(error);
  if (
    errMsg.includes('Quota limit exceeded') || 
    errMsg.includes('Quota exceeded') ||
    errMsg.includes('quota') ||
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('quota metric')
  ) {
    console.warn("⚠️ FIRESTORE QUOTA ALERT: A Firestore quota limitation has occurred.", errMsg);
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  tripQuotaCircuitBreaker(error);
  const errMsg = error instanceof Error ? error.message : String(error);
  const isQuota = errMsg.includes('Quota limit exceeded') || 
                  errMsg.includes('Quota exceeded') ||
                  errMsg.includes('quota') ||
                  errMsg.includes('RESOURCE_EXHAUSTED') ||
                  errMsg.includes('quota metric');

  const errInfo = {
    error: errMsg,
    operationType,
    path,
    timestamp: new Date().toISOString()
  };

  if (isQuota) {
    console.warn('Firestore Quota Limit Graceful Fallback (using standalone local storage):', JSON.stringify(errInfo));
  } else {
    console.error('Firestore Integration Error: ', JSON.stringify(errInfo));
  }
  
  throw new Error(JSON.stringify(errInfo));
}

// Order Database API methods
export async function addOrderToFirestore(order: RaincoatOrder): Promise<void> {
  const path = `orders/${order.id}`;

  // Real-time fraud detection check right before committing to Firestore database
  try {
    const fraud = await performFraudCheck(order.phone);
    order.fraudScore = fraud.score;
    order.fraudStatus = fraud.status;
    order.fraudReason = fraud.reason;
  } catch (fe) {
    console.error("Fraud API investigation error, bypassing to continue order:", fe);
  }

  if (isQuotaTripped) {
    const cachedStr = localStorage.getItem('raincoat_orders_fallback') || '[]';
    try {
      const list = JSON.parse(cachedStr) as RaincoatOrder[];
      if (!list.find(o => o.id === order.id)) {
        list.push(order);
        localStorage.setItem('raincoat_orders_fallback', JSON.stringify(list));
      }
    } catch (_) {}
    return;
  }
  try {
    await setDoc(doc(db, 'orders', order.id), order);
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateOrderInFirestore(orderId: string, updates: Partial<RaincoatOrder>): Promise<void> {
  const path = `orders/${orderId}`;
  if (isQuotaTripped) {
    const cachedStr = localStorage.getItem('raincoat_orders_fallback') || '[]';
    try {
      const list = JSON.parse(cachedStr) as RaincoatOrder[];
      const idx = list.findIndex(o => o.id === orderId);
      if (idx > -1) {
        list[idx] = { ...list[idx], ...updates };
        localStorage.setItem('raincoat_orders_fallback', JSON.stringify(list));
      }
    } catch (_) {}
    return;
  }
  try {
    await updateDoc(doc(db, 'orders', orderId), updates as any);
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  if (isQuotaTripped) {
    const cachedStr = localStorage.getItem('raincoat_orders_fallback') || '[]';
    try {
      const list = JSON.parse(cachedStr) as RaincoatOrder[];
      const filtered = list.filter(o => o.id !== orderId);
      localStorage.setItem('raincoat_orders_fallback', JSON.stringify(filtered));
    } catch (_) {}
    return;
  }
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getOrdersFromFirestore(): Promise<RaincoatOrder[]> {
  const path = 'orders';
  if (isQuotaTripped) {
    const cached = localStorage.getItem('raincoat_orders_fallback') || localStorage.getItem('raincoat_orders');
    if (cached) {
      try {
        return JSON.parse(cached) as RaincoatOrder[];
      } catch (_) {}
    }
    return [];
  }
  try {
    const q = query(collection(db, 'orders'));
    const snapshot = await getDocs(q);
    const results: RaincoatOrder[] = [];
    snapshot.forEach((doc) => {
      results.push(doc.data() as RaincoatOrder);
    });
    try {
      localStorage.setItem('raincoat_orders_fallback', JSON.stringify(results));
    } catch (_) {}
    return results;
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    try {
      handleFirestoreError(error, OperationType.LIST, path);
    } catch (e) {
      console.warn("getOrdersFromFirestore failed, returning cached fallback:", e);
    }
    const cached = localStorage.getItem('raincoat_orders_fallback') || localStorage.getItem('raincoat_orders');
    if (cached) {
      try {
        return JSON.parse(cached) as RaincoatOrder[];
      } catch (_) {}
    }
    return [];
  }
}

// Incomplete Orders Draft API
export async function addIncompleteOrderToFirestore(draft: IncompleteOrder): Promise<void> {
  const path = `incompleteOrders/${draft.id}`;
  if (isQuotaTripped) {
    const cachedStr = localStorage.getItem('raincoat_incomplete_orders_fallback') || '[]';
    try {
      const list = JSON.parse(cachedStr) as IncompleteOrder[];
      if (!list.find(o => o.id === draft.id)) {
        list.push(draft);
        localStorage.setItem('raincoat_incomplete_orders_fallback', JSON.stringify(list));
      }
    } catch (_) {}
    return;
  }
  try {
    await setDoc(doc(db, 'incompleteOrders', draft.id), draft);
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteIncompleteOrderFromFirestore(draftId: string): Promise<void> {
  const path = `incompleteOrders/${draftId}`;
  if (isQuotaTripped) {
    const cachedStr = localStorage.getItem('raincoat_incomplete_orders_fallback') || '[]';
    try {
      const list = JSON.parse(cachedStr) as IncompleteOrder[];
      const filtered = list.filter(o => o.id !== draftId);
      localStorage.setItem('raincoat_incomplete_orders_fallback', JSON.stringify(filtered));
    } catch (_) {}
    return;
  }
  try {
    await deleteDoc(doc(db, 'incompleteOrders', draftId));
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getIncompleteOrdersFromFirestore(): Promise<IncompleteOrder[]> {
  const path = 'incompleteOrders';
  if (isQuotaTripped) {
    const cached = localStorage.getItem('raincoat_incomplete_orders_fallback');
    if (cached) {
      try {
        return JSON.parse(cached) as IncompleteOrder[];
      } catch (_) {}
    }
    return [];
  }
  try {
    const q = query(collection(db, 'incompleteOrders'));
    const snapshot = await getDocs(q);
    const results: IncompleteOrder[] = [];
    snapshot.forEach((doc) => {
      results.push(doc.data() as IncompleteOrder);
    });
    try {
      localStorage.setItem('raincoat_incomplete_orders_fallback', JSON.stringify(results));
    } catch (_) {}
    return results;
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    try {
      handleFirestoreError(error, OperationType.LIST, path);
    } catch (e) {
      console.warn("getIncompleteOrdersFromFirestore failed, returning fallback:", e);
    }
    const cached = localStorage.getItem('raincoat_incomplete_orders_fallback');
    if (cached) {
      try {
        return JSON.parse(cached) as IncompleteOrder[];
      } catch (_) {}
    }
    return [];
  }
}

// Inventory API methods
export async function getInventoryFromFirestore(): Promise<InventoryItem[]> {
  const path = 'inventory';
  const colors: ProductColor[] = ['Navy Blue', 'Black'];
  const sizes: Size[] = ['XL', 'XXL', '3XL', '4XL'];
  const defaultInventory: InventoryItem[] = [];
  colors.forEach(color => {
    sizes.forEach(size => {
      defaultInventory.push({
        id: `${color}-${size}`,
        color,
        size,
        quantity: 50,
        lowStockAlert: 10
      });
    });
  });

  if (isQuotaTripped) {
    const cached = localStorage.getItem('raincoat_inventory_fallback') || localStorage.getItem('raincoat_inventory');
    if (cached) {
      try {
        return JSON.parse(cached) as InventoryItem[];
      } catch (_) {}
    }
    return defaultInventory;
  }

  try {
    const q = query(collection(db, 'inventory'));
    const snapshot = await getDocs(q);
    const results: InventoryItem[] = [];
    snapshot.forEach((doc) => {
      results.push(doc.data() as InventoryItem);
    });
    try {
      localStorage.setItem('raincoat_inventory_fallback', JSON.stringify(results));
    } catch (_) {}
    return results;
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    try {
      handleFirestoreError(error, OperationType.LIST, path);
    } catch (e) {
      console.warn("getInventoryFromFirestore failed, returning fallback:", e);
    }
    const cached = localStorage.getItem('raincoat_inventory_fallback') || localStorage.getItem('raincoat_inventory');
    if (cached) {
      try {
        return JSON.parse(cached) as InventoryItem[];
      } catch (_) {}
    }
    return defaultInventory;
  }
}

export async function saveInventoryItemToFirestore(item: InventoryItem): Promise<void> {
  const path = `inventory/${item.id}`;
  if (isQuotaTripped) {
    const cachedStr = localStorage.getItem('raincoat_inventory_fallback') || '[]';
    try {
      const list = JSON.parse(cachedStr) as InventoryItem[];
      const idx = list.findIndex(i => i.id === item.id);
      if (idx > -1) {
        list[idx] = item;
      } else {
        list.push(item);
      }
      localStorage.setItem('raincoat_inventory_fallback', JSON.stringify(list));
    } catch (_) {}
    return;
  }
  try {
    await setDoc(doc(db, 'inventory', item.id), item);
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function decrementInventoryItemInFirestore(color: ProductColor, size: Size): Promise<void> {
  const itemId = `${color}-${size}`;
  const path = `inventory/${itemId}`;
  if (isQuotaTripped) {
    const cachedStr = localStorage.getItem('raincoat_inventory_fallback') || '[]';
    try {
      const list = JSON.parse(cachedStr) as InventoryItem[];
      const idx = list.findIndex(i => i.id === itemId);
      if (idx > -1) {
        list[idx].quantity = Math.max(0, (list[idx].quantity || 50) - 1);
        localStorage.setItem('raincoat_inventory_fallback', JSON.stringify(list));
      }
    } catch (_) {}
    return;
  }
  try {
    const q = query(collection(db, 'inventory'));
    const snapshot = await getDocs(q);
    let currentQty = 50; 
    let currentAlert = 10;
    
    snapshot.forEach((doc) => {
      if (doc.id === itemId) {
        const d = doc.data();
        currentQty = d.quantity ?? 50;
        currentAlert = d.lowStockAlert ?? 10;
      }
    });

    const newQty = Math.max(0, currentQty - 1);
    await setDoc(doc(db, 'inventory', itemId), {
      id: itemId,
      color,
      size,
      quantity: newQty,
      lowStockAlert: currentAlert
    });
    
    const local = localStorage.getItem('raincoat_inventory');
    if (local) {
      try {
        const list = JSON.parse(local) as InventoryItem[];
        const idx = list.findIndex(i => i.id === itemId);
        if (idx > -1) {
          list[idx].quantity = newQty;
          localStorage.setItem('raincoat_inventory', JSON.stringify(list));
        }
      } catch (e) {}
    }
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Media Management API methods for Landing Page Slideshow Customizer
export async function getMediaFromFirestore(): Promise<MediaItem[]> {
  const path = 'media';
  if (isQuotaTripped) {
    const cached = localStorage.getItem('raincoat_media_gallery_fallback') || localStorage.getItem('raincoat_media_gallery');
    if (cached) {
      try {
        return JSON.parse(cached) as MediaItem[];
      } catch (_) {}
    }
    return [];
  }
  try {
    const q = query(collection(db, 'media'));
    const snapshot = await getDocs(q);
    const results: MediaItem[] = [];
    snapshot.forEach((doc) => {
      results.push(doc.data() as MediaItem);
    });
    // Sort ascendingly by orderIndex
    results.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    try {
      localStorage.setItem('raincoat_media_gallery_fallback', JSON.stringify(results));
    } catch (_) {}
    return results;
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    try {
      handleFirestoreError(error, OperationType.LIST, path);
    } catch (e) {
      console.warn("getMediaFromFirestore failed, returning cached fallback if available:", e);
    }
    const cached = localStorage.getItem('raincoat_media_gallery_fallback') || localStorage.getItem('raincoat_media_gallery');
    if (cached) {
      try {
        return JSON.parse(cached) as MediaItem[];
      } catch (_) {}
    }
    return [];
  }
}

export async function saveMediaToFirestore(item: MediaItem): Promise<void> {
  const path = `media/${item.id}`;
  if (isQuotaTripped) {
    const cachedStr = localStorage.getItem('raincoat_media_gallery_fallback') || '[]';
    try {
      const list = JSON.parse(cachedStr) as MediaItem[];
      const idx = list.findIndex(m => m.id === item.id);
      if (idx > -1) {
        list[idx] = item;
      } else {
        list.push(item);
      }
      localStorage.setItem('raincoat_media_gallery_fallback', JSON.stringify(list));
    } catch (_) {}
    return;
  }
  try {
    await setDoc(doc(db, 'media', item.id), item);
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMediaFromFirestore(id: string): Promise<void> {
  const path = `media/${id}`;
  if (isQuotaTripped) {
    const cachedStr = localStorage.getItem('raincoat_media_gallery_fallback') || '[]';
    try {
      const list = JSON.parse(cachedStr) as MediaItem[];
      const filtered = list.filter(m => m.id !== id);
      localStorage.setItem('raincoat_media_gallery_fallback', JSON.stringify(filtered));
    } catch (_) {}
    return;
  }
  try {
    await deleteDoc(doc(db, 'media', id));
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Global App & Integrations Settings API (Firestore Persistent)
export interface IntegrationsSettings {
  fb_pixel_id: string;
  fb_pixel_enabled: boolean;
  fb_capi_enabled: boolean;
  fb_advanced_matching: boolean;
  fb_capi_token: string;
  fb_test_event_enabled: boolean;
  fb_test_event_code: string;
  ga_track_id: string;
  raincoat_header_snippets: string;
  raincoat_footer_snippets: string;
  raincoat_courier_inside: number;
  raincoat_courier_sub: number;
  raincoat_courier_outside: number;
  whatsapp_enabled?: boolean;
  whatsapp_provider?: 'ultramsg' | 'greenapi' | 'custom_webhook';
  whatsapp_instance_id?: string;
  whatsapp_token?: string;
  whatsapp_message_template?: string;
  tiktok_pixel_id?: string;
  tiktok_pixel_enabled?: boolean;
}

export async function saveIntegrationsSettingsToFirestore(settings: Partial<IntegrationsSettings>): Promise<void> {
  const path = 'settings/integrations';
  if (isQuotaTripped) {
    const cachedStr = localStorage.getItem('raincoat_settings_fallback');
    const existing = cachedStr ? JSON.parse(cachedStr) : {};
    const updated = { ...existing, ...settings };
    localStorage.setItem('raincoat_settings_fallback', JSON.stringify(updated));
    return;
  }
  try {
    await setDoc(doc(db, 'settings', 'integrations'), {
      id: 'integrations',
      ...settings
    });
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getIntegrationsSettingsFromFirestore(): Promise<IntegrationsSettings | null> {
  const path = 'settings/integrations';
  if (isQuotaTripped) {
    const cached = localStorage.getItem('raincoat_settings_fallback');
    return cached ? JSON.parse(cached) : null;
  }
  try {
    const docRef = doc(db, 'settings', 'integrations');
    const docSnap = await getDocFromServer(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as IntegrationsSettings;
      try {
        localStorage.setItem('raincoat_settings_fallback', JSON.stringify(data));
      } catch (_) {}
      return data;
    }
    return null;
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    try {
      handleFirestoreError(error, OperationType.GET, path);
    } catch (e) {
      console.warn("getIntegrationsSettingsFromFirestore failed:", e);
    }
    const cached = localStorage.getItem('raincoat_settings_fallback');
    return cached ? JSON.parse(cached) : null;
  }
}

export async function saveBannerSettingsToFirestore(settings: HomepageBannerSettings): Promise<void> {
  const path = 'settings/homepage_banner';
  if (isQuotaTripped) {
    localStorage.setItem('raincoat_banner_settings_fallback', JSON.stringify(settings));
    return;
  }
  try {
    await setDoc(doc(db, 'settings', 'homepage_banner'), {
      id: 'homepage_banner',
      slides: settings.slides
    });
    localStorage.setItem('raincoat_banner_settings_fallback', JSON.stringify(settings));
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    localStorage.setItem('raincoat_banner_settings_fallback', JSON.stringify(settings));
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getBannerSettingsFromFirestore(): Promise<HomepageBannerSettings | null> {
  const path = 'settings/homepage_banner';
  if (isQuotaTripped) {
    const cached = localStorage.getItem('raincoat_banner_settings_fallback');
    return cached ? JSON.parse(cached) : null;
  }
  try {
    const docRef = doc(db, 'settings', 'homepage_banner');
    const docSnap = await getDocFromServer(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as HomepageBannerSettings;
      try {
        localStorage.setItem('raincoat_banner_settings_fallback', JSON.stringify(data));
      } catch (_) {}
      return data;
    }
    return null;
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    try {
      handleFirestoreError(error, OperationType.GET, path);
    } catch (e) {
      console.warn("getBannerSettingsFromFirestore failed:", e);
    }
    const cached = localStorage.getItem('raincoat_banner_settings_fallback');
    return cached ? JSON.parse(cached) : null;
  }
}

// Password reset functionality connected with Firebase Auth
export async function sendFirebasePasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// Real-time Active Session Tracking API (Firestore with silent fallbacks)
export async function saveActiveSessionToFirestore(session: ActiveSession): Promise<void> {
  if (isQuotaTripped) return;
  const path = `activeSessions/${session.id}`;
  try {
    await setDoc(doc(db, 'activeSessions', session.id), session);
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    // Silent fail to handle Firestore Quota Exceeded gracefully without disrupting user experience
    console.warn("ActiveSession heartbeat write skipped/offline (possible quota limit):", error);
  }
}

export async function getActiveSessionsFromFirestore(): Promise<ActiveSession[]> {
  const path = 'activeSessions';
  if (isQuotaTripped) return [];
  try {
    const q = query(collection(db, 'activeSessions'));
    const snapshot = await getDocs(q);
    const results: ActiveSession[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      results.push(data as ActiveSession);
    });
    return results;
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    console.warn("getActiveSessionsFromFirestore completed with fallback:", error);
    return [];
  }
}

export async function deleteSessionFromFirestore(sessionId: string): Promise<void> {
  const path = `activeSessions/${sessionId}`;
  if (isQuotaTripped) return;
  try {
    await deleteDoc(doc(db, 'activeSessions', sessionId));
  } catch (_) {}
}

// Product Persistence API methods (Firestore with fallback to raincoat_shop_products)
export async function getProductsFromFirestore(): Promise<Product[]> {
  const path = 'products';
  if (isQuotaTripped) {
    const cached = localStorage.getItem('raincoat_shop_products');
    if (cached) {
      try {
        return JSON.parse(cached) as Product[];
      } catch (_) {}
    }
    return [];
  }
  try {
    const q = query(collection(db, 'products'));
    const snapshot = await getDocs(q);
    const results: Product[] = [];
    snapshot.forEach((doc) => {
      results.push(doc.data() as Product);
    });
    
    if (results.length > 0) {
      // Update local storage cache
      try {
        localStorage.setItem('raincoat_shop_products', JSON.stringify(results));
      } catch (_) {}
      return results;
    }
    
    // Fallback if empty but not failed
    const cached = localStorage.getItem('raincoat_shop_products');
    if (cached) {
      try {
        return JSON.parse(cached) as Product[];
      } catch (_) {}
    }
    return [];
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    try {
      handleFirestoreError(error, OperationType.LIST, path);
    } catch (e) {
      console.warn("getProductsFromFirestore failed, returning cached fallback if available:", e);
    }
    const cached = localStorage.getItem('raincoat_shop_products');
    if (cached) {
      try {
        return JSON.parse(cached) as Product[];
      } catch (_) {}
    }
    return [];
  }
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  const path = `products/${product.id}`;
  if (isQuotaTripped) {
    const cachedStr = localStorage.getItem('raincoat_shop_products') || '[]';
    try {
      const list = JSON.parse(cachedStr) as Product[];
      const idx = list.findIndex(p => p.id === product.id);
      if (idx > -1) {
        list[idx] = product;
      } else {
        list.push(product);
      }
      localStorage.setItem('raincoat_shop_products', JSON.stringify(list));
    } catch (_) {}
    return;
  }
  try {
    // Save to Firestore
    await setDoc(doc(db, 'products', product.id), product);
    
    // Sync local storage
    const cachedStr = localStorage.getItem('raincoat_shop_products') || '[]';
    try {
      const list = JSON.parse(cachedStr) as Product[];
      const idx = list.findIndex(p => p.id === product.id);
      if (idx > -1) {
        list[idx] = product;
      } else {
        list.push(product);
      }
      localStorage.setItem('raincoat_shop_products', JSON.stringify(list));
    } catch (_) {}
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = `products/${productId}`;
  if (isQuotaTripped) {
    const cachedStr = localStorage.getItem('raincoat_shop_products') || '[]';
    try {
      const list = JSON.parse(cachedStr) as Product[];
      const updated = list.filter(p => p.id !== productId);
      localStorage.setItem('raincoat_shop_products', JSON.stringify(updated));
    } catch (_) {}
    return;
  }
  try {
    await deleteDoc(doc(db, 'products', productId));
    
    const cachedStr = localStorage.getItem('raincoat_shop_products') || '[]';
    try {
      const list = JSON.parse(cachedStr) as Product[];
      const updated = list.filter(p => p.id !== productId);
      localStorage.setItem('raincoat_shop_products', JSON.stringify(updated));
    } catch (_) {}
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveAllProductsToFirestore(products: Product[]): Promise<void> {
  try {
    localStorage.setItem('raincoat_shop_products', JSON.stringify(products));
    if (isQuotaTripped) return;
    for (const product of products) {
      await setDoc(doc(db, 'products', product.id), product);
    }
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    console.warn("saveAllProductsToFirestore failed:", error);
  }
}

// Custom Pages API persistence into global Firestore (to survive updates/refreshes cleanly)
export async function savePagesToFirestore(pages: CustomPage[]): Promise<void> {
  try {
    localStorage.setItem('raincoat_pages', JSON.stringify(pages));
    if (isQuotaTripped) return;
    await setDoc(doc(db, 'settings', 'custom_pages'), {
      id: 'custom_pages',
      pages: pages
    });
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    console.warn("savePagesToFirestore failed, fallback to localStorage only:", error);
  }
}

export async function getPagesFromFirestore(): Promise<CustomPage[]> {
  if (isQuotaTripped) {
    const cached = localStorage.getItem('raincoat_pages');
    return cached ? JSON.parse(cached) : [];
  }
  try {
    const docRef = doc(db, 'settings', 'custom_pages');
    const docSnap = await getDocFromServer(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && Array.isArray(data.pages)) {
        try {
          localStorage.setItem('raincoat_pages', JSON.stringify(data.pages));
        } catch (_) {}
        return data.pages as CustomPage[];
      }
    }
  } catch (error) {
    tripQuotaCircuitBreaker(error);
    console.warn("getPagesFromFirestore failed, returning localStorage cache:", error);
  }
  const cached = localStorage.getItem('raincoat_pages');
  return cached ? JSON.parse(cached) : [];
}

// --------------------------------------------------
// ADVANCED PLUGINS & ADDONS PERSISTENCE
// --------------------------------------------------

export async function saveAdvancedAddonsSettingsToFirestore(settings: Partial<AdvancedAddonsSettings>): Promise<void> {
  const path = 'settings/advanced_addons';
  try {
    const cachedStr = localStorage.getItem('raincoat_advanced_addons_fallback');
    const existing = cachedStr ? JSON.parse(cachedStr) : {};
    const updated = { ...existing, ...settings };
    localStorage.setItem('raincoat_advanced_addons_fallback', JSON.stringify(updated));
    if (isQuotaTripped) return;
    await setDoc(doc(db, 'settings', 'advanced_addons'), {
      id: 'advanced_addons',
      ...updated
    });
  } catch (error) {
    console.warn("saveAdvancedAddonsSettingsToFirestore failed, fallback to localStorage:", error);
  }
}

export async function getAdvancedAddonsSettingsFromFirestore(): Promise<AdvancedAddonsSettings | null> {
  if (isQuotaTripped) {
    const cached = localStorage.getItem('raincoat_advanced_addons_fallback');
    return cached ? JSON.parse(cached) : null;
  }
  try {
    const docRef = doc(db, 'settings', 'advanced_addons');
    const docSnap = await getDocFromServer(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as AdvancedAddonsSettings;
      try {
        localStorage.setItem('raincoat_advanced_addons_fallback', JSON.stringify(data));
      } catch (_) {}
      return data;
    }
  } catch (error) {
    console.warn("getAdvancedAddonsSettingsFromFirestore failed, fallback to localStorage:", error);
  }
  const cached = localStorage.getItem('raincoat_advanced_addons_fallback');
  return cached ? JSON.parse(cached) : null;
}

export async function saveReviewToFirestore(review: CustomerReview): Promise<void> {
  try {
    const current = localStorage.getItem('raincoat_custom_reviews_fallback') || '[]';
    const list = JSON.parse(current) as CustomerReview[];
    const idx = list.findIndex(r => r.id === review.id);
    if (idx !== -1) {
      list[idx] = review;
    } else {
      list.push(review);
    }
    localStorage.setItem('raincoat_custom_reviews_fallback', JSON.stringify(list));
    
    if (isQuotaTripped) return;
    await setDoc(doc(db, 'reviews', review.id), review);
  } catch (error) {
    console.warn("saveReviewToFirestore failed:", error);
  }
}

export async function getCustomReviewsFromFirestore(): Promise<CustomerReview[]> {
  if (isQuotaTripped) {
    const cached = localStorage.getItem('raincoat_custom_reviews_fallback');
    return cached ? JSON.parse(cached) : [];
  }
  try {
    const ref = collection(db, 'reviews');
    const snap = await getDocs(ref);
    const reviews: CustomerReview[] = [];
    snap.forEach((docSnap) => {
      reviews.push(docSnap.data() as CustomerReview);
    });

    let alreadySeededFlag = localStorage.getItem('raincoat_reviews_seeded') === 'true';
    if (!alreadySeededFlag) {
      try {
        const metaDoc = await getDocFromServer(doc(db, 'settings', 'reviews_metadata'));
        if (metaDoc.exists() && (metaDoc.data() as any).seeded) {
          alreadySeededFlag = true;
          localStorage.setItem('raincoat_reviews_seeded', 'true');
        }
      } catch (_) {}
    }

    if (reviews.length === 0 && !alreadySeededFlag) {
      // Dynamic import to avoid circular dependencies
      const { CUSTOMER_REVIEWS } = await import('../data');
      for (const r of CUSTOMER_REVIEWS) {
        await setDoc(doc(db, 'reviews', r.id), r);
        reviews.push(r);
      }
      try {
        await setDoc(doc(db, 'settings', 'reviews_metadata'), { seeded: true });
        localStorage.setItem('raincoat_reviews_seeded', 'true');
      } catch (_) {}
    }

    localStorage.setItem('raincoat_custom_reviews_fallback', JSON.stringify(reviews));
    return reviews;
  } catch (error) {
    console.warn("getCustomReviewsFromFirestore failed:", error);
    const cached = localStorage.getItem('raincoat_custom_reviews_fallback');
    return cached ? JSON.parse(cached) : [];
  }
}

export async function deleteReviewFromFirestore(id: string): Promise<void> {
  try {
    const current = localStorage.getItem('raincoat_custom_reviews_fallback') || '[]';
    const list = JSON.parse(current) as CustomerReview[];
    const filtered = list.filter(r => r.id !== id);
    localStorage.setItem('raincoat_custom_reviews_fallback', JSON.stringify(filtered));
    if (isQuotaTripped) return;
    await deleteDoc(doc(db, 'reviews', id));
  } catch (error) {
    console.warn("deleteReviewFromFirestore failed:", error);
  }
}

export async function syncCachedOrdersToFirestore(): Promise<void> {
  if (isQuotaTripped) return;

  const raincoatOrdersStr = localStorage.getItem('raincoat_orders');
  if (raincoatOrdersStr) {
    try {
      const list = JSON.parse(raincoatOrdersStr) as RaincoatOrder[];
      let updated = false;
      for (const order of list) {
        if (order.synced === false) {
          try {
            // Exclude synced property before sending to Firestore
            const { synced, ...firestorePayload } = order;
            await setDoc(doc(db, 'orders', order.id), firestorePayload);
            order.synced = true;
            updated = true;
            console.log(`[Sync] Successfully uploaded cached order ${order.id} to Firestore!`);
          } catch (err) {
            console.warn(`[Sync] Uploading cached order ${order.id} failed:`, err);
            tripQuotaCircuitBreaker(err);
            if (isQuotaTripped) break;
          }
        }
      }
      if (updated) {
        localStorage.setItem('raincoat_orders', JSON.stringify(list));
      }
    } catch (_) {}
  }

  const fallbackStr = localStorage.getItem('raincoat_orders_fallback');
  if (fallbackStr) {
    try {
      const fallbackList = JSON.parse(fallbackStr) as RaincoatOrder[];
      const successfullySyncedIds: string[] = [];
      for (const order of fallbackList) {
        try {
          const { synced, ...firestorePayload } = order;
          await setDoc(doc(db, 'orders', order.id), firestorePayload);
          successfullySyncedIds.push(order.id);
          console.log(`[Sync] Successfully uploaded offline fallback order ${order.id} to Firestore!`);
        } catch (err) {
          console.warn(`[Sync] Uploading offline fallback order ${order.id} failed:`, err);
          tripQuotaCircuitBreaker(err);
          if (isQuotaTripped) break;
        }
      }
      if (successfullySyncedIds.length > 0) {
        const remaining = fallbackList.filter(o => !successfullySyncedIds.includes(o.id));
        localStorage.setItem('raincoat_orders_fallback', JSON.stringify(remaining));

        const currentOrdersStr = localStorage.getItem('raincoat_orders');
        if (currentOrdersStr) {
          try {
            const list = JSON.parse(currentOrdersStr) as RaincoatOrder[];
            list.forEach(o => {
              if (successfullySyncedIds.includes(o.id)) {
                o.synced = true;
              }
            });
            localStorage.setItem('raincoat_orders', JSON.stringify(list));
          } catch (_) {}
        }
      }
    } catch (_) {}
  }
}



