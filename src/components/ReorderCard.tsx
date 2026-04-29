import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RotateCcw, ChevronRight } from 'lucide-react-native';
import { Order } from '../types';
import { colors, font, spacing } from '../theme';

interface Props {
  order: Order;
  onReorder: () => void;
}

export default function ReorderCard({ order, onReorder }: Props) {
  const summary = order.items.map(i => (i.quantity > 1 ? `${i.quantity}× ${i.name}` : i.name)).join(', ');

  return (
    <TouchableOpacity style={styles.row} onPress={onReorder} activeOpacity={0.7}>
      <RotateCcw size={15} color={colors.primary} />
      <View style={styles.info}>
        <Text style={styles.items} numberOfLines={1}>{summary}</Text>
        <Text style={styles.meta}>₹{order.pricing.totalAmount.toFixed(2)} · last order</Text>
      </View>
      <Text style={styles.action}>Reorder</Text>
      <ChevronRight size={14} color={colors.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  info: { flex: 1 },
  items: { fontFamily: font.medium, fontSize: 13, color: colors.textPrimary },
  meta: { fontFamily: font.regular, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  action: { fontFamily: font.bold, fontSize: 13, color: colors.primary },
});
