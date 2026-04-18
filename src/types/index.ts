export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'REJECTED';

export interface Vendor {
  id: string;
  name: string;
  isOpen: boolean;
  prepTime: number;
  gstRegistered: boolean;
}

export interface MenuItem {
  id: string;
  vendorId: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  vendorId: string;
  vendorName: string;
  status: OrderStatus;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  items: OrderItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  taxAmount: number;
  platformFee: number;
  paymentTerminalFee: number;
  totalServiceFee: number;
  totalAmount: number;
  estimatedReadyAt: string;
  createdAt: string;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}
