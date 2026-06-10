import { RaincoatOrder } from '../types';
import { getIntegrationsSettingsFromFirestore } from './firebase';

// Helper to normalize Bangladeshi phone number to international WhatsApp format (e.g. 88017XXXXXXXX)
export function normalizeWhatsAppPhone(rawPhone: string): string {
  let clean = rawPhone.replace(/\D/g, '');
  
  if (clean.startsWith('01') && clean.length === 11) {
    return '88' + clean;
  }
  if (clean.startsWith('1') && clean.length === 10) {
    return '880' + clean;
  }
  if (clean.startsWith('880') && clean.length === 13) {
    return clean;
  }
  return clean;
}

export const DEFAULT_WHATSAPP_TEMPLATE = `প্রিয় {customer_name},
আপনার রেইনকোটের অর্ডারটি সফলভাবে গৃহীত হয়েছে! 🎉

🛍️ অর্ডার বিবরণ:
- অর্ডার আইডি: #{order_id}
- সাইজ: {selected_size}
- কালার: {selected_color}
- পরিশোধযোগ্য সর্বমোট মূল্য: {order_price} TK (ক্যাশ অন ডেলিভারি, সম্পূর্ণ ফ্রি ডেলিভারি)
- ডেলিভারি ঠিকানা: {delivery_address}

পরবর্তী ১২ ঘণ্টার মধ্যে আমাদের কাস্টমার রিপ্রেজেন্টেটিভ আপনার মোবাইল নাম্বারে কল করে অর্ডারটি নিশ্চিত করবেন। অনুগ্রহ করে আপনার মোবাইল ফোনটি সচল রাখুন। ধন্যবাদ আমাদের সাথে থাকার জন্য! 😊`;

export async function triggerAutomatedWhatsApp(order: RaincoatOrder): Promise<{ success: boolean; message: string }> {
  try {
    const settings = await getIntegrationsSettingsFromFirestore();
    if (!settings) {
      return { success: false, message: 'Settings not found in database' };
    }

    if (!settings.whatsapp_enabled) {
      console.log('Automated WhatsApp messaging is currently disabled in Integrations Settings.');
      return { success: false, message: 'WhatsApp integration is disabled' };
    }

    const provider = settings.whatsapp_provider || 'ultramsg';
    const instanceId = settings.whatsapp_instance_id || '';
    const token = settings.whatsapp_token || '';
    const rawTemplate = settings.whatsapp_message_template || DEFAULT_WHATSAPP_TEMPLATE;

    if (!token) {
      return { success: false, message: 'WhatsApp authentication token is missing' };
    }

    // Format phone number
    const toPhone = normalizeWhatsAppPhone(order.phone);
    if (!toPhone) {
      return { success: false, message: 'Invalid phone number formatted' };
    }

    // Dynamic color localization for Bangla templates
    const colorBn = order.color === 'Black' ? 'কালো (Premium Black)' : 'নেভি ব্লু (Classic Navy Blue)';

    // Compile template placeholders
    const formattedText = rawTemplate
      .replace(/{customer_name}/g, order.name || '')
      .replace(/{order_id}/g, order.id.replace('ord-', ''))
      .replace(/{order_price}/g, String(order.price))
      .replace(/{selected_size}/g, order.size)
      .replace(/{selected_color}/g, colorBn)
      .replace(/{delivery_address}/g, order.village || '');

    console.log(`Triggering automated WhatsApp via ${provider} to: ${toPhone}`);

    let response: Response;

    if (provider === 'ultramsg') {
      if (!instanceId) {
        return { success: false, message: 'UltraMsg Instance ID is missing' };
      }
      
      const endpoint = `https://api.ultramsg.com/${instanceId}/messages/chat`;
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          to: toPhone,
          body: formattedText,
        }),
      });
    } else if (provider === 'greenapi') {
      if (!instanceId) {
        return { success: false, message: 'GreenAPI waInstance ID is missing' };
      }

      // GreenAPI uses chatId format like "8801700000000@c.us"
      const endpoint = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`;
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: `${toPhone}@c.us`,
          message: formattedText,
        }),
      });
    } else if (provider === 'custom_webhook') {
      // Direct Webhook / Custom gateway
      response = await fetch(token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: toPhone,
          message: formattedText,
          orderId: order.id,
          name: order.name,
          price: order.price,
          color: order.color,
          size: order.size,
          address: order.village
        }),
      });
    } else {
      return { success: false, message: 'Unsupported provider configured' };
    }

    if (response.ok) {
      console.log(`Automated WhatsApp message successfully sent via ${provider}!`);
      return { success: true, message: 'WhatsApp message sent successfully' };
    } else {
      const errorText = await response.text();
      console.warn(`WhatsApp gateway returned error status ${response.status}:`, errorText);
      return { success: false, message: `Gateway returned status ${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.warn('Failed to send automated WhatsApp message confirmation:', error);
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
}
