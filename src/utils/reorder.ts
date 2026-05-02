import { Order, MenuItem, MenuVariant } from '../types';

export interface ReorderItem {
  variantId?: string;
  menuItemId: string;
  name: string;
  variantLabel?: string;
  price: number;
  quantity: number;
}

export interface ReorderResult {
  available: ReorderItem[];
  skippedCount: number;
}

export function getRecentVendorOrders(pastOrders: Order[], vendorId: string, limit = 2): Order[] {
  return pastOrders
    .filter(o => o.vendor.id === vendorId && o.state.orderStatus === 'COMPLETED')
    .sort((a, b) => new Date(b.timeline.createdAt).getTime() - new Date(a.timeline.createdAt).getTime())
    .slice(0, limit);
}

function buildVariantLookup(items: MenuItem[]) {
  const map = new Map<string, { variant: MenuVariant; item: MenuItem }>();
  items.forEach(item => {
    item.variants.forEach(variant => map.set(variant.id, { variant, item }));
  });
  return map;
}

function buildItemLookup(items: MenuItem[]) {
  const map = new Map<string, MenuItem>();
  items.forEach(item => map.set(item.id, item));
  return map;
}

export function resolveReorderItems(order: Order, items: MenuItem[]): ReorderResult {
  const variantLookup = buildVariantLookup(items);
  const itemLookup = buildItemLookup(items);
  const available: ReorderItem[] = [];
  let skippedCount = 0;

  for (const orderItem of order.items) {
    if (orderItem.variantId) {
      const entry = variantLookup.get(orderItem.variantId);
      if (!entry || !entry.item.isAvailable) { skippedCount++; continue; }
      available.push({
        variantId: orderItem.variantId,
        menuItemId: orderItem.menuItemId,
        name: orderItem.name,
        variantLabel: orderItem.variantLabel,
        price: entry.variant.price,
        quantity: orderItem.quantity,
      });
    } else {
      const item = itemLookup.get(orderItem.menuItemId);
      if (!item || !item.isAvailable) { skippedCount++; continue; }
      available.push({
        menuItemId: orderItem.menuItemId,
        name: orderItem.name,
        price: item.price,
        quantity: orderItem.quantity,
      });
    }
  }

  return { available, skippedCount };
}
