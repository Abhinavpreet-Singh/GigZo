import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Brand, Neutral, Shadow, Radius, Spacing, Font } from "@/constants/theme";

const RUPEE = "\u20B9";

function TriggerChip({ icon, label }) {
  return (
    <View style={styles.triggerChip}>
      <Ionicons name={icon} size={14} color={Brand.primary} />
      <Text style={styles.triggerChipText}>{label}</Text>
    </View>
  );
}

function PlanCard({ plan, selected, onSelect }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onSelect}
      style={[styles.planCard, selected && styles.planCardSelected]}
    >
      <View style={styles.planHead}>
        <View>
          <Text style={styles.planName}>{plan.planName}</Text>
          <Text style={styles.planSub}>Weekly parametric protection</Text>
        </View>
        <View style={[styles.selector, selected && styles.selectorActive]}>
          {selected ? <Ionicons name="checkmark" size={14} color={Neutral.white} /> : null}
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.priceText}>{RUPEE}{plan.weeklyPremium}/week</Text>
        <Text style={styles.coverageText}>{RUPEE}{plan.coveragePerDay}/day cover</Text>
      </View>

      <View style={styles.triggerRow}>
        <TriggerChip icon="rainy-outline" label={`Rain > ${plan.triggers?.rain ?? 50}mm`} />
        <TriggerChip icon="leaf-outline" label={`AQI > ${plan.triggers?.aqi ?? 400}`} />
      </View>
    </TouchableOpacity>
  );
}

export default function PlanSelectionScreen({
  plans,
  selectedPlanCode,
  onSelectPlan,
  onActivate,
  loading,
}) {
  const hasPlans = Array.isArray(plans) && plans.length > 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Insurance Protection</Text>
        <Text style={styles.heroTitle}>Activate weekly parametric cover</Text>
        <Text style={styles.heroSub}>
          No manual claim filing. Payouts are triggered automatically when disruption thresholds are met.
        </Text>
      </View>

      {!hasPlans ? (
        <View style={styles.emptyCard}>
          <ActivityIndicator size="small" color={Brand.primary} />
          <Text style={styles.emptyText}>Loading plans...</Text>
        </View>
      ) : (
        plans.map((plan) => (
          <PlanCard
            key={plan.code}
            plan={plan}
            selected={selectedPlanCode === plan.code}
            onSelect={() => onSelectPlan(plan.code)}
          />
        ))
      )}

      <TouchableOpacity
        activeOpacity={0.88}
        disabled={loading || !selectedPlanCode}
        onPress={onActivate}
        style={[styles.activateButton, (loading || !selectedPlanCode) && styles.activateButtonDisabled]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={Neutral.white} />
        ) : (
          <>
            <Text style={styles.activateButtonText}>Pay & Activate</Text>
            <Ionicons name="shield-checkmark-outline" size={16} color={Neutral.white} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
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
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  heroTitle: {
    fontFamily: Font.display,
    fontSize: 26,
    color: Neutral[900],
    marginBottom: 8,
  },
  heroSub: {
    fontFamily: Font.medium,
    fontSize: 13,
    lineHeight: 20,
    color: Neutral[500],
  },
  emptyCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Brand.line,
    paddingVertical: Spacing.xl,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: Neutral[500],
  },
  planCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Brand.line,
    padding: Spacing.xl,
    gap: 12,
    ...Shadow.sm,
  },
  planCardSelected: {
    borderColor: Brand.primary,
  },
  planHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planName: {
    fontFamily: Font.display,
    fontSize: 24,
    color: Neutral[900],
  },
  planSub: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
    marginTop: 2,
  },
  selector: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Neutral[300],
    alignItems: "center",
    justifyContent: "center",
  },
  selectorActive: {
    backgroundColor: Brand.success,
    borderColor: Brand.success,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceText: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: Brand.primaryDark,
  },
  coverageText: {
    fontFamily: Font.semiBold,
    fontSize: 13,
    color: Neutral[700],
  },
  triggerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  triggerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Brand.surfaceTint,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  triggerChipText: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    color: Brand.primaryDark,
  },
  activateButton: {
    marginTop: 4,
    backgroundColor: Brand.primary,
    borderRadius: Radius.full,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    ...Shadow.sm,
  },
  activateButtonDisabled: {
    opacity: 0.6,
  },
  activateButtonText: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: Neutral.white,
  },
});
