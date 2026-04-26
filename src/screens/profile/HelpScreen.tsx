import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import { useStudentStore } from '../../store/studentStore';
import { ServiceRequest, ServiceRequestStatus, ServiceRequestType } from '../../types';
import { colors, font, radius, spacing } from '../../theme';

const TYPE_LABELS: Record<ServiceRequestType, string> = {
  PAYMENT_ISSUE: 'Payment Issue',
  REFUND_ISSUE:  'Refund Issue',
  BILLING_ISSUE: 'Billing Issue',
  ACCOUNT_ISSUE: 'Account Issue',
  TECHNICAL:     'Technical',
  OTHER:         'Other',
};

const STATUS_COLORS: Record<ServiceRequestStatus, { bg: string; text: string }> = {
  OPEN:        { bg: 'rgba(245,158,11,0.15)',  text: colors.warning },
  IN_PROGRESS: { bg: 'rgba(56,189,248,0.15)',  text: colors.info },
  RESOLVED:    { bg: 'rgba(16,185,129,0.15)',  text: colors.success },
  CLOSED:      { bg: 'rgba(148,163,184,0.1)',  text: colors.textSecondary },
};

const STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  OPEN:        'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED:    'Resolved',
  CLOSED:      'Closed',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function RequestCard({ sr }: { sr: ServiceRequest }) {
  const { bg, text } = STATUS_COLORS[sr.status];
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.subject} numberOfLines={1}>{TYPE_LABELS[sr.type] ?? sr.type}</Text>
        <View style={[styles.badge, { backgroundColor: bg }]}>
          <Text style={[styles.badgeText, { color: text }]}>{STATUS_LABELS[sr.status]}</Text>
        </View>
      </View>
      <Text style={styles.date}>{formatDate(sr.createdAt)}</Text>
      {sr.adminResponse ? (
        <View style={styles.responseBox}>
          <Text style={styles.responseLabel}>Response</Text>
          <Text style={styles.responseText}>{sr.adminResponse}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function HelpScreen() {
  const navigation = useNavigation<any>();
  const serviceRequests = useStudentStore(state => state.serviceRequests);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {serviceRequests.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No requests yet</Text>
            <Text style={styles.emptySubtitle}>Tap the button below to get in touch.</Text>
          </View>
        ) : (
          serviceRequests.map(sr => <RequestCard key={sr.id} sr={sr} />)
        )}
      </ScrollView>

      <View style={styles.fabWrap}>
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('NewHelpRequest')}>
          <Plus size={20} color={colors.white} />
          <Text style={styles.fabText}>New Request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: 56,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontFamily: font.bold, fontSize: 18, color: colors.white },
  backBtn: { width: 60 },
  backText: { fontFamily: font.semiBold, fontSize: 16, color: colors.primary },
  content: { padding: spacing.md, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyTitle: { fontFamily: font.semiBold, fontSize: 16, color: colors.textPrimary },
  emptySubtitle: { fontFamily: font.regular, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  subject: { fontFamily: font.semiBold, fontSize: 15, color: colors.textPrimary, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  badgeText: { fontFamily: font.semiBold, fontSize: 12 },
  date: { fontFamily: font.regular, fontSize: 12, color: colors.textSecondary },
  responseBox: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    gap: 2,
  },
  responseLabel: { fontFamily: font.semiBold, fontSize: 11, color: colors.success, textTransform: 'uppercase', letterSpacing: 0.3 },
  responseText: { fontFamily: font.regular, fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
  fabWrap: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
  },
  fab: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
  },
  fabText: { fontFamily: font.bold, color: colors.white, fontSize: 15 },
});
