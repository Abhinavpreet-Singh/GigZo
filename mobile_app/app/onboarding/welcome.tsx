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
import { Brand, Neutral, Shadow, Radius, Spacing, Font } from '@/constants/theme';

const { height } = Dimensions.get('window');

const FEATURES = [
  { icon: 'flash-outline', color: Brand.warning, bg: Brand.warningLight, label: 'Auto Payouts', sub: 'No forms, no manual claims' },
  { icon: 'rainy-outline', color: Brand.rain, bg: Brand.rainLight, label: 'Event-Triggered', sub: 'Rain, AQI, and flood covered' },
  { icon: 'cash-outline', color: Brand.success, bg: Brand.successLight, label: 'Instant Transfer', sub: 'Payout within 2 hours' },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>GigZo AI</Text>
        </View>
        <View style={styles.shieldRing}>
          <View style={styles.shieldInner}>
            <Ionicons name="shield-checkmark" size={52} color={Neutral.white} />
          </View>
        </View>
        {/* Floating chips */}
        <View style={[styles.chip, styles.chip1]}>
          <Ionicons name="rainy" size={12} color={Brand.rain} />
          <Text style={styles.chipText}>62mm Rain</Text>
        </View>
        <View style={[styles.chip, styles.chip2]}>
          <Ionicons name="checkmark-circle" size={12} color={Brand.success} />
          <Text style={styles.chipText}>Payout sent</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.headline}>Protect Your{'\n'}Daily Earnings</Text>
        <Text style={styles.sub}>
          Automatic income protection for gig delivery workers. Get paid when disruptions stop your work.
        </Text>

        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
                <Ionicons name={f.icon as any} size={16} color={f.color} />
              </View>
              <View>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.cta} onPress={() => router.push('/onboarding/otp')} activeOpacity={0.88}>
          <Text style={styles.ctaText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={17} color={Neutral.white} />
        </TouchableOpacity>
        <Text style={styles.ctaNote}>Join 50,000+ gig workers already protected</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral.white },
  hero: {
    height: height * 0.38,
    backgroundColor: Brand.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: Radius.full,
  },
  badgeText: { fontFamily: Font.bold, fontSize: 12, color: Neutral.white, letterSpacing: 0.5 },
  shieldRing: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  shieldInner: {
    width: 92, height: 92, borderRadius: 46,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  chip: {
    position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Neutral.white, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: Radius.full, ...Shadow.sm,
  },
  chip1: { top: 40, left: 24 },
  chip2: { bottom: 30, right: 24 },
  chipText: { fontFamily: Font.semiBold, fontSize: 11, color: Neutral[700] },

  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl },
  headline: { fontFamily: Font.bold, fontSize: 32, color: Neutral[900], letterSpacing: -0.6, lineHeight: 40, marginBottom: Spacing.md },
  sub: { fontFamily: Font.regular, fontSize: 14, color: Neutral[500], lineHeight: 22, marginBottom: Spacing.xl },

  featureList: { gap: Spacing.sm, marginBottom: Spacing.xl },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Neutral[50], padding: Spacing.md, borderRadius: Radius.lg },
  featureIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featureLabel: { fontFamily: Font.semiBold, fontSize: 13, color: Neutral[800] },
  featureSub: { fontFamily: Font.regular, fontSize: 11, color: Neutral[400], marginTop: 1 },

  cta: {
    backgroundColor: Brand.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 16, borderRadius: Radius.lg, marginBottom: Spacing.md, ...Shadow.md,
  },
  ctaText: { fontFamily: Font.bold, fontSize: 16, color: Neutral.white },
  ctaNote: { fontFamily: Font.regular, fontSize: 12, color: Neutral[400], textAlign: 'center' },
});
