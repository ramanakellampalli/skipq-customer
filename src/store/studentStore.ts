import { create } from 'zustand';
import { Vendor, Order, ServiceRequest } from '../types';

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  campusId: string | null;
  campusName: string | null;
}

interface StudentState {
  profile: StudentProfile | null;
  vendors: Vendor[];
  activeOrder: Order | null;
  pastOrders: Order[];
  vendorImages: Record<string, string[]>;
  serviceRequests: ServiceRequest[];
  isSynced: boolean;
  setSync: (data: {
    profile: StudentProfile;
    vendors: Vendor[];
    activeOrder: Order | null;
    pastOrders: Order[];
    vendorImages: Record<string, string[]>;
    serviceRequests: ServiceRequest[];
  }) => void;
  addServiceRequest: (sr: ServiceRequest) => void;
  setActiveOrder: (order: Order) => void;
  completeActiveOrder: () => void;
  reset: () => void;
}

export const useStudentStore = create<StudentState>(set => ({
  profile: null,
  vendors: [],
  activeOrder: null,
  pastOrders: [],
  vendorImages: {},
  serviceRequests: [],
  isSynced: false,

  setSync: ({ profile, vendors, activeOrder, pastOrders, vendorImages, serviceRequests }) =>
    set({ profile, vendors, activeOrder, pastOrders, vendorImages, serviceRequests: serviceRequests ?? [], isSynced: true }),

  addServiceRequest: (sr) =>
    set(state => ({ serviceRequests: [sr, ...state.serviceRequests] })),

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
    set({ profile: null, vendors: [], activeOrder: null, pastOrders: [], vendorImages: {}, serviceRequests: [], isSynced: false }),
}));
