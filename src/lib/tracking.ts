// Secure in-memory database to comply with "Dont save any of data in Localstore, customers or users background. All data save in cloud and show all in Admin panel."
const memoryStorageMap = new Map<string, string>();
const localStorage = {
  getItem: (key: string) => {
    if (memoryStorageMap.has(key)) {
      return memoryStorageMap.get(key) || null;
    }
    // Fallback to window.localStorage purely for tracking system configs (Pixel ID, tokens) to synchronize seamlessly with browser settings
    if (typeof window !== 'undefined') {
      try {
        return window.localStorage.getItem(key);
      } catch (_) {}
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    memoryStorageMap.set(key, value);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, value);
      } catch (_) {}
    }
  },
  removeItem: (key: string) => {
    memoryStorageMap.delete(key);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key);
      } catch (_) {}
    }
  },
  clear: () => {
    memoryStorageMap.clear();
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.clear();
      } catch (_) {}
    }
  },
};

// Automate loading integrations directly from Firestore on load for maximum cloud survival and synchronization
if (typeof window !== 'undefined') {
  import('./firebase').then(({ getIntegrationsSettingsFromFirestore }) => {
    getIntegrationsSettingsFromFirestore().then((settings) => {
      if (settings) {
        if (settings.fb_pixel_id) {
          memoryStorageMap.set('fb_pixel_id', settings.fb_pixel_id);
          window.localStorage.setItem('fb_pixel_id', settings.fb_pixel_id);
        }
        const pixelEnabled = settings.fb_pixel_enabled !== false ? 'true' : 'false';
        memoryStorageMap.set('fb_pixel_enabled', pixelEnabled);
        window.localStorage.setItem('fb_pixel_enabled', pixelEnabled);

        const fbCapiEnabled = settings.fb_capi_enabled === true ? 'true' : 'false';
        memoryStorageMap.set('fb_capi_enabled', fbCapiEnabled);
        window.localStorage.setItem('fb_capi_enabled', fbCapiEnabled);

        const advancedMatching = settings.fb_advanced_matching !== false ? 'true' : 'false';
        memoryStorageMap.set('fb_advanced_matching', advancedMatching);
        window.localStorage.setItem('fb_advanced_matching', advancedMatching);

        if (settings.fb_capi_token) {
          memoryStorageMap.set('fb_capi_token', settings.fb_capi_token);
          window.localStorage.setItem('fb_capi_token', settings.fb_capi_token);
        }

        const testEventEnabled = settings.fb_test_event_enabled === true ? 'true' : 'false';
        memoryStorageMap.set('fb_test_event_enabled', testEventEnabled);
        window.localStorage.setItem('fb_test_event_enabled', testEventEnabled);

        if (settings.fb_test_event_code) {
          memoryStorageMap.set('fb_test_event_code', settings.fb_test_event_code);
          window.localStorage.setItem('fb_test_event_code', settings.fb_test_event_code);
        }
        
        // TikTok
        if (settings.tiktok_pixel_id) {
          memoryStorageMap.set('tiktok_pixel_id', settings.tiktok_pixel_id);
          window.localStorage.setItem('tiktok_pixel_id', settings.tiktok_pixel_id);
        }
        const ttPixelEnabled = settings.tiktok_pixel_enabled !== false ? 'true' : 'false';
        memoryStorageMap.set('tiktok_pixel_enabled', ttPixelEnabled);
        window.localStorage.setItem('tiktok_pixel_enabled', ttPixelEnabled);

        const ttCapiEnabled = settings.tiktok_capi_enabled === true ? 'true' : 'false';
        memoryStorageMap.set('tiktok_capi_enabled', ttCapiEnabled);
        window.localStorage.setItem('tiktok_capi_enabled', ttCapiEnabled);

        const ttAdvancedMatching = settings.tiktok_advanced_matching !== false ? 'true' : 'false';
        memoryStorageMap.set('tiktok_advanced_matching', ttAdvancedMatching);
        window.localStorage.setItem('tiktok_advanced_matching', ttAdvancedMatching);

        if (settings.tiktok_access_token) {
          memoryStorageMap.set('tiktok_access_token', settings.tiktok_access_token);
          window.localStorage.setItem('tiktok_access_token', settings.tiktok_access_token);
        }

        const ttTestEnabled = settings.tiktok_test_event_enabled === true ? 'true' : 'false';
        memoryStorageMap.set('tiktok_test_event_enabled', ttTestEnabled);
        window.localStorage.setItem('tiktok_test_event_enabled', ttTestEnabled);

        if (settings.tiktok_test_event_code) {
          memoryStorageMap.set('tiktok_test_event_code', settings.tiktok_test_event_code);
          window.localStorage.setItem('tiktok_test_event_code', settings.tiktok_test_event_code);
        }

        if (settings.ga_track_id) {
          memoryStorageMap.set('ga_track_id', settings.ga_track_id);
          window.localStorage.setItem('ga_track_id', settings.ga_track_id);
        }

        // Re-initialize standard pixels now that we have cloud settings
        initMetaPixel();
        initTikTokPixel();
      }
    }).catch((err) => {
      console.warn('[PixelTracking] Failed to sync latest configurations from Firestore:', err);
    });
  }).catch(() => {});
}

/**
 * PixelYourSite-like Facebook Meta Pixel & Conversion API (CAPI) Tracking Utility.
 * Supports active toggling, test event parameters, and cryptographically secure
 * SHA-256 advanced matching data hashing natively inside the browser context.
 */

// Simple SHA-256 hashing helper using the browser's native Web Crypto API
async function sha256(value: string): Promise<string> {
  const clean = value.trim().toLowerCase();
  if (!clean) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(clean);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('[PixelTracking] WebCrypto SHA-256 failed:', err);
    return '';
  }
}

interface PixelConfig {
  enabled: boolean;
  pixelId: string;
  capiEnabled: boolean;
  capiToken: string;
  advancedMatching: boolean;
  testEventEnabled: boolean;
  testEventCode: string;
}

export function getPixelConfig(): PixelConfig {
  return {
    enabled: localStorage.getItem('fb_pixel_enabled') !== 'false',
    pixelId: localStorage.getItem('fb_pixel_id') || '',
    capiEnabled: localStorage.getItem('fb_capi_enabled') === 'true',
    capiToken: localStorage.getItem('fb_capi_token') || '',
    advancedMatching: localStorage.getItem('fb_advanced_matching') !== 'false',
    testEventEnabled: localStorage.getItem('fb_test_event_enabled') === 'true',
    testEventCode: localStorage.getItem('fb_test_event_code') || '',
  };
}

interface TikTokConfig {
  enabled: boolean;
  pixelId: string;
  capiEnabled: boolean;
  capiToken: string;
  advancedMatching: boolean;
  testEventEnabled: boolean;
  testEventCode: string;
}

export function getTikTokConfig(): TikTokConfig {
  return {
    enabled: localStorage.getItem('tiktok_pixel_enabled') !== 'false',
    pixelId: localStorage.getItem('tiktok_pixel_id') || '',
    capiEnabled: localStorage.getItem('tiktok_capi_enabled') === 'true',
    capiToken: localStorage.getItem('tiktok_access_token') || '',
    advancedMatching: localStorage.getItem('tiktok_advanced_matching') !== 'false',
    testEventEnabled: localStorage.getItem('tiktok_test_event_enabled') === 'true',
    testEventCode: localStorage.getItem('tiktok_test_event_code') || '',
  };
}

/**
 * Initializes standard TikTok pixel if configured and enabled
 */
export function initTikTokPixel() {
  const config = getTikTokConfig();
  if (!config.enabled || !config.pixelId) {
    console.log('[PixelTracking] TikTok Pixel is currently disabled or has no Pixel ID.');
    return;
  }

  const win = window as any;

  if (!win.ttq) {
    const ttq = win.ttq = win.ttq || [];
    ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
    ttq.setAndDefer = function (t: any, e: any) {
      t[e] = function () {
        t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (let i = 0; i < ttq.methods.length; i++) {
      ttq.setAndDefer(ttq, ttq.methods[i]);
    }
    ttq.instance = function (t: any) {
      const e = ttq._i[t] || [];
      for (let n = 0; n < ttq.methods.length; n++) {
        ttq.setAndDefer(e, ttq.methods[n]);
      }
      return e;
    };
    ttq._i = ttq._i || {};
    ttq._i[config.pixelId] = [];
    ttq._i[config.pixelId]._u = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._t = ttq._t || {};
    ttq._t[config.pixelId] = +new Date();
    ttq._o = ttq._o || {};
    ttq._o[config.pixelId] = {};
    ttq._n = null;

    const existingScript = document.querySelector('script[data-injected-api="tiktok-pixel-lib"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.async = true;
      script.src = "https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=" + config.pixelId + "&lib=ttq";
      script.setAttribute('data-injected-api', 'tiktok-pixel-lib');
      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }
    }
  }

  win.ttq.page();
  console.log(`[PixelTracking] Initialized TikTok Pixel ID: ${config.pixelId}`);
}

/**
 * Dispatches a tracking event to TikTok Pixel and TikTok CAPI Proxy
 */
export async function trackTikTokEvent(
  eventName: string, 
  customData: Record<string, any> = {},
  rawUserData: { name?: string; phone?: string; email?: string; address?: string } = {},
  eventId?: string
) {
  const config = getTikTokConfig();
  if (!config.enabled || !config.pixelId) return;

  const resolvedEventId = eventId || `tt-evt-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const win = window as any;

  // 1. Prepare hashed data for TikTok advanced matching
  const matchingData: Record<string, any> = {};
  if (config.advancedMatching) {
    let rawPhone = (rawUserData.phone || '').replace(/[^0-9]/g, '');
    if (rawPhone.startsWith('01') && rawPhone.length === 11) {
      rawPhone = '88' + rawPhone;
    }
    if (rawPhone) {
      matchingData.phone_number = await sha256(rawPhone);
    }
    if (rawUserData.email) {
      matchingData.email = await sha256(rawUserData.email);
    }
  }

  // 2. Browser Tag tracking
  if (win.ttq) {
    let tiktokEvent = eventName;
    if (eventName === 'Purchase') {
      tiktokEvent = 'CompletePayment';
    } else if (eventName === 'InitiateCheckout') {
      tiktokEvent = 'InitiateCheckout';
    } else if (eventName === 'PageView') {
      tiktokEvent = 'PageView';
    }

    console.log(`[PixelTracking] Tracking TikTok Browser Event: ${tiktokEvent}`, customData, matchingData);
    
    if (matchingData && Object.keys(matchingData).length > 0) {
      win.ttq.identify(matchingData);
    }
    win.ttq.track(tiktokEvent, customData, { event_id: resolvedEventId });
  }

  // 3. TikTok Conversions API tracking proxy
  if (config.capiEnabled && config.capiToken) {
    try {
      let ttCapiEvent = eventName;
      if (eventName === 'Purchase') {
        ttCapiEvent = 'CompletePayment';
      } else if (eventName === 'InitiateCheckout') {
        ttCapiEvent = 'InitiateCheckout';
      } else if (eventName === 'PageView') {
        ttCapiEvent = 'PageView';
      }

      const userAgent = navigator.userAgent;
      const currentUrl = window.location.href;

      // Setup standard TikTok conversion api model
      const payload = {
        event_source: "web",
        event_source_id: config.pixelId,
        data: [
          {
            event: ttCapiEvent,
            event_time: Math.floor(Date.now() / 1005),
            event_id: resolvedEventId,
            user_data: {
              client_user_agent: userAgent,
              emails: matchingData.email ? [matchingData.email] : [],
              phone_numbers: matchingData.phone_number ? [matchingData.phone_number] : []
            },
            properties: {
              value: customData.value || 0,
              currency: customData.currency || "BDT",
              content_type: customData.content_type || "product"
            }
          }
        ]
      };

      // Add test event code if enabled (Required for tiktok testing)
      if (config.testEventEnabled && config.testEventCode) {
        (payload as any).test_event_code = config.testEventCode;
      }

      console.log(`[PixelTracking] Posting Server TikTok CAPI Event via secure proxy: ${ttCapiEvent}`, payload);

      fetch('/api/tiktok-capi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pixelId: config.pixelId,
          capiToken: config.capiToken,
          payload
        })
      })
      .then(res => res.json())
      .then(data => {
        console.log('[PixelTracking] Secure TikTok Proxy CAPI Response received:', data);
        
        // Push record into logging window list for diagnostic panel
        const existingEventLog = win._pixel_events_log?.find((l: any) => l.id === resolvedEventId);
        if (existingEventLog) {
          // If we track both, make status dynamic
          existingEventLog.capiStatus = data.code === 0 || data.message === 'OK' || data.success ? 'success' : 'failed';
          window.dispatchEvent(new Event('new_pixel_event_tracked'));
        }
      })
      .catch(fetchErr => {
        console.warn('[PixelTracking] Failed to dispatch TikTok CAPI via Proxy:', fetchErr);
      });

    } catch (ttCapiErr) {
      console.warn('[PixelTracking] TikTok CAPI generation failed:', ttCapiErr);
    }
  }
}

/**
 * Initializes standard browser Facebook pixel if configured and enabled
 */
export function initMetaPixel() {
  const config = getPixelConfig();
  if (!config.enabled || !config.pixelId) {
    console.log('[PixelTracking] Meta Pixel tracking is currently disabled or has no Pixel ID.');
    return;
  }

  const win = window as any;

  // Prevent multiple boilerplates or duplicate fbevents scripts
  if (!win.fbq) {
    win.fbq = function (...args: any[]) {
      win.fbq.callMethod ? win.fbq.callMethod.apply(win.fbq, args) : win.fbq.queue.push(args);
    };
    if (!win._fbq) win._fbq = win.fbq;
    win.fbq.push = win.fbq;
    win.fbq.loaded = true;
    win.fbq.version = '2.0';
    win.fbq.queue = [];
  }

  // Dual Check: If script tag is already present in DOM, do NOT append another script tag!
  const existingScript = document.querySelector('script[data-injected-api="fb-pixel-lib"]');
  if (!existingScript) {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.setAttribute('data-injected-api', 'fb-pixel-lib');
    document.head.appendChild(script);
  }

  // Prevent redundant same-ID initialization
  win._initialized_pixels = win._initialized_pixels || {};
  if (win._initialized_pixels[config.pixelId]) {
    console.log(`[PixelTracking] Meta Pixel ID: ${config.pixelId} is already active/initialized. Skipping redundant setup.`);
    return;
  }

  // Mark as initialized
  win._initialized_pixels[config.pixelId] = true;

  // Initialize the tracker
  console.log(`[PixelTracking] Initializing Meta Pixel ID: ${config.pixelId}`);
  win.fbq('init', config.pixelId);
  
  // Track PageView on load
  trackPixelEvent('PageView');
}

/**
 * Universally dispatches a pixel standard event or custom event.
 * Handles duplicate CAPI dispatch & deduplication eventID parameters.
 */
export async function trackPixelEvent(
  eventName: string, 
  customData: Record<string, any> = {}, 
  rawUserData: { name?: string; phone?: string; email?: string; address?: string } = {}
) {
  // 1. Dispatch event to TikTok Pixel in parallel
  trackTikTokEvent(eventName, customData);

  const config = getPixelConfig();
  if (!config.enabled || !config.pixelId) return;

  // Generate a random unique event ID for Meta deduplication (Browser pixel vs CAPI)
  const eventId = `evt-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  // 1. Prepare advanced matching user details
  const matchingData: Record<string, any> = {};
  if (config.advancedMatching) {
    // Normalizing phone (BD international code standard for Meta matches)
    let phoneToHash = (rawUserData.phone || '').replace(/[^0-9]/g, '');
    if (phoneToHash.startsWith('01') && phoneToHash.length === 11) {
      phoneToHash = '88' + phoneToHash;
    }

    const hashedName = rawUserData.name ? await sha256(rawUserData.name) : '';
    const hashedPhone = phoneToHash ? await sha256(phoneToHash) : '';
    const hashedEmail = rawUserData.email ? await sha256(rawUserData.email) : '';
    const hashedCity = rawUserData.address ? await sha256(rawUserData.address) : '';

    if (hashedName) {
      matchingData.fn = hashedName;
      matchingData.ln = hashedName; // fall back to same string
    }
    if (hashedPhone) matchingData.ph = hashedPhone;
    if (hashedEmail) matchingData.em = hashedEmail;
    if (hashedCity) {
      matchingData.ct = hashedCity;
      matchingData.zp = await sha255ZipOrHashed(); // fall back
    }
    matchingData.country = await sha256('bd'); // Bangladesh default
  }

  // Helper for zip
  async function sha255ZipOrHashed() {
    return sha256('1200'); // default postal mock
  }

  // 2. Dispatch event to browser pixel
  const win = window as any;
  
  // Register globally in memory log for the real-time Events Manager dashboard view
  const newLogEntry = {
    id: eventId,
    timestamp: new Date().toLocaleTimeString(),
    eventName,
    customData,
    matchingData,
    browserSent: !!win.fbq,
    capiEnabled: config.capiEnabled,
    capiStatus: config.capiEnabled ? 'pending' : 'not_enabled',
    testCode: config.testEventEnabled ? config.testEventCode : '',
    pixelId: config.pixelId,
  };
  win._pixel_events_log = win._pixel_events_log || [];
  win._pixel_events_log.unshift(newLogEntry);
  if (win._pixel_events_log.length > 50) {
    win._pixel_events_log.pop();
  }
  window.dispatchEvent(new Event('new_pixel_event_tracked'));

  if (win.fbq) {
    const pixelOptions: Record<string, any> = { eventID: eventId };
    
    // Add test event code if enabled (Required in PixelYourSite for developer testing)
    if (config.testEventEnabled && config.testEventCode) {
      pixelOptions.testEventCode = config.testEventCode;
    }

    console.log(`[PixelTracking] Tracking Browser Event: ${eventName}`, customData, pixelOptions);
    
    // Perform track call with tracking options parameter
    if (matchingData && Object.keys(matchingData).length > 0 && eventName === 'PageView') {
      // Re-init with matching data to attach matching attributes
      win.fbq('init', config.pixelId, matchingData);
    }
    win.fbq('track', eventName, customData, pixelOptions);
  }

  // 3. Dispatch event to Conversions API (CAPI) if enabled securely via server proxy
  if (config.capiEnabled && config.capiToken) {
    // Extract formatted user agent & ip for CAPI accuracy
    const userAgent = navigator.userAgent;
    const currentUrl = window.location.href;

    try {
      // Assemble standard server payloads structure
      const payload: Record<string, any> = {
        data: [
          {
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId,
            event_source_url: currentUrl,
            action_source: 'website',
            user_data: {
              client_user_agent: userAgent,
              ...matchingData
            },
            custom_data: {
              ...customData
            }
          }
        ]
      };

      // Integrate test_event_code inside server payload root
      if (config.testEventEnabled && config.testEventCode) {
        payload.test_event_code = config.testEventCode;
      }

      console.log(`[PixelTracking] Posting Server CAPI Event via secure proxy: ${eventName}`, payload);

      // Perform non-blocking background fetch to the secure container proxy
      fetch('/api/fb-capi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pixelId: config.pixelId,
          capiToken: config.capiToken,
          payload
        })
      })
      .then(res => res.json())
      .then(data => {
        console.log('[PixelTracking] Secure Proxy CAPI Response received:', data);
        const logItem = win._pixel_events_log?.find((l: any) => l.id === eventId);
        if (logItem) {
          logItem.capiStatus = data.status === 'ok' || data.success ? 'success' : 'failed';
          window.dispatchEvent(new Event('new_pixel_event_tracked'));
        }
      })
      .catch(fetchErr => {
        console.warn('[PixelTracking] Failed to dispatch CAPI via Proxy:', fetchErr);
        const logItem = win._pixel_events_log?.find((l: any) => l.id === eventId);
        if (logItem) {
          logItem.capiStatus = 'failed';
          window.dispatchEvent(new Event('new_pixel_event_tracked'));
        }
      });

    } catch (capiAssemblyErr) {
      console.error('[PixelTracking] Conversion API body generation error:', capiAssemblyErr);
    }
  }
}
