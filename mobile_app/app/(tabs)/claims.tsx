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
import { mockThresholds } from '@/services/mockData';

// ─── Live Threshold Bar ───────────────────────────────────────────────────────
function ThresholdBar({
  label,
  icon,
  current,
  threshold,
  unit,
  triggered,
  color,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  current: number;
  threshold: number;
  unit: string;
  triggered: boolean;
  color: string;
}) {
  const ratio = Math.min(current / (threshold * 1.5), 1); // fill up to 1.5x threshold

  return (
    <View style={styles.thresholdRow}>
      <View style={styles.thresholdLeft}>
        <View style={[styles.thresholdIconWrap, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={styles.thresholdLabel}>{label}</Text>
      </View>

      <View style={styles.thresholdCenter}>
        <View style={styles.trackBg}>
          <View
            style={[
              styles.trackFill,
              {
                width: `${Math.round(ratio * 100)}%`,
                backgroundColor: triggered ? color : Neutral[300],
              },
            ]}
          />
          {/* Threshold marker */}
          <View
            style={[
              styles.thresholdMarker,
              { left: `${Math.round((1 / 1.5) * 100)}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.thresholdRight}>
        <Text style={[styles.thresholdValue, { color: triggered ? color : Neutral[700] }]}>
          {current}{unit}
        </Text>
        <Text style={styles.thresholdLimit}>/ {threshold}{unit}</Text>
        {triggered && (
          <View style={[styles.triggeredBadge, { backgroundColor: color + '18' }]}>
            <Text style={[styles.triggeredText, { color }]}>TRIGGERED</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Claim Timeline ───────────────────────────────────────────────────────────
function ClaimTimeline() {
  const { activeClaim } = useAppStore();
  if (!activeClaim) return null;

  return (
    <View style={styles.timelineCard}>
      <View style={styles.timelineHeader}>
        <View style={[styles.typeBadge, { backgroundColor: Brand.aqi + '18' }]}>
          <Text style={[styles.typeBadgeText, { color: Brand.aqi }]}>{activeClaim.type}</Text>
        </View>
        <Text style={styles.claimId}>#{activeClaim.id}</Text>
      </View>
      <Text style={styles.claimReason}>{activeClaim.reason}</Text>

      <View style={styles.timeline}>
        {activeClaim.steps.map((step, idx) => {
          const isLast = idx === activeClaim.steps.length - 1;
          return (
            <View key={step.label} style={styles.timelineStep}>
              {/* Dot and connector */}
              <View style={styles.timelineDotCol}>
                <View
                  style={[
                    styles.timelineDot,
                    step.done
                      ? { backgroundColor: Brand.primary }
                      : { backgroundColor: Neutral[200], borderWidth: 2, borderColor: Neutral[300] },
                  ]}
                >
                  {step.done && (
                    <Ionicons name="checkmark" size={10} color={Neutral.white} />
                  )}
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.timelineConnector,
                      { backgroundColor: step.done ? Brand.primary : Neutral[200] },
                    ]}
                  />
                )}
              </View>
              {/* Label */}
              <Text
                style={[
                  styles.timelineLabel,
                  { color: step.done ? Neutral[800] : Neutral[400] },
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ClaimsScreen() {
  const { activeClaim } = useAppStore();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Auto Claims</Text>
          <Text style={styles.headerSub}>Payouts triggered automatically — no forms needed</Text>
        </View>

        {/* Active claim banner */}
        {activeClaim && (
          <View style={styles.activeClaimBanner}>
            <View style={styles.activeClaimLeft}>
              <View style={styles.orangeDot} />
              <View>
                <Text style={styles.activeClaimTitle}>1 claim in progress</Text>
                <Text style={styles.activeClaimSub}>₹{activeClaim.amount} pending payout</Text>
              </View>
            </View>
            <View style={[styles.flashWrap, { backgroundColor: Brand.warning + '20' }]}>
              <Ionicons name="flash" size={20} color={Brand.warning} />
            </View>
          </View>
        )}

        {/* Live Payout Thresholds */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Payout Thresholds</Text>
          <Text style={styles.sectionSub}>Payout auto-triggers when readings exceed limits</Text>

          <View style={styles.thresholdsCard}>
            {mockThresholds.map((t, idx) => (
              <View key={t.id}>
                <ThresholdBar
                  label={t.label}
                  icon={t.icon as React.ComponentProps<typeof Ionicons>['name']}
                  current={t.current}
                  threshold={t.threshold}
                  unit={t.unit}
                  triggered={t.triggered}
                  color={t.color}
                />
                {idx < mockThresholds.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Processing Now */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Processing Now</Text>
          <ClaimTimeline />
        </View>

        {/* No active claim state */}
        {!activeClaim && (
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={48} color={Brand.primaryLight} />
            <Text style={styles.emptyTitle}>No Active Claims</Text>
            <Text style={styles.emptySub}>When conditions exceed thresholds, payouts are automatically triggered</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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

  activeClaimBanner: {
    margin: Spacing.xl,
    marginBottom: 0,
    padding: Spacing.lg,
    backgroundColor: '#fffbeb',
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  activeClaimLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  orangeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Brand.warning },
  activeClaimTitle: { fontSize: 14, fontWeight: '700', color: '#92400e' },
  activeClaimSub: { fontSize: 12, color: '#b45309', marginTop: 2 },
  flashWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  section: { marginTop: Spacing.xl, paddingHorizontal: Spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Neutral[900], letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: Neutral[400], marginTop: 3, marginBottom: Spacing.md },

  thresholdsCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  thresholdLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, width: 100 },
  thresholdIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  thresholdLabel: { fontSize: 12, fontWeight: '600', color: Neutral[700], flex: 1 },
  thresholdCenter: { flex: 1 },
  trackBg: {
    height: 8,
    backgroundColor: Neutral[100],
    borderRadius: 4,
    position: 'relative',
    overflow: 'visible',
  },
  trackFill: { height: '100%', borderRadius: 4, position: 'absolute', left: 0, top: 0 },
  thresholdMarker: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 12,
    backgroundColor: Neutral[500],
    borderRadius: 1,
  },
  thresholdRight: { width: 90, alignItems: 'flex-end', gap: 2 },
  thresholdValue: { fontSize: 14, fontWeight: '700' },
  thresholdLimit: { fontSize: 10, color: Neutral[400] },
  triggeredBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, marginTop: 2 },
  triggeredText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: Neutral[100] },

  // Timeline
  timelineCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  typeBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  claimId: { fontSize: 12, color: Neutral[400], fontWeight: '600' },
  claimReason: { fontSize: 12, color: Neutral[500], marginBottom: Spacing.lg },

  timeline: { paddingLeft: 12 },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  timelineDotCol: { alignItems: 'center', marginRight: 14 },
  timelineDot: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  timelineConnector: { width: 2, height: 28, marginTop: 2 },
  timelineLabel: { fontSize: 14, fontWeight: '600', paddingTop: 2 },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Neutral[700], marginTop: 16 },
  emptySub: { fontSize: 13, color: Neutral[400], textAlign: 'center', marginTop: 8, lineHeight: 18 },
});
