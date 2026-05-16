import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  FlatList, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Minus, Plus, ShoppingBag, ChevronDown, ChevronUp, Clock } from 'lucide-react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { api } from '../api';
import { useCartStore } from '../store/cartStore';
import { colors, font, radius, spacing } from '../theme';
import { CartItem } from '../types';

const WINDOW_START_H = 10;
const WINDOW_END_H   = 17;
const SLOT_MINUTES   = 15;
const MIN_LEAD_MIN   = 30;

function generateSlots(): Date[] {
  const slots: Date[] = [];
  const d = new Date();
  d.setHours(WINDOW_START_H, 0, 0, 0);
  const end = new Date();
  end.setHours(WINDOW_END_H, 0, 0, 0);
  while (d <= end) {
    slots.push(new Date(d));
    d.setMinutes(d.getMinutes() + SLOT_MINUTES);
  }
  return slots;
}

function isSlotEnabled(slot: Date): boolean {
  const floor = new Date();
  floor.setMinutes(floor.getMinutes() + MIN_LEAD_MIN);
  return slot >= floor;
}

function canScheduleToday(): boolean {
  const cutoff = new Date();
  cutoff.setHours(WINDOW_END_H, 0, 0, 0);
  const floor = new Date();
  floor.setMinutes(floor.getMinutes() + MIN_LEAD_MIN);
  return floor < cutoff;
}

function formatSlot(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${m} ${period}`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onOrderPlaced: (orderId: string) => void;
  vendorId: string;
  gstRegistered: boolean;
}

export default function CartSheet({ visible, onClose, onOrderPlaced, vendorId, gstRegistered }: Props) {
  const items = useCartStore(state => state.items);
  const incrementItem = useCartStore(state => state.incrementItem);
  const decrementItem = useCartStore(state => state.decrementItem);
  const total = useCartStore(state => state.total());
  const clear = useCartStore(state => state.clear);
  const [loading, setLoading] = useState(false);
  const [feeOpen, setFeeOpen] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [slotPickerVisible, setSlotPickerVisible] = useState(false);

  const slots = generateSlots();
  const schedulingAvailable = canScheduleToday();

  const igstApplicable = false; // TODO: derive from vendor/customer state mismatch

  // Tax breakdown — GST splits into CGST 2.5% + SGST 2.5% (intra-state)
  const cgst = gstRegistered ? total * 0.025 : 0;
  const sgst = gstRegistered ? total * 0.025 : 0;
  const igst = igstApplicable ? total * 0.05 : 0;     // inter-state replaces CGST+SGST
  const totalTax = cgst + sgst + igst;

  const platformFee = total * 0.03;
  const totalServiceFee = platformFee;

  const grandTotal = total + cgst + sgst + igst + totalServiceFee;

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    if (isScheduled && !selectedSlot) {
      Alert.alert('Select a pickup time', 'Please choose a time slot before placing a scheduled order.');
      return;
    }
    try {
      setLoading(true);
      const pickupAt = isScheduled && selectedSlot
        ? selectedSlot.toISOString().slice(0, 19)
        : undefined;
      const { data } = await api.student.placeOrder(
        vendorId,
        items.map(i => ({ menuItemId: i.menuItemId, variantId: i.variantId, quantity: i.quantity })),
        pickupAt,
      );

      try {
        await RazorpayCheckout.open({
          description: 'Food Order',
          currency: 'INR',
          key: data.razorpayKeyId,
          amount: data.razorpayAmountPaise,
          name: 'SkipQ',
          order_id: data.razorpayOrderId,

          theme: { color: colors.primary },
        });
      } catch {
        // code 0 = user dismissed the Razorpay sheet
        Alert.alert('Payment Cancelled', 'No charge was made. Your cart is intact.');
        return;
      }

      clear();
      onOrderPlaced(data.orderId);
    } catch (err: any) {
      Alert.alert('Order Failed', err.response?.data?.message || 'Could not place order. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.itemName}>
          {item.name}{item.variantLabel ? ` · ${item.variantLabel}` : ''}
        </Text>
        <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
      </View>
      <View style={styles.qtyControl}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => decrementItem(item.variantId ?? item.menuItemId)}>
          <Minus size={14} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => incrementItem(item.variantId ?? item.menuItemId)}>
          <Plus size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
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
        ) : null}

        {items.length > 0 && (
          <>
            <FlatList
              data={items}
              keyExtractor={i => i.variantId ?? i.menuItemId}
              renderItem={renderItem}
              style={styles.itemList}
            />

            <View style={styles.footer}>
              {/* Subtotal */}
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Subtotal</Text>
                <Text style={styles.pricingValue}>₹{total.toFixed(2)}</Text>
              </View>

              {/* Tax */}
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Tax</Text>
                <Text style={styles.pricingValue}>₹{totalTax.toFixed(2)}</Text>
              </View>
              {!gstRegistered ? (
                <Text style={styles.taxNote}>Vendor is not GST registered — no tax applicable</Text>
              ) : (
              <View style={styles.accordionBody}>
                <View style={styles.pricingRow}>
                  <Text style={styles.subLabel}>CGST (2.5%)</Text>
                  <Text style={styles.subValue}>₹{cgst.toFixed(2)}</Text>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.subLabel}>SGST (2.5%)</Text>
                  <Text style={styles.subValue}>₹{sgst.toFixed(2)}</Text>
                </View>
                {igstApplicable && (
                  <View style={styles.pricingRow}>
                    <Text style={styles.subLabel}>IGST (5%)</Text>
                    <Text style={styles.subValue}>₹{igst.toFixed(2)}</Text>
                  </View>
                )}
              </View>
              )}

              {/* Service fee accordion */}
              <TouchableOpacity style={styles.accordionRow} onPress={() => setFeeOpen(o => !o)} activeOpacity={0.7}>
                <View style={styles.accordionLeft}>
                  {feeOpen
                    ? <ChevronUp size={14} color={colors.textSecondary} />
                    : <ChevronDown size={14} color={colors.textSecondary} />}
                  <Text style={styles.pricingLabel}>Service fee</Text>
                </View>
                <Text style={styles.pricingValue}>₹{totalServiceFee.toFixed(2)}</Text>
              </TouchableOpacity>
              {feeOpen && (
                <View style={styles.accordionBody}>
                  <View style={styles.pricingRow}>
                    <Text style={styles.subLabel}>Platform fee (3%)</Text>
                    <Text style={styles.subValue}>₹{platformFee.toFixed(2)}</Text>
                  </View>
                </View>
              )}

              <View style={styles.divider} />

              {/* Total */}
              <View style={styles.pricingRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
              </View>

              {/* Order type toggle */}
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, !isScheduled && styles.toggleBtnActive]}
                  onPress={() => setIsScheduled(false)}
                  activeOpacity={0.8}>
                  <Text style={[styles.toggleBtnText, !isScheduled && styles.toggleBtnTextActive]}>Order Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, isScheduled && styles.toggleBtnActive, !schedulingAvailable && styles.toggleBtnDisabled]}
                  onPress={() => schedulingAvailable && setIsScheduled(true)}
                  activeOpacity={schedulingAvailable ? 0.8 : 1}>
                  <Clock size={13} color={isScheduled ? colors.white : colors.textSecondary} />
                  <Text style={[styles.toggleBtnText, isScheduled && styles.toggleBtnTextActive, !schedulingAvailable && styles.toggleBtnTextDisabled]}>
                    Schedule
                  </Text>
                </TouchableOpacity>
              </View>

              {!schedulingAvailable && (
                <Text style={styles.scheduleNote}>Scheduling closes at 5 PM</Text>
              )}

              {isScheduled && schedulingAvailable && (
                <>
                  <TouchableOpacity style={styles.slotSelector} onPress={() => setSlotPickerVisible(true)} activeOpacity={0.8}>
                    <Clock size={15} color={colors.primary} />
                    <Text style={[styles.slotSelectorText, !selectedSlot && styles.slotPlaceholder]}>
                      {selectedSlot ? formatSlot(selectedSlot) : 'Select pickup time'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.scheduleNote}>Scheduled pickup available today, 10 AM – 5 PM</Text>
                </>
              )}

              <TouchableOpacity
                style={[styles.placeBtn, loading && styles.placeBtnDisabled]}
                onPress={handlePlaceOrder}
                disabled={loading}
                activeOpacity={0.85}>
                {loading
                  ? <ActivityIndicator color={colors.white} />
                  : <Text style={styles.placeBtnText}>
                      {isScheduled ? 'Schedule Order' : 'Place Order'} · ₹{grandTotal.toFixed(2)}
                    </Text>
                }
              </TouchableOpacity>

              {/* Slot picker modal */}
              <Modal visible={slotPickerVisible} animationType="slide" transparent onRequestClose={() => setSlotPickerVisible(false)}>
                <TouchableOpacity style={styles.slotOverlay} activeOpacity={1} onPress={() => setSlotPickerVisible(false)}>
                  <View style={styles.slotSheet}>
                    <Text style={styles.slotSheetTitle}>Select Pickup Time</Text>
                    <Text style={styles.slotSheetSub}>Today · 10 AM – 5 PM</Text>
                    <FlatList
                      data={slots}
                      keyExtractor={s => s.toISOString()}
                      renderItem={({ item: slot }) => {
                        const enabled = isSlotEnabled(slot);
                        const selected = selectedSlot?.toISOString() === slot.toISOString();
                        return (
                          <TouchableOpacity
                            style={[styles.slotItem, selected && styles.slotItemSelected, !enabled && styles.slotItemDisabled]}
                            onPress={() => { if (enabled) { setSelectedSlot(slot); setSlotPickerVisible(false); } }}
                            activeOpacity={enabled ? 0.8 : 1}>
                            <Text style={[styles.slotItemText, selected && styles.slotItemTextSelected, !enabled && styles.slotItemTextDisabled]}>
                              {formatSlot(slot)}
                            </Text>
                            {!enabled && <Text style={styles.slotUnavailable}>Too soon</Text>}
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
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
  headerTitle: { fontFamily: font.bold, fontSize: 18, color: colors.textPrimary },
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
  qtyText: { fontFamily: font.bold, fontSize: 13, color: colors.textPrimary, minWidth: 22, textAlign: 'center' },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accordionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accordionLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  accordionBody: {
    paddingLeft: 20,
    gap: spacing.xs,
  },
  pricingLabel: { fontFamily: font.regular, fontSize: 14, color: colors.textSecondary },
  pricingValue: { fontFamily: font.medium, fontSize: 14, color: colors.textSecondary },
  subLabel: { fontFamily: font.regular, fontSize: 12, color: colors.textSecondary, opacity: 0.75 },
  taxNote: { fontFamily: font.regular, fontSize: 12, color: colors.textSecondary, opacity: 0.7, paddingLeft: 20, fontStyle: 'italic' },
  subValue: { fontFamily: font.regular, fontSize: 12, color: colors.textSecondary, opacity: 0.75 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  totalLabel: { fontFamily: font.semiBold, fontSize: 15, color: colors.textPrimary },
  totalValue: { fontFamily: font.bold, fontSize: 20, color: colors.textPrimary },
  placeBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: spacing.xs,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  placeBtnDisabled: { opacity: 0.7 },
  placeBtnText: { fontFamily: font.bold, fontSize: 16, color: colors.white },

  // Scheduling
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: radius.sm,
  },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleBtnDisabled: { opacity: 0.4 },
  toggleBtnText: { fontFamily: font.medium, fontSize: 14, color: colors.textSecondary },
  toggleBtnTextActive: { color: colors.white },
  toggleBtnTextDisabled: { color: colors.textSecondary },
  scheduleNote: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.textSecondary,
    opacity: 0.7,
    textAlign: 'center',
  },
  slotSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    backgroundColor: 'rgba(255,107,0,0.05)',
  },
  slotSelectorText: { fontFamily: font.medium, fontSize: 14, color: colors.primary },
  slotPlaceholder: { color: colors.textSecondary, opacity: 0.7 },

  // Slot picker modal
  slotOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  slotSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.lg,
    paddingBottom: 36,
    maxHeight: '70%',
  },
  slotSheetTitle: {
    fontFamily: font.bold,
    fontSize: 17,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  slotSheetSub: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    marginTop: 2,
  },
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  slotItemSelected: { backgroundColor: 'rgba(255,107,0,0.08)' },
  slotItemDisabled: { opacity: 0.35 },
  slotItemText: { fontFamily: font.medium, fontSize: 15, color: colors.textPrimary },
  slotItemTextSelected: { color: colors.primary, fontFamily: font.bold },
  slotItemTextDisabled: { color: colors.textSecondary },
  slotUnavailable: { fontFamily: font.regular, fontSize: 12, color: colors.textSecondary },
});
