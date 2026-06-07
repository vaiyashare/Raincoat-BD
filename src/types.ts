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
  reviewDate: string;
  rating: number; // For stars
  messages: ReviewMessage[];
  productPhoto?: string; // Optional image simulation if available
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
  createdAt: string;
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
  createdAt: string;
  lastUpdatedAt: string;
  fieldsFilledCount: number;
}

export interface InventoryItem {
  id: string; // e.g. "Black-XL", "Navy Blue-XXL"
  color: ProductColor;
  size: Size;
  quantity: number;
  lowStockAlert?: number;
}
