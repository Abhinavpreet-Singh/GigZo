import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ModernNavBar } from "@/components/ModernNavBar";
import { Brand, Spacing, Neutral, Radius, Font } from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";
import {
  getPlans,
  getMyPolicy,
  purchasePolicy,
  renewPolicy,
  cancelPolicy,
} from "@/services/policyService";
import PlanSelectionScreen from "./PlanSelectionScreen";
import ActivePolicyScreen from "./ActivePolicyScreen";

function derivePlanCodeFromName(planName) {
  if (!planName || typeof planName !== "string") return null;
  return planName.toLowerCase().includes("pro") ? "pro" : "basic";
}

export default function PoliciesScreen() {
  const { user, setUser } = useAppStore();

  const [plans, setPlans] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [selectedPlanCode, setSelectedPlanCode] = useState("pro");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyAction, setBusyAction] = useState(null);

  const hasActivePolicy = useMemo(
    () => Boolean(policy && policy.status === "active"),
    [policy],
  );

  const syncStoreFromPolicy = useCallback(
    (nextPolicy) => {
      if (nextPolicy && nextPolicy.status === "active") {
        setUser({
          isProtected: true,
          activePlan: derivePlanCodeFromName(nextPolicy.planName),
          coveragePerDay: Number(nextPolicy.coveragePerDay) || 0,
        });
        return;
      }

      setUser({
        isProtected: false,
        activePlan: null,
        coveragePerDay: 0,
      });
    },
    [setUser],
  );

  const loadData = useCallback(async () => {
    const [plansData, policyData] = await Promise.all([getPlans(), getMyPolicy()]);

    setPlans(Array.isArray(plansData) ? plansData : []);
    setPolicy(policyData || null);
    syncStoreFromPolicy(policyData || null);

    if (!policyData && Array.isArray(plansData) && plansData.length > 0) {
      setSelectedPlanCode(plansData.some((plan) => plan.code === "pro") ? "pro" : plansData[0].code);
    }
  }, [syncStoreFromPolicy]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        await loadData();
      } catch (error) {
        if (mounted) {
          Alert.alert("Unable to load policies", error?.message || "Please try again.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      Alert.alert("Refresh failed", error?.message || "Please try again.");
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const handleActivatePolicy = useCallback(async () => {
    if (!selectedPlanCode) {
      Alert.alert("Select a plan", "Choose a plan before activation.");
      return;
    }

    if (!user.zone || !user.city) {
      Alert.alert(
        "Profile required",
        "Please update your city and zone in profile before activating protection.",
      );
      return;
    }

    try {
      setBusyAction("purchase");
      const nextPolicy = await purchasePolicy({
        plan: selectedPlanCode,
        zone: user.zone,
        city: user.city,
      });
      setPolicy(nextPolicy);
      syncStoreFromPolicy(nextPolicy);
      Alert.alert("Protection Active", "Your weekly policy is now active.");
    } catch (error) {
      Alert.alert("Activation failed", error?.message || "Could not activate policy.");
    } finally {
      setBusyAction(null);
    }
  }, [selectedPlanCode, syncStoreFromPolicy, user.city, user.zone]);

  const handleRenew = useCallback(async () => {
    try {
      setBusyAction("renew");
      const nextPolicy = await renewPolicy();
      setPolicy(nextPolicy);
      syncStoreFromPolicy(nextPolicy);
      Alert.alert("Policy Renewed", "Your coverage has been extended by 7 days.");
    } catch (error) {
      Alert.alert("Renewal failed", error?.message || "Could not renew policy.");
    } finally {
      setBusyAction(null);
    }
  }, [syncStoreFromPolicy]);

  const handleCancel = useCallback(() => {
    Alert.alert("Cancel Policy", "Coverage will stop immediately. Continue?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            setBusyAction("cancel");
            await cancelPolicy();
            setPolicy(null);
            syncStoreFromPolicy(null);
            Alert.alert("Policy Cancelled", "Your protection has been disabled.");
          } catch (error) {
            Alert.alert("Cancellation failed", error?.message || "Could not cancel policy.");
          } finally {
            setBusyAction(null);
          }
        },
      },
    ]);
  }, [syncStoreFromPolicy]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ModernNavBar title="Plans" showLogo={false} backgroundColor={Brand.canvasStrong} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={Brand.primary} />
          <Text style={styles.loadingText}>Loading insurance policies...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ModernNavBar title="Insurance Protection" showLogo={false} backgroundColor={Brand.canvasStrong} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />}
      >
        {hasActivePolicy ? (
          <ActivePolicyScreen
            policy={policy}
            onRenew={handleRenew}
            onCancel={handleCancel}
            loadingRenew={busyAction === "renew"}
            loadingCancel={busyAction === "cancel"}
          />
        ) : (
          <PlanSelectionScreen
            plans={plans}
            selectedPlanCode={selectedPlanCode}
            onSelectPlan={setSelectedPlanCode}
            onActivate={handleActivatePolicy}
            loading={busyAction === "purchase"}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 140,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Neutral.white,
    margin: Spacing.lg,
    borderRadius: Radius.xl,
  },
  loadingText: {
    fontFamily: Font.medium,
    fontSize: 14,
    color: Neutral[500],
  },
});
