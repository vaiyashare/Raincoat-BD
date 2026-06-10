/**
 * Fraud Check & Validation Service
 * Integrates with Abstract API (or fallback heuristics) to score
 * safety and risks of Bangladeshi mobile phone numbers and email addresses.
 */

export interface FraudCheckResult {
  score: number; // 0 (safe) to 100 (critical fraud)
  status: 'Safe' | 'Warning' | 'High Risk' | 'Scammer';
  reason: string;
}

const validateBDPhone = (num: string): boolean => {
  const pattern = /^(?:\+88|88)?(01[3-9]\d{8})$/;
  return pattern.test(num.trim());
};

/**
 * Runs active real-time checks and API lookups on phone + email combinations.
 */
export async function performFraudCheck(phone: string, email?: string): Promise<FraudCheckResult> {
  let score = 0;
  let reasonList: string[] = [];
  
  const cleanPhone = phone.trim().replace(/[-\s+]/g, '');
  const targetPhone = cleanPhone.startsWith('88') ? cleanPhone.substring(2) : cleanPhone;
  
  // 1. Initial Format Validation
  if (!validateBDPhone(targetPhone)) {
    score += 45;
    reasonList.push('ভুল বাংলাদেশী মোবাইল ফরম্যাট (Invalid BD phone format)');
  }

  // 2. Local/Global Blacklist Matching
  try {
    const rawBlacklist = localStorage.getItem('raincoat_fraud_blacklist') || '[]';
    const blacklist = JSON.parse(rawBlacklist);
    const inBlacklist = blacklist.some((b: any) => b.phone === targetPhone);
    if (inBlacklist) {
      score += 50;
      reasonList.push('কালো তালিকাভুক্ত মোবাইল (Blacklisted number)');
    }
  } catch (e) {
    console.warn("Local blacklist fetch failed during fraud scanning", e);
  }

  // 3. Sequential Repeated Order Checking
  try {
    const storedOrders = localStorage.getItem('raincoat_orders_fallback') || '[]';
    const orders = JSON.parse(storedOrders);
    const matchCount = orders.filter((o: any) => o.phone && o.phone.replace(/[-\s+]/g, '') === targetPhone).length;
    if (matchCount >= 3) {
      score += 30;
      reasonList.push(`অতিরিক্ত অর্ডার করার প্রবণতা (${matchCount} বার)`);
    }
  } catch (e) {}

  // 4. Abstract API Real-time Phone Validation (Optional Key Enabled)
  const phoneApiKey = (import.meta as any).env.VITE_ABSTRACT_API_PHONE_KEY;
  if (phoneApiKey) {
    try {
      // Abstract API requires phone numbers starting with international prefix, e.g., +88017...
      const intlPhone = cleanPhone.startsWith('0') ? `+88${cleanPhone}` : `+${cleanPhone}`;
      const url = `https://phonevalidation.abstractapi.com/v1/?api_key=${phoneApiKey}&phone=${encodeURIComponent(intlPhone)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.valid === false) {
          score += 40;
          reasonList.push('কুরিয়ার এপিআই রিপোর্ট: অকার্যকর সিম বা মোবাইল নম্বর (Invalid Carrier SIM)');
        } else {
          // Check country code
          if (data.country?.code !== 'BD') {
            score += 25;
            reasonList.push(`বিদেশী মোবাইল অপারেটর সনাক্ত হয়েছে: (${data.country?.name || 'Unknown'})`);
          }
        }
      }
    } catch (apiErr) {
      console.warn("Abstract Phone API connection timeout/limit, working on cached rules", apiErr);
    }
  }

  // 5. Abstract API Real-time Email Validation (Optional Key Enabled)
  const emailApiKey = (import.meta as any).env.VITE_ABSTRACT_API_EMAIL_KEY;
  if (email && email.trim() !== '') {
    const cleanEmail = email.trim();
    
    // Quick format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(cleanEmail)) {
      score += 20;
      reasonList.push('ভুল ইমেইল ফরম্যাট (Malformed Email)');
    }

    if (emailApiKey) {
      try {
        const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${emailApiKey}&email=${encodeURIComponent(cleanEmail)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.deliverability === 'UNDELIVERABLE') {
            score += 35;
            reasonList.push('অপ্রাপ্য অবাস্তব ইমেইল ঠিকানা (Undeliverable Inbox)');
          }
          if (data.is_disposable_email?.value === true) {
            score += 25;
            reasonList.push('অস্থায়ী ওয়ান-টাইম ভুয়া ইমেইল (Disposable temporary email)');
          }
          if (data.quality_score < 0.4) {
            score += 15;
            reasonList.push('কম ইমেইল ট্রাস্ট স্কোর (Low quality domain)');
          }
        }
      } catch (apiErr) {
        console.warn("Abstract Email API connection error, bypassed", apiErr);
      }
    }
  }

  // Limit capped at 99
  const finalScore = Math.min(score, 99);
  
  let status: 'Safe' | 'Warning' | 'High Risk' | 'Scammer' = 'Safe';
  if (finalScore >= 75) {
    status = 'Scammer';
  } else if (finalScore >= 45) {
    status = 'High Risk';
  } else if (finalScore >= 20) {
    status = 'Warning';
  }

  const reason = reasonList.length > 0 
    ? reasonList.join(', ') 
    : 'কুরিয়ার ও মোবাইল ট্রাস্ট স্কোর সুরক্ষিত (Safe Buyer Signature)';

  return {
    score: finalScore,
    status,
    reason
  };
}
