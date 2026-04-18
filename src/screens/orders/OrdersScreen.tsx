import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, RefreshControl,
} from 'react-native';
import { ClipboardList, ChevronRight } from 'lucide-react-native';
import { api } from '../../api';
import { colors, font, radius, spacing } from '../../theme';
import { Order } from '../../types';
import { useStudentStore } from '../../store/studentStore';
import { timeAgo } from '../../utils/time';

const STATUS_LABEL: Record<string, string> = {
  PENDING:   'Pending',
  ACCEPTED:  'Accepted',
  PREPARING: 'Preparing',
  READY:     'Ready!',
  COMPLETED: 'Completed',
  REJECTED:  'Rejected',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING:   colors.textSecondary,
  ACCEPTED:  colors.info,
  PREPARING: colors.warning,
  READY:     colors.success,
  COMPLETED: colors.textSecondary,
  REJECTED:  colors.error,
};

export default function OrdersScreen({ navigation }: any) {
  const activeOrder = useStudentStore(state => state.activeOrder);
  const pastOrders = useStudentStore(state => state.pastOrders);
  const setSync = useStudentStore(state => state.setSync);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data } = await api.student.sync();
      setSync(data);
    } finally {
      setIsRefreshing(false);
    }
  }, [setSync]);

  const renderPastOrder = ({ item }: { item: Order }) => (
    <View style={styles.pastCard}>
      <View style={styles.pastHeader}>
        <Text style={styles.pastId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
        <Text style={[styles.pastStatus, { color: STATUS_COLOR[item.status] }]}>
          {STATUS_LABEL[item.status]}
        </Text>
      </View>
      <Text style={styles.pastVendor}>{item.vendorName}</Text>
      <Text style={styles.pastItems} numberOfLines={1}>
        {item.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}
      </Text>
      <View style={styles.pastFooter}>
        <Text style={styles.pastTotal}>₹{item.totalAmount.toFixed(2)}</Text>
        <Text style={styles.pastTime}>{timeAgo(item.createdAt)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <FlatList
        data={pastOrders}
        keyExtractor={item => item.id}
        renderItem={renderPastOrder}
        contentContainerStyle={pastOrders.length === 0 && !activeOrder ? styles.emptyContainer : styles.list}
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
                <Text style={styles.activeVendor}>{activeOrder.vendorName}</Text>
                <Text style={styles.activeItems} numberOfLines={1}>
                  {activeOrder.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                </Text>
                <View style={styles.activeFooter}>
                  <Text style={[styles.activeStatus, { color: STATUS_COLOR[activeOrder.status] }]}>
                    {STATUS_LABEL[activeOrder.status]}
                  </Text>
                  <Text style={styles.activeTotal}>₹{activeOrder.totalAmount.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            )}

            {pastOrders.length > 0 && (
              <View style={styles.sectionRow}>
                <Text style={styles.sectionLabel}>Past Orders</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !activeOrder ? (
            <View style={styles.empty}>
              <ClipboardList size={56} color={colors.border} />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>Find a vendor and place your first order</Text>
            </View>
          ) : null
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
  title: { fontFamily: font.bold, fontSize: 22, color: colors.white },
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
  activeVendor: { fontFamily: font.bold, fontSize: 17, color: colors.white },
  activeItems: { fontFamily: font.regular, fontSize: 13, color: colors.textSecondary },
  activeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  activeStatus: { fontFamily: font.semiBold, fontSize: 13 },
  activeTotal: { fontFamily: font.bold, fontSize: 15, color: colors.white },
  sectionRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  sectionLabel: { fontFamily: font.semiBold, fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  pastCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  pastHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pastId: { fontFamily: font.bold, fontSize: 13, color: colors.textSecondary },
  pastStatus: { fontFamily: font.semiBold, fontSize: 12 },
  pastVendor: { fontFamily: font.semiBold, fontSize: 15, color: colors.white },
  pastItems: { fontFamily: font.regular, fontSize: 13, color: colors.textSecondary },
  pastFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  pastTotal: { fontFamily: font.bold, fontSize: 14, color: colors.primary },
  pastTime: { fontFamily: font.regular, fontSize: 12, color: colors.textSecondary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: spacing.sm },
  emptyTitle: { fontFamily: font.semiBold, fontSize: 18, color: colors.textPrimary },
  emptySubtitle: { fontFamily: font.regular, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});
