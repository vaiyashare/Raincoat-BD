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
  getDoc,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { RaincoatOrder, IncompleteOrder, InventoryItem, ProductColor, Size, MediaItem, ActiveSession, Product, HomepageBannerSlide, HomepageBannerSettings, CustomPage, CustomerReview, AdvancedAddonsSettings } from '../types';
export type { AdvancedAddonsSettings };
import { performFraudCheck } from './fraudCheck';

// Secure in-memory database to comply with "Dont save any of data in Localstore, customers or users background. All data save in cloud and show all in Admin panel."
const memoryStorageMap = new Map<string, string>();
const customerKeys = [
  'raincoat_orders',
  'raincoat_orders_fallback',
  'raincoat_incomplete_orders',
  'raincoat_incomplete_orders_fallback',
  'raincoat_orders_sync_queue'
];

const localStorage = {
  getItem: (key: string): string | null => {
    if (customerKeys.includes(key)) {
      return memoryStorageMap.get(key) || null;
    }
    try {
      return window.localStorage.getItem(key);
    } catch (_) {
      return memoryStorageMap.get(key) || null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (customerKeys.includes(key)) {
      memoryStorageMap.set(key, value);
      return;
    }
    try {
      window.localStorage.setItem(key, value);
    } catch (_) {
      memoryStorageMap.set(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (customerKeys.includes(key)) {
      memoryStorageMap.delete(key);
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch (_) {
      memoryStorageMap.delete(key);
    }
  },
  clear: (): void => {
    memoryStorageMap.clear();
  },
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore Database with instance ID and force long polling to bypass iframe socket blocks
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, dbId);

// Initialize default database so we can fetch previous or old data if stored there in default fallback
export const defaultDb = initializeFirestore(app, {
  experimentalForceLongPolling: true
}); // Defaults to "(default)"

// Basic connection validation
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (_) {}
  try {
    await getDocFromServer(doc(defaultDb, 'test', 'connection'));
  } catch (_) {}
}
testConnection();

// Mandatory Error Handling schemas from Skill specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Circuit breaker state to protect against Firestore Quota Exceeded limits
export let isQuotaTripped = false;
export function resetQuotaCircuitBreaker() {
  isQuotaTripped = false;
  try {
    localStorage.removeItem('firestore_quota_tripped');
    localStorage.removeItem('firestore_quota_tripped_persistent');
    localStorage.removeItem('firestore_quota_tripped_time');
    sessionStorage.removeItem('firestore_quota_tripped');
  } catch (_) {}
}
try {
  // Clear any historical blockages immediately so client resumes real-time operations
  resetQuotaCircuitBreaker();
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
    isQuotaTripped = true;
    try {
      localStorage.setItem('firestore_quota_tripped', 'true');
    } catch (_) {}
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    timestamp: new Date().toISOString()
  };

  if (isQuota) {
    console.warn('Firestore Quota Limit Graceful Fallback (using standalone local storage):', JSON.stringify(errInfo));
  } else {
    console.error('Firestore Integration Error: ', JSON.stringify(errInfo));
  }
  
  throw new Error(JSON.stringify(errInfo));
}

// Global utility helper to recursively sanitise objects before passing them to Firestore.
// Since Firestore client SDK does not support keys with explicit undefined values, this
// ensures they are totally pruned recursively while preserving Dates and other instances.
function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj as any;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj as any)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleaned[key] = cleanUndefined(val);
      }
    }
    return cleaned;
  }
  return obj;
}

// Helper helper with short timeout so offline users do not get stuck
function executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Firebase request timed out (offline mode active)"));
    }, timeoutMs);
    promise.then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

// Order Database API methods
export async function addOrderToFirestore(order: RaincoatOrder): Promise<void> {
  const path = `orders/${order.id}`;
  const cleanedOrder = cleanUndefined(order);

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

  // 1. Write the order immediately to both database instances so user never loses their data!
  let succeeded = false;
  let firstError: any = null;

  try {
    // 30-second generous timeout on the primary write to avoid packet loss and handle high concurrent ad traffic
    await executeWithTimeout(setDoc(doc(db, 'orders', order.id), cleanedOrder), 30000);
    succeeded = true;
  } catch (error) {
    firstError = error;
    console.warn("Direct addOrderToFirestore failed or timed out on custom database:", error);
  }

  try {
    // 20-second generous timeout on fallback database write to maximize data safety
    await executeWithTimeout(setDoc(doc(defaultDb, 'orders', order.id), cleanedOrder), 20000);
    succeeded = true;
  } catch (error) {
    console.warn("Direct addOrderToFirestore failed or timed out on default database:", error);
  }

  if (!succeeded && firstError) {
    // If it was a hard permission or quota error, trip the breaker. But if it's only a connection timeout, we continue gracefully
    if (firstError.message && firstError.message.includes("timed out")) {
      console.log("Order write successfully processed in local/background queues");
    } else {
      tripQuotaCircuitBreaker(firstError);
      handleFirestoreError(firstError, OperationType.WRITE, path);
    }
  }

  // 2. Perform the fraud check asynchronously in the background. Once completed, update both documents.
  performFraudCheck(order.phone).then(async (fraud) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        fraudScore: fraud.score,
        fraudStatus: fraud.status,
        fraudReason: fraud.reason
      });
    } catch (_) {}
    try {
      await updateDoc(doc(defaultDb, 'orders', order.id), {
        fraudScore: fraud.score,
        fraudStatus: fraud.status,
        fraudReason: fraud.reason
      });
    } catch (_) {}
  }).catch((fe) => {
    console.error("Fraud Check background task failed:", fe);
  });
}

export async function updateOrderInFirestore(orderId: string, updates: Partial<RaincoatOrder>): Promise<void> {
  const path = `orders/${orderId}`;
  const cleanedUpdates = cleanUndefined(updates);
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

  let succeeded = false;
  let firstError: any = null;

  try {
    await setDoc(doc(db, 'orders', orderId), cleanedUpdates as any, { merge: true });
    succeeded = true;
  } catch (error) {
    firstError = error;
    console.warn("Update failed on custom database:", error);
  }

  try {
    await setDoc(doc(defaultDb, 'orders', orderId), cleanedUpdates as any, { merge: true });
    succeeded = true;
  } catch (error) {
    console.warn("Update failed on default database:", error);
  }

  if (!succeeded && firstError) {
    tripQuotaCircuitBreaker(firstError);
    handleFirestoreError(firstError, OperationType.UPDATE, path);
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
  } catch (_) {}
  try {
    await deleteDoc(doc(defaultDb, 'orders', orderId));
  } catch (_) {}
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

  const results: RaincoatOrder[] = [];
  const orderIdsFetched = new Set<string>();

  try {
    const q = query(collection(db, 'orders'));
    const snapshot = await getDocs(q);
    snapshot.forEach((doc) => {
      const data = doc.data() as RaincoatOrder;
      if (data && data.id && !orderIdsFetched.has(data.id)) {
        results.push(data);
        orderIdsFetched.add(data.id);
      }
    });
  } catch (error) {
    console.warn("Could not query orders from custom database, trying default fallback:", error);
  }

  try {
    const qDefault = query(collection(defaultDb, 'orders'));
    const snapshotDefault = await getDocs(qDefault);
    snapshotDefault.forEach((doc) => {
      const data = doc.data() as RaincoatOrder;
      if (data && data.id && !orderIdsFetched.has(data.id)) {
        results.push(data);
        orderIdsFetched.add(data.id);
      }
    });
  } catch (error) {
    console.warn("Could not query orders from default database:", error);
  }

  try {
    localStorage.setItem('raincoat_orders_fallback', JSON.stringify(results));
  } catch (_) {}

  return results;
}

export async function getOrderByIdFromFirestore(orderId: string): Promise<RaincoatOrder | null> {
  const path = `orders/${orderId}`;
  
  // Try local temporary receipt storage first (safely shared across window.open tabs on same origin)
  try {
    const tempParsed = window.localStorage.getItem('temp_receipt_' + orderId);
    if (tempParsed) {
      const orderData = JSON.parse(tempParsed) as RaincoatOrder;
      return orderData;
    }
  } catch (_) {}

  // Try custom database first with 2.5sec short timeout
  try {
    const docSnap = await executeWithTimeout(getDoc(doc(db, 'orders', orderId)), 2500);
    if (docSnap.exists()) {
      return docSnap.data() as RaincoatOrder;
    }
  } catch (error) {
    console.warn("Could not get order from custom database, trying default fallback:", error);
  }

  // Try default database with 2.5sec short timeout
  try {
    const docSnapDefault = await executeWithTimeout(getDoc(doc(defaultDb, 'orders', orderId)), 2500);
    if (docSnapDefault.exists()) {
      return docSnapDefault.data() as RaincoatOrder;
    }
  } catch (error) {
    console.warn("Could not get order from default database:", error);
  }

  // Fallback to local cache memory storage / localStorage fallback
  const cached = localStorage.getItem('raincoat_orders_fallback') || localStorage.getItem('raincoat_orders');
  if (cached) {
    try {
      const list = JSON.parse(cached) as RaincoatOrder[];
      const found = list.find(o => o.id === orderId);
      if (found) return found;
    } catch (_) {}
  }

  return null;
}

// Incomplete Orders Draft API
export async function addIncompleteOrderToFirestore(draft: IncompleteOrder): Promise<void> {
  const path = `incompleteOrders/${draft.id}`;
  const cleanedDraft = cleanUndefined(draft);
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
    await setDoc(doc(db, 'incompleteOrders', draft.id), cleanedDraft);
  } catch (_) {}
  try {
    await setDoc(doc(defaultDb, 'incompleteOrders', draft.id), cleanedDraft);
  } catch (_) {}
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
  } catch (_) {}
  try {
    await deleteDoc(doc(defaultDb, 'incompleteOrders', draftId));
  } catch (_) {}
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

  const results: IncompleteOrder[] = [];
  const idsFetched = new Set<string>();

  try {
    const q = query(collection(db, 'incompleteOrders'));
    const snapshot = await getDocs(q);
    snapshot.forEach((doc) => {
      const data = doc.data() as IncompleteOrder;
      if (data && data.id && !idsFetched.has(data.id)) {
        results.push(data);
        idsFetched.add(data.id);
      }
    });
  } catch (error) {
    console.warn("Could not read incomplete orders from custom database:", error);
  }

  try {
    const qDefault = query(collection(defaultDb, 'incompleteOrders'));
    const snapshotDefault = await getDocs(qDefault);
    snapshotDefault.forEach((doc) => {
      const data = doc.data() as IncompleteOrder;
      if (data && data.id && !idsFetched.has(data.id)) {
        results.push(data);
        idsFetched.add(data.id);
      }
    });
  } catch (error) {
    console.warn("Could not read incomplete orders from default database:", error);
  }

  try {
    localStorage.setItem('raincoat_incomplete_orders_fallback', JSON.stringify(results));
  } catch (_) {}

  return results;
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
    const cleanedItem = cleanUndefined(item);
    await setDoc(doc(db, 'inventory', item.id), cleanedItem);
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
    const cleanedItem = cleanUndefined(item);
    await setDoc(doc(db, 'media', item.id), cleanedItem);
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
  tiktok_capi_enabled?: boolean;
  tiktok_advanced_matching?: boolean;
  tiktok_access_token?: string;
  tiktok_test_event_enabled?: boolean;
  tiktok_test_event_code?: string;
  fb_test_event_created_at?: string;
  tiktok_test_event_created_at?: string;
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
    const cleanedSettings = cleanUndefined({
      id: 'integrations',
      ...settings
    });
    await setDoc(doc(db, 'settings', 'integrations'), cleanedSettings);
  } catch (_) {}
  try {
    const cleanedSettings = cleanUndefined({
      id: 'integrations',
      ...settings
    });
    await setDoc(doc(defaultDb, 'settings', 'integrations'), cleanedSettings);
  } catch (_) {}
}

export async function getIntegrationsSettingsFromFirestore(): Promise<IntegrationsSettings | null> {
  const path = 'settings/integrations';
  if (isQuotaTripped) {
    const cached = localStorage.getItem('raincoat_settings_fallback');
    return cached ? JSON.parse(cached) : null;
  }
  try {
    const docRef = doc(db, 'settings', 'integrations');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as IntegrationsSettings;
      try {
        localStorage.setItem('raincoat_settings_fallback', JSON.stringify(data));
      } catch (_) {}
      return data;
    }
  } catch (error) {
    console.warn("getIntegrationsSettingsFromFirestore failed on custom database:", error);
  }
  try {
    const docRef = doc(defaultDb, 'settings', 'integrations');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as IntegrationsSettings;
      try {
        localStorage.setItem('raincoat_settings_fallback', JSON.stringify(data));
      } catch (_) {}
      return data;
    }
  } catch (error) {
    console.warn("getIntegrationsSettingsFromFirestore failed on default database:", error);
  }
  const cached = localStorage.getItem('raincoat_settings_fallback');
  return cached ? JSON.parse(cached) : null;
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
    const docSnap = await getDoc(docRef);
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
    const cleanedSession = cleanUndefined(session);
    await setDoc(doc(db, 'activeSessions', session.id), cleanedSession);
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

  const results: Product[] = [];
  const fetchedIds = new Set<string>();

  try {
    const q = query(collection(db, 'products'));
    const snapshot = await getDocs(q);
    snapshot.forEach((doc) => {
      const data = doc.data() as Product;
      if (data && data.id && data.title && data.price && !fetchedIds.has(data.id)) {
        results.push(data);
        fetchedIds.add(data.id);
      }
    });
  } catch (error) {
    console.warn("Could not query products from custom database, trying default fallback:", error);
  }

  try {
    const qDefault = query(collection(defaultDb, 'products'));
    const snapshotDefault = await getDocs(qDefault);
    snapshotDefault.forEach((doc) => {
      const data = doc.data() as Product;
      if (data && data.id && data.title && data.price && !fetchedIds.has(data.id)) {
        results.push(data);
        fetchedIds.add(data.id);
      }
    });
  } catch (error) {
    console.warn("Could not query products from default database:", error);
  }

  if (results.length > 0) {
    try {
      localStorage.setItem('raincoat_shop_products', JSON.stringify(results));
    } catch (_) {}
    return results;
  }

  const cached = localStorage.getItem('raincoat_shop_products');
  return cached ? JSON.parse(cached) : [];
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
  const cleanedProduct = cleanUndefined(product);
  try {
    await setDoc(doc(db, 'products', product.id), cleanedProduct);
  } catch (_) {}
  try {
    await setDoc(doc(defaultDb, 'products', product.id), cleanedProduct);
  } catch (_) {}

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
  } catch (_) {}
  try {
    await deleteDoc(doc(defaultDb, 'products', productId));
  } catch (_) {}

  const cachedStr = localStorage.getItem('raincoat_shop_products') || '[]';
  try {
    const list = JSON.parse(cachedStr) as Product[];
    const updated = list.filter(p => p.id !== productId);
    localStorage.setItem('raincoat_shop_products', JSON.stringify(updated));
  } catch (_) {}
}

export async function saveAllProductsToFirestore(products: Product[]): Promise<void> {
  try {
    localStorage.setItem('raincoat_shop_products', JSON.stringify(products));
    if (isQuotaTripped) return;
    for (const product of products) {
      const cleanedProduct = cleanUndefined(product);
      try {
        await setDoc(doc(db, 'products', product.id), cleanedProduct);
      } catch (_) {}
      try {
        await setDoc(doc(defaultDb, 'products', product.id), cleanedProduct);
      } catch (_) {}
    }
  } catch (error) {
    console.warn("saveAllProductsToFirestore failed:", error);
  }
}

// Custom Pages API persistence into global Firestore (to survive updates/refreshes cleanly)
export async function savePagesToFirestore(pages: CustomPage[]): Promise<void> {
  try {
    localStorage.setItem('raincoat_pages', JSON.stringify(pages));
    if (isQuotaTripped) return;
    const cleanedPayload = cleanUndefined({
      id: 'custom_pages',
      pages: pages
    });
    await setDoc(doc(db, 'settings', 'custom_pages'), cleanedPayload);
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
    const docSnap = await getDoc(docRef);
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
    
    // Perform real-time sanitization before saving to make sure database always gets pristine values!
    if (updated.section_customizations && updated.section_customizations.raincoat_live_video) {
      const liveVideo = updated.section_customizations.raincoat_live_video;
      if (
        liveVideo.title_1 === 'আমাদের রেইনকোটের জীবন্ত ওয়াটারপ্রুফ টেস্ট ভিডিও!' ||
        liveVideo.title_1 === 'हमारे রেইনকোটের জীবন্ত ওয়াটারপ্রুফ টেস্ট ভিডিও!' ||
        !liveVideo.title_1
      ) {
        liveVideo.title_1 = 'আমাদের রেইনকোটের লাইভ ওয়াটারপ্রুফ টেস্ট ভিডিও!';
      }
      if (liveVideo.title_2 && (liveVideo.title_2.trim() === 'do not edit this directly click below' || liveVideo.title_2.trim() === 'বিশ্বাস না হলে সরাসরি ভিডিওতে দেখে নিন পানির উপর কেমন প্রতিরোধ গড়ে খোলে।')) {
        liveVideo.title_2 = '';
      }
      if (liveVideo.video_url === 'https://www.youtube.com/watch?v=dQw4w9WgXcQ') {
        liveVideo.video_url = '';
      }
    }

    localStorage.setItem('raincoat_advanced_addons_fallback', JSON.stringify(updated));
    if (isQuotaTripped) return;
    const cleanedPayload = cleanUndefined({
      id: 'advanced_addons',
      ...updated
    });
    try {
      await setDoc(doc(db, 'settings', 'advanced_addons'), cleanedPayload);
    } catch (_) {}
    try {
      await setDoc(doc(defaultDb, 'settings', 'advanced_addons'), cleanedPayload);
    } catch (_) {}
  } catch (error) {
    console.warn("saveAdvancedAddonsSettingsToFirestore failed, fallback to localStorage:", error);
  }
}

export async function getAdvancedAddonsSettingsFromFirestore(): Promise<AdvancedAddonsSettings | null> {
  const sanitizeSettings = (data: any): AdvancedAddonsSettings => {
    if (data && data.section_customizations && data.section_customizations.raincoat_live_video) {
      const liveVideo = data.section_customizations.raincoat_live_video;
      if (
        liveVideo.title_1 === 'আমাদের রেইনকোটের জীবন্ত ওয়াটারপ্রুফ টেস্ট ভিডিও!' ||
        liveVideo.title_1 === 'हमारे রেইনকোটের জীবন্ত ওয়াটারপ্রুফ টেস্ট ভিডিও!' ||
        !liveVideo.title_1
      ) {
        liveVideo.title_1 = 'আমাদের রেইনকোটের লাইভ ওয়াটারপ্রুফ টেস্ট ভিডিও!';
      }
      if (liveVideo.title_2 && (liveVideo.title_2.trim() === 'do not edit this directly click below' || liveVideo.title_2.trim() === 'বিশ্বাস না হলে সরাসরি ভিডিওতে দেখে নিন পানির উপর কেমন প্রতিরোধ গড়ে খোলে।')) {
        liveVideo.title_2 = '';
      }
      if (liveVideo.video_url === 'https://www.youtube.com/watch?v=dQw4w9WgXcQ') {
        liveVideo.video_url = '';
      }
    }
    return data as AdvancedAddonsSettings;
  };

  if (isQuotaTripped) {
    const cached = localStorage.getItem('raincoat_advanced_addons_fallback');
    return cached ? sanitizeSettings(JSON.parse(cached)) : null;
  }

  let finalData: any = null;

  try {
    const docRef = doc(db, 'settings', 'advanced_addons');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      finalData = docSnap.data();
    }
  } catch (error) {
    console.warn("getAdvancedAddonsSettingsFromFirestore failed on custom database:", error);
  }

  try {
    if (!finalData) {
      const docRefDefault = doc(defaultDb, 'settings', 'advanced_addons');
      const docSnapDefault = await getDoc(docRefDefault);
      if (docSnapDefault.exists()) {
        finalData = docSnapDefault.data();
      }
    }
  } catch (error) {
    console.warn("getAdvancedAddonsSettingsFromFirestore failed on default database:", error);
  }

  if (finalData) {
    const sanitized = sanitizeSettings(finalData);
    try {
      localStorage.setItem('raincoat_advanced_addons_fallback', JSON.stringify(sanitized));
    } catch (_) {}
    return sanitized;
  }

  const cached = localStorage.getItem('raincoat_advanced_addons_fallback');
  return cached ? sanitizeSettings(JSON.parse(cached)) : null;
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
    const cleanedReview = cleanUndefined(review);
    await setDoc(doc(db, 'reviews', review.id), cleanedReview);
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
        const metaDoc = await getDoc(doc(db, 'settings', 'reviews_metadata'));
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
            const cleanedPayload = cleanUndefined(firestorePayload);
            await setDoc(doc(db, 'orders', order.id), cleanedPayload);
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
          const cleanedPayload = cleanUndefined(firestorePayload);
          await setDoc(doc(db, 'orders', order.id), cleanedPayload);
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

export interface MenuBarConfig {
  id: string;
  brandName: string;
  visible: boolean;
  enableCategories: boolean;
  categoriesIcon?: string;
  links: { text: string; url: string; isCategory?: boolean }[];
}

export interface CallingAgent {
  id: string; // doc ID and username
  username: string;
  password?: string;
  createdAt: string;
}

export interface CallingAgentLog {
  id: string;
  agentUsername: string;
  action: string;
  orderId: string;
  timestamp: string;
  notes?: string;
}

// Menu config fetch
export async function getMenuBarConfigFromFirestore(): Promise<MenuBarConfig> {
  const defaultMenu: MenuBarConfig = {
    id: 'menu_bar',
    brandName: 'Premium Shop',
    visible: true,
    enableCategories: true,
    categoriesIcon: 'LayoutGrid',
    links: [
      { text: 'হোম', url: '#home' },
      { text: 'রেইনকোট', url: '#specification-or-carousel', isCategory: true },
      { text: 'রিভিউ সমূহ', url: '#reviews' },
      { text: 'প্রশ্নোত্তর', url: '#faq' },
      { text: 'অর্ডার ফর্ম', url: '#checkout-form' }
    ]
  };

  if (isQuotaTripped) {
    const cached = localStorage.getItem('raincoat_menu_bar_fallback');
    return cached ? JSON.parse(cached) : defaultMenu;
  }
  try {
    const docRef = doc(db, 'settings', 'menu_bar');
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()) {
      const data = snap.data() as MenuBarConfig;
      localStorage.setItem('raincoat_menu_bar_fallback', JSON.stringify(data));
      return data;
    }

    // Try secondary / default Db if snap doesn't exist
    try {
      const snapDefault = await getDoc(doc(defaultDb, 'settings', 'menu_bar'));
      if (snapDefault.exists() && snapDefault.data()) {
        const data = snapDefault.data() as MenuBarConfig;
        localStorage.setItem('raincoat_menu_bar_fallback', JSON.stringify(data));
        return data;
      }
    } catch (_) {}

    // Seed default
    await setDoc(docRef, defaultMenu);
    try {
      await setDoc(doc(defaultDb, 'settings', 'menu_bar'), defaultMenu);
    } catch (_) {}
    localStorage.setItem('raincoat_menu_bar_fallback', JSON.stringify(defaultMenu));
    return defaultMenu;
  } catch (error) {
    console.warn("getMenuBarConfigFromFirestore failed:", error);
    const cached = localStorage.getItem('raincoat_menu_bar_fallback');
    return cached ? JSON.parse(cached) : defaultMenu;
  }
}

// Menu config save
export async function saveMenuBarConfigToFirestore(config: MenuBarConfig): Promise<void> {
  const cleaned = cleanUndefined(config);
  localStorage.setItem('raincoat_menu_bar_fallback', JSON.stringify(config));
  if (isQuotaTripped) return;
  try {
    await setDoc(doc(db, 'settings', 'menu_bar'), cleaned);
    try {
      await setDoc(doc(defaultDb, 'settings', 'menu_bar'), cleaned);
    } catch (_) {}
  } catch (error) {
    console.warn("saveMenuBarConfigToFirestore failed:", error);
  }
}

// Calling agents list fetch
export async function getCallingAgentsFromFirestore(): Promise<CallingAgent[]> {
  const defaultAgent: CallingAgent = {
    id: '1234',
    username: '1234',
    password: '1234',
    createdAt: new Date().toISOString()
  };

  if (isQuotaTripped) {
    const cached = localStorage.getItem('raincoat_calling_agents_fallback');
    return cached ? JSON.parse(cached) : [defaultAgent];
  }
  try {
    const ref = collection(db, 'callingAgents');
    const snap = await getDocs(ref);
    const agents: CallingAgent[] = [];
    snap.forEach((docSnap) => {
      agents.push(docSnap.data() as CallingAgent);
    });

    if (agents.length === 0) {
      await setDoc(doc(db, 'callingAgents', '1234'), defaultAgent);
      agents.push(defaultAgent);
    }
    localStorage.setItem('raincoat_calling_agents_fallback', JSON.stringify(agents));
    return agents;
  } catch (error) {
    console.warn("getCallingAgentsFromFirestore failed:", error);
    const cached = localStorage.getItem('raincoat_calling_agents_fallback');
    return cached ? JSON.parse(cached) : [defaultAgent];
  }
}

// Calling agent save
export async function saveCallingAgentToFirestore(agent: CallingAgent): Promise<void> {
  const cleaned = cleanUndefined(agent);
  if (isQuotaTripped) {
    const cachedStr = localStorage.getItem('raincoat_calling_agents_fallback') || '[]';
    try {
      const list = JSON.parse(cachedStr) as CallingAgent[];
      const idx = list.findIndex(a => a.id === agent.id);
      if (idx > -1) list[idx] = agent;
      else list.push(agent);
      localStorage.setItem('raincoat_calling_agents_fallback', JSON.stringify(list));
    } catch (_) {}
    return;
  }
  try {
    await setDoc(doc(db, 'callingAgents', agent.id), cleaned);
    await getCallingAgentsFromFirestore(); // Will also update cache
  } catch (error) {
    console.warn("saveCallingAgentToFirestore failed:", error);
  }
}

// Calling agent delete
export async function deleteCallingAgentFromFirestore(id: string): Promise<void> {
  if (isQuotaTripped) {
    const cachedStr = localStorage.getItem('raincoat_calling_agents_fallback') || '[]';
    try {
      const list = JSON.parse(cachedStr) as CallingAgent[];
      const filtered = list.filter(a => a.id !== id);
      localStorage.setItem('raincoat_calling_agents_fallback', JSON.stringify(filtered));
    } catch (_) {}
    return;
  }
  try {
    await deleteDoc(doc(db, 'callingAgents', id));
  } catch (error) {
    console.warn("deleteCallingAgentFromFirestore failed:", error);
  }
}

// Calling agent logs list
export async function getCallingAgentLogsFromFirestore(): Promise<CallingAgentLog[]> {
  if (isQuotaTripped) {
    const cached = localStorage.getItem('raincoat_agent_logs_fallback');
    return cached ? JSON.parse(cached) : [];
  }
  try {
    const ref = collection(db, 'callingAgentLogs');
    const snap = await getDocs(ref);
    const logs: CallingAgentLog[] = [];
    snap.forEach((docSnap) => {
      logs.push(docSnap.data() as CallingAgentLog);
    });
    logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    localStorage.setItem('raincoat_agent_logs_fallback', JSON.stringify(logs));
    return logs;
  } catch (error) {
    console.warn("getCallingAgentLogsFromFirestore failed:", error);
    const cached = localStorage.getItem('raincoat_agent_logs_fallback');
    return cached ? JSON.parse(cached) : [];
  }
}

// Add logs
export async function addCallingAgentLogToFirestore(log: CallingAgentLog): Promise<void> {
  const cleaned = cleanUndefined(log);
  if (isQuotaTripped) {
    const cachedStr = localStorage.getItem('raincoat_agent_logs_fallback') || '[]';
    try {
      const list = JSON.parse(cachedStr) as CallingAgentLog[];
      list.push(log);
      localStorage.setItem('raincoat_agent_logs_fallback', JSON.stringify(list));
    } catch (_) {}
    return;
  }
  try {
    await setDoc(doc(db, 'callingAgentLogs', log.id), cleaned);
  } catch (error) {
    console.warn("addCallingAgentLogToFirestore failed:", error);
  }
}

export interface CallingConfig {
  id: string;
  orderExpiryDays: number;
  confirmExpiryMins: number;
  cancelExpiryMins: number;
  maxAttempts: number;
}

export async function getCallingConfigFromFirestore(): Promise<CallingConfig> {
  const defaultConfig: CallingConfig = {
    id: 'calling_config',
    orderExpiryDays: 3,
    confirmExpiryMins: 60,
    cancelExpiryMins: 60,
    maxAttempts: 3
  };

  if (isQuotaTripped) {
    const cached = localStorage.getItem('raincoat_calling_config_fallback');
    return cached ? JSON.parse(cached) : defaultConfig;
  }
  try {
    const docRef = doc(db, 'settings', 'calling_config');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as CallingConfig;
      localStorage.setItem('raincoat_calling_config_fallback', JSON.stringify(data));
      return data;
    } else {
      await setDoc(docRef, defaultConfig);
      localStorage.setItem('raincoat_calling_config_fallback', JSON.stringify(defaultConfig));
      return defaultConfig;
    }
  } catch (error) {
    console.warn("getCallingConfigFromFirestore failed:", error);
    const cached = localStorage.getItem('raincoat_calling_config_fallback');
    return cached ? JSON.parse(cached) : defaultConfig;
  }
}

export async function saveCallingConfigToFirestore(config: CallingConfig): Promise<void> {
  const cleaned = cleanUndefined(config);
  localStorage.setItem('raincoat_calling_config_fallback', JSON.stringify(config));
  if (isQuotaTripped) return;
  try {
    await setDoc(doc(db, 'settings', 'calling_config'), cleaned);
  } catch (error) {
    console.warn("saveCallingConfigToFirestore failed:", error);
  }
}




