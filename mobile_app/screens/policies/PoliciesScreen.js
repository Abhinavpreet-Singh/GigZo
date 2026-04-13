import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  RefreshControl,
  Pressable,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ModernNavBar } from "@/components/ModernNavBar";
import { Brand, Spacing, Neutral, Radius, Font, Shadow } from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";
import {
  createPolicyCheckout,
  confirmPolicyPurchase,
  getPlans,
  getMyPolicy,
  renewPolicy,
  cancelPolicy,
} from "@/services/policyService";
import PlanSelectionScreen from "./PlanSelectionScreen";
import ActivePolicyScreen from "./ActivePolicyScreen";
import { WebView } from "react-native-webview";

function derivePlanCodeFromName(planName) {
  if (!planName || typeof planName !== "string") return null;
  return planName.toLowerCase().includes("pro") ? "pro" : "basic";
}

function buildCheckoutHtml({ order, userName }) {
  const checkoutConfig = {
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    order_id: order.orderId,
    name: "GigZo",
    description: `${order.plan.planName} weekly policy`,
    prefill: {
      name: userName || "GigZo Worker",
    },
    notes: {
      zone: order.zone,
      city: order.city,
      plan: order.plan.code,
    },
    theme: {
      color: "#02555d",
    },
  };

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(180deg, #f5f7f7 0%, #eef3f3 100%);
        font-family: Arial, sans-serif;
        color: #0f172a;
      }
      .card {
        width: 100%;
        max-width: 420px;
        margin: 24px;
        background: #ffffff;
        border-radius: 24px;
        padding: 24px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
      }
      .title {
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 8px;
      }
      .sub {
        font-size: 14px;
        line-height: 1.5;
        color: #475569;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="title">Opening secure checkout</div>
      <div class="sub">Your payment is being processed through Razorpay.</div>
    </div>
    <script>
      (function() {
        const post = function(type, data) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data }));
          }
        };

        const options = ${JSON.stringify(checkoutConfig)};

        options.handler = function(response) {
          post("payment_success", response);
        };

        options.modal = {
          ondismiss: function() {
            post("checkout_dismissed", {});
          },
        };

        try {
          const razorpay = new Razorpay(options);
          razorpay.on("payment.failed", function(response) {
            post("payment_failed", response?.error || response || {});
          });
          razorpay.open();
        } catch (error) {
          post("payment_failed", { description: error.message });
        }
      })();
    </script>
  </body>
</html>`;
}

export default function PoliciesScreen() {
  const { user, setUser } = useAppStore();

  const [plans, setPlans] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [selectedPlanCode, setSelectedPlanCode] = useState("pro");
  const [showPlans, setShowPlans] = useState(false);
  const [checkoutOrder, setCheckoutOrder] = useState(null);

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
          activePlan: nextPolicy.planCode || derivePlanCodeFromName(nextPolicy.planName),
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
    setShowPlans(Boolean(policyData));

    if (!policyData && Array.isArray(plansData) && plansData.length > 0) {
      setSelectedPlanCode(
        plansData.some((plan) => plan.code === "pro") ? "pro" : plansData[0].code,
      );
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
      const order = await createPolicyCheckout({
        plan: selectedPlanCode,
        zone: user.zone,
        city: user.city,
      });
      setCheckoutOrder(order);
    } catch (error) {
      Alert.alert(
        "Activation failed",
        error?.message || "Could not start Razorpay checkout.",
      );
    } finally {
      setBusyAction(null);
    }
  }, [selectedPlanCode, user.city, user.zone]);

  const handlePaymentMessage = useCallback(
    async (event) => {
      if (!checkoutOrder) {
        return;
      }

      let message = null;

      try {
        message = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }

      if (message?.type === "payment_success") {
        try {
          setBusyAction("purchase");
          const nextPolicy = await confirmPolicyPurchase({
            plan: checkoutOrder.plan.code,
            zone: checkoutOrder.zone,
            city: checkoutOrder.city,
            razorpayOrderId: message.data?.razorpay_order_id,
            razorpayPaymentId: message.data?.razorpay_payment_id,
            razorpaySignature: message.data?.razorpay_signature,
          });

          setPolicy(nextPolicy);
          syncStoreFromPolicy(nextPolicy);
          setShowPlans(false);
          setCheckoutOrder(null);
          Alert.alert(
            "Protection Active",
            `Policy ${nextPolicy.policyNumber} is now active.`,
          );
        } catch (error) {
          setCheckoutOrder(null);
          Alert.alert(
            "Payment verification failed",
            error?.message || "The payment could not be verified.",
          );
        } finally {
          setBusyAction(null);
        }
      }

      if (message?.type === "payment_failed") {
        setCheckoutOrder(null);
        setBusyAction(null);
        Alert.alert(
          "Payment failed",
          message?.data?.description || "Razorpay rejected the transaction.",
        );
      }

      if (message?.type === "checkout_dismissed") {
        setCheckoutOrder(null);
        setBusyAction(null);
      }
    },
    [checkoutOrder, syncStoreFromPolicy],
  );

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
        <ModernNavBar
          title="Plans"
          showLogo={false}
          backgroundColor={Brand.canvasStrong}
        />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={Brand.primary} />
          <Text style={styles.loadingText}>Loading insurance policies...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ModernNavBar
        title="Insurance Protection"
        showLogo={false}
        backgroundColor={Brand.canvasStrong}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Brand.primary}
          />
        }
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
          <View style={styles.plansGateWrap}>
            <View style={styles.plansGateCard}>
              <View style={styles.plansGateIconWrap}>
                <Text style={styles.plansGateIcon}>🛡</Text>
              </View>
              <Text style={styles.plansGateTitle}>See plans for your zone</Text>
              <Text style={styles.plansGateBody}>
                Policy details stay hidden until payment succeeds. Tap to view
                the available weekly cover options.
              </Text>
              <Pressable
                style={styles.plansGateButton}
                onPress={() => setShowPlans((value) => !value)}
              >
                <Text style={styles.plansGateButtonText}>
                  {showPlans ? "Hide plans" : "See plans"}
                </Text>
              </Pressable>
            </View>

            {showPlans ? (
              <PlanSelectionScreen
                plans={plans}
                selectedPlanCode={selectedPlanCode}
                onSelectPlan={setSelectedPlanCode}
                onActivate={handleActivatePolicy}
                loading={busyAction === "purchase"}
              />
            ) : null}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={Boolean(checkoutOrder)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCheckoutOrder(null)}
      >
        <SafeAreaView style={styles.checkoutModal} edges={["top", "bottom"]}>
          <View style={styles.checkoutHeader}>
            <View>
              <Text style={styles.checkoutTitle}>Secure checkout</Text>
              <Text style={styles.checkoutSubTitle}>
                {checkoutOrder?.plan?.planName} • {checkoutOrder?.city}
              </Text>
            </View>
            <Pressable onPress={() => setCheckoutOrder(null)}>
              <Text style={styles.checkoutClose}>Close</Text>
            </Pressable>
          </View>

          {checkoutOrder ? (
            <WebView
              originWhitelist={["*"]}
              source={{
                html: buildCheckoutHtml({
                  order: checkoutOrder,
                  userName: user.name,
                }),
              }}
              javaScriptEnabled
              domStorageEnabled
              onMessage={handlePaymentMessage}
              onError={() => {
                setCheckoutOrder(null);
                setBusyAction(null);
                Alert.alert(
                  "Checkout failed",
                  "Could not open Razorpay checkout.",
                );
              }}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.checkoutLoading}>
                  <ActivityIndicator size="small" color={Brand.primary} />
                  <Text style={styles.checkoutLoadingText}>
                    Opening Razorpay...
                  </Text>
                </View>
              )}
            />
          ) : null}
        </SafeAreaView>
      </Modal>
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
  plansGateWrap: {
    gap: Spacing.lg,
  },
  plansGateCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Brand.line,
    padding: Spacing.lg,
    alignItems: "flex-start",
    gap: 10,
    ...Shadow.sm,
  },
  plansGateIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
  },
  plansGateIcon: {
    fontSize: 18,
  },
  plansGateTitle: {
    fontFamily: Font.display,
    fontSize: 22,
    color: Neutral[900],
  },
  plansGateBody: {
    fontFamily: Font.medium,
    fontSize: 13,
    lineHeight: 19,
    color: Neutral[600],
  },
  plansGateButton: {
    backgroundColor: Brand.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  plansGateButtonText: {
    fontFamily: Font.semiBold,
    fontSize: 13,
    color: Neutral.white,
  },
  checkoutModal: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  checkoutHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: Brand.line,
    backgroundColor: Neutral.white,
  },
  checkoutTitle: {
    fontFamily: Font.display,
    fontSize: 20,
    color: Neutral[900],
  },
  checkoutSubTitle: {
    marginTop: 2,
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
  },
  checkoutClose: {
    fontFamily: Font.semiBold,
    fontSize: 14,
    color: Brand.primary,
  },
  checkoutLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Neutral.white,
  },
  checkoutLoadingText: {
    fontFamily: Font.medium,
    color: Neutral[500],
    fontSize: 13,
  },
});
