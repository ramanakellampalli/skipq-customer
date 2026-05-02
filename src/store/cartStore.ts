import { create } from 'zustand';
import { CartItem } from '../types';

const itemKey = (item: Pick<CartItem, 'variantId' | 'menuItemId'>) =>
  item.variantId ?? item.menuItemId;

interface CartState {
  vendorId: string | null;
  vendorName: string;
  items: CartItem[];
  addItem: (vendorId: string, vendorName: string, item: Omit<CartItem, 'quantity'>) => 'added' | 'switch_required';
  incrementItem: (key: string) => void;
  decrementItem: (key: string) => void;
  removeItem: (key: string) => void;
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
    const key = itemKey(item);
    set(s => {
      const exists = s.items.find(i => itemKey(i) === key);
      return {
        vendorId,
        vendorName,
        items: exists
          ? s.items.map(i => itemKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i)
          : [...s.items, { ...item, quantity: 1 }],
      };
    });
    return 'added';
  },

  incrementItem: key =>
    set(s => ({
      items: s.items.map(i => itemKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i),
    })),

  decrementItem: key =>
    set(s => ({
      items: s.items
        .map(i => itemKey(i) === key ? { ...i, quantity: i.quantity - 1 } : i)
        .filter(i => i.quantity > 0),
    })),

  removeItem: key =>
    set(s => ({ items: s.items.filter(i => itemKey(i) !== key) })),

  clear: () => set({ vendorId: null, vendorName: '', items: [] }),

  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
