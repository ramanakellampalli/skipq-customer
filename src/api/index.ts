import { client } from './client';
import { Vendor, MenuItem, Order } from '../types';

export interface StudentSyncResponse {
  vendors: Vendor[];
  activeOrder: Order | null;
  pastOrders: Order[];
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      client.post('/api/v1/auth/login', { email, password }),
    register: (name: string, email: string, password: string) =>
      client.post('/api/v1/auth/register', { name, email, password }),
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
