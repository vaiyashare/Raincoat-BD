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

/**
 * Initializes standard browser Facebook pixel if configured and enabled
 */
export function initMetaPixel() {
  const config = getPixelConfig();
  if (!config.enabled || !config.pixelId) {
    console.log('[PixelTracking] Meta Pixel tracking is currently disabled or has no Pixel ID.');
    return;
  }

  // Inject Meta Pixel script boilerplate
  const win = window as any;
  if (!win.fbq) {
    win.fbq = function (...args: any[]) {
      win.fbq.callMethod ? win.fbq.callMethod.apply(win.fbq, args) : win.fbq.queue.push(args);
    };
    if (!win._fbq) win._fbq = win.fbq;
    win.fbq.push = win.fbq;
    win.fbq.loaded = true;
    win.fbq.version = '2.0';
    win.fbq.queue = [];

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.setAttribute('data-injected-api', 'fb-pixel-lib');
    document.head.appendChild(script);
  }

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

  // 3. Dispatch event to Conversions API (CAPI) if enabled
  if (config.capiEnabled && config.capiToken) {
    const capiUrl = `https://graph.facebook.com/v18.0/${config.pixelId}/events?access_token=${config.capiToken}`;
    
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

      console.log(`[PixelTracking] Posting Server CAPI Event: ${eventName}`, payload);

      // Perform non-blocking background fetch so customer UX remains lightning fast
      fetch(capiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => {
        console.log('[PixelTracking] CAPI Response successfully received:', data);
      })
      .catch(fetchErr => {
        console.warn('[PixelTracking] Failed to dispatch CAPI fetch trigger:', fetchErr);
      });

    } catch (capiAssemblyErr) {
      console.error('[PixelTracking] Conversion API body generation error:', capiAssemblyErr);
    }
  }
}
