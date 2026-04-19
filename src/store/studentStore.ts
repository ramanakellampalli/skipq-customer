import { create } from 'zustand';
import { Vendor, Order } from '../types';

interface StudentState {
  vendors: Vendor[];
  activeOrder: Order | null;
  pastOrders: Order[];
  isSynced: boolean;
  setSync: (data: { vendors: Vendor[]; activeOrder: Order | null; pastOrders: Order[] }) => void;
  setActiveOrder: (order: Order) => void;
  completeActiveOrder: () => void;
  reset: () => void;
}

export const useStudentStore = create<StudentState>(set => ({
  vendors: [],
  activeOrder: null,
  pastOrders: [],
  isSynced: false,

  setSync: ({ vendors, activeOrder, pastOrders }) =>
    set({ vendors, activeOrder, pastOrders, isSynced: true }),

  setActiveOrder: order =>
    set(state => {
      const isPast = ['COMPLETED', 'REJECTED'].includes(order.state.orderStatus);
      if (isPast) {
        return {
          activeOrder: null,
          pastOrders: [order, ...state.pastOrders.filter(o => o.id !== order.id)],
        };
      }
      return { activeOrder: order };
    }),

  completeActiveOrder: () =>
    set(state => ({
      activeOrder: null,
      pastOrders: state.activeOrder
        ? [state.activeOrder, ...state.pastOrders]
        : state.pastOrders,
    })),

  reset: () =>
    set({ vendors: [], activeOrder: null, pastOrders: [], isSynced: false }),
}));
