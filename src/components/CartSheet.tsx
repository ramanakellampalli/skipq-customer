import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  FlatList, Alert, ActivityIndicator,
} from 'react-native';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react-native';
import { api } from '../api';
import { useCartStore } from '../store/cartStore';
import { colors, font, radius, spacing } from '../theme';
import { CartItem } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onOrderPlaced: (orderId: string) => void;
  vendorId: string;
}

export default function CartSheet({ visible, onClose, onOrderPlaced, vendorId }: Props) {
  const items = useCartStore(state => state.items);
  const incrementItem = useCartStore(state => state.incrementItem);
  const decrementItem = useCartStore(state => state.decrementItem);
  const total = useCartStore(state => state.total());
  const clear = useCartStore(state => state.clear);
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    try {
      setLoading(true);
      const { data } = await api.student.placeOrder(
        vendorId,
        items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
      );
      clear();
      onOrderPlaced(data.id);
    } catch (err: any) {
      Alert.alert('Order Failed', err.response?.data?.message || 'Could not place order. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
      </View>
      <View style={styles.qtyControl}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => decrementItem(item.menuItemId)}>
          <Minus size={14} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => incrementItem(item.menuItemId)}>
          <Plus size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitleRow}>
            <ShoppingBag size={18} color={colors.primary} />
            <Text style={styles.sheetTitle}>Your Order</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyText}>Your cart is empty</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={i => i.menuItemId}
              renderItem={renderItem}
              style={styles.itemList}
              scrollEnabled={items.length > 4}
            />

            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
              </View>

              <TouchableOpacity
                style={[styles.placeBtn, loading && styles.placeBtnDisabled]}
                onPress={handlePlaceOrder}
                disabled={loading}
                activeOpacity={0.85}>
                {loading
                  ? <ActivityIndicator color={colors.white} />
                  : <Text style={styles.placeBtnText}>Place Order · ₹{total.toFixed(2)}</Text>
                }
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: 32,
    maxHeight: '75%',
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sheetTitle: { fontFamily: font.bold, fontSize: 18, color: colors.white },
  emptyCart: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { fontFamily: font.regular, fontSize: 15, color: colors.textSecondary },
  itemList: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  rowInfo: { flex: 1, gap: 2 },
  itemName: { fontFamily: font.medium, fontSize: 14, color: colors.textPrimary },
  itemPrice: { fontFamily: font.semiBold, fontSize: 14, color: colors.primary },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyBtn: { padding: 8 },
  qtyText: { fontFamily: font.bold, fontSize: 13, color: colors.white, minWidth: 22, textAlign: 'center' },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontFamily: font.semiBold, fontSize: 15, color: colors.textSecondary },
  totalValue: { fontFamily: font.bold, fontSize: 20, color: colors.white },
  placeBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  placeBtnDisabled: { opacity: 0.7 },
  placeBtnText: { fontFamily: font.bold, fontSize: 16, color: colors.white },
});
