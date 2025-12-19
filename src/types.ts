export type MaterialType = 'imp' | 'marco' | 'ar';

export interface PriceMap {
  imp: number;
  marco: number;
  ar: number;
}

export interface ProductVariant {
  sku: string;
  versionName: string; // e.g., "Std 2:3"
  dimensions: string;  // e.g., "60x90"
  isBig: boolean;      // Logic: max(w,h) >= 60
  prices: PriceMap;
}

export interface Product {
  id: string;          // Simplified slug for URL matching (e.g., "leopardo-nakuru")
  name: string;        // Display name
  imageUrl: string;
  isFeline: boolean;
  variants: ProductVariant[];
}

export interface CartItem {
  cartId: string; // Unique ID for the cart entry
  productName: string;
  variantSku: string;
  variantName: string;
  dimensions: string;
  material: MaterialType;
  price: number;
  isBig: boolean;
  imageUrl: string;
}

export interface DiscountResult {
  label: string;
  discountRate: number; // 0.20, 0.15, etc.
  subtotal: number;
  total: number;
  count: number;
  grandesCount: number;
}