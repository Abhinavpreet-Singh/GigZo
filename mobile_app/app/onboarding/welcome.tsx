import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Brand,
  Neutral,
  Shadow,
  Radius,
  Spacing,
  Font,
} from "@/constants/theme";
import {
  GigzoBackdrop,
  GigzoButton,
  GigzoLockup,
} from "@/components/gigzo-ui";

const FEATURES = [
  {
    icon: "flash-outline",
    title: "Auto payouts",
    sub: "No forms, no manual claim flow",
    color: Brand.warning,
    bg: Brand.warningLight,
  },
  {
    icon: "rainy-outline",
    title: "Event triggered",
    sub: "Rain, AQI, and flood signals tracked",
    color: Brand.rain,
    bg: Brand.rainLight,
  },
  {
    icon: "cash-outline",
    title: "Fast transfer",
    sub: "Instant payout promise stays intact",
    color: Brand.success,
    bg: Brand.successLight,
  },
] as const;

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <GigzoBackdrop />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.brandShell}>
          <GigzoLockup />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroBadge}>
            <Ionicons name="sparkles-outline" size={14} color={Neutral.white} />
            <Text style={styles.heroBadgeText}>Income protection for gig workers</Text>
          </View>

          <Text style={styles.title}>Trusted cover, seamless earnings care.</Text>
          <Text style={styles.sub}>
            Same onboarding, same data, same payouts. Just a cleaner visual experience built around the original teal brand.
          </Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>50K+</Text>
              <Text style={styles.heroStatLabel}>Workers covered</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>2 hrs</Text>
              <Text style={styles.heroStatLabel}>Payout promise</Text>
            </View>
          </View>
        </View>

        <View style={styles.featureList}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: feature.bg }]}>
                <Ionicons name={feature.icon as any} size={18} color={feature.color} />
              </View>
              <View style={styles.featureCopy}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSub}>{feature.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <GigzoButton
            label="Get started"
            icon="arrow-forward"
            onPress={() => router.push("/onboarding/otp")}
          />
          <Text style={styles.note}>Join 50,000+ gig workers already protected</Text>
        </View>
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.xl,
  },
  heroCard: {
    backgroundColor: Brand.primaryDark,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    overflow: "hidden",
    ...Shadow.lg,
  },
  brandShell: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: Radius.xxl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.96)",
    ...Shadow.sm,
  },
  heroGlowOne: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(116,205,206,0.16)",
    top: -80,
    right: -40,
  },
  heroGlowTwo: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.08)",
    bottom: -40,
    left: -20,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    marginBottom: Spacing.lg,
  },
  heroBadgeText: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    color: Neutral.white,
  },
  title: {
    fontFamily: Font.display,
    fontSize: 34,
    lineHeight: 40,
    color: Neutral.white,
    letterSpacing: -1.2,
    marginBottom: Spacing.md,
  },
  sub: {
    fontFamily: Font.medium,
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.72)",
  },
  heroStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  heroStatCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  heroStatValue: {
    fontFamily: Font.display,
    fontSize: 24,
    color: Neutral.white,
    marginBottom: 4,
  },
  heroStatLabel: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: "rgba(255,255,255,0.68)",
  },
  featureList: {
    gap: Spacing.sm,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: "rgba(255,255,255,0.84)",
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    ...Shadow.sm,
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCopy: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: Neutral[900],
    marginBottom: 3,
  },
  featureSub: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
  },
  footer: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  note: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
    textAlign: "center",
  },
});
