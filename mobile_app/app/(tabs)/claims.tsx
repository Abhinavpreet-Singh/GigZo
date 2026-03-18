import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  Brand,
  Neutral,
  Shadow,
  Radius,
  Spacing,
  Font,
} from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";
import { mockThresholds } from "@/services/mockData";
import { ModernNavBar } from "@/components/ModernNavBar";

function ThresholdRow({
  label,
  icon,
  current,
  threshold,
  unit,
  triggered,
  color,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  current: number;
  threshold: number;
  unit: string;
  triggered: boolean;
  color: string;
}) {
  const ratio = Math.min(current / (threshold * 1.5), 1);
  const markerPct = Math.round((1 / 1.5) * 100);

  return (
    <View style={styles.thRow}>
      <View style={styles.thLeft}>
        <View style={[styles.thIcon, { backgroundColor: color + "18" }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={styles.thLabel}>{label}</Text>
      </View>

      <View style={styles.thTrackWrap}>
        <View style={styles.thTrackBg}>
          <View
            style={[
              styles.thTrackFill,
              {
                width: `${Math.round(ratio * 100)}%` as any,
                backgroundColor: triggered ? color : Neutral[300],
              },
            ]}
          />
          <View style={[styles.thMarker, { left: `${markerPct}%` as any }]} />
        </View>
      </View>

      <View style={styles.thRight}>
        <Text
          style={[styles.thValue, { color: triggered ? color : Neutral[700] }]}
        >
          {current}
          {unit}
        </Text>
        <Text style={styles.thLimit}>
          / {threshold}
          {unit}
        </Text>
        {triggered && (
          <View
            style={[styles.triggeredTag, { backgroundColor: color + "15" }]}
          >
            <Text style={[styles.triggeredText, { color }]}>TRIGGERED</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ClaimTimeline() {
  const { activeClaim } = useAppStore();
  if (!activeClaim) return null;

  return (
    <View style={styles.timelineCard}>
      <View style={styles.timelineHeader}>
        <View style={[styles.typeBadge, { backgroundColor: Brand.aqiLight }]}>
          <Text style={[styles.typeBadgeText, { color: Brand.aqi }]}>
            {activeClaim.type}
          </Text>
        </View>
        <Text style={styles.claimId}>#{activeClaim.id}</Text>
      </View>
      <Text style={styles.claimReason}>{activeClaim.reason}</Text>

      {activeClaim.steps.map((step, idx) => {
        const isLast = idx === activeClaim.steps.length - 1;
        return (
          <View key={step.label} style={styles.step}>
            <View style={styles.stepLeft}>
              <View
                style={[
                  styles.stepDot,
                  step.done ? styles.stepDotDone : styles.stepDotPending,
                ]}
              />
              {!isLast && (
                <View
                  style={[
                    styles.stepLine,
                    {
                      backgroundColor: step.done ? Brand.primary : Neutral[200],
                    },
                  ]}
                />
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                { color: step.done ? Neutral[800] : Neutral[400] },
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function ClaimsScreen() {
  const { activeClaim } = useAppStore();

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ModernNavBar
        title="Auto Claims"
        showLogo={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.headerSub}>
            Payouts triggered automatically — no forms needed
          </Text>
        </View>

        {activeClaim && (
          <View style={styles.activeBanner}>
            <View style={styles.activeDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.activeBannerTitle}>1 claim in progress</Text>
              <Text style={styles.activeBannerSub}>
                ₹{activeClaim.amount} pending payout
              </Text>
            </View>
            <Ionicons name="flash" size={18} color={Brand.warning} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Payout Thresholds</Text>
          <Text style={styles.sectionSub}>
            Auto-triggers when readings exceed limits
          </Text>
          <View style={styles.thCard}>
            {mockThresholds.map((t, idx) => (
              <View key={t.id}>
                <ThresholdRow
                  label={t.label}
                  icon={t.icon as React.ComponentProps<typeof Ionicons>["name"]}
                  current={t.current}
                  threshold={t.threshold}
                  unit={t.unit}
                  triggered={t.triggered}
                  color={t.color}
                />
                {idx < mockThresholds.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Processing Now</Text>
          <ClaimTimeline />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral[50] },

  pageHeader: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Neutral.white,
  },
  headerSub: {
    fontFamily: Font.regular,
    fontSize: 13,
    color: Neutral[500],
  },

  activeBanner: {
    margin: Spacing.xl,
    marginBottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Brand.warningLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Brand.warning,
  },
  activeBannerTitle: {
    fontFamily: Font.semiBold,
    fontSize: 14,
    color: "#92400e",
  },
  activeBannerSub: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: "#b45309",
    marginTop: 2,
  },

  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  sectionTitle: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: Neutral[900],
    marginBottom: 3,
  },
  sectionSub: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: Neutral[400],
    marginBottom: Spacing.md,
  },

  thCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.xs,
    borderWidth: 1,
    borderColor: Neutral[100],
  },
  thRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  thLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    width: 100,
  },
  thIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  thLabel: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[700],
    flex: 1,
  },
  thTrackWrap: { flex: 1 },
  thTrackBg: {
    height: 7,
    backgroundColor: Neutral[100],
    borderRadius: 3.5,
    position: "relative",
    overflow: "hidden",
  },
  thTrackFill: {
    height: "100%",
    borderRadius: 3.5,
    position: "absolute",
    left: 0,
    top: 0,
  },
  thMarker: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Neutral[400],
  },
  thRight: { width: 88, alignItems: "flex-end", gap: 2 },
  thValue: { fontFamily: Font.bold, fontSize: 13 },
  thLimit: { fontFamily: Font.regular, fontSize: 10, color: Neutral[400] },
  triggeredTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  triggeredText: { fontFamily: Font.bold, fontSize: 9, letterSpacing: 0.4 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Neutral[200] },

  timelineCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.xs,
    borderWidth: 1,
    borderColor: Neutral[100],
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  typeBadgeText: { fontFamily: Font.bold, fontSize: 11, letterSpacing: 0.4 },
  claimId: { fontFamily: Font.medium, fontSize: 12, color: Neutral[400] },
  claimReason: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: Neutral[500],
    marginBottom: Spacing.lg,
  },

  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    minHeight: 36,
  },
  stepLeft: { alignItems: "center", width: 20 },
  stepDot: { width: 20, height: 20, borderRadius: 10 },
  stepDotDone: { backgroundColor: Brand.primary },
  stepDotPending: {
    backgroundColor: Neutral[200],
    borderWidth: 2,
    borderColor: Neutral[300],
  },
  stepLine: { width: 2, flex: 1, minHeight: 16 },
  stepLabel: { fontFamily: Font.medium, fontSize: 14, paddingTop: 2 },
});
