export type Size = 'XL' | 'XXL' | '3XL' | '4XL';

export type ProductColor = 'Black' | 'Navy Blue';

export interface SizeRecommendation {
  size: Size;
  price: number;
  weightRange: string;
  heightRange: string;
}

export interface ReviewMessage {
  id: string;
  sender: 'client' | 'admin';
  text: string;
  time: string;
  isRead?: boolean;
}

export interface CustomerReview {
  id: string;
  customerName: string;
  phoneNumberMasked: string;
  verifiedPurchase: boolean;
  avatarUrl?: string;
  reviewDate?: string;
  rating: number; // For stars
  messages: ReviewMessage[];
  productPhoto?: string; // Optional image simulation if available
  badge?: string;
  helpfulCount?: number;
  title?: string;
}

export interface RaincoatOrder {
  id: string;
  name: string;
  village: string;
  policeStation?: string;
  district?: string;
  phone: string;
  size: Size;
  color: ProductColor;
  weight: number; // in kg
  heightFeet: number;
  heightInches: number;
  price: number;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Canceled' | 'Canceled Fake Order';
  isConfirmed?: boolean;
  bikeModel?: string;
  createdAt: string;
  fraudScore?: number;
  fraudStatus?: 'Safe' | 'Warning' | 'High Risk' | 'Scammer';
  fraudReason?: string;
  orderNotes?: string;
  partialPaymentSender?: string;
  partialPaymentTxnId?: string;
  partialPaymentAmount?: number;
  courierName?: string;
  trackingId?: string;
  whatsappConsent?: boolean;
  synced?: boolean;
}

export interface IncompleteOrder {
  id: string;
  name: string;
  phone: string;
  village: string;
  size: Size;
  color: ProductColor;
  weight: number;
  heightFeet: number;
  heightInches: number;
  price: number;
  bikeModel?: string;
  createdAt: string;
  lastUpdatedAt: string;
  fieldsFilledCount: number;
  fraudScore?: number;
  fraudStatus?: 'Safe' | 'Warning' | 'High Risk' | 'Scammer';
  fraudReason?: string;
  orderNotes?: string;
  whatsappConsent?: boolean;
  synced?: boolean;
}

export interface InventoryItem {
  id: string; // e.g. "Black-XL", "Navy Blue-XXL"
  color: string;
  size: string;
  quantity: number;
  lowStockAlert?: number;
  productId?: string;
  productTitle?: string;
}

export interface MediaItem {
  id: string;
  url: string; // Base64 data string or direct web link address
  title: string;
  tag: string;
  description?: string;
  orderIndex: number;
  createdAt: string;
  page?: 'raincoat' | 'bikecover';
  bgUrl?: string; // Optional background image URL if set
}

export interface ActiveSession {
  id: string;
  city: string;
  country: string;
  countryCode?: string;
  page: string;
  browser: string;
  os: string;
  createdAt: string;
  updatedAt: string;
  isCustomSimulated?: boolean;
}

export interface Product {
  id: string;
  title: string;
  slug?: string;
  description: string;
  price: number;
  image: string;
  category: string;
  sizes: string[];
  colors: string[];
  images?: string[];
  addDeliveryCharge?: boolean;
}

export interface HomepageBannerSlide {
  badge: string;
  badgeColor?: string;
  title: string;
  description: string;
  bgType: 'color' | 'image' | 'gradient';
  bgColor?: string;
  bgGradient?: string;
  bgImage?: string;
  bgImageMobile?: string;
  textColor?: string;
  primaryBtnText: string;
  primaryBtnLink: string;
  secondaryBtnText: string;
  secondaryBtnLink: string;
}

export interface HomepageBannerSettings {
  slides: HomepageBannerSlide[];
}

export interface PageBlock {
  id: string;
  type: 'headline' | 'text' | 'image' | 'video' | 'button' | 'form' | 'shop';
  content: string;
  styles?: {
    color?: string;
    bgColor?: string;
    fontSize?: string;
    padding?: string;
    textAlign?: 'left' | 'center' | 'right';
  };
}

export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  blocks: PageBlock[];
}

export interface AdvancedAddonsSettings {
  courier_enabled: boolean;
  courier_provider: 'steadfast' | 'pathao' | 'redx' | 'none';
  steadfast_api_key: string;
  steadfast_secret: string;
  pathao_client_id: string;
  pathao_client_secret: string;
  pathao_store_id: string;
  redx_api_key: string;
  courier_log?: { id: string; orderId: string; courier: string; status: string; trackingId: string; createdAt: string; }[];
  
  partial_payment_enabled: boolean;
  partial_payment_amount: number;
  partial_payment_bkash: string;
  partial_payment_nagad: string;
  partial_payment_rocket: string;
  partial_payment_instructions: string;
  
  sms_enabled: boolean;
  sms_provider: 'greenweb' | 'bulksmsbd' | 'none';
  sms_api_key: string;
  sms_username: string;
  sms_sender_id: string;
  sms_template_order: string;
  sms_template_shipping: string;
  sms_log?: { id: string; orderId: string; phone: string; message: string; status: string; createdAt: string; }[];
  
  exit_intent_enabled: boolean;
  exit_intent_delay: number;
  exit_intent_discount: number;
  exit_intent_coupon: string;
  exit_intent_title: string;
  exit_intent_subtitle: string;
  
  pixel_ids: string;
  gtm_ids: string;
  track_lead: boolean;
  track_purchase: boolean;
  track_initiate_checkout: boolean;

  // Site Configuration Customization
  site_title?: string;
  site_favicon?: string;
  site_logo_url?: string;
  header_snippets?: string;
  footer_snippets?: string;
  section_customizations?: Record<string, any>;
  bike_triple_cards?: { title: string; imageUrl: string; description?: string }[];
}



