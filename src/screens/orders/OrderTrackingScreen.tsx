import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated } from 'react-native';
import Ably from 'ably';
import { CheckCircle2, Circle, Clock } from 'lucide-react-native';
import Config from 'react-native-config';
import { useStudentStore } from '../../store/studentStore';
import { colors, font, radius, spacing } from '../../theme';
import { Order, OrderStatus } from '../../types';

const STEPS: { status: OrderStatus; label: string; sublabel: string }[] = [
  { status: 'PENDING',   label: 'Order Placed',      sublabel: 'Waiting for vendor to confirm' },
  { status: 'ACCEPTED',  label: 'Accepted',           sublabel: 'Vendor confirmed your order' },
  { status: 'PREPARING', label: 'Being Prepared',     sublabel: 'Your food is being made' },
  { status: 'READY',     label: 'Ready for Pickup',   sublabel: 'Head to the counter now!' },
  { status: 'COMPLETED', label: 'Completed',          sublabel: 'Enjoy your meal!' },
];

const STATUS_ORDER: OrderStatus[] = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'];

function stepIndex(status: OrderStatus) {
  return STATUS_ORDER.indexOf(status);
}

export default function OrderTrackingScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const setActiveOrder = useStudentStore(state => state.setActiveOrder);
  const order = useStudentStore(state =>
    state.activeOrder?.id === orderId
      ? state.activeOrder
      : state.pastOrders.find(o => o.id === orderId) ?? null
  );

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const isFinal = !order || ['COMPLETED', 'REJECTED'].includes(order.state.orderStatus);
    if (isFinal) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [order?.state.orderStatus, pulseAnim]);

  useEffect(() => {
    const status = order?.state.orderStatus;
    if (status === 'COMPLETED' || status === 'REJECTED') {
      const t = setTimeout(() => navigation.goBack(), 3000);
      return () => clearTimeout(t);
    }
  }, [order?.state.orderStatus, navigation]);

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
  const currentIdx = order ? stepIndex(order.state.orderStatus) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Order #{orderId.slice(0, 8).toUpperCase()}</Text>
        {order && (
          <Text style={styles.vendor}>{order.vendor.name}</Text>
        )}
      </View>

      {isRejected ? (
        <View style={styles.rejectedCard}>
          <Text style={styles.rejectedIcon}>✕</Text>
          <Text style={styles.rejectedTitle}>Order Rejected</Text>
          <Text style={styles.rejectedSub}>
            The vendor couldn't accept your order. You will be refunded shortly.
          </Text>
        </View>
      ) : (
        <View style={styles.tracker}>
          {STEPS.map((step, idx) => {
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            const upcoming = idx > currentIdx;

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
                  {idx < STEPS.length - 1 && (
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
                    <Text style={styles.stepSublabel}>{step.sublabel}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {order?.timeline.estimatedReadyAt && !isRejected && (
        <View style={styles.etaCard}>
          <Clock size={16} color={colors.primary} />
          <Text style={styles.etaText}>
            Ready by{' '}
            {new Date(order.timeline.estimatedReadyAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
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
  title: { fontFamily: font.bold, fontSize: 22, color: colors.white },
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
  stepActive: { color: colors.white },
  stepUpcoming: { color: colors.textSecondary },
  stepSublabel: { fontFamily: font.regular, fontSize: 13, color: colors.textSecondary },
  etaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    backgroundColor: colors.primaryGlow,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
  },
  etaText: { fontFamily: font.semiBold, fontSize: 14, color: colors.primary },
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
  receiptTotal: { fontFamily: font.bold, fontSize: 15, color: colors.white },
});
