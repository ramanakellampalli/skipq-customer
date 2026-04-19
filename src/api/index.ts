import { client } from './client';
import { Vendor, MenuItem, Order } from '../types';

export interface StudentSyncResponse {
  vendors: Vendor[];
  activeOrder: Order | null;
  pastOrders: Order[];
  campusName?: string;
}

export const api = {
  auth: {
    register: (name: string, email: string, password: string) =>
      client.post<{ message: string }>('/api/v1/auth/register', { name, email, password }),
    login: (email: string, password: string) =>
      client.post<{ token: string; userId: string; name: string; email: string }>('/api/v1/auth/login', { email, password }),
    verifyOtp: (email: string, otp: string) =>
      client.post<{ token: string; userId: string; name: string; email: string }>('/api/v1/auth/verify-otp', { email, otp }),
  },

  student: {
    sync: () =>
      client.get<StudentSyncResponse>('/api/v1/student/sync'),
    getMenu: (vendorId: string) =>
      client.get<MenuItem[]>(`/api/v1/student/menu/${vendorId}`),
    placeOrder: (vendorId: string, items: { menuItemId: string; quantity: number }[]) =>
      client.post<Order>('/api/v1/student/orders', { vendorId, items }),
  },
};
