import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Brand, Neutral, Shadow, Radius, Spacing, Font } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

const { width } = Dimensions.get('window');
const TEAL = Brand.primary;
const TEAL_LIGHT = Brand.primaryLight;
const TEAL_MID = Brand.primaryMid;

// ─── Animated Pulse Dot ──────────────────────────────────────────────────────
function PulseDot({ color = Brand.success }: { color?: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.9, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 900, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={{ width: 12, height: 12, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute', width: 12, height: 12, borderRadius: 6,
        backgroundColor: color, opacity, transform: [{ scale: pulse }],
      }} />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

// ─── Animated Number ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, style }: { value: number; style?: object }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = React.useState(0);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value, duration: 1200,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
    const listener = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    return () => anim.removeListener(listener);
  }, [value]);

  return <Text style={style}>{display.toLocaleString()}</Text>;
}

// ─── Hero Protection Card ─────────────────────────────────────────────────────
function HeroCard() {
  const { user } = useAppStore();
  const router = useRouter();
  const slideY = useRef(new Animated.Value(30)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const shieldScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 600, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(shieldScale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.heroCard, { opacity: fadeIn, transform: [{ translateY: slideY }] }]}>
      {/* Decorative circles */}
      <View style={styles.heroCircle1} />
      <View style={styles.heroCircle2} />

      <View style={styles.heroTop}>
        <View style={styles.heroLeft}>
          {user.isProtected ? (
            <>
              <View style={styles.liveTag}>
                <PulseDot color={Brand.success} />
                <Text style={styles.liveTagText}>PROTECTED</Text>
              </View>
              <Text style={styles.heroHeadline}>You're Covered</Text>
              <Text style={styles.heroSub}>
                {user.activePlan === 'pro' ? 'Pro Plan' : 'Basic Plan'} ·{' '}
                <Text style={{ fontFamily: Font.bold }}>₹{user.coveragePerDay}</Text>/day
              </Text>
              <View style={styles.heroDaysRow}>
                <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.6)" />
                <Text style={styles.heroDaysText}>{user.daysLeft} days remaining</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.liveTagText, { color: 'rgba(255,255,255,0.6)', marginBottom: 4 }]}>NOT ACTIVE</Text>
              <Text style={styles.heroHeadline}>Activate Now</Text>
              <Text style={styles.heroSub}>Your earnings are not protected</Text>
              <TouchableOpacity style={styles.heroActivateBtn} onPress={() => router.push('/(tabs)/plans')}>
                <Text style={styles.heroActivateBtnText}>See Plans</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Shield */}
        <Animated.View style={[styles.shieldWrap, { transform: [{ scale: shieldScale }] }]}>
          <View style={styles.shieldRing}>
            <Ionicons name="shield-checkmark" size={42} color="rgba(255,255,255,0.9)" />
          </View>
        </Animated.View>
      </View>

      {/* Bottom strip */}
      {user.isProtected && (
        <View style={styles.heroCoverRow}>
          {[
            { icon: 'rainy-outline', label: 'Rain' },
            { icon: 'leaf-outline', label: 'AQI' },
            { icon: 'water-outline', label: 'Flood' },
          ].map((c) => (
            <View key={c.label} style={styles.heroCoverItem}>
              <Ionicons name={c.icon as any} size={13} color="rgba(255,255,255,0.7)" />
              <Text style={styles.heroCoverText}>{c.label}</Text>
            </View>
          ))}
          <View style={styles.heroCoverSep} />
          <View style={styles.heroCoverItem}>
            <Ionicons name="checkmark-circle" size={13} color="rgba(255,255,255,0.9)" />
            <Text style={[styles.heroCoverText, { color: 'rgba(255,255,255,0.9)' }]}>All Covered</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Animated Earnings Bar ───────────────────────────────────────────────────
function EarningsBar() {
  const { earnings } = useAppStore();
  const pct = Math.min((earnings.totalProtected / earnings.weeklyMax) * 100, 100);
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: pct, duration: 1400,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={styles.earningsCard}>
      <View style={styles.earningsTop}>
        <View>
          <Text style={styles.earningsLabel}>Protected This Week</Text>
          <View style={styles.earningsAmtRow}>
            <Text style={styles.rupee}>₹</Text>
            <AnimatedNumber value={earnings.totalProtected} style={styles.earningsAmt} />
            <Text style={styles.earningsMax}> / ₹{earnings.weeklyMax.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.pctBadge}>
          <Text style={styles.pctText}>{Math.round(pct)}%</Text>
        </View>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, {
          width: fillAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
        }]} />
        {/* Glow dot at end of fill */}
        <Animated.View style={[styles.fillDot, {
          left: fillAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
        }]} />
      </View>
      <Text style={styles.earningsMeta}>
        ₹{(earnings.weeklyMax - earnings.totalProtected).toLocaleString()} more coverage available
      </Text>
    </View>
  );
}

// ─── Live Conditions Card ─────────────────────────────────────────────────────
function ConditionsCard() {
  const { conditions } = useAppStore();
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 800, delay: 200, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.condCard, { opacity: fadeIn }]}>
      <View style={styles.condHeader}>
        <View style={styles.liveRow}>
          <PulseDot color={TEAL} />
          <Text style={styles.liveText}>LIVE CONDITIONS</Text>
        </View>
        <View style={[styles.riskPill, { backgroundColor: TEAL_LIGHT }]}>
          <Text style={[styles.riskPillText, { color: TEAL }]}>{conditions.overallRisk} RISK</Text>
        </View>
      </View>
      <View style={styles.metricsRow}>
        {[
          { icon: 'rainy-outline', value: `${conditions.rainfall.value}mm`, label: 'Rainfall', active: conditions.rainfall.triggered },
          { icon: 'leaf-outline', value: `${conditions.aqi.value}`, label: 'AQI', active: conditions.aqi.triggered },
          { icon: 'thermometer-outline', value: `${conditions.temperature.value}°`, label: 'Temp', active: false },
        ].map((m, idx) => (
          <React.Fragment key={m.label}>
            <View style={styles.metric}>
              <View style={[styles.metricIcon, m.active && styles.metricIconActive]}>
                <Ionicons name={m.icon as any} size={16} color={m.active ? TEAL : Neutral[400]} />
              </View>
              <Text style={[styles.metricValue, m.active && { color: TEAL }]}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
            </View>
            {idx < 2 && <View style={styles.metricSep} />}
          </React.Fragment>
        ))}
      </View>
      <View style={styles.statusLine}>
        <Ionicons name="information-circle-outline" size={13} color={TEAL} />
        <Text style={styles.statusLineText} numberOfLines={1}>{conditions.status}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
const ACTIONS = [
  { icon: 'shield-checkmark-outline', label: 'Plans', route: '/(tabs)/plans' },
  { icon: 'flash-outline', label: 'Claims', route: '/(tabs)/claims' },
  { icon: 'map-outline', label: 'Risk Map', route: '/(tabs)/risk-map' },
  { icon: 'person-circle-outline', label: 'Profile', route: '/(tabs)/profile' },
] as const;

function QuickActions() {
  const router = useRouter();
  const anims = ACTIONS.map((_, i) => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    Animated.stagger(80, anims.map((a) =>
      Animated.spring(a, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true })
    )).start();
  }, []);

  return (
    <View style={styles.actionsSection}>
      <Text style={styles.sectionLabel}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        {ACTIONS.map((a, idx) => (
          <Animated.View key={a.label} style={{ flex: 1, opacity: anims[idx], transform: [{ scale: anims[idx] }] }}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(a.route as any)} activeOpacity={0.75}>
              <View style={styles.actionIcon}>
                <Ionicons name={a.icon as any} size={20} color={TEAL} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

// ─── Claim Banner ─────────────────────────────────────────────────────────────
function ClaimBanner() {
  const { activeClaim } = useAppStore();
  const router = useRouter();
  const slideX = useRef(new Animated.Value(-20)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!activeClaim) return;
    Animated.parallel([
      Animated.timing(slideX, { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [activeClaim]);

  if (!activeClaim) return null;

  return (
    <Animated.View style={{ opacity: fadeIn, transform: [{ translateX: slideX }] }}>
      <TouchableOpacity style={styles.claimBanner} onPress={() => router.push('/(tabs)/claims')} activeOpacity={0.85}>
        <PulseDot color={TEAL} />
        <View style={{ flex: 1 }}>
          <Text style={styles.claimTitle}>Claim In Progress</Text>
          <Text style={styles.claimSub}>{activeClaim.type} event detected — auto payout running</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={TEAL} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAppStore();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Neutral.white} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Hello, {user.name.split(' ')[0]}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={11} color={Neutral[400]} />
            <Text style={styles.location}>{user.zone} · {user.platform}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.bell}>
          <Ionicons name="notifications-outline" size={20} color={Neutral[700]} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <HeroCard />

        <View style={styles.inner}>
          <ClaimBanner />
          <ConditionsCard />
          <EarningsBar />
          <QuickActions />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral[50] },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    backgroundColor: Neutral.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Neutral[200],
  },
  greeting: { fontFamily: Font.bold, fontSize: 20, color: Neutral[900], letterSpacing: -0.3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  location: { fontFamily: Font.medium, fontSize: 11, color: Neutral[400] },
  bell: { position: 'relative' },
  bellDot: {
    position: 'absolute', top: 0, right: 0,
    width: 8, height: 8, borderRadius: 4, backgroundColor: Brand.danger,
    borderWidth: 1.5, borderColor: Neutral[50],
  },

  scroll: { paddingBottom: 32 },
  inner: { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingTop: Spacing.md },

  // ── Hero card ──
  heroCard: {
    margin: Spacing.lg, marginBottom: 0,
    backgroundColor: TEAL, borderRadius: Radius.xxl,
    padding: Spacing.xl, overflow: 'hidden',
    ...Shadow.md,
  },
  heroCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -40,
  },
  heroCircle2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: -20,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroLeft: { flex: 1, paddingRight: Spacing.lg },
  liveTag: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: Spacing.sm },
  liveTagText: { fontFamily: Font.bold, fontSize: 10, color: Neutral.white, letterSpacing: 1.5 },
  heroHeadline: { fontFamily: Font.bold, fontSize: 28, color: Neutral.white, letterSpacing: -0.5, marginBottom: 6 },
  heroSub: { fontFamily: Font.medium, fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  heroDaysRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroDaysText: { fontFamily: Font.medium, fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  heroActivateBtn: {
    marginTop: Spacing.md, alignSelf: 'flex-start',
    backgroundColor: Neutral.white, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Radius.full,
  },
  heroActivateBtnText: { fontFamily: Font.bold, fontSize: 13, color: TEAL },
  shieldWrap: {},
  shieldRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroCoverRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginTop: Spacing.xl, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)',
  },
  heroCoverItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroCoverText: { fontFamily: Font.medium, fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  heroCoverSep: { flex: 1 },

  // ── Claim banner ──
  claimBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Neutral.white, borderRadius: Radius.lg,
    padding: Spacing.md, borderLeftWidth: 3, borderLeftColor: TEAL,
    borderWidth: 1, borderColor: Neutral[100], ...Shadow.xs,
  },
  claimTitle: { fontFamily: Font.semiBold, fontSize: 13, color: Neutral[800] },
  claimSub: { fontFamily: Font.regular, fontSize: 11, color: Neutral[500], marginTop: 1 },

  // ── Conditions ──
  condCard: {
    backgroundColor: Neutral.white, borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Neutral[100], ...Shadow.xs,
  },
  condHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveText: { fontFamily: Font.bold, fontSize: 11, letterSpacing: 1, color: Neutral[600] },
  riskPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  riskPillText: { fontFamily: Font.bold, fontSize: 11, letterSpacing: 0.3 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.lg },
  metricSep: { width: StyleSheet.hairlineWidth, backgroundColor: Neutral[100], alignSelf: 'stretch' },
  metric: { flex: 1, alignItems: 'center', gap: 5 },
  metricIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: Neutral[100], alignItems: 'center', justifyContent: 'center' },
  metricIconActive: { backgroundColor: TEAL_LIGHT },
  metricValue: { fontFamily: Font.bold, fontSize: 17, color: Neutral[800] },
  metricLabel: { fontFamily: Font.medium, fontSize: 11, color: Neutral[400] },
  statusLine: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: TEAL_LIGHT, padding: Spacing.sm, borderRadius: Radius.sm,
  },
  statusLineText: { fontFamily: Font.medium, fontSize: 12, color: Brand.primaryDark, flex: 1 },

  // ── Earnings ──
  earningsCard: {
    backgroundColor: Neutral.white, borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Neutral[100], ...Shadow.xs,
  },
  earningsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  earningsLabel: { fontFamily: Font.medium, fontSize: 12, color: Neutral[500], marginBottom: 4 },
  earningsAmtRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 1 },
  rupee: { fontFamily: Font.bold, fontSize: 16, color: TEAL, paddingBottom: 2 },
  earningsAmt: { fontFamily: Font.bold, fontSize: 28, color: TEAL, letterSpacing: -0.5 },
  earningsMax: { fontFamily: Font.medium, fontSize: 13, color: Neutral[400], paddingBottom: 4 },
  pctBadge: {
    backgroundColor: TEAL_LIGHT, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full,
  },
  pctText: { fontFamily: Font.bold, fontSize: 14, color: TEAL },
  track: {
    height: 8, backgroundColor: Neutral[100], borderRadius: 4,
    overflow: 'visible', marginBottom: Spacing.sm, position: 'relative',
  },
  fill: { position: 'absolute', left: 0, top: 0, height: '100%', backgroundColor: TEAL, borderRadius: 4 },
  fillDot: {
    position: 'absolute', top: -4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: TEAL, marginLeft: -8,
    borderWidth: 3, borderColor: Neutral.white, ...Shadow.xs,
  },
  earningsMeta: { fontFamily: Font.regular, fontSize: 11, color: Neutral[400] },

  // ── Quick Actions ──
  actionsSection: { marginTop: Spacing.xs },
  sectionLabel: { fontFamily: Font.bold, fontSize: 15, color: Neutral[800], marginBottom: Spacing.md },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: {
    flex: 1, alignItems: 'center', gap: 7,
    backgroundColor: Neutral.white, borderRadius: Radius.lg,
    paddingVertical: Spacing.md, borderWidth: 1, borderColor: Neutral[100], ...Shadow.xs,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: TEAL_LIGHT, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: Font.medium, fontSize: 11, color: Neutral[600], textAlign: 'center' },
});
