import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, RefreshControl, ActivityIndicator,
} from 'react-native';
import { MapPin, Clock, ChevronRight } from 'lucide-react-native';
import { api } from '../../api';
import { colors, font, radius, spacing } from '../../theme';
import { Vendor } from '../../types';
import { useStudentStore } from '../../store/studentStore';
import { useAuthStore } from '../../store/authStore';

export default function HomeScreen({ navigation }: any) {
  const vendors = useStudentStore(state => state.vendors);
  const setSync = useStudentStore(state => state.setSync);
  const name = useAuthStore(state => state.name);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const openVendors = vendors.filter(v => v.isOpen);
  const closedVendors = vendors.filter(v => !v.isOpen);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data } = await api.student.sync();
      setSync(data);
    } finally {
      setIsRefreshing(false);
    }
  }, [setSync]);

  const renderVendor = ({ item }: { item: Vendor }) => {
    const isOpen = item.isOpen;
    return (
      <TouchableOpacity
        style={[styles.card, !isOpen && styles.cardClosed]}
        onPress={() => isOpen && navigation.navigate('VendorMenu', { vendor: item })}
        activeOpacity={isOpen ? 0.75 : 1}>
        <View style={styles.cardGradient}>
          <View style={styles.cardTop}>
            <View style={[styles.badge, isOpen ? styles.badgeOpen : styles.badgeClosed]}>
              <View style={[styles.dot, { backgroundColor: isOpen ? colors.success : colors.textSecondary }]} />
              <Text style={[styles.badgeText, { color: isOpen ? colors.success : colors.textSecondary }]}>
                {isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
            {isOpen && <ChevronRight size={18} color={colors.textSecondary} />}
          </View>

          <View style={styles.cardBottom}>
            <Text style={[styles.vendorName, !isOpen && styles.textDimmed]} numberOfLines={1}>
              {item.name}
            </Text>
            {isOpen && (
              <View style={styles.metaRow}>
                <Clock size={13} color={colors.textSecondary} />
                <Text style={styles.metaText}>~{item.prepTime} min</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <FlatList
        data={[...openVendors, ...closedVendors]}
        keyExtractor={item => item.id}
        renderItem={renderVendor}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.locationRow}>
              <MapPin size={14} color={colors.primary} />
              <Text style={styles.locationText}>Campus</Text>
            </View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{name?.split(' ')[0] ?? 'there'} 👋</Text>

            {openVendors.length > 0 && (
              <View style={styles.sectionLabel}>
                <Text style={styles.sectionTitle}>
                  {openVendors.length} vendor{openVendors.length !== 1 ? 's' : ''} open now
                </Text>
              </View>
            )}
          </View>
        }
        ListFooterComponent={
          closedVendors.length > 0 ? (
            <View style={styles.closedSection}>
              <Text style={styles.closedLabel}>Currently Closed</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xl },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: 56,
    paddingBottom: spacing.md,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.md },
  locationText: { fontFamily: font.semiBold, fontSize: 13, color: colors.primary },
  greeting: { fontFamily: font.regular, fontSize: 15, color: colors.textSecondary },
  userName: { fontFamily: font.bold, fontSize: 26, color: colors.white, marginBottom: spacing.lg },
  sectionLabel: { marginBottom: spacing.sm },
  sectionTitle: { fontFamily: font.semiBold, fontSize: 13, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardClosed: { opacity: 0.5 },
  cardGradient: { padding: spacing.md, minHeight: 110 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeOpen: { backgroundColor: 'rgba(16,185,129,0.12)' },
  badgeClosed: { backgroundColor: colors.surfaceHigh },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: font.semiBold, fontSize: 12 },
  cardBottom: { gap: 4 },
  vendorName: { fontFamily: font.bold, fontSize: 18, color: colors.white },
  textDimmed: { color: colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: font.regular, fontSize: 13, color: colors.textSecondary },
  closedSection: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  closedLabel: { fontFamily: font.semiBold, fontSize: 13, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
});
