import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, Alert, RefreshControl, Vibration,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { ArrowLeft, Plus, Minus, ShoppingCart } from 'lucide-react-native';
import { api } from '../../api';
import { colors, font, radius, spacing } from '../../theme';
import { MenuItem } from '../../types';
import { useCartStore } from '../../store/cartStore';
import CartSheet from '../../components/CartSheet';
import Skeleton from '../../components/Skeleton';

const CART_BAR_HEIGHT = 80;

export default function VendorMenuScreen({ route, navigation }: any) {
  const { vendor } = route.params;
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);

  const addItem = useCartStore(state => state.addItem);
  const incrementItem = useCartStore(state => state.incrementItem);
  const decrementItem = useCartStore(state => state.decrementItem);
  const cartItems = useCartStore(state => state.items);
  const itemCount = useCartStore(state => state.itemCount());
  const total = useCartStore(state => state.total());
  const cartVendorId = useCartStore(state => state.vendorId);

  const cartBarY = useSharedValue(CART_BAR_HEIGHT + 40);
  const cartBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cartBarY.value }],
  }));

  const showCartBar = itemCount > 0 && cartVendorId === vendor.id;

  useEffect(() => {
    cartBarY.value = withSpring(showCartBar ? 0 : CART_BAR_HEIGHT + 40, {
      damping: 16,
      stiffness: 160,
    });
  }, [showCartBar]);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await api.student.getMenu(vendor.id);
      setMenuItems(res.data);
    } finally {
      setLoading(false);
    }
  }, [vendor.id]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await api.student.getMenu(vendor.id);
      setMenuItems(res.data);
    } finally {
      setIsRefreshing(false);
    }
  }, [vendor.id]);

  const getItemQty = (menuItemId: string) =>
    cartItems.find(i => i.menuItemId === menuItemId)?.quantity ?? 0;

  const handleAdd = (item: MenuItem) => {
    const result = addItem(vendor.id, vendor.name, {
      menuItemId: item.id,
      name: item.name,
      price: item.price,
    });

    if (result === 'added') {
      Vibration.vibrate(40);
    } else if (result === 'switch_required') {
      Alert.alert(
        'Start new cart?',
        `Your cart has items from ${useCartStore.getState().vendorName}. Clear it to order from ${vendor.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear & Switch',
            style: 'destructive',
            onPress: () => {
              useCartStore.getState().clear();
              addItem(vendor.id, vendor.name, { menuItemId: item.id, name: item.name, price: item.price });
              Vibration.vibrate(40);
            },
          },
        ],
      );
    }
  };

  const availableItems = menuItems.filter(i => i.isAvailable);
  const unavailableItems = menuItems.filter(i => !i.isAvailable);

  const SkeletonItem = () => (
    <View style={[styles.itemCard, { gap: spacing.sm }]}>
      <View style={styles.itemInfo}>
        <Skeleton width="65%" height={16} />
        <Skeleton width={56} height={14} style={{ marginTop: 6 }} />
      </View>
      <Skeleton width={36} height={36} borderRadius={radius.sm} />
    </View>
  );

  const renderItem = ({ item }: { item: MenuItem }) => {
    const qty = getItemQty(item.id);
    const unavailable = !item.isAvailable;

    return (
      <View style={[styles.itemCard, unavailable && styles.itemUnavailable]}>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, unavailable && styles.textDimmed]}>{item.name}</Text>
          <Text style={[styles.itemPrice, unavailable && styles.textDimmed]}>
            ₹{item.price.toFixed(2)}
          </Text>
          {unavailable && (
            <Text style={styles.unavailableTag}>Unavailable</Text>
          )}
        </View>

        {!unavailable && (
          qty === 0 ? (
            <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(item)} activeOpacity={0.8}>
              <Plus size={18} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyControl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => decrementItem(item.id)}>
                <Minus size={14} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => incrementItem(item.id)}>
                <Plus size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )
        )}
      </View>
    );
  };

  const allItems = [
    ...availableItems,
    ...(unavailableItems.length > 0 ? [{ id: '__divider__', name: '', price: 0, isAvailable: false, vendorId: '' }] : []),
    ...unavailableItems,
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.surface} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.vendorName}>{vendor.name}</Text>
          <Text style={styles.vendorMeta}>~{vendor.prepTime} min prep time</Text>
        </View>
        {showCartBar && (
          <TouchableOpacity style={styles.cartIconBtn} onPress={() => setCartVisible(true)}>
            <ShoppingCart size={20} color={colors.white} />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.list}>
          {[1, 2, 3, 4, 5, 6].map(k => <SkeletonItem key={k} />)}
        </View>
      ) : (
        <FlatList
          data={allItems}
          keyExtractor={item => item.id}
          renderItem={({ item }) =>
            item.id === '__divider__' ? (
              <View style={styles.dividerRow}>
                <Text style={styles.dividerLabel}>Not available right now</Text>
              </View>
            ) : renderItem({ item })
          }
          contentContainerStyle={[styles.list, { paddingBottom: 110 }]}
          showsVerticalScrollIndicator={false}
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
  vendorName: { fontFamily: font.bold, fontSize: 18, color: colors.white },
  vendorMeta: { fontFamily: font.regular, fontSize: 13, color: colors.textSecondary },
  cartIconBtn: { padding: 8, position: 'relative' },
  cartBadge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: colors.primary, borderRadius: radius.full,
    width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { fontFamily: font.bold, fontSize: 10, color: colors.white },
  list: { padding: spacing.md, gap: spacing.sm },
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
  itemUnavailable: { opacity: 0.5 },
  itemInfo: { flex: 1, gap: 3 },
  itemName: { fontFamily: font.semiBold, fontSize: 15, color: colors.textPrimary },
  itemPrice: { fontFamily: font.bold, fontSize: 15, color: colors.primary },
  textDimmed: { color: colors.textSecondary },
  unavailableTag: { fontFamily: font.medium, fontSize: 11, color: colors.error },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
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
  qtyText: { fontFamily: font.bold, fontSize: 14, color: colors.white, minWidth: 24, textAlign: 'center' },
  dividerRow: { paddingVertical: spacing.sm },
  dividerLabel: { fontFamily: font.semiBold, fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
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
});
