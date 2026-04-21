import { client } from './client';
import { Vendor, MenuItem, Order, StudentMenuResponse } from '../types';
import { StudentProfile } from '../store/studentStore';

export interface StudentSyncResponse {
  profile: StudentProfile;
  vendors: Vendor[];
  activeOrder: Order | null;
  pastOrders: Order[];
}

export const api = {
  auth: {
    register: (name: string, email: string, password: string) =>
      client.post<{ message: string }>('/api/v1/auth/register', { name, email, password }),
    login: (email: string, password: string) =>
      client.post<{ token: string; userId: string; name: string; email: string }>('/api/v1/auth/login', { email, password }),
    verifyOtp: (email: string, otp: string) =>
      client.post<{ token: string; userId: string; name: string; email: string }>('/api/v1/auth/verify-otp', { email, code: otp }),
  },

  student: {
    sync: () =>
      client.get<StudentSyncResponse>('/api/v1/student/sync'),
    getMenu: (vendorId: string) =>
      client.get<StudentMenuResponse>(`/api/v1/student/menu/${vendorId}`),
    placeOrder: (vendorId: string, items: { variantId: string; quantity: number }[]) =>
      client.post<Order>('/api/v1/student/orders', { vendorId, items }),
    deleteAccount: () =>
      client.delete('/api/v1/student/account'),
  },
};
