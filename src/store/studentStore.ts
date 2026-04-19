import { create } from 'zustand';
import { Vendor, Order } from '../types';

interface StudentState {
  vendors: Vendor[];
  activeOrder: Order | null;
  pastOrders: Order[];
  campusName: string | null;
  isSynced: boolean;
  setSync: (data: { vendors: Vendor[]; activeOrder: Order | null; pastOrders: Order[]; campusName?: string }) => void;
  setActiveOrder: (order: Order) => void;
  completeActiveOrder: () => void;
  reset: () => void;
}

export const useStudentStore = create<StudentState>(set => ({
  vendors: [],
  activeOrder: null,
  pastOrders: [],
  campusName: null,
  isSynced: false,

  setSync: ({ vendors, activeOrder, pastOrders, campusName }) =>
    set({ vendors, activeOrder, pastOrders, campusName: campusName ?? null, isSynced: true }),

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
    set({ vendors: [], activeOrder: null, pastOrders: [], campusName: null, isSynced: false }),
}));
