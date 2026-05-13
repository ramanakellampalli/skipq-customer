import { client } from './client';
import { Vendor, Order, PlaceOrderResponse, StudentMenuResponse, ServiceRequest, ServiceRequestType } from '../types';
import { StudentProfile } from '../store/studentStore';

export interface StudentSyncResponse {
  profile: StudentProfile;
  vendors: Vendor[];
  activeOrder: Order | null;
  pastOrders: Order[];
  vendorImages: Record<string, string[]>;
  serviceRequests: ServiceRequest[];
}

export const api = {
  auth: {
    register: (name: string, email: string, password: string) =>
      client.post<{ message: string }>('/api/v1/auth/register', { name, email, password }),
    login: (email: string, password: string) =>
      client.post<{ token: string; userId: string; name: string; email: string }>('/api/v1/auth/login', { email, password }),
    verifyOtp: (email: string, otp: string) =>
      client.post<{ token: string; userId: string; name: string; email: string }>('/api/v1/auth/verify-otp', { email, code: otp }),
    forgotPassword: (email: string) =>
      client.post('/api/v1/auth/forgot-password', { email, role: 'STUDENT' }),
    resetPassword: (email: string, otp: string, newPassword: string) =>
      client.post('/api/v1/auth/reset-password', { email, role: 'STUDENT', otp, newPassword }),
  },

  support: {
    create: (data: { type: ServiceRequestType; description: string }) =>
      client.post<ServiceRequest>('/api/v1/support', data),
  },

  student: {
    sync: () =>
      client.get<StudentSyncResponse>('/api/v1/student/sync'),
    getMenu: (vendorId: string) =>
      client.get<StudentMenuResponse>(`/api/v1/student/menu/${vendorId}`),
    placeOrder: (vendorId: string, items: { menuItemId: string; variantId?: string; quantity: number }[]) =>
      client.post<PlaceOrderResponse>('/api/v1/student/orders', { vendorId, items }),
    cancelOrder: (orderId: string) =>
      client.post(`/api/v1/orders/${orderId}/cancel`),
    deleteAccount: () =>
      client.delete('/api/v1/student/account'),
    registerDeviceToken: (token: string) =>
      client.put('/api/v1/shared/device-token', { token }),
  },
};
