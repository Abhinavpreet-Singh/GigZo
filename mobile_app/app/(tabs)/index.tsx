import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Brand, Neutral, Shadow, Radius, Spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

// ─── Status Card ──────────────────────────────────────────────────────────────
function StatusCard() {
  const { user } = useAppStore();
  const router = useRouter();

  if (user.isProtected) {
    return (
      <View style={[styles.statusCard, styles.statusCardProtected]}>
        <View style={styles.statusIconWrap}>
          <Ionicons name="shield-checkmark" size={28} color={Brand.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.statusTitle}>You are Protected</Text>
          <Text style={styles.statusSub}>
            {user.activePlan === 'pro' ? 'Pro' : 'Basic'} · ₹{user.coveragePerDay}/day · {user.daysLeft} days left
          </Text>
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.statusCard, styles.statusCardUnprotected]}>
      <View style={[styles.statusIconWrap, { backgroundColor: '#fee2e2' }]}>
        <Ionicons name="shield-outline" size={28} color={Brand.danger} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.statusTitle, { color: Brand.danger }]}>Not Protected</Text>
        <Text style={styles.statusSub}>Activate a plan to secure your earnings</Text>
      </View>
      <TouchableOpacity
        style={styles.activateBtn}
        onPress={() => router.push('/(tabs)/plans')}
      >
        <Text style={styles.activateBtnText}>Activate</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Claim In Progress ────────────────────────────────────────────────────────
function ClaimInProgressBanner() {
  const { activeClaim } = useAppStore();
  const router = useRouter();
  if (!activeClaim) return null;
  return (
    <TouchableOpacity
      style={styles.claimBanner}
      onPress={() => router.push('/(tabs)/claims')}
    >
      <View style={[styles.claimIconWrap, { backgroundColor: '#fef3c7' }]}>
        <Ionicons name="flash" size={18} color={Brand.warning} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.claimTitle}>Claim In Progress</Text>
        <Text style={styles.claimSub}>
          {activeClaim.type} &gt; {activeClaim.type === 'AQI' ? '380' : '50mm'} — Verification in progress
        </Text>
      </View>
      <Text style={[styles.viewLink, { color: Brand.primary }]}>View</Text>
    </TouchableOpacity>
  );
}

// ─── Live Conditions ──────────────────────────────────────────────────────────
function LiveConditionsWidget() {
  const { conditions } = useAppStore();

  const riskColor = conditions.overallRisk === 'HIGH'
    ? Brand.danger
    : conditions.overallRisk === 'MEDIUM'
    ? Brand.warning
    : Brand.success;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Live Conditions</Text>
        <View style={[styles.riskBadge, { backgroundColor: riskColor + '18' }]}>
          <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
          <Text style={[styles.riskBadgeText, { color: riskColor }]}>
            {conditions.overallRisk} RISK
          </Text>
        </View>
      </View>

      <View style={styles.conditionsCard}>
        {/* LIVE indicator */}
        <View style={styles.liveRow}>
          <View style={styles.liveDotGroup}>
            <View style={styles.liveDotOuter}>
              <View style={styles.liveDotInner} />
            </View>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: riskColor + '18' }]}>
            <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
            <Text style={[styles.riskBadgeText, { color: riskColor }]}>
              {conditions.overallRisk} RISK
            </Text>
          </View>
        </View>

        {/* Metrics row */}
        <View style={styles.metricsRow}>
          <MetricBox
            icon="rainy-outline"
            value={`${conditions.rainfall.value}mm`}
            label="Rainfall"
            triggered={conditions.rainfall.triggered}
            color={Brand.rain}
          />
          <View style={styles.metricDivider} />
          <MetricBox
            icon="leaf-outline"
            value={`${conditions.aqi.value}`}
            label="AQI"
            triggered={conditions.aqi.triggered}
            color={Brand.aqi}
          />
          <View style={styles.metricDivider} />
          <MetricBox
            icon="thermometer-outline"
            value={`${conditions.temperature.value}°C`}
            label="Temp"
            triggered={conditions.temperature.triggered}
            color={Brand.danger}
          />
        </View>

        {/* Alert band */}
        <View style={styles.alertBand}>
          <Ionicons name="warning-outline" size={14} color={Brand.warning} />
          <Text style={styles.alertBandText}>{conditions.status}</Text>
        </View>
      </View>
    </View>
  );
}

function MetricBox({
  icon,
  value,
  label,
  triggered,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  label: string;
  triggered: boolean;
  color: string;
}) {
  return (
    <View style={styles.metricBox}>
      <Ionicons name={icon} size={20} color={color} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 2, marginTop: 4 }}>
        <Text style={[styles.metricValue, { color: triggered ? color : Neutral[800] }]}>
          {value}
        </Text>
        {triggered && (
          <Ionicons name="trending-up" size={12} color={Brand.danger} style={{ marginTop: 2 }} />
        )}
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

// ─── Earnings Protection ──────────────────────────────────────────────────────
function EarningsProtectionMeter() {
  const { earnings } = useAppStore();
  const progress = earnings.thisWeek / earnings.weeklyMax;
  const remaining = earnings.weeklyMax - earnings.thisWeek;

  return (
    <View style={styles.earningsCard}>
      <View style={styles.earningsTop}>
        <Text style={styles.earningsLabel}>Total Earnings Protected</Text>
        <Text style={styles.earningsValue}>
          <Text style={{ color: Brand.primary, fontWeight: '700' }}>₹{earnings.totalProtected.toLocaleString()}</Text>
          <Text style={{ color: Neutral[400], fontWeight: '500' }}> / ₹{earnings.weeklyMax.toLocaleString()}</Text>
        </Text>
      </View>
      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      <View style={styles.earningsBottom}>
        <Text style={styles.earningsSub}>{Math.round(progress * 100)}% earned back</Text>
        <Text style={styles.earningsSub}>₹{remaining.toLocaleString()} to go</Text>
      </View>
    </View>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: 'shield-checkmark-outline', label: 'Buy Plan', route: '/(tabs)/plans', color: Brand.primary, bg: Brand.primaryLight },
  { icon: 'flash-outline', label: 'Claims', route: '/(tabs)/claims', color: Brand.warning, bg: '#fef3c7' },
  { icon: 'map-outline', label: 'Risk Map', route: '/(tabs)/risk-map', color: '#8b5cf6', bg: '#f5f3ff' },
  { icon: 'time-outline', label: 'History', route: '/(tabs)/history', color: Neutral[600], bg: Neutral[100] },
] as const;

function QuickActions() {
  const router = useRouter();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.actionItem}
            onPress={() => router.push(action.route as any)}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: action.bg }]}>
              <Ionicons name={action.icon as any} size={22} color={action.color} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAppStore();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Neutral.white} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, {user.name.split(' ')[0]} 👋</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={Neutral[500]} />
              <Text style={styles.location}>{user.zone} · {user.platform}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellWrap}>
            <Ionicons name="notifications-outline" size={22} color={Neutral[700]} />
            <View style={styles.bellBadge} />
          </TouchableOpacity>
        </View>

        {/* Cards */}
        <StatusCard />
        <ClaimInProgressBanner />
        <LiveConditionsWidget />
        <EarningsProtectionMeter />
        <QuickActions />
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral[50] },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Neutral[100],
  },
  greeting: { fontSize: 22, fontWeight: '700', color: Neutral[900], letterSpacing: -0.4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  location: { fontSize: 12, color: Neutral[500], fontWeight: '500' },
  bellWrap: { position: 'relative', padding: 4 },
  bellBadge: {
    position: 'absolute', top: 4, right: 4,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Brand.danger,
    borderWidth: 1.5, borderColor: Neutral.white,
  },

  // Status Card
  statusCard: {
    margin: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Neutral.white,
    ...Shadow.sm,
  },
  statusCardProtected: { borderLeftWidth: 3, borderLeftColor: Brand.primary },
  statusCardUnprotected: { borderLeftWidth: 3, borderLeftColor: Brand.danger },
  statusIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Brand.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  statusTitle: { fontSize: 15, fontWeight: '700', color: Neutral[800] },
  statusSub: { fontSize: 12, color: Neutral[500], marginTop: 2 },
  activateBtn: {
    backgroundColor: Brand.primary,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Radius.full,
  },
  activateBtnText: { color: Neutral.white, fontSize: 13, fontWeight: '700' },

  // Claim Banner
  claimBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Neutral.white,
    borderLeftWidth: 3,
    borderLeftColor: Brand.warning,
    ...Shadow.sm,
  },
  claimIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  claimTitle: { fontSize: 13, fontWeight: '700', color: Neutral[800] },
  claimSub: { fontSize: 11, color: Neutral[500], marginTop: 1 },
  viewLink: { fontSize: 13, fontWeight: '600', marginLeft: 8 },

  // Live Conditions
  section: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Neutral[900], letterSpacing: -0.3 },
  riskBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  riskDot: { width: 7, height: 7, borderRadius: 3.5 },
  riskBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  conditionsCard: { backgroundColor: Neutral.white, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.sm },
  liveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  liveDotGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDotOuter: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Brand.success + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  liveDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: Brand.success },
  liveText: { fontSize: 11, fontWeight: '700', color: Neutral[700], letterSpacing: 1 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.lg },
  metricDivider: { width: 1, backgroundColor: Neutral[200], alignSelf: 'stretch' },
  metricBox: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 16, fontWeight: '700', color: Neutral[800] },
  metricLabel: { fontSize: 11, color: Neutral[400], marginTop: 2, fontWeight: '500' },
  alertBand: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fef3c7', padding: Spacing.sm,
    borderRadius: Radius.sm,
  },
  alertBandText: { fontSize: 12, color: '#92400e', fontWeight: '500', flex: 1 },

  // Earnings
  earningsCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Neutral.white,
    borderRadius: Radius.lg,
    ...Shadow.sm,
  },
  earningsTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  earningsLabel: { fontSize: 13, color: Neutral[600], fontWeight: '600' },
  earningsValue: { fontSize: 14, fontWeight: '600' },
  progressBg: { height: 8, backgroundColor: Neutral[100], borderRadius: 4, overflow: 'hidden', marginBottom: Spacing.sm },
  progressFill: { height: '100%', backgroundColor: Brand.primary, borderRadius: 4 },
  earningsBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  earningsSub: { fontSize: 11, color: Neutral[400], fontWeight: '500' },

  // Quick Actions
  actionsGrid: { flexDirection: 'row', gap: Spacing.sm },
  actionItem: { flex: 1, alignItems: 'center', gap: 6 },
  actionIconWrap: {
    width: 56, height: 56, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: 11, color: Neutral[600], fontWeight: '600', textAlign: 'center' },
});
