import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Ably from 'ably';
import { CheckCircle2, Circle } from 'lucide-react-native';
import Config from 'react-native-config';
import { api } from '../../api';
import { useStudentStore } from '../../store/studentStore';
import { colors, font, radius, spacing } from '../../theme';
import { Order, OrderStatus } from '../../types';

const IMMEDIATE_STEPS: { status: OrderStatus; label: string; sublabel: string }[] = [
  { status: 'AWAITING_PAYMENT', label: 'Confirming Payment', sublabel: 'Verifying your payment…' },
  { status: 'PENDING',          label: 'Order Placed',       sublabel: 'Waiting for vendor to confirm' },
  { status: 'ACCEPTED',         label: 'Accepted',           sublabel: 'Vendor confirmed your order' },
  { status: 'PREPARING',        label: 'Being Prepared',     sublabel: 'Your food is being made' },
  { status: 'READY',            label: 'Ready for Pickup',   sublabel: 'Head to the counter now!' },
  { status: 'COMPLETED',        label: 'Completed',          sublabel: 'Enjoy your meal!' },
];

const SCHEDULED_STEPS: { status: OrderStatus; label: string; sublabel: string }[] = [
  { status: 'AWAITING_PAYMENT', label: 'Confirming Payment', sublabel: 'Verifying your payment…' },
  { status: 'SCHEDULED',        label: 'Order Scheduled',    sublabel: 'We\'ll notify the vendor at pickup time' },
  { status: 'PENDING',          label: 'Sent to Vendor',     sublabel: 'Vendor is being notified' },
  { status: 'ACCEPTED',         label: 'Accepted',           sublabel: 'Vendor confirmed your order' },
  { status: 'PREPARING',        label: 'Being Prepared',     sublabel: 'Your food is being made' },
  { status: 'READY',            label: 'Ready for Pickup',   sublabel: 'Head to the counter now!' },
  { status: 'COMPLETED',        label: 'Completed',          sublabel: 'Enjoy your meal!' },
];

const IMMEDIATE_ORDER: OrderStatus[] = ['AWAITING_PAYMENT', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'];
const SCHEDULED_ORDER: OrderStatus[] = ['AWAITING_PAYMENT', 'SCHEDULED', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'];

export default function OrderTrackingScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const setActiveOrder = useStudentStore(state => state.setActiveOrder);
  const order = useStudentStore(state =>
    state.activeOrder?.id === orderId
      ? state.activeOrder
      : state.pastOrders.find(o => o.id === orderId) ?? null
  );

  const [cancelling, setCancelling] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const orderStatus = order?.state.orderStatus;
  const isScheduledOrder = order?.timeline.orderType === 'SCHEDULED';
  const steps = isScheduledOrder ? SCHEDULED_STEPS : IMMEDIATE_STEPS;
  const statusOrder = isScheduledOrder ? SCHEDULED_ORDER : IMMEDIATE_ORDER;
  const canCancel = orderStatus === 'PENDING' || orderStatus === 'SCHEDULED';

  const handleCancel = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure? A full refund will be initiated.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              await api.student.cancelOrder(orderId);
            } catch {
              Alert.alert('Error', 'Could not cancel the order. Please try again.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    const isFinal = !orderStatus || ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(orderStatus);
    if (isFinal) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [orderStatus, pulseAnim]);

  useEffect(() => {
    const status = orderStatus;
    if (status === 'COMPLETED' || status === 'REJECTED' || status === 'CANCELLED') {
      const t = setTimeout(() => navigation.goBack(), 3000);
      return () => clearTimeout(t);
    }
  }, [orderStatus, navigation]);

  useEffect(() => {
    if (order) return;
    api.student.getOrder(orderId)
      .then(res => setActiveOrder(res.data))
      .catch(() => {});
  }, [orderId, order, setActiveOrder]);

  useEffect(() => {
    if (!orderId || !Config.ABLY_API_KEY) return;
    const client = new Ably.Realtime({ key: Config.ABLY_API_KEY, closeOnUnload: false });
    const channel = client.channels.get(`order:${orderId}`);
    channel.subscribe('status', msg => {
      const updated: Order = JSON.parse(msg.data);
      setActiveOrder(updated);
    });
    return () => { channel.unsubscribe(); client.close(); };
  }, [orderId, setActiveOrder]);

  const isRejected = order?.state.orderStatus === 'REJECTED';
  const isCancelled = order?.state.orderStatus === 'CANCELLED';
  const currentIdx = order ? statusOrder.indexOf(order.state.orderStatus) : 0;
  const pickupTime = order?.timeline.scheduledPickupAt
    ? new Date(order.timeline.scheduledPickupAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Order #{orderId.slice(0, 8).toUpperCase()}</Text>
        {order && (
          <Text style={styles.vendor}>{order.vendor.name}</Text>
        )}
      </View>

      {isCancelled ? (
        <View style={styles.cancelledCard}>
          <Text style={styles.rejectedIcon}>✕</Text>
          <Text style={styles.cancelledTitle}>Order Cancelled</Text>
          <Text style={styles.rejectedSub}>
            Your order has been cancelled. A full refund has been initiated.
          </Text>
        </View>
      ) : isRejected ? (
        <View style={styles.rejectedCard}>
          <Text style={styles.rejectedIcon}>✕</Text>
          <Text style={styles.rejectedTitle}>Order Rejected</Text>
          <Text style={styles.rejectedSub}>
            The vendor couldn't accept your order. You will be refunded shortly.
          </Text>
        </View>
      ) : (
        <View style={styles.tracker}>
          {steps.map((step, idx) => {
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            const upcoming = idx > currentIdx;
            const sublabel = step.status === 'SCHEDULED' && pickupTime
              ? `Pickup scheduled for ${pickupTime}`
              : step.sublabel;

            return (
              <View key={step.status} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  {done ? (
                    <CheckCircle2 size={24} color={colors.success} />
                  ) : active ? (
                    <Animated.View style={[styles.activeDot, { transform: [{ scale: pulseAnim }] }]}>
                      <View style={styles.activeDotInner} />
                    </Animated.View>
                  ) : (
                    <Circle size={24} color={colors.border} />
                  )}
                  {idx < steps.length - 1 && (
                    <View style={[styles.connector, done && styles.connectorDone]} />
                  )}
                </View>

                <View style={styles.stepContent}>
                  <Text style={[
                    styles.stepLabel,
                    done && styles.stepDone,
                    active && styles.stepActive,
                    upcoming && styles.stepUpcoming,
                  ]}>
                    {step.label}
                  </Text>
                  {(done || active) && (
                    <Text style={styles.stepSublabel}>{sublabel}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Text style={styles.cancelNote}>Orders can only be cancelled before the vendor accepts</Text>

      {canCancel && (
        <TouchableOpacity
          style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
          onPress={handleCancel}
          disabled={cancelling}
          activeOpacity={0.8}>
          {cancelling
            ? <ActivityIndicator color={colors.error} />
            : <Text style={styles.cancelBtnText}>Cancel Order</Text>}
        </TouchableOpacity>
      )}


      {order?.state.orderStatus === 'READY' && (
        <View style={styles.readyBanner}>
          <Text style={styles.readyText}>🎉 Your order is ready! Head to the counter.</Text>
        </View>
      )}

      {order && (
        <View style={styles.receiptCard}>
          <Text style={styles.receiptTitle}>Order Summary</Text>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Subtotal</Text>
            <Text style={styles.receiptValue}>₹{order.pricing.subtotal.toFixed(2)}</Text>
          </View>

          {order.pricing.tax.totalTax > 0 && (
            <>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>CGST (2.5%)</Text>
                <Text style={styles.receiptValue}>₹{order.pricing.tax.cgst.toFixed(2)}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>SGST (2.5%)</Text>
                <Text style={styles.receiptValue}>₹{order.pricing.tax.sgst.toFixed(2)}</Text>
              </View>
              {order.pricing.tax.igst > 0 && (
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>IGST (5%)</Text>
                  <Text style={styles.receiptValue}>₹{order.pricing.tax.igst.toFixed(2)}</Text>
                </View>
              )}
            </>
          )}

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Platform fee (3%)</Text>
            <Text style={styles.receiptValue}>₹{order.pricing.fees.platformFee.toFixed(2)}</Text>
          </View>

          <View style={styles.receiptDivider} />
          <View style={styles.receiptRow}>
            <Text style={styles.receiptTotal}>Total</Text>
            <Text style={styles.receiptTotal}>₹{order.pricing.totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: 56,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontFamily: font.bold, fontSize: 22, color: colors.textPrimary },
  vendor: { fontFamily: font.regular, fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  tracker: { padding: spacing.lg, gap: 0 },
  stepRow: { flexDirection: 'row', gap: spacing.md },
  stepLeft: { alignItems: 'center', width: 24 },
  connector: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 4, minHeight: 32 },
  connectorDone: { backgroundColor: colors.success },
  activeDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,107,0,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  activeDotInner: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.primary,
  },
  stepContent: { flex: 1, paddingBottom: spacing.lg, gap: 3 },
  stepLabel: { fontFamily: font.semiBold, fontSize: 15 },
  stepDone: { color: colors.success },
  stepActive: { color: colors.primary },
  stepUpcoming: { color: colors.textSecondary },
  stepSublabel: { fontFamily: font.regular, fontSize: 13, color: colors.textSecondary },
  readyBanner: {
    margin: spacing.md,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.success,
    padding: spacing.md,
    alignItems: 'center',
  },
  readyText: { fontFamily: font.semiBold, fontSize: 15, color: colors.success, textAlign: 'center' },
  rejectedCard: {
    margin: spacing.lg,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  rejectedIcon: { fontSize: 40 },
  rejectedTitle: { fontFamily: font.bold, fontSize: 20, color: colors.error },
  rejectedSub: { fontFamily: font.regular, fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  receiptCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  receiptTitle: { fontFamily: font.semiBold, fontSize: 14, color: colors.textSecondary, marginBottom: 2 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between' },
  receiptLabel: { fontFamily: font.regular, fontSize: 14, color: colors.textSecondary },
  receiptValue: { fontFamily: font.medium, fontSize: 14, color: colors.textSecondary },
  receiptDivider: { height: 1, backgroundColor: colors.border },
  receiptTotal: { fontFamily: font.bold, fontSize: 15, color: colors.textPrimary },
  cancelBtn: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnDisabled: { opacity: 0.5 },
  cancelBtnText: { fontFamily: font.semiBold, fontSize: 15, color: colors.error },
  cancelNote: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    opacity: 0.7,
  },
  cancelledCard: {
    margin: spacing.lg,
    backgroundColor: 'rgba(107,114,128,0.1)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  cancelledTitle: { fontFamily: font.bold, fontSize: 20, color: colors.textSecondary },
});
