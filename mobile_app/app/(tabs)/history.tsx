import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Neutral, Shadow, Radius, Spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { mockHistoryStats, mockPayoutHistory } from '@/services/mockData';

type HistoryFilter = 'ALL' | 'RAIN' | 'AQI' | 'FLOOD';
type PayoutType = 'RAIN' | 'AQI' | 'FLOOD';
type PayoutStatus = 'PAID' | 'VERIFIED' | 'PENDING';

const FILTERS: HistoryFilter[] = ['ALL', 'RAIN', 'AQI', 'FLOOD'];

function typeColor(type: PayoutType): string {
  switch (type) {
    case 'RAIN': return Brand.rain;
    case 'AQI': return Brand.aqi;
    case 'FLOOD': return Brand.flood;
    default: return Brand.primary;
  }
}
function typeIcon(type: PayoutType): React.ComponentProps<typeof Ionicons>['name'] {
  switch (type) {
    case 'RAIN': return 'rainy';
    case 'AQI': return 'leaf';
    case 'FLOOD': return 'water';
    default: return 'flash';
  }
}
function statusColor(status: PayoutStatus): string {
  switch (status) {
    case 'PAID': return Brand.success;
    case 'VERIFIED': return Brand.primary;
    case 'PENDING': return Brand.warning;
    default: return Neutral[400];
  }
}

function HistoryItem({
  item,
}: {
  item: {
    id: string;
    type: PayoutType;
    title: string;
    date: string;
    amount: number;
    status: PayoutStatus;
  };
}) {
  const color = typeColor(item.type);
  return (
    <View style={styles.historyItem}>
      <View style={[styles.historyIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={typeIcon(item.type)} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.historyTitle}>{item.title}</Text>
        <View style={styles.historyMeta}>
          <Text style={styles.historyDate}>{item.date}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '18' }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.historyAmountCol}>
        <Text
          style={[
            styles.historyAmount,
            { color: item.status === 'PAID' ? Brand.success : Neutral[400] },
          ]}
        >
          {item.status === 'PAID' ? '+' : ''}₹{item.amount}
        </Text>
        <Text style={[styles.historyType, { color }]}>{item.type}</Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const { historyFilter, setHistoryFilter, payoutHistory } = useAppStore();

  const filtered =
    historyFilter === 'ALL'
      ? payoutHistory
      : payoutHistory.filter((h) => h.type === historyFilter);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Payout History</Text>
          <Text style={styles.headerSub}>All your automatic claim disbursements</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Brand.primaryLight }]}>
              <Ionicons name="wallet-outline" size={18} color={Brand.primary} />
            </View>
            <Text style={styles.statValue}>₹{mockHistoryStats.totalReceived.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Received</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Brand.successLight }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={Brand.success} />
            </View>
            <Text style={styles.statValue}>{mockHistoryStats.claimsPaid}</Text>
            <Text style={styles.statLabel}>Claims Paid</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Brand.warningLight }]}>
              <Ionicons name="time-outline" size={18} color={Brand.warning} />
            </View>
            <Text style={styles.statValue}>{mockHistoryStats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, historyFilter === f && styles.filterTabActive]}
              onPress={() => setHistoryFilter(f)}
            >
              <Text style={[styles.filterText, historyFilter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* History list */}
        <View style={styles.historyList}>
          {filtered.map((item, idx) => (
            <View key={item.id}>
              <HistoryItem item={item as any} />
              {idx < filtered.length - 1 && <View style={styles.listDivider} />}
            </View>
          ))}
        </View>

        {/* Streak card */}
        <View style={styles.streakCard}>
          <View style={[styles.streakIcon, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="flame" size={22} color={Brand.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakTitle}>3-week streak 🔥</Text>
            <Text style={styles.streakSub}>You're a top protected rider</Text>
          </View>
          <View style={styles.streakDots}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.dot, { backgroundColor: Brand.warning }]} />
            ))}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral[50] },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Neutral[100],
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: Neutral[900], letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: Neutral[500], marginTop: 4 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    ...Shadow.sm,
  },
  statIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: Neutral[900] },
  statLabel: { fontSize: 10, color: Neutral[400], fontWeight: '600', textAlign: 'center' },

  // Filters
  filterScroll: { marginTop: Spacing.md },
  filterRow: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  filterTab: {
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Neutral[200],
    backgroundColor: Neutral.white,
  },
  filterTabActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: Neutral[500] },
  filterTextActive: { color: Neutral.white },

  // History list
  historyList: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    backgroundColor: Neutral.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  historyIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  historyTitle: { fontSize: 13, fontWeight: '600', color: Neutral[800] },
  historyMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  historyDate: { fontSize: 11, color: Neutral[400] },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full },
  statusBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  historyAmountCol: { alignItems: 'flex-end', gap: 3 },
  historyAmount: { fontSize: 15, fontWeight: '700' },
  historyType: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  listDivider: { height: 1, backgroundColor: Neutral[100] },

  // Streak
  streakCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    backgroundColor: Neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.sm,
  },
  streakIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  streakTitle: { fontSize: 15, fontWeight: '700', color: Neutral[800] },
  streakSub: { fontSize: 12, color: Neutral[400], marginTop: 2 },
  streakDots: { flexDirection: 'row', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
