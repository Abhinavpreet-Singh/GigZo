import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

const ACTIONS = [
  {
    label: "Plans",
    sub: "Compare cover",
    icon: "shield-checkmark-outline",
    route: "/(tabs)/plans",
  },
  {
    label: "Risk Map",
    sub: "Zone exposure",
    icon: "map-outline",
    route: "/(tabs)/risk-map",
  },
  {
    label: "Claims",
    sub: "Track payout",
    icon: "flash-outline",
    route: "/(tabs)/claims",
  },
] as const;

function Reveal({
  delay = 0,
  style,
  children,
}: {
  delay?: number;
  style?: object;
  children: React.ReactNode;
}) {
  const animated = useRef({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(18),
  }).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animated.opacity, {
        toValue: 1,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(animated.translateY, {
        toValue: 0,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [animated, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: animated.opacity,
          transform: [{ translateY: animated.translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function MetricTile({
  icon,
  label,
  value,
  active = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <View style={[styles.metricTile, active && styles.metricTileActive]}>
      <View style={[styles.metricIcon, active && styles.metricIconActive]}>
        <Ionicons
          name={icon}
          size={18}
          color={active ? Neutral.white : Brand.primary}
        />
      </View>
      <Text style={[styles.metricValue, active && styles.metricValueActive]}>
        {value}
      </Text>
      <Text style={[styles.metricLabel, active && styles.metricLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, conditions, earnings, activeClaim } = useAppStore();
  const coverageRatio = Math.min(
    earnings.totalProtected / earnings.weeklyMax,
    1,
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.topBlend}>
        <View style={styles.topGlowOne} />
        <View style={styles.topGlowTwo} />
        <View style={styles.topFade} />
      </View>

      <ModernNavBar transparent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Reveal delay={40}>
          <View style={styles.heroBlock}>
            <Text style={styles.heroEyebrow}>Protected overview</Text>
            <Text style={styles.heroTitle}>Stay ahead of high-risk shifts.</Text>
            <Text style={styles.heroSub}>
              Same data and triggers, now surfaced in a cleaner daily dashboard
              for {user.zone}.
            </Text>
          </View>
        </Reveal>

        <Reveal delay={120}>
          <View style={styles.heroCard}>
            <View style={styles.heroAuraOne} />
            <View style={styles.heroAuraTwo} />

            <View style={styles.heroTopRow}>
              <View style={styles.heroTopLeft}>
                <Text style={styles.heroKicker}>Active cover</Text>
                <View style={styles.heroAmountRow}>
                  <Text style={styles.heroCurrency}>{RUPEE}</Text>
                  <Text style={styles.heroAmount}>{user.coveragePerDay}</Text>
                  <Text style={styles.heroAmountMeta}>/day</Text>
                </View>
                <Text style={styles.heroPlanMeta}>
                  {user.activePlan === "pro" ? "Pro plan" : "Basic plan"} •{" "}
                  {user.daysLeft} days remaining
                </Text>
              </View>

              <View style={styles.heroStatusCard}>
                <Ionicons name="shield-checkmark" size={22} color={Brand.primary} />
                <Text style={styles.heroStatusValue}>{conditions.overallRisk}</Text>
                <Text style={styles.heroStatusLabel}>zone risk</Text>
              </View>
            </View>

            <View style={styles.heroPillRow}>
              <View style={styles.heroPill}>
                <Ionicons name="rainy-outline" size={14} color={Brand.primaryDark} />
                <Text style={styles.heroPillText}>
                  Rain {conditions.rainfall.value}
                  {conditions.rainfall.unit}
                </Text>
              </View>
              <View style={styles.heroPill}>
                <Ionicons name="leaf-outline" size={14} color={Brand.primaryDark} />
                <Text style={styles.heroPillText}>AQI {conditions.aqi.value}</Text>
              </View>
              <View style={styles.heroPill}>
                <Ionicons
                  name="thermometer-outline"
                  size={14}
                  color={Brand.primaryDark}
                />
                <Text style={styles.heroPillText}>
                  {conditions.temperature.value}
                  {conditions.temperature.unit}
                </Text>
              </View>
            </View>
          </View>
        </Reveal>

        {activeClaim ? (
          <Reveal delay={180}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push("/(tabs)/claims")}
              style={styles.claimBanner}
            >
              <View style={styles.claimBannerIcon}>
                <Ionicons name="flash" size={18} color={Neutral.white} />
              </View>
              <View style={styles.claimBannerCopy}>
                <Text style={styles.claimBannerTitle}>Claim in progress</Text>
                <Text style={styles.claimBannerSub}>
                  {activeClaim.reason} • {RUPEE}
                  {activeClaim.amount} payout pending
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={Brand.primary} />
            </TouchableOpacity>
          </Reveal>
        ) : null}

        <Reveal delay={240}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHead}>
              <View>
                <Text style={styles.sectionEyebrow}>Live conditions</Text>
                <Text style={styles.sectionTitle}>Signals across your zone</Text>
              </View>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>Monitoring</Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <MetricTile
                icon="rainy-outline"
                label="Rain"
                value={`${conditions.rainfall.value}${conditions.rainfall.unit}`}
                active={conditions.rainfall.triggered}
              />
              <MetricTile
                icon="leaf-outline"
                label="AQI"
                value={`${conditions.aqi.value}`}
                active={conditions.aqi.triggered}
              />
              <MetricTile
                icon="thermometer-outline"
                label="Temp"
                value={`${conditions.temperature.value}${conditions.temperature.unit}`}
              />
            </View>

            <View style={styles.infoStrip}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={Brand.primary}
              />
              <Text style={styles.infoStripText}>{conditions.status}</Text>
            </View>
          </View>
        </Reveal>

        <Reveal delay={300}>
          <View style={styles.coverageCard}>
            <View style={styles.sectionHead}>
              <View>
                <Text style={styles.sectionEyebrow}>Coverage this week</Text>
                <Text style={styles.sectionTitle}>Protected earnings balance</Text>
              </View>
              <Text style={styles.coverageAmount}>
                {RUPEE}
                {earnings.totalProtected.toLocaleString()}
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.max(10, Math.round(coverageRatio * 100))}%` },
                ]}
              />
            </View>

            <View style={styles.coverageMetaRow}>
              <Text style={styles.coverageMeta}>
                Weekly limit {RUPEE}
                {earnings.weeklyMax.toLocaleString()}
              </Text>
              <Text style={styles.coverageMeta}>
                {Math.round(coverageRatio * 100)}% used
              </Text>
            </View>
          </View>
        </Reveal>

        <Reveal delay={360}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHead}>
              <View>
                <Text style={styles.sectionEyebrow}>Quick access</Text>
                <Text style={styles.sectionTitle}>Core actions, simplified</Text>
              </View>
            </View>

            <View style={styles.actionGrid}>
              {ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.label}
                  activeOpacity={0.88}
                  onPress={() => router.push(action.route)}
                  style={styles.actionCard}
                >
                  <View style={styles.actionIconWrap}>
                    <Ionicons
                      name={action.icon}
                      size={20}
                      color={Brand.primary}
                    />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Text style={styles.actionSub}>{action.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Reveal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  topBlend: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 430,
    backgroundColor: Brand.primaryDark,
  },
  topGlowOne: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(95,219,205,0.16)",
    top: -90,
    right: -40,
  },
  topGlowTwo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: 80,
    left: -60,
  },
  topFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 76,
    backgroundColor: "rgba(243,247,247,0.38)",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 128,
    gap: Spacing.lg,
  },
  heroBlock: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xxl,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  heroEyebrow: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: "rgba(255,255,255,0.86)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: Font.display,
    fontSize: 34,
    lineHeight: 39,
    color: Neutral.white,
    letterSpacing: -1.3,
    marginBottom: 8,
    maxWidth: 320,
  },
  heroSub: {
    fontFamily: Font.medium,
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(255,255,255,0.84)",
    maxWidth: 330,
  },
  heroCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(2,85,93,0.08)",
    ...Shadow.lg,
  },
  heroAuraOne: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(2,85,93,0.08)",
    top: -100,
    right: -70,
  },
  heroAuraTwo: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(3,116,127,0.07)",
    bottom: -60,
    left: -30,
  },
  heroTopRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  heroTopLeft: {
    flex: 1,
    minWidth: 180,
  },
  heroKicker: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Neutral[500],
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  heroAmountRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 6,
  },
  heroCurrency: {
    fontFamily: Font.bold,
    fontSize: 22,
    color: Brand.primary,
    paddingBottom: 8,
    marginRight: 2,
  },
  heroAmount: {
    fontFamily: Font.display,
    fontSize: 54,
    lineHeight: 56,
    color: Neutral[900],
    letterSpacing: -2,
  },
  heroAmountMeta: {
    fontFamily: Font.medium,
    fontSize: 15,
    color: Neutral[500],
    paddingBottom: 9,
    marginLeft: 4,
  },
  heroPlanMeta: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: Neutral[500],
  },
  heroStatusCard: {
    minWidth: 112,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.primaryLight,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  heroStatusValue: {
    fontFamily: Font.display,
    fontSize: 20,
    color: Brand.primaryDark,
    marginTop: 8,
  },
  heroStatusLabel: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: Neutral[500],
    marginTop: 2,
  },
  heroPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: Spacing.xl,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Brand.surfaceTint,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  heroPillText: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    color: Brand.primaryDark,
  },
  claimBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(2,85,93,0.08)",
    ...Shadow.sm,
  },
  claimBannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.primary,
  },
  claimBannerCopy: {
    flex: 1,
    minWidth: 0,
  },
  claimBannerTitle: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: Neutral[900],
    marginBottom: 3,
  },
  claimBannerSub: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
  },
  sectionCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Brand.line,
    ...Shadow.sm,
  },
  coverageCard: {
    backgroundColor: Brand.primaryDark,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    ...Shadow.lg,
  },
  sectionHead: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionEyebrow: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Neutral[500],
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: Font.semiBold,
    fontSize: 22,
    lineHeight: 27,
    color: Neutral[900],
    letterSpacing: -0.7,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: Brand.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.success,
  },
  liveBadgeText: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Brand.primaryDark,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  metricTile: {
    flexGrow: 1,
    minWidth: 92,
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  metricTileActive: {
    backgroundColor: Brand.primary,
  },
  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.primaryLight,
    marginBottom: 12,
  },
  metricIconActive: {
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  metricValue: {
    fontFamily: Font.display,
    fontSize: 24,
    color: Neutral[900],
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  metricValueActive: {
    color: Neutral.white,
  },
  metricLabel: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
  },
  metricLabelActive: {
    color: "rgba(255,255,255,0.72)",
  },
  infoStrip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: Spacing.lg,
    backgroundColor: Brand.surfaceTint,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  infoStripText: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 12,
    lineHeight: 19,
    color: Brand.primaryDark,
  },
  coverageAmount: {
    fontFamily: Font.display,
    fontSize: 28,
    color: Neutral.white,
    letterSpacing: -1,
  },
  progressTrack: {
    height: 12,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: Radius.full,
    backgroundColor: "#64D2C5",
  },
  coverageMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  coverageMeta: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  actionCard: {
    flexGrow: 1,
    minWidth: 96,
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    minHeight: 132,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.primaryLight,
    marginBottom: 14,
  },
  actionLabel: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: Neutral[900],
    marginBottom: 4,
  },
  actionSub: {
    fontFamily: Font.medium,
    fontSize: 12,
    lineHeight: 18,
    color: Neutral[500],
  },
});
