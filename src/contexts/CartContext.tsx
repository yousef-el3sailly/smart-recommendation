import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Product } from '@/hooks/useProducts';
import type { CartCustomization } from '@/lib/customization';
import { customizationExtra } from '@/lib/customization';

export interface CartItem {
  key: string;
  product: Product;
  quantity: number;
  customization?: CartCustomization;
  unitPrice: number; // base price + customization extras
}

function makeKey(productId: string, c?: CartCustomization | null) {
  return c ? `${productId}|${c.ram}|${c.ssd}` : productId;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, customization?: CartCustomization) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product, quantity = 1, customization?: CartCustomization) => {
    const stock = product.stock ?? 0;
    if (stock <= 0) {
      toast.error('This product is currently out of stock');
      return;
    }
    const key = makeKey(product.id, customization);
    const unitPrice = product.price + customizationExtra(customization);
    setItems(prev => {
      const existing = prev.find(i => i.key === key);
      if (existing) {
        if (existing.quantity + quantity > stock) {
          toast.error(`Only ${stock} in stock`);
          return prev;
        }
        return prev.map(i =>
          i.key === key ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { key, product, quantity: Math.min(quantity, stock), customization, unitPrice }];
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems(prev => prev.filter(i => i.key !== key));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.key !== key));
    } else {
      setItems(prev => prev.map(i => (i.key === key ? { ...i, quantity } : i)));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};
