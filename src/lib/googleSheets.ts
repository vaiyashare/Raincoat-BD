import { RaincoatOrder } from '../types';

// Configuration keys for local preservation
const STORAGE_KEYS = {
  CLIENT_ID: 'sheets_client_id',
  SPREADSHEET_ID: 'sheets_spreadsheet_id',
  AUTO_SYNC: 'sheets_auto_sync',
  LAST_SYNC_TIME: 'sheets_last_sync_time',
  CONNECTED_EMAIL: 'sheets_connected_email'
};

export interface SheetsConfig {
  clientId: string;
  spreadsheetId: string;
  autoSync: boolean;
  connectedEmail: string | null;
  lastSyncTime: string | null;
}

// In-memory token storage (Do not save in localStorage/sessionStorage for security)
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0; // timestamp in milliseconds

/**
 * Load Google Sheets configuration from localStorage
 */
export function getSheetsConfig(): SheetsConfig {
  return {
    clientId: localStorage.getItem(STORAGE_KEYS.CLIENT_ID) || '',
    spreadsheetId: localStorage.getItem(STORAGE_KEYS.SPREADSHEET_ID) || '',
    autoSync: localStorage.getItem(STORAGE_KEYS.AUTO_SYNC) === 'true',
    connectedEmail: localStorage.getItem(STORAGE_KEYS.CONNECTED_EMAIL),
    lastSyncTime: localStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME)
  };
}

/**
 * Save Google Sheets configuration to localStorage
 */
export function saveSheetsConfig(config: Partial<SheetsConfig>) {
  if (config.clientId !== undefined) {
    localStorage.setItem(STORAGE_KEYS.CLIENT_ID, config.clientId);
  }
  if (config.spreadsheetId !== undefined) {
    localStorage.setItem(STORAGE_KEYS.SPREADSHEET_ID, config.spreadsheetId);
  }
  if (config.autoSync !== undefined) {
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC, config.autoSync ? 'true' : 'false');
  }
  if (config.connectedEmail !== undefined) {
    if (config.connectedEmail) {
      localStorage.setItem(STORAGE_KEYS.CONNECTED_EMAIL, config.connectedEmail);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CONNECTED_EMAIL);
    }
  }
  if (config.lastSyncTime !== undefined) {
    if (config.lastSyncTime) {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, config.lastSyncTime);
    } else {
      localStorage.removeItem(STORAGE_KEYS.LAST_SYNC_TIME);
    }
  }
}

/**
 * Reset Sheets token cache and settings
 */
export function disconnectSheets() {
  cachedAccessToken = null;
  tokenExpiresAt = 0;
  saveSheetsConfig({
    connectedEmail: null,
    lastSyncTime: null
  });
}

/**
 * Get current Google Sheets Access Token if it is valid
 */
export function getAccessToken(): string | null {
  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }
  return null;
}

/**
 * Initiate a browser popup-based OAuth implicit grant flow to authorize Google Sheets API.
 */
export function initiateSheetsAuth(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Basic verification on client ID
    if (!clientId || clientId.trim() === '') {
      reject(new Error('অনুগ্রহ করে একটি সঠিক Google Client ID প্রদান করুন।'));
      return;
    }

    const trimmedClientId = clientId.trim();
    const scopes = 'https://www.googleapis.com/auth/spreadsheets';
    
    // Redirect URIs: Standard origin for correct OAuth redirects works inside AI Studio iframe preview
    const redirectUri = window.location.origin;
    
    // Google Sheets implicit grant auth request URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      `client_id=${encodeURIComponent(trimmedClientId)}&` + 
      `redirect_uri=${encodeURIComponent(redirectUri)}&` + 
      `response_type=token&` + 
      `scope=${encodeURIComponent(scopes)}&` + 
      `prompt=select_account`;
    
    // Open a popup for Google Sign-In
    const width = 550;
    const height = 650;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;
    
    const popup = window.open(
      authUrl,
      'google_sheets_auth_popup',
      `width=${width},height=${height},left=${left},top=${top},status=yes,resizable=yes`
    );
    
    if (!popup) {
      reject(new Error('পপআপ লক হয়ে গিয়েছে! দয়া করে আপনার ব্রাউজার সেটিংস থেকে পপআপ অ্যালাউ করুন।'));
      return;
    }

    // Set callback listener
    const messageListener = (event: MessageEvent) => {
      // Basic security filter to discard unrelated page events
      if (event.source !== popup) return;
      
      const data = event.data;
      if (data && data.type === 'GOOGLE_SHEETS_AUTH_SUCCESS' && data.hash) {
        // Extract token parameters from Hash
        const hashStr = data.hash.substring(1); // skip '#'
        const params = new URLSearchParams(hashStr);
        const token = params.get('access_token');
        const expiresInStr = params.get('expires_in') || '3600';
        
        if (token) {
          cachedAccessToken = token;
          tokenExpiresAt = Date.now() + parseInt(expiresInStr, 10) * 1000;
          
          // Get the signed-in user profile info to store connection details
          fetchProfileInfo(token)
            .then(email => {
              saveSheetsConfig({
                clientId: trimmedClientId,
                connectedEmail: email || 'Connected Account'
              });
              resolve(token);
            })
            .catch(() => {
              saveSheetsConfig({
                clientId: trimmedClientId,
                connectedEmail: 'Authorized Store Account'
              });
              resolve(token);
            })
            .finally(() => {
              window.removeEventListener('message', messageListener);
              if (!popup.closed) popup.close();
            });
        } else {
          reject(new Error('অথরাইজেশন টোকেন পাওয়া যায়নি। আবার চেষ্টা করুন।'));
          window.removeEventListener('message', messageListener);
        }
      }
    };

    // Listen for the static index handler communicating success
    window.addEventListener('message', messageListener);

    // Watcher interval to handle closed popup cases
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        // Clean event state after a timeout to prevent leaks
        setTimeout(() => {
          window.removeEventListener('message', messageListener);
        }, 1000);
      }
    }, 500);
  });
}

/**
 * Fetch basic profile info to retrieve user's Google Email
 */
async function fetchProfileInfo(token: string): Promise<string | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      return data.email || null;
    }
  } catch (err) {
    console.error('Failed to retrieve user profile:', err);
  }
  return null;
}

/**
 * Helper to construct rows for spreadsheet export
 */
function mapOrdersToValues(orders: RaincoatOrder[]): any[][] {
  return orders.map(order => [
    order.id,
    new Date(order.createdAt).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' }),
    order.name,
    order.phone,
    order.village,
    order.policeStation || '',
    order.district || '',
    order.size,
    order.color === 'Black' ? 'কালো (Black)' : 'নেভি ব্লু (Navy Blue)',
    `${order.weight} kg`,
    `${order.heightFeet} ফিট ${order.heightInches} ইঞ্চি`,
    order.price,
    order.status === 'Pending' ? 'অপেক্ষমাণ (Pending)' : 
    order.status === 'Shipped' ? 'পথে রয়েছে (Shipped)' : 'ডেলিভারিউড (Delivered)'
  ]);
}

/**
 * Create a new Google spreadsheet for orders
 */
export async function createNewSpreadsheet(token: string, title = 'Monsoon Gear Raincoat Orders'): Promise<string> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  
  const payload = {
    properties: {
      title
    },
    sheets: [
      {
        properties: {
          title: 'অর্ডার তালিকা (Orders)',
          gridProperties: {
            frozenRowCount: 1,
            columnCount: 13
          },
          tabColor: {
            red: 0.1,
            green: 0.1,
            blue: 0.5
          }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'অর্ডার আইডি (Order ID)' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.95 } } },
                  { userEnteredValue: { stringValue: 'তারিখ ও সময় (Date)' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.95 } } },
                  { userEnteredValue: { stringValue: 'গ্রাহকের নাম (Customer Name)' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.95 } } },
                  { userEnteredValue: { stringValue: 'মোবাইল নাম্বার (Phone)' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.95 } } },
                  { userEnteredValue: { stringValue: 'ঠিকানা/গ্রাম (Address)' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.95 } } },
                  { userEnteredValue: { stringValue: 'থানা (Police Station)' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.95 } } },
                  { userEnteredValue: { stringValue: 'জেলা (District)' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.95 } } },
                  { userEnteredValue: { stringValue: 'সাইজ (Size)' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.95 } } },
                  { userEnteredValue: { stringValue: 'কালার (Color)' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.95 } } },
                  { userEnteredValue: { stringValue: 'ওজন (Weight)' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.95 } } },
                  { userEnteredValue: { stringValue: 'উচ্চতা (Height)' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.95 } } },
                  { userEnteredValue: { stringValue: 'মূল্য (Price)' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.95 } } },
                  { userEnteredValue: { stringValue: 'স্থিতি (Status)' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.95 } } }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('Failed to create sheet:', errorBody);
    throw new Error('গুগল শিট তৈরি করতে ব্যর্থ হয়েছে। অনুগ্রহ করে ক্লায়েন্ট আইডি অথবা এপিআই পারমিশন চেক করুন।');
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  saveSheetsConfig({ spreadsheetId });
  return spreadsheetId;
}

/**
 * Append a single order to the spreadsheet
 */
export async function appendOrderToSheet(token: string, spreadsheetId: string, order: RaincoatOrder): Promise<boolean> {
  const range = 'A:M';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
  
  const values = mapOrdersToValues([order]);
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });

  return res.ok;
}

/**
 * Sync (or overwrite write) multiple raincoat orders into the spreadsheet
 */
export async function syncAllOrdersToSheet(token: string, spreadsheetId: string, orders: RaincoatOrder[]): Promise<boolean> {
  if (orders.length === 0) return true;

  // Let's first read if sheet headers are present. If a spreadsheet is brand new, we might need headers.
  // We can write to Orders!A2:M since we already have headers from spreadsheet creation. 
  // Let's clear any old order data and write everything fresh to promote clean tracking!
  
  // Step 1: Clear values in ranges Orders!A2:M1000
  const rangeToClear = 'A2:M1000';
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeToClear)}:clear`;
  
  await fetch(clearUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // Step 2: Append all current orders freshly starting from row 2
  const writeRange = 'A2';
  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(writeRange)}:append?valueInputOption=USER_ENTERED`;
  const values = mapOrdersToValues(orders);

  const res = await fetch(writeUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });

  if (res.ok) {
    saveSheetsConfig({ lastSyncTime: new Date().toISOString() });
    return true;
  }
  return false;
}
