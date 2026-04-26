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
  campusId?: string;
  campusName?: string;
}

export interface MenuVariant {
  id: string;
  label?: string;
  price: number;
  isAvailable: boolean;
}

export interface MenuItem {
  id: string;
  categoryId?: string;
  name: string;
  description?: string;
  isVeg: boolean;
  isAvailable: boolean;
  displayOrder: number;
  variants: MenuVariant[];
}

export interface MenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  items: MenuItem[];
}

export interface OrderItem {
  menuItemId: string;
  variantId?: string;
  name: string;
  variantLabel?: string;
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

export interface StudentMenuResponse {
  categories: MenuCategory[];
  uncategorized: MenuItem[];
}

export type ServiceRequestType =
  | 'REFUND_ISSUE' | 'PAYMENT_ISSUE' | 'ACCOUNT_ISSUE'
  | 'BILLING_ISSUE' | 'TECHNICAL' | 'OTHER';

export type ServiceRequestStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface ServiceRequest {
  id: string;
  type: ServiceRequestType;
  subject: string;
  status: ServiceRequestStatus;
  adminResponse: string | null;
  adminRespondedAt: string | null;
  createdAt: string;
}

export interface CartItem {
  variantId: string;
  menuItemId: string;
  name: string;
  variantLabel?: string;
  price: number;
  quantity: number;
}
