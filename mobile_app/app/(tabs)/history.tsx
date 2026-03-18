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
import { Brand, Neutral, Shadow, Radius, Spacing, Font } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { mockHistoryStats, mockPayoutHistory } from '@/services/mockData';

type HistoryFilter = 'ALL' | 'RAIN' | 'AQI' | 'FLOOD';
type PayoutType = 'RAIN' | 'AQI' | 'FLOOD';
type PayoutStatus = 'PAID' | 'VERIFIED' | 'PENDING';

const FILTERS: HistoryFilter[] = ['ALL', 'RAIN', 'AQI', 'FLOOD'];

const typeColor = (t: PayoutType) => ({ RAIN: Brand.rain, AQI: Brand.aqi, FLOOD: Brand.flood }[t]);
const typeIcon = (t: PayoutType): React.ComponentProps<typeof Ionicons>['name'] =>
  ({ RAIN: 'rainy', AQI: 'leaf', FLOOD: 'water' }[t] as any);
const statusColor = (s: PayoutStatus) => ({ PAID: Brand.success, VERIFIED: Brand.primary, PENDING: Brand.warning }[s] ?? Neutral[400]);

function HistoryItem({ item }: { item: { id: string; type: PayoutType; title: string; date: string; amount: number; status: PayoutStatus } }) {
  const color = typeColor(item.type);
  return (
    <View style={styles.item}>
      <View style={[styles.itemIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={typeIcon(item.type)} size={17} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemDate}>{item.date}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '18' }]}>
            <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={[styles.itemAmt, { color: item.status === 'PAID' ? Brand.success : Neutral[400] }]}>
          {item.status === 'PAID' ? '+' : ''}₹{item.amount}
        </Text>
        <Text style={[styles.itemType, { color }]}>{item.type}</Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const { historyFilter, setHistoryFilter, payoutHistory } = useAppStore();
  const filtered = historyFilter === 'ALL' ? payoutHistory : payoutHistory.filter((h) => h.type === historyFilter);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Payout History</Text>
          <Text style={styles.headerSub}>All automatic claim disbursements</Text>
        </View>

        {/* 3-stat row */}
        <View style={styles.statsRow}>
          {[
            { icon: 'wallet-outline', value: `₹${mockHistoryStats.totalReceived.toLocaleString()}`, label: 'Total Received', color: Brand.primary, bg: Brand.primaryLight },
            { icon: 'checkmark-circle-outline', value: `${mockHistoryStats.claimsPaid}`, label: 'Claims Paid', color: Brand.success, bg: Brand.successLight },
            { icon: 'time-outline', value: `${mockHistoryStats.pending}`, label: 'Pending', color: Brand.warning, bg: Brand.warningLight },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon as any} size={16} color={s.color} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ marginTop: Spacing.lg }}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.sm }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, historyFilter === f && styles.filterTabActive]}
              onPress={() => setHistoryFilter(f)}
            >
              <Text style={[styles.filterText, historyFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        <View style={styles.list}>
          {filtered.map((item, idx) => (
            <View key={item.id}>
              <HistoryItem item={item as any} />
              {idx < filtered.length - 1 && <View style={styles.sep} />}
            </View>
          ))}
        </View>

        {/* Streak card */}
        <View style={styles.streakCard}>
          <View style={[styles.streakIcon, { backgroundColor: Brand.warningLight }]}>
            <Ionicons name="flame" size={20} color={Brand.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakTitle}>3-Week Streak</Text>
            <Text style={styles.streakSub}>You are a top protected rider</Text>
          </View>
          <View style={styles.dotsRow}>
            {[0, 1, 2].map((i) => <View key={i} style={[styles.dot, { backgroundColor: Brand.warning }]} />)}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral[50] },

  header: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg,
    backgroundColor: Neutral.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Neutral[200],
  },
  headerTitle: { fontFamily: Font.bold, fontSize: 26, color: Neutral[900], letterSpacing: -0.4 },
  headerSub: { fontFamily: Font.regular, fontSize: 13, color: Neutral[500], marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  statCard: { flex: 1, backgroundColor: Neutral.white, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: 4, ...Shadow.xs, borderWidth: 1, borderColor: Neutral[100] },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statValue: { fontFamily: Font.bold, fontSize: 16, color: Neutral[900] },
  statLabel: { fontFamily: Font.regular, fontSize: 10, color: Neutral[400], textAlign: 'center' },

  filterTab: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Neutral[200], backgroundColor: Neutral.white },
  filterTabActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  filterText: { fontFamily: Font.semiBold, fontSize: 12, color: Neutral[500] },
  filterTextActive: { color: Neutral.white },

  list: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
    backgroundColor: Neutral.white, borderRadius: Radius.lg,
    overflow: 'hidden', ...Shadow.xs, borderWidth: 1, borderColor: Neutral[100],
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  itemIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontFamily: Font.semiBold, fontSize: 13, color: Neutral[800] },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  itemDate: { fontFamily: Font.regular, fontSize: 11, color: Neutral[400] },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full },
  statusText: { fontFamily: Font.bold, fontSize: 9, letterSpacing: 0.4 },
  itemRight: { alignItems: 'flex-end', gap: 2 },
  itemAmt: { fontFamily: Font.bold, fontSize: 14 },
  itemType: { fontFamily: Font.bold, fontSize: 10, letterSpacing: 0.4 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: Neutral[100] },

  streakCard: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Neutral.white, borderRadius: Radius.lg,
    padding: Spacing.lg, ...Shadow.xs, borderWidth: 1, borderColor: Neutral[100],
  },
  streakIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  streakTitle: { fontFamily: Font.semiBold, fontSize: 14, color: Neutral[800] },
  streakSub: { fontFamily: Font.regular, fontSize: 12, color: Neutral[400], marginTop: 2 },
  dotsRow: { flexDirection: 'row', gap: 4 },
  dot: { width: 9, height: 9, borderRadius: 4.5 },
});
