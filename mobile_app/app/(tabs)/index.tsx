import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Brand, Neutral, Shadow, Radius, Spacing, Font } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

// ─── Status Card ──────────────────────────────────────────────────────────────
function StatusCard() {
  const { user } = useAppStore();
  const router = useRouter();

  if (user.isProtected) {
    return (
      <View style={[styles.card, styles.cardProtected]}>
        <View style={[styles.iconCircle, { backgroundColor: Brand.primaryLight }]}>
          <Ionicons name="shield-checkmark" size={22} color={Brand.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>You are Protected</Text>
          <Text style={styles.cardSub}>
            {user.activePlan === 'pro' ? 'Pro Plan' : 'Basic Plan'} · ₹{user.coveragePerDay}/day · {user.daysLeft} days left
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.cardAlert]}>
      <View style={[styles.iconCircle, { backgroundColor: Brand.dangerLight }]}>
        <Ionicons name="shield-outline" size={22} color={Brand.danger} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: Brand.danger }]}>Not Protected</Text>
        <Text style={styles.cardSub}>Activate a plan to secure your earnings</Text>
      </View>
      <TouchableOpacity style={styles.smallBtn} onPress={() => router.push('/(tabs)/plans')}>
        <Text style={styles.smallBtnText}>Activate</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Claim Banner ─────────────────────────────────────────────────────────────
function ClaimBanner() {
  const { activeClaim } = useAppStore();
  const router = useRouter();
  if (!activeClaim) return null;

  return (
    <TouchableOpacity style={styles.claimBanner} onPress={() => router.push('/(tabs)/claims')}>
      <View style={[styles.iconCircleSmall, { backgroundColor: Brand.warningLight }]}>
        <Ionicons name="flash" size={15} color={Brand.warning} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.claimTitle}>Claim In Progress</Text>
        <Text style={styles.claimSub}>{activeClaim.type} threshold exceeded — verification running</Text>
      </View>
      <Text style={[styles.viewLabel, { color: Brand.primary }]}>View</Text>
    </TouchableOpacity>
  );
}

// ─── Live Conditions ──────────────────────────────────────────────────────────
function ConditionsCard() {
  const { conditions } = useAppStore();
  const riskColor = conditions.overallRisk === 'HIGH' ? Brand.danger
    : conditions.overallRisk === 'MEDIUM' ? Brand.warning : Brand.success;

  return (
    <View style={styles.section}>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Live Conditions</Text>
        <View style={[styles.pill, { backgroundColor: riskColor + '18' }]}>
          <View style={[styles.pillDot, { backgroundColor: riskColor }]} />
          <Text style={[styles.pillText, { color: riskColor }]}>{conditions.overallRisk} RISK</Text>
        </View>
      </View>

      <View style={styles.condCard}>
        {/* Live label */}
        <View style={styles.liveRow}>
          <View style={styles.livePulse} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* Metrics */}
        <View style={styles.metricsRow}>
          <Metric icon="rainy-outline" value={`${conditions.rainfall.value}mm`} label="Rainfall" highlighted={conditions.rainfall.triggered} color={Brand.rain} />
          <View style={styles.metricSep} />
          <Metric icon="leaf-outline" value={`${conditions.aqi.value}`} label="AQI" highlighted={conditions.aqi.triggered} color={Brand.aqi} />
          <View style={styles.metricSep} />
          <Metric icon="thermometer-outline" value={`${conditions.temperature.value}°C`} label="Temp" highlighted={false} color={Neutral[500]} />
        </View>

        {/* Status bar */}
        <View style={styles.statusBar}>
          <Ionicons name="warning-outline" size={13} color={Brand.warning} />
          <Text style={styles.statusBarText}>{conditions.status}</Text>
        </View>
      </View>
    </View>
  );
}

function Metric({ icon, value, label, highlighted, color }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string; label: string; highlighted: boolean; color: string;
}) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.metricValue, { color: highlighted ? color : Neutral[800] }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

// ─── Earnings Bar ─────────────────────────────────────────────────────────────
function EarningsBar() {
  const { earnings } = useAppStore();
  const pct = Math.round((earnings.thisWeek / earnings.weeklyMax) * 100);
  return (
    <View style={styles.earningsCard}>
      <View style={styles.earningsRow}>
        <Text style={styles.earningsLabel}>Earnings Protected This Week</Text>
        <Text style={styles.earningsAmt}>
          <Text style={{ color: Brand.primary, fontFamily: Font.bold }}>₹{earnings.totalProtected.toLocaleString()}</Text>
          <Text style={{ color: Neutral[400] }}> / ₹{earnings.weeklyMax.toLocaleString()}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` as any }]} />
      </View>
      <View style={styles.earningsRow}>
        <Text style={styles.earningsMeta}>{pct}% earned back</Text>
        <Text style={styles.earningsMeta}>₹{(earnings.weeklyMax - earnings.thisWeek).toLocaleString()} remaining</Text>
      </View>
    </View>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
const ACTIONS = [
  { icon: 'shield-checkmark-outline', label: 'Buy Plan', route: '/(tabs)/plans', color: Brand.primary, bg: Brand.primaryLight },
  { icon: 'flash-outline', label: 'Claims', route: '/(tabs)/claims', color: Brand.warning, bg: Brand.warningLight },
  { icon: 'map-outline', label: 'Risk Map', route: '/(tabs)/risk-map', color: Brand.flood, bg: Brand.floodLight },
  { icon: 'time-outline', label: 'History', route: '/(tabs)/history', color: Neutral[600], bg: Neutral[100] },
] as const;

function QuickActions() {
  const router = useRouter();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        {ACTIONS.map((a) => (
          <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={() => router.push(a.route as any)}>
            <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
              <Ionicons name={a.icon as any} size={20} color={a.color} />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAppStore();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Neutral.white} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user.name.split(' ')[0]}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={Neutral[400]} />
              <Text style={styles.location}>{user.zone} · {user.platform}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bell}>
            <Ionicons name="notifications-outline" size={20} color={Neutral[700]} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardWrap}>
          <StatusCard />
          <ClaimBanner />
        </View>

        <ConditionsCard />
        <EarningsBar />
        <QuickActions />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral[50] },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
    backgroundColor: Neutral.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Neutral[200],
  },
  greeting: { fontFamily: Font.bold, fontSize: 22, color: Neutral[900], letterSpacing: -0.3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  location: { fontFamily: Font.medium, fontSize: 12, color: Neutral[400] },
  bell: { position: 'relative' },
  bellDot: {
    position: 'absolute', top: 0, right: 0,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Brand.danger,
    borderWidth: 1.5, borderColor: Neutral[50],
  },

  // Card area
  cardWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Neutral.white, borderRadius: Radius.lg,
    padding: Spacing.lg, ...Shadow.xs,
    borderWidth: 1, borderColor: Neutral[100],
  },
  cardProtected: { borderLeftWidth: 3, borderLeftColor: Brand.primary },
  cardAlert: { borderLeftWidth: 3, borderLeftColor: Brand.danger },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: Font.semiBold, fontSize: 14, color: Neutral[800] },
  cardSub: { fontFamily: Font.regular, fontSize: 12, color: Neutral[500], marginTop: 2 },
  smallBtn: {
    backgroundColor: Brand.primary, paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radius.full,
  },
  smallBtnText: { fontFamily: Font.semiBold, fontSize: 12, color: Neutral.white },

  // Claim Banner
  claimBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Neutral.white, borderRadius: Radius.lg,
    padding: Spacing.md, borderLeftWidth: 3, borderLeftColor: Brand.warning,
    borderWidth: 1, borderColor: Neutral[100], ...Shadow.xs,
  },
  iconCircleSmall: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  claimTitle: { fontFamily: Font.semiBold, fontSize: 13, color: Neutral[800] },
  claimSub: { fontFamily: Font.regular, fontSize: 11, color: Neutral[500], marginTop: 1 },
  viewLabel: { fontFamily: Font.semiBold, fontSize: 12 },

  // Conditions
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sectionTitle: { fontFamily: Font.bold, fontSize: 16, color: Neutral[900] },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontFamily: Font.semiBold, fontSize: 11, letterSpacing: 0.3 },

  condCard: { backgroundColor: Neutral.white, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.xs, borderWidth: 1, borderColor: Neutral[100] },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.lg },
  livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: Brand.success },
  liveText: { fontFamily: Font.semiBold, fontSize: 11, letterSpacing: 1, color: Neutral[600] },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.lg },
  metricSep: { width: StyleSheet.hairlineWidth, backgroundColor: Neutral[200] },
  metric: { flex: 1, alignItems: 'center', gap: 4 },
  metricValue: { fontFamily: Font.bold, fontSize: 18, color: Neutral[800] },
  metricLabel: { fontFamily: Font.medium, fontSize: 11, color: Neutral[400] },
  statusBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Brand.warningLight, padding: Spacing.sm, borderRadius: Radius.sm,
  },
  statusBarText: { fontFamily: Font.medium, fontSize: 12, color: '#92400e', flex: 1 },

  // Earnings
  earningsCard: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.xl,
    backgroundColor: Neutral.white, borderRadius: Radius.lg,
    padding: Spacing.lg, ...Shadow.xs, borderWidth: 1, borderColor: Neutral[100],
  },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  earningsLabel: { fontFamily: Font.medium, fontSize: 13, color: Neutral[600] },
  earningsAmt: { fontFamily: Font.semiBold, fontSize: 13 },
  track: { height: 6, backgroundColor: Neutral[100], borderRadius: 3, overflow: 'hidden', marginBottom: Spacing.sm },
  fill: { height: '100%', backgroundColor: Brand.primary, borderRadius: 3 },
  earningsMeta: { fontFamily: Font.regular, fontSize: 11, color: Neutral[400] },

  // Quick Actions
  actionsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  actionBtn: { flex: 1, alignItems: 'center', gap: 6 },
  actionIcon: { width: 52, height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: Font.medium, fontSize: 11, color: Neutral[600], textAlign: 'center' },
});
