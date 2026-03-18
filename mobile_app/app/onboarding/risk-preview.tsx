import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Neutral, Shadow, Radius, Spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

const RISK_FACTORS = [
  { icon: 'rainy-outline', label: 'Frequent Rainfall Area', color: Brand.rain, bg: '#eff6ff' },
  { icon: 'leaf-outline', label: 'High AQI Zone', color: Brand.aqi, bg: '#fffbeb' },
  { icon: 'water-outline', label: 'Flood-prone Sector', color: Brand.flood, bg: '#f5f3ff' },
];

export default function RiskPreviewScreen() {
  const router = useRouter();
  const { setOnboarded } = useAppStore();

  const handleSeePlans = () => {
    setOnboarded(true);
    router.replace('/(tabs)/plans');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={Neutral[700]} />
      </TouchableOpacity>

      {/* Step indicator */}
      <View style={styles.stepRow}>
        {[1, 2, 3, 4].map((s) => (
          <View key={s} style={[styles.stepDot, { backgroundColor: Brand.primary }]} />
        ))}
      </View>

      <View style={styles.content}>
        <Text style={styles.label2}>YOUR ZONE ANALYSIS</Text>
        <Text style={styles.title}>Your Zone Risk</Text>

        {/* Big risk badge */}
        <View style={styles.riskCard}>
          <View style={styles.riskScoreCircle}>
            <Text style={styles.riskScoreText}>82</Text>
            <Text style={styles.riskScoreLabel}>Risk Score</Text>
          </View>
          <View style={styles.riskCardRight}>
            <View style={styles.highRiskBadge}>
              <View style={styles.riskDot} />
              <Text style={styles.highRiskText}>HIGH RISK 🔴</Text>
            </View>
            <Text style={styles.riskZone}>Sector 35</Text>
            <Text style={styles.riskCity}>Chandigarh</Text>
          </View>
        </View>

        {/* Risk factors */}
        <View style={styles.factorsCard}>
          {RISK_FACTORS.map((f, idx) => (
            <View key={f.label}>
              <View style={styles.factorRow}>
                <View style={[styles.factorIcon, { backgroundColor: f.bg }]}>
                  <Ionicons name={f.icon as any} size={18} color={f.color} />
                </View>
                <Text style={styles.factorLabel}>{f.label}</Text>
                <Ionicons name="checkmark-circle" size={18} color={f.color} />
              </View>
              {idx < RISK_FACTORS.length - 1 && <View style={styles.factorDivider} />}
            </View>
          ))}
        </View>

        {/* Income loss estimate */}
        <View style={styles.incomeLossCard}>
          <Ionicons name="trending-down" size={20} color={Brand.danger} />
          <View style={{ flex: 1 }}>
            <Text style={styles.incomeLossTitle}>Avg Income Loss</Text>
            <Text style={styles.incomeLossValue}>₹1,200 <Text style={styles.incomeLossPeriod}>/ month</Text></Text>
          </View>
          <View style={styles.protectedTag}>
            <Text style={styles.protectedTagText}>GigZo covers this</Text>
          </View>
        </View>
      </View>

      {/* CTA */}
      <View style={styles.ctaSection}>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleSeePlans} activeOpacity={0.88}>
          <Ionicons name="shield-checkmark-outline" size={20} color={Neutral.white} />
          <Text style={styles.ctaBtnText}>See Plans for My Zone</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral.white },
  back: { padding: Spacing.xl },
  stepRow: { flexDirection: 'row', gap: 6, paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  stepDot: { height: 4, flex: 1, borderRadius: 2 },

  content: { flex: 1, paddingHorizontal: Spacing.xl },
  label2: { fontSize: 11, fontWeight: '700', color: Brand.primary, letterSpacing: 1.2, marginBottom: 6 },
  title: { fontSize: 28, fontWeight: '800', color: Neutral[900], letterSpacing: -0.5, marginBottom: Spacing.xl },

  riskCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xl,
    backgroundColor: Brand.dangerLight,
    borderRadius: Radius.xl, padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Brand.danger + '30',
  },
  riskScoreCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Brand.danger,
    alignItems: 'center', justifyContent: 'center',
  },
  riskScoreText: { fontSize: 26, fontWeight: '800', color: Neutral.white },
  riskScoreLabel: { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 0.3 },
  riskCardRight: { flex: 1 },
  highRiskBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  riskDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Brand.danger },
  highRiskText: { fontSize: 14, fontWeight: '800', color: Brand.danger },
  riskZone: { fontSize: 20, fontWeight: '700', color: Neutral[800] },
  riskCity: { fontSize: 13, color: Neutral[500], marginTop: 2 },

  factorsCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xl, padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  factorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  factorIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  factorLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Neutral[700] },
  factorDivider: { height: 1, backgroundColor: Neutral[100] },

  incomeLossCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Brand.dangerLight,
    borderRadius: Radius.lg, padding: Spacing.lg,
  },
  incomeLossTitle: { fontSize: 12, color: Neutral[500], fontWeight: '500' },
  incomeLossValue: { fontSize: 20, fontWeight: '800', color: Brand.danger },
  incomeLossPeriod: { fontSize: 13, fontWeight: '500', color: Neutral[400] },
  protectedTag: { backgroundColor: Brand.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full },
  protectedTagText: { fontSize: 11, fontWeight: '700', color: Brand.primary },

  ctaSection: { padding: Spacing.xl, paddingBottom: Spacing.xl },
  ctaBtn: {
    backgroundColor: Brand.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 16, borderRadius: Radius.lg,
    ...Shadow.md,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '700', color: Neutral.white },
});
