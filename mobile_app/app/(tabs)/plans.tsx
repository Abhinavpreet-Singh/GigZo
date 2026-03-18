import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Neutral, Shadow, Radius, Spacing } from '@/constants/theme';
import { mockPlans, mockUser } from '@/services/mockData';
import { useAppStore } from '@/store/useAppStore';

function PlanCard({ plan, isSelected, onSelect }: {
  plan: typeof mockPlans[0];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isPro = plan.id === 'pro';

  if (isPro) {
    return (
      <TouchableOpacity
        style={[styles.planCardDark, isSelected && styles.planCardSelected]}
        onPress={onSelect}
        activeOpacity={0.92}
      >
        {/* Header */}
        <View style={styles.planCardDarkHeader}>
          <View>
            <Text style={styles.planNameDark}>{plan.name}</Text>
            {plan.recommended && (
              <View style={styles.recommendedBadge}>
                <Ionicons name="star" size={10} color={Brand.warning} />
                <Text style={styles.recommendedText}>AI Recommended · {mockUser.zone}</Text>
              </View>
            )}
          </View>
          <View style={[styles.selectCircle, isSelected && styles.selectCircleActive]}>
            {isSelected && <Ionicons name="checkmark" size={14} color={Neutral.white} />}
          </View>
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.currencyDark}>₹</Text>
          <Text style={styles.priceDark}>{plan.price}</Text>
          <Text style={styles.periodDark}>/{plan.period}</Text>
        </View>

        {/* Payout tag */}
        <View style={styles.payoutTagDark}>
          <Ionicons name="shield-checkmark" size={14} color={Brand.primaryLight} />
          <Text style={styles.payoutTagTextDark}>₹{plan.payoutPerDay} payout per disruption day</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresWrap}>
          {plan.features.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Ionicons name="checkmark" size={14} color={Brand.primaryLight} />
              <Text style={styles.featureTextDark}>{f}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.planCardLight, isSelected && styles.planCardLightSelected]}
      onPress={onSelect}
      activeOpacity={0.92}
    >
      <View style={styles.planCardHeader}>
        <Text style={styles.planNameLight}>{plan.name}</Text>
        <View style={[styles.selectCircle, { borderColor: Neutral[300] }, isSelected && styles.selectCircleActive]}>
          {isSelected && <Ionicons name="checkmark" size={14} color={Neutral.white} />}
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={[styles.currencyDark, { color: Neutral[800] }]}>₹</Text>
        <Text style={[styles.priceDark, { color: Neutral[900] }]}>{plan.price}</Text>
        <Text style={[styles.periodDark, { color: Neutral[400] }]}>/{plan.period}</Text>
      </View>

      <View style={[styles.payoutTagDark, { backgroundColor: Brand.primaryLight }]}>
        <Ionicons name="shield-checkmark" size={14} color={Brand.primary} />
        <Text style={[styles.payoutTagTextDark, { color: Brand.primary }]}>₹{plan.payoutPerDay} payout per disruption day</Text>
      </View>

      <View style={styles.featuresWrap}>
        {plan.features.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Ionicons name="checkmark" size={14} color={Brand.primary} />
            <Text style={styles.featureTextLight}>{f}</Text>
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
      Alert.alert('Select a Plan', 'Please select a plan before activating.');
      return;
    }
    Alert.alert('Plan Activated!', `Your ${selectedPlan === 'pro' ? 'Pro' : 'Basic'} plan has been activated. You are now protected.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Coverage Plans</Text>
          <Text style={styles.headerSub}>AI-tailored premium based on your zone's environmental risk</Text>
        </View>

        {/* Zone badge */}
        <View style={styles.zoneBadgeRow}>
          <View style={styles.zoneBadge}>
            <Ionicons name="hardware-chip-outline" size={13} color={Brand.primary} />
            <Text style={styles.zoneBadgeText}>{mockUser.zone}</Text>
            <Text style={[styles.zoneBadgeText, { color: Brand.danger }]}>· HIGH risk</Text>
            <Text style={[styles.zoneBadgeText, { color: Brand.primary, fontWeight: '700' }]}>· Pro recommended</Text>
          </View>
        </View>

        {/* Plan cards */}
        {mockPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSelected={selectedPlan === plan.id}
            onSelect={() => setSelectedPlan(plan.id as 'basic' | 'pro')}
          />
        ))}

        {/* Activate CTA */}
        <TouchableOpacity style={styles.activateBtn} onPress={handleActivate} activeOpacity={0.88}>
          <Ionicons name="shield-checkmark" size={20} color={Neutral.white} />
          <Text style={styles.activateBtnText}>Activate Plan</Text>
        </TouchableOpacity>

        {/* Trust note */}
        <View style={styles.trustNote}>
          <Ionicons name="lock-closed-outline" size={14} color={Neutral[400]} />
          <Text style={styles.trustText}>Powered by AI risk scoring · Instant payout guarantee</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral[50] },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Neutral[100],
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: Neutral[900], letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: Neutral[500], marginTop: 4, lineHeight: 18 },

  zoneBadgeRow: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, backgroundColor: Neutral.white },
  zoneBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Brand.primaryLight,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.full, alignSelf: 'flex-start',
  },
  zoneBadgeText: { fontSize: 12, fontWeight: '600', color: Neutral[700] },

  // Plan cards
  planCardLight: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    backgroundColor: Neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: Neutral[200],
    ...Shadow.sm,
  },
  planCardLightSelected: { borderColor: Brand.primary },
  planCardDark: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    backgroundColor: Brand.primary,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadow.md,
  },
  planCardSelected: { borderWidth: 2.5, borderColor: Brand.primaryLight },
  planCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  planCardDarkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },

  planNameLight: { fontSize: 20, fontWeight: '700', color: Neutral[900] },
  planNameDark: { fontSize: 20, fontWeight: '700', color: Neutral.white },

  recommendedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 4,
  },
  recommendedText: { fontSize: 11, color: Brand.warning, fontWeight: '600' },

  selectCircle: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  selectCircleActive: { backgroundColor: Brand.success, borderColor: Brand.success },

  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginBottom: Spacing.md },
  currencyDark: { fontSize: 20, fontWeight: '700', color: Neutral.white, paddingBottom: 4 },
  priceDark: { fontSize: 44, fontWeight: '800', color: Neutral.white, lineHeight: 52 },
  periodDark: { fontSize: 16, color: 'rgba(255,255,255,0.6)', paddingBottom: 6, fontWeight: '500' },

  payoutTagDark: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: Spacing.sm, borderRadius: Radius.sm,
    marginBottom: Spacing.lg,
  },
  payoutTagTextDark: { fontSize: 13, fontWeight: '600', color: Neutral.white },

  featuresWrap: { gap: Spacing.xs },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureTextDark: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  featureTextLight: { fontSize: 13, color: Neutral[600], fontWeight: '500' },

  activateBtn: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    backgroundColor: Brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    borderRadius: Radius.lg,
    ...Shadow.md,
  },
  activateBtnText: { fontSize: 16, fontWeight: '700', color: Neutral.white },

  trustNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    justifyContent: 'center', marginTop: Spacing.md,
  },
  trustText: { fontSize: 11, color: Neutral[400], fontWeight: '500' },
});
