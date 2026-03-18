import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
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
import { mockPlans, mockUser } from "@/services/mockData";
import { useAppStore } from "@/store/useAppStore";
import { ModernNavBar } from "@/components/ModernNavBar";

function PlanCard({
  plan,
  isSelected,
  onSelect,
}: {
  plan: (typeof mockPlans)[0];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isPro = plan.id === "pro";

  if (isPro) {
    return (
      <TouchableOpacity
        style={[styles.proCard, isSelected && styles.proCardSelected]}
        onPress={onSelect}
        activeOpacity={0.9}
      >
        <View style={styles.planHeader}>
          <View>
            <Text style={styles.planNameLight}>Pro</Text>
            {plan.recommended && (
              <Text style={styles.recommendedLabel}>
                AI Recommended for {mockUser.zone}
              </Text>
            )}
          </View>
          <View
            style={[styles.checkCircle, isSelected && styles.checkCircleActive]}
          >
            {isSelected && (
              <Ionicons name="checkmark" size={13} color={Neutral.white} />
            )}
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.currencyLight}>₹</Text>
          <Text style={styles.priceLight}>{plan.price}</Text>
          <Text style={styles.periodLight}>/week</Text>
        </View>

        <View style={styles.tagDark}>
          <Ionicons
            name="shield-checkmark"
            size={13}
            color="rgba(255,255,255,0.8)"
          />
          <Text style={styles.tagDarkText}>
            ₹{plan.payoutPerDay} payout per disruption day
          </Text>
        </View>

        <View style={styles.features}>
          {plan.features.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Ionicons
                name="checkmark"
                size={13}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={styles.featureTextLight}>{f}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.basicCard, isSelected && styles.basicCardSelected]}
      onPress={onSelect}
      activeOpacity={0.9}
    >
      <View style={styles.planHeader}>
        <Text style={styles.planNameDark}>Basic</Text>
        <View
          style={[
            styles.checkCircle,
            { borderColor: Neutral[200] },
            isSelected && styles.checkCircleActive,
          ]}
        >
          {isSelected && (
            <Ionicons name="checkmark" size={13} color={Neutral.white} />
          )}
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={[styles.currencyLight, { color: Neutral[800] }]}>₹</Text>
        <Text style={[styles.priceLight, { color: Neutral[900] }]}>
          {plan.price}
        </Text>
        <Text style={[styles.periodLight, { color: Neutral[400] }]}>/week</Text>
      </View>

      <View style={[styles.tagDark, { backgroundColor: Brand.primaryLight }]}>
        <Ionicons name="shield-checkmark" size={13} color={Brand.primary} />
        <Text style={[styles.tagDarkText, { color: Brand.primary }]}>
          ₹{plan.payoutPerDay} payout per disruption day
        </Text>
      </View>

      <View style={styles.features}>
        {plan.features.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Ionicons name="checkmark" size={13} color={Brand.primary} />
            <Text style={styles.featureTextDark}>{f}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

export default function PlansScreen() {
  const { selectedPlan, setSelectedPlan } = useAppStore();

  const handleActivate = () => {
    if (!selectedPlan) {
      Alert.alert("Select a Plan", "Please choose a plan first.");
      return;
    }
    Alert.alert(
      "Plan Activated",
      `Your ${selectedPlan === "pro" ? "Pro" : "Basic"} plan is now active.`,
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ModernNavBar
        title="Coverage Plans"
        showLogo={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.headerSub}>
            AI-tailored based on your zone's risk profile
          </Text>
        </View>

        {/* Zone pill */}
        <View style={styles.zonePillRow}>
          <View style={styles.zonePill}>
            <Ionicons
              name="hardware-chip-outline"
              size={12}
              color={Brand.primary}
            />
            <Text style={styles.zonePillText}>
              {mockUser.zone} · HIGH risk · Pro recommended
            </Text>
          </View>
        </View>

        {/* Plan cards — Basic first, Pro second */}
        {mockPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSelected={selectedPlan === plan.id}
            onSelect={() => setSelectedPlan(plan.id as "basic" | "pro")}
          />
        ))}

        {/* CTA */}
        <TouchableOpacity
          style={styles.activateBtn}
          onPress={handleActivate}
          activeOpacity={0.88}
        >
          <Text style={styles.activateBtnText}>Activate Plan</Text>
        </TouchableOpacity>

        <View style={styles.trustRow}>
          <Ionicons name="lock-closed-outline" size={13} color={Neutral[400]} />
          <Text style={styles.trustText}>
            Secured · Instant payout guarantee
          </Text>
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

  zonePillRow: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Neutral.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Neutral[100],
  },
  zonePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Brand.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
  },
  zonePillText: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    color: Brand.primaryDark,
  },

  // Cards
  basicCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    backgroundColor: Neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: Neutral[200],
    ...Shadow.xs,
  },
  basicCardSelected: { borderColor: Brand.primary },
  proCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    backgroundColor: Brand.primary,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadow.md,
  },
  proCardSelected: { borderWidth: 2, borderColor: Brand.primaryLight },

  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  planNameDark: { fontFamily: Font.bold, fontSize: 20, color: Neutral[900] },
  planNameLight: { fontFamily: Font.bold, fontSize: 20, color: Neutral.white },
  recommendedLabel: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    marginTop: 3,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleActive: {
    backgroundColor: Brand.success,
    borderColor: Brand.success,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    marginBottom: Spacing.md,
  },
  currencyLight: {
    fontFamily: Font.bold,
    fontSize: 18,
    color: Neutral.white,
    paddingBottom: 4,
  },
  priceLight: {
    fontFamily: Font.bold,
    fontSize: 44,
    color: Neutral.white,
    lineHeight: 52,
  },
  periodLight: {
    fontFamily: Font.medium,
    fontSize: 15,
    color: "rgba(255,255,255,0.55)",
    paddingBottom: 5,
  },

  tagDark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginBottom: Spacing.lg,
  },
  tagDarkText: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    color: Neutral.white,
  },

  features: { gap: Spacing.xs + 2 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureTextLight: {
    fontFamily: Font.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  featureTextDark: {
    fontFamily: Font.regular,
    fontSize: 13,
    color: Neutral[600],
  },

  activateBtn: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    backgroundColor: Brand.primary,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: Radius.lg,
    ...Shadow.md,
  },
  activateBtnText: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: Neutral.white,
  },

  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  trustText: { fontFamily: Font.regular, fontSize: 12, color: Neutral[400] },
});
