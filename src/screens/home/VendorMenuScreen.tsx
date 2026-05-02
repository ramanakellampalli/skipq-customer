import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  StatusBar, Alert, RefreshControl, Vibration, Modal,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { ArrowLeft, Plus, Minus, ShoppingCart, X } from 'lucide-react-native';
import { api } from '../../api';
import { colors, font, radius, spacing } from '../../theme';
import { MenuItem, MenuVariant, Order } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { useStudentStore } from '../../store/studentStore';
import CartSheet from '../../components/CartSheet';
import ImageCarousel from '../../components/ImageCarousel';
import ReorderCard from '../../components/ReorderCard';
import Skeleton from '../../components/Skeleton';
import { getRecentVendorOrders, resolveReorderItems } from '../../utils/reorder';

const CART_BAR_HEIGHT = 80;

// ─── Variant picker sheet ─────────────────────────────────────────────────────

interface VariantPickerProps {
  item: MenuItem | null;
  vendorId: string;
  vendorName: string;
  onClose: () => void;
}

function VariantPicker({ item, vendorId, vendorName, onClose }: VariantPickerProps) {
  const addItem = useCartStore(s => s.addItem);
  const cartItems = useCartStore(s => s.items);
  const incrementItem = useCartStore(s => s.incrementItem);
  const decrementItem = useCartStore(s => s.decrementItem);

  if (!item) return null;

  const getQty = (variantId: string) =>
    cartItems.find(i => i.variantId === variantId)?.quantity ?? 0;

  const handleAdd = (variant: MenuVariant) => {
    const result = addItem(vendorId, vendorName, {
      variantId: variant.id,
      menuItemId: item.id,
      name: item.name,
      variantLabel: variant.label,
      price: variant.price,
    });

    if (result === 'switch_required') {
      Alert.alert(
        'Start new cart?',
        `Your cart has items from ${useCartStore.getState().vendorName}. Clear it to order from ${vendorName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear & Switch',
            style: 'destructive',
            onPress: () => {
              useCartStore.getState().clear();
              addItem(vendorId, vendorName, {
                variantId: variant.id,
                menuItemId: item.id,
                name: item.name,
                variantLabel: variant.label,
                price: variant.price,
              });
              Vibration.vibrate(40);
            },
          },
        ],
      );
    } else {
      Vibration.vibrate(40);
    }
  };

  return (
    <Modal visible={!!item} transparent animationType="slide">
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.header}>
            <View style={pickerStyles.headerInfo}>
              <View style={pickerStyles.titleRow}>
                {/* eslint-disable-next-line react-native/no-inline-styles */}
                <View style={[pickerStyles.vegDot, { backgroundColor: item.isVeg ? colors.success : '#e53935' }]} />
                <Text style={pickerStyles.itemName}>{item.name}</Text>
              </View>
              {item.description ? (
                <Text style={pickerStyles.itemDesc}>{item.description}</Text>
              ) : null}
            </View>
            <TouchableOpacity style={pickerStyles.closeBtn} onPress={onClose}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {item.variants.filter(v => v.isAvailable).map(variant => {
              const qty = getQty(variant.id);
              return (
                <View key={variant.id} style={pickerStyles.variantRow}>
                  <View style={pickerStyles.variantInfo}>
                    <Text style={pickerStyles.variantLabel}>{variant.label || 'Regular'}</Text>
                    <Text style={pickerStyles.variantPrice}>₹{variant.price.toFixed(2)}</Text>
                  </View>
                  {qty === 0 ? (
                    <TouchableOpacity style={pickerStyles.addBtn} onPress={() => handleAdd(variant)}>
                      <Plus size={16} color={colors.white} />
                      <Text style={pickerStyles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={pickerStyles.qtyControl}>
                      <TouchableOpacity style={pickerStyles.qtyBtn} onPress={() => decrementItem(variant.id)}>
                        <Minus size={14} color={colors.primary} />
                      </TouchableOpacity>
                      <Text style={pickerStyles.qtyText}>{qty}</Text>
                      <TouchableOpacity style={pickerStyles.qtyBtn} onPress={() => incrementItem(variant.id)}>
                        <Plus size={14} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type Section = { title: string; key: string; data: MenuItem[] };

export default function VendorMenuScreen({ route, navigation }: any) {
  const { vendor } = route.params;
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const [pickerItem, setPickerItem] = useState<MenuItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');

  const sectionListRef = useRef<SectionList<MenuItem, Section>>(null);
  const tabScrollRef = useRef<ScrollView>(null);

  const addItem = useCartStore(s => s.addItem);
  const incrementItem = useCartStore(s => s.incrementItem);
  const decrementItem = useCartStore(s => s.decrementItem);
  const cartItems = useCartStore(s => s.items);
  const itemCount = useCartStore(s => s.itemCount());
  const total = useCartStore(s => s.total());
  const cartVendorId = useCartStore(s => s.vendorId);
  const vendorImages  = useStudentStore(s => s.vendorImages);
  const pastOrders    = useStudentStore(s => s.pastOrders);
  const carouselImages = vendorImages[vendor.id] ?? [];

  const recentOrders = useMemo(
    () => getRecentVendorOrders(pastOrders, vendor.id, 2),
    [pastOrders, vendor.id],
  );

  const cartBarY = useSharedValue(CART_BAR_HEIGHT + 40);
  const cartBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cartBarY.value }],
  }));

  const showCartBar = itemCount > 0 && cartVendorId === vendor.id;

  useEffect(() => {
    cartBarY.value = withSpring(showCartBar ? 0 : CART_BAR_HEIGHT + 40, { damping: 16, stiffness: 160 });
  }, [showCartBar, cartBarY]);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await api.student.getMenu(vendor.id);
      setItems(res.data.items);
      const firstCategory = res.data.items[0]?.category ?? 'Other';
      setActiveTab(firstCategory);
    } finally {
      setLoading(false);
    }
  }, [vendor.id]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await api.student.getMenu(vendor.id);
      setItems(res.data.items);
    } finally {
      setIsRefreshing(false);
    }
  }, [vendor.id]);

  const sections: Section[] = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of items) {
      const key = item.category || 'Other';
      const group = map.get(key) ?? [];
      group.push(item);
      map.set(key, group);
    }
    return [...map.entries()].map(([title, data]) => ({ title, key: title, data }));
  }, [items]);

  const handleTabPress = (key: string, index: number) => {
    setActiveTab(key);
    sectionListRef.current?.scrollToLocation({ sectionIndex: index, itemIndex: 0, animated: true, viewOffset: 0 });
  };

  const getVariantQty = (variantId: string) =>
    cartItems.find(i => i.variantId === variantId)?.quantity ?? 0;

  const getSimpleItemQty = (menuItemId: string) =>
    cartItems.find(i => !i.variantId && i.menuItemId === menuItemId)?.quantity ?? 0;

  const getItemTotalQty = (item: MenuItem) => {
    if (item.variants.length === 0) return getSimpleItemQty(item.id);
    return item.variants.reduce((sum, v) => sum + getVariantQty(v.id), 0);
  };

  const doAddItem = (vendorId: string, vendorName: string, payload: Omit<import('../../types').CartItem, 'quantity'>) => {
    const result = addItem(vendorId, vendorName, payload);
    if (result === 'added') {
      Vibration.vibrate(40);
    } else if (result === 'switch_required') {
      Alert.alert(
        'Start new cart?',
        `Your cart has items from ${useCartStore.getState().vendorName}. Clear it to order from ${vendorName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear & Switch',
            style: 'destructive',
            onPress: () => {
              useCartStore.getState().clear();
              addItem(vendorId, vendorName, payload);
              Vibration.vibrate(40);
            },
          },
        ],
      );
    }
  };

  const handleTap = (item: MenuItem) => {
    if (item.variants.length === 0) {
      doAddItem(vendor.id, vendor.name, { menuItemId: item.id, name: item.name, price: item.price });
    } else if (item.variants.length === 1) {
      const variant = item.variants[0];
      doAddItem(vendor.id, vendor.name, { variantId: variant.id, menuItemId: item.id, name: item.name, variantLabel: variant.label, price: variant.price });
    } else {
      setPickerItem(item);
    }
  };

  const handleReorder = useCallback((order: Order) => {
    if (!vendor.isOpen) {
      Alert.alert('Vendor is closed', 'This vendor is not accepting orders right now.');
      return;
    }
    const { available, skippedCount } = resolveReorderItems(order, items);
    if (available.length === 0) {
      Alert.alert('Nothing available', 'None of your previous items are currently on the menu.');
      return;
    }
    const doAdd = () => {
      available.forEach(item => {
        addItem(vendor.id, vendor.name, {
          variantId: item.variantId,
          menuItemId: item.menuItemId,
          name: item.name,
          variantLabel: item.variantLabel,
          price: item.price,
        });
        for (let i = 1; i < item.quantity; i++) incrementItem(item.variantId);
      });
      if (skippedCount > 0) {
        Alert.alert('Some items skipped', `${skippedCount} item${skippedCount > 1 ? 's' : ''} from your previous order ${skippedCount > 1 ? 'are' : 'is'} no longer available and ${skippedCount > 1 ? 'were' : 'was'} skipped.`);
      }
      setCartVisible(true);
    };
    const currentCartVendorId = useCartStore.getState().vendorId;
    if (currentCartVendorId && currentCartVendorId !== vendor.id) {
      Alert.alert(
        'Replace cart?',
        `You have items from another vendor. Clear your cart to reorder from ${vendor.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear & Reorder', style: 'destructive', onPress: () => { useCartStore.getState().clear(); doAdd(); } },
        ],
      );
    } else {
      doAdd();
    }
  }, [vendor, items, addItem, incrementItem]);

  const priceDisplay = (item: MenuItem) => {
    if (item.variants.length === 0) return `₹${item.price.toFixed(2)}`;
    const prices = item.variants.map(v => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `₹${min.toFixed(2)}` : `₹${min.toFixed(2)} – ₹${max.toFixed(2)}`;
  };

  const renderMenuItem = (item: MenuItem) => {
    const unavailable = !item.isAvailable;
    const totalQty = getItemTotalQty(item);
    const hasMultiVariant = item.variants.length > 1;

    return (
      <View key={item.id} style={[styles.itemCard, unavailable && styles.itemUnavailable]}>
        <View style={styles.itemInfo}>
          <View style={styles.itemTitleRow}>
            {/* eslint-disable-next-line react-native/no-inline-styles */}
            <View style={[styles.vegDot, { backgroundColor: item.isVeg ? colors.success : '#e53935' }]} />
            <Text style={[styles.itemName, unavailable && styles.textDimmed]}>{item.name}</Text>
          </View>
          {item.description ? (
            <Text style={[styles.itemDesc, unavailable && styles.textDimmed]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <Text style={[styles.itemPrice, unavailable && styles.textDimmed]}>
            {unavailable ? 'Unavailable' : priceDisplay(item)}
          </Text>
        </View>

        {!unavailable && (
          totalQty === 0 ? (
            <TouchableOpacity style={styles.addBtn} onPress={() => handleTap(item)} activeOpacity={0.8}>
              <Plus size={18} color={colors.white} />
            </TouchableOpacity>
          ) : hasMultiVariant ? (
            <TouchableOpacity style={styles.multiQtyBtn} onPress={() => setPickerItem(item)} activeOpacity={0.8}>
              <Plus size={14} color={colors.primary} />
              <Text style={styles.multiQtyText}>{totalQty}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyControl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => decrementItem(item.variants.length === 0 ? item.id : item.variants[0].id)}>
                <Minus size={14} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{totalQty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => incrementItem(item.variants.length === 0 ? item.id : item.variants[0].id)}>
                <Plus size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.vendorName}>{vendor.name}</Text>
          <Text style={styles.vendorMeta}>~{vendor.prepTime} min prep time</Text>
        </View>
        {showCartBar && (
          <TouchableOpacity style={styles.cartIconBtn} onPress={() => setCartVisible(true)}>
            <ShoppingCart size={20} color={colors.textPrimary} />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Category tab bar */}
      {!loading && sections.length > 1 && (
        <View style={styles.tabBarWrapper}>
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarContent}
          >
            {sections.map((section, index) => {
              const isActive = activeTab === section.key;
              return (
                <TouchableOpacity
                  key={section.key}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => handleTabPress(section.key, index)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {section.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.list}>
          {[1, 2, 3, 4, 5, 6].map(k => <SkeletonItem key={k} />)}
        </View>
      ) : (
        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            (recentOrders.length > 0 || carouselImages.length > 0) ? (
              <>
                {carouselImages.length > 0 && <ImageCarousel images={carouselImages} />}
                {recentOrders.length > 0 && (
                  <View style={styles.reorderSection}>
                    <Text style={styles.reorderLabel}>Order Again</Text>
                    <View style={styles.reorderGrid}>
                      {recentOrders.map(order => (
                        <ReorderCard key={order.id} order={order} onReorder={() => handleReorder(order)} />
                      ))}
                      {recentOrders.length === 1 && <View style={styles.reorderSpacer} />}
                    </View>
                  </View>
                )}
              </>
            ) : null
          }
          renderItem={({ item }) => renderMenuItem(item)}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          onViewableItemsChanged={({ viewableItems }) => {
            const first = viewableItems.find(v => v.isViewable && v.section);
            if (first?.section) {
              setActiveTab((first.section as Section).key);
            }
          }}
          viewabilityConfig={{ itemVisiblePercentThreshold: 20 }}
          contentContainerStyle={[styles.list, styles.listContent]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      <Animated.View style={[styles.cartBarWrapper, cartBarStyle]}>
        <TouchableOpacity style={styles.cartBar} onPress={() => setCartVisible(true)} activeOpacity={0.9}>
          <View style={styles.cartBarLeft}>
            <View style={styles.cartCount}>
              <Text style={styles.cartCountText}>{itemCount}</Text>
            </View>
            <Text style={styles.cartBarLabel}>View Cart</Text>
          </View>
          <Text style={styles.cartBarTotal}>₹{(total * 1.05).toFixed(2)}</Text>
        </TouchableOpacity>
      </Animated.View>

      <CartSheet
        visible={cartVisible}
        onClose={() => setCartVisible(false)}
        onOrderPlaced={orderId => {
          setCartVisible(false);
          navigation.navigate('Orders', { screen: 'OrderTracking', params: { orderId } });
        }}
        vendorId={vendor.id}
        gstRegistered={vendor.gstRegistered ?? false}
      />

      <VariantPicker
        item={pickerItem}
        vendorId={vendor.id}
        vendorName={vendor.name}
        onClose={() => setPickerItem(null)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function SkeletonItem() {
  return (
    <View style={[styles.itemCard, { gap: spacing.sm }]}>
      <View style={styles.itemInfo}>
        <Skeleton width="65%" height={16} />
        <Skeleton width={56} height={14} style={styles.skeletonMeta} />
      </View>
      <Skeleton width={36} height={36} borderRadius={radius.sm} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 52,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1 },
  vendorName: { fontFamily: font.bold, fontSize: 18, color: colors.textPrimary },
  vendorMeta: { fontFamily: font.regular, fontSize: 13, color: colors.textSecondary },
  cartIconBtn: { padding: 8, position: 'relative' },
  cartBadge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: colors.primary, borderRadius: radius.full,
    width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { fontFamily: font.bold, fontSize: 10, color: colors.white },
  tabBarWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBarContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontFamily: font.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  list: { padding: spacing.md, gap: spacing.sm },
  sectionHeader: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    fontFamily: font.bold,
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  itemUnavailable: { opacity: 0.45 },
  itemInfo: { flex: 1, gap: 3 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vegDot: { width: 9, height: 9, borderRadius: 5, flexShrink: 0 },
  itemName: { fontFamily: font.semiBold, fontSize: 15, color: colors.textPrimary, flex: 1 },
  itemDesc: { fontFamily: font.regular, fontSize: 12, color: colors.textSecondary, marginLeft: 15 },
  itemPrice: { fontFamily: font.bold, fontSize: 14, color: colors.primary, marginLeft: 15 },
  textDimmed: { color: colors.textSecondary },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  multiQtyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  multiQtyText: { fontFamily: font.bold, fontSize: 14, color: colors.primary },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  qtyBtn: { padding: 8 },
  qtyText: { fontFamily: font.bold, fontSize: 14, color: colors.textPrimary, minWidth: 24, textAlign: 'center' },
  cartBarWrapper: {
    position: 'absolute',
    bottom: 24,
    left: spacing.md,
    right: spacing.md,
  },
  cartBar: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  cartBarLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cartCount: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.sm,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  cartCountText: { fontFamily: font.bold, fontSize: 13, color: colors.white },
  cartBarLabel: { fontFamily: font.bold, fontSize: 15, color: colors.white },
  cartBarTotal: { fontFamily: font.bold, fontSize: 15, color: colors.white },
  skeletonMeta: { marginTop: 6 },
  listContent: { paddingBottom: 110 },
  reorderSection: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  reorderLabel: {
    fontFamily: font.bold,
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  reorderGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  reorderSpacer: { flex: 1 },
});

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vegDot: { width: 10, height: 10, borderRadius: 5, marginTop: 2 },
  itemName: { fontFamily: font.bold, fontSize: 17, color: colors.textPrimary },
  itemDesc: { fontFamily: font.regular, fontSize: 13, color: colors.textSecondary, marginTop: 4, marginLeft: 16 },
  closeBtn: {
    width: 32, height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  variantLabel: { fontFamily: font.semiBold, fontSize: 15, color: colors.textPrimary },
  variantPrice: { fontFamily: font.medium, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: { fontFamily: font.bold, fontSize: 14, color: colors.white },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  qtyBtn: { padding: 8 },
  qtyText: { fontFamily: font.bold, fontSize: 14, color: colors.textPrimary, minWidth: 24, textAlign: 'center' },
  headerInfo: { flex: 1 },
  variantInfo: { flex: 1 },
});
