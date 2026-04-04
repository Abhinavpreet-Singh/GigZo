import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Brand, Neutral, Shadow, Spacing, Font } from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";
import { ModernNavBar } from "@/components/ModernNavBar";
import {
  fetchPolicySummary,
  resolveCity,
  type PolicyBreakdownItem,
  type PolicySummary,
} from "@ai";

const RUPEE = "\u20B9";

const PLAN_PRESETS = {
  basic: {
    key: "basic",
    title: "Basic Plan",
    coveragePerDay: 300,
    premiumHint: 52,
    note: "Essential protection for regular shifts",
  },
  pro: {
    key: "pro",
    title: "Pro Plan",
    coveragePerDay: 500,
    premiumHint: 58,
    note: "Higher payout cap for volatile zones",
  },
} as const;

const DEMO_ACTIVE_POLICY = {
  policyNumber: "POL-28492",
  validRange: "4 Apr – 10 Apr 2026",
  coveragePerDay: 500,
  premiumPaid: 58,
  riskLevel: "HIGH",
  liveStatus: "LIVE PROTECTION ACTIVE",
};

const DEMO_BREAKDOWN: PolicyBreakdownItem[] = [
  {
    factor: "Zone Environmental Risk",
    value: "Moti Bagh (High)",
    impact: "+₹22",
  },
  {
    factor: "7-Day Forecast",
    value: "Rain 62mm + AQI 385",
    impact: "78% trigger probability",
  },
  {
    factor: "Worker Profile",
    value: "Avg earning ₹1,200/day",
    impact: "+₹8",
  },
  {
    factor: "Behavioral & Anti-Fraud Score",
    value: "0.92 (Clean)",
    impact: "-₹7",
  },
  {
    factor: "Coverage Level",
    value: "₹500/day",
    impact: "×1.4",
  },
  {
    factor: "Loyalty Streak",
    value: "3 weeks",
    impact: "Resilience Bonus -₹5",
  },
];

function formatCurrency(value: number) {
  return `${RUPEE}${value.toLocaleString("en-IN")}`;
}

function Badge({
  icon,
  label,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.floatingBadge, { borderColor: `${color}40` }]}>
      <Ionicons name={icon} size={15} color={color} />
      <Text style={[styles.floatingBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

function BreakdownRow({ item }: { item: PolicyBreakdownItem }) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={styles.breakdownFactor}>{item.factor}</Text>
      <Text style={styles.breakdownValue}>{item.value}</Text>
      <Text style={styles.breakdownImpact}>{item.impact}</Text>
    </View>
  );
}

function PolicyHistoryCard() {
  return (
    <View style={styles.historyCard}>
      <View style={styles.historyCardTop}>
        <View>
          <Text style={styles.historyPolicyNumber}>POL-28145</Text>
          <Text style={styles.historyDate}>28 Mar – 3 Apr</Text>
        </View>
        <View style={styles.expiredPill}>
          <Text style={styles.expiredPillText}>Expired</Text>
        </View>
      </View>
      <View style={styles.historyFooter}>
        <Text style={styles.historyPremium}>₹52</Text>
        <Text style={styles.historyMeta}>Last weekly plan</Text>
      </View>
    </View>
  );
}

export default function PoliciesScreen() {
  const user = useAppStore((state) => state.user);
  const selectedPlan = useAppStore((state) => state.selectedPlan);
  const setSelectedPlan = useAppStore((state) => state.setSelectedPlan);
  const setUser = useAppStore((state) => state.setUser);

  const [summary, setSummary] = useState<PolicySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  const zoneLabel = useMemo(() => {
    return (
      user.workingArea?.trim() ||
      user.zone?.trim() ||
      user.city?.trim() ||
      "Moti Bagh"
    );
  }, [user.city, user.workingArea, user.zone]);

  const loadPolicySummary = useCallback(async () => {
    setLoading(true);

    try {
      const resolved =
        (await resolveCity(zoneLabel)) ||
        (user.city ? await resolveCity(user.city) : null) ||
        (await resolveCity("New Delhi"));
      if (!resolved) {
        setSummary(null);
        return;
      }

      const data = await fetchPolicySummary({
        lat: resolved.lat,
        lon: resolved.lon,
        city: user.city || zoneLabel,
        zone: zoneLabel,
        coveragePerDay:
          user.coveragePerDay || DEMO_ACTIVE_POLICY.coveragePerDay,
        avgDailyEarning: user.avgDailyEarning || 1200,
        workerRiskCategory: user.type === "part-time" ? "medium" : "high",
        loyaltyWeeks: 3,
        planType: user.activePlan ?? "pro",
      });

      setSummary(data);
    } finally {
      setLoading(false);
    }
  }, [
    user.activePlan,
    user.avgDailyEarning,
    user.city,
    user.coveragePerDay,
    user.type,
    zoneLabel,
  ]);

  useEffect(() => {
    loadPolicySummary();
  }, [loadPolicySummary]);

  const profilePlan = (user.activePlan ?? "basic") as "basic" | "pro";
  const planChoice = (selectedPlan ?? profilePlan) as "basic" | "pro";

  const applyPlanChoice = useCallback(() => {
    const preset = PLAN_PRESETS[planChoice];
    setSelectedPlan(planChoice);
    setUser({
      activePlan: planChoice,
      coveragePerDay: preset.coveragePerDay,
      isProtected: true,
      daysLeft: user.daysLeft > 0 ? user.daysLeft : 7,
    });
  }, [planChoice, setSelectedPlan, setUser, user.daysLeft]);

  const breakdownItems = summary?.breakdown ?? DEMO_BREAKDOWN;
  const activePolicy = {
    policyNumber: summary?.policy_number ?? DEMO_ACTIVE_POLICY.policyNumber,
    validRange: summary?.valid_range ?? DEMO_ACTIVE_POLICY.validRange,
    coveragePerDay:
      summary?.coverage_per_day ?? DEMO_ACTIVE_POLICY.coveragePerDay,
    premiumPaid: summary?.premium_paid ?? DEMO_ACTIVE_POLICY.premiumPaid,
    riskLevel: summary?.risk_level ?? DEMO_ACTIVE_POLICY.riskLevel,
    liveStatus: summary?.live_status ?? DEMO_ACTIVE_POLICY.liveStatus,
  };
  const aiNote =
    summary?.updated_at ??
    "Updated 2 hours ago using XGBoost + Prophet forecast";
  const explanation =
    summary?.explanation ??
    "Premium is calculated from live weather, AQI, model risk score, coverage level, and loyalty history. SHAP can be used in the UI to explain each feature contribution.";

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.screen}>
        <ModernNavBar
          title="Plans"
          showLogo={false}
          backgroundColor={Brand.canvasStrong}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.headerBlock}>
            <Text style={styles.headerKicker}>Policy Hub</Text>
            <Text style={styles.headerTitle}>Active Weekly Policy</Text>
            <Text style={styles.headerSubTitle}>
              Transparent AI pricing for every shift, every week.
            </Text>
          </View>

          <View style={styles.activeCardWrap}>
            <View style={styles.weatherOrbOne} />
            <View style={styles.weatherOrbTwo} />

            <View style={styles.activeCard}>
              <View style={styles.activeCardTopRow}>
                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.livePillText}>
                    {activePolicy.liveStatus}
                  </Text>
                </View>

                <View style={styles.riskPill}>
                  <Ionicons
                    name="shield-checkmark"
                    size={14}
                    color={Brand.primaryLight}
                  />
                  <Text style={styles.riskPillText}>
                    RISK LEVEL: {activePolicy.riskLevel}
                  </Text>
                </View>
              </View>

              <Text style={styles.policyNumber}>
                {activePolicy.policyNumber}
              </Text>

              <View style={styles.policyMetaRow}>
                <View style={styles.policyMetaChip}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={Neutral.white}
                  />
                  <Text style={styles.policyMetaText}>
                    Valid: {activePolicy.validRange}
                  </Text>
                </View>

                <View style={styles.policyMetaChip}>
                  <Ionicons
                    name="shield-outline"
                    size={14}
                    color={Neutral.white}
                  />
                  <Text style={styles.policyMetaText}>
                    Coverage: {formatCurrency(activePolicy.coveragePerDay)} /
                    day
                  </Text>
                </View>
              </View>

              <View style={styles.premiumRow}>
                <Text style={styles.premiumLabel}>Premium paid this week</Text>
                <Text style={styles.premiumValue}>
                  {formatCurrency(activePolicy.premiumPaid)}{" "}
                  <Text style={styles.premiumUnit}>this week</Text>
                </Text>
              </View>

              <View style={styles.weatherDecorRow}>
                <Badge
                  icon="rainy-outline"
                  label="62mm rain"
                  color={Brand.rain}
                />
                <Badge icon="leaf-outline" label="385 AQI" color={Brand.aqi} />
                <Badge
                  icon="thermometer-outline"
                  label="31°C"
                  color={Brand.warning}
                />
              </View>

              {loading ? (
                <View style={styles.cardLoaderRow}>
                  <ActivityIndicator size="small" color={Brand.accentLight} />
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.breakdownSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionKicker}>
                  Dynamic Premium Calculation
                </Text>
                <Text style={styles.sectionTitle}>
                  How Your Premium is Calculated This Week
                </Text>
              </View>

              <View style={styles.sectionActions}>
                <Pressable
                  style={styles.iconButton}
                  onPress={() => setInfoVisible(true)}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color={Brand.primary}
                  />
                </Pressable>
                <Pressable
                  style={styles.recalculateButton}
                  onPress={loadPolicySummary}
                >
                  <Text style={styles.recalculateText}>Recalculate</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.breakdownCard}>
              <View style={styles.breakdownHeaderRow}>
                <Text style={styles.breakdownHeaderFactor}>Factor</Text>
                <Text style={styles.breakdownHeaderValue}>Value</Text>
                <Text style={styles.breakdownHeaderImpact}>Impact</Text>
              </View>

              {breakdownItems.map((item) => (
                <BreakdownRow key={item.factor} item={item} />
              ))}

              <View style={styles.finalPremiumBlock}>
                <Text style={styles.finalPremiumLabel}>
                  Final Weekly Premium
                </Text>
                <View style={styles.finalPremiumValueRow}>
                  <Ionicons
                    name="trending-up"
                    size={16}
                    color={Brand.success}
                  />
                  <Text style={styles.finalPremiumValue}>
                    {formatCurrency(Math.round(activePolicy.premiumPaid))}
                  </Text>
                </View>
              </View>

              <Text style={styles.breakdownFootnote}>{aiNote}</Text>
            </View>
          </View>

          <View style={styles.planSelectionSection}>
            <Text style={styles.sectionKicker}>Choose plan</Text>
            <Text style={styles.sectionTitle}>
              Select coverage for this week
            </Text>

            <View style={styles.planCardList}>
              {(Object.keys(PLAN_PRESETS) as Array<"basic" | "pro">).map(
                (planKey) => {
                  const preset = PLAN_PRESETS[planKey];
                  const isCurrent = profilePlan === planKey;
                  const isSelected = planChoice === planKey;

                  return (
                    <Pressable
                      key={planKey}
                      onPress={() => setSelectedPlan(planKey)}
                      style={[
                        styles.planOptionCard,
                        isSelected && styles.planOptionCardSelected,
                      ]}
                    >
                      <View style={styles.planOptionTopRow}>
                        <Text style={styles.planOptionTitle}>
                          {preset.title}
                        </Text>
                        {isCurrent ? (
                          <View style={styles.currentPlanPill}>
                            <Text style={styles.currentPlanPillText}>
                              Current
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.planOptionCoverage}>
                        {formatCurrency(preset.coveragePerDay)} / day
                      </Text>
                      <Text style={styles.planOptionSub}>{preset.note}</Text>
                      <Text style={styles.planOptionPremiumHint}>
                        Typical weekly premium:{" "}
                        {formatCurrency(preset.premiumHint)}
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </View>

            <Pressable style={styles.applyPlanButton} onPress={applyPlanChoice}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={Neutral.white}
              />
              <Text style={styles.applyPlanButtonText}>Set as Active Plan</Text>
            </Pressable>
          </View>

          <View style={styles.policyListHeader}>
            <Text style={styles.sectionKicker}>Your Policies</Text>
            <Text style={styles.sectionTitle}>
              Current and previous weekly coverage
            </Text>
          </View>

          <View style={styles.policyHistoryWrap}>
            <PolicyHistoryCard />
          </View>

          <Pressable style={styles.buyButton}>
            <Ionicons name="cart-outline" size={18} color={Neutral.white} />
            <Text style={styles.buyButtonText}>Buy New Weekly Policy</Text>
          </Pressable>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <Modal
          visible={infoVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setInfoVisible(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setInfoVisible(false)}
          >
            <Pressable style={styles.modalCard} onPress={() => null}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Why this price?</Text>
                <Pressable onPress={() => setInfoVisible(false)}>
                  <Ionicons name="close" size={20} color={Neutral[700]} />
                </Pressable>
              </View>
              <Text style={styles.modalBody}>{explanation}</Text>
              <View style={styles.modalMetricRow}>
                <View style={styles.modalMetric}>
                  <Text style={styles.modalMetricLabel}>Live risk</Text>
                  <Text style={styles.modalMetricValue}>
                    {summary?.risk_level ?? "HIGH"}
                  </Text>
                </View>
                <View style={styles.modalMetric}>
                  <Text style={styles.modalMetricLabel}>
                    Trigger probability
                  </Text>
                  <Text style={styles.modalMetricValue}>
                    {summary
                      ? `${Math.round(summary.trigger_probability * 100)}%`
                      : "78%"}
                  </Text>
                </View>
                <View style={styles.modalMetric}>
                  <Text style={styles.modalMetricLabel}>Premium</Text>
                  <Text style={styles.modalMetricValue}>₹58</Text>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Brand.canvasStrong,
  },
  screen: {
    flex: 1,
    backgroundColor: Brand.canvasStrong,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 120,
  },
  headerBlock: {
    marginBottom: Spacing.lg,
  },
  headerKicker: {
    color: Brand.primary,
    fontSize: 13,
    fontFamily: Font.semiBold,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  headerTitle: {
    color: Neutral[900],
    fontSize: 26,
    fontFamily: Font.display,
    marginTop: 4,
  },
  headerSubTitle: {
    color: Neutral[600],
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Font.regular,
    marginTop: 8,
  },
  activeCardWrap: {
    marginBottom: 18,
  },
  weatherOrbOne: {
    position: "absolute",
    top: 16,
    right: 12,
    width: 82,
    height: 82,
    borderRadius: 82,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  weatherOrbTwo: {
    position: "absolute",
    bottom: 20,
    left: 10,
    width: 40,
    height: 40,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  activeCard: {
    backgroundColor: Brand.primary,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    ...Shadow.xl,
    overflow: "hidden",
  },
  activeCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: Brand.successLight,
  },
  livePillText: {
    color: Neutral.white,
    fontSize: 11,
    fontFamily: Font.semiBold,
    letterSpacing: 0.4,
  },
  riskPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  riskPillText: {
    color: Brand.primaryLight,
    fontSize: 11,
    fontFamily: Font.bold,
    letterSpacing: 0.3,
  },
  policyNumber: {
    color: Neutral.white,
    fontSize: 30,
    fontFamily: Font.display,
    letterSpacing: 0.2,
    marginTop: 14,
  },
  policyMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  policyMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  policyMetaText: {
    color: Neutral.white,
    fontSize: 12,
    fontFamily: Font.medium,
  },
  premiumRow: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  premiumLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontFamily: Font.medium,
  },
  premiumValue: {
    color: Neutral.white,
    fontSize: 26,
    fontFamily: Font.display,
    marginTop: 4,
  },
  premiumUnit: {
    fontSize: 13,
    fontFamily: Font.medium,
    color: "rgba(255,255,255,0.78)",
  },
  weatherDecorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  floatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
  },
  floatingBadgeText: {
    fontSize: 12,
    fontFamily: Font.semiBold,
  },
  cardLoaderRow: {
    marginTop: 16,
    alignItems: "flex-start",
  },
  breakdownSection: {
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  sectionHeaderCopy: {
    flex: 1,
    minWidth: 220,
  },
  sectionKicker: {
    color: Brand.primary,
    fontSize: 12,
    letterSpacing: 0.3,
    fontFamily: Font.semiBold,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: Neutral[900],
    fontSize: 19,
    lineHeight: 23,
    fontFamily: Font.bold,
    marginTop: 4,
    maxWidth: 320,
  },
  sectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Neutral.white,
    borderWidth: 1,
    borderColor: Brand.line,
  },
  recalculateButton: {
    backgroundColor: Brand.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.sm,
  },
  recalculateText: {
    color: Neutral.white,
    fontSize: 13,
    fontFamily: Font.semiBold,
  },
  breakdownCard: {
    backgroundColor: Neutral.white,
    borderRadius: 28,
    padding: 16,
    ...Shadow.lg,
    borderWidth: 1,
    borderColor: Brand.line,
  },
  breakdownHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Brand.line,
  },
  breakdownHeaderFactor: {
    flex: 1.15,
    color: Brand.primaryDark,
    fontSize: 11,
    fontFamily: Font.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  breakdownHeaderValue: {
    flex: 1.2,
    color: Brand.primaryDark,
    fontSize: 11,
    fontFamily: Font.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  breakdownHeaderImpact: {
    flex: 0.8,
    color: Brand.primaryDark,
    fontSize: 11,
    fontFamily: Font.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    textAlign: "right",
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(2,85,93,0.08)",
    gap: 10,
  },
  breakdownFactor: {
    flex: 1.15,
    color: Brand.primaryDark,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Font.semiBold,
  },
  breakdownValue: {
    flex: 1.2,
    color: Neutral[700],
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Font.medium,
  },
  breakdownImpact: {
    flex: 0.8,
    color: Brand.primaryMid,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Font.bold,
    textAlign: "right",
  },
  finalPremiumBlock: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Brand.line,
  },
  finalPremiumLabel: {
    color: Neutral[500],
    fontSize: 12,
    fontFamily: Font.medium,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  finalPremiumValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  finalPremiumValue: {
    color: Brand.success,
    fontSize: 30,
    fontFamily: Font.display,
  },
  breakdownFootnote: {
    color: Neutral[500],
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Font.medium,
    marginTop: 12,
  },
  planSelectionSection: {
    marginTop: 22,
  },
  planCardList: {
    marginTop: 12,
    gap: 10,
  },
  planOptionCard: {
    backgroundColor: Neutral.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: Brand.line,
    ...Shadow.sm,
  },
  planOptionCardSelected: {
    borderColor: `${Brand.primary}66`,
    backgroundColor: Brand.primaryLight,
  },
  planOptionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  planOptionTitle: {
    color: Brand.primaryDark,
    fontSize: 16,
    fontFamily: Font.bold,
  },
  currentPlanPill: {
    backgroundColor: Brand.surfaceTint,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Brand.line,
  },
  currentPlanPillText: {
    color: Brand.primaryDark,
    fontSize: 11,
    fontFamily: Font.semiBold,
  },
  planOptionCoverage: {
    marginTop: 8,
    color: Brand.primary,
    fontSize: 20,
    fontFamily: Font.display,
  },
  planOptionSub: {
    marginTop: 4,
    color: Neutral[600],
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Font.medium,
  },
  planOptionPremiumHint: {
    marginTop: 6,
    color: Neutral[500],
    fontSize: 12,
    fontFamily: Font.medium,
  },
  applyPlanButton: {
    marginTop: 12,
    backgroundColor: Brand.primary,
    borderRadius: 16,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...Shadow.md,
  },
  applyPlanButtonText: {
    color: Neutral.white,
    fontSize: 14,
    fontFamily: Font.bold,
    letterSpacing: 0.2,
  },
  policyListHeader: {
    marginTop: 22,
    marginBottom: 12,
  },
  policyHistoryWrap: {
    gap: 10,
  },
  historyCard: {
    backgroundColor: Neutral.white,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    ...Shadow.md,
  },
  historyCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyPolicyNumber: {
    color: Brand.primaryDark,
    fontSize: 17,
    fontFamily: Font.bold,
  },
  historyDate: {
    color: Neutral[600],
    fontSize: 12,
    fontFamily: Font.medium,
    marginTop: 4,
  },
  expiredPill: {
    backgroundColor: Brand.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  expiredPillText: {
    color: Neutral[700],
    fontSize: 12,
    fontFamily: Font.semiBold,
  },
  historyFooter: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyPremium: {
    color: Brand.primaryDark,
    fontSize: 20,
    fontFamily: Font.display,
  },
  historyMeta: {
    color: Neutral[600],
    fontSize: 12,
    fontFamily: Font.medium,
  },
  buyButton: {
    marginTop: 18,
    backgroundColor: Brand.primaryMid,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    ...Shadow.lg,
  },
  buyButtonText: {
    color: Neutral.white,
    fontSize: 15,
    fontFamily: Font.bold,
    letterSpacing: 0.2,
  },
  bottomSpacer: {
    height: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    backgroundColor: Neutral.white,
    borderRadius: 24,
    padding: 18,
    ...Shadow.xl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: {
    color: Brand.primaryDark,
    fontSize: 18,
    fontFamily: Font.bold,
  },
  modalBody: {
    color: Neutral[700],
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Font.regular,
  },
  modalMetricRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  modalMetric: {
    flex: 1,
    backgroundColor: Brand.surfaceAlt,
    borderRadius: 18,
    padding: 12,
  },
  modalMetricLabel: {
    color: Neutral[500],
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontFamily: Font.semiBold,
  },
  modalMetricValue: {
    color: Brand.primaryDark,
    fontSize: 18,
    fontFamily: Font.bold,
    marginTop: 6,
  },
});
