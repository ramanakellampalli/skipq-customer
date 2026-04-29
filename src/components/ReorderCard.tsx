import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import { Order } from '../types';
import { colors, font, radius, spacing } from '../theme';

interface Props {
  order: Order;
  onReorder: () => void;
}

const MAX_VISIBLE_CHIPS = 3;

export default function ReorderCard({ order, onReorder }: Props) {
  const items = order.items;
  const visibleItems = items.slice(0, MAX_VISIBLE_CHIPS);
  const overflow = items.length - MAX_VISIBLE_CHIPS;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <RotateCcw size={13} color={colors.primary} />
          <Text style={styles.title}>Order again</Text>
        </View>
        <Text style={styles.total}>₹{order.pricing.totalAmount.toFixed(2)}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}>
        {visibleItems.map((item, i) => (
          <View key={i} style={styles.chip}>
            <Text style={styles.chipText} numberOfLines={1}>
              {item.quantity > 1 ? `${item.quantity}× ` : ''}{item.name}
            </Text>
          </View>
        ))}
        {overflow > 0 && (
          <View style={[styles.chip, styles.chipOverflow]}>
            <Text style={styles.chipOverflowText}>+{overflow} more</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.btn} onPress={onReorder} activeOpacity={0.85}>
        <Text style={styles.btnText}>Reorder</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
    overflow: 'hidden',
    padding: spacing.md,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  title: {
    fontFamily: font.semiBold,
    fontSize: 13,
    color: colors.primary,
  },
  total: {
    fontFamily: font.bold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: colors.white,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 160,
  },
  chipText: {
    fontFamily: font.medium,
    fontSize: 12,
    color: colors.textPrimary,
  },
  chipOverflow: {
    backgroundColor: colors.surfaceHigh,
    borderColor: colors.surfaceHigh,
  },
  chipOverflowText: {
    fontFamily: font.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: font.bold,
    fontSize: 14,
    color: colors.white,
  },
});
