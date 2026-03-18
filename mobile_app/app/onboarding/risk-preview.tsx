import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Neutral, Radius, Spacing, Font, Shadow } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

const FACTORS = [
  { icon: 'rainy-outline', label: 'Frequent Rainfall Zone', color: Brand.rain, bg: Brand.rainLight },
  { icon: 'leaf-outline', label: 'High Air Pollution Index', color: Brand.aqi, bg: Brand.aqiLight },
  { icon: 'water-outline', label: 'Flood-Prone Sector', color: Brand.flood, bg: Brand.floodLight },
];

export default function RiskPreviewScreen() {
  const router = useRouter();
  const { setOnboarded } = useAppStore();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={Neutral[700]} />
      </TouchableOpacity>

      {/* Step bar — all complete */}
      <View style={styles.stepRow}>
        {[1, 2, 3, 4].map((s) => (
          <View key={s} style={[styles.step, styles.stepActive]} />
        ))}
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>STEP 4 OF 4 — ZONE ANALYSIS</Text>
        <Text style={styles.title}>Your Risk Profile</Text>

        {/* Score card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNum}>82</Text>
            <Text style={styles.scoreLabel}>Risk Score</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.highBadge}>
              <View style={styles.highDot} />
              <Text style={styles.highText}>HIGH RISK</Text>
            </View>
            <Text style={styles.zoneName}>Sector 35</Text>
            <Text style={styles.cityName}>Chandigarh</Text>
          </View>
        </View>

        {/* Risk factors */}
        <View style={styles.factorsCard}>
          {FACTORS.map((f, idx) => (
            <View key={f.label}>
              <View style={styles.factorRow}>
                <View style={[styles.factorIcon, { backgroundColor: f.bg }]}>
                  <Ionicons name={f.icon as any} size={16} color={f.color} />
                </View>
                <Text style={styles.factorLabel}>{f.label}</Text>
                <Ionicons name="checkmark-circle" size={16} color={f.color} />
              </View>
              {idx < FACTORS.length - 1 && <View style={styles.sep} />}
            </View>
          ))}
        </View>

        {/* Income loss */}
        <View style={styles.incomeCard}>
          <View>
            <Text style={styles.incomeTitle}>Estimated Monthly Income Risk</Text>
            <Text style={styles.incomeValue}>₹1,200</Text>
          </View>
          <View style={styles.coveredTag}>
            <Text style={styles.coveredText}>GigZo covers this</Text>
          </View>
        </View>
      </View>

      {/* CTA */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={styles.cta}
          onPress={() => { setOnboarded(true); router.replace('/(tabs)/plans'); }}
        >
          <Text style={styles.ctaText}>See Plans for My Zone</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral.white },
  back: { padding: Spacing.xl },
  stepRow: { flexDirection: 'row', gap: 6, paddingHorizontal: Spacing.xl, marginBottom: Spacing.xxl },
  step: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Neutral[100] },
  stepActive: { backgroundColor: Brand.primary },
  content: { flex: 1, paddingHorizontal: Spacing.xl },
  label: { fontFamily: Font.bold, fontSize: 10, color: Brand.primary, letterSpacing: 1.2, marginBottom: Spacing.sm },
  title: { fontFamily: Font.bold, fontSize: 28, color: Neutral[900], letterSpacing: -0.4, marginBottom: Spacing.xl },

  scoreCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xl,
    backgroundColor: Brand.dangerLight, borderRadius: Radius.xl,
    padding: Spacing.xl, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Brand.danger + '25',
  },
  scoreCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: Brand.danger, alignItems: 'center', justifyContent: 'center',
  },
  scoreNum: { fontFamily: Font.bold, fontSize: 26, color: Neutral.white },
  scoreLabel: { fontFamily: Font.regular, fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.3 },
  highBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: Spacing.sm },
  highDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Brand.danger },
  highText: { fontFamily: Font.bold, fontSize: 13, color: Brand.danger, letterSpacing: 0.3 },
  zoneName: { fontFamily: Font.bold, fontSize: 20, color: Neutral[800] },
  cityName: { fontFamily: Font.regular, fontSize: 13, color: Neutral[500], marginTop: 2 },

  factorsCard: {
    backgroundColor: Neutral.white, borderRadius: Radius.xl, padding: Spacing.lg,
    marginBottom: Spacing.lg, borderWidth: 1, borderColor: Neutral[100], ...Shadow.xs,
  },
  factorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  factorIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  factorLabel: { flex: 1, fontFamily: Font.medium, fontSize: 14, color: Neutral[700] },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: Neutral[100] },

  incomeCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Brand.dangerLight, borderRadius: Radius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Brand.danger + '25',
  },
  incomeTitle: { fontFamily: Font.regular, fontSize: 12, color: Neutral[500] },
  incomeValue: { fontFamily: Font.bold, fontSize: 22, color: Brand.danger, marginTop: 2 },
  coveredTag: { backgroundColor: Brand.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  coveredText: { fontFamily: Font.semiBold, fontSize: 11, color: Brand.primary },

  ctaSection: { padding: Spacing.xl },
  cta: { backgroundColor: Brand.primary, alignItems: 'center', paddingVertical: 16, borderRadius: Radius.lg, ...Shadow.md },
  ctaText: { fontFamily: Font.bold, fontSize: 16, color: Neutral.white },
});
