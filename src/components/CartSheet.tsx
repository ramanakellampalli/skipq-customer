import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  FlatList, Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react-native';
import { api } from '../api';
import { useCartStore } from '../store/cartStore';
import { useStudentStore } from '../store/studentStore';
import { colors, font, radius, spacing } from '../theme';
import { CartItem } from '../types';
import OrderSuccessOverlay from './OrderSuccessOverlay';

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const setActiveOrder = useStudentStore(state => state.setActiveOrder);

  // TODO: replace with vendor.gstRegistered from backend when integrated
  const gstRegistered = false;

  const platformFee = total * 0.05;
  const cgst = gstRegistered ? total * 0.025 : 0;
  const sgst = gstRegistered ? total * 0.025 : 0;
  const grandTotal = total + platformFee + cgst + sgst;

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    try {
      setLoading(true);
      const { data } = await api.student.placeOrder(
        vendorId,
        items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
      );
      clear();
      setActiveOrder(data);
      setPendingOrderId(data.id);
      setShowSuccess(true);
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
    <Modal visible={visible || showSuccess} animationType="slide" transparent={false} onRequestClose={onClose}>
      <OrderSuccessOverlay
        visible={showSuccess}
        onDone={() => {
          setShowSuccess(false);
          if (pendingOrderId) onOrderPlaced(pendingOrderId);
        }}
      />
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ShoppingBag size={18} color={colors.primary} />
            <Text style={styles.headerTitle}>Your Order</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
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
            />

            <View style={styles.footer}>
              <View style={styles.pricingRows}>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Subtotal</Text>
                  <Text style={styles.pricingValue}>₹{total.toFixed(2)}</Text>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Convenience fee (5%)</Text>
                  <Text style={styles.pricingValue}>₹{platformFee.toFixed(2)}</Text>
                </View>
                {gstRegistered && (
                  <>
                    <View style={styles.pricingRow}>
                      <Text style={styles.pricingLabel}>CGST (2.5%)</Text>
                      <Text style={styles.pricingValue}>₹{cgst.toFixed(2)}</Text>
                    </View>
                    <View style={styles.pricingRow}>
                      <Text style={styles.pricingLabel}>SGST (2.5%)</Text>
                      <Text style={styles.pricingValue}>₹{sgst.toFixed(2)}</Text>
                    </View>
                  </>
                )}
                <View style={styles.divider} />
                <View style={styles.pricingRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.placeBtn, loading && styles.placeBtnDisabled]}
                onPress={handlePlaceOrder}
                disabled={loading}
                activeOpacity={0.85}>
                {loading
                  ? <ActivityIndicator color={colors.white} />
                  : <Text style={styles.placeBtnText}>Place Order · ₹{grandTotal.toFixed(2)}</Text>
                }
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headerTitle: { fontFamily: font.bold, fontSize: 18, color: colors.white },
  closeBtn: {
    width: 36, height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyCart: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: font.regular, fontSize: 15, color: colors.textSecondary },
  itemList: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
    paddingBottom: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  pricingRows: { gap: spacing.sm },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pricingLabel: { fontFamily: font.regular, fontSize: 14, color: colors.textSecondary },
  pricingValue: { fontFamily: font.medium, fontSize: 14, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.border },
  totalLabel: { fontFamily: font.semiBold, fontSize: 15, color: colors.white },
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
