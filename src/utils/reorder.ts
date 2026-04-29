import { Order, MenuCategory, MenuItem, MenuVariant } from '../types';

export interface ReorderItem {
  variantId: string;
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

function buildVariantLookup(categories: MenuCategory[], uncategorized: MenuItem[]) {
  const map = new Map<string, { variant: MenuVariant; item: MenuItem }>();
  [...categories.flatMap(c => c.items), ...uncategorized].forEach(item => {
    item.variants.forEach(variant => map.set(variant.id, { variant, item }));
  });
  return map;
}

export function resolveReorderItems(
  order: Order,
  categories: MenuCategory[],
  uncategorized: MenuItem[],
): ReorderResult {
  const lookup = buildVariantLookup(categories, uncategorized);
  const available: ReorderItem[] = [];
  let skippedCount = 0;

  for (const orderItem of order.items) {
    if (!orderItem.variantId) { skippedCount++; continue; }
    const entry = lookup.get(orderItem.variantId);
    if (!entry || !entry.variant.isAvailable || !entry.item.isAvailable) {
      skippedCount++;
      continue;
    }
    available.push({
      variantId: orderItem.variantId,
      menuItemId: orderItem.menuItemId,
      name: orderItem.name,
      variantLabel: orderItem.variantLabel,
      price: entry.variant.price,
      quantity: orderItem.quantity,
    });
  }

  return { available, skippedCount };
}
