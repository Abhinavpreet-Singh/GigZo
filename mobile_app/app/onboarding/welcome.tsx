import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Neutral, Shadow, Radius, Spacing } from '@/constants/theme';

const { height } = Dimensions.get('window');

const FEATURES = [
  { icon: 'flash-outline', color: Brand.warning, bg: '#fef3c7', label: 'Auto Claims', sub: 'No forms, no waiting' },
  { icon: 'rainy-outline', color: Brand.rain, bg: '#eff6ff', label: 'Weather Triggered', sub: 'Rain, AQI, Flood covered' },
  { icon: 'cash-outline', color: Brand.success, bg: '#dcfce7', label: 'Instant Payout', sub: 'Money in < 2 hours' },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top illustration area */}
      <View style={styles.heroSection}>
        {/* Shield icon as hero */}
        <View style={styles.shieldWrap}>
          <View style={styles.shieldOuter}>
            <View style={styles.shieldInner}>
              <Ionicons name="shield-checkmark" size={56} color={Neutral.white} />
            </View>
          </View>
          {/* Floating badges */}
          <View style={[styles.floatBadge, styles.floatBadge1]}>
            <Ionicons name="rainy" size={14} color={Brand.rain} />
            <Text style={styles.floatBadgeText}>62mm</Text>
          </View>
          <View style={[styles.floatBadge, styles.floatBadge2]}>
            <Ionicons name="flash" size={14} color={Brand.success} />
            <Text style={styles.floatBadgeText}>₹500 paid</Text>
          </View>
          <View style={[styles.floatBadge, styles.floatBadge3]}>
            <Ionicons name="leaf" size={14} color={Brand.aqi} />
            <Text style={styles.floatBadgeText}>AQI 385</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Brand */}
        <View style={styles.brandRow}>
          <Text style={styles.brandName}>GigZo</Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>

        <Text style={styles.headline}>Protect Your{'\n'}Daily Earnings</Text>
        <Text style={styles.subText}>
          Get paid when rain, pollution, or curfew stops your work.{'\n'}
          Automatic payouts — no claims needed.
        </Text>

        {/* Feature chips */}
        <View style={styles.featuresRow}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureChip}>
              <View style={[styles.featureChipIcon, { backgroundColor: f.bg }]}>
                <Ionicons name={f.icon as any} size={16} color={f.color} />
              </View>
              <View>
                <Text style={styles.featureChipLabel}>{f.label}</Text>
                <Text style={styles.featureChipSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => router.push('/onboarding/otp')}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaBtnText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={18} color={Neutral.white} />
        </TouchableOpacity>

        <Text style={styles.ctaNote}>Join 50,000+ gig workers already protected</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral.white },

  heroSection: {
    height: height * 0.38,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldWrap: { alignItems: 'center', justifyContent: 'center' },
  shieldOuter: {
    width: 128, height: 128, borderRadius: 64,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  shieldInner: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  floatBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Neutral.white,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: Radius.full,
    ...Shadow.md,
  },
  floatBadge1: { top: -10, left: -80 },
  floatBadge2: { bottom: -10, right: -80 },
  floatBadge3: { top: 40, right: -90 },
  floatBadgeText: { fontSize: 12, fontWeight: '700', color: Neutral[700] },

  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.xs },
  brandName: { fontSize: 18, fontWeight: '800', color: Brand.primary },
  aiBadge: {
    backgroundColor: Brand.primaryLight,
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: Radius.full,
  },
  aiBadgeText: { fontSize: 11, fontWeight: '700', color: Brand.primary },

  headline: {
    fontSize: 34,
    fontWeight: '800',
    color: Neutral[900],
    letterSpacing: -0.8,
    lineHeight: 40,
    marginBottom: Spacing.md,
  },
  subText: {
    fontSize: 14,
    color: Neutral[500],
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },

  featuresRow: { gap: Spacing.sm, marginBottom: Spacing.xl },
  featureChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Neutral[50],
    padding: Spacing.md, borderRadius: Radius.lg,
  },
  featureChipIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featureChipLabel: { fontSize: 13, fontWeight: '700', color: Neutral[800] },
  featureChipSub: { fontSize: 11, color: Neutral[400], marginTop: 1 },

  ctaBtn: {
    backgroundColor: Brand.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '700', color: Neutral.white },
  ctaNote: { textAlign: 'center', fontSize: 12, color: Neutral[400] },
});
