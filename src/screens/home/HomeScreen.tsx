import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, RefreshControl,
} from 'react-native';
import { MapPin, Clock, ShoppingBag } from 'lucide-react-native';
import { api } from '../../api';
import { colors, font, radius, spacing } from '../../theme';
import { Vendor } from '../../types';
import { useStudentStore } from '../../store/studentStore';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import Skeleton from '../../components/Skeleton';

export default function HomeScreen({ navigation }: any) {
  const vendors = useStudentStore(state => state.vendors);
  const setSync = useStudentStore(state => state.setSync);
  const name = useAuthStore(state => state.name);
  const cartVendorId = useCartStore(state => state.vendorId);
  const cartCount = useCartStore(state => state.itemCount());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(vendors.length === 0);

  useEffect(() => {
    if (vendors.length > 0) setIsInitialLoad(false);
  }, [vendors.length]);

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
    const hasCart = cartVendorId === item.id && cartCount > 0;
    return (
      <TouchableOpacity
        style={[styles.card, !isOpen && styles.cardClosed]}
        onPress={() => isOpen && navigation.navigate('VendorMenu', { vendor: item })}
        activeOpacity={isOpen ? 0.75 : 1}>
        <View style={styles.cardGradient}>
          <View style={styles.cardRow}>
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
            {hasCart && (
              <View style={styles.cartBadge}>
                <ShoppingBag size={18} color={colors.primary} />
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const SkeletonCard = () => (
    <View style={[styles.card, { marginBottom: spacing.sm }]}>
      <View style={styles.cardGradient}>
        <View style={styles.cardBottom}>
          <Skeleton width="55%" height={20} />
          <Skeleton width={80} height={13} style={{ marginTop: 6 }} />
        </View>
      </View>
    </View>
  );

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const ListHeader = (
    <View style={styles.header}>
      <View style={styles.locationRow}>
        <MapPin size={14} color={colors.primary} />
        <Text style={styles.locationText}>Campus</Text>
      </View>
      <Text style={styles.greeting}>{greeting()},</Text>
      <Text style={styles.userName}>{name?.split(' ')[0] ?? 'there'} 👋</Text>

      {!isInitialLoad && openVendors.length > 0 && (
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionTitle}>
            {openVendors.length} vendor{openVendors.length !== 1 ? 's' : ''} open now
          </Text>
        </View>
      )}
    </View>
  );

  const listData = [
    ...openVendors,
    ...(closedVendors.length > 0 ? [{ id: '__closed_header__', isOpen: false, name: '', prepTime: 0 }] : []),
    ...closedVendors,
  ];

  if (isInitialLoad) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        {ListHeader}
        {[1, 2, 3, 4].map(k => <SkeletonCard key={k} />)}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <FlatList
        data={listData}
        keyExtractor={item => item.id}
        renderItem={({ item }) =>
          item.id === '__closed_header__' ? (
            <View style={styles.closedSection}>
              <Text style={styles.closedLabel}>Currently Closed</Text>
            </View>
          ) : renderVendor({ item })
        }
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
        ListHeaderComponent={ListHeader}
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
  cardGradient: { padding: spacing.md, minHeight: 90, justifyContent: 'center' },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cartBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryGlow,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  cartBadgeText: { fontFamily: font.bold, fontSize: 13, color: colors.primary },
  cardBottom: { gap: 4 },
  vendorName: { fontFamily: font.bold, fontSize: 18, color: colors.white },
  textDimmed: { color: colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: font.regular, fontSize: 13, color: colors.textSecondary },
  closedSection: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  closedLabel: { fontFamily: font.semiBold, fontSize: 13, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
});
