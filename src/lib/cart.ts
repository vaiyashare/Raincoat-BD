import { Product } from '../types';

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color: string;
}

export function getCart(): CartItem[] {
  try {
    const data = window.localStorage.getItem('soda_shopping_cart');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveCart(cart: CartItem[]) {
  try {
    window.localStorage.setItem('soda_shopping_cart', JSON.stringify(cart));
    // Dispatch instant update across components
    window.dispatchEvent(new Event('cart-updated'));
  } catch (e) {
    console.error("Failed to save cart to localStorage", e);
  }
}

export function addToCart(product: Product, size: string, color: string, quantity = 1) {
  const cart = getCart();
  const index = cart.findIndex(
    (item) => item.product.id === product.id && item.size === size && item.color === color
  );
  if (index > -1) {
    cart[index].quantity += quantity;
  } else {
    cart.push({ product, quantity, size, color });
  }
  saveCart(cart);
}

export function updateQuantity(index: number, quantity: number) {
  const cart = getCart();
  if (cart[index]) {
    cart[index].quantity = Math.max(1, quantity);
    saveCart(cart);
  }
}

export function removeFromCart(index: number) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

export function clearCart() {
  saveCart([]);
}
