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
import { ModernNavBar } from "@/components/ModernNavBar";

const RUPEE = "\u20B9";

type PayoutType = "RAIN" | "AQI" | "FLOOD";

const TYPE_ICONS: Record<
  PayoutType,
  React.ComponentProps<typeof Ionicons>["name"]
> = {
  RAIN: "rainy",
  AQI: "leaf",
  FLOOD: "water",
};

const DEMO_ACTIVE_CLAIM = {
  id: "SIM-2404",
  type: "RAIN" as const,
  reason: "Heavy rainfall threshold crossed in your mapped zone.",
  amount: 420,
  status: "in_progress" as const,
  steps: [
    { label: "Trigger detected", icon: "checkmark", done: true },
    { label: "Location verification", icon: "checkmark", done: true },
    { label: "Payout approval", icon: "time", done: false },
  ],
};

function TimelineCard() {
  const { activeClaim } = useAppStore();
  const claim = activeClaim ?? DEMO_ACTIVE_CLAIM;
  const isSimulated = !activeClaim;

  return (
    <View style={styles.card}>
      <View style={styles.timelineHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>Processing now</Text>
          <Text style={styles.timelineTitle}>
            Claim #{claim.id} is under verification
          </Text>
          {isSimulated ? (
            <Text style={styles.simulationTag}>SIMULATION PREVIEW</Text>
          ) : null}
        </View>
        <View style={styles.claimTypePill}>
          <Text style={styles.claimTypeText}>{claim.type}</Text>
        </View>
      </View>

      <Text style={styles.timelineReason}>{claim.reason}</Text>

      <View style={styles.stepsWrap}>
        {claim.steps.map((step, index) => {
          const isLast = index === claim.steps.length - 1;
          return (
            <View key={step.label} style={styles.stepRow}>
              <View style={styles.stepRail}>
                <View
                  style={[
                    styles.stepDot,
                    step.done ? styles.stepDotDone : styles.stepDotPending,
                  ]}
                />
                {!isLast ? (
                  <View
                    style={[styles.stepLine, step.done && styles.stepLineDone]}
                  />
                ) : null}
              </View>
              <View style={styles.stepCopy}>
                <Text
                  style={[
                    styles.stepLabel,
                    !step.done && styles.stepLabelPending,
                  ]}
                >
                  {step.label}
                </Text>
                <Text style={styles.stepMeta}>
                  {step.done ? "Completed" : "Waiting for next action"}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function HistoryList() {
  const { payoutHistory } = useAppStore();

  return (
    <View style={styles.card}>
      <Text style={styles.sectionEyebrow}>Claim history</Text>
      <Text style={styles.sectionTitle}>Recent payouts and verifications</Text>

      <View style={styles.historyList}>
        {payoutHistory.length ? (
          payoutHistory.slice(0, 8).map((item) => (
            <View key={item.id} style={styles.historyRow}>
              <View style={styles.historyIcon}>
                <Ionicons
                  name={TYPE_ICONS[item.type]}
                  size={17}
                  color={Brand.primary}
                />
              </View>

              <View style={styles.historyBody}>
                <Text style={styles.historyTitle}>{item.title}</Text>
                <Text style={styles.historyMeta}>
                  {item.date} · {item.status}
                </Text>
              </View>

              <Text style={styles.historyAmount}>
                {item.status === "PAID" ? "+" : ""}
                {RUPEE}
                {item.amount}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No claim history available yet.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function ClaimsScreen() {
  const { activeClaim } = useAppStore();
  const bannerClaim = activeClaim ?? DEMO_ACTIVE_CLAIM;
  const isSimulated = !activeClaim;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ModernNavBar
        title="Claims"
        showLogo={false}
        backgroundColor={Brand.canvasStrong}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Claims center</Text>
          <Text style={styles.heroTitle}>
            Track claim progress and payout history
          </Text>
          <Text style={styles.heroSub}>
            This screen only shows claim lifecycle updates, verification status,
            and payout records.
          </Text>
        </View>

        <View style={styles.activeBanner}>
          <View style={styles.activeBannerIcon}>
            <Ionicons name="flash" size={18} color={Brand.warning} />
          </View>
          <View style={styles.activeBannerCopy}>
            <Text style={styles.activeBannerTitle}>
              {isSimulated
                ? "Active claim simulation"
                : "1 active claim in progress"}
            </Text>
            <Text style={styles.activeBannerSub}>
              Pending payout of {RUPEE}
              {bannerClaim.amount}
            </Text>
          </View>
        </View>

        <TimelineCard />
        <HistoryList />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 140,
    gap: Spacing.lg,
  },
  heroCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Brand.line,
    ...Shadow.sm,
  },
  heroEyebrow: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Neutral[500],
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  heroTitle: {
    fontFamily: Font.display,
    fontSize: 28,
    lineHeight: 34,
    color: Neutral[900],
    letterSpacing: -0.9,
    marginBottom: 8,
  },
  heroSub: {
    fontFamily: Font.medium,
    fontSize: 14,
    lineHeight: 21,
    color: Neutral[500],
  },
  activeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: Spacing.md,
    backgroundColor: Brand.warningLight,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "#F2D49B",
  },
  activeBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  activeBannerCopy: {
    flex: 1,
    gap: 4,
  },
  activeBannerTitle: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: "#724508",
  },
  activeBannerSub: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: "#8B5A0C",
  },
  card: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Brand.line,
    ...Shadow.sm,
  },
  sectionEyebrow: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Neutral[500],
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: Font.semiBold,
    fontSize: 22,
    color: Neutral[900],
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  sectionSub: {
    fontFamily: Font.medium,
    fontSize: 13,
    lineHeight: 20,
    color: Neutral[500],
  },
  timelineHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  timelineTitle: {
    fontFamily: Font.semiBold,
    fontSize: 20,
    lineHeight: 25,
    color: Neutral[900],
    letterSpacing: -0.5,
  },
  claimTypePill: {
    alignSelf: "flex-start",
    backgroundColor: Brand.aqiLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  claimTypeText: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Brand.aqi,
  },
  timelineReason: {
    fontFamily: Font.medium,
    fontSize: 13,
    lineHeight: 20,
    color: Neutral[500],
    marginBottom: Spacing.lg,
  },
  simulationTag: {
    marginTop: 4,
    fontFamily: Font.bold,
    fontSize: 10,
    color: Brand.primary,
    letterSpacing: 0.6,
  },
  stepsWrap: {
    gap: 4,
  },
  stepRow: {
    flexDirection: "row",
    gap: Spacing.md,
    minHeight: 56,
  },
  stepRail: {
    alignItems: "center",
    width: 18,
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginTop: 2,
  },
  stepDotDone: {
    backgroundColor: Brand.primary,
  },
  stepDotPending: {
    backgroundColor: Neutral[100],
    borderWidth: 2,
    borderColor: Neutral[300],
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: Neutral[200],
    marginTop: 6,
  },
  stepLineDone: {
    backgroundColor: Brand.primary,
  },
  stepCopy: {
    flex: 1,
    paddingBottom: Spacing.md,
  },
  stepLabel: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: Neutral[900],
    marginBottom: 4,
  },
  stepLabelPending: {
    color: Neutral[500],
  },
  stepMeta: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
  },
  historyList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  historyIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.surfaceTint,
  },
  historyBody: {
    flex: 1,
    gap: 2,
  },
  historyTitle: {
    fontFamily: Font.semiBold,
    fontSize: 13,
    color: Neutral[900],
  },
  historyMeta: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
  },
  historyAmount: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: Neutral[900],
  },
  emptyState: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: Brand.surfaceAlt,
  },
  emptyStateText: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: Neutral[500],
    textAlign: "center",
  },
});
