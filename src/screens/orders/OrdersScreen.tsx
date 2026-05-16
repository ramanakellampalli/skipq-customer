import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, RefreshControl,
} from 'react-native';
import { ClipboardList, ChevronRight } from 'lucide-react-native';
import { api } from '../../api';
import { colors, font, radius, spacing } from '../../theme';
import { Order } from '../../types';
import { useStudentStore } from '../../store/studentStore';

type Filter = 'today' | 'yesterday' | 'week' | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: '7 days' },
  { key: 'all', label: 'All' },
];

const ACTIVE_STATUS_COLOR: Record<string, string> = {
  SCHEDULED: colors.primary,
  PENDING:   colors.textSecondary,
  ACCEPTED:  colors.info,
  PREPARING: colors.warning,
  READY:     colors.success,
};

const ACTIVE_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  PENDING:   'Pending',
  ACCEPTED:  'Accepted',
  PREPARING: 'Preparing',
  READY:     'Ready!',
};

const VOIDED = new Set(['REJECTED', 'CANCELLED']);

function startOf(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const todayStart = startOf(now);
  const yesterdayStart = todayStart - 86400000;
  const t = date.getTime();
  if (t >= todayStart) return 'Today';
  if (t >= yesterdayStart) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function applyFilter(orders: Order[], filter: Filter): Order[] {
  const now = new Date();
  const todayStart = startOf(now);
  const yesterdayStart = todayStart - 86400000;
  const weekStart = todayStart - 6 * 86400000;

  return orders.filter(o => {
    const t = new Date(o.timeline.createdAt).getTime();
    if (filter === 'today') return t >= todayStart;
    if (filter === 'yesterday') return t >= yesterdayStart && t < todayStart;
    if (filter === 'week') return t >= weekStart;
    return true;
  });
}

export default function OrdersScreen({ navigation }: any) {
  const activeOrder = useStudentStore(state => state.activeOrder);
  const pastOrders = useStudentStore(state => state.pastOrders);
  const setSync = useStudentStore(state => state.setSync);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [visibleCount, setVisibleCount] = useState(10);

  const filtered = useMemo(() => applyFilter(pastOrders, activeFilter), [pastOrders, activeFilter]);

  useEffect(() => { setVisibleCount(10); }, [activeFilter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data } = await api.student.sync();
      setSync(data);
    } finally {
      setIsRefreshing(false);
    }
  }, [setSync]);

  const renderPastOrder = ({ item, index }: { item: Order; index: number }) => {
    const voided = VOIDED.has(item.state.orderStatus);
    const isLast = index === filtered.length - 1;
    return (
      <TouchableOpacity
        style={[styles.row, !isLast && styles.rowBorder]}
        onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
        activeOpacity={0.6}>
        <View style={styles.rowLeft}>
          <Text style={styles.rowVendor}>{item.vendor.name}</Text>
          <View style={styles.rowMeta}>
            <Text style={styles.rowDate}>{formatDate(item.timeline.createdAt)}</Text>
            {voided && <Text style={styles.voidBadge}>VOID</Text>}
          </View>
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.rowAmount, voided && styles.rowAmountVoided]}>
            ₹{item.pricing.totalAmount.toFixed(0)}
          </Text>
          <ChevronRight size={16} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  const hasPastOrders = pastOrders.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <FlatList
        data={[]}
        keyExtractor={() => ''}
        renderItem={null}
        contentContainerStyle={!activeOrder && !hasPastOrders ? styles.emptyContainer : styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>My Orders</Text>
            </View>

            {activeOrder && (
              <TouchableOpacity
                style={styles.activeCard}
                onPress={() => navigation.navigate('OrderTracking', { orderId: activeOrder.id })}
                activeOpacity={0.85}>
                <View style={styles.activeTop}>
                  <View style={styles.activeLive}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>Live</Text>
                  </View>
                  <ChevronRight size={18} color={colors.primary} />
                </View>
                <Text style={styles.activeVendor}>{activeOrder.vendor.name}</Text>
                <Text style={styles.activeItems} numberOfLines={1}>
                  {activeOrder.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                </Text>
                {activeOrder.timeline.orderType === 'SCHEDULED' && activeOrder.timeline.scheduledPickupAt && (
                  <Text style={styles.activePickup}>
                    Pickup at {new Date(activeOrder.timeline.scheduledPickupAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
                <View style={styles.activeFooter}>
                  <Text style={[styles.activeStatus, { color: ACTIVE_STATUS_COLOR[activeOrder.state.orderStatus] }]}>
                    {ACTIVE_STATUS_LABEL[activeOrder.state.orderStatus]}
                  </Text>
                  <Text style={styles.activeTotal}>₹{activeOrder.pricing.totalAmount.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            )}

            {hasPastOrders && (
              <>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>Past Orders</Text>
                </View>
                <View style={styles.filterRow}>
                  {FILTERS.map(f => (
                    <TouchableOpacity
                      key={f.key}
                      style={[styles.pill, activeFilter === f.key && styles.pillActive]}
                      onPress={() => setActiveFilter(f.key)}>
                      <Text style={[styles.pillText, activeFilter === f.key && styles.pillTextActive]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {filtered.length > 0 ? (
                  <>
                    <View style={styles.listCard}>
                      {visible.map((item, index) => renderPastOrder({ item, index }))}
                    </View>
                    {hasMore && (
                      <TouchableOpacity
                        style={styles.loadMoreBtn}
                        onPress={() => setVisibleCount(c => c + 10)}
                        activeOpacity={0.7}>
                        <Text style={styles.loadMoreText}>Load more</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <View style={styles.emptyFiltered}>
                    <Text style={styles.emptyFilteredText}>No orders in this range</Text>
                  </View>
                )}
              </>
            )}

            {!activeOrder && !hasPastOrders && (
              <View style={styles.empty}>
                <ClipboardList size={56} color={colors.border} />
                <Text style={styles.emptyTitle}>No orders yet</Text>
                <Text style={styles.emptySubtitle}>Find a vendor and place your first order</Text>
              </View>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xl },
  emptyContainer: { flex: 1 },
  header: { paddingHorizontal: spacing.md, paddingTop: 56, paddingBottom: spacing.md },
  title: { fontFamily: font.bold, fontSize: 22, color: colors.textPrimary },

  activeCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: spacing.md,
    gap: spacing.xs,
  },
  activeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  activeLive: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  liveText: { fontFamily: font.bold, fontSize: 12, color: colors.primary },
  activeVendor: { fontFamily: font.bold, fontSize: 17, color: colors.textPrimary },
  activeItems: { fontFamily: font.regular, fontSize: 13, color: colors.textSecondary },
  activeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  activeStatus: { fontFamily: font.semiBold, fontSize: 13 },
  activeTotal: { fontFamily: font.bold, fontSize: 15, color: colors.textPrimary },
  activePickup: { fontFamily: font.medium, fontSize: 12, color: colors.primary, marginTop: 2 },

  sectionRow: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  sectionLabel: { fontFamily: font.semiBold, fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontFamily: font.semiBold, fontSize: 12, color: colors.textSecondary },
  pillTextActive: { color: colors.white },

  listCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLeft: { flex: 1, gap: 3 },
  rowVendor: { fontFamily: font.semiBold, fontSize: 15, color: colors.textPrimary },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowDate: { fontFamily: font.regular, fontSize: 12, color: colors.textSecondary },
  voidBadge: {
    fontFamily: font.bold,
    fontSize: 10,
    color: colors.error,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowAmount: { fontFamily: font.semiBold, fontSize: 15, color: colors.textPrimary },
  rowAmountVoided: { textDecorationLine: 'line-through', color: colors.textSecondary },

  loadMoreBtn: { alignItems: 'center', paddingVertical: spacing.md },
  loadMoreText: { fontFamily: font.semiBold, fontSize: 14, color: colors.primary },
  emptyFiltered: { paddingVertical: spacing.lg, alignItems: 'center' },
  emptyFilteredText: { fontFamily: font.regular, fontSize: 14, color: colors.textSecondary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: spacing.sm },
  emptyTitle: { fontFamily: font.semiBold, fontSize: 18, color: colors.textPrimary },
  emptySubtitle: { fontFamily: font.regular, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});
