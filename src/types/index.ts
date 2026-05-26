export type OrderStatus =
  | 'AWAITING_PAYMENT'
  | 'SCHEDULED'
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type OrderType = 'IMMEDIATE' | 'SCHEDULED';

export interface PlaceOrderResponse {
  orderId: string;
  razorpayOrderId: string;
  razorpayAmountPaise: number;
  razorpayKeyId: string;
}

export interface Vendor {
  id: string;
  name: string;
  isOpen: boolean;
  prepTime: number;
  gstRegistered: boolean;
  campusId?: string | null;
  campusName?: string | null;
  city?: string | null;
  phone?: string | null;
  logoUrl?: string;
}

export interface MenuVariant {
  id: string;
  label?: string;
  price: number;
  isAvailable: boolean;
}

export interface MenuItem {
  id: string;
  category?: string;
  name: string;
  description?: string;
  isVeg: boolean;
  isAvailable: boolean;
  displayOrder: number;
  price: number;
  variants: MenuVariant[];
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
  timeline: { createdAt: string; estimatedReadyAt: string; orderType: OrderType; scheduledPickupAt: string | null };
  items: OrderItem[];
}

export interface StudentMenuResponse {
  items: MenuItem[];
}

export type ServiceRequestType =
  | 'REFUND_ISSUE' | 'PAYMENT_ISSUE' | 'ACCOUNT_ISSUE'
  | 'BILLING_ISSUE' | 'TECHNICAL' | 'OTHER';

export type ServiceRequestStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface ServiceRequest {
  id: string;
  type: ServiceRequestType;
  status: ServiceRequestStatus;
  adminResponse: string | null;
  adminRespondedAt: string | null;
  createdAt: string;
}

export interface CartItem {
  variantId?: string;
  menuItemId: string;
  name: string;
  variantLabel?: string;
  category?: string;
  price: number;
  quantity: number;
}
