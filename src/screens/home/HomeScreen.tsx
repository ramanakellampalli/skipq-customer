import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, RefreshControl, TextInput, Image,
} from 'react-native';
import { MapPin, Clock, Search, ShoppingCart, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../api';
import { colors, font, radius, spacing } from '../../theme';
import { Vendor } from '../../types';
import { useStudentStore } from '../../store/studentStore';
import { useCartStore } from '../../store/cartStore';
import Skeleton from '../../components/Skeleton';

type Filter = 'open' | 'quick';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'open',  label: 'Open Now' },
  { key: 'quick', label: 'Quick ≤ 15 min' },
];

const BANNER_HEIGHT = 160;

export default function HomeScreen({ navigation }: any) {
  const insets        = useSafeAreaInsets();
  const vendors       = useStudentStore(state => state.vendors);
  const profile       = useStudentStore(state => state.profile);
  const setSync       = useStudentStore(state => state.setSync);
  const isSynced      = useStudentStore(state => state.isSynced);
  const vendorImages  = useStudentStore(state => state.vendorImages);
  const cartVendorId  = useCartStore(state => state.vendorId);
  const cartCount     = useCartStore(state => state.itemCount());

  const [isRefreshing,  setIsRefreshing]  = useState(false);
  const [search,        setSearch]        = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<Filter>>(new Set());

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data } = await api.student.sync();
      setSync(data);
    } finally {
      setIsRefreshing(false);
    }
  }, [setSync]);

  const toggleFilter = (key: Filter) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = vendors;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(v => v.name.toLowerCase().includes(q));
    }
    if (activeFilters.has('open'))  list = list.filter(v => v.isOpen);
    if (activeFilters.has('quick')) list = list.filter(v => v.prepTime <= 15);
    return list;
  }, [vendors, search, activeFilters]);

  const openVendors   = filtered.filter(v => v.isOpen);
  const closedVendors = filtered.filter(v => !v.isOpen);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const renderVendor = ({ item }: { item: Vendor }) => {
    const images   = vendorImages[item.id] ?? [];
    const bannerUri = images[0];
    const hasCart  = cartVendorId === item.id && cartCount > 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => item.isOpen && navigation.navigate('VendorMenu', { vendor: item })}
        activeOpacity={item.isOpen ? 0.85 : 1}>

        {/* Banner image */}
        <View style={styles.banner}>
          {bannerUri ? (
            <Image source={{ uri: bannerUri }} style={styles.bannerImg} resizeMode="cover" />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Text style={styles.bannerInitial}>{item.name[0]?.toUpperCase()}</Text>
            </View>
          )}

          {!item.isOpen && <View style={styles.closedOverlay} />}

          {/* Status pill — top right */}
          <View style={[styles.statusPill, item.isOpen ? styles.pillOpen : styles.pillClosed]}>
            <View style={[styles.statusDot, { backgroundColor: item.isOpen ? colors.success : colors.textSecondary }]} />
            <Text style={[styles.statusLabel, { color: item.isOpen ? colors.success : colors.textSecondary }]}>
              {item.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>

          {/* Cart pill — top left */}
          {hasCart && (
            <View style={styles.cartPill}>
              <ShoppingCart size={11} color={colors.white} />
              <Text style={styles.cartPillText}>{cartCount} in cart</Text>
            </View>
          )}

          {/* Logo badge — anchored to banner bottom, overlaps cardBody */}
          {item.logoUrl && (
            <Image source={{ uri: item.logoUrl }} style={styles.logoBadge} />
          )}
        </View>

        {/* Info row */}
        <View style={styles.cardBody}>
          <Text style={styles.vendorName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.metaRow}>
            <Clock size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>~{item.prepTime} min</Text>
            {!item.campusName && item.city && (
              <>
                <Text style={styles.metaDot}>·</Text>
                <MapPin size={12} color={colors.textSecondary} />
                <Text style={styles.metaText}>{item.city}</Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const listData: Vendor[] = [
    ...openVendors,
    ...(closedVendors.length > 0
      ? [{ id: '__divider__', name: '', isOpen: false, prepTime: 0, gstRegistered: false }]
      : []),
    ...closedVendors,
  ];

  const ListHeader = (
    <View>
      {/* Greeting */}
      <View style={[styles.greetingWrap, { paddingTop: insets.top + spacing.lg }]}>
        {profile?.campusName && (
          <View style={styles.locationRow}>
            <MapPin size={13} color={colors.primary} />
            <Text style={styles.locationText}>{profile.campusName}</Text>
          </View>
        )}
        <Text style={styles.greetingLine}>
          {greeting()},{' '}
          <Text style={styles.greetingName}>{profile?.name?.split(' ')[0] ?? 'there'} 👋</Text>
        </Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Search size={16} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search vendors…"
          placeholderTextColor={colors.textSecondary}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={15} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <View style={styles.chipRow}>
        {FILTERS.map(({ key, label }) => {
          const active = activeFilters.has(key);
          return (
            <TouchableOpacity
              key={key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleFilter(key)}
              activeOpacity={0.8}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Count label */}
      {isSynced && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {openVendors.length} open · {closedVendors.length} closed
          </Text>
        </View>
      )}
    </View>
  );

  if (!isSynced) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {ListHeader}
        {[1, 2, 3].map(k => <SkeletonCard key={k} />)}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={listData}
        keyExtractor={item => item.id}
        renderItem={({ item }) =>
          item.id === '__divider__' ? (
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>Closed</Text>
              <View style={styles.dividerLine} />
            </View>
          ) : renderVendor({ item })
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {vendors.length === 0 ? 'No vendors yet' : 'No vendors found'}
            </Text>
            <Text style={styles.emptySub}>
              {vendors.length === 0
                ? 'Check back soon — vendors will appear here once they go live'
                : 'Try a different search or filter'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={BANNER_HEIGHT} style={styles.skeletonBanner} />
      <View style={[styles.cardBody, { gap: spacing.xs }]}>
        <Skeleton width="55%" height={18} />
        <Skeleton width={90} height={13} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xl },

  greetingWrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: 4,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontFamily: font.semiBold, fontSize: 12, color: colors.primary },
  greetingLine: { fontFamily: font.regular, fontSize: 16, color: colors.textSecondary },
  greetingName: { fontFamily: font.bold, fontSize: 22, color: colors.textPrimary },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.textPrimary,
    padding: 0,
  },

  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: font.semiBold, fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.white },

  countRow: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  countText: {
    fontFamily: font.semiBold,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  banner: { height: BANNER_HEIGHT },
  bannerImg: { width: '100%', height: '100%' },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerInitial: {
    fontFamily: font.extraBold,
    fontSize: 56,
    color: colors.border,
  },
  closedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(250,250,248,0.60)',
  },

  statusPill: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
  },
  pillOpen:   { borderColor: colors.success },
  pillClosed: { borderColor: colors.border },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontFamily: font.semiBold, fontSize: 11 },

  cartPill: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  cartPillText: { fontFamily: font.semiBold, fontSize: 11, color: colors.white },

  logoBadge: {
    position: 'absolute',
    bottom: -20,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
  },
  cardBody: { paddingHorizontal: spacing.md, paddingTop: spacing.sm + 20, paddingBottom: spacing.md, gap: 4 },
  vendorName: { fontFamily: font.bold, fontSize: 17, color: colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: font.regular, fontSize: 13, color: colors.textSecondary },
  metaDot: { fontFamily: font.regular, fontSize: 13, color: colors.textSecondary },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerLabel: {
    fontFamily: font.semiBold,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
  emptyTitle: { fontFamily: font.semiBold, fontSize: 18, color: colors.textPrimary },
  emptySub: { fontFamily: font.regular, fontSize: 14, color: colors.textSecondary },
  skeletonBanner: { borderRadius: 0 },
});
