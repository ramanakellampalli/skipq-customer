import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import { Order } from '../types';
import { colors, font, radius, spacing } from '../theme';

interface Props {
  order: Order;
  onReorder: () => void;
}

export default function ReorderCard({ order, onReorder }: Props) {
  const summary = order.items.map(i => (i.quantity > 1 ? `${i.quantity}× ${i.name}` : i.name)).join(', ');

  return (
    <View style={styles.card}>
      <Text style={styles.items} numberOfLines={2}>{summary}</Text>
      <Text style={styles.total}>₹{order.pricing.totalAmount.toFixed(2)}</Text>
      <TouchableOpacity style={styles.btn} onPress={onReorder} activeOpacity={0.85}>
        <RotateCcw size={12} color={colors.primary} />
        <Text style={styles.btnText}>Reorder</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  items: {
    fontFamily: font.medium,
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 17,
  },
  total: {
    fontFamily: font.bold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  btnText: {
    fontFamily: font.semiBold,
    fontSize: 12,
    color: colors.primary,
  },
});
