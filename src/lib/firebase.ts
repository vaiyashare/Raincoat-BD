import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
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
import { RaincoatOrder, IncompleteOrder, InventoryItem, ProductColor, Size } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore Database with instance ID specified in configuration
export const db = (firebaseConfig as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId) 
  : getFirestore(app);

// Basic connection validation
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test-connection-doc', 'test'));
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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    timestamp: new Date().toISOString()
  };
  console.error('Firestore Integration Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Order Database API methods
export async function addOrderToFirestore(order: RaincoatOrder): Promise<void> {
  const path = `orders/${order.id}`;
  try {
    await setDoc(doc(db, 'orders', order.id), order);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateOrderInFirestore(orderId: string, updates: Partial<RaincoatOrder>): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), updates as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getOrdersFromFirestore(): Promise<RaincoatOrder[]> {
  const path = 'orders';
  try {
    const q = query(collection(db, 'orders'));
    const snapshot = await getDocs(q);
    const results: RaincoatOrder[] = [];
    snapshot.forEach((doc) => {
      results.push(doc.data() as RaincoatOrder);
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Incomplete Orders Draft API
export async function addIncompleteOrderToFirestore(draft: IncompleteOrder): Promise<void> {
  const path = `incompleteOrders/${draft.id}`;
  try {
    await setDoc(doc(db, 'incompleteOrders', draft.id), draft);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteIncompleteOrderFromFirestore(draftId: string): Promise<void> {
  const path = `incompleteOrders/${draftId}`;
  try {
    await deleteDoc(doc(db, 'incompleteOrders', draftId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getIncompleteOrdersFromFirestore(): Promise<IncompleteOrder[]> {
  const path = 'incompleteOrders';
  try {
    const q = query(collection(db, 'incompleteOrders'));
    const snapshot = await getDocs(q);
    const results: IncompleteOrder[] = [];
    snapshot.forEach((doc) => {
      results.push(doc.data() as IncompleteOrder);
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Inventory API methods
export async function getInventoryFromFirestore(): Promise<InventoryItem[]> {
  const path = 'inventory';
  try {
    const q = query(collection(db, 'inventory'));
    const snapshot = await getDocs(q);
    const results: InventoryItem[] = [];
    snapshot.forEach((doc) => {
      results.push(doc.data() as InventoryItem);
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveInventoryItemToFirestore(item: InventoryItem): Promise<void> {
  const path = `inventory/${item.id}`;
  try {
    await setDoc(doc(db, 'inventory', item.id), item);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function decrementInventoryItemInFirestore(color: ProductColor, size: Size): Promise<void> {
  const itemId = `${color}-${size}`;
  const path = `inventory/${itemId}`;
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
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
