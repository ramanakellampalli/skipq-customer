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
  const itemNames = order.items.map(i => i.name).join(', ');

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <View style={styles.labelRow}>
          <RotateCcw size={13} color={colors.primary} />
          <Text style={styles.label}>Last order</Text>
        </View>
        <Text style={styles.items} numberOfLines={1}>{itemNames}</Text>
        <Text style={styles.total}>₹{order.pricing.totalAmount.toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={onReorder} activeOpacity={0.85}>
        <Text style={styles.btnText}>Reorder</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  info: { flex: 1, gap: 3 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  label: { fontFamily: font.semiBold, fontSize: 12, color: colors.primary },
  items: { fontFamily: font.regular, fontSize: 13, color: colors.textSecondary },
  total: { fontFamily: font.semiBold, fontSize: 13, color: colors.textPrimary },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  btnText: { fontFamily: font.bold, fontSize: 13, color: colors.white },
});
