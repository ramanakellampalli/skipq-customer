import { create } from 'zustand';
import { CartItem } from '../types';

interface CartState {
  vendorId: string | null;
  vendorName: string;
  items: CartItem[];
  addItem: (vendorId: string, vendorName: string, item: Omit<CartItem, 'quantity'>) => 'added' | 'switch_required';
  incrementItem: (menuItemId: string) => void;
  decrementItem: (menuItemId: string) => void;
  removeItem: (menuItemId: string) => void;
  clear: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  vendorId: null,
  vendorName: '',
  items: [],

  addItem: (vendorId, vendorName, item) => {
    const state = get();
    if (state.vendorId && state.vendorId !== vendorId && state.items.length > 0) {
      return 'switch_required';
    }
    set(s => {
      const exists = s.items.find(i => i.menuItemId === item.menuItemId);
      return {
        vendorId,
        vendorName,
        items: exists
          ? s.items.map(i => i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i)
          : [...s.items, { ...item, quantity: 1 }],
      };
    });
    return 'added';
  },

  incrementItem: menuItemId =>
    set(s => ({
      items: s.items.map(i =>
        i.menuItemId === menuItemId ? { ...i, quantity: i.quantity + 1 } : i,
      ),
    })),

  decrementItem: menuItemId =>
    set(s => ({
      items: s.items
        .map(i => i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i)
        .filter(i => i.quantity > 0),
    })),

  removeItem: menuItemId =>
    set(s => ({ items: s.items.filter(i => i.menuItemId !== menuItemId) })),

  clear: () => set({ vendorId: null, vendorName: '', items: [] }),

  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
