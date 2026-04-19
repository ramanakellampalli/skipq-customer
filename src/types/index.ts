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
  vendor: { id: string; name: string };
  state: { orderStatus: OrderStatus; paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED' };
  pricing: {
    subtotal: number;
    tax: { cgst: number; sgst: number; igst: number; totalTax: number };
    fees: { platformFee: number; paymentTerminalFee: number; totalServiceFee: number };
    totalAmount: number;
  };
  timeline: { createdAt: string; estimatedReadyAt: string };
  items: OrderItem[];
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}
